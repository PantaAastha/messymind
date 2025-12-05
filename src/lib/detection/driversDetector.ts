/**
 * Primary Drivers Detector
 * 
 * Detect primary behavioral drivers from session metrics
 */

import type { SessionMetrics } from '@/types/diagnostics';
import type { Pattern, DriverDefinition } from '@/types/pattern';
import { evaluateCondition } from './rulesEngine';

/**
 * Detect primary drivers for a session based on pattern definition
 */
export function detectPrimaryDrivers(
    pattern: Pattern,
    metrics: SessionMetrics
): string[] {
    const drivers: string[] = [];

    for (const driverDef of pattern.driver_definitions) {
        if (isDriverTriggered(driverDef, metrics)) {
            drivers.push(driverDef.id);
        }
    }

    return drivers;
}

/**
 * Check if a driver is triggered based on its conditions
 */
function isDriverTriggered(
    driverDef: DriverDefinition,
    metrics: SessionMetrics
): boolean {
    // All conditions must be met for driver to be triggered
    return driverDef.detection_conditions.every(condition => {
        // Reuse the condition evaluation logic from rulesEngine
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
    });
}

/**
 * Get metric value from SessionMetrics object
 */
function getMetricValue(metricId: string, metrics: SessionMetrics): number | undefined {
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
    };

    const property = metricMap[metricId];
    if (!property) {
        return undefined;
    }

    const value = metrics[property];
    return typeof value === 'number' ? value : undefined;
}

/**
 * Get driver labels from driver IDs
 */
export function getDriverLabels(
    pattern: Pattern,
    driverIds: string[]
): string[] {
    return driverIds
        .map(id => {
            const driver = pattern.driver_definitions.find(d => d.id === id);
            return driver?.label;
        })
        .filter(Boolean) as string[];
}

/**
 * Batch detect drivers across multiple sessions
 */
export function detectDriversAcrossSessions(
    pattern: Pattern,
    sessionMetrics: SessionMetrics[]
): Map<string, string[]> {
    const results = new Map<string, string[]>();

    for (const metrics of sessionMetrics) {
        const drivers = detectPrimaryDrivers(pattern, metrics);
        results.set(metrics.session_id, drivers);
    }

    return results;
}
