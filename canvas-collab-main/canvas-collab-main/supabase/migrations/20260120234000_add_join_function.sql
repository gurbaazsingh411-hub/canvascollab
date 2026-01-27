-- SECURE WORKSPACE JOIN FUNCTION
-- This migration adds a security definer function to handle workspace joins via invite tokens.
-- This bypasses restrictive RLS on workspace_members while ensuring token validity.

CREATE OR REPLACE FUNCTION join_workspace_with_token(token_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invite_record RECORD;
    workspace_record RECORD;
    new_member_record RECORD;
    current_user_id UUID;
BEGIN
    -- 1. Get the current user ID
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Find the invite
    SELECT * INTO invite_record
    FROM workspace_invites
    WHERE invite_token = token_text
    FOR UPDATE;

    -- 3. Validate existence
    IF invite_record IS NULL THEN
        RAISE EXCEPTION 'Invalid invite link (token not found)';
    END IF;

    -- 4. Check if used
    IF invite_record.used = TRUE THEN
        RAISE EXCEPTION 'This invite link has already been used';
    END IF;

    -- 5. Check expiry
    IF invite_record.expires_at < NOW() THEN
        RAISE EXCEPTION 'This invite link has expired';
    END IF;

    -- 6. Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = invite_record.workspace_id 
        AND user_id = current_user_id
    ) THEN
        RAISE EXCEPTION 'You are already a member of this workspace';
    END IF;

    -- 7. Get workspace details
    SELECT * INTO workspace_record
    FROM workspaces
    WHERE id = invite_record.workspace_id;

    -- 8. Add the user to the workspace
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (invite_record.workspace_id, current_user_id, invite_record.role)
    RETURNING * INTO new_member_record;

    -- 9. Mark invite as used
    UPDATE workspace_invites
    SET used = TRUE
    WHERE id = invite_record.id;

    -- 10. Return success with details
    RETURN json_build_object(
        'success', TRUE,
        'workspace_id', invite_record.workspace_id,
        'role', invite_record.role,
        'workspace', json_build_object(
            'name', workspace_record.name
        )
    );
END;
$$;
