-- Check for RLS policies that re-evaluate auth functions for each row
-- These policies have performance issues at scale

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause,
    CASE 
        WHEN qual::text LIKE '%auth.uid()%' OR with_check::text LIKE '%auth.uid()%' THEN '⚠️ PERFORMANCE ISSUE'
        WHEN qual::text LIKE '%current_setting%' OR with_check::text LIKE '%current_setting%' THEN '⚠️ PERFORMANCE ISSUE'
        ELSE '✅ OK'
    END as performance_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY performance_status DESC, tablename, policyname;
