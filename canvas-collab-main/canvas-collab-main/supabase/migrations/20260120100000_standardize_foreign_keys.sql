-- 0. Backfill profiles for existing users who might have been created without a profile
INSERT INTO public.profiles (id, email, display_name)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Standardize foreign keys to point to public.profiles instead of auth.users
-- This allows PostgREST (Supabase JS) to perform joins between tables and profiles

-- 1. workspaces table
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_owner_id_fkey;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. workspace_members table
ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;
ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. documents table
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_owner_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. spreadsheets table
ALTER TABLE spreadsheets DROP CONSTRAINT IF EXISTS spreadsheets_owner_id_fkey;
ALTER TABLE spreadsheets ADD CONSTRAINT spreadsheets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. document_permissions table
ALTER TABLE document_permissions DROP CONSTRAINT IF EXISTS document_permissions_user_id_fkey;
ALTER TABLE document_permissions ADD CONSTRAINT document_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. user_activity table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity') THEN
        ALTER TABLE user_activity DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;
        ALTER TABLE user_activity ADD CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. spreadsheet_cells table
ALTER TABLE spreadsheet_cells DROP CONSTRAINT IF EXISTS spreadsheet_cells_updated_by_fkey;
ALTER TABLE spreadsheet_cells ADD CONSTRAINT spreadsheet_cells_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 8. comments table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
        ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 9. comment_replies table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_replies') THEN
        ALTER TABLE comment_replies DROP CONSTRAINT IF EXISTS comment_replies_user_id_fkey;
        ALTER TABLE comment_replies ADD CONSTRAINT comment_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
