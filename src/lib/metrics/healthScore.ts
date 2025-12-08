/**
 * Health Score Calculator
 * 
 * Calculates the overall health score (0-100) and revenue risk
 * based on detected patterns and their severity.
 */

import { DiagnosisOutput } from '@/types/diagnostics';
import { determineSeverity } from '@/lib/detection/triageRules';

export interface HealthStatus {
    score: number;
    status: 'Ecstatic' | 'Healthy' | 'Strained' | 'Critical';
    revenueAtRisk: number; // Estimated monthly loss
    verdict: string;
}

export function calculateHealthScore(diagnoses: DiagnosisOutput[]): HealthStatus {
    let score = 100;
    let revenueRisk = 0;

    for (const d of diagnoses) {
        // Use verify severity if available, else calculate it
        const severity = d.severity || determineSeverity(d.confidence, d.confidence_score);

        // Deduct points based on severity/impact
        if (severity === 'critical') {
            score -= 20;
        } else if (severity === 'warning') {
            score -= 10;
        }

        // Add to revenue risk (extract numeric from string range if possible)
        // Format example: "$12,000 - $15,000"
        if (d.estimated_impact?.estimated_monthly_revenue_impact) {
            const range = d.estimated_impact.estimated_monthly_revenue_impact;
            const match = range.match(/\$([\d,]+)/); // Simple extraction of first number
            if (match) {
                const val = parseInt(match[1].replace(/,/g, ''), 10);
                if (!isNaN(val)) revenueRisk += val;
            }
        }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine status label
    let status: HealthStatus['status'] = 'Healthy';
    if (score >= 90) status = 'Ecstatic';
    else if (score >= 70) status = 'Healthy';
    else if (score >= 40) status = 'Strained';
    else status = 'Critical';

    // Generate verdict
    const verdict = score > 80
        ? "Your store psychology is robust. Focus on optimization."
        : "Significant friction detected. Immediate triage recommended.";

    return {
        score,
        status,
        revenueAtRisk: revenueRisk,
        verdict
    };
}
