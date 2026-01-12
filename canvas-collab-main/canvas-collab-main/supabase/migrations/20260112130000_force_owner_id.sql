-- Force owner_id to match the authenticated user on insert
-- This ensures RLS policies (auth.uid() = owner_id) always pass.

CREATE OR REPLACE FUNCTION public.force_owner_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for documents
DROP TRIGGER IF EXISTS ensure_document_owner ON public.documents;
CREATE TRIGGER ensure_document_owner
  BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.force_owner_id();

-- Trigger for spreadsheets
DROP TRIGGER IF EXISTS ensure_spreadsheet_owner ON public.spreadsheets;
CREATE TRIGGER ensure_spreadsheet_owner
  BEFORE INSERT ON public.spreadsheets
  FOR EACH ROW EXECUTE FUNCTION public.force_owner_id();
