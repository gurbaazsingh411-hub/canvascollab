-- ==========================================
-- FIX: CASCADE DELETES FOR PROFILE CLEANUP
-- ==========================================

-- 1. Fix document_versions
ALTER TABLE public.document_versions 
DROP CONSTRAINT IF EXISTS document_versions_created_by_fkey;

ALTER TABLE public.document_versions 
ADD CONSTRAINT document_versions_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 2. Fix spreadsheet_versions
ALTER TABLE public.spreadsheet_versions 
DROP CONSTRAINT IF EXISTS spreadsheet_versions_created_by_fkey;

ALTER TABLE public.spreadsheet_versions 
ADD CONSTRAINT spreadsheet_versions_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 3. Fix document_permissions
ALTER TABLE public.document_permissions 
DROP CONSTRAINT IF EXISTS document_permissions_user_id_fkey;

ALTER TABLE public.document_permissions 
ADD CONSTRAINT document_permissions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 4. Fix user_activity
ALTER TABLE public.user_activity 
DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;

ALTER TABLE public.user_activity 
ADD CONSTRAINT user_activity_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;
