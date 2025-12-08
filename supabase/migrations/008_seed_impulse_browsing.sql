-- Migration to insert Impulse Browsing pattern

INSERT INTO patterns (pattern_id, label, description, category, input_metrics, detection_rules, driver_definitions, intervention_buckets, thresholds)
VALUES (
    'impulse_browsing',
    'Impulse Browsing (Low Intent)',
    'Shoppers browse a few items quickly but leave without showing deep purchase intent. These users are often in discovery mode (e.g., from social media) and are not ready to buy yet.',
    'Attention & Intent',
    '["products_viewed", "session_duration_minutes", "add_to_cart_count"]'::jsonb,
    '[
        {
            "id": "short_browse_no_cart",
            "conditions": [
                { "metric": "products_viewed", "operator": "lte", "value": 3 },
                { "metric": "products_viewed", "operator": "gte", "value": 1 },
                { "metric": "session_duration_minutes", "operator": "lt", "value": 2 },
                { "metric": "add_to_cart_count", "operator": "eq", "value": 0 }
            ],
            "min_confidence": "medium",
            "severity_override": "warning"
        }
    ]'::jsonb,
    '[
        {
            "id": "short_session",
            "label": "Short Session",
            "description": "Session duration under 2 minutes",
            "detection_conditions": [{ "metric": "session_duration_minutes", "operator": "lt", "value": 2 }]
        },
        {
            "id": "low_breadth",
            "label": "Low Exploration Breadth",
            "description": "Viewed 1-3 products only",
            "detection_conditions": [{ "metric": "products_viewed", "operator": "lte", "value": 3 }]
        },
        {
            "id": "no_commitment",
            "label": "No Cart Commitment",
            "description": "Zero add-to-cart actions",
            "detection_conditions": [{ "metric": "add_to_cart_count", "operator": "eq", "value": 0 }]
        }
    ]'::jsonb,
    '[
        {
            "id": "soft_capture",
            "name": "Soft Conversion",
            "what_it_does": "Prioritize email capture, wishlist/save-for-later, or social follow over Buy Now.",
            "why_it_works": "Acknowledges the user is in discovery mode and reduces friction by asking for a smaller commitment.",
            "implementation_examples": ["Exit-intent pop-up", "Wishlist button", "Social proof"]
        },
        {
            "id": "content_nurture",
            "name": "Content-Led Nurture",
            "what_it_does": "Show educational or inspiring content to deepen interest.",
            "why_it_works": "Builds brand affinity and moves user from Curious to Interested.",
            "implementation_examples": ["Blog posts", "Style guides"]
        }
    ]'::jsonb,
    '{
        "min_session_count": 5,
        "min_confidence_score": 60
    }'::jsonb
)
ON CONFLICT (pattern_id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    input_metrics = EXCLUDED.input_metrics,
    detection_rules = EXCLUDED.detection_rules,
    driver_definitions = EXCLUDED.driver_definitions,
    intervention_buckets = EXCLUDED.intervention_buckets,
    thresholds = EXCLUDED.thresholds;
