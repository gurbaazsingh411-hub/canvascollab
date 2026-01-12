-- Add version history for documents and spreadsheets

-- Document versions table
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  title TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spreadsheet versions table
CREATE TABLE IF NOT EXISTS public.spreadsheet_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id UUID REFERENCES public.spreadsheets(id) ON DELETE CASCADE,
  cells JSONB NOT NULL,
  title TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view versions of accessible documents" ON public.document_versions;
DROP POLICY IF EXISTS "Users can create versions of accessible documents" ON public.document_versions;
DROP POLICY IF EXISTS "Users can view versions of accessible spreadsheets" ON public.spreadsheet_versions;
DROP POLICY IF EXISTS "Users can create versions of accessible spreadsheets" ON public.spreadsheet_versions;

-- RLS Policies for document_versions
CREATE POLICY "Users can view versions of accessible documents" ON public.document_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND public.has_document_access(auth.uid(), d.id)
    )
  );

CREATE POLICY "Users can create versions of accessible documents" ON public.document_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND public.has_document_access(auth.uid(), d.id)
    )
  );

-- RLS Policies for spreadsheet_versions
CREATE POLICY "Users can view versions of accessible spreadsheets" ON public.spreadsheet_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.spreadsheets s
      WHERE s.id = spreadsheet_id
      AND public.has_spreadsheet_access(auth.uid(), s.id)
    )
  );

CREATE POLICY "Users can create versions of accessible spreadsheets" ON public.spreadsheet_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.spreadsheets s
      WHERE s.id = spreadsheet_id
      AND public.has_spreadsheet_access(auth.uid(), s.id)
    )
  );

-- Create indexes for performance
DROP INDEX IF EXISTS public.idx_doc_versions_document;
DROP INDEX IF EXISTS public.idx_doc_versions_created_at;
DROP INDEX IF EXISTS public.idx_sheet_versions_spreadsheet;
DROP INDEX IF EXISTS public.idx_sheet_versions_created_at;

CREATE INDEX idx_doc_versions_document ON public.document_versions(document_id);
CREATE INDEX idx_doc_versions_created_at ON public.document_versions(created_at DESC);
CREATE INDEX idx_sheet_versions_spreadsheet ON public.spreadsheet_versions(spreadsheet_id);
CREATE INDEX idx_sheet_versions_created_at ON public.spreadsheet_versions(created_at DESC);

-- Function to auto-create version snapshot on document update
CREATE OR REPLACE FUNCTION public.create_document_version_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create snapshot if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO public.document_versions (document_id, content, title, created_by)
    VALUES (OLD.id, OLD.content, OLD.title, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create version snapshot on spreadsheet update
CREATE OR REPLACE FUNCTION public.create_spreadsheet_version_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Create snapshot on spreadsheet update
  INSERT INTO public.spreadsheet_versions (spreadsheet_id, cells, title, created_by)
  SELECT 
    OLD.id,
    jsonb_agg(jsonb_build_object(
      'row', row_index,
      'col', col_index,
      'value', value,
      'formula', formula
    )),
    OLD.title,
    auth.uid()
  FROM public.spreadsheet_cells
  WHERE spreadsheet_id = OLD.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS document_version_snapshot_trigger ON public.documents;
DROP TRIGGER IF EXISTS spreadsheet_version_snapshot_trigger ON public.spreadsheets;

-- Trigger to auto-create version on document update
CREATE TRIGGER document_version_snapshot_trigger
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.create_document_version_snapshot();

-- Trigger to auto-create version on spreadsheet update
CREATE TRIGGER spreadsheet_version_snapshot_trigger
  BEFORE UPDATE ON public.spreadsheets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_spreadsheet_version_snapshot();
