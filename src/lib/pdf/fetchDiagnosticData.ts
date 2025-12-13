import { createClient } from '@/lib/supabase/server';
import { determineSeverity } from '@/lib/detection/triageRules';
import type { DiagnosisOutput } from '@/types/diagnostics';
import type { Pattern } from '@/types/pattern';

/**
 * Fetch and transform diagnostic data for a session
 * Used by both results page and PDF generation
 */
export async function fetchDiagnosticData(sessionId: string) {
    const supabase = await createClient();

    // Fetch session
    const { data: session, error: sessionError } = await supabase
        .from('diagnostic_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (sessionError || !session) {
        throw new Error(`Session not found: ${sessionId}`);
    }

    // Fetch results
    const { data: results } = await supabase
        .from('diagnostic_results')
        .select('*')
        .eq('session_id', sessionId);

    // Fetch patterns
    const { data: patterns } = await supabase
        .from('patterns')
        .select('*');

    // Transform results to DiagnosisOutput format
    const rawDiagnoses = results ? results.map((row: any) => ({
        ...row,
        intervention_recommendations: {
            primary: row.primary_intervention,
            secondary: row.secondary_intervention,
            all_relevant_buckets: row.all_relevant_buckets
        }
    })) : [];

    // Enrich with pattern metadata
    const diagnoses: DiagnosisOutput[] = rawDiagnoses.map(d => {
        const pattern = (patterns as Pattern[])?.find(p => p.pattern_id === d.pattern_id);
        const severity = d.severity || determineSeverity(d.confidence, d.confidence_score);

        const driverInfo = d.primary_drivers.map((driverId: string) => {
            const def = (pattern as Pattern | undefined)?.driver_definitions.find(dd => dd.id === driverId);
            return {
                id: driverId,
                label: def?.label || driverId,
                description: def?.description || 'Key factor identified in analysis.'
            };
        });

        const relevantBucketIds = d.intervention_recommendations.all_relevant_buckets || [];
        const allInterventions = relevantBucketIds.map((bucketId: string) => {
            const bucket = (pattern as Pattern | undefined)?.intervention_buckets.find(b => b.id === bucketId);
            const rules = (pattern as Pattern | undefined)?.intervention_mapping?.rules || [];
            const triggeredBy: string[] = [];

            for (const rule of rules) {
                if (rule.primary === bucketId || rule.secondary === bucketId) {
                    const driversInRule = [
                        ...(rule.condition.drivers_include || []),
                        ...(rule.condition.drivers_include_all || [])
                    ];
                    const matched = driversInRule.filter(drv => d.primary_drivers.includes(drv));
                    matched.forEach(m => {
                        const drvDef = (pattern as Pattern | undefined)?.driver_definitions.find(dd => dd.id === m);
                        const label = drvDef?.label || m;
                        if (!triggeredBy.includes(label)) triggeredBy.push(label);
                    });
                }
            }

            return {
                bucket: bucketId,
                label: bucket?.name || bucketId,
                description: bucket?.what_it_does || '',
                why_it_works: bucket?.why_it_works || '',
                rationale: '',
                quick_wins: bucket?.implementation_examples || [],
                triggered_by: triggeredBy
            };
        });

        return {
            ...d,
            label: d.label || pattern?.label || d.pattern_id,
            category: d.category || pattern?.category || 'Uncategorized',
            severity: severity,
            driver_info: driverInfo,
            intervention_recommendations: {
                ...d.intervention_recommendations,
                all_interventions: allInterventions
            }
        };
    });

    return {
        session,
        diagnoses
    };
}
