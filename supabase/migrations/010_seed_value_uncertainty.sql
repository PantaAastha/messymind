-- Migration to insert Value Uncertainty pattern
-- This pattern detects shoppers who have cart intent but hesitate due to price/value concerns
-- Post-intent stage with saturation threshold of 55

-- Insert or update Value Uncertainty pattern
INSERT INTO patterns (
    pattern_id,
    label,
    category,
    description,
    inputs_schema,
    detection_rules,
    driver_definitions,
    intervention_buckets,
    intervention_mapping,
    metadata
)
VALUES (
    'value_uncertainty',
    'Value Uncertainty / Price Hesitation',
    'Post-Intent Hesitation',
    'Shoppers are interested but hesitate because they question if the product is "worth it" at the final price. They stall in the cart, hunt for deals (visiting sale pages), or check shipping policies, often abandoning when the total cost is realized.',
    -- inputs_schema
    '{
        "essential": [
            {
                "id": "add_to_cart_count",
                "label": "Add-to-Cart Events",
                "description": "Number of add_to_cart events per session",
                "source": "ga4",
                "calculation": "count(add_to_cart events)",
                "required": true
            },
            {
                "id": "view_cart_count",
                "label": "View Cart Events",
                "description": "Number of times user viewed cart page",
                "source": "ga4",
                "calculation": "count(view_cart events)",
                "required": true
            },
            {
                "id": "shipping_policy_views",
                "label": "Shipping/Tax Policy Views",
                "description": "Views of shipping, delivery, or tax policy pages",
                "source": "ga4",
                "calculation": "count(page_view where url contains /shipping OR /delivery OR /taxes)",
                "required": true
            },
            {
                "id": "sale_page_views",
                "label": "Sale/Clearance Page Views",
                "description": "Views of sale, clearance, or promotions pages",
                "source": "ga4",
                "calculation": "count(page_view where url contains /sale OR /clearance OR /promotions)",
                "required": true
            },
            {
                "id": "cart_stall_duration",
                "label": "Time Spent on Cart Page",
                "description": "Time user spent viewing cart (in seconds)",
                "source": "ga4",
                "calculation": "time_on_page for view_cart events",
                "required": true
            },
            {
                "id": "products_viewed",
                "label": "Products Viewed",
                "description": "Total products viewed in session",
                "source": "ga4",
                "calculation": "count(unique item_id with view_item event)",
                "required": true
            },
            {
                "id": "completed_purchase",
                "label": "Purchase Completed",
                "description": "Whether purchase was completed (0 or 1)",
                "source": "ga4",
                "calculation": "count(purchase events) > 0 ? 1 : 0",
                "required": true
            }
        ],
        "high_value": [
            {
                "id": "reached_checkout",
                "label": "Reached Checkout",
                "description": "Whether user started checkout process (0 or 1)",
                "source": "ga4",
                "calculation": "count(begin_checkout) > 0 ? 1 : 0",
                "required": false
            }
        ]
    }'::jsonb,
    -- detection_rules
    '{
        "rules": [
            {
                "id": "rule_a",
                "name": "The Sticker Shock (Cart Bounce)",
                "description": "User adds to cart, sees the total, and leaves immediately or checks policies",
                "conditions": [
                    {"metric": "add_to_cart_count", "operator": ">=", "value": 1},
                    {"metric": "view_cart_count", "operator": ">=", "value": 1},
                    {"metric": "completed_purchase", "operator": "==", "value": 0},
                    {"metric": "shipping_policy_views", "operator": ">=", "value": 1}
                ],
                "weight": 40
            },
            {
                "id": "rule_b",
                "name": "The Deal Hunter",
                "description": "User is actively navigating to Sale/Clearance pages but not converting",
                "conditions": [
                    {"metric": "sale_page_views", "operator": ">=", "value": 2},
                    {"metric": "products_viewed", "operator": ">=", "value": 3},
                    {"metric": "completed_purchase", "operator": "==", "value": 0}
                ],
                "weight": 30
            },
            {
                "id": "rule_c",
                "name": "The Cart Staller",
                "description": "User lingers in the cart (likely googling coupons) or returns to cart repeatedly",
                "conditions": [
                    {"metric": "view_cart_count", "operator": ">=", "value": 2},
                    {"metric": "cart_stall_duration", "operator": ">=", "value": 45, "unit": "seconds"},
                    {"metric": "completed_purchase", "operator": "==", "value": 0}
                ],
                "weight": 30
            }
        ],
        "confidence_thresholds": {
            "high": 75,
            "medium": 40,
            "low": 20
        },
        "saturation_threshold": 55,
        "bonus_conditions": [
            {
                "description": "High Cart Loops (3+ cart views)",
                "condition": {"metric": "view_cart_count", "operator": ">=", "value": 3},
                "points": 5
            },
            {
                "description": "Checkout Dropoff (reached checkout but didn''t complete)",
                "condition": {"metric": "reached_checkout", "operator": "==", "value": 1},
                "points": 5
            }
        ]
    }'::jsonb,
    -- driver_definitions
    '[
        {
            "id": "total_cost_shock",
            "label": "Total Cost Shock",
            "description": "User is surprised or concerned by the final price including shipping/taxes",
            "detection_conditions": [
                {"metric": "shipping_policy_views", "operator": ">=", "value": 1}
            ]
        },
        {
            "id": "deal_hunting_loop",
            "label": "Deal Hunting Loop",
            "description": "User is actively looking for discounts or better prices",
            "detection_conditions": [
                {"metric": "sale_page_views", "operator": ">=", "value": 2}
            ]
        },
        {
            "id": "cart_hesitation",
            "label": "Cart Hesitation",
            "description": "User repeatedly views cart or dwells for extended time",
            "detection_conditions": [
                {"metric": "view_cart_count", "operator": ">=", "value": 2}
            ]
        },
        {
            "id": "policy_checking",
            "label": "Policy Checking",
            "description": "User checking shipping, return, or tax policies before committing",
            "detection_conditions": [
                {"metric": "shipping_policy_views", "operator": ">=", "value": 1}
            ]
        }
    ]'::jsonb,
    -- intervention_buckets
    '[
        {
            "id": "reduce_cost_friction",
            "name": "Reduce Cost Friction",
            "what_it_does": "Soften the blow of the final price by making shipping/taxes clear upfront or offering free shipping thresholds.",
            "why_it_works": "Reduces \"sticker shock\" at checkout. Transparency builds trust. Free shipping thresholds encourage higher AOV to justify the total cost.",
            "implementation_examples": [
                "Free Shipping Progress Bar (\"Add $X more for free shipping\")",
                "Upfront Tax Calculation (show total early)",
                "Shipping cost calculator on product page",
                "Free shipping badge on products that qualify"
            ]
        },
        {
            "id": "value_reinforcement",
            "name": "Value Reinforcement",
            "what_it_does": "Justify the price before they bail by reinforcing product value, quality, guarantees, and social proof right in the cart/checkout.",
            "why_it_works": "Addresses the \"is this worth it?\" question at the moment of doubt. Reduces buyer''s remorse and justifies the investment.",
            "implementation_examples": [
                "\"Why it''s worth it\" bullets in Cart (quality, features, benefits)",
                "\"Satisfaction Guarantee\" badge near total",
                "Social proof in checkout (\"5,847 customers love this\")",
                "Comparison: \"Costs less than X per use\""
            ]
        },
        {
            "id": "smart_incentives",
            "name": "Smart Incentives",
            "what_it_does": "Close the perceived value gap for deal hunters with strategic, contextual discounts or bundles.",
            "why_it_works": "Gives price-sensitive shoppers a reason to buy now. Reduces abandonment by meeting their \"deal-seeking\" expectation without devaluing your brand.",
            "implementation_examples": [
                "Exit intent: \"5% off if you complete checkout now\"",
                "\"Bundle & Save\" upsell in cart",
                "First-time buyer discount at checkout",
                "Time-limited offer for cart items"
            ]
        }
    ]'::jsonb,
    -- intervention_mapping
    '{
        "rules": [
            {
                "condition": {"drivers_include": ["total_cost_shock"]},
                "primary": "reduce_cost_friction",
                "secondary": "value_reinforcement"
            },
            {
                "condition": {"drivers_include": ["deal_hunting_loop"]},
                "primary": "smart_incentives",
                "secondary": "reduce_cost_friction"
            },
            {
                "condition": {"drivers_include": ["cart_hesitation"]},
                "primary": "value_reinforcement",
                "secondary": "smart_incentives"
            }
        ],
        "default_primary": "value_reinforcement",
        "default_secondary": "reduce_cost_friction"
    }'::jsonb,
    -- metadata
    '{
        "behavioral_stage": "post_intent",
        "expected_conversion_rate": 0.30,
        "version": "1.0.0",
        "created_date": "2025-12-17"
    }'::jsonb
)
ON CONFLICT (pattern_id) 
DO UPDATE SET
    label = EXCLUDED.label,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    inputs_schema = EXCLUDED.inputs_schema,
    detection_rules = EXCLUDED.detection_rules,
    driver_definitions = EXCLUDED.driver_definitions,
    intervention_buckets = EXCLUDED.intervention_buckets,
    intervention_mapping = EXCLUDED.intervention_mapping,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
