-- ============================================================================
-- PATTERNS TABLE - SERVER-SIDE ACCESS ONLY
-- ============================================================================
-- Patterns are accessed ONLY by server-side code (Server Components, API routes)
-- Users never query this table directly from the browser
-- Therefore, we remove ALL RLS policies and rely on server-side access control
-- ============================================================================

-- Drop ALL existing policies on patterns table
DROP POLICY IF EXISTS "Patterns are insertable by anyone" ON patterns;
DROP POLICY IF EXISTS "Patterns are updatable by anyone" ON patterns;
DROP POLICY IF EXISTS "Patterns are viewable by everyone" ON patterns;
DROP POLICY IF EXISTS "Authenticated users can view patterns" ON patterns;
DROP POLICY IF EXISTS "Allow insert for patterns" ON patterns;
DROP POLICY IF EXISTS "Allow update for patterns" ON patterns;
DROP POLICY IF EXISTS "Allow select for patterns" ON patterns;
DROP POLICY IF EXISTS "Allow delete for patterns" ON patterns;

-- ============================================================================
-- NO POLICIES = SERVER-SIDE ACCESS ONLY
-- ============================================================================
-- With no RLS policies and RLS enabled, the table becomes:
-- - ✅ Accessible by service role (server-side code, migrations)
-- - ❌ NOT accessible directly by authenticated users from browser
-- 
-- This is the correct security model because:
-- 1. Patterns are fetched in Server Components (page.tsx)
-- 2. Patterns are fetched in server functions (fetchDiagnosticData.ts)
-- 3. Users never need to query patterns directly
-- ============================================================================

-- Verify RLS is enabled on patterns table
-- (Should already be enabled, but let's be explicit)
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, verify with:
-- 
-- SELECT COUNT(*) as policy_count
-- FROM pg_policies 
-- WHERE tablename = 'patterns';
--
-- Expected result: 0 policies
-- 
-- This means:
-- ✅ RLS is enabled
-- ✅ No policies exist
-- ✅ Only service role can access
-- ✅ Users cannot access directly from browser
-- ============================================================================
