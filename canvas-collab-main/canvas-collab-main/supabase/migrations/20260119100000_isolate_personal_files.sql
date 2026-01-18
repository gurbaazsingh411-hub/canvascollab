-- ==========================================
-- FINAL CLEANUP: ISOLATE PERSONAL WORKSPACES
-- ==========================================

-- 1. Drop ALL existing policies on documents and spreadsheets to avoid "additive" leaks
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('documents', 'spreadsheets')) 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP; 
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheets ENABLE ROW LEVEL SECURITY;

-- 3. DOCUMENTS POLICIES

-- SELECT POLICY
-- Condition A: Personal Files (workspace_id is null) -> Only owner OR explicitly shared
-- Condition B: Workspace Files -> Owner of workspace OR explicitly shared (Not automatically all members)
CREATE POLICY "Documents selective access" ON public.documents
  FOR SELECT TO authenticated
  USING (
    -- Rule 1: Always allow the owner of the document
    auth.uid() = owner_id 
    OR 
    -- Rule 2: Explicit permissions (Shared files)
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.document_id = documents.id
      AND dp.user_id = auth.uid()
    ) 
    OR 
    -- Rule 3: Workspace Owner Override (Can see all files in their workspace)
    (
      workspace_id IS NOT NULL 
      AND public.is_workspace_owner(workspace_id, auth.uid())
    )
  );

-- INSERT POLICY
CREATE POLICY "Authenticated users can create documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE POLICY
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
      AND public.is_workspace_owner(workspace_id, auth.uid())
    )
  );

-- DELETE POLICY
CREATE POLICY "Only owners can delete documents" ON public.documents
  FOR DELETE TO authenticated
  USING (
    auth.uid() = owner_id 
    OR 
    (
      workspace_id IS NOT NULL 
      AND public.is_workspace_owner(workspace_id, auth.uid())
    )
  );


-- 4. SPREADSHEETS POLICIES (Identical Logic)

CREATE POLICY "Spreadsheets selective access" ON public.spreadsheets
  FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id 
    OR 
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.spreadsheet_id = spreadsheets.id
      AND dp.user_id = auth.uid()
    ) 
    OR 
    (
      workspace_id IS NOT NULL 
      AND public.is_workspace_owner(workspace_id, auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create spreadsheets" ON public.spreadsheets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

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
      AND public.is_workspace_owner(workspace_id, auth.uid())
    )
  );

CREATE POLICY "Only owners can delete spreadsheets" ON public.spreadsheets
  FOR DELETE TO authenticated
  USING (
    auth.uid() = owner_id 
    OR 
    (
      workspace_id IS NOT NULL 
      AND public.is_workspace_owner(workspace_id, auth.uid())
    )
  );
