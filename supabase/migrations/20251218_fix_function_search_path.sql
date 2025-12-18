-- ============================================================================
-- FIX FUNCTION SEARCH_PATH SECURITY ISSUE
-- ============================================================================
-- Problem: Functions without explicit search_path are vulnerable to:
-- - Privilege escalation attacks
-- - Dependency on role settings
-- - Accidental object resolution from attacker-controlled schemas
--
-- Solution: Add SET search_path = public, pg_catalog to all functions
-- This ensures only public and core PostgreSQL objects are visible
-- ============================================================================

-- ============================================================================
-- 1. FIX update_updated_at_column() FUNCTION
-- ============================================================================
-- Used by: patterns, diagnostic_sessions, saved_reports tables

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers that use this function
DROP TRIGGER IF EXISTS update_patterns_updated_at ON patterns;
CREATE TRIGGER update_patterns_updated_at
  BEFORE UPDATE ON patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diagnostic_sessions_updated_at ON diagnostic_sessions;
CREATE TRIGGER update_diagnostic_sessions_updated_at
  BEFORE UPDATE ON diagnostic_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_reports_updated_at ON saved_reports;
CREATE TRIGGER update_saved_reports_updated_at
  BEFORE UPDATE ON saved_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. FIX handle_action_item_updated_at() FUNCTION
-- ============================================================================
-- Used by: action_item_progress table

DROP FUNCTION IF EXISTS public.handle_action_item_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_action_item_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS set_action_item_updated_at ON public.action_item_progress;
CREATE TRIGGER set_action_item_updated_at
  BEFORE UPDATE ON public.action_item_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_action_item_updated_at();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check that functions now have secure search_path set:
--
-- SELECT 
--   proname as function_name,
--   pg_get_function_result(oid) as returns,
--   prosecdef as is_security_definer,
--   proconfig as settings
-- FROM pg_proc
-- WHERE proname IN ('update_updated_at_column', 'handle_action_item_updated_at')
-- AND pronamespace = 'public'::regnamespace;
--
-- Expected: Both functions should show search_path in the settings column
-- ============================================================================
