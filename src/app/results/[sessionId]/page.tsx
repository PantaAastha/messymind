import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ClinicalDashboard } from '@/components/results/ClinicalDashboard';
import { calculateHealthScore } from '@/lib/metrics/healthScore';
import { determineSeverity } from '@/lib/detection/triageRules';
import type { DiagnosisOutput } from '@/types/diagnostics';
import type { Pattern } from '@/types/pattern';

// Helper to transform DB row to DiagnosisOutput
function transformResult(row: any): DiagnosisOutput {
    return {
        ...row,
        intervention_recommendations: {
            primary: row.primary_intervention,
            secondary: row.secondary_intervention,
            all_relevant_buckets: row.all_relevant_buckets
        }
    };
}

export default async function ResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const supabase = await createClient();

    // 1. Fetch Session
    const { data: session, error: sessionError } = await supabase
        .from('diagnostic_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (sessionError || !session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h1>
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">&larr; Return Home</Link>
                </div>
            </div>
        );
    }

    // 2. Fetch Results
    const { data: results } = await supabase
        .from('diagnostic_results')
        .select('*')
        .eq('session_id', sessionId);

    // 3. Fetch Patterns (for Category lookup)
    const { data: patterns } = await supabase
        .from('patterns')
        .select('*');

    // 4. Transform & Enrich Data
    const rawDiagnoses = results ? results.map(transformResult) : [];

    // Enrich with Category and Severity (Runtime Calculation)
    const diagnoses: DiagnosisOutput[] = rawDiagnoses.map(d => {
        const pattern = (patterns as Pattern[])?.find(p => p.pattern_id === d.pattern_id);

        // Calculate severity if not present in DB (Plan B)
        const severity = d.severity || determineSeverity(d.confidence, d.confidence_score);

        // Resolve Driver Info
        const driverInfo = d.primary_drivers.map(driverId => {
            const def = (pattern as Pattern | undefined)?.driver_definitions.find(dd => dd.id === driverId);
            return {
                id: driverId,
                label: def?.label || driverId,
                description: def?.description || 'Key factor identified in analysis.'
            };
        });

        // Resolve All Interventions
        const relevantBucketIds = d.intervention_recommendations.all_relevant_buckets || [];
        const allInterventions = relevantBucketIds.map(bucketId => {
            const bucket = (pattern as Pattern | undefined)?.intervention_buckets.find(b => b.id === bucketId);

            // Determine triggers (which drivers point here?)
            const triggeredBy: string[] = [];
            const rules = (pattern as Pattern | undefined)?.intervention_mapping?.rules || [];

            for (const rule of rules) {
                if (rule.primary === bucketId || rule.secondary === bucketId) {
                    const driversInRule = rule.condition.drivers_include || [];
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

    // 5. Calculate Health Score
    const health = calculateHealthScore(diagnoses);

    // 6. Get Store Metrics for Hero
    // 6. Get Store Metrics for Hero
    let storeMetrics: any = {
        avg_view_to_cart_rate: 0,
        total_sessions: 0,
        scope: 'store',
        scope_target: null,
        date_range_start: new Date().toISOString(),
        date_range_end: new Date().toISOString(),
        total_users: 0,
        avg_session_duration: 0,
        avg_conversion_rate: 0,
        bounce_rate: 0
    };

    if (Array.isArray(session.aggregate_metrics)) {
        const found = session.aggregate_metrics.find((m: any) => m.scope === 'store');
        if (found) storeMetrics = found;
    } else if (session.aggregate_metrics && typeof session.aggregate_metrics === 'object') {
        // Fallback for single object case
        if ((session.aggregate_metrics as any).scope === 'store') {
            storeMetrics = session.aggregate_metrics as any;
        }
    }

    return (
        <ClinicalDashboard
            diagnoses={diagnoses}
            aggregateMetrics={storeMetrics}
            sessionCount={session.data_quality?.session_count || 0}
        />
    );
}
