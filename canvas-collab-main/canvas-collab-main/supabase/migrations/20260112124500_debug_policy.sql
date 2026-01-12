-- TEMPORARY DEBUGGING POLICY
-- This allows any authenticated user to insert documents.
-- If this works, we know the issue is specifically the 'auth.uid() = owner_id' check.

DROP POLICY IF EXISTS "Users can create documents" ON public.documents;

CREATE POLICY "Debug: Allow all authenticated inserts" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (true);
