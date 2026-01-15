-- Create workspace_invites table
CREATE TABLE workspace_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invite_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) + interval '7 days' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- Invite Policies
CREATE POLICY "Invites can be created by workspace owners" ON workspace_invites
  FOR INSERT WITH CHECK (
    exists (
      select 1 from workspaces w
      where w.id = workspace_invites.workspace_id
      and w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Invites can be viewed by workspace owners" ON workspace_invites
  FOR SELECT USING (
    exists (
      select 1 from workspaces w
      where w.id = workspace_invites.workspace_id
      and w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Invites can be managed by workspace owners" ON workspace_invites
  FOR ALL USING (
    exists (
      select 1 from workspaces w
      where w.id = workspace_invites.workspace_id
      and w.owner_id = auth.uid()
    )
  );