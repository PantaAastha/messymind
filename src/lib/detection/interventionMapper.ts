/**
 * Intervention Mapper
 * 
 * Map primary drivers to intervention recommendations
 */

import type { Pattern, InterventionMappingRule } from '@/types/pattern';
import type { InterventionRecommendations, InterventionRecommendation } from '@/types/diagnostics';

/**
 * Map drivers to intervention recommendations
 */
export function mapInterventions(
    pattern: Pattern,
    drivers: string[]
): InterventionRecommendations {
    const { rules, default_primary, default_secondary } = pattern.intervention_mapping;

    // Find the first matching rule
    for (const rule of rules) {
        if (matchesCondition(rule.condition, drivers)) {
            return buildRecommendations(pattern, rule.primary, rule.secondary, drivers);
        }
    }

    // Fall back to defaults if no rule matches
    return buildRecommendations(pattern, default_primary, default_secondary, drivers);
}

/**
 * Check if drivers match the rule condition
 */
function matchesCondition(
    condition: InterventionMappingRule['condition'],
    drivers: string[]
): boolean {
    // Check drivers_include_all (all must be present)
    if (condition.drivers_include_all) {
        const allPresent = condition.drivers_include_all.every(d => drivers.includes(d));
        if (!allPresent) return false;
    }

    // Check drivers_include (at least one must be present)
    if (condition.drivers_include) {
        const anyPresent = condition.drivers_include.some(d => drivers.includes(d));
        if (!anyPresent) return false;
    }

    return true;
}

/**
 * Build intervention recommendations
 */
function buildRecommendations(
    pattern: Pattern,
    primaryId: string,
    secondaryId: string,
    drivers: string[]
): InterventionRecommendations {
    const primaryBucket = pattern.intervention_buckets.find(b => b.id === primaryId);
    const secondaryBucket = pattern.intervention_buckets.find(b => b.id === secondaryId);

    if (!primaryBucket || !secondaryBucket) {
        throw new Error(`Intervention bucket not found: ${primaryId} or ${secondaryId}`);
    }

    // Generate rationale based on drivers
    const primaryRationale = generateRationale(primaryBucket.id, drivers);
    const secondaryRationale = generateRationale(secondaryBucket.id, drivers);

    // Get all relevant buckets (those that could apply to these drivers)
    const allRelevantBuckets = getAllRelevantBuckets(pattern, drivers);

    return {
        primary: {
            bucket: primaryBucket.id,
            label: primaryBucket.name,
            description: primaryBucket.what_it_does,
            why_it_works: primaryBucket.why_it_works,
            rationale: primaryRationale,
            quick_wins: primaryBucket.implementation_examples.slice(0, 3), // Top 3
        },
        secondary: {
            bucket: secondaryBucket.id,
            label: secondaryBucket.name,
            description: secondaryBucket.what_it_does,
            why_it_works: secondaryBucket.why_it_works,
            rationale: "Supporting intervention derived from pattern structure.",
            quick_wins: secondaryBucket.implementation_examples
        },
        all_interventions: [], // Populated at runtime in UI
        all_relevant_buckets: allRelevantBuckets
    };
}

/**
 * Generate rationale for why this intervention was chosen
 */
function generateRationale(interventionId: string, drivers: string[]): string {
    // Map intervention IDs to rationale templates
    const rationaleMap: Record<string, (drivers: string[]) => string> = {
        curation_defaults: (d) => {
            if (d.includes('high_exploration_breadth') && d.includes('zero_cart_commitment')) {
                return 'High exploration with zero commitment signals need for clear starting points';
            }
            if (d.includes('broad_price_band_confusion')) {
                return 'Wide price range exploration indicates need for clear tier structure';
            }
            return 'Shoppers need curated options to reduce choice overload';
        },
        decision_aids: (d) => {
            if (d.includes('deep_within_category')) {
                return 'Deep within-category viewing shows need for structured comparison';
            }
            if (d.includes('narrow_price_band_comparison')) {
                return 'Fine-grained price comparison indicates need for side-by-side feature analysis';
            }
            if (d.includes('revisit_same_products') || d.includes('search_looping')) {
                return 'Revisiting and searching behavior shows need for clearer decision criteria';
            }
            return 'Shoppers need structured comparison tools to evaluate options';
        },
        social_proof: (d) => {
            if (d.includes('extended_session_time') && d.includes('partial_cart_commitment')) {
                return 'Extended evaluation time suggests need for validation from others';
            }
            return 'Social proof can help reduce decision anxiety';
        },
        attribute_simplification: (d) => {
            if (d.includes('category_back_and_forth')) {
                return 'Category switching indicates navigation clarity issues';
            }
            return 'Simplified filtering will help shoppers narrow options more easily';
        },
        anchoring_best_value: (d) => {
            if (d.includes('narrow_price_band_comparison')) {
                return 'Tight price range comparison shows need for clear value anchors';
            }
            if (d.includes('broad_price_band_confusion')) {
                return 'Wide price exploration indicates unclear budget/value expectations';
            }
            return 'Clear value framing will help shoppers feel confident in their choice';
        },
        commitment_nudge: (d) => {
            if (d.includes('revisit_same_products') || d.includes('search_looping')) {
                return 'Repeated viewing and searching shows need to break evaluation loop';
            }
            if (d.includes('extended_session_time')) {
                return 'Long session duration suggests shopper is ready for gentle nudge';
            }
            return 'Light commitment prompts can help move shoppers forward';
        },
        trust_signals_risk_reversal: (d) => {
            if (d.includes('checkout_trust_dropoff')) return 'Abandonment at checkout signals need for stronger security reassurance';
            if (d.includes('policy_scrutiny_before_purchase')) return 'Policy checking before exit indicates anxiety about returns/terms';
            if (d.includes('brand_reassurance_seeking')) return 'Checking "About" pages signals desire for brand credibility';
            return 'Trust signals help reduce perceived risk';
        },
        returns_shipping_policy_clarity: (d) => {
            return 'Clear policies reduce anxiety about "what if it goes wrong?"';
        },
        fit_will_this_work_helpers: (d) => {
            if (d.includes('fit_uncertainty_behavior')) return 'Heavy fit guide usage shows need for better sizing confidence';
            return 'Helping users visualize fit reduces hesitation';
        },
        social_proof_reassurance_layer: (d) => {
            if (d.includes('intensive_review_consumption')) return 'Deep review reading signals reliance on peer validation';
            return 'Social proof validates the purchase decision';
        },
        checkout_reassurance_friction_reduction: (d) => {
            return 'Reducing friction at the final step prevents last-minute bailouts';
        },
        pre_purchase_support_objection_handling: (d) => {
            return 'Live support can resolve specific blocking objections in real-time';
        },
    };

    const generateFn = rationaleMap[interventionId];
    return generateFn ? generateFn(drivers) : 'Recommended based on behavioral patterns';
}

/**
 * Get all intervention buckets that could be relevant for these drivers
 */
function getAllRelevantBuckets(pattern: Pattern, drivers: string[]): string[] {
    const relevantBuckets = new Set<string>();

    // Check each mapping rule to see if it could apply
    for (const rule of pattern.intervention_mapping.rules) {
        if (matchesCondition(rule.condition, drivers)) {
            relevantBuckets.add(rule.primary);
            relevantBuckets.add(rule.secondary);
        }
    }

    // Always include defaults as potentially relevant
    relevantBuckets.add(pattern.intervention_mapping.default_primary);
    relevantBuckets.add(pattern.intervention_mapping.default_secondary);

    return Array.from(relevantBuckets);
}
