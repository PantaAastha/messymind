/**
 * Diagnosis Generator
 * 
 * Generate complete diagnosis output from detection results
 */

import type { Pattern } from '@/types/pattern';
import type {
    SessionMetrics,
    DiagnosisOutput,
    EvidenceMetrics,
    BenchmarkComparison,
    EstimatedImpact,
    ExampleSession,
    DataQuality,
} from '@/types/diagnostics';
import { evaluatePattern, type DetectionResult } from './rulesEngine';
import { detectPrimaryDrivers } from './driversDetector';
import { mapInterventions } from './interventionMapper';
import { determineSeverity } from './triageRules';
import {
    calculateFinancialMetrics,
    calculateRevenueAtRisk,
    calculateMaxPotentialRevenue
} from '@/lib/metrics/financialCalculator';
import { extractJourneyTimeline, findRepresentativeSession } from '@/lib/metrics/journeyExtractor';
import type { GA4Event } from '@/types/csv';

export interface DiagnosisGenerationOptions {
    scope: 'store' | 'category';
    scopeTarget: string;
    dateRange: { start: string; end: string };
    industryBenchmark?: { viewToCartRate: number };
}

/**
 * Generate complete diagnosis output for a pattern
 */
export function generateDiagnosis(
    pattern: Pattern,
    allSessionMetrics: SessionMetrics[],
    detectionResults: Map<string, DetectionResult>,
    options: DiagnosisGenerationOptions,
    rawEvents?: GA4Event[] // Optional: needed for AOV calculation and journey extraction
): DiagnosisOutput | null {
    // Filter sessions that were detected (including low confidence)
    const detectedSessions = allSessionMetrics.filter(metrics => {
        const result = detectionResults.get(metrics.session_id);
        return result && result.confidence !== 'none';
    });

    if (detectedSessions.length === 0) {
        return null; // Pattern not detected
    }

    // Calculate aggregate confidence
    const avgConfidenceScore =
        Array.from(detectionResults.values())
            .filter(r => r.detected)
            .reduce((sum, r) => sum + r.confidenceScore, 0) / detectedSessions.length;

    const overallConfidence = determineOverallConfidence(
        avgConfidenceScore,
        pattern.detection_rules.confidence_thresholds
    );

    // Collect all primary drivers from detected sessions
    const allDrivers = new Set<string>();
    detectedSessions.forEach(metrics => {
        const drivers = detectPrimaryDrivers(pattern, metrics);
        drivers.forEach(d => allDrivers.add(d));
    });

    const primaryDrivers = Array.from(allDrivers);

    // Generate evidence metrics
    const evidenceMetrics = generateEvidenceMetrics(
        detectedSessions,
        allSessionMetrics.length
    );

    // Generate benchmark comparison
    const benchmarkComparison = generateBenchmarkComparison(
        evidenceMetrics,
        options.industryBenchmark
    );

    // Calculate Store AOV, Conversion Rate, and Revenue at Risk (Phase 1 - Improved)
    const financialMetrics = rawEvents
        ? calculateFinancialMetrics(rawEvents, allSessionMetrics.length)
        : { aov: 112, aovIsPlaceholder: true, conversionRate: 0.02, conversionIsCalculated: false };

    // Filter for sessions with purchase intent
    const intentSessions = detectedSessions.filter(s => s.has_intent > 0);

    // Pattern-aware revenue calculation based on behavioral stage
    // Pre-intent patterns (e.g., Comparison Paralysis) = use all affected sessions + 3% conversion
    // Post-intent patterns (e.g., Trust/Risk) = use only intent sessions + 30% conversion
    const isPreIntentPattern = pattern.behavioral_stage === 'pre_intent';
    const sessionsForRevenue = isPreIntentPattern
        ? detectedSessions  // Pre-intent: pattern prevents intent formation
        : intentSessions;   // Post-intent: pattern occurs after intent

    // Use pattern-specific conversion rate (not global rate)
    // This prioritizes "hot leads" over browsers
    const conversionRate = pattern.expected_conversion_rate || financialMetrics.conversionRate;

    // Calculate revenue at risk using appropriate session count and conversion
    const revenueAtRisk = calculateRevenueAtRisk(
        sessionsForRevenue.length,
        financialMetrics.aov,
        conversionRate  // Pattern-specific rate (3% vs 30%)
    );

    // Calculate maximum potential (for comparison)
    const maxPotentialRevenue = calculateMaxPotentialRevenue(
        sessionsForRevenue.length,
        financialMetrics.aov
    );

    console.log(`  🎯 Pattern stage: ${pattern.behavioral_stage}`);
    console.log(`  📊 Using ${sessionsForRevenue.length} sessions (${isPreIntentPattern ? 'all affected' : 'intent only'})`);
    console.log(`  💹 Conversion rate: ${(conversionRate * 100).toFixed(1)}% ${pattern.expected_conversion_rate ? '(pattern-specific)' : '(global)'}`);

    // Generate estimated impact
    const estimatedImpact = generateEstimatedImpact(
        detectedSessions.length,
        intentSessions.length,
        allSessionMetrics.length,
        options.scopeTarget,
        financialMetrics.aov,
        financialMetrics.aovIsPlaceholder,
        conversionRate,  // Use pattern-specific conversion
        pattern.expected_conversion_rate !== undefined,  // Track if using pattern rate
        maxPotentialRevenue
    );

    // Map interventions
    const interventionRecommendations = mapInterventions(pattern, primaryDrivers);

    // Select example sessions
    const exampleSessions = selectExampleSessions(detectedSessions, detectionResults, 3);

    // Generate summary
    const summary = generateSummary(
        pattern,
        options.scopeTarget,
        evidenceMetrics,
        primaryDrivers
    );

    // Calculate priority score
    const priorityScore = calculatePriorityScore(
        avgConfidenceScore,
        estimatedImpact.affected_session_count,
        allSessionMetrics.length
    );

    // Data quality
    const dataQuality: DataQuality = {
        sample_size: allSessionMetrics.length,
        flagged_count: detectedSessions.length,
        date_range: `${options.dateRange.start} to ${options.dateRange.end}`,
        coverage: 'complete',
    };

    // New Triage Logic
    const severity = determineSeverity(overallConfidence, Math.round(avgConfidenceScore));

    // Extract journey timeline for representative session (Phase 1)
    let journeyTimeline;
    if (rawEvents) {
        const representativeSessionId = findRepresentativeSession(detectedSessions, detectionResults);
        if (representativeSessionId) {
            journeyTimeline = extractJourneyTimeline(representativeSessionId, rawEvents);
        }
    }

    return {
        pattern_id: pattern.pattern_id,
        label: pattern.label,
        category: pattern.category, // Added
        severity: severity, // Added
        confidence: overallConfidence,
        confidence_score: Math.round(avgConfidenceScore),
        scope: options.scope,
        scope_target: options.scopeTarget,
        summary,
        primary_drivers: primaryDrivers,
        evidence_metrics: evidenceMetrics,
        benchmark_comparison: benchmarkComparison,
        estimated_impact: estimatedImpact,
        priority_score: Math.round(priorityScore),
        intervention_recommendations: interventionRecommendations,
        example_sessions: exampleSessions,
        data_quality: dataQuality,
        // Financial Impact (Phase 1 - Improved with Conversion Rate)
        revenue_at_risk: revenueAtRisk,
        journey_timeline: journeyTimeline,
        aov_is_placeholder: financialMetrics.aovIsPlaceholder,
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineOverallConfidence(
    score: number,
    thresholds: { high: number; medium: number; low: number }
): 'high' | 'medium' | 'low' {
    if (score >= thresholds.high) return 'high';
    if (score >= thresholds.medium) return 'medium';
    return 'low';
}

function generateEvidenceMetrics(
    detectedSessions: SessionMetrics[],
    totalSessions: number
): EvidenceMetrics {
    const count = detectedSessions.length;

    return {
        avg_products_viewed_per_session:
            detectedSessions.reduce((sum, m) => sum + m.products_viewed, 0) / count,
        avg_same_category_ratio:
            detectedSessions.reduce((sum, m) => sum + m.same_category_views_ratio, 0) / count,
        avg_view_to_cart_rate:
            detectedSessions.reduce((sum, m) => sum + m.view_to_cart_rate, 0) / count,
        avg_session_duration_minutes:
            detectedSessions.reduce((sum, m) => sum + m.session_duration_minutes, 0) / count,
        pct_sessions_flagged: count / totalSessions,
        avg_return_views:
            detectedSessions.reduce((sum, m) => sum + m.return_views, 0) / count,
        avg_search_count:
            detectedSessions.reduce((sum, m) => sum + m.search_count, 0) / count,
        avg_price_range_cv:
            detectedSessions.reduce((sum, m) => sum + m.price_range_cv, 0) / count,
        affected_session_count: count,
        total_sessions_analyzed: totalSessions,
    };
}

function generateBenchmarkComparison(
    evidenceMetrics: EvidenceMetrics,
    industryBenchmark?: { viewToCartRate: number }
): BenchmarkComparison {
    const yourRate = evidenceMetrics.avg_view_to_cart_rate;
    const benchmarkRate = industryBenchmark?.viewToCartRate || 0.085; // Default 8.5%

    const deviation = ((yourRate - benchmarkRate) / benchmarkRate) * 100;

    return {
        your_view_to_cart_rate: `${(yourRate * 100).toFixed(1)}%`,
        industry_benchmark: '6-11%',
        deviation: `${deviation > 0 ? '+' : ''}${deviation.toFixed(0)}% ${deviation < 0 ? 'below' : 'above'} benchmark`,
        category_benchmark: `${(benchmarkRate * 100).toFixed(1)}%`,
    };
}

function generateEstimatedImpact(
    affectedCount: number,
    intentCount: number,
    totalCount: number,
    scopeTarget: string,
    storeAOV: number,
    aovIsPlaceholder: boolean,
    conversionRate: number,
    conversionIsCalculated: boolean,
    maxPotentialRevenue: number
): EstimatedImpact {
    const percentage = ((affectedCount / totalCount) * 100).toFixed(0);
    const intentPercentage = intentCount > 0 ? ((intentCount / affectedCount) * 100).toFixed(0) : '0';

    return {
        affected_sessions: `${percentage}% of ${scopeTarget} traffic`,
        affected_session_count: affectedCount,
        intent_session_count: intentCount,
        // potential_uplift_range removed - was hardcoded placeholder with no real calculation
        store_aov: storeAOV,
        aov_is_placeholder: aovIsPlaceholder,
        conversion_rate: conversionRate,
        conversion_is_calculated: conversionIsCalculated,
        max_potential_revenue: maxPotentialRevenue,
    };
}

function selectExampleSessions(
    sessions: SessionMetrics[],
    detectionResults: Map<string, DetectionResult>,
    count: number
): ExampleSession[] {
    // Sort by confidence score (highest first)
    const sorted = sessions
        .map(metrics => ({
            metrics,
            result: detectionResults.get(metrics.session_id)!,
        }))
        .filter(({ result }) => result.confidence !== 'none') // Filter out 'none' confidence
        .sort((a, b) => b.result.confidenceScore - a.result.confidenceScore)
        .slice(0, count);

    return sorted.map(({ metrics, result }) => ({
        session_id: anonymizeSessionId(metrics.session_id),
        products_viewed: metrics.products_viewed,
        same_category_ratio: parseFloat(metrics.same_category_views_ratio.toFixed(2)),
        session_minutes: parseFloat(metrics.session_duration_minutes.toFixed(1)),
        cart_adds: metrics.add_to_cart_count,
        confidence: result.confidence as 'low' | 'medium' | 'high',
        key_behavior: generateKeyBehaviorSummary(metrics),
    }));
}

function anonymizeSessionId(sessionId: string): string {
    // Take first 8 characters and add random suffix
    return `anon_${sessionId.substring(0, 8)}`;
}

function generateKeyBehaviorSummary(metrics: SessionMetrics): string {
    const parts: string[] = [];

    parts.push(`Viewed ${metrics.products_viewed} products`);

    if (metrics.return_views > 0) {
        parts.push(`revisited ${metrics.return_views}`);
    }

    if (metrics.search_count > 0) {
        parts.push(`searched ${metrics.search_count} times`);
    }

    if (metrics.add_to_cart_count === 0) {
        parts.push('no cart add');
    } else {
        parts.push(`${metrics.add_to_cart_count} cart adds`);
    }

    return parts.join(', ');
}

function generateSummary(
    pattern: Pattern,
    scopeTarget: string,
    evidenceMetrics: EvidenceMetrics,
    primaryDrivers: string[]
): string {
    const percentage = (evidenceMetrics.pct_sessions_flagged * 100).toFixed(0);
    const avgProducts = evidenceMetrics.avg_products_viewed_per_session.toFixed(1);
    const avgDuration = evidenceMetrics.avg_session_duration_minutes.toFixed(1);
    const cartRate = (evidenceMetrics.avg_view_to_cart_rate * 100).toFixed(1);

    return `Shoppers in ${scopeTarget} view an average of ${avgProducts} products over ${avgDuration} minutes but have a view-to-cart rate of only ${cartRate}%, significantly below industry norms. ${percentage}% of sessions show signs of ${pattern.label.toLowerCase()}, indicating shoppers are struggling to make decisions despite high engagement.`;
}

function calculatePriorityScore(
    confidenceScore: number,
    affectedCount: number,
    totalCount: number
): number {
    const impactScore = (affectedCount / totalCount) * 100;

    // Priority = (Confidence * 0.6) + (Impact * 0.4)
    return confidenceScore * 0.6 + impactScore * 0.4;
}
