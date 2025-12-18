-- ============================================================================
-- RLS PERFORMANCE OPTIMIZATION (Supabase Recommended Approach)
-- ============================================================================
-- Problem: Policies using auth.uid() directly cause PostgreSQL to re-evaluate
-- the function for EVERY ROW, which is slow at scale.
--
-- Solution: Wrap auth.uid() in a scalar subselect: (SELECT auth.uid())
-- This forces Postgres to evaluate once per statement and reuse the value.
-- ============================================================================

-- ============================================================================
-- 1. VERIFY INDEXES EXIST
-- ============================================================================
-- Ensure user_id columns are indexed for efficient filtering

-- These indexes should already exist, but creating them again is idempotent
CREATE INDEX IF NOT EXISTS idx_saved_reports_user_id ON saved_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_user_id ON diagnostic_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_action_item_progress_user_id ON action_item_progress(user_id);

-- ============================================================================
-- 2. OPTIMIZE SAVED_REPORTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own saved reports" ON saved_reports;
DROP POLICY IF EXISTS "Users can insert their own saved reports" ON saved_reports;
DROP POLICY IF EXISTS "Users can update their own saved reports" ON saved_reports;
DROP POLICY IF EXISTS "Users can delete their own saved reports" ON saved_reports;

CREATE POLICY "Users can view their own saved reports"
  ON saved_reports FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own saved reports"
  ON saved_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own saved reports"
  ON saved_reports FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own saved reports"
  ON saved_reports FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 3. OPTIMIZE DIAGNOSTIC_SESSIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can view their own diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can insert their own diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can update their own diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can delete their own diagnostic sessions" ON diagnostic_sessions;

CREATE POLICY "Users can view their own sessions"
  ON diagnostic_sessions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own sessions"
  ON diagnostic_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own sessions"
  ON diagnostic_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own sessions"
  ON diagnostic_sessions FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 4. OPTIMIZE ACTION_ITEM_PROGRESS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own action items" ON action_item_progress;
DROP POLICY IF EXISTS "Users can insert their own action items" ON action_item_progress;
DROP POLICY IF EXISTS "Users can update their own action items" ON action_item_progress;
DROP POLICY IF EXISTS "Users can delete their own action items" ON action_item_progress;

CREATE POLICY "Users can view their own action items"
  ON action_item_progress FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own action items"
  ON action_item_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own action items"
  ON action_item_progress FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own action items"
  ON action_item_progress FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 5. OPTIMIZE DIAGNOSTIC_RESULTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view results for their sessions" ON diagnostic_results;
DROP POLICY IF EXISTS "Users can insert results for their sessions" ON diagnostic_results;
DROP POLICY IF EXISTS "Users can update results for their sessions" ON diagnostic_results;
DROP POLICY IF EXISTS "Users can delete results for their sessions" ON diagnostic_results;

CREATE POLICY "Users can view results for their sessions"
  ON diagnostic_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert results for their sessions"
  ON diagnostic_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update results for their sessions"
  ON diagnostic_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete results for their sessions"
  ON diagnostic_results FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, the performance warnings should disappear
-- from the Supabase dashboard.
--
-- To verify, run:
-- SELECT tablename, policyname, qual::text
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- AND tablename IN ('saved_reports', 'diagnostic_sessions', 'action_item_progress', 'diagnostic_results');
--
-- Expected: All policies should use (SELECT auth.uid()) instead of auth.uid()
-- ============================================================================
