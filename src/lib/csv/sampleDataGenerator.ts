/**
 * Sample GA4 Data Generator
 * 
 * Generates synthetic GA4 event data for testing the diagnostic tool
 */

import type { GA4Event } from '@/types/csv';

interface GeneratorOptions {
    sessionCount?: number;
    comparisonParalysisRate?: number; // % of sessions with this pattern
    trustRiskRate?: number; // % of sessions with this pattern
}

/**
 * Generate sample GA4 events for testing
 */
export function generateSampleGA4Data(options: GeneratorOptions = {}): GA4Event[] {
    const {
        sessionCount = 30,
        comparisonParalysisRate = 0.3,
        trustRiskRate = 0.25,
    } = options;

    const events: GA4Event[] = [];
    const categories = ['Running Shoes', 'Trail Shoes', 'Casual Sneakers', 'Athletic Wear'];
    const baseDate = new Date('2025-01-01');

    for (let i = 0; i < sessionCount; i++) {
        const sessionId = `session_${i + 1}`;
        const userId = `user_${Math.floor(i / 3) + 1}`;

        // Determine session behavior
        const rand = Math.random();
        let sessionType: 'comparison_paralysis' | 'trust_risk' | 'normal' | 'mixed';

        // Distribution
        if (rand < comparisonParalysisRate) {
            sessionType = 'comparison_paralysis';
        } else if (rand < comparisonParalysisRate + trustRiskRate) {
            sessionType = 'trust_risk';
        } else {
            sessionType = 'normal';
        }

        // Randomize severity (Low, Medium, High)
        const severityRoll = Math.random();
        const severity = severityRoll < 0.33 ? 'low' : severityRoll < 0.66 ? 'medium' : 'high';

        const sessionEvents = generateSessionEvents(
            sessionId,
            userId,
            sessionType,
            severity,
            categories,
            baseDate,
            i
        );

        events.push(...sessionEvents);
    }

    return events;
}

