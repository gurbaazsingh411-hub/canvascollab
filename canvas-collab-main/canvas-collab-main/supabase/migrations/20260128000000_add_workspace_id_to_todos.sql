-- Add workspace_id to todos table (idempotent)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_todos_workspace ON todos(workspace_id);

-- Update RLS policies for todos
-- Existing policy: "Users can manage their own todos"

-- Enable SELECT for workspace admins/owners
DROP POLICY IF EXISTS "Admins can view workspace todos" ON todos;
CREATE POLICY "Admins can view workspace todos" ON todos
  FOR SELECT
  USING (
    public.user_is_workspace_owner(workspace_id, auth.uid())
    OR
    public.user_is_workspace_admin(workspace_id, auth.uid())
  );
