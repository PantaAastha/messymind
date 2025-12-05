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
        const userId = `user_${Math.floor(i / 3) + 1}`; // Some users have multiple sessions

        // Determine session behavior
        const rand = Math.random();
        let sessionType: 'comparison_paralysis' | 'trust_risk' | 'normal';

        if (rand < comparisonParalysisRate) {
            sessionType = 'comparison_paralysis';
        } else if (rand < comparisonParalysisRate + trustRiskRate) {
            sessionType = 'trust_risk';
        } else {
            sessionType = 'normal';
        }

        // Generate session events based on type
        const sessionEvents = generateSessionEvents(
            sessionId,
            userId,
            sessionType,
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
    sessionType: 'comparison_paralysis' | 'trust_risk' | 'normal',
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
        // High exploration, no commitment
        const productCount = 7 + Math.floor(Math.random() * 5); // 7-11 products
        const sameCategoryRatio = 0.7 + Math.random() * 0.2; // 70-90%

        for (let i = 0; i < productCount; i++) {
            const category = Math.random() < sameCategoryRatio ? primaryCategory :
                categories[Math.floor(Math.random() * categories.length)];

            const itemId = `item_${category.replace(/\s/g, '_')}_${Math.floor(Math.random() * 100)}`;
            const price = 50 + Math.random() * 100; // Similar price range

            // View event
            events.push({
                session_id: sessionId,
                event_name: 'view_item',
                event_timestamp: new Date(timestamp).toISOString(),
                item_id: itemId,
                item_name: `${category} Product ${i + 1}`,
                item_category: category,
                item_price: Math.round(price * 100) / 100,
                page_location: `/product/${itemId}`,
                user_pseudo_id: userId,
            });

            timestamp += 30000 + Math.random() * 60000; // 30-90 seconds per product

            // Some revisits
            if (Math.random() < 0.3) {
                events.push({
                    session_id: sessionId,
                    event_name: 'view_item',
                    event_timestamp: new Date(timestamp).toISOString(),
                    item_id: itemId,
                    item_name: `${category} Product ${i + 1}`,
                    item_category: category,
                    item_price: Math.round(price * 100) / 100,
                    page_location: `/product/${itemId}`,
                    user_pseudo_id: userId,
                });
                timestamp += 20000 + Math.random() * 40000;
            }
        }

        // Add some searches
        const searchCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < searchCount; i++) {
            events.push({
                session_id: sessionId,
                event_name: 'search',
                event_timestamp: new Date(timestamp).toISOString(),
                search_term: primaryCategory.toLowerCase(),
                page_location: '/search',
                user_pseudo_id: userId,
            });
            timestamp += 15000 + Math.random() * 30000;
        }

        // No cart add (key indicator of paralysis)

    } else if (sessionType === 'trust_risk') {
        // High intent but drops at checkout
        const productCount = 3 + Math.floor(Math.random() * 3); // 3-5 products

        for (let i = 0; i < productCount; i++) {
            const category = i === 0 ? primaryCategory :
                (Math.random() < 0.7 ? primaryCategory : categories[Math.floor(Math.random() * categories.length)]);

            const itemId = `item_${category.replace(/\s/g, '_')}_${Math.floor(Math.random() * 100)}`;
            const price = 60 + Math.random() * 80;

            events.push({
                session_id: sessionId,
                event_name: 'view_item',
                event_timestamp: new Date(timestamp).toISOString(),
                item_id: itemId,
                item_name: `${category} Product ${i + 1}`,
                item_category: category,
                item_price: Math.round(price * 100) / 100,
                page_location: `/product/${itemId}`,
                user_pseudo_id: userId,
            });

            timestamp += 40000 + Math.random() * 60000;
        }

        // Add to cart
        const mainItem = `item_${primaryCategory.replace(/\s/g, '_')}_1`;
        events.push({
            session_id: sessionId,
            event_name: 'add_to_cart',
            event_timestamp: new Date(timestamp).toISOString(),
            item_id: mainItem,
            item_name: `${primaryCategory} Product 1`,
            item_category: primaryCategory,
            item_price: 79.99,
            page_location: `/product/${mainItem}`,
            user_pseudo_id: userId,
        });

        timestamp += 30000;

        // View cart
        events.push({
            session_id: sessionId,
            event_name: 'view_cart',
            event_timestamp: new Date(timestamp).toISOString(),
            page_location: '/cart',
            user_pseudo_id: userId,
        });

        timestamp += 60000;

        // Check policies (trust deficit signal)
        events.push({
            session_id: sessionId,
            event_name: 'page_view',
            event_timestamp: new Date(timestamp).toISOString(),
            page_location: '/policies/returns',
            page_title: 'Return Policy',
            user_pseudo_id: userId,
        });

        timestamp += 45000;

        events.push({
            session_id: sessionId,
            event_name: 'page_view',
            event_timestamp: new Date(timestamp).toISOString(),
            page_location: '/policies/shipping',
            page_title: 'Shipping Information',
            user_pseudo_id: userId,
        });

        timestamp += 30000;

        // View reviews (social proof seeking)
        events.push({
            session_id: sessionId,
            event_name: 'view_reviews',
            event_timestamp: new Date(timestamp).toISOString(),
            item_id: mainItem,
            page_location: `/product/${mainItem}#reviews`,
            user_pseudo_id: userId,
        });

        timestamp += 90000;

        // Begin checkout
        events.push({
            session_id: sessionId,
            event_name: 'begin_checkout',
            event_timestamp: new Date(timestamp).toISOString(),
            page_location: '/checkout',
            user_pseudo_id: userId,
        });

        timestamp += 120000;

        // But no purchase (drops off)

    } else {
        // Normal session - quick browse and purchase
        const productCount = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < productCount; i++) {
            const category = primaryCategory;
            const itemId = `item_${category.replace(/\s/g, '_')}_${Math.floor(Math.random() * 100)}`;
            const price = 70 + Math.random() * 60;

            events.push({
                session_id: sessionId,
                event_name: 'view_item',
                event_timestamp: new Date(timestamp).toISOString(),
                item_id: itemId,
                item_name: `${category} Product ${i + 1}`,
                item_category: category,
                item_price: Math.round(price * 100) / 100,
                page_location: `/product/${itemId}`,
                user_pseudo_id: userId,
            });

            timestamp += 25000 + Math.random() * 35000;
        }

        // Quick add to cart and purchase
        const mainItem = `item_${primaryCategory.replace(/\s/g, '_')}_1`;
        events.push({
            session_id: sessionId,
            event_name: 'add_to_cart',
            event_timestamp: new Date(timestamp).toISOString(),
            item_id: mainItem,
            item_name: `${primaryCategory} Product 1`,
            item_category: primaryCategory,
            item_price: 89.99,
            page_location: `/product/${mainItem}`,
            user_pseudo_id: userId,
        });

        timestamp += 20000;

        events.push({
            session_id: sessionId,
            event_name: 'begin_checkout',
            event_timestamp: new Date(timestamp).toISOString(),
            page_location: '/checkout',
            user_pseudo_id: userId,
        });

        timestamp += 60000;

        events.push({
            session_id: sessionId,
            event_name: 'purchase',
            event_timestamp: new Date(timestamp).toISOString(),
            item_id: mainItem,
            item_name: `${primaryCategory} Product 1`,
            item_category: primaryCategory,
            item_price: 89.99,
            page_location: '/checkout/success',
            user_pseudo_id: userId,
        });
    }

    return events;
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
