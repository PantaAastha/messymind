/**
 * Diagnostic Runner
 * 
 * Orchestrates pattern detection and diagnosis generation
 */

import { createClient } from '@/lib/supabase/server';
import type { SessionMetrics, AggregateMetrics, DiagnosisOutput } from '@/types/diagnostics';
import type { Pattern } from '@/types/pattern';
import { ALL_PATTERNS } from '@/lib/patterns';
import { evaluatePatternAcrossSessions } from '@/lib/detection/rulesEngine';
import { detectPrimaryDrivers } from '@/lib/detection/driversDetector';
import { mapInterventions } from '@/lib/detection/interventionMapper';
import { generateDiagnosis } from '@/lib/detection/diagnosisGenerator';

/**
 * Run diagnostics for a session
 * Returns array of detected patterns with full diagnoses
 */
export async function runDiagnostics(sessionId: string): Promise<DiagnosisOutput[]> {
    console.log('🔍 Starting diagnostics for session:', sessionId);

    const supabase = await createClient();

    // 1. Fetch diagnostic session
    const { data: session, error: sessionError } = await supabase
        .from('diagnostic_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (sessionError || !session) {
        console.error('❌ Failed to fetch session:', sessionError);
        throw new Error('Session not found');
    }

    const sessionMetrics = session.session_metrics as SessionMetrics[];
    const aggregateMetrics = session.aggregate_metrics as AggregateMetrics;

    if (!sessionMetrics || sessionMetrics.length === 0) {
        console.error('❌ No session metrics found');
        throw new Error('Metrics not calculated');
    }

    console.log(`✅ Loaded ${sessionMetrics.length} session metrics`);

    // 2. Load patterns (use code registry for reliability)
    const patterns = ALL_PATTERNS;

    console.log(`✅ Loaded ${patterns.length} patterns from registry`);

    const results: DiagnosisOutput[] = [];

    // 3. For each pattern, run detection
    for (const pattern of patterns) {
        console.log(`🔎 Evaluating pattern: ${pattern.label}`);

        try {
            // Run detection engine
            const detectionResults = evaluatePatternAcrossSessions(
                pattern,
                sessionMetrics
            );

            // Check if pattern was detected in any sessions
            const detectedSessions = Array.from(detectionResults.values())
                .filter(r => r.confidence !== 'none');

            if (detectedSessions.length === 0) {
                console.log(`  ⚪ Pattern not detected: ${pattern.label}`);
                continue;
            }

            console.log(`  ✅ Pattern detected in ${detectedSessions.length} sessions`);

            // Generate full diagnosis
            const diagnosis = generateDiagnosis(
                pattern,
                sessionMetrics,
                detectionResults,
                {
                    scope: 'store',
                    scopeTarget: 'All products',
                    dateRange: {
                        start: session.date_range_start || '',
                        end: session.date_range_end || '',
                    },
                },
                session.raw_data // Pass raw events for AOV calculation and journey extraction
            );

            if (diagnosis) {
                console.log(`  💡 Diagnosis generated for: ${pattern.label}`);
                console.log(`  👥 Sessions: ${diagnosis.estimated_impact.affected_session_count} affected, ${diagnosis.estimated_impact.intent_session_count} with intent`);
                console.log(`  💰 Revenue at risk: $${diagnosis.revenue_at_risk.toFixed(2)} (realistic)`);
                console.log(`  📊 Max potential: $${diagnosis.estimated_impact.max_potential_revenue.toFixed(2)}`);
                console.log(`  🎯 Conversion rate: ${(diagnosis.estimated_impact.conversion_rate * 100).toFixed(2)}% ${diagnosis.estimated_impact.conversion_is_calculated ? '(calculated)' : '(default)'}`);
                console.log(`  💵 AOV: $${diagnosis.estimated_impact.store_aov.toFixed(2)} ${diagnosis.aov_is_placeholder ? '(default)' : '(calculated)'}`);

                results.push(diagnosis);

                // Save to database
                await saveDiagnosticResult(sessionId, diagnosis);
                console.log(`  💾 Saved to database`);
            }
        } catch (error) {
            console.error(`  ❌ Error processing pattern ${pattern.label}:`, error);
            // Continue with other patterns
        }
    }

    // Sort results by revenue_at_risk (descending) - biggest money-loser first
    results.sort((a, b) => b.revenue_at_risk - a.revenue_at_risk);

    console.log(`✅ Diagnostics complete: ${results.length} patterns detected`);
    return results;
}

/**
 * Save diagnostic result to database
 */
async function saveDiagnosticResult(
    sessionId: string,
    diagnosis: DiagnosisOutput
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('diagnostic_results')
        .insert({
            session_id: sessionId,
            pattern_id: diagnosis.pattern_id,
            label: diagnosis.label,
            category: diagnosis.category,
            severity: diagnosis.severity,
            detected: true,
            confidence: diagnosis.confidence,
            confidence_score: diagnosis.confidence_score,
            scope: diagnosis.scope,
            scope_target: diagnosis.scope_target,
            primary_drivers: diagnosis.primary_drivers,
            evidence_metrics: diagnosis.evidence_metrics,
            benchmark_comparison: diagnosis.benchmark_comparison,
            example_sessions: diagnosis.example_sessions,
            primary_intervention: diagnosis.intervention_recommendations.primary,
            secondary_intervention: diagnosis.intervention_recommendations.secondary,
            all_relevant_buckets: diagnosis.intervention_recommendations.all_relevant_buckets,
            estimated_impact: diagnosis.estimated_impact,
            // Phase 1: Financial Impact
            revenue_at_risk: diagnosis.revenue_at_risk,
            journey_timeline: diagnosis.journey_timeline,
            aov_is_placeholder: diagnosis.aov_is_placeholder,
        });

    if (error) {
        console.error('Failed to save diagnostic result:', error);
        throw error;
    }
}
