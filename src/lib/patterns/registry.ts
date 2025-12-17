/**
 * Pattern Registry
 * 
 * Central registry for all behavioral patterns
 */

import type { Pattern } from '@/types/pattern';
import { comparisonParalysisPattern } from './comparisonParalysis';
import { trustRiskSocialProofPattern } from './trustRiskSocialProof';
import { ambientShoppingPattern } from './ambientShopping';
import { valueUncertaintyPattern } from './valueUncertainty';

// ============================================================================
// PATTERN REGISTRY
// ============================================================================

/**
 * Central registry for all behavioral patterns.
 * Add new patterns here to make them available for diagnostic detection.
 */
const PATTERN_REGISTRY: Pattern[] = [
    comparisonParalysisPattern,
    trustRiskSocialProofPattern,
    ambientShoppingPattern,
    valueUncertaintyPattern,
];

/**
 * Get all registered patterns
 */
export function getAllPatterns(): Pattern[] {
    return PATTERN_REGISTRY;
}

/**
 * Get pattern by ID
 */
export function getPatternById(patternId: string): Pattern | undefined {
    return PATTERN_REGISTRY.find(p => p.pattern_id === patternId);
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: string): Pattern[] {
    return PATTERN_REGISTRY.filter(p => p.category === category);
}

/**
 * Get patterns by behavioral stage
 */
export function getPatternsByStage(stage: 'pre_intent' | 'post_intent'): Pattern[] {
    return PATTERN_REGISTRY.filter(p => p.behavioral_stage === stage);
}
