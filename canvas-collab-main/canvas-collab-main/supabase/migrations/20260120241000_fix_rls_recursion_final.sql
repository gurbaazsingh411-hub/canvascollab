-- FINAL FIX: Break RLS Recursion with SECURITY DEFINER Functions
-- This migration uses helper functions to avoid infinite recursion in workspace_members policies

-- 1. Create helper functions with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.user_is_workspace_owner(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces
    WHERE id = workspace_uuid
    AND owner_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_workspace_admin(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid
    AND user_id = user_uuid
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_workspace_member(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid
    AND user_id = user_uuid
  );
$$;

-- 2. Drop all existing workspace_members policies
DROP POLICY IF EXISTS "Members are viewable by other members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Admins and Owners can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Users can join via valid invite" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_select" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON workspace_members;

-- 3. Create new policies using helper functions (NO RECURSION)
CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (
    public.user_is_workspace_owner(workspace_id, auth.uid())
    OR
    public.user_is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT WITH CHECK (
    public.user_is_workspace_owner(workspace_id, auth.uid())
    OR
    public.user_is_workspace_admin(workspace_id, auth.uid())
    OR
    (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM workspace_invites
        WHERE workspace_id = workspace_members.workspace_id
        AND used = FALSE
        AND expires_at > NOW()
      )
    )
  );

CREATE POLICY "workspace_members_update" ON workspace_members
  FOR UPDATE USING (
    public.user_is_workspace_owner(workspace_id, auth.uid())
    OR
    public.user_is_workspace_admin(workspace_id, auth.uid())
  );

CREATE POLICY "workspace_members_delete" ON workspace_members
  FOR DELETE USING (
    public.user_is_workspace_owner(workspace_id, auth.uid())
    OR
    public.user_is_workspace_admin(workspace_id, auth.uid())
  );

-- 4. Update workspace_invites policies to use helper functions
DROP POLICY IF EXISTS "workspace_invites_select" ON workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_insert" ON workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_update" ON workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_delete" ON workspace_invites;

CREATE POLICY "workspace_invites_select" ON workspace_invites
  FOR SELECT USING (
    public.user_is_workspace_owner(workspace_id, auth.uid())
    OR
    public.user_is_workspace_admin(workspace_id, auth.uid())
    OR
    (NOT used AND expires_at > NOW())
  );

CREATE POLICY "workspace_invites_insert" ON workspace_invites
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id
    AND (
      public.user_is_workspace_owner(workspace_id, auth.uid())
      OR
      public.user_is_workspace_admin(workspace_id, auth.uid())
    )
  );

CREATE POLICY "workspace_invites_update" ON workspace_invites
  FOR UPDATE USING (
    public.user_is_workspace_owner(workspace_id, auth.uid())
    OR
    public.user_is_workspace_admin(workspace_id, auth.uid())
  );

CREATE POLICY "workspace_invites_delete" ON workspace_invites
  FOR DELETE USING (
    public.user_is_workspace_owner(workspace_id, auth.uid())
    OR
    public.user_is_workspace_admin(workspace_id, auth.uid())
  );
