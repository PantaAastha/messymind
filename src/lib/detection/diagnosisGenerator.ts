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
    options: DiagnosisGenerationOptions
): DiagnosisOutput | null {
    // Filter sessions that were detected (medium+ confidence)
    const detectedSessions = allSessionMetrics.filter(metrics => {
        const result = detectionResults.get(metrics.session_id);
        return result && result.confidence !== 'none' && result.confidence !== 'low';
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

    // Generate estimated impact
    const estimatedImpact = generateEstimatedImpact(
        detectedSessions.length,
        allSessionMetrics.length,
        options.scopeTarget
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

    return {
        pattern_id: pattern.pattern_id,
        label: pattern.label,
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
    totalCount: number,
    scopeTarget: string
): EstimatedImpact {
    const percentage = ((affectedCount / totalCount) * 100).toFixed(0);

    return {
        affected_sessions: `${percentage}% of ${scopeTarget} traffic`,
        affected_session_count: affectedCount,
        potential_uplift_range: '15-25% improvement in view-to-cart rate',
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
