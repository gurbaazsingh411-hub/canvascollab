-- ==============================================
-- FIX VERSION CONTROL SYSTEM
-- Corrects triggers, RLS policies, and schema mismatches
-- ==============================================

-- 1. Fix Spreadsheet Version Snapshot Trigger Function
-- The previous version used non-existent row_index/col_index
CREATE OR REPLACE FUNCTION public.create_spreadsheet_version_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Create snapshot before update if the title has changed
  -- Note: Cell updates are handled manually or by a separate trigger if needed,
  -- but for now we focus on the spreadsheet metadata.
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO public.spreadsheet_versions (spreadsheet_id, cells, title, created_by)
    SELECT 
      OLD.id,
      jsonb_agg(jsonb_build_object(
        'cell_key', cell_key,
        'value', value,
        'formula', formula
      )),
      OLD.title,
      auth.uid()
    FROM public.spreadsheet_cells
    WHERE spreadsheet_id = OLD.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure RLS for Manual Saves
-- Authenticated users need to be able to manually insert versions for files they can edit

DROP POLICY IF EXISTS "Users can create versions of accessible documents" ON public.document_versions;
CREATE POLICY "Users can create versions of accessible documents" ON public.document_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    public.can_edit_document(auth.uid(), document_id)
  );

DROP POLICY IF EXISTS "Users can create versions of accessible spreadsheets" ON public.spreadsheet_versions;
CREATE POLICY "Users can create versions of accessible spreadsheets" ON public.spreadsheet_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    public.can_edit_spreadsheet(auth.uid(), spreadsheet_id)
  );

-- 3. Ensure SELECT policies are correct
DROP POLICY IF EXISTS "Users can view versions of accessible documents" ON public.document_versions;
CREATE POLICY "Users can view versions of accessible documents" ON public.document_versions
  FOR SELECT TO authenticated
  USING (public.has_document_access(auth.uid(), document_id));

DROP POLICY IF EXISTS "Users can view versions of accessible spreadsheets" ON public.spreadsheet_versions;
CREATE POLICY "Users can view versions of accessible spreadsheets" ON public.spreadsheet_versions
  FOR SELECT TO authenticated
  USING (public.has_spreadsheet_access(auth.uid(), spreadsheet_id));

-- 4. Fix Document Snapshot Trigger to be less aggressive (optional but recommended)
-- Only snapshot if content significantly changed or after a certain time (handled by frontend mostly)
-- For now, keep it as is but ensure it uses auth.uid() correctly
CREATE OR REPLACE FUNCTION public.create_document_version_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Create snapshot on document content update
  -- We only snapshot if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO public.document_versions (document_id, content, title, created_by)
    VALUES (OLD.id, OLD.content, OLD.title, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fix spreadsheet version table schema if it was missing cells column (check)
-- (Assuming spreadsheet_versions table already exists from previous migrations)
-- Ensure REPLICA IDENTITY FULL for real-time if needed
ALTER TABLE public.document_versions REPLICA IDENTITY FULL;
ALTER TABLE public.spreadsheet_versions REPLICA IDENTITY FULL;
