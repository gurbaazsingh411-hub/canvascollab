-- ============================================================
-- COMPREHENSIVE SHARING FIX
-- Fixes "Access Denied" when opening a shared document/spreadsheet.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- STEP 1: Redefine helper functions (SECURITY DEFINER bypasses RLS inside them)
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_document_access(_user_id UUID, _document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents WHERE id = _document_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.document_permissions
    WHERE document_id = _document_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _document_id
      AND d.workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(d.workspace_id, _user_id)
        OR public.user_is_workspace_admin(d.workspace_id, _user_id)
        OR public.user_is_workspace_member(d.workspace_id, _user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_edit_document(_user_id UUID, _document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents WHERE id = _document_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.document_permissions
    WHERE document_id = _document_id
      AND user_id = _user_id
      AND role IN ('owner', 'editor')
  ) OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _document_id
      AND d.workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(d.workspace_id, _user_id)
        OR public.user_is_workspace_admin(d.workspace_id, _user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_spreadsheet_access(_user_id UUID, _spreadsheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.spreadsheets WHERE id = _spreadsheet_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.document_permissions
    WHERE spreadsheet_id = _spreadsheet_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.spreadsheets s
    WHERE s.id = _spreadsheet_id
      AND s.workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(s.workspace_id, _user_id)
        OR public.user_is_workspace_admin(s.workspace_id, _user_id)
        OR public.user_is_workspace_member(s.workspace_id, _user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_edit_spreadsheet(_user_id UUID, _spreadsheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.spreadsheets WHERE id = _spreadsheet_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.document_permissions
    WHERE spreadsheet_id = _spreadsheet_id
      AND user_id = _user_id
      AND role IN ('owner', 'editor')
  ) OR EXISTS (
    SELECT 1 FROM public.spreadsheets s
    WHERE s.id = _spreadsheet_id
      AND s.workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(s.workspace_id, _user_id)
        OR public.user_is_workspace_admin(s.workspace_id, _user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_document_permissions(_user_id UUID, _document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents WHERE id = _document_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _document_id
      AND d.workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(d.workspace_id, _user_id)
        OR public.user_is_workspace_admin(d.workspace_id, _user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_spreadsheet_permissions(_user_id UUID, _spreadsheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.spreadsheets WHERE id = _spreadsheet_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.spreadsheets s
    WHERE s.id = _spreadsheet_id
      AND s.workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(s.workspace_id, _user_id)
        OR public.user_is_workspace_admin(s.workspace_id, _user_id)
      )
  )
$$;

-- STEP 2: Drop ALL possible SELECT policies on documents (by every known name)
-- ============================================================
DROP POLICY IF EXISTS "Documents selective access" ON public.documents;
DROP POLICY IF EXISTS "Documents role-based access" ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view accessible documents" ON public.documents;
DROP POLICY IF EXISTS "documents_select" ON public.documents;

-- STEP 3: Create the unified, correct SELECT policy for documents
-- ============================================================
CREATE POLICY "Documents selective access" ON public.documents
  FOR SELECT TO authenticated
  USING (
    -- Document owner
    auth.uid() = owner_id
    OR
    -- Explicitly invited via document_permissions
    EXISTS (
      SELECT 1 FROM public.document_permissions dp
      WHERE dp.document_id = documents.id
        AND dp.user_id = auth.uid()
    )
    OR
    -- Any workspace member (owner, admin, or regular member)
    (
      workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(workspace_id, auth.uid())
        OR public.user_is_workspace_admin(workspace_id, auth.uid())
        OR public.user_is_workspace_member(workspace_id, auth.uid())
      )
    )
  );

-- STEP 4: Drop ALL possible SELECT policies on spreadsheets
-- ============================================================
DROP POLICY IF EXISTS "Spreadsheets selective access" ON public.spreadsheets;
DROP POLICY IF EXISTS "Spreadsheets role-based access" ON public.spreadsheets;
DROP POLICY IF EXISTS "Users can view own spreadsheets" ON public.spreadsheets;
DROP POLICY IF EXISTS "Users can view accessible spreadsheets" ON public.spreadsheets;
DROP POLICY IF EXISTS "spreadsheets_select" ON public.spreadsheets;

-- STEP 5: Create the unified, correct SELECT policy for spreadsheets
-- ============================================================
CREATE POLICY "Spreadsheets selective access" ON public.spreadsheets
  FOR SELECT TO authenticated
  USING (
    -- Spreadsheet owner
    auth.uid() = owner_id
    OR
    -- Explicitly invited via document_permissions
    EXISTS (
      SELECT 1 FROM public.document_permissions dp
      WHERE dp.spreadsheet_id = spreadsheets.id
        AND dp.user_id = auth.uid()
    )
    OR
    -- Any workspace member
    (
      workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(workspace_id, auth.uid())
        OR public.user_is_workspace_admin(workspace_id, auth.uid())
        OR public.user_is_workspace_member(workspace_id, auth.uid())
      )
    )
  );

-- STEP 6: Fix document_permissions SELECT policy so collaborators can see each other
-- ============================================================
DROP POLICY IF EXISTS "Users can view permissions for their docs/sheets" ON public.document_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "document_permissions_select" ON public.document_permissions;

CREATE POLICY "Users can view permissions for their docs/sheets" ON public.document_permissions
  FOR SELECT TO authenticated
  USING (
    (document_id IS NOT NULL AND public.has_document_access(auth.uid(), document_id))
    OR
    (spreadsheet_id IS NOT NULL AND public.has_spreadsheet_access(auth.uid(), spreadsheet_id))
  );

-- STEP 7: Fix document_permissions INSERT/UPDATE/DELETE policies
-- ============================================================
DROP POLICY IF EXISTS "Owners can manage document permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Owners can update permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Owners can delete permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Document owners can manage permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "document_permissions_insert" ON public.document_permissions;
DROP POLICY IF EXISTS "document_permissions_update" ON public.document_permissions;
DROP POLICY IF EXISTS "document_permissions_delete" ON public.document_permissions;

CREATE POLICY "Owners can manage document permissions" ON public.document_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (document_id IS NOT NULL AND public.can_manage_document_permissions(auth.uid(), document_id))
    OR
    (spreadsheet_id IS NOT NULL AND public.can_manage_spreadsheet_permissions(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Owners can update permissions" ON public.document_permissions
  FOR UPDATE TO authenticated
  USING (
    (document_id IS NOT NULL AND public.can_manage_document_permissions(auth.uid(), document_id))
    OR
    (spreadsheet_id IS NOT NULL AND public.can_manage_spreadsheet_permissions(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Owners can delete permissions" ON public.document_permissions
  FOR DELETE TO authenticated
  USING (
    (document_id IS NOT NULL AND public.can_manage_document_permissions(auth.uid(), document_id))
    OR
    (spreadsheet_id IS NOT NULL AND public.can_manage_spreadsheet_permissions(auth.uid(), spreadsheet_id))
  );

-- DONE
-- ============================================================
-- Shared documents and spreadsheets should now be accessible
-- to all explicitly invited collaborators and workspace members.
-- ============================================================
