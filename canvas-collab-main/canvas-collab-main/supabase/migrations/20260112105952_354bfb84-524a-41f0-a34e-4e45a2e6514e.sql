-- ==============================================
-- COLLABDOCS DATABASE SCHEMA
-- Documents & Spreadsheets with Real-time Collaboration
-- ==============================================

-- 1. Create enum for document access roles
CREATE TYPE public.document_role AS ENUM ('owner', 'editor', 'viewer');

-- 2. Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB DEFAULT '{}',
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4. Create spreadsheets table
CREATE TABLE public.spreadsheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Spreadsheet',
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on spreadsheets
ALTER TABLE public.spreadsheets ENABLE ROW LEVEL SECURITY;

-- 5. Create spreadsheet_cells table for cell-level real-time sync
CREATE TABLE public.spreadsheet_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id UUID NOT NULL REFERENCES public.spreadsheets(id) ON DELETE CASCADE,
  cell_key TEXT NOT NULL, -- e.g., "A1", "B2"
  value TEXT,
  formula TEXT,
  format JSONB DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(spreadsheet_id, cell_key)
);

-- Enable RLS on spreadsheet_cells
ALTER TABLE public.spreadsheet_cells ENABLE ROW LEVEL SECURITY;

-- 6. Create document_permissions table for sharing
CREATE TABLE public.document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  spreadsheet_id UUID REFERENCES public.spreadsheets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role document_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT doc_or_sheet CHECK (
    (document_id IS NOT NULL AND spreadsheet_id IS NULL) OR
    (document_id IS NULL AND spreadsheet_id IS NOT NULL)
  ),
  UNIQUE(document_id, user_id),
  UNIQUE(spreadsheet_id, user_id)
);

-- Enable RLS on document_permissions
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

-- 7. Create security definer functions to check permissions (avoids RLS recursion)

-- Check if user has access to a document
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
  )
$$;

-- Check if user can edit a document
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
  )
$$;

-- Check if user is document owner
CREATE OR REPLACE FUNCTION public.is_document_owner(_user_id UUID, _document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents WHERE id = _document_id AND owner_id = _user_id
  )
$$;

-- Check if user has access to a spreadsheet
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
  )
$$;

-- Check if user can edit a spreadsheet
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
  )
$$;

-- Check if user is spreadsheet owner
CREATE OR REPLACE FUNCTION public.is_spreadsheet_owner(_user_id UUID, _spreadsheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.spreadsheets WHERE id = _spreadsheet_id AND owner_id = _user_id
  )
$$;

-- 8. RLS Policies for documents

-- Select: Owner or has permission
CREATE POLICY "Users can view documents they have access to" ON public.documents
  FOR SELECT TO authenticated
  USING (public.has_document_access(auth.uid(), id));

-- Insert: Authenticated users can create documents
CREATE POLICY "Users can create documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Update: Owner or editor
CREATE POLICY "Users can update documents they can edit" ON public.documents
  FOR UPDATE TO authenticated
  USING (public.can_edit_document(auth.uid(), id));

-- Delete: Owner only
CREATE POLICY "Owners can delete documents" ON public.documents
  FOR DELETE TO authenticated
  USING (public.is_document_owner(auth.uid(), id));

-- 9. RLS Policies for spreadsheets

CREATE POLICY "Users can view spreadsheets they have access to" ON public.spreadsheets
  FOR SELECT TO authenticated
  USING (public.has_spreadsheet_access(auth.uid(), id));

CREATE POLICY "Users can create spreadsheets" ON public.spreadsheets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update spreadsheets they can edit" ON public.spreadsheets
  FOR UPDATE TO authenticated
  USING (public.can_edit_spreadsheet(auth.uid(), id));

CREATE POLICY "Owners can delete spreadsheets" ON public.spreadsheets
  FOR DELETE TO authenticated
  USING (public.is_spreadsheet_owner(auth.uid(), id));

-- 10. RLS Policies for spreadsheet_cells

CREATE POLICY "Users can view cells of accessible spreadsheets" ON public.spreadsheet_cells
  FOR SELECT TO authenticated
  USING (public.has_spreadsheet_access(auth.uid(), spreadsheet_id));

CREATE POLICY "Editors can insert cells" ON public.spreadsheet_cells
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_spreadsheet(auth.uid(), spreadsheet_id));

CREATE POLICY "Editors can update cells" ON public.spreadsheet_cells
  FOR UPDATE TO authenticated
  USING (public.can_edit_spreadsheet(auth.uid(), spreadsheet_id));

CREATE POLICY "Editors can delete cells" ON public.spreadsheet_cells
  FOR DELETE TO authenticated
  USING (public.can_edit_spreadsheet(auth.uid(), spreadsheet_id));

-- 11. RLS Policies for document_permissions

CREATE POLICY "Users can view permissions for their docs/sheets" ON public.document_permissions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    (document_id IS NOT NULL AND public.is_document_owner(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.is_spreadsheet_owner(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Owners can manage document permissions" ON public.document_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (document_id IS NOT NULL AND public.is_document_owner(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.is_spreadsheet_owner(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Owners can update permissions" ON public.document_permissions
  FOR UPDATE TO authenticated
  USING (
    (document_id IS NOT NULL AND public.is_document_owner(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.is_spreadsheet_owner(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Owners can delete permissions" ON public.document_permissions
  FOR DELETE TO authenticated
  USING (
    (document_id IS NOT NULL AND public.is_document_owner(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.is_spreadsheet_owner(auth.uid(), spreadsheet_id))
  );

-- 12. Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spreadsheets_updated_at
  BEFORE UPDATE ON public.spreadsheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cells_updated_at
  BEFORE UPDATE ON public.spreadsheet_cells
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Enable real-time for collaboration tables
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.spreadsheets REPLICA IDENTITY FULL;
ALTER TABLE public.spreadsheet_cells REPLICA IDENTITY FULL;
ALTER TABLE public.document_permissions REPLICA IDENTITY FULL;

-- 15. Create indexes for performance
CREATE INDEX idx_documents_owner ON public.documents(owner_id);
CREATE INDEX idx_spreadsheets_owner ON public.spreadsheets(owner_id);
CREATE INDEX idx_cells_spreadsheet ON public.spreadsheet_cells(spreadsheet_id);
CREATE INDEX idx_permissions_user ON public.document_permissions(user_id);
CREATE INDEX idx_permissions_document ON public.document_permissions(document_id);
CREATE INDEX idx_permissions_spreadsheet ON public.document_permissions(spreadsheet_id);