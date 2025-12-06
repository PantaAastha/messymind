/**
 * Event Grouping Helpers
 * 
 * Utility functions for organizing and analyzing GA4 events
 */

import type { GA4Event } from '@/types/csv';

/**
 * Group events by session_id
 */
export function groupEventsBySession(events: GA4Event[]): Map<string, GA4Event[]> {
    const grouped = new Map<string, GA4Event[]>();

    for (const event of events) {
        const sessionId = event.session_id;
        if (!grouped.has(sessionId)) {
            grouped.set(sessionId, []);
        }
        grouped.get(sessionId)!.push(event);
    }

    return grouped;
}

/**
 * Extract unique categories from events
 */
export function extractCategories(events: GA4Event[]): string[] {
    const categories = new Set<string>();

    for (const event of events) {
        if (event.item_category) {
            categories.add(event.item_category);
        }
    }

    return Array.from(categories);
}

/**
 * Find primary category (most viewed)
 */
export function findPrimaryCategory(events: GA4Event[]): string | undefined {
    const viewEvents = events.filter(e => e.event_name === 'view_item' && e.item_category);

    if (viewEvents.length === 0) return undefined;

    const categoryCounts: Record<string, number> = {};

    for (const event of viewEvents) {
        const category = event.item_category!;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    // Return category with highest count
    return Object.keys(categoryCounts).sort((a, b) =>
        categoryCounts[b] - categoryCounts[a]
    )[0];
}

/**
 * Calculate price statistics
 */
export function calculatePriceStats(prices: number[]): {
    mean: number;
    stdDev: number;
    cv: number;
} {
    if (prices.length === 0) {
        return { mean: 0, stdDev: 0, cv: 0 };
    }

    // Calculate mean
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    if (prices.length === 1) {
        return { mean, stdDev: 0, cv: 0 };
    }

    // Calculate standard deviation
    const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Calculate coefficient of variation
    const cv = mean !== 0 ? stdDev / mean : 0;

    return { mean, stdDev, cv };
}

/**
 * Count category transitions (switches between categories)
 */
export function countCategorySwitches(events: GA4Event[]): number {
    const viewEvents = events
        .filter(e => e.event_name === 'view_item' && e.item_category)
        .sort((a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime());

    if (viewEvents.length <= 1) return 0;

    let switches = 0;
    let previousCategory = viewEvents[0].item_category;

    for (let i = 1; i < viewEvents.length; i++) {
        const currentCategory = viewEvents[i].item_category;
        if (currentCategory !== previousCategory) {
            switches++;
            previousCategory = currentCategory;
        }
    }

    return switches;
}

/**
 * Count return views (products viewed multiple times)
 */
export function countReturnViews(events: GA4Event[]): number {
    const viewEvents = events.filter(e => e.event_name === 'view_item' && e.item_id);

    const viewCounts: Record<string, number> = {};

    for (const event of viewEvents) {
        const itemId = event.item_id!;
        viewCounts[itemId] = (viewCounts[itemId] || 0) + 1;
    }

    // Count items viewed more than once
    return Object.values(viewCounts).filter(count => count > 1).length;
}
