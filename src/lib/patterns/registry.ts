/**
 * Pattern Registry
 * 
 * Central registry for all behavioral patterns
 */

import type { Pattern } from '@/types/pattern';
import { comparisonParalysisPattern } from './comparisonParalysis';
import { trustRiskSocialProofPattern } from './trustRiskSocialProof';

// Registry of all patterns
const patternRegistry: Record<string, Pattern> = {
    comparison_paralysis: comparisonParalysisPattern,
    trust_risk_social_proof: trustRiskSocialProofPattern,
    // Future patterns will be added here:
    // value_uncertainty: valueUncertaintyPattern,
    // etc.
};

/**
 * Get all registered patterns
 */
export function getAllPatterns(): Pattern[] {
    return Object.values(patternRegistry);
}

/**
 * Get a pattern by its ID
 */
export function getPatternById(patternId: string): Pattern | undefined {
    return patternRegistry[patternId];
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: string): Pattern[] {
    return getAllPatterns().filter(pattern => pattern.category === category);
}

/**
 * Check if a pattern exists
 */
export function patternExists(patternId: string): boolean {
    return patternId in patternRegistry;
}
