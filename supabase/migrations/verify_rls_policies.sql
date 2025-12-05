-- Verify RLS Policies for diagnostic_sessions
-- Run this to check what policies exist

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'diagnostic_sessions'
ORDER BY policyname;
