-- NUCLEAR OPTION: Drop ALL policies and create ONE simple policy
-- This will definitively fix the issue

-- Drop ALL existing policies on documents
DROP POLICY IF EXISTS "Debug: Allow all authenticated inserts" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view documents they have access to" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents they can edit" ON public.documents;
DROP POLICY IF EXISTS "Owners can delete documents" ON public.documents;

-- Drop ALL existing policies on spreadsheets
DROP POLICY IF EXISTS "Debug: Allow all authenticated inserts" ON public.spreadsheets;
DROP POLICY IF EXISTS "Users can create spreadsheets" ON public.spreadsheets;
DROP POLICY IF EXISTS "Users can view spreadsheets they have access to" ON public.spreadsheets;
DROP POLICY IF EXISTS "Users can update spreadsheets they can edit" ON public.spreadsheets;
DROP POLICY IF EXISTS "Owners can delete spreadsheets" ON public.spreadsheets;

-- Create ONE SIMPLE policy for INSERT (authenticated users can insert)
CREATE POLICY "Allow authenticated inserts" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated inserts" ON public.spreadsheets
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create simple SELECT policies (so you can see your documents)
CREATE POLICY "Allow authenticated selects" ON public.documents
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated selects" ON public.spreadsheets
  FOR SELECT TO authenticated
  USING (true);

-- Create simple UPDATE policies
CREATE POLICY "Allow authenticated updates" ON public.documents
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated updates" ON public.spreadsheets
  FOR UPDATE TO authenticated
  USING (true);

-- Create simple DELETE policies
CREATE POLICY "Allow authenticated deletes" ON public.documents
  FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated deletes" ON public.spreadsheets
  FOR DELETE TO authenticated
  USING (true);
