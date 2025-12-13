-- ============================================================================
-- PRODUCTION RLS POLICIES - Enable User-Scoped Access Control
-- ============================================================================
-- 
-- This migration replaces the temporary "allow all" policies with secure
-- production policies that ensure users can only access their own data.
-- ============================================================================

-- ============================================================================
-- 1. DIAGNOSTIC SESSIONS - User-Owned Sessions
-- ============================================================================

-- Drop all existing policies (both insecure MVP and any old production attempts)
DROP POLICY IF EXISTS "Allow insert for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow update for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow select for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow delete for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can insert their own diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can update their own diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can view their own diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can delete their own diagnostic sessions" ON diagnostic_sessions;

-- Create production policies
CREATE POLICY "Users can insert their own sessions"
  ON diagnostic_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions"
  ON diagnostic_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON diagnostic_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON diagnostic_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. DIAGNOSTIC RESULTS - Access Through Session Ownership
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow insert for diagnostic results" ON diagnostic_results;
DROP POLICY IF EXISTS "Allow select for diagnostic results" ON diagnostic_results;
DROP POLICY IF EXISTS "Allow update for diagnostic results" ON diagnostic_results;
DROP POLICY IF EXISTS "Allow delete for diagnostic results" ON diagnostic_results;
DROP POLICY IF EXISTS "Users can view results for their sessions" ON diagnostic_results;
DROP POLICY IF EXISTS "Users can insert results for their sessions" ON diagnostic_results;
DROP POLICY IF EXISTS "Users can update results for their sessions" ON diagnostic_results;
DROP POLICY IF EXISTS "Users can delete results for their sessions" ON diagnostic_results;

-- Create production policies (access controlled via session ownership)
CREATE POLICY "Users can view results for their sessions"
  ON diagnostic_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert results for their sessions"
  ON diagnostic_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update results for their sessions"
  ON diagnostic_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete results for their sessions"
  ON diagnostic_results FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. PATTERNS - Public Read-Only Access
-- ============================================================================
-- Pattern definitions should be readable by all authenticated users
-- but only modifiable by admins/system

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert for patterns" ON patterns;
DROP POLICY IF EXISTS "Allow update for patterns" ON patterns;
DROP POLICY IF EXISTS "Allow select for patterns" ON patterns;
DROP POLICY IF EXISTS "Authenticated users can view patterns" ON patterns;

-- Public read access for authenticated users
CREATE POLICY "Authenticated users can view patterns"
  ON patterns FOR SELECT
  TO authenticated
  USING (true);

-- Note: INSERT/UPDATE/DELETE for patterns should be done via migrations or admin tools
-- No policies = only service role can modify

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- 
-- Run this query to verify policies are active:
-- 
-- SELECT tablename, policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('diagnostic_sessions', 'diagnostic_results', 'patterns')
-- ORDER BY tablename, policyname;
-- 
-- Expected results:
-- - diagnostic_sessions: 4 policies (INSERT, SELECT, UPDATE, DELETE) checking auth.uid() = user_id
-- - diagnostic_results: 4 policies (INSERT, SELECT, UPDATE, DELETE) checking session ownership
-- - patterns: 1 policy (SELECT) allowing authenticated users
-- ============================================================================
