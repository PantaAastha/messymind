/**
 * Comparison Paralysis Pattern Definition
 * 
 * Complete knowledge base entry for the Comparison Paralysis behavioral pattern
 */

import type { Pattern } from '@/types/pattern';

export const comparisonParalysisPattern: Pattern = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    pattern_id: 'comparison_paralysis',
    label: 'Comparison Paralysis',
    category: 'Decision Friction',
    description: 'Shoppers actively explore multiple products (high engagement, genuine interest) but fail to commit to a purchase decision, remaining stuck in the exploration loop. They view many items, spend time evaluating details, but their view-to-cart conversion rate is significantly below normal—signaling they\'re overwhelmed by choices and lack clear decision criteria to narrow options and move forward.',
    behavioral_stage: 'pre_intent', // Occurs before add_to_cart - prevents intent formation
    expected_conversion_rate: 0.03, // 3% - conservative for browsing behavior

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
                id: 'add_to_cart_count',
                label: 'Add-to-Cart Events',
                description: 'Number of add_to_cart events per session',
                source: 'ga4',
                calculation: 'count(add_to_cart events)',
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
                id: 'category_switches',
                label: 'Category Switches',
                description: 'Number of category transitions in session',
                source: 'ga4',
                calculation: 'count(unique category transitions)',
                required: true,
            },
            {
                id: 'pogo_stick_count',
                label: 'Pogo Stick Count',
                description: 'Number of times user viewed a product, then returned to the previous list/category within 60s',
                source: 'calculated',
                calculation: 'count(sequence: view_item -> (inferred list) -> view_item)',
                required: true,
            },
            // {
            //     id: 'price_range_variance',
            //     label: 'Price Range Variance',
            //     description: 'Coefficient of variation of viewed product prices',
            //     source: 'calculated',
            //     calculation: 'std_dev(prices) / mean(prices)',
            //     required: true,
            // },
            {
                id: 'price_spread_ratio', // Renamed from price_range_variance
                label: 'Price Spread Ratio',
                description: 'Ratio of price difference to minimum price',
                source: 'calculated',
                calculation: '(max(prices) - min(prices)) / min(prices)', // Much easier math
                required: true,
            }
        ],
        high_value: [
            {
                id: 'time_per_product',
                label: 'Time per Product Page',
                description: 'Average time spent on each product page',
                source: 'ga4',
                calculation: 'time between consecutive events on page_location',
                required: false,
            },
            {
                id: 'return_views',
                label: 'Return to Product Pages',
                description: 'Products viewed multiple times in session',
                source: 'ga4',
                calculation: 'count(item_id viewed > 1 time)',
                required: false,
            },
            {
                id: 'search_count',
                label: 'Search Query Count',
                description: 'Number of internal search events',
                source: 'ga4',
                calculation: 'count(search events)',
                required: false,
            },
            {
                id: 'evaluation_interaction_count',
                label: 'Evaluation Interactions',
                description: 'Count of active research actions: reading reviews, checking size guide, shipping info',
                source: 'ga4',
                calculation: 'count(events: view_reviews, view_size_guide, view_shipping_info, view_refund_policy)',
                required: false,
            },
            {
                id: 'same_category_views_ratio',
                label: 'Same Category Focus',
                description: 'Percentage of product views that happened in the user\'s top category',
                source: 'calculated',
                calculation: 'max(views_in_single_category) / total_products_viewed',
                required: true,
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
                name: 'High Exploration, No Commitment',
                description: 'User spent a long time comparing multiple similar products but never committed to cart',
                conditions: [
                    { metric: 'products_viewed', operator: '>=', value: 5 },
                    { metric: 'same_category_views_ratio', operator: '>=', value: 0.60 },
                    { metric: 'session_duration_minutes', operator: '>=', value: 5 },
                    { metric: 'add_to_cart_count', operator: '==', value: 0 },
                    { metric: 'category_switches', operator: '<=', value: 2 },
                    { metric: 'evaluation_interaction_count', operator: '>=', value: 1 }, // Ensures they are actually evaluating, not just scrolling
                ],
                weight: 40,
            },
            {
                id: 'rule_b',
                name: 'Below-Normal View→Cart Conversion',
                description: 'User viewed more products than usual but converted to cart below global norms (6–11%)',
                conditions: [
                    { metric: 'products_viewed', operator: '>=', value: 5 },
                    { metric: 'view_to_cart_rate', operator: '<', value: 0.05 },
                    { metric: 'session_duration_minutes', operator: '>=', value: 3 },
                ],
                weight: 30,
            },
            {
                id: 'rule_c',
                name: 'Revisit & Search-Cycle Indecision',
                description: 'User keeps revisiting and searching, but never progresses to a decision',
                conditions: [
                    { metric: 'products_viewed', operator: '>=', value: 5 },
                    { metric: 'return_views', operator: '>=', value: 1 },
                    { metric: 'search_count', operator: '>=', value: 2 },
                    { metric: 'add_to_cart_count', operator: '==', value: 0 },
                ],
                weight: 30,
            },
            {
                id: 'rule_d', // New Rule
                name: 'The List Vacillator',
                description: 'User rapidly switches between products in the same category (Pogo-sticking)',
                conditions: [
                    { metric: 'pogo_stick_count', operator: '>=', value: 3 },
                    { metric: 'add_to_cart_count', operator: '==', value: 0 },
                    { metric: 'same_category_views_ratio', operator: '>=', value: 0.8 },
                ],
                weight: 35,
            }
        ],
        confidence_thresholds: {
            high: 70,
            medium: 40,
            low: 25,
        },
        bonus_conditions: [
            {
                description: 'Extended time per product (deep evaluation)',
                condition: { metric: 'avg_time_per_product', operator: '>', value: 60, unit: 'seconds' },
                points: 3,
            },
            {
                description: 'Narrow price band comparison (fine-grained tradeoffs)',
                condition: { metric: 'price_range_cv', operator: '<', value: 0.20 },
                points: 3,
            },
            {
                description: 'Multiple product revisits',
                condition: { metric: 'return_views', operator: '>=', value: 2 },
                points: 2,
            },
            {
                description: 'Multiple search refinements',
                condition: { metric: 'search_count', operator: '>=', value: 3 },
                points: 2,
            },
        ],
    },

    // ============================================================================
    // PRIMARY DRIVERS
    // ============================================================================
    driver_definitions: [
        {
            id: 'high_exploration_breadth',
            label: 'High Exploration Breadth',
            description: 'User views many different products in a single session',
            detection_conditions: [
                { metric: 'products_viewed', operator: '>=', value: 7 },
            ],
        },
        {
            id: 'deep_within_category',
            label: 'Deep Within Category',
            description: 'User views many products within the same category/collection',
            detection_conditions: [
                { metric: 'same_category_views_ratio', operator: '>=', value: 0.70 },
            ],
        },
        {
            id: 'zero_cart_commitment',
            label: 'Zero Cart Commitment',
            description: 'No add-to-cart events despite high viewing',
            detection_conditions: [
                { metric: 'add_to_cart_count', operator: '==', value: 0 },
                { metric: 'products_viewed', operator: '>=', value: 5 },
            ],
        },
        {
            id: 'partial_cart_commitment',
            label: 'Partial Cart Commitment',
            description: 'Some cart adds but still below threshold (<5% conversion rate)',
            detection_conditions: [
                { metric: 'view_to_cart_rate', operator: '>', value: 0 },
                { metric: 'view_to_cart_rate', operator: '<', value: 0.05 },
            ],
        },
        {
            id: 'extended_session_time',
            label: 'Extended Session Time',
            description: 'Session duration is significantly longer than normal (5+ minutes)',
            detection_conditions: [
                { metric: 'session_duration_minutes', operator: '>=', value: 5 },
            ],
        },
        {
            id: 'revisit_same_products',
            label: 'Revisit Same Products',
            description: 'User returns to one or more of the same product pages in the same session',
            detection_conditions: [
                { metric: 'return_views', operator: '>=', value: 2 },
            ],
        },
        {
            id: 'search_looping',
            label: 'Search Looping',
            description: 'Multiple internal searches within a session (refining or rethinking criteria)',
            detection_conditions: [
                { metric: 'search_count', operator: '>=', value: 2 },
            ],
        },
        {
            id: 'narrow_price_band_comparison',
            label: 'Narrow Price Band Comparison',
            description: 'User compares products in a tight price range (CV < 0.20), suggesting fine-grained tradeoffs',
            detection_conditions: [
                { metric: 'price_range_cv', operator: '<', value: 0.20 },
                { metric: 'products_viewed', operator: '>=', value: 3 },
            ],
        },
        {
            id: 'broad_price_band_confusion',
            label: 'Broad Price Band Confusion',
            description: 'User jumps between very different price points for similar items (unclear budget/quality anchor)',
            detection_conditions: [
                { metric: 'price_range_cv', operator: '>', value: 0.50 },
            ],
        },
        {
            id: 'category_back_and_forth',
            label: 'Category Back and Forth',
            description: 'User bounces between closely related categories or subcollections',
            detection_conditions: [
                { metric: 'category_switches', operator: '>=', value: 3 },
            ],
        },
    ],

    // ============================================================================
    // INTERVENTION BUCKETS
    // ============================================================================
    intervention_buckets: [
        {
            id: 'curation_defaults',
            name: 'Curation & Defaults',
            what_it_does: 'Highlight a small set of "Top Picks", "Editor\'s Picks", or "Staff Favorites". Offer 1–3 default options (e.g. "Best for Beginners", "Best Value", "Premium Choice"). Create curated collections that reduce effective choice set.',
            why_it_works: 'Reduces choice overload by shrinking the effective decision set. Provides a "safe" default, lowering regret aversion ("if it\'s the recommended one, it\'s probably fine"). Authority bias: "if experts recommend it, it\'s probably fine".',
            implementation_examples: [
                '"Most Popular" badge on top 3 products',
                '"Our Pick" section above product grid',
                'Filter preset: "Show me the bestsellers"',
            ],
        },
        {
            id: 'decision_aids',
            name: 'Decision Aids & Comparison Helpers',
            what_it_does: 'Simple comparison tables, spec summaries, side-by-side comparison. "Compare" buttons, feature badges ("Waterproof", "Wide Fit", "Vegan"). "Why choose this" explainer per product.',
            why_it_works: 'Turns vague "too many options" into clearer tradeoffs. Supports shoppers in creating a decision rule ("I just need A + B, not C"). Reduces cognitive load through structured information.',
            implementation_examples: [
                '"Compare" checkbox on product cards',
                'Comparison table with green checkmarks for key features',
                'Filterable specs: "Show only waterproof options"',
            ],
        },
        {
            id: 'social_proof',
            name: 'Social Proof Guidance',
            what_it_does: '"Most popular in this category", "Frequently bought instead of X", "Customers like you chose…". Review snippets surfaced near CTAs.',
            why_it_works: 'Leverages herd behavior and social proof to shortcut overthinking. Reduces personal responsibility for the decision ("others chose this, so it\'s probably okay").',
            implementation_examples: [
                'Star rating + review count on product cards',
                '"Trending now" badge',
                '"Others who compared these bought..." section',
            ],
        },
        {
            id: 'attribute_simplification',
            name: 'Attribute & Option Simplification',
            what_it_does: 'Clean up filters and options: fewer, clearer filters that match how people think (e.g. "Terrain: Road / Trail / Gym"). Hide rarely used variants behind "Show more options". Use customer language for filters (not technical jargon).',
            why_it_works: 'Lowers cognitive load by aligning options with real mental models. Matches how people naturally categorize. Makes it easier to narrow down without feeling overwhelmed.',
            implementation_examples: [
                'Filter by use case: "Running: Road / Trail / Gym"',
                'Visual filters: color swatches instead of text list',
                'Smart defaults: "Most relevant" sorting',
            ],
        },
        {
            id: 'anchoring_best_value',
            name: 'Anchoring & "Best Value" Framing',
            what_it_does: 'Show a clearly marked "Best Value" or "Most Popular" price point. Use one higher-priced option to make mid-tier options feel safer. Price breakdown: "Only $X per use".',
            why_it_works: 'Uses anchoring to give a reference point for "reasonable" choice. Reduces the feeling of "what if I could get something slightly better for a bit more?" Makes one choice feel obviously "right".',
            implementation_examples: [
                '"Best Value" tag on mid-tier product',
                'Price comparison: "Save $X vs. [competitor]"',
                '"Only $2/day" cost breakdown',
            ],
        },
        {
            id: 'commitment_nudge',
            name: 'Commitment Nudge (Light, Non-Pushy)',
            what_it_does: 'Gentle prompts after multiple views: "Ready to try this one?" "Add to compare" → "Add to cart" progression. Save-for-later / wishlist for highly viewed items. Exit-intent: "Still deciding? Save these for later".',
            why_it_works: 'Helps break the "infinite evaluation" loop with a low-stakes step. Turns a vague browser into someone who\'s at least experimenting with commitment. Creates sense of progress.',
            implementation_examples: [
                'After 3+ product views: "You\'ve been looking at this for a while—want to try it?"',
                '"Save for later" button on product cards',
                'Exit-intent popup with wishlist option',
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
                    drivers_include_all: ['high_exploration_breadth', 'zero_cart_commitment'],
                },
                primary: 'curation_defaults',
                secondary: 'decision_aids',
            },
            {
                condition: {
                    drivers_include_all: ['high_exploration_breadth', 'deep_within_category'],
                },
                primary: 'decision_aids',
                secondary: 'social_proof',
            },
            {
                condition: {
                    drivers_include: ['narrow_price_band_comparison'],
                },
                primary: 'decision_aids',
                secondary: 'anchoring_best_value',
            },
            {
                condition: {
                    drivers_include: ['broad_price_band_confusion'],
                },
                primary: 'curation_defaults',
                secondary: 'anchoring_best_value',
            },
            {
                condition: {
                    drivers_include: ['revisit_same_products', 'search_looping'],
                },
                primary: 'decision_aids',
                secondary: 'commitment_nudge',
            },
            {
                condition: {
                    drivers_include_all: ['extended_session_time', 'partial_cart_commitment'],
                },
                primary: 'commitment_nudge',
                secondary: 'social_proof',
            },
            {
                condition: {
                    drivers_include: ['category_back_and_forth'],
                },
                primary: 'attribute_simplification',
                secondary: 'curation_defaults',
            },
        ],
        default_primary: 'curation_defaults',
        default_secondary: 'social_proof',
    },
};
