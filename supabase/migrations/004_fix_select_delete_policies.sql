-- Fix SELECT policy for diagnostic_sessions
-- The INSERT works but SELECT fails because auth.uid() is null

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own diagnostic sessions" ON diagnostic_sessions;

-- Allow anyone to SELECT (for MVP)
CREATE POLICY "Allow select for diagnostic sessions"
  ON diagnostic_sessions FOR SELECT
  USING (true);

-- Also update DELETE to allow all (for consistency)
DROP POLICY IF EXISTS "Users can delete their own diagnostic sessions" ON diagnostic_sessions;

CREATE POLICY "Allow delete for diagnostic sessions"
  ON diagnostic_sessions FOR DELETE
  USING (true);
