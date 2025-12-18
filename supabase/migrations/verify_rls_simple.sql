-- ============================================================================
-- SIMPLE RLS POLICY VERIFICATION (Copy to Supabase SQL Editor)
-- ============================================================================
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor
-- Paste this query and click "Run"
-- ============================================================================

-- Check all RLS policies for critical tables
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual::text LIKE '%true%' AND qual::text NOT LIKE '%auth.uid%' THEN '❌ INSECURE (allows all)'
        WHEN qual::text LIKE '%auth.uid%' THEN '✅ SECURE (auth check)'
        WHEN qual IS NULL THEN '-'
        ELSE '⚠️  CHECK MANUALLY'
    END as security_status,
    substring(coalesce(qual::text, with_check::text, 'N/A'), 1, 100) as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('diagnostic_sessions', 'diagnostic_results', 'patterns', 'action_item_progress')
ORDER BY tablename, cmd, policyname;
