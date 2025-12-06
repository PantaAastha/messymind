-- Fix RLS policies for diagnostic_results table based on USER_REQUEST
-- We need to allow unauthenticated access for MVP since we are using a placeholder user_id
-- and no actual Auth session.

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view results for their sessions" ON diagnostic_results;
DROP POLICY IF EXISTS "Users can insert results for their sessions" ON diagnostic_results;
-- (In case they exist implicitly or were added later)
DROP POLICY IF EXISTS "Users can update results for their sessions" ON diagnostic_results;
DROP POLICY IF EXISTS "Users can delete results for their sessions" ON diagnostic_results;

-- 2. Create permissive policies (MVP ONLY - INSECURE)

-- Allow anyone to insert results (required for the API to save diagnostics)
CREATE POLICY "Allow insert for diagnostic results"
  ON diagnostic_results FOR INSERT
  WITH CHECK (true);

-- Allow anyone to select results (required for the results page)
CREATE POLICY "Allow select for diagnostic results"
  ON diagnostic_results FOR SELECT
  USING (true);

-- Allow updates (if needed)
CREATE POLICY "Allow update for diagnostic results"
  ON diagnostic_results FOR UPDATE
  USING (true);

-- Allow deletes (if needed)
CREATE POLICY "Allow delete for diagnostic results"
  ON diagnostic_results FOR DELETE
  USING (true);
