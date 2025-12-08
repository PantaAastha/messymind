
// Import necessary modules (mocking implementations for standalone execution)

// --- MOCK CONSTANTS & HELPERS ---
const ALL_PATTERNS = []; // Will inject patterns here

// --- MOCK CALCULATOR LOGIC (Copied from calculator.ts) ---
function calculateSessionMetrics(sessionId, events) {
    const viewEvents = events.filter(e => e.event_name === 'view_item');
    const add_to_cart_count = events.filter(e => e.event_name === 'add_to_cart').length;

    // --- Trust & Risk Metrics ---
    const policyViews = events.filter(e => e.page_location && /refund|return|shipping|terms|privacy|guarantee/i.test(e.page_location)).length;
    const reviewInteractions = events.filter(e => (e.event_name && /review/i.test(e.event_name)) || (e.page_location && /review/i.test(e.page_location))).length;
    const fitGuideViews = events.filter(e => e.page_location && /size-guide|fit-guide|sizing/i.test(e.page_location)).length;
    const brandTrustViews = events.filter(e => e.page_location && /about|story|mission|security|certified/i.test(e.page_location)).length;

    const reachedCheckout = events.some(e => e.event_name === 'begin_checkout' || (e.page_location && /\/checkout/i.test(e.page_location))) ? 1 : 0;
    const completedPurchase = events.some(e => e.event_name === 'purchase') ? 1 : 0;

    const hasIntent = (add_to_cart_count > 0 || reachedCheckout > 0) ? 1 : 0;

    // Composite Metrics
    const totalReassuranceTouches = policyViews + reviewInteractions + fitGuideViews + brandTrustViews;
    const policyBrandViews = policyViews + brandTrustViews;

    // Time on Cart/Checkout logic
    const cartCheckoutEvents = events.filter(e => e.page_location && /(\/cart|\/checkout)/i.test(e.page_location));
    let timeOnCartCheckout = 0;
    if (cartCheckoutEvents.length > 1) {
        const first = new Date(cartCheckoutEvents[0].event_timestamp).getTime();
        const last = new Date(cartCheckoutEvents[cartCheckoutEvents.length - 1].event_timestamp).getTime();
        timeOnCartCheckout = (last - first) / 60000;
    }

    return {
        session_id: sessionId,
        products_viewed: viewEvents.length,
        add_to_cart_count,
        has_intent: hasIntent,
        reached_checkout: reachedCheckout,
        completed_purchase: completedPurchase,
        total_reassurance_touches: totalReassuranceTouches,
        policy_brand_views: policyBrandViews,
        policy_views: policyViews,
        review_interactions: reviewInteractions,
        fit_guide_views: fitGuideViews,
        brand_trust_views: brandTrustViews,
        time_on_cart_checkout: timeOnCartCheckout,
        negative_review_focus: 0 // Placeholder
    };
}

// --- MOCK RULES ENGINE LOGIC (Copied from rulesEngine.ts) ---
function evaluatePattern(pattern, metrics) {
    let totalScore = 0;
    const triggeredRules = [];

    for (const rule of pattern.detection_rules.rules) {
        const result = evaluateRule(rule, metrics);
        if (result.triggered) {
            totalScore += result.weight;
            triggeredRules.push(result.id);
        }
    }

    const { high, medium, low } = pattern.detection_rules.confidence_thresholds;
    let confidence = 'none';

    if (totalScore >= high) confidence = 'high';
    else if (totalScore >= medium) confidence = 'medium';
    else if (totalScore >= low) confidence = 'low';

    return { detected: confidence !== 'none', confidence, score: totalScore, triggeredRules };
}

function evaluateRule(rule, metrics) {
    const allMet = rule.conditions.every(c => evaluateCondition(c, metrics));
    return { id: rule.id, triggered: allMet, weight: rule.weight };
}

function evaluateCondition(condition, metrics) {
    const val = metrics[condition.metric]; // Direct access for mock
    if (val === undefined) return false;

    switch (condition.operator) {
        case '>': return val > condition.value;
        case '>=': return val >= condition.value;
        case '<': return val < condition.value;
        case '<=': return val <= condition.value;
        case '==': return val === condition.value;
        default: return false;
    }
}

// --- PATTERN DEFINITION (Trust Risk) ---
const trustRiskPattern = {
    label: 'Trust Risk Social Proof',
    detection_rules: {
        rules: [
            {
                id: 'rule_t1', // Trust Deficit
                conditions: [
                    { metric: 'has_intent', operator: '==', value: 1 },
                    { metric: 'reached_checkout', operator: '==', value: 1 },
                    { metric: 'completed_purchase', operator: '==', value: 0 },
                    { metric: 'policy_brand_views', operator: '>=', value: 2 },
                    { metric: 'time_on_cart_checkout', operator: '>=', value: 2 } // Note: Unit minutes ignored in mock
                ],
                weight: 30
            },
            {
                id: 'rule_trs', // Multi-Channel Loop
                conditions: [
                    { metric: 'has_intent', operator: '==', value: 1 },
                    { metric: 'completed_purchase', operator: '==', value: 0 },
                    { metric: 'total_reassurance_touches', operator: '>=', value: 5 },
                    { metric: 'time_on_cart_checkout', operator: '>=', value: 3 }
                ],
                weight: 40
            }
        ],
        confidence_thresholds: { high: 70, medium: 40, low: 25 }
    }
};

// --- DATA GENERATOR (Simulated Output) ---
function generateMockEvents() {
    const events = [];
    const baseTime = new Date('2025-01-01T10:00:00Z').getTime();
    let t = baseTime;

    // Simulate High Severity Trust/Risk Session
    // 1. Add to cart
    events.push({ event_name: 'add_to_cart', event_timestamp: new Date(t).toISOString(), page_location: '/product/1' });
    t += 60000;

    // 2. View Policy (Return)
    events.push({ event_name: 'page_view', event_timestamp: new Date(t).toISOString(), page_location: '/return-policy' });
    t += 60000;

    // 3. View About Us
    events.push({ event_name: 'page_view', event_timestamp: new Date(t).toISOString(), page_location: '/about-us' });
    t += 60000;

    // 4. View Reviews
    events.push({ event_name: 'view_reviews', event_timestamp: new Date(t).toISOString(), page_location: '/product/1#reviews' });
    t += 60000;

    // 5. Begin Checkout
    events.push({ event_name: 'begin_checkout', event_timestamp: new Date(t).toISOString(), page_location: '/checkout' });
    t += 180000; // 3 minutes later

    // 6. Still on Checkout (implied exit later)
    events.push({ event_name: 'page_view', event_timestamp: new Date(t).toISOString(), page_location: '/checkout/payment' });

    return events;
}


// --- EXECUTION ---
const events = generateMockEvents();
const metrics = calculateSessionMetrics('mock_session', events);
const result = evaluatePattern(trustRiskPattern, metrics);

console.log('Metrics:', JSON.stringify(metrics, null, 2));
console.log('Detection Result:', result);

if (!result.detected) {
    console.log('FAIL: Pattern should have been detected.');
} else {
    console.log('PASS: Pattern detected!');
}
