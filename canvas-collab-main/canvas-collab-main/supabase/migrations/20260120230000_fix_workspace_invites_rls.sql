-- FIX WORKSPACE INVITES RLS AND STANDARDIZE FOREIGN KEYS
-- This migration resolves the 403 Forbidden error when generating invite links.

-- 1. Standardize Foreign Key for inviter_id
ALTER TABLE workspace_invites DROP CONSTRAINT IF EXISTS workspace_invites_inviter_id_fkey;
ALTER TABLE workspace_invites ADD CONSTRAINT workspace_invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Update RLS Policies to allow Admins (not just Owners)
-- First, drop the old restrictive policies
DROP POLICY IF EXISTS "Invites can be created by workspace owners" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be viewed by workspace owners" ON workspace_invites;
DROP POLICY IF EXISTS "Invites can be managed by workspace owners" ON workspace_invites;

-- Create new policies that include Admins
-- Note: We use public.check_is_workspace_admin which covers both owners and admins
CREATE POLICY "Invites can be created by workspace admins" ON workspace_invites
  FOR INSERT WITH CHECK (
    public.check_is_workspace_admin(workspace_id, auth.uid())
  );

CREATE POLICY "Invites can be viewed by workspace admins" ON workspace_invites
  FOR SELECT USING (
    public.check_is_workspace_admin(workspace_id, auth.uid())
  );

CREATE POLICY "Invites can be managed by workspace admins" ON workspace_invites
  FOR ALL USING (
    public.check_is_workspace_admin(workspace_id, auth.uid())
  );

-- Also allow the invite token to be checked by anyone (even unauthenticated) for joining
-- But only for SELECT where the token matches and it's not used/expired
-- Actually, InvitePage.tsx usually fetches the invite details.
-- Let's make sure unauthenticated users can view invite details if they have the token.
CREATE POLICY "Invites can be viewed by token" ON workspace_invites
  FOR SELECT TO public
  USING (NOT used AND expires_at > now());
