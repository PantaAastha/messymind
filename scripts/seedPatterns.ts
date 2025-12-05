/**
 * Seed Patterns to Supabase
 * 
 * Script to populate the patterns table with initial knowledge base data
 * 
 * Usage: npx tsx scripts/seedPatterns.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { getAllPatterns } from '../src/lib/patterns/registry';

// Load environment variables from parent directory's .env.local
config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function seedPatterns() {
    console.log('🌱 Starting pattern seeding...\n');

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase environment variables!');
        console.error('   Please check your .env.local file.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const patterns = getAllPatterns();
    console.log(`Found ${patterns.length} patterns to seed\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const pattern of patterns) {
        console.log(`📝 Seeding: ${pattern.label} (${pattern.pattern_id})`);

        const { data, error } = await supabase
            .from('patterns')
            .upsert(
                {
                    pattern_id: pattern.pattern_id,
                    label: pattern.label,
                    category: pattern.category,
                    description: pattern.description,
                    inputs_schema: pattern.inputs_schema,
                    detection_rules: pattern.detection_rules,
                    driver_definitions: pattern.driver_definitions,
                    intervention_buckets: pattern.intervention_buckets,
                    intervention_mapping: pattern.intervention_mapping,
                    metadata: pattern.metadata || {},
                },
                {
                    onConflict: 'pattern_id', // Update if exists
                }
            )
            .select();

        if (error) {
            console.error(`   ❌ Error: ${error.message}\n`);
            errorCount++;
        } else {
            console.log(`   ✅ Successfully seeded!`);
            console.log(`      - Essential inputs: ${pattern.inputs_schema.essential.length}`);
            console.log(`      - High-value inputs: ${pattern.inputs_schema.high_value.length}`);
            console.log(`      - Detection rules: ${pattern.detection_rules.rules.length}`);
            console.log(`      - Primary drivers: ${pattern.driver_definitions.length}`);
            console.log(`      - Intervention buckets: ${pattern.intervention_buckets.length}\n`);
            successCount++;
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✨ Seeding complete!`);
    console.log(`   Success: ${successCount} patterns`);
    console.log(`   Errors: ${errorCount} patterns`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify patterns were inserted
    console.log('🔍 Verifying patterns in database...\n');

    const { data: allPatterns, error: fetchError } = await supabase
        .from('patterns')
        .select('pattern_id, label, category')
        .order('created_at', { ascending: true });

    if (fetchError) {
        console.error('❌ Error fetching patterns:', fetchError.message);
    } else {
        console.log(`Found ${allPatterns?.length || 0} patterns in database:`);
        allPatterns?.forEach((p, idx) => {
            console.log(`   ${idx + 1}. ${p.label} (${p.pattern_id}) - ${p.category}`);
        });
    }

    console.log('\n🎉 Pattern seeding complete!\n');
    process.exit(errorCount > 0 ? 1 : 0);
}

seedPatterns().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