function generateSessionEvents(
    sessionId: string,
    userId: string,
    sessionType: 'comparison_paralysis' | 'trust_risk' | 'normal' | 'mixed',
    severity: 'low' | 'medium' | 'high',
    categories: string[],
    baseDate: Date,
    sessionIndex: number
): GA4Event[] {
    const events: GA4Event[] = [];
    const sessionDate = new Date(baseDate);
    sessionDate.setDate(sessionDate.getDate() + Math.floor(sessionIndex / 2));

    let timestamp = sessionDate.getTime();
    const primaryCategory = categories[Math.floor(Math.random() * categories.length)];

    if (sessionType === 'comparison_paralysis') {
        // --- Comparison Paralysis Logic ---
        // High: 12-20 items, 3+ categories, many switches
        // Medium: 8-12 items, 2 categories
        // Low: 5-8 items, mostly 1 category

        let productCount, sameCategoryRatio, switchChance;

        switch (severity) {
            case 'high': productCount = 12 + Math.floor(Math.random() * 8); sameCategoryRatio = 0.4; switchChance = 0.5; break;
            case 'medium': productCount = 8 + Math.floor(Math.random() * 5); sameCategoryRatio = 0.7; switchChance = 0.3; break;
            case 'low': productCount = 5 + Math.floor(Math.random() * 3); sameCategoryRatio = 0.9; switchChance = 0.1; break;
        }

        let currentCategory = primaryCategory;

        for (let i = 0; i < productCount; i++) {
            // Determine category for this view
            if (Math.random() < switchChance) {
                currentCategory = categories[Math.floor(Math.random() * categories.length)];
            } else if (Math.random() > sameCategoryRatio && currentCategory === primaryCategory) {
                // Drift away occasionally
                currentCategory = categories[Math.floor(Math.random() * categories.length)];
            }

            const itemId = `item_${currentCategory.replace(/\s/g, '_')}_${Math.floor(Math.random() * 20)}`;
            const price = 50 + Math.random() * 100;

            events.push(createViewEvent(sessionId, userId, timestamp, itemId, currentCategory, price, i));
            timestamp += 20000 + Math.random() * 40000;

            // Revisit previous items (paralysis behavior)
            if (severity !== 'low' && Math.random() < 0.3) {
                // Determine a previous item ID randomly (mocking logic)
                const revisitId = itemId; // Simplifying for this generator
                events.push(createViewEvent(sessionId, userId, timestamp + 5000, revisitId, currentCategory, price, i));
                timestamp += 10000;
            }
        }

        // No Add to Cart for severe cases

    } else if (sessionType === 'trust_risk') {
        // --- Trust & Risk Logic ---
        // High: Cart -> Policies -> Reviews -> About -> Checkout -> Exit
        // Medium: Cart -> Policy -> Checkout -> Exit
        // Low: Cart -> Checkout -> Exit

        // 1. View some products first
        for (let i = 0; i < 3; i++) {
            events.push(createViewEvent(sessionId, userId, timestamp, `item_${i}`, primaryCategory, 89.99, i));
            timestamp += 30000;
        }

        // 2. Add to cart
        const mainItem = `item_trust_test`;
        events.push({
            session_id: sessionId,
            event_name: 'add_to_cart',
            event_timestamp: new Date(timestamp).toISOString(),
            item_id: mainItem,
            item_name: 'Premium Runner',
            item_category: primaryCategory,
            item_price: 120.00,
            page_location: `/product/${mainItem}`,
            user_pseudo_id: userId,
        });
        timestamp += 15000;

        // 3. Reassurance Loop
        if (severity === 'high' || severity === 'medium') {
            // View Policy (Refund)
            events.push(createPageEvent(sessionId, userId, timestamp, '/return-policy', 'Return Policy'));
            timestamp += 40000;

            // View Shipping (Critical for hitting >= 2 policy views threshold)
            events.push(createPageEvent(sessionId, userId, timestamp, '/shipping-info', 'Shipping Information'));
            timestamp += 30000;

            if (severity === 'high') {
                // Read Reviews
                events.push({
                    session_id: sessionId,
                    event_name: 'view_reviews',
                    event_timestamp: new Date(timestamp).toISOString(),
                    page_location: `/product/${mainItem}#reviews`,
                    user_pseudo_id: userId,
                });
                timestamp += 60000;

                // Check About/Trust
                events.push(createPageEvent(sessionId, userId, timestamp, '/about-us', 'About Us'));
                timestamp += 25000;
            }
        } else {
            // Low severity - still needs at least one policy to be potentially interesting
            events.push(createPageEvent(sessionId, userId, timestamp, '/return-policy', 'Return Policy'));
            timestamp += 20000;
        }

        // 4. Begin Checkout
        events.push({
            session_id: sessionId,
            event_name: 'begin_checkout',
            event_timestamp: new Date(timestamp).toISOString(),
            page_location: '/checkout',
            user_pseudo_id: userId,
        });
        timestamp += 50000;

        // 5. No Purchase (Dropoff)

    } else {
        // --- Normal Session ---
        // Browses and buys
        events.push(createViewEvent(sessionId, userId, timestamp, 'item_normal', primaryCategory, 50, 1));
        timestamp += 20000;

        events.push({
            session_id: sessionId,
            event_name: 'add_to_cart',
            event_timestamp: new Date(timestamp).toISOString(),
            item_id: 'item_normal',
            item_price: 50,
            page_location: '/product/item_normal',
            user_pseudo_id: userId
        });
        timestamp += 10000;

        events.push({
            session_id: sessionId,
            event_name: 'begin_checkout',
            event_timestamp: new Date(timestamp).toISOString(),
            page_location: '/checkout',
            user_pseudo_id: userId
        });
        timestamp += 30000;

        events.push({
            session_id: sessionId,
            event_name: 'purchase',
            event_timestamp: new Date(timestamp).toISOString(),
            item_id: 'item_normal',
            item_price: 50,
            page_location: '/checkout/success',
            user_pseudo_id: userId
        });
    }

    return events;
}

// Helper to create view_item event
function createViewEvent(sid: string, uid: string, time: number, iid: string, cat: string, price: number, idx: number): GA4Event {
    return {
        session_id: sid,
        event_name: 'view_item',
        event_timestamp: new Date(time).toISOString(),
        item_id: iid,
        item_name: `${cat} Product ${idx}`,
        item_category: cat,
        item_price: Math.round(price * 100) / 100,
        page_location: `/product/${iid}`,
        user_pseudo_id: uid,
    };
}

// Helper to create page_view event
function createPageEvent(sid: string, uid: string, time: number, path: string, title: string): GA4Event {
    return {
        session_id: sid,
        event_name: 'page_view',
        event_timestamp: new Date(time).toISOString(),
        page_location: path,
        page_title: title,
        user_pseudo_id: uid
    };
}

/**
 * Convert GA4 events to CSV string
 */
export function eventsToCSV(events: GA4Event[]): string {
    const headers = [
        'session_id',
        'event_name',
        'event_timestamp',
        'item_id',
        'item_name',
        'item_category',
        'item_price',
        'page_location',
        'page_title',
        'search_term',
        'user_pseudo_id',
    ];

    const rows = [headers.join(',')];

    for (const event of events) {
        const row = headers.map(header => {
            const value = event[header as keyof GA4Event];
            if (value === undefined || value === null) return '';
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return String(value);
        });
        rows.push(row.join(','));
    }

    return rows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string = 'sample_ga4_data.csv') {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
