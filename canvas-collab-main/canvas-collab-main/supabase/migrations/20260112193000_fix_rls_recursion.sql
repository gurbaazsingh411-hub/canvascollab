-- Fix Infinite Recursion in RLS Policies
-- The previous policies caused a loop: workspaces -> workspace_members -> workspaces -> ...
-- We fix this by using SECURITY DEFINER functions which bypass RLS for their internal queries.

-- 1. Create Helper Functions (SECURITY DEFINER)
-- Checks if a user is a member of a workspace (Bypasses RLS)
CREATE OR REPLACE FUNCTION is_workspace_member(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM workspace_members 
    WHERE workspace_id = _workspace_id 
    AND user_id = _user_id
  );
$$;

-- Checks if a user is the owner of a workspace (Bypasses RLS)
CREATE OR REPLACE FUNCTION is_workspace_owner(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM workspaces 
    WHERE id = _workspace_id 
    AND owner_id = _user_id
  );
$$;

-- 2. Update Workspaces Policy
DROP POLICY IF EXISTS "Workspaces are viewable by members and owner" ON workspaces;

CREATE POLICY "Workspaces are viewable by members and owner" ON workspaces
  FOR SELECT USING (
    auth.uid() = owner_id OR
    is_workspace_member(id, auth.uid())
  );

-- 3. Update Workspace Members Policy
DROP POLICY IF EXISTS "Members are viewable by other members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;

-- Members can view other members in the same workspace
-- AND Owners can view members of their workspaces
CREATE POLICY "Members are viewable by other members and owners" ON workspace_members
  FOR SELECT USING (
    -- User is a member of the workspace
    is_workspace_member(workspace_id, auth.uid()) OR
    -- User is the owner of the workspace
    is_workspace_owner(workspace_id, auth.uid())
  );

-- Owners can manage (insert/update/delete) members
CREATE POLICY "Workspace owners can manage members" ON workspace_members
  FOR ALL USING (
    is_workspace_owner(workspace_id, auth.uid())
  );


-- 4. Update Documents/Spreadsheets policies to use safefunctions too (Optional but safer)
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;

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
      is_workspace_owner(workspace_id, auth.uid())
    )
  );
  -- Note: We only give OWNER full access via workspace for now. 
  -- If we want members to see all workspace files, we'd use is_workspace_member too.
  -- But typically members only see what's shared OR all workspace files? 
  -- Requirement: "other members can only see their own files or files explicitly shared with them"
  -- WAIT! "Owner should have visibility over all files, while other members can only see their own files or files explicitly shared with them."
  -- So members DO NOT get automatic access to all files in workspace. ONLY OWNER DOES.
  -- So simply checking `is_workspace_owner` is correct for the workspace-level access override.

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
      is_workspace_owner(workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can delete documents" ON documents
  FOR DELETE USING (
    auth.uid() = owner_id OR
    (
      workspace_id IS NOT NULL AND
      is_workspace_owner(workspace_id, auth.uid())
    )
  );

-- Spreadsheets
DROP POLICY IF EXISTS "Users can view spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can update spreadsheets" ON spreadsheets;
DROP POLICY IF EXISTS "Users can delete spreadsheets" ON spreadsheets;

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
      is_workspace_owner(workspace_id, auth.uid())
    )
  );

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
      is_workspace_owner(workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can delete spreadsheets" ON spreadsheets
  FOR DELETE USING (
    auth.uid() = owner_id OR
    (
      workspace_id IS NOT NULL AND
      is_workspace_owner(workspace_id, auth.uid())
    )
  );
