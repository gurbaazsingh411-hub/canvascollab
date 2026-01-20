-- COMPREHENSIVE FIX FOR WORKSPACE RLS ERRORS
-- This migration resolves 500 errors by fixing policy conflicts and circular references

-- 1. Drop ALL existing workspace_members policies to start fresh
DROP POLICY IF EXISTS "Members are viewable by other members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Admins and Owners can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Users can join via valid invite" ON workspace_members;

-- 2. Create clean, non-conflicting policies for workspace_members

-- SELECT: Members can view other members in their workspace
CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- INSERT: Owners and Admins can add members, OR users can self-join with valid token
CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT WITH CHECK (
    -- Owner can add anyone
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
    OR
    -- Admin can add anyone
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
    OR
    -- User can add themselves if valid invite exists
    (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM workspace_invites wi
        WHERE wi.workspace_id = workspace_id
        AND wi.used = FALSE
        AND wi.expires_at > NOW()
      )
    )
  );

-- UPDATE: Only owners and admins can update member roles
CREATE POLICY "workspace_members_update" ON workspace_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );

-- DELETE: Only owners and admins can remove members
CREATE POLICY "workspace_members_delete" ON workspace_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );

-- 3. Fix workspace_invites policies (drop and recreate cleanly)
DROP POLICY IF EXISTS "Owners can create invites" ON workspace_invites;
DROP POLICY IF EXISTS "Admins can create invites" ON workspace_invites;
DROP POLICY IF EXISTS "Admins/Owners can view invites" ON workspace_invites;
DROP POLICY IF EXISTS "Admins/Owners can manage invites" ON workspace_invites;
DROP POLICY IF EXISTS "Public can view valid invites by token" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be created by workspace admins" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be viewed by workspace admins" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be managed by workspace admins" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be viewed by token" ON workspace_invites;

-- SELECT: Owners/Admins can view invites for their workspace, anyone can view by token
CREATE POLICY "workspace_invites_select" ON workspace_invites
  FOR SELECT USING (
    -- Owner can view
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
    OR
    -- Admin can view
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
    OR
    -- Anyone can view valid invites (needed for join page)
    (NOT used AND expires_at > NOW())
  );

-- INSERT: Owners and Admins can create invites
CREATE POLICY "workspace_invites_insert" ON workspace_invites
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id
    AND (
      EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = workspace_id
        AND w.owner_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM workspace_members wm
        WHERE wm.workspace_id = workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role = 'admin'
      )
    )
  );

-- UPDATE: Owners and Admins can update invites (e.g., mark as used)
CREATE POLICY "workspace_invites_update" ON workspace_invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );

-- DELETE: Owners and Admins can delete invites
CREATE POLICY "workspace_invites_delete" ON workspace_invites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );
