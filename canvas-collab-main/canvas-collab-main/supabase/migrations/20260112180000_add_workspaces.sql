-- Create workspaces table
CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create workspace_members table
CREATE TABLE workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

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

-- Add workspace_id to documents and spreadsheets
ALTER TABLE documents ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE spreadsheets ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_documents_workspace ON documents(workspace_id);
CREATE INDEX idx_spreadsheets_workspace ON spreadsheets(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);

-- UPDATE RLS for Documents
-- Drop existing policies (we need to redefine them to include workspace owners)
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- New Document Policies
-- View: Creator OR Shared OR (Workspace Owner AND in Workspace)
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
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
    -- No restrictions on workspace creation for now, frontend handles assigning valid workspace_id
  );

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


-- UPDATE RLS for Spreadsheets
DROP POLICY IF EXISTS "Users can view their own spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can create their own spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can update their own spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can delete their own spreadsheets" ON spreadsheets;

-- New Spreadsheet Policies
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
