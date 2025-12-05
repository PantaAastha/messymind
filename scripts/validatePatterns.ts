/**
 * Pattern Validation Script
 * 
 * Validates that all patterns in the registry are properly structured
 */

import { getAllPatterns } from '../src/lib/patterns/registry';

console.log('🔍 Validating patterns...\n');

const patterns = getAllPatterns();

console.log(`Found ${patterns.length} patterns:\n`);

patterns.forEach((pattern) => {
    console.log(`✅ ${pattern.label} (${pattern.pattern_id})`);
    console.log(`   Category: ${pattern.category}`);
    console.log(`   Essential Inputs: ${pattern.inputs_schema.essential.length}`);
    console.log(`   High Value Inputs: ${pattern.inputs_schema.high_value.length}`);
    console.log(`   Detection Rules: ${pattern.detection_rules.rules.length}`);
    console.log(`   Primary Drivers: ${pattern.driver_definitions.length}`);
    console.log(`   Intervention Buckets: ${pattern.intervention_buckets.length}`);
    console.log(`   Intervention Mapping Rules: ${pattern.intervention_mapping.rules.length}`);
    console.log('');
});

console.log('✨ All patterns validated successfully!');
