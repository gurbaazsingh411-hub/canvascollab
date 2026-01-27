-- DEFINITIVE FIX: Workspace File Visibility
-- This migration ensures that Workspace Owners, Admins, and Members can see all files in their workspace.

-- 1. Redefine Document SELECT Policy
DROP POLICY IF EXISTS "Documents selective access" ON public.documents;
CREATE POLICY "Documents selective access" ON public.documents
  FOR SELECT TO authenticated
  USING (
    -- Owner of the document
    auth.uid() = owner_id 
    OR 
    -- Explicitly granted permissions
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.document_id = documents.id
      AND dp.user_id = auth.uid()
    ) 
    OR 
    -- Workspace access (Owner, Admin, or Member)
    (
      workspace_id IS NOT NULL 
      AND (
        -- Directly check if owner of workspace (to bypass workspace_members check)
        EXISTS (SELECT 1 FROM workspaces WHERE id = documents.workspace_id AND owner_id = auth.uid())
        OR
        -- Check if member of workspace (Admins & Regular Members)
        public.user_is_workspace_member(workspace_id, auth.uid())
      )
    )
  );

-- 2. Redefine Spreadsheet SELECT Policy
DROP POLICY IF EXISTS "Spreadsheets selective access" ON public.spreadsheets;
CREATE POLICY "Spreadsheets selective access" ON public.spreadsheets
  FOR SELECT TO authenticated
  USING (
    -- Owner of the spreadsheet
    auth.uid() = owner_id 
    OR 
    -- Explicitly granted permissions
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.spreadsheet_id = spreadsheets.id
      AND dp.user_id = auth.uid()
    ) 
    OR 
    -- Workspace access (Owner, Admin, or Member)
    (
      workspace_id IS NOT NULL 
      AND (
        EXISTS (SELECT 1 FROM workspaces WHERE id = spreadsheets.workspace_id AND owner_id = auth.uid())
        OR
        public.user_is_workspace_member(workspace_id, auth.uid())
      )
    )
  );

-- 3. Ensure User Activity is also visible to Admins/Owners
DROP POLICY IF EXISTS "Users can view activity in their workspace" ON user_activity;
CREATE POLICY "Users can view activity in their workspace" ON user_activity
  FOR SELECT TO authenticated
  USING (
    public.user_is_workspace_owner(workspace_id, auth.uid())
    OR
    public.user_is_workspace_member(workspace_id, auth.uid())
  );
