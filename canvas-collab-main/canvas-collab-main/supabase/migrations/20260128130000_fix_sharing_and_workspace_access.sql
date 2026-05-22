-- Migration: Fix sharing, collaborator listing, and workspace admin/owner access
-- Redefines the helper functions to support workspace owners/admins,
-- and recreates document_permissions policies so collaborators can see other peers.

-- 1. Redefine has_document_access
CREATE OR REPLACE FUNCTION public.has_document_access(_user_id UUID, _document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
        OR
        public.user_is_workspace_admin(d.workspace_id, _user_id)
      )
  )
$$;

-- 2. Redefine can_edit_document
CREATE OR REPLACE FUNCTION public.can_edit_document(_user_id UUID, _document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
        OR
        public.user_is_workspace_admin(d.workspace_id, _user_id)
      )
  )
$$;

-- 3. Redefine has_spreadsheet_access
CREATE OR REPLACE FUNCTION public.has_spreadsheet_access(_user_id UUID, _spreadsheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
        OR
        public.user_is_workspace_admin(s.workspace_id, _user_id)
      )
  )
$$;

-- 4. Redefine can_edit_spreadsheet
CREATE OR REPLACE FUNCTION public.can_edit_spreadsheet(_user_id UUID, _spreadsheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
        OR
        public.user_is_workspace_admin(s.workspace_id, _user_id)
      )
  )
$$;

-- 5. Define permission management helper functions
CREATE OR REPLACE FUNCTION public.can_manage_document_permissions(_user_id UUID, _document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents WHERE id = _document_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _document_id
      AND d.workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(d.workspace_id, _user_id)
        OR
        public.user_is_workspace_admin(d.workspace_id, _user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_spreadsheet_permissions(_user_id UUID, _spreadsheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.spreadsheets WHERE id = _spreadsheet_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.spreadsheets s
    WHERE s.id = _spreadsheet_id
      AND s.workspace_id IS NOT NULL
      AND (
        public.user_is_workspace_owner(s.workspace_id, _user_id)
        OR
        public.user_is_workspace_admin(s.workspace_id, _user_id)
      )
  )
$$;

-- 6. Drop existing policies on document_permissions
DROP POLICY IF EXISTS "Users can view permissions for their docs/sheets" ON public.document_permissions;
DROP POLICY IF EXISTS "Owners can manage document permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Owners can update permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Owners can delete permissions" ON public.document_permissions;

-- 7. Create updated policies using helper functions
CREATE POLICY "Users can view permissions for their docs/sheets" ON public.document_permissions
  FOR SELECT TO authenticated
  USING (
    (document_id IS NOT NULL AND public.has_document_access(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.has_spreadsheet_access(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Owners can manage document permissions" ON public.document_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (document_id IS NOT NULL AND public.can_manage_document_permissions(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.can_manage_spreadsheet_permissions(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Owners can update permissions" ON public.document_permissions
  FOR UPDATE TO authenticated
  USING (
    (document_id IS NOT NULL AND public.can_manage_document_permissions(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.can_manage_spreadsheet_permissions(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Owners can delete permissions" ON public.document_permissions
  FOR DELETE TO authenticated
  USING (
    (document_id IS NOT NULL AND public.can_manage_document_permissions(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.can_manage_spreadsheet_permissions(auth.uid(), spreadsheet_id))
  );
