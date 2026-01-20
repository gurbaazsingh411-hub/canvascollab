-- MEGA-FIX FOR WORKSPACE INVITES RLS
-- This migration replaces the function-based RLS with direct table checks to be more robust.

-- 1. Drop all existing invite policies to start fresh
DROP POLICY IF EXISTS "Invites can be created by workspace owners" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be created by workspace admins" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be viewed by workspace owners" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be viewed by workspace admins" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be managed by workspace owners" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be managed by workspace admins" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be viewed by token" ON workspace_invites;
DROP POLICY IF EXISTS "Everyone can select valid invites" ON workspace_invites;

-- 2. CREATE: Allow Workspace Owners to create invites
CREATE POLICY "Owners can create invites" ON workspace_invites 
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = workspace_id AND owner_id = auth.uid()
    )
  );

-- 3. CREATE: Allow Workspace Admins to create invites
CREATE POLICY "Admins can create invites" ON workspace_invites 
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = workspace_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. READ: Allow Owners/Admins to see invites for their workspaces
CREATE POLICY "Admins/Owners can view invites" ON workspace_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = workspace_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = workspace_id AND user_id = auth.uid() AND (role = 'admin' OR role = 'owner')
    )
  );

-- 5. DELETE/UPDATE: Allow Owners/Admins to manage invites
CREATE POLICY "Admins/Owners can manage invites" ON workspace_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = workspace_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = workspace_id AND user_id = auth.uid() AND (role = 'admin' OR role = 'owner')
    )
  );

-- 6. PUBLIC READ: Allow unauthenticated users to join via token
-- This is critical for the InvitePage to work
CREATE POLICY "Public can view valid invites by token" ON workspace_invites
  FOR SELECT TO public
  USING (NOT used AND expires_at > now());
