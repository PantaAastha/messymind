/**
 * Session Metrics Calculator
 * 
 * Calculate behavioral metrics from GA4 event data at the session level
 */

import type { GA4Event } from '@/types/csv';
import type { SessionMetrics } from '@/types/diagnostics';

/**
 * Calculate metrics for a single session
 */
export function calculateSessionMetrics(
    sessionId: string,
    events: GA4Event[]
): SessionMetrics {
    // Filter events for this session
    const sessionEvents = events.filter(e => e.session_id === sessionId);

    if (sessionEvents.length === 0) {
        throw new Error(`No events found for session ${sessionId}`);
    }

    // Sort events by timestamp
    const sortedEvents = sessionEvents.sort(
        (a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
    );

    // Core metrics
    const productsViewed = calculateProductsViewed(sortedEvents);
    const addToCartCount = calculateAddToCartCount(sortedEvents);
    const sessionDurationMinutes = calculateSessionDuration(sortedEvents);

    // Derived metrics
    const viewToCartRate = productsViewed > 0 ? addToCartCount / productsViewed : 0;

    // Category analysis
    const { sameCategoryViewsRatio, categoriesViewed, primaryCategory } =
        analyzeCategoryBehavior(sortedEvents);
    const categorySwitches = calculateCategorySwitches(sortedEvents);

    // Price analysis
    const { priceRangeCV, viewedPrices } = analyzePriceRange(sortedEvents);

    // Engagement patterns
    const returnViews = calculateReturnViews(sortedEvents);
    const searchCount = calculateSearchCount(sortedEvents);
    const avgTimePerProduct = calculateAvgTimePerProduct(sortedEvents, sessionDurationMinutes);

    return {
        session_id: sessionId,
        products_viewed: productsViewed,
        add_to_cart_count: addToCartCount,
        session_duration_minutes: sessionDurationMinutes,
        view_to_cart_rate: viewToCartRate,
        same_category_views_ratio: sameCategoryViewsRatio,
        category_switches: categorySwitches,
        price_range_cv: priceRangeCV,
        viewed_prices: viewedPrices,
        return_views: returnViews,
        search_count: searchCount,
        avg_time_per_product: avgTimePerProduct,
        categories_viewed: categoriesViewed,
        primary_category: primaryCategory,
    };
}

/**
 * Calculate all session metrics from event data
 */
export function calculateAllSessionMetrics(events: GA4Event[]): SessionMetrics[] {
    // Group events by session
    const sessionIds = [...new Set(events.map(e => e.session_id))];

    return sessionIds.map(sessionId => calculateSessionMetrics(sessionId, events));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateProductsViewed(events: GA4Event[]): number {
    const viewItemEvents = events.filter(e => e.event_name === 'view_item' && e.item_id);
    const uniqueProducts = new Set(viewItemEvents.map(e => e.item_id));
    return uniqueProducts.size;
}

function calculateAddToCartCount(events: GA4Event[]): number {
    return events.filter(e => e.event_name === 'add_to_cart').length;
}

function calculateSessionDuration(events: GA4Event[]): number {
    if (events.length === 0) return 0;

    const firstTimestamp = new Date(events[0].event_timestamp).getTime();
    const lastTimestamp = new Date(events[events.length - 1].event_timestamp).getTime();

    return (lastTimestamp - firstTimestamp) / (1000 * 60); // Convert to minutes
}

function analyzeCategoryBehavior(events: GA4Event[]): {
    sameCategoryViewsRatio: number;
    categoriesViewed: string[];
    primaryCategory?: string;
} {
    const viewItemEvents = events.filter(e => e.event_name === 'view_item' && e.item_category);

    if (viewItemEvents.length === 0) {
        return {
            sameCategoryViewsRatio: 0,
            categoriesViewed: [],
        };
    }

    // Count views per category
    const categoryCount: Record<string, number> = {};
    viewItemEvents.forEach(event => {
        const category = event.item_category!;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const categoriesViewed = Object.keys(categoryCount);
    const maxCategoryViews = Math.max(...Object.values(categoryCount));
    const primaryCategory = Object.entries(categoryCount).find(
        ([_, count]) => count === maxCategoryViews
    )?.[0];

    const sameCategoryViewsRatio = maxCategoryViews / viewItemEvents.length;

    return {
        sameCategoryViewsRatio,
        categoriesViewed,
        primaryCategory,
    };
}

function calculateCategorySwitches(events: GA4Event[]): number {
    const viewItemEvents = events.filter(e => e.event_name === 'view_item' && e.item_category);

    if (viewItemEvents.length <= 1) return 0;

    let switches = 0;
    for (let i = 1; i < viewItemEvents.length; i++) {
        if (viewItemEvents[i].item_category !== viewItemEvents[i - 1].item_category) {
            switches++;
        }
    }

    return switches;
}

function analyzePriceRange(events: GA4Event[]): {
    priceRangeCV: number;
    viewedPrices: number[];
} {
    const viewItemEvents = events.filter(
        e => e.event_name === 'view_item' && e.item_price !== undefined
    );

    const prices = viewItemEvents.map(e => e.item_price!);

    if (prices.length === 0) {
        return { priceRangeCV: 0, viewedPrices: [] };
    }

    // Calculate Coefficient of Variation (CV)
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance =
        prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    return {
        priceRangeCV: cv,
        viewedPrices: prices,
    };
}

function calculateReturnViews(events: GA4Event[]): number {
    const viewItemEvents = events.filter(e => e.event_name === 'view_item' && e.item_id);

    // Count views per product
    const productViewCount: Record<string, number> = {};
    viewItemEvents.forEach(event => {
        const productId = event.item_id!;
        productViewCount[productId] = (productViewCount[productId] || 0) + 1;
    });

    // Count products viewed more than once
    return Object.values(productViewCount).filter(count => count > 1).length;
}

function calculateSearchCount(events: GA4Event[]): number {
    return events.filter(e => e.event_name === 'search' || e.search_term).length;
}

function calculateAvgTimePerProduct(events: GA4Event[], sessionDurationMinutes: number): number {
    const productsViewed = calculateProductsViewed(events);

    if (productsViewed === 0) return 0;

    // Convert to seconds
    return (sessionDurationMinutes * 60) / productsViewed;
}

// ============================================================================
// AGGREGATE METRICS
// ============================================================================

/**
 * Calculate aggregate metrics across multiple sessions
 */
export function calculateAggregateMetrics(
    sessionMetrics: SessionMetrics[],
    scope: 'store' | 'category',
    scopeTarget: string
): {
    avg_products_viewed: number;
    avg_session_duration: number;
    avg_view_to_cart_rate: number;
    avg_same_category_ratio: number;
    avg_category_switches: number;
    avg_price_range_cv: number;
    avg_return_views: number;
    avg_search_count: number;
    total_sessions: number;
} {
    const count = sessionMetrics.length;

    if (count === 0) {
        return {
            avg_products_viewed: 0,
            avg_session_duration: 0,
            avg_view_to_cart_rate: 0,
            avg_same_category_ratio: 0,
            avg_category_switches: 0,
            avg_price_range_cv: 0,
            avg_return_views: 0,
            avg_search_count: 0,
            total_sessions: 0,
        };
    }

    return {
        avg_products_viewed:
            sessionMetrics.reduce((sum, m) => sum + m.products_viewed, 0) / count,
        avg_session_duration:
            sessionMetrics.reduce((sum, m) => sum + m.session_duration_minutes, 0) / count,
        avg_view_to_cart_rate:
            sessionMetrics.reduce((sum, m) => sum + m.view_to_cart_rate, 0) / count,
        avg_same_category_ratio:
            sessionMetrics.reduce((sum, m) => sum + m.same_category_views_ratio, 0) / count,
        avg_category_switches:
            sessionMetrics.reduce((sum, m) => sum + m.category_switches, 0) / count,
        avg_price_range_cv:
            sessionMetrics.reduce((sum, m) => sum + m.price_range_cv, 0) / count,
        avg_return_views:
            sessionMetrics.reduce((sum, m) => sum + m.return_views, 0) / count,
        avg_search_count:
            sessionMetrics.reduce((sum, m) => sum + m.search_count, 0) / count,
        total_sessions: count,
    };
}
