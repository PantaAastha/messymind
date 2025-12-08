/**
 * Triage Rules Logic
 * 
 * Determines the severity of a detected pattern (Critical vs Warning)
 */

export type Severity = "critical" | "warning" | "healthy";

/**
 * Determine severity based on confidence and impact
 */
export function determineSeverity(
    confidence: "high" | "medium" | "low",
    confidenceScore: number
): Severity {
    // High confidence patterns are always critical
    if (confidence === 'high') {
        return 'critical';
    }

    // Medium confidence patterns > 50% are critical
    if (confidence === 'medium' && confidenceScore >= 50) {
        return 'critical';
    }

    // Otherwise warning
    return 'warning';
}

/**
 * Calculate color code for severity
 */
export function getSeverityColor(severity: Severity): string {
    switch (severity) {
        case 'critical':
            return 'red';
        case 'warning':
            return 'yellow';
        case 'healthy':
            return 'green';
    }
}
