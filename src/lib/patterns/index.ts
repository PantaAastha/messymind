import { comparisonParalysisPattern } from './comparisonParalysis';
import { trustRiskSocialProofPattern } from './trustRiskSocialProof';
import { ambientShoppingPattern } from './ambientShopping';
import { valueUncertaintyPattern } from './valueUncertainty';
import type { Pattern } from '@/types/pattern';

export const ALL_PATTERNS: Pattern[] = [
    comparisonParalysisPattern,
    trustRiskSocialProofPattern,
    ambientShoppingPattern,
    valueUncertaintyPattern,
];

export function getPatternById(id: string): Pattern | undefined {
    return ALL_PATTERNS.find(p => p.pattern_id === id);
}
