-- OPTIMIZE DATABASE PERFORMANCE
-- This migration adds missing indexes for foreign keys to resolve Supabase linter "unindexed_foreign_keys" warnings.

-- 1. Document & Spreadsheet Versions
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON public.document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_spreadsheet_versions_created_by ON public.spreadsheet_versions(created_by);

-- 2. Spreadsheet Cells
CREATE INDEX IF NOT EXISTS idx_spreadsheet_cells_updated_by ON public.spreadsheet_cells(updated_by);

-- 3. Workspace Management
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_inviter_id ON public.workspace_invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace_id ON public.workspace_invites(workspace_id);

-- 4. User Activity
CREATE INDEX IF NOT EXISTS idx_user_activity_workspace_id ON public.user_activity(workspace_id);

-- NOTE ABOUT "UNUSED INDEXES":
-- The linter may flag some indexes as "unused" (e.g., owner_id or creator_id).
-- This is common in new databases with low traffic. Do NOT remove these indexes,
-- as they are essential for standard application queries (like listing a user's files).
