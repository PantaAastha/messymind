/**
 * Metrics Calculator
 * 
 * Calculate SessionMetrics and AggregateMetrics from GA4 events
 */

import type { GA4Event } from '@/types/csv';
import type { SessionMetrics, AggregateMetrics } from '@/types/diagnostics';
import {
    findPrimaryCategory,
    calculatePriceStats,
    countCategorySwitches,
    countReturnViews,
    extractCategories,
} from './grouping';

/**
 * Calculate metrics for a single session
 */
export function calculateSessionMetrics(
    sessionId: string,
    events: GA4Event[]
): SessionMetrics {
    // Filter events by type
    const viewEvents = events.filter(e => e.event_name === 'view_item');
    const cartEvents = events.filter(e => e.event_name === 'add_to_cart');
    const searchEvents = events.filter(e => e.event_name === 'search');

    // Products viewed (unique item_ids)
    const uniqueProducts = new Set(
        viewEvents.map(e => e.item_id).filter(Boolean)
    );
    const products_viewed = uniqueProducts.size;

    // Add to cart count
    const add_to_cart_count = cartEvents.length;

    // Session duration
    const timestamps = events.map(e => new Date(e.event_timestamp).getTime());
    const session_duration_minutes = timestamps.length > 0
        ? (Math.max(...timestamps) - Math.min(...timestamps)) / 60000
        : 0;

    // View to cart rate
    const view_to_cart_rate = products_viewed > 0
        ? add_to_cart_count / products_viewed
        : 0;

    // Categories
    const categories_viewed = extractCategories(viewEvents);
    const primary_category = findPrimaryCategory(viewEvents);

    // Same category views ratio
    let same_category_views_ratio = 0;
    if (primary_category && viewEvents.length > 0) {
        const primaryCategoryViews = viewEvents.filter(
            e => e.item_category === primary_category
        ).length;
        same_category_views_ratio = primaryCategoryViews / viewEvents.length;
    }

    // Category switches
    const category_switches = countCategorySwitches(viewEvents);

    // Price analysis
    const prices = viewEvents
        .map(e => e.item_price)
        .filter((price): price is number => typeof price === 'number' && price > 0);

    const priceStats = calculatePriceStats(prices);
    const price_range_cv = priceStats.cv;

    // Return views
    const return_views = countReturnViews(viewEvents);

    // Search count
    const search_count = searchEvents.length;

    // Average time per product
    const avg_time_per_product = products_viewed > 0 && session_duration_minutes > 0
        ? (session_duration_minutes * 60) / products_viewed
        : 0;

    return {
        session_id: sessionId,
        products_viewed,
        add_to_cart_count,
        session_duration_minutes: Math.round(session_duration_minutes * 100) / 100,
        view_to_cart_rate: Math.round(view_to_cart_rate * 100) / 100,
        same_category_views_ratio: Math.round(same_category_views_ratio * 100) / 100,
        category_switches,
        price_range_cv: Math.round(price_range_cv * 100) / 100,
        viewed_prices: prices,
        return_views,
        search_count,
        avg_time_per_product: Math.round(avg_time_per_product * 100) / 100,
        categories_viewed,
        primary_category,
    };
}

/**
 * Calculate aggregate metrics across all sessions
 */
export function calculateAggregateMetrics(
    sessionMetrics: SessionMetrics[],
    scope: 'store' | 'category',
    scopeTarget: string,
    dateRangeStart?: string,
    dateRangeEnd?: string
): AggregateMetrics {
    // Filter sessions by scope if needed
    let filteredSessions = sessionMetrics;
    if (scope === 'category') {
        filteredSessions = sessionMetrics.filter(
            s => s.primary_category === scopeTarget
        );
    }

    const total_sessions = filteredSessions.length;

    if (total_sessions === 0) {
        return {
            scope,
            scope_target: scopeTarget,
            total_sessions: 0,
            date_range_start: dateRangeStart || '',
            date_range_end: dateRangeEnd || '',
            avg_products_viewed: 0,
            avg_session_duration: 0,
            avg_view_to_cart_rate: 0,
            avg_same_category_ratio: 0,
            avg_category_switches: 0,
            avg_price_range_cv: 0,
            avg_return_views: 0,
            avg_search_count: 0,
        };
    }

    // Calculate averages
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => sum(arr) / arr.length;

    const avg_products_viewed = avg(filteredSessions.map(s => s.products_viewed));
    const avg_session_duration = avg(filteredSessions.map(s => s.session_duration_minutes));
    const avg_view_to_cart_rate = avg(filteredSessions.map(s => s.view_to_cart_rate));
    const avg_same_category_ratio = avg(filteredSessions.map(s => s.same_category_views_ratio));
    const avg_category_switches = avg(filteredSessions.map(s => s.category_switches));
    const avg_price_range_cv = avg(filteredSessions.map(s => s.price_range_cv));
    const avg_return_views = avg(filteredSessions.map(s => s.return_views));
    const avg_search_count = avg(filteredSessions.map(s => s.search_count));

    return {
        scope,
        scope_target: scopeTarget,
        total_sessions,
        date_range_start: dateRangeStart || '',
        date_range_end: dateRangeEnd || '',
        avg_products_viewed: Math.round(avg_products_viewed * 100) / 100,
        avg_session_duration: Math.round(avg_session_duration * 100) / 100,
        avg_view_to_cart_rate: Math.round(avg_view_to_cart_rate * 100) / 100,
        avg_same_category_ratio: Math.round(avg_same_category_ratio * 100) / 100,
        avg_category_switches: Math.round(avg_category_switches * 100) / 100,
        avg_price_range_cv: Math.round(avg_price_range_cv * 100) / 100,
        avg_return_views: Math.round(avg_return_views * 100) / 100,
        avg_search_count: Math.round(avg_search_count * 100) / 100,
    };
}
