-- Add comments system for documents and spreadsheets

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  spreadsheet_id UUID REFERENCES public.spreadsheets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position JSONB, -- Store cursor position/selection for inline comments
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT doc_or_sheet_comment CHECK (
    (document_id IS NOT NULL AND spreadsheet_id IS NULL) OR
    (document_id IS NULL AND spreadsheet_id IS NOT NULL)
  )
);

-- Comment replies table
CREATE TABLE IF NOT EXISTS public.comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Users can view comments on accessible documents" ON public.comments
  FOR SELECT TO authenticated
  USING (
    (document_id IS NOT NULL AND public.has_document_access(auth.uid(), document_id)) OR
    (spreadsheet_id IS NOT NULL AND public.has_spreadsheet_access(auth.uid(), spreadsheet_id))
  );

CREATE POLICY "Users can create comments on accessible documents" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      (document_id IS NOT NULL AND public.has_document_access(auth.uid(), document_id)) OR
      (spreadsheet_id IS NOT NULL AND public.has_spreadsheet_access(auth.uid(), spreadsheet_id))
    )
  );

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for comment replies
CREATE POLICY "Users can view replies on accessible comments" ON public.comment_replies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.comments c
      WHERE c.id = comment_id
      AND (
        (c.document_id IS NOT NULL AND public.has_document_access(auth.uid(), c.document_id)) OR
        (c.spreadsheet_id IS NOT NULL AND public.has_spreadsheet_access(auth.uid(), c.spreadsheet_id))
      )
    )
  );

CREATE POLICY "Users can create replies on accessible comments" ON public.comment_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.comments c
      WHERE c.id = comment_id
      AND (
        (c.document_id IS NOT NULL AND public.has_document_access(auth.uid(), c.document_id)) OR
        (c.spreadsheet_id IS NOT NULL AND public.has_spreadsheet_access(auth.uid(), c.spreadsheet_id))
      )
    )
  );

CREATE POLICY "Users can update their own replies" ON public.comment_replies
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" ON public.comment_replies
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.comment_replies REPLICA IDENTITY FULL;

-- Create indexes
CREATE INDEX idx_comments_document ON public.comments(document_id);
CREATE INDEX idx_comments_spreadsheet ON public.comments(spreadsheet_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_resolved ON public.comments(resolved);
CREATE INDEX idx_replies_comment ON public.comment_replies(comment_id);
CREATE INDEX idx_replies_user ON public.comment_replies(user_id);

-- Auto-update timestamps
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
