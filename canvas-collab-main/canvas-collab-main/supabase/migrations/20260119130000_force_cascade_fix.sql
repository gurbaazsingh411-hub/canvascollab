-- ========================================================
-- BRUTE FORCE FIX: RESOLVE PROFILE DELETION ERRORS
-- Run this to fix the specific error with document_versions
-- ========================================================

-- 1. Fix the specific constraint mentioned in your error
ALTER TABLE public.document_versions 
DROP CONSTRAINT IF EXISTS document_versions_created_by_fkey;

ALTER TABLE public.document_versions 
ADD CONSTRAINT document_versions_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 2. Fix the spreadsheet equivalent (to prevent the next error)
ALTER TABLE public.spreadsheet_versions 
DROP CONSTRAINT IF EXISTS spreadsheet_versions_created_by_fkey;

ALTER TABLE public.spreadsheet_versions 
ADD CONSTRAINT spreadsheet_versions_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 3. Fix the workspaces table (this usually blocks deletion too)
ALTER TABLE public.workspaces 
DROP CONSTRAINT IF EXISTS workspaces_owner_id_fkey;

ALTER TABLE public.workspaces 
ADD CONSTRAINT workspaces_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 4. Verify the change (Run this to check if it's now CASCADE)
-- If 'confdeltype' is 'c', it means CASCADE.
SELECT conname, confdeltype 
FROM pg_constraint 
WHERE conname IN ('document_versions_created_by_fkey', 'spreadsheet_versions_created_by_fkey', 'workspaces_owner_id_fkey');
