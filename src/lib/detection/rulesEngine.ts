/**
 * Rules-Based Detection Engine
 * 
 * Evaluate detection rules against session metrics to identify behavioral patterns
 */

import type { SessionMetrics } from '@/types/diagnostics';
import type { Pattern, Rule, Condition, BonusCondition } from '@/types/pattern';

export interface RuleEvaluationResult {
    ruleId: string;
    triggered: boolean;
    weight: number;
}

export interface DetectionResult {
    detected: boolean;
    confidence: 'high' | 'medium' | 'low' | 'none';
    confidenceScore: number;
    triggeredRules: string[];
    bonusPoints: number;
}

/**
 * Evaluate all detection rules for a pattern against session metrics
 */
export function evaluatePattern(
    pattern: Pattern,
    metrics: SessionMetrics
): DetectionResult {
    let totalScore = 0;
    const triggeredRules: string[] = [];

    // Evaluate each rule
    for (const rule of pattern.detection_rules.rules) {
        const result = evaluateRule(rule, metrics);

        if (result.triggered) {
            totalScore += result.weight;
            triggeredRules.push(result.ruleId);
        }
    }

    // Evaluate bonus conditions
    const bonusPoints = evaluateBonusConditions(
        pattern.detection_rules.bonus_conditions || [],
        metrics
    );

    totalScore += bonusPoints;

    // ========================================================================
    // NORMALIZED CONFIDENCE SCORING
    // ========================================================================
    // Calculate normalized confidence percentage using saturation_threshold
    // This ensures consistent confidence interpretation across all patterns
    //
    // Formula: confidence% = min(100, (rawScore / saturation_threshold) * 100)
    //
    // Example with Trust/Risk (saturation = 45):
    //   - Raw score 40 → 40/45 * 100 = 88% → HIGH confidence
    //
    // Example with Comparison Paralysis (saturation = 75):
    //   - Raw score 40 → 40/75 * 100 = 53% → MEDIUM confidence
    //
    // This allows business-aligned priorities:
    //   - Trust/Risk has lower saturation → easier to reach HIGH (revenue-critical)
    //   - Comparison Paralysis has higher saturation → needs more evidence
    // ========================================================================

    const saturationThreshold = pattern.detection_rules.saturation_threshold;
    const normalizedScore = Math.min(100, (totalScore / saturationThreshold) * 100);

    // Determine confidence level using normalized percentage thresholds
    const { high, medium, low } = pattern.detection_rules.confidence_thresholds;
    let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';

    if (normalizedScore >= high) {
        confidence = 'high';
    } else if (normalizedScore >= medium) {
        confidence = 'medium';
    } else if (normalizedScore >= low) {
        confidence = 'low';
    }

    return {
        detected: confidence !== 'none',
        confidence,
        confidenceScore: Math.round(normalizedScore), // Return normalized % (0-100)
        triggeredRules,
        bonusPoints,
    };
}

/**
 * Evaluate a single rule
 */
function evaluateRule(rule: Rule, metrics: SessionMetrics): RuleEvaluationResult {
    // All conditions must be met for rule to trigger
    const allConditionsMet = rule.conditions.every(condition =>
        evaluateCondition(condition, metrics)
    );

    return {
        ruleId: rule.id,
        triggered: allConditionsMet,
        weight: rule.weight,
    };
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(condition: Condition, metrics: SessionMetrics): boolean {
    const metricValue = getMetricValue(condition.metric, metrics);

    if (metricValue === undefined || metricValue === null) {
        return false;
    }

    switch (condition.operator) {
        case '>':
            return metricValue > condition.value;
        case '>=':
            return metricValue >= condition.value;
        case '<':
            return metricValue < condition.value;
        case '<=':
            return metricValue <= condition.value;
        case '==':
            return metricValue === condition.value;
        case '!=':
            return metricValue !== condition.value;
        default:
            return false;
    }
}

/**
 * Get metric value from SessionMetrics object
 */
function getMetricValue(metricId: string, metrics: SessionMetrics): number | undefined {
    // Map metric IDs to SessionMetrics properties
    const metricMap: Record<string, keyof SessionMetrics> = {
        products_viewed: 'products_viewed',
        add_to_cart_count: 'add_to_cart_count',
        session_duration_minutes: 'session_duration_minutes',
        view_to_cart_rate: 'view_to_cart_rate',
        same_category_views_ratio: 'same_category_views_ratio',
        category_switches: 'category_switches',
        price_range_cv: 'price_range_cv',
        return_views: 'return_views',
        search_count: 'search_count',
        avg_time_per_product: 'avg_time_per_product',
        pogo_stick_count: 'pogo_stick_count',
        evaluation_interaction_count: 'evaluation_interaction_count',
        // Ambient Shopping Metrics
        category_count: 'category_count',
        long_dwell_count: 'long_dwell_count',
        blog_views: 'blog_views',
        return_sessions_7d: 'return_sessions_7d',
        // New Trust/Risk Metrics
        reached_checkout: 'reached_checkout',
        completed_purchase: 'completed_purchase',
        has_intent: 'has_intent',
        policy_views: 'policy_views',
        review_interactions: 'review_interactions',
        fit_guide_views: 'fit_guide_views',
        brand_trust_views: 'brand_trust_views',
        time_on_cart_checkout: 'time_on_cart_checkout',
        // Composite
        total_reassurance_touches: 'total_reassurance_touches',
        policy_brand_views: 'policy_brand_views',
        negative_review_focus: 'negative_review_focus',
    };

    const property = metricMap[metricId];
    if (!property) {
        console.warn(`Unknown metric ID: ${metricId}`);
        return undefined;
    }

    const value = metrics[property];
    return typeof value === 'number' ? value : undefined;
}

/**
 * Evaluate bonus conditions
 */
function evaluateBonusConditions(
    bonusConditions: BonusCondition[],
    metrics: SessionMetrics
): number {
    let bonusPoints = 0;
    let maxBonus = 10; // Default max

    for (const bonus of bonusConditions) {
        if (evaluateCondition(bonus.condition, metrics)) {
            bonusPoints += bonus.points;
        }

        if (bonus.max_total !== undefined) {
            maxBonus = bonus.max_total;
        }
    }

    return Math.min(bonusPoints, maxBonus);
}

/**
 * Batch evaluate pattern across multiple sessions
 */
export function evaluatePatternAcrossSessions(
    pattern: Pattern,
    sessionMetrics: SessionMetrics[]
): Map<string, DetectionResult> {
    const results = new Map<string, DetectionResult>();

    for (const metrics of sessionMetrics) {
        const result = evaluatePattern(pattern, metrics);
        results.set(metrics.session_id, result);
    }

    return results;
}

/**
 * Get sessions that meet minimum confidence threshold
 */
export function getDetectedSessions(
    results: Map<string, DetectionResult>,
    minConfidence: 'low' | 'medium' | 'high' = 'medium'
): string[] {
    const confidenceLevels = ['low', 'medium', 'high'];
    const minIndex = confidenceLevels.indexOf(minConfidence);

    return Array.from(results.entries())
        .filter(([_, result]) => {
            const resultIndex = confidenceLevels.indexOf(result.confidence);
            return resultIndex >= minIndex;
        })
        .map(([sessionId]) => sessionId);
}
