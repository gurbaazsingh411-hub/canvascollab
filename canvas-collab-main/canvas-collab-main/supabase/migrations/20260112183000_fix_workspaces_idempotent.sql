-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- 2. Add columns if they don't exist (using anonymous block for safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'workspace_id') THEN
        ALTER TABLE documents ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spreadsheets' AND column_name = 'workspace_id') THEN
        ALTER TABLE spreadsheets ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create indexes (Drop first to be idempotent)
DROP INDEX IF EXISTS idx_documents_workspace;
CREATE INDEX idx_documents_workspace ON documents(workspace_id);

DROP INDEX IF EXISTS idx_spreadsheets_workspace;
CREATE INDEX idx_spreadsheets_workspace ON spreadsheets(workspace_id);

DROP INDEX IF EXISTS idx_workspace_members_user;
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

DROP INDEX IF EXISTS idx_workspace_members_workspace;
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);


-- 4. Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- 5. Clean up old policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Workspaces are viewable by members and owner" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON workspaces;

DROP POLICY IF EXISTS "Members are viewable by other members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;

DROP POLICY IF EXISTS "Users can view spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can create spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can update spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can delete spreadsheets" ON spreadsheets;

DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can create documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;

-- Also drop the OLD policies if they still exist (from before workspace feature)
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

DROP POLICY IF EXISTS "Users can view their own spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can create their own spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can update their own spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can delete their own spreadsheets" ON spreadsheets;


-- 6. Apply NEW Policies

-- Workspace Policies
CREATE POLICY "Workspaces are viewable by members and owner" ON workspaces
  FOR SELECT USING (
    auth.uid() = owner_id OR
    exists (
      select 1 from workspace_members
      where workspace_id = workspaces.id
      and user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their workspaces" ON workspaces
  FOR UPDATE USING (auth.uid() = owner_id);

-- Workspace Member Policies
CREATE POLICY "Members are viewable by other members" ON workspace_members
  FOR SELECT USING (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
    ) OR
    exists (
      select 1 from workspaces w
      where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage members" ON workspace_members
  FOR ALL USING (
    exists (
      select 1 from workspaces w
      where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
    )
  );

-- Document Policies
CREATE POLICY "Users can view documents" ON documents
  FOR SELECT USING (
    auth.uid() = owner_id OR
    exists (
      select 1 from document_permissions dp
      where dp.document_id = documents.id
      and dp.user_id = auth.uid()
    ) OR
    (
      workspace_id IS NOT NULL AND
      exists (
        select 1 from workspaces w
        where w.id = documents.workspace_id
        and w.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update documents" ON documents
  FOR UPDATE USING (
    auth.uid() = owner_id OR
    exists (
      select 1 from document_permissions dp
      where dp.document_id = documents.id
      and dp.user_id = auth.uid()
      and dp.role IN ('editor', 'owner')
    ) OR
    (
      workspace_id IS NOT NULL AND
      exists (
        select 1 from workspaces w
        where w.id = documents.workspace_id
        and w.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete documents" ON documents
  FOR DELETE USING (
    auth.uid() = owner_id OR
    (
      workspace_id IS NOT NULL AND
      exists (
        select 1 from workspaces w
        where w.id = documents.workspace_id
        and w.owner_id = auth.uid()
      )
    )
  );

-- Spreadsheet Policies
CREATE POLICY "Users can view spreadsheets" ON spreadsheets
  FOR SELECT USING (
    auth.uid() = owner_id OR
    exists (
      select 1 from document_permissions dp
      where dp.spreadsheet_id = spreadsheets.id
      and dp.user_id = auth.uid()
    ) OR
    (
      workspace_id IS NOT NULL AND
      exists (
        select 1 from workspaces w
        where w.id = spreadsheets.workspace_id
        and w.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create spreadsheets" ON spreadsheets
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update spreadsheets" ON spreadsheets
  FOR UPDATE USING (
    auth.uid() = owner_id OR
    exists (
      select 1 from document_permissions dp
      where dp.spreadsheet_id = spreadsheets.id
      and dp.user_id = auth.uid()
      and dp.role IN ('editor', 'owner')
    ) OR
    (
      workspace_id IS NOT NULL AND
      exists (
        select 1 from workspaces w
        where w.id = spreadsheets.workspace_id
        and w.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete spreadsheets" ON spreadsheets
  FOR DELETE USING (
    auth.uid() = owner_id OR
    (
      workspace_id IS NOT NULL AND
      exists (
        select 1 from workspaces w
        where w.id = spreadsheets.workspace_id
        and w.owner_id = auth.uid()
      )
    )
  );
