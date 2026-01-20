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
    new_member_record RECORD;
    current_user_id UUID;
BEGIN
    -- 1. Get the current user ID
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Find and validate the invite
    SELECT * INTO invite_record
    FROM workspace_invites
    WHERE invite_token = token_text
      AND used = FALSE
      AND expires_at > NOW()
    FOR UPDATE; -- Lock the row to prevent race conditions

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invite link';
    END IF;

    -- 3. Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = invite_record.workspace_id 
        AND user_id = current_user_id
    ) THEN
        RAISE EXCEPTION 'You are already a member of this workspace';
    END IF;

    -- 4. Add the user to the workspace
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (invite_record.workspace_id, current_user_id, invite_record.role)
    RETURNING * INTO new_member_record;

    -- 5. Mark invite as used
    UPDATE workspace_invites
    SET used = TRUE
    WHERE id = invite_record.id;

    -- 6. Return the workspace details or success
    RETURN json_build_object(
        'success', TRUE,
        'workspace_id', invite_record.workspace_id,
        'role', invite_record.role
    );
END;
$$;
