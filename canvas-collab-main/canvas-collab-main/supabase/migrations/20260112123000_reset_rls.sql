-- Reset RLS policies for creation to ensure they are correct

DROP POLICY IF EXISTS "Users can create documents" ON public.documents;

CREATE POLICY "Users can create documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create spreadsheets" ON public.spreadsheets;

CREATE POLICY "Users can create spreadsheets" ON public.spreadsheets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
