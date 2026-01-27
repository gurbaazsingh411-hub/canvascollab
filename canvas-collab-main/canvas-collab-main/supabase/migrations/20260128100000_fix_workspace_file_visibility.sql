-- FIX: Workspace File Visibility for Admins and Members
-- Current policies "Documents selective access" and "Spreadsheets selective access" 
-- only allow the Workspace OWNER to see all files.

-- 1. Redefine Document Access Policy
DROP POLICY IF EXISTS "Documents selective access" ON public.documents;

CREATE POLICY "Documents selective access" ON public.documents
  FOR SELECT TO authenticated
  USING (
    -- Rule 1: Document Owner
    auth.uid() = owner_id 
    OR 
    -- Rule 2: Explicit permissions
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.document_id = documents.id
      AND dp.user_id = auth.uid()
    ) 
    OR 
    -- Rule 3: Workspace Member/Admin/Owner access
    (
      workspace_id IS NOT NULL 
      AND public.user_is_workspace_member(workspace_id, auth.uid())
    )
  );

-- 2. Redefine Spreadsheet Access Policy
DROP POLICY IF EXISTS "Spreadsheets selective access" ON public.spreadsheets;

CREATE POLICY "Spreadsheets selective access" ON public.spreadsheets
  FOR SELECT TO authenticated
  USING (
    -- Rule 1: Spreadsheet Owner
    auth.uid() = owner_id 
    OR 
    -- Rule 2: Explicit permissions
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.spreadsheet_id = spreadsheets.id
      AND dp.user_id = auth.uid()
    ) 
    OR 
    -- Rule 3: Workspace Member/Admin/Owner access
    (
      workspace_id IS NOT NULL 
      AND public.user_is_workspace_member(workspace_id, auth.uid())
    )
  );

-- 3. Also allow Admins/Owners to DELETE/UPDATE if needed for cleanup
-- Update document update policy
DROP POLICY IF EXISTS "Editors and owners can update documents" ON public.documents;
CREATE POLICY "Editors and owners can update documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id 
    OR 
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.document_id = documents.id
      AND dp.user_id = auth.uid()
      AND dp.role IN ('editor', 'owner')
    )
    OR
    (
      workspace_id IS NOT NULL 
      AND (
        public.user_is_workspace_owner(workspace_id, auth.uid())
        OR public.user_is_workspace_admin(workspace_id, auth.uid())
      )
    )
  );

-- Update spreadsheet update policy
DROP POLICY IF EXISTS "Editors and owners can update spreadsheets" ON public.spreadsheets;
CREATE POLICY "Editors and owners can update spreadsheets" ON public.spreadsheets
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id 
    OR 
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.spreadsheet_id = spreadsheets.id
      AND dp.user_id = auth.uid()
      AND dp.role IN ('editor', 'owner')
    )
    OR
    (
      workspace_id IS NOT NULL 
      AND (
        public.user_is_workspace_owner(workspace_id, auth.uid())
        OR public.user_is_workspace_admin(workspace_id, auth.uid())
      )
    )
  );
