/**
 * Test Supabase Connection
 * 
 * Simple script to verify Supabase connection and pattern retrieval
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testConnection() {
    console.log('🔍 Testing Supabase connection...\n');

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase environment variables!');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test 1: Fetch all patterns
    console.log('📋 Test 1: Fetching all patterns...');
    const { data: patterns, error: patternsError } = await supabase
        .from('patterns')
        .select('pattern_id, label, category, created_at')
        .order('created_at', { ascending: true });

    if (patternsError) {
        console.error('   ❌ Error:', patternsError.message);
    } else {
        console.log(`   ✅ Success! Found ${patterns?.length || 0} patterns:`);
        patterns?.forEach((p, idx) => {
            console.log(`      ${idx + 1}. ${p.label} (${p.pattern_id})`);
            console.log(`         Category: ${p.category}`);
            console.log(`         Created: ${new Date(p.created_at).toLocaleString()}`);
        });
    }
    console.log('');

    // Test 2: Fetch a specific pattern with full details
    console.log('📋 Test 2: Fetching specific pattern details...');
    const { data: pattern, error: patternError } = await supabase
        .from('patterns')
        .select('*')
        .eq('pattern_id', 'comparison_paralysis')
        .single();

    if (patternError) {
        console.error('   ❌ Error:', patternError.message);
    } else {
        console.log('   ✅ Success! Pattern details:');
        console.log(`      Label: ${pattern.label}`);
        console.log(`      Description: ${pattern.description.substring(0, 100)}...`);
        console.log(`      Essential Inputs: ${pattern.inputs_schema.essential.length}`);
        console.log(`      Detection Rules: ${pattern.detection_rules.rules.length}`);
        console.log(`      Primary Drivers: ${pattern.driver_definitions.length}`);
        console.log(`      Intervention Buckets: ${pattern.intervention_buckets.length}`);
    }
    console.log('');

    // Test 3: Check table access
    console.log('📋 Test 3: Checking table access...');
    const tables = ['patterns', 'diagnostic_sessions', 'diagnostic_results', 'saved_reports'];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`   ❌ ${table}: ${error.message}`);
        } else {
            console.log(`   ✅ ${table}: Accessible`);
        }
    }
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Connection test complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testConnection().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
