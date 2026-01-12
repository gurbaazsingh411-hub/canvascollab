-- Fix foreign key relationships to point to profiles instead of auth.users
-- This allows PostgREST to properly join tables w/ select=*,profiles:owner_id(...)

-- 1. Update documents table
ALTER TABLE public.documents
  DROP CONSTRAINT documents_owner_id_fkey,
  ADD CONSTRAINT documents_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- 2. Update spreadsheets table
ALTER TABLE public.spreadsheets
  DROP CONSTRAINT spreadsheets_owner_id_fkey,
  ADD CONSTRAINT spreadsheets_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
