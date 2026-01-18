-- Create user_activity table for real-time tracking and time spent
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  file_id UUID NOT NULL, -- UUID of document or spreadsheet
  file_type TEXT NOT NULL, -- 'document' or 'spreadsheet'
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  total_seconds_spent INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(user_id, file_id)
);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Functions to check roles (if not already defined in previous migrations)
-- Using SECURITY DEFINER to avoid recursion
CREATE OR REPLACE FUNCTION public.check_is_workspace_admin(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = _workspace_id 
    AND user_id = _user_id 
    AND (role = 'admin' OR role = 'owner')
  ) OR EXISTS (
    SELECT 1 FROM workspaces WHERE id = _workspace_id AND owner_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for user_activity
CREATE POLICY "Users can view activity in their workspace" ON user_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = user_activity.workspace_id 
      AND user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = user_activity.workspace_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert/update their own activity" ON user_activity
  FOR ALL USING (auth.uid() = user_id);

-- Add real-time
ALTER TABLE user_activity REPLICA IDENTITY FULL;
