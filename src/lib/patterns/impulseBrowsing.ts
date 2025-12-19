import { Pattern } from '@/types/pattern';

export const impulseBrowsingPattern: Pattern = {
    id: 'impulse_browsing',
    pattern_id: 'impulse_browsing',
    label: 'Impulse Browsing (Low Intent)',
    category: 'Attention & Intent',
    description: 'Shoppers browse a few items quickly but leave without showing deep purchase intent. These users are often in discovery mode (e.g., from social media) and are not ready to buy yet. The goal is to capture interest (email, wishlist) rather than force a sale.',
    behavioral_stage: 'pre_intent',
    expected_conversion_rate: 0.02,

    inputs_schema: {
        essential: [
            {
                id: 'products_viewed',
                label: 'Products Viewed',
                description: 'Count of unique products viewed',
                source: 'ga4',
                required: true
            },
            {
                id: 'session_duration_minutes',
                label: 'Session Duration',
                description: 'Total session time in minutes',
                source: 'ga4',
                required: true
            },
            {
                id: 'add_to_cart_count',
                label: 'Cart Adds',
                description: 'Number of add-to-cart events',
                source: 'ga4',
                required: true
            }
        ],
        high_value: []
    },

    detection_rules: {
        rules: [
            {
                id: 'short_browse_no_cart',
                name: 'Short Session No Commit',
                description: 'Short session with low views and no cart activity',
                weight: 100,
                conditions: [
                    {
                        metric: 'products_viewed',
                        operator: '<=',
                        value: 3
                    },
                    {
                        metric: 'products_viewed',
                        operator: '>=',
                        value: 1
                    },
                    {
                        metric: 'session_duration_minutes',
                        operator: '<',
                        value: 2
                    },
                    {
                        metric: 'add_to_cart_count',
                        operator: '==',
                        value: 0
                    }
                ]
            }
        ],
        confidence_thresholds: {
            high: 80,
            medium: 50,
            low: 30
        },
        saturation_threshold: 100
    },

    driver_definitions: [
        {
            id: 'short_session',
            label: 'Short Session',
            description: 'Session duration under 2 minutes',
            detection_conditions: [
                {
                    metric: 'session_duration_minutes',
                    operator: '<',
                    value: 2
                }
            ]
        },
        {
            id: 'low_breadth',
            label: 'Low Exploration Breadth',
            description: 'Viewed 1-3 products only',
            detection_conditions: [
                {
                    metric: 'products_viewed',
                    operator: '<=',
                    value: 3
                }
            ]
        },
        {
            id: 'no_commitment',
            label: 'No Cart Commitment',
            description: 'Zero add-to-cart actions',
            detection_conditions: [
                {
                    metric: 'add_to_cart_count',
                    operator: '==',
                    value: 0
                }
            ]
        }
    ],

    intervention_buckets: [
        {
            id: 'soft_capture',
            name: 'Soft Conversion',
            what_it_does: 'Prioritize email capture, wishlist/save-for-later, or social follow over "Buy Now".',
            why_it_works: 'Acknowledges the user is in "discovery mode" and reduces friction by asking for a smaller commitment (email) instead of a big one (purchase).',
            implementation_examples: [
                'Exit-intent pop-up offering a discount for email',
                'Prominent "Save to Wishlist" button',
                'Social proof content (Instagram feed)'
            ]
        },
        {
            id: 'content_nurture',
            name: 'Content-Led Nurture',
            what_it_does: 'Show educational or inspiring content to deepen interest.',
            why_it_works: 'Builds brand affinity and moves user from "Curious" to "Interested" without pressure.',
            implementation_examples: [
                'Blog posts related to viewed category',
                'Style guides or "How to Wear" videos',
                'Brand story video'
            ]
        }
    ],

    intervention_mapping: {
        default_primary: 'soft_capture',
        default_secondary: 'content_nurture',
        rules: []
    },


};
