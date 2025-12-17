/**
 * Ambient Shopping / Impulse Browsing Pattern Definition
 * 
 * Complete knowledge base entry for shoppers who browse for inspiration
 * rather than immediate purchase intent
 */

import type { Pattern } from '@/types/pattern';

export const ambientShoppingPattern: Pattern = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    pattern_id: 'ambient_shopping',
    label: 'Impulse Browsing / Ambient Shopping',
    category: 'Pre-Intent Warming',
    description: 'Shoppers browse for inspiration, entertainment, or light intent ("just looking") rather than to buy now. They show meaningful engagement (scrolling, reading content, returning later) but minimal checkout intent. The goal is to warm, capture intent, and create re-entry paths instead of forcing immediate conversion.',
    behavioral_stage: 'pre_intent', // Warming phase - before intent forms
    expected_conversion_rate: 0.03, // 3% - conservative pipeline opportunity

    // ============================================================================
    // INPUTS SCHEMA
    // ============================================================================
    inputs_schema: {
        essential: [
            {
                id: 'products_viewed',
                label: 'Products Viewed per Session',
                description: 'Count of view_item events per session_id',
                source: 'ga4',
                calculation: 'count(unique item_id with view_item event)',
                required: true,
            },
            {
                id: 'session_duration',
                label: 'Session Duration',
                description: 'Time between first and last event in session',
                source: 'ga4',
                calculation: '(last_event_timestamp - first_event_timestamp) / 60',
                required: true,
            },
            {
                id: 'category_count',
                label: 'Unique Categories Viewed',
                description: 'Number of unique product categories viewed',
                source: 'ga4',
                calculation: 'count(unique item_category)',
                required: true,
            },
            {
                id: 'long_dwell_count',
                label: 'Long Dwell Product Count',
                description: 'Products with >60s viewing time or multiple views',
                source: 'calculated',
                calculation: 'count(view_item where time_on_page > 60s OR view_count > 1)',
                required: true,
            },
            {
                id: 'blog_views',
                label: 'Content/Blog Page Views',
                description: 'Count of blog, journal, or content page views',
                source: 'ga4',
                calculation: 'count(page_view where url contains /blog/ or /journal/ or /pages/)',
                required: true,
            },
            {
                id: 'add_to_cart_count',
                label: 'Add-to-Cart Events',
                description: 'Number of add_to_cart events per session',
                source: 'ga4',
                calculation: 'count(add_to_cart events)',
                required: true,
            },
        ],
        high_value: [
            {
                id: 'return_sessions_7d',
                label: 'Returning Sessions (7 days)',
                description: 'Number of sessions for same user within 7 days',
                source: 'ga4',
                calculation: 'count(sessions for user_pseudo_id within 7 days)',
                required: false,
            },
            {
                id: 'avg_time_per_product',
                label: 'Avg Time per Product',
                description: 'Average time spent per product viewed',
                source: 'calculated',
                calculation: '(session_duration * 60) / max(products_viewed, 1)',
                required: false,
            },
        ],
    },

    // ============================================================================
    // DETECTION RULES
    // ============================================================================
    detection_rules: {
        rules: [
            {
                id: 'rule_a',
                name: 'The Mall Walker (Ambient Warming)',
                description: 'Long session, consuming content or dwelling on items, but no cart action',
                conditions: [
                    { metric: 'session_duration_minutes', operator: '>=', value: 3 },
                    { metric: 'products_viewed', operator: '>=', value: 3 },
                    { metric: 'add_to_cart_count', operator: '==', value: 0 },
                    { metric: 'long_dwell_count', operator: '>=', value: 1 },
                ],
                weight: 40,
            },
            {
                id: 'rule_b',
                name: 'The Channel Surfer (Impulse Skimming)',
                description: 'Rapidly jumping between categories, looking for dopamine/inspiration',
                conditions: [
                    { metric: 'category_count', operator: '>=', value: 3 },
                    { metric: 'avg_time_per_product', operator: '<=', value: 35, unit: 'seconds' },
                    { metric: 'products_viewed', operator: '>=', value: 5 },
                    { metric: 'add_to_cart_count', operator: '==', value: 0 },
                ],
                weight: 35,
            },
            {
                id: 'rule_c',
                name: 'Content-First Inspiration',
                description: 'User enters via blog/journal or spends significant time reading brand stories',
                conditions: [
                    { metric: 'blog_views', operator: '>=', value: 1 },
                    { metric: 'products_viewed', operator: '>=', value: 2 },
                    { metric: 'add_to_cart_count', operator: '==', value: 0 },
                ],
                weight: 25,
            },
        ],
        confidence_thresholds: {
            high: 75,   // 75% normalized confidence
            medium: 40, // 40% normalized confidence
            low: 20,    // 20% normalized confidence
        },
        saturation_threshold: 50, // Single strong rule (Rule A) + bonus reaches 100% confidence
        bonus_conditions: [
            {
                description: 'Multiple products with long dwell time',
                condition: { metric: 'long_dwell_count', operator: '>=', value: 3 },
                points: 5,
            },
            {
                description: 'Multiple return sessions (warming)',
                condition: { metric: 'return_sessions_7d', operator: '>=', value: 2 },
                points: 5,
            },
        ],
    },

    // ============================================================================
    // PRIMARY DRIVERS
    // ============================================================================
    driver_definitions: [
        {
            id: 'high_dwell_no_intent',
            label: 'High Dwell, No Intent',
            description: 'User spends time on products but shows no cart commitment',
            detection_conditions: [
                { metric: 'long_dwell_count', operator: '>=', value: 2 },
                { metric: 'add_to_cart_count', operator: '==', value: 0 },
            ],
        },
        {
            id: 'content_consumption',
            label: 'Content Consumption',
            description: 'User engages with blog, editorial, or brand storytelling content',
            detection_conditions: [
                { metric: 'blog_views', operator: '>=', value: 1 },
            ],
        },
        {
            id: 'fast_grazing_skimming',
            label: 'Fast Grazing / Skimming',
            description: 'Rapid browsing with short time per product',
            detection_conditions: [
                { metric: 'avg_time_per_product', operator: '<=', value: 35, unit: 'seconds' },
                { metric: 'products_viewed', operator: '>=', value: 6 },
            ],
        },
        {
            id: 'high_category_hopping',
            label: 'High Category Hopping',
            description: 'User jumps between multiple categories seeking inspiration',
            detection_conditions: [
                { metric: 'category_count', operator: '>=', value: 3 },
            ],
        },
        {
            id: 'returning_visitor_warming',
            label: 'Returning Visitor (Warming)',
            description: 'Multiple non-buying visits within a short timeframe',
            detection_conditions: [
                { metric: 'return_sessions_7d', operator: '>=', value: 2 },
            ],
        },
    ],

    // ============================================================================
    // INTERVENTION BUCKETS
    // ============================================================================
    intervention_buckets: [
        {
            id: 'capture_intent_lightly',
            name: 'Capture Intent Lightly',
            what_it_does: 'Convert browsing energy into a low-friction next step (Email/SMS). Offer ways to save progress without forcing purchase.',
            why_it_works: 'Respects the browsing mindset while creating a future conversion path. Builds a relationship without pressure.',
            implementation_examples: [
                'Email capture tied to "Save this list" or "Get notified"',
                'Back-in-stock / price-drop alerts',
                'Newsletter signup for "More inspiration like this"',
                '"Heart" or wishlist features for items they\'re warming to',
            ],
        },
        {
            id: 'personalized_reentry',
            name: 'Personalized Re-entry',
            what_it_does: 'Make returning feel effortless and relevant. Surface recently viewed items and personalized recommendations.',
            why_it_works: 'Reduces friction for warming visitors who need multiple touches. Shows you remember them.',
            implementation_examples: [
                'Continue browsing (recently viewed) module',
                'Personalized category feed on Homepage',
                '"Welcome back" banner with last viewed items',
                'Email: "You left these items behind"',
            ],
        },
        {
            id: 'inspiration_to_action',
            name: 'Inspiration to Action',
            what_it_does: 'Bridge content consumption to product action without forcing purchase. Make it easy to shop from content.',
            why_it_works: 'Meets users where they are (content mode) and provides a natural path to products.',
            implementation_examples: [
                'Shop the look module on Blog pages',
                'Creator/UGC carousel with product tags',
                'Guides that end with curated picks',
                'Shoppable Instagram feed on site',
            ],
        },
        {
            id: 'reduce_cognitive_load',
            name: 'Reduce Cognitive Load',
            what_it_does: 'Help fast skimmers find a hook quickly. Make browsing more efficient and less overwhelming.',
            why_it_works: 'Speeds up inspiration discovery for channel surfers. Helps them find something interesting faster.',
            implementation_examples: [
                'Visual Category Navigation (Images not Text)',
                'Best Sellers Filter pre-selected',
                'Trending Now rail',
                'Quick view on hover for faster browsing',
            ],
        },
    ],

    // ============================================================================
    // INTERVENTION MAPPING
    // ============================================================================
    intervention_mapping: {
        rules: [
            {
                condition: {
                    drivers_include: ['high_dwell_no_intent'],
                },
                primary: 'capture_intent_lightly',
                secondary: 'personalized_reentry',
            },
            {
                condition: {
                    drivers_include: ['fast_grazing_skimming'],
                },
                primary: 'reduce_cognitive_load',
                secondary: 'capture_intent_lightly',
            },
            {
                condition: {
                    drivers_include: ['content_consumption'],
                },
                primary: 'inspiration_to_action',
                secondary: 'capture_intent_lightly',
            },
            {
                condition: {
                    drivers_include: ['returning_visitor_warming'],
                },
                primary: 'personalized_reentry',
                secondary: 'capture_intent_lightly',
            },
            {
                condition: {
                    drivers_include: ['high_category_hopping'],
                },
                primary: 'reduce_cognitive_load',
                secondary: 'inspiration_to_action',
            },
        ],
        default_primary: 'capture_intent_lightly',
        default_secondary: 'reduce_cognitive_load',
    },
};
