-- Role-Based File Visibility
-- Owner/Admin can see all files in the workspace.
-- Regular Members can only see files they created OR files shared with them.

-- 1. Drop existing SELECT policies
DROP POLICY IF EXISTS "Documents selective access" ON public.documents;
DROP POLICY IF EXISTS "Spreadsheets selective access" ON public.spreadsheets;

-- 2. Create new role-based SELECT policy for Documents
CREATE POLICY "Documents role-based access" ON public.documents
  FOR SELECT TO authenticated
  USING (
    -- I own this file
    auth.uid() = owner_id 
    OR 
    -- This file was shared with me via document_permissions
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.document_id = documents.id
      AND dp.user_id = auth.uid()
    ) 
    OR 
    -- I am an Owner or Admin of this workspace (can see all files)
    (
      workspace_id IS NOT NULL 
      AND (
        public.user_is_workspace_owner(workspace_id, auth.uid())
        OR
        public.user_is_workspace_admin(workspace_id, auth.uid())
      )
    )
  );

-- 3. Create new role-based SELECT policy for Spreadsheets
CREATE POLICY "Spreadsheets role-based access" ON public.spreadsheets
  FOR SELECT TO authenticated
  USING (
    -- I own this file
    auth.uid() = owner_id 
    OR 
    -- This file was shared with me (adjust column if needed)
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.spreadsheet_id = spreadsheets.id
      AND dp.user_id = auth.uid()
    ) 
    OR 
    -- I am an Owner or Admin of this workspace (can see all files)
    (
      workspace_id IS NOT NULL 
      AND (
        public.user_is_workspace_owner(workspace_id, auth.uid())
        OR
        public.user_is_workspace_admin(workspace_id, auth.uid())
      )
    )
  );
