-- ============================================================================
-- Fix RLS Policy for Diagnostic Sessions
-- ============================================================================
-- 
-- ⚠️  TEMPORARY FIX FOR MVP - NOT PRODUCTION READY
-- 
-- This allows ANYONE to insert/update diagnostic sessions without authentication.
-- This is ONLY for MVP testing purposes.
-- 
-- TODO: Before production deployment:
-- 1. Enable Supabase authentication
-- 2. Re-enable middleware authentication checks
-- 3. Replace these policies with the production policies below
-- 4. Update API route to use real user_id from auth.uid()
-- ============================================================================

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can insert their own diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Users can update their own diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow insert for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow update for diagnostic sessions" ON diagnostic_sessions;

-- ============================================================================
-- MVP POLICIES (TEMPORARY - INSECURE)
-- ============================================================================

-- Allow anyone to insert (for MVP without authentication)
CREATE POLICY "Allow insert for diagnostic sessions"
  ON diagnostic_sessions FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update (for MVP without authentication)
CREATE POLICY "Allow update for diagnostic sessions"
  ON diagnostic_sessions FOR UPDATE
  USING (true);

-- ============================================================================
-- PRODUCTION POLICIES (COMMENTED OUT - USE WHEN AUTHENTICATION IS READY)
-- ============================================================================
-- 
-- Uncomment these and remove the MVP policies above when ready for production:
-- 
-- -- Only authenticated users can insert their own sessions
-- CREATE POLICY "Users can insert their own diagnostic sessions"
--   ON diagnostic_sessions FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
-- 
-- -- Only authenticated users can update their own sessions
-- CREATE POLICY "Users can update their own diagnostic sessions"
--   ON diagnostic_sessions FOR UPDATE
--   USING (auth.uid() = user_id);
-- 
-- -- Only authenticated users can delete their own sessions
-- CREATE POLICY "Users can delete their own diagnostic sessions"
--   ON diagnostic_sessions FOR DELETE
--   USING (auth.uid() = user_id);
-- ============================================================================
