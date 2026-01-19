-- HARDEN DATABASE SECURITY
-- This migration resolves the "Function Search Path Mutable" warnings from the Supabase linter.
-- It explicitly sets the search_path for all SECURITY DEFINER functions to prevent search path shadowing.

-- 1. Workspace Membership & Admin Checks
ALTER FUNCTION public.check_is_workspace_admin(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_workspace_member(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_workspace_owner(uuid, uuid) SET search_path = public;

-- 2. Document & Spreadsheet Access
ALTER FUNCTION public.has_document_access(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.can_edit_document(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_document_owner(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.has_spreadsheet_access(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.can_edit_spreadsheet(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_spreadsheet_owner(uuid, uuid) SET search_path = public;

-- 3. Version History Snapshots
ALTER FUNCTION public.create_document_version_snapshot() SET search_path = public;
ALTER FUNCTION public.create_spreadsheet_version_snapshot() SET search_path = public;

-- 4. Utility Functions & Triggers
ALTER FUNCTION public.force_owner_id() SET search_path = public;
ALTER FUNCTION public.cleanup_old_sessions() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 5. Comments & Replies (if any additional functions were added)
-- (No specific security functions found for comments that weren't already covered)

-- NOTE: The "auth_leaked_password_protection" warning is a Supabase dashboard setting.
-- You can enable it under: Authentication -> Providers -> Email -> Password Security.
