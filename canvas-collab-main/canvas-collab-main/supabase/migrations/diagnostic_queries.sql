-- DIAGNOSTIC QUERIES - Run these in Supabase SQL Editor to diagnose the issue

-- 1. Check if the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table IN ('documents', 'spreadsheets');

-- 2. Check current RLS policies on documents table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('documents', 'spreadsheets');

-- 3. Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('documents', 'spreadsheets');

-- 4. Check if profiles table has data (users exist)
SELECT COUNT(*) as user_count FROM public.profiles;

-- 5. Test if you can manually insert (replace 'YOUR_USER_ID' with actual ID from auth.users)
-- First, get your user ID:
SELECT id, email FROM auth.users LIMIT 5;
