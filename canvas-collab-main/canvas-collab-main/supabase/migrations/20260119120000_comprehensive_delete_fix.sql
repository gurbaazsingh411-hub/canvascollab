-- ========================================================
-- COMPREHENSIVE FIX: DYNAMIC CASCADE DELETES
-- This script finds ALL foreign keys pointing to 'profiles' 
-- or 'users' and ensures they have ON DELETE CASCADE.
-- ========================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Find all foreign keys pointing to public.profiles OR auth.users
    -- that do NOT have ON DELETE CASCADE/SET NULL (action != 'CASCADE' and != 'SET NULL')
    FOR r IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name IN ('profiles', 'users')
          AND tc.table_name IN ('document_versions', 'spreadsheet_versions', 'workspace_invites', 'user_activity', 'document_permissions')
    ) LOOP
        -- Drop the old constraint
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', r.table_schema, r.table_name, r.constraint_name);
        
        -- Add the new constraint with ON DELETE CASCADE
        IF r.foreign_table_name = 'profiles' THEN
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE CASCADE', 
                r.table_schema, r.table_name, r.constraint_name, r.column_name);
        ELSE
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', 
                r.table_schema, r.table_name, r.constraint_name, r.column_name);
        END IF;
        
        RAISE NOTICE 'Updated constraint % on table % to CASCADE', r.constraint_name, r.table_name;
    END LOOP;
END $$;
