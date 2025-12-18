-- ============================================================================
-- IMPROVED RLS POLICY VERIFICATION
-- ============================================================================
-- This properly checks BOTH qual (USING) and with_check (WITH CHECK) clauses
-- ============================================================================

SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        -- Check INSERT policies via with_check clause
        WHEN cmd = 'INSERT' AND with_check::text LIKE '%auth.uid%' THEN '✅ SECURE'
        WHEN cmd = 'INSERT' AND with_check::text = 'true' AND array_to_string(roles, ',') LIKE '%authenticated%' THEN '✅ SECURE (authenticated only)'
        WHEN cmd = 'INSERT' AND with_check::text = 'true' THEN '❌ INSECURE'
        
        -- Check SELECT/UPDATE/DELETE policies via qual (USING) clause
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') AND qual::text LIKE '%auth.uid%' THEN '✅ SECURE'
        -- Special case: SELECT with true + TO authenticated is secure for read-only tables
        WHEN cmd = 'SELECT' AND qual::text = 'true' AND array_to_string(roles, ',') LIKE '%authenticated%' THEN '✅ SECURE (read-only)'
        WHEN cmd IN ('UPDATE', 'DELETE') AND qual::text = 'true' AND array_to_string(roles, ',') LIKE '%authenticated%' THEN '⚠️ CHECK (allows all authenticated)'
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') AND qual::text = 'true' THEN '❌ INSECURE'
        
        ELSE '⚠️ MANUAL CHECK'
    END as status,
    CASE 
        WHEN cmd = 'INSERT' THEN substring(coalesce(with_check::text, 'N/A'), 1, 60)
        ELSE substring(coalesce(qual::text, 'N/A'), 1, 60)
    END as condition,
    array_to_string(roles, ', ') as roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('diagnostic_sessions', 'diagnostic_results', 'patterns', 'action_item_progress')
ORDER BY tablename, cmd, policyname;
