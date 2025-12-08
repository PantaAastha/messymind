import { comparisonParalysisPattern } from './comparisonParalysis';
import { impulseBrowsingPattern } from './impulseBrowsing';
import { trustRiskSocialProofPattern } from './trustRiskSocialProof';
import type { Pattern } from '@/types/pattern';

export const ALL_PATTERNS: Pattern[] = [
    comparisonParalysisPattern,
    impulseBrowsingPattern,
    trustRiskSocialProofPattern,
];

export function getPatternById(id: string): Pattern | undefined {
    return ALL_PATTERNS.find(p => p.pattern_id === id);
}
