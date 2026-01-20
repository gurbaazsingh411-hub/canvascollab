-- FIX WORKSPACE MEMBERS RLS
-- This migration allows Admins to manage members and users to join via tokens.

-- 1. Drop the restrictive "Owners Only" policy
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;

-- 2. Allow Owners and Admins to manage members
-- We use direct checks for better performance and reliability
CREATE POLICY "Admins and Owners can manage members" ON workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = workspace_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = workspace_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Allow users to "self-join" if a valid invite token exists for the workspace
-- This is a secondary layer to support direct INSERTs if the RPC isn't used,
-- though the RPC is preferred.
CREATE POLICY "Users can join via valid invite" ON workspace_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM workspace_invites
      WHERE workspace_id = workspace_members.workspace_id
      AND used = FALSE
      AND expires_at > NOW()
    )
  );
