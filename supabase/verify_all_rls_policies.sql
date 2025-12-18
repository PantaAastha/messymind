-- ============================================================================
-- COMPREHENSIVE RLS POLICY VERIFICATION
-- ============================================================================
-- This script verifies all RLS policies on critical tables
-- Run this with: npx supabase db execute --file supabase/verify_all_rls_policies.sql
-- Or copy/paste into Supabase SQL Editor
-- ============================================================================

\echo '============================================================================'
\echo 'RLS POLICY STATUS FOR CRITICAL TABLES'
\echo '============================================================================'

\echo ''
\echo '--- TABLE: diagnostic_sessions ---'
SELECT 
    policyname,
    cmd as command,
    CASE 
        WHEN qual IS NOT NULL THEN substring(qual::text, 1, 80)
        ELSE 'N/A'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN substring(with_check::text, 1, 80)
        ELSE 'N/A'
    END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'diagnostic_sessions'
ORDER BY cmd, policyname;

\echo ''
\echo '--- TABLE: diagnostic_results ---'
SELECT 
    policyname,
    cmd as command,
    CASE 
        WHEN qual IS NOT NULL THEN substring(qual::text, 1, 80)
        ELSE 'N/A'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN substring(with_check::text, 1, 80)
        ELSE 'N/A'
    END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'diagnostic_results'
ORDER BY cmd, policyname;

\echo ''
\echo '--- TABLE: patterns ---'
SELECT 
    policyname,
    cmd as command,
    CASE 
        WHEN qual IS NOT NULL THEN substring(qual::text, 1, 80)
        ELSE 'N/A'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN substring(with_check::text, 1, 80)
        ELSE 'N/A'
    END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'patterns'
ORDER BY cmd, policyname;

\echo ''
\echo '--- TABLE: action_item_progress ---'
SELECT 
    policyname,
    cmd as command,
    CASE 
        WHEN qual IS NOT NULL THEN substring(qual::text, 1, 80)
        ELSE 'N/A'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN substring(with_check::text, 1, 80)
        ELSE 'N/A'
    END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'action_item_progress'
ORDER BY cmd, policyname;

\echo ''
\echo '============================================================================'
\echo 'RLS ENABLED STATUS'
\echo '============================================================================'
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('diagnostic_sessions', 'diagnostic_results', 'patterns', 'action_item_progress')
ORDER BY tablename;

\echo ''
\echo '============================================================================'
\echo 'SECURITY CHECKLIST'
\echo '============================================================================'
\echo ''
\echo 'Expected Policies:'
\echo '  diagnostic_sessions: 4 policies (INSERT/SELECT/UPDATE/DELETE) with auth.uid() = user_id'
\echo '  diagnostic_results: 4 policies (INSERT/SELECT/UPDATE/DELETE) checking session ownership'
\echo '  patterns: 1 policy (SELECT) for authenticated users'
\echo '  action_item_progress: Should have user-scoped policies'
\echo ''
\echo '⚠️  Red Flags:'
\echo '  - Policies with "true" in USING or WITH CHECK clauses'
\echo '  - Tables with RLS DISABLED'
\echo '  - Missing auth.uid() checks'
\echo '============================================================================'
