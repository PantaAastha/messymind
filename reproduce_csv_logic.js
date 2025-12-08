
// Mock parsing of CSV data for Session 1
const session1Events = [
    { event_name: 'view_item', event_timestamp: '2025-12-01T08:00:00.000Z', page_location: '/product/item_Casual_Sneakers_1' },
    { event_name: 'view_item', event_timestamp: '2025-12-01T08:01:00.000Z', page_location: '/product/item_Casual_Sneakers_2' },
    { event_name: 'page_view', event_timestamp: '2025-12-01T08:20:00.000Z', page_location: '/policies/returns' },
    { event_name: 'page_view', event_timestamp: '2025-12-01T08:30:00.000Z', page_location: '/policies/shipping' },
    { event_name: 'view_reviews', event_timestamp: '2025-12-01T08:40:00.000Z', page_location: '/product/item_Casual_Sneakers_1#reviews' },
    { event_name: 'view_fit_guide', event_timestamp: '2025-12-01T08:50:00.000Z', page_location: '/fit-guide/casual-sneakers' },
    { event_name: 'add_to_cart', event_timestamp: '2025-12-01T09:00:00.000Z', page_location: '/product/item_Casual_Sneakers_1' },
    { event_name: 'begin_checkout', event_timestamp: '2025-12-01T09:20:00.000Z', page_location: '/checkout' },
    { event_name: 'page_view', event_timestamp: '2025-12-01T09:30:00.000Z', page_location: '/policies/returns' },
    { event_name: 'view_reviews', event_timestamp: '2025-12-01T09:40:00.000Z', page_location: '/product/item_Casual_Sneakers_1#reviews' },
    { event_name: 'page_view', event_timestamp: '2025-12-01T10:10:00.000Z', page_location: '/about' },
    { event_name: 'page_view', event_timestamp: '2025-12-01T10:20:00.000Z', page_location: '/security' }
];

// Re-implement Calculator Logic locally to test regexes
function calculateMetrics(events) {
    const policyViews = events.filter(e => e.page_location && /refund|return|shipping|terms|privacy|guarantee/i.test(e.page_location)).length;

    // Regex from calculator.ts: e.page_location && /review/i.test(e.page_location)
    // Note: 'view_reviews' event name check was: (e.event_name && /review/i.test(e.event_name))
    const reviewInteractions = events.filter(e =>
        (e.event_name && /review/i.test(e.event_name)) ||
        (e.page_location && /review/i.test(e.page_location))
    ).length;

    const fitGuideViews = events.filter(e => e.page_location && /size-guide|fit-guide|sizing/i.test(e.page_location)).length;

    const brandTrustViews = events.filter(e => e.page_location && /about|story|mission|security|certified/i.test(e.page_location)).length;

    const reachedCheckout = events.some(e => e.event_name === 'begin_checkout' || (e.page_location && /\/checkout/i.test(e.page_location))) ? 1 : 0;
    const completedPurchase = events.some(e => e.event_name === 'purchase') ? 1 : 0;
    const hasIntent = (events.some(e => e.event_name === 'add_to_cart') || reachedCheckout) ? 1 : 0;

    const totalReassuranceTouches = policyViews + reviewInteractions + fitGuideViews + brandTrustViews;
    const policyBrandViews = policyViews + brandTrustViews;

    return {
        policyViews,
        reviewInteractions,
        fitGuideViews,
        brandTrustViews,
        reachedCheckout,
        completedPurchase,
        hasIntent,
        totalReassuranceTouches,
        policyBrandViews
    };
}

const results = calculateMetrics(session1Events);
console.log('Results:', results);

// Verify thresholds against pattern
const passTrs = (results.hasIntent === 1 && results.completedPurchase === 0 && results.totalReassuranceTouches >= 3);
// Note: time_on_cart_checkout also needs to be >= 3 minutes.
// In the mock data:
// First checkout/cart event: begin_checkout at 09:20
// Last relevant event could be inferred if we track time.
// Let's check regexes mainly here.

console.log('Passes Rule TRS (>3 touches):', passTrs);
