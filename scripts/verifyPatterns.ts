/**
 * Pattern Registry Verification
 * 
 * Quick check to verify all patterns are properly loaded
 */

import { getAllPatterns, getPatternById } from '../src/lib/patterns/registry';

console.log('🔍 Verifying Pattern Registry...\n');

const patterns = getAllPatterns();

console.log(`✅ Found ${patterns.length} registered patterns:\n`);

patterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.label} (${pattern.pattern_id})`);
    console.log(`   Category: ${pattern.category}`);
    console.log(`   Essential Inputs: ${pattern.inputs_schema.essential.length}`);
    console.log(`   High Value Inputs: ${pattern.inputs_schema.high_value.length}`);
    console.log(`   Detection Rules: ${pattern.detection_rules.rules.length}`);
    console.log(`   Primary Drivers: ${pattern.driver_definitions.length}`);
    console.log(`   Intervention Buckets: ${pattern.intervention_buckets.length}`);
    console.log('');
});

// Test specific pattern retrieval
console.log('🔍 Testing pattern retrieval by ID...\n');

const trustPattern = getPatternById('trust_risk_social_proof');
if (trustPattern) {
    console.log('✅ Trust/Risk/Social Proof pattern loaded successfully');
    console.log(`   Description: ${trustPattern.description.substring(0, 100)}...`);
    console.log(`   Detection Rules: ${trustPattern.detection_rules.rules.map(r => r.id).join(', ')}`);
} else {
    console.log('❌ Failed to load Trust/Risk/Social Proof pattern');
}

console.log('\n✨ Pattern registry verification complete!');
