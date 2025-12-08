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
                }
            );

            if (diagnosis) {
                results.push(diagnosis);
                console.log(`  💡 Diagnosis generated for: ${pattern.label}`);

                // Save to database
                await saveDiagnosticResult(sessionId, diagnosis);
                console.log(`  💾 Saved to database`);
            }
        } catch (error) {
            console.error(`  ❌ Error processing pattern ${pattern.label}:`, error);
            // Continue with other patterns
        }
    }

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
        });

    if (error) {
        console.error('Failed to save diagnostic result:', error);
        throw error;
    }
}
