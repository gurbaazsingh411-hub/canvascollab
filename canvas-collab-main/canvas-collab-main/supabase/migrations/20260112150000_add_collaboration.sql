-- Add collaboration support for real-time editing sessions

-- Store active editing sessions for presence tracking
CREATE TABLE IF NOT EXISTS public.editing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  spreadsheet_id UUID REFERENCES public.spreadsheets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  cursor_position JSONB,
  last_seen TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT doc_or_sheet_session CHECK (
    (document_id IS NOT NULL AND spreadsheet_id IS NULL) OR
    (document_id IS NULL AND spreadsheet_id IS NOT NULL)
  ),
  UNIQUE(document_id, user_id),
  UNIQUE(spreadsheet_id, user_id)
);

-- Enable RLS
ALTER TABLE public.editing_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view sessions for accessible documents" ON public.editing_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.editing_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.editing_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.editing_sessions;

-- RLS Policies for editing_sessions
CREATE POLICY "Users can view sessions for accessible documents" ON public.editing_sessions
  FOR SELECT TO authenticated
  USING (
    (document_id IS NOT NULL AND public.has_document_access(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.has_spreadsheet_access(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Users can insert their own sessions" ON public.editing_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.editing_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.editing_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for collaboration
ALTER TABLE public.editing_sessions REPLICA IDENTITY FULL;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS public.idx_sessions_document;
DROP INDEX IF EXISTS public.idx_sessions_spreadsheet;
DROP INDEX IF EXISTS public.idx_sessions_user;
DROP INDEX IF EXISTS public.idx_sessions_last_seen;

-- Create indexes for performance
CREATE INDEX idx_sessions_document ON public.editing_sessions(document_id);
CREATE INDEX idx_sessions_spreadsheet ON public.editing_sessions(spreadsheet_id);
CREATE INDEX idx_sessions_user ON public.editing_sessions(user_id);
CREATE INDEX idx_sessions_last_seen ON public.editing_sessions(last_seen);

-- Auto-cleanup old sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.editing_sessions
  WHERE last_seen < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
