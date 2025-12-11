/**
 * Financial Calculator
 * 
 * Calculate financial impact metrics like AOV, Conversion Rate, and Revenue at Risk
 */

import type { GA4Event } from '@/types/csv';

export interface FinancialMetrics {
    aov: number;
    aovIsPlaceholder: boolean;
    conversionRate: number;
    conversionIsCalculated: boolean;
}

/**
 * Calculate comprehensive financial metrics from GA4 events
 * 
 * @param events - All GA4 events from the diagnostic session
 * @param totalSessions - Total number of unique sessions analyzed
 * @returns Financial metrics including AOV and conversion rate
 */
export function calculateFinancialMetrics(
    events: GA4Event[],
    totalSessions: number
): FinancialMetrics {
    // Calculate AOV from purchase events
    const purchaseEvents = events.filter(e => e.event_name === 'purchase');
    const purchasePrices = purchaseEvents
        .map(e => e.item_price)
        .filter((price): price is number => typeof price === 'number' && price > 0);

    const aov = purchasePrices.length > 0
        ? purchasePrices.reduce((sum, price) => sum + price, 0) / purchasePrices.length
        : 112;  // Industry default fallback

    // Calculate actual conversion rate from data
    const purchaseCount = new Set(purchaseEvents.map(e => e.session_id)).size;  // Unique sessions that purchased
    const conversionRate = totalSessions > 0 && purchaseCount > 0
        ? purchaseCount / totalSessions
        : 0.02;  // 2% industry default

    return {
        aov: Math.round(aov * 100) / 100,  // Round to 2 decimals
        aovIsPlaceholder: purchasePrices.length === 0,
        conversionRate: Math.round(conversionRate * 10000) / 10000,  // Round to 4 decimals (e.g., 0.2000 = 20%)
        conversionIsCalculated: purchaseCount > 0
    };
}

/**
 * Calculate Revenue at Risk for a detected pattern
 * Uses intent-based filtering and actual conversion rate for realistic estimates
 * 
 * @param intentSessionCount - Number of sessions with purchase intent (add_to_cart or checkout)
 * @param storeAOV - Store-wide average order value
 * @param conversionRate - Actual conversion rate from data
 * @returns Revenue at risk (realistic estimate)
 */
export function calculateRevenueAtRisk(
    intentSessionCount: number,
    storeAOV: number,
    conversionRate: number
): number {
    const revenue = intentSessionCount * storeAOV * conversionRate;
    return Math.round(revenue * 100) / 100;
}

/**
 * Calculate maximum potential revenue (if all intent sessions converted)
 * Used for comparison with realistic estimate
 * 
 * @param intentSessionCount - Number of sessions with purchase intent
 * @param storeAOV - Store-wide average order value
 * @returns Maximum potential revenue
 */
export function calculateMaxPotentialRevenue(
    intentSessionCount: number,
    storeAOV: number
): number {
    return Math.round(intentSessionCount * storeAOV * 100) / 100;
}
