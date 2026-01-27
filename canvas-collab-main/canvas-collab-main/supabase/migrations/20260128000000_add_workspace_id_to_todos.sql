-- Add workspace_id to todos table
ALTER TABLE todos ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_todos_workspace ON todos(workspace_id);

-- Update RLS policies for todos
-- Existing policy: "Users can manage their own todos"

-- Enable SELECT for workspace admins/owners
CREATE POLICY "Admins can view workspace todos" ON todos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = todos.workspace_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
    OR
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = todos.workspace_id
      AND owner_id = auth.uid()
    )
  );
