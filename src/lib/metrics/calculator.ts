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
import { parseTimestamp } from '@/lib/csv/parser';

/**
 * Calculate metrics for a single session
 */
export function calculateSessionMetrics(
    sessionId: string,
    events: GA4Event[]
): SessionMetrics {
    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => {
        const dateA = parseTimestamp(a.event_timestamp);
        const dateB = parseTimestamp(b.event_timestamp);
        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    });

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
    // Session duration
    const timestamps = events
        .map(e => parseTimestamp(e.event_timestamp)?.getTime())
        .filter((t): t is number => t !== undefined && !isNaN(t));
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

    // Pogo stick count - rapid product-to-list bounces
    // Approximation: count view_item events that are followed by another view_item within 60s but different item
    let pogo_stick_count = 0;
    for (let i = 0; i < sortedEvents.length - 1; i++) {
        const current = sortedEvents[i];
        const next = sortedEvents[i + 1];
        if (current.event_name === 'view_item' && next.event_name === 'view_item' && current.item_id !== next.item_id) {
            const currentTime = parseTimestamp(current.event_timestamp)?.getTime() || 0;
            const nextTime = parseTimestamp(next.event_timestamp)?.getTime() || 0;
            if (nextTime - currentTime <= 60000) { // Within 60 seconds
                pogo_stick_count++;
            }
        }
    }

    // Evaluation interaction count - research actions (reviews, size guides, policies, shipping info)
    const evaluationEvents = events.filter(e =>
        (e.page_location && /review|size-guide|fit-guide|sizing|shipping|refund|return/i.test(e.page_location)) ||
        (e.event_name && /review|size_guide|fit_guide|shipping|refund/i.test(e.event_name))
    );
    const evaluation_interaction_count = evaluationEvents.length;

    // --- Trust & Risk Metrics Calculation ---

    // Policy Views - check ALL events, not just view_item events
    const policyViews = events.filter(e =>
        e.page_location && /refund|return|shipping|terms|privacy|guarantee|taxes/i.test(e.page_location)
    ).length;

    // Review Interactions
    const reviewInteractions = events.filter(e =>
        (e.event_name && /review/i.test(e.event_name)) ||
        (e.page_location && /review/i.test(e.page_location))
    ).length;

    // Fit Guide Views
    const fitGuideViews = viewEvents.filter(e =>
        e.page_location && /size-guide|fit-guide|sizing/i.test(e.page_location)
    ).length;

    // Brand Trust Views
    const brandTrustViews = viewEvents.filter(e =>
        e.page_location && /about|story|mission|security|certified/i.test(e.page_location)
    ).length;

    // Checkout & Purchase
    const reachedCheckout = events.some(e =>
        e.event_name === 'begin_checkout' ||
        (e.page_location && /\/checkout/i.test(e.page_location))
    ) ? 1 : 0;

    const completedPurchase = events.some(e => e.event_name === 'purchase') ? 1 : 0;

    // Intent (Add to cart OR checkout)
    const hasIntent = (add_to_cart_count > 0 || reachedCheckout > 0) ? 1 : 0;

    // Time on Cart/Checkout
    const cartCheckoutEvents = events.filter(e =>
        e.page_location && /(\/cart|\/checkout)/i.test(e.page_location)
    );
    let timeOnCartCheckout = 0;
    if (cartCheckoutEvents.length > 1) {
        const first = parseTimestamp(cartCheckoutEvents[0].event_timestamp)?.getTime() || 0;
        const last = parseTimestamp(cartCheckoutEvents[cartCheckoutEvents.length - 1].event_timestamp)?.getTime() || 0;
        if (first > 0 && last > 0) {
            timeOnCartCheckout = (last - first) / 60000;
        }
    }

    // Composite Metrics
    const totalReassuranceTouches = policyViews + reviewInteractions + fitGuideViews + brandTrustViews;
    const policyBrandViews = policyViews + brandTrustViews;
    const negativeReviewFocus = 0; // Placeholder until sentiment analysis is added

    // --- Ambient Shopping Metrics ---

    // Long Dwell Count - products with >60s viewing time OR viewed multiple times
    // For simplicity, we'll count products that appear in return_views (viewed multiple times)
    const long_dwell_count = return_views;

    // Blog Views - content/editorial page views
    const blog_views = events.filter(e =>
        e.page_location && /\/blog\/|\/journal\/|\/pages\/|\/content\//i.test(e.page_location)
    ).length;

    // Category Count - number of unique categories viewed
    const category_count = categories_viewed.length;

    // Return Sessions 7d - requires cross-session analysis
    // This should be calculated at a higher level (grouping by user_pseudo_id)
    // For now, defaulting to 1 (current session). This will need to be enhanced.
    const return_sessions_7d = 1;

    // --- Value Uncertainty Metrics ---

    // View Cart Count - detect from both view_cart events AND cart page views
    // Standard GA4 doesn't always have view_cart, so we check page_location too
    const viewCartEvents = events.filter(e =>
        e.event_name === 'view_cart' ||
        (e.page_location && /\/cart/i.test(e.page_location) && e.event_name === 'page_view')
    );
    const view_cart_count = viewCartEvents.length;

    // Cart Stall Duration - time spent on cart page in seconds
    // Use the same cart page detection logic
    const cartPageEvents = events.filter(e =>
        e.event_name === 'view_cart' ||
        (e.page_location && /\/cart/i.test(e.page_location))
    );
    let cart_stall_duration = 0;
    if (cartPageEvents.length > 1) {
        const first = parseTimestamp(cartPageEvents[0].event_timestamp)?.getTime() || 0;
        const last = parseTimestamp(cartPageEvents[cartPageEvents.length - 1].event_timestamp)?.getTime() || 0;
        if (first > 0 && last > 0) {
            cart_stall_duration = (last - first) / 1000; // Convert to seconds
        }
    }

    // Sale Page Views - visits to sale/clearance/promotions pages
    const sale_page_views = events.filter(e =>
        e.page_location && /\/sale|\/clearance|\/promotions|\/deals/i.test(e.page_location)
    ).length;

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
        pogo_stick_count,
        evaluation_interaction_count,
        categories_viewed,
        primary_category,
        category_count,
        // Ambient Shopping Metrics
        long_dwell_count,
        blog_views,
        return_sessions_7d,
        // New Metrics
        reached_checkout: reachedCheckout,
        completed_purchase: completedPurchase,
        has_intent: hasIntent,
        policy_views: policyViews,
        review_interactions: reviewInteractions,
        fit_guide_views: fitGuideViews,
        brand_trust_views: brandTrustViews,
        time_on_cart_checkout: Math.round(timeOnCartCheckout * 100) / 100,
        // Value Uncertainty Metrics
        view_cart_count,
        cart_stall_duration: Math.round(cart_stall_duration * 100) / 100,
        sale_page_views,
        // Composite
        total_reassurance_touches: totalReassuranceTouches,
        policy_brand_views: policyBrandViews,
        negative_review_focus: negativeReviewFocus,
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
            avg_add_to_cart_count: 0,
            avg_session_duration_minutes: 0,
            avg_view_to_cart_rate: 0,
            avg_same_category_ratio: 0,
            store_conversion_rate: 0,
            checkout_completion_rate: 0,
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
    const avg_session_duration_minutes = avg(filteredSessions.map(s => s.session_duration_minutes));
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
        avg_add_to_cart_count: 0,
        avg_session_duration_minutes: Math.round(avg_session_duration_minutes * 100) / 100,
        avg_view_to_cart_rate: Math.round(avg_view_to_cart_rate * 100) / 100,
        avg_same_category_ratio: Math.round(avg_same_category_ratio * 100) / 100,
        store_conversion_rate: 0,
        checkout_completion_rate: 0,
        avg_category_switches: Math.round(avg_category_switches * 100) / 100,
        avg_price_range_cv: Math.round(avg_price_range_cv * 100) / 100,
        avg_return_views: Math.round(avg_return_views * 100) / 100,
        avg_search_count: Math.round(avg_search_count * 100) / 100,
    };
}
