/**
 * RLS Policy Verification Script
 * 
 * This script connects to your Supabase database and verifies that all
 * RLS policies are properly configured for production security.
 * 
 * Run with: node scripts/verify-rls-policies.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRLSPolicies() {
    console.log('\n============================================================================');
    console.log('🔍 VERIFYING RLS POLICIES');
    console.log('============================================================================\n');

    const query = `
    SELECT 
      tablename,
      policyname,
      cmd as operation,
      CASE 
        WHEN qual::text LIKE '%true%' AND qual::text NOT LIKE '%auth.uid%' THEN 'INSECURE'
        WHEN qual::text LIKE '%auth.uid%' THEN 'SECURE'
        WHEN with_check::text LIKE '%auth.uid%' THEN 'SECURE'
        WHEN qual IS NULL AND with_check IS NULL THEN 'NO_CONDITION'
        ELSE 'CHECK_MANUALLY'
      END as security_status,
      coalesce(qual::text, with_check::text, 'N/A') as policy_condition
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('diagnostic_sessions', 'diagnostic_results', 'patterns', 'action_item_progress')
    ORDER BY tablename, cmd, policyname;
  `;

    const { data, error } = await supabase.rpc('exec_sql', { sql: query }).single();

    if (error) {
        console.error('❌ Error querying policies:', error.message);
        console.log('\n⚠️  Note: This script requires direct database access.');
        console.log('   Please run the SQL query in Supabase SQL Editor instead:');
        console.log('   → supabase/migrations/verify_rls_simple.sql\n');
        return;
    }

    // Group policies by table
    const tables = {};
    if (data && Array.isArray(data)) {
        data.forEach(policy => {
            if (!tables[policy.tablename]) {
                tables[policy.tablename] = [];
            }
            tables[policy.tablename].push(policy);
        });
    }

    let hasIssues = false;

    // Display results
    Object.entries(tables).forEach(([tablename, policies]) => {
        console.log(`\n📋 Table: ${tablename}`);
        console.log('─'.repeat(80));

        policies.forEach(policy => {
            const icon = policy.security_status === 'SECURE' ? '✅' :
                policy.security_status === 'INSECURE' ? '❌' : '⚠️ ';

            console.log(`${icon} ${policy.operation.padEnd(10)} | ${policy.policyname}`);
            console.log(`   Status: ${policy.security_status}`);
            console.log(`   Condition: ${policy.policy_condition.substring(0, 70)}...`);
            console.log('');

            if (policy.security_status !== 'SECURE') {
                hasIssues = true;
            }
        });
    });

    console.log('\n============================================================================');
    console.log('📊 SUMMARY');
    console.log('============================================================================\n');

    if (hasIssues) {
        console.log('❌ SECURITY ISSUES DETECTED!');
        console.log('\nSome policies are not properly secured. Expected configuration:');
        console.log('  • diagnostic_sessions: 4 policies with auth.uid() = user_id');
        console.log('  • diagnostic_results: 4 policies checking session ownership');
        console.log('  • patterns: 1 SELECT policy for authenticated users');
        console.log('  • action_item_progress: Policies with user_id checks\n');
        console.log('📝 Next step: Apply the migration:');
        console.log('   supabase/migrations/20251213_enable_production_rls.sql\n');
    } else {
        console.log('✅ All RLS policies are properly configured for production!');
        console.log('🎉 Your database is secure.\n');
    }
}

// Alternative: Direct query using service role (requires SUPABASE_SERVICE_ROLE_KEY)
async function verifyWithServiceRole() {
    console.log('\n💡 Alternative: Using Supabase SQL Editor');
    console.log('─'.repeat(80));
    console.log('\n1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Navigate to: SQL Editor');
    console.log('4. Copy and paste the query from:');
    console.log('   → supabase/migrations/verify_rls_simple.sql');
    console.log('5. Click "Run"\n');
}

verifyRLSPolicies().catch(err => {
    console.error('Error:', err);
    verifyWithServiceRole();
});
