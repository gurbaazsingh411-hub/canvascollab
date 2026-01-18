-- ==========================================
-- FIX: WORKSPACE OWNER FOREIGN KEY
-- ==========================================

-- PostgREST join (profiles:owner_id) requires a direct FK to profiles.
-- The current FK points to auth.users, which blocks the join to public.profiles.

ALTER TABLE public.workspaces 
DROP CONSTRAINT IF EXISTS workspaces_owner_id_fkey;

ALTER TABLE public.workspaces 
ADD CONSTRAINT workspaces_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Also fix documents and spreadsheets if they have the same issue
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_owner_id_fkey;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

ALTER TABLE public.spreadsheets 
DROP CONSTRAINT IF EXISTS spreadsheets_owner_id_fkey;

ALTER TABLE public.spreadsheets 
ADD CONSTRAINT spreadsheets_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
