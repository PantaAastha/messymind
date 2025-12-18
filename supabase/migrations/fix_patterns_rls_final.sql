-- ============================================================================
-- PATTERNS TABLE - READ-ONLY FOR SERVER-SIDE ACCESS
-- ============================================================================
-- Patterns are accessed by server-side code on behalf of authenticated users
-- Server components use the anon key with user session, so we need a SELECT policy
-- However, patterns should NOT be modifiable by users - only via migrations
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

-- Enable RLS
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- Create ONLY a SELECT policy for server-side reads
-- This allows Server Components to fetch patterns when rendering results
CREATE POLICY "patterns_select_policy"
  ON patterns FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- SECURITY MODEL
-- ============================================================================
-- ✅ SELECT: Allowed for authenticated users (server-side reads)
-- ❌ INSERT: NO policy = only service role can insert (via migrations)
-- ❌ UPDATE: NO policy = only service role can update (via migrations)  
-- ❌ DELETE: NO policy = only service role can delete (via migrations)
--
-- This means:
-- 1. Server Components can fetch patterns to enrich diagnostic results
-- 2. Users cannot modify patterns (even via API/browser)
-- 3. Only migrations/admin tools can modify patterns
-- ============================================================================

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, verify with:
-- 
-- SELECT policyname, cmd, qual::text
-- FROM pg_policies 
-- WHERE tablename = 'patterns';
--
-- Expected result: 1 policy
-- - patterns_select_policy | SELECT | true (TO authenticated)
-- ============================================================================
