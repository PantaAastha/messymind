/**
 * Trust Deficit + Risk/Fit Anxiety + Social Proof Seeking Pattern Definition
 * 
 * Complete knowledge base entry for the Trust/Risk/Social Proof behavioral pattern
 */

import type { Pattern } from '@/types/pattern';

export const trustRiskSocialProofPattern: Pattern = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    pattern_id: 'trust_risk_social_proof',
    label: 'Trust & Risk Anxiety (Social Proof Seeking)',
    category: 'Late-Stage Hesitation',
    description: 'Shoppers get close to buying—adding to cart, visiting checkout, reading policies or reviews—but hesitate or drop off because they\'re not fully sure they can trust the brand, the product, or that it will work/fit for them, so they keep seeking reassurance (reviews, policies, comparisons) instead of completing the purchase.',
    behavioral_stage: 'post_intent', // Occurs after add_to_cart - trust issues prevent conversion
    expected_conversion_rate: 0.30, // 30% - higher for hot leads with purchase intent

    // ============================================================================
    // INPUTS SCHEMA
    // ============================================================================
    inputs_schema: {
        essential: [
            {
                id: 'session_id',
                label: 'Session ID',
                description: 'To see everything that happens in one visit and find late-stage hesitation patterns',
                source: 'ga4',
                calculation: 'session_id from GA4',
                required: true,
            },
            {
                id: 'event_name',
                label: 'Event Name',
                description: 'Especially: add_to_cart, begin_checkout, add_payment_info, purchase, view_cart, view_promotion',
                source: 'ga4',
                calculation: 'event_name field',
                required: true,
            },
            {
                id: 'policy_page_views',
                label: 'Policy / Reassurance Page Views',
                description: 'Custom events or URLs like view_refund_policy, view_shipping_info, view_terms, view_size_guide',
                source: 'ga4',
                calculation: 'count(page_location matches /refund|return|shipping|terms|guarantee|warranty/)',
                required: true,
            },
            {
                id: 'review_interactions',
                label: 'Review & Rating Interactions',
                description: 'Events or URLs for view_reviews, expand_reviews, filter_reviews, sort_by_rating',
                source: 'ga4',
                calculation: 'count(events: view_reviews, expand_reviews, filter_reviews, sort_reviews)',
                required: true,
            },
            {
                id: 'item_id',
                label: 'Item ID / Name / Category',
                description: 'To tie trust/risk behavior to specific products or categories',
                source: 'ga4',
                calculation: 'item_id, item_name, item_category from events',
                required: true,
            },
            {
                id: 'event_timestamp',
                label: 'Event Timestamp',
                description: 'To measure how long they linger on cart/checkout/policy/review pages before dropping',
                source: 'ga4',
                calculation: 'timestamp_micros field',
                required: true,
            },
            {
                id: 'page_location',
                label: 'Page Location / Referrer',
                description: 'To see flows like cart → refund policy → cart → exit',
                source: 'ga4',
                calculation: 'page_location and page_referrer fields',
                required: true,
            },
            {
                id: 'user_pseudo_id',
                label: 'User Pseudo ID',
                description: 'To detect repeated high-intent visits with no purchase across multiple sessions',
                source: 'ga4',
                calculation: 'user_pseudo_id field',
                required: true,
            },
            {
                id: 'checkout_started',
                label: 'Checkout Started',
                description: 'To compute checkout abandonment separate from browse-stage issues',
                source: 'shopify',
                calculation: 'checkout_started event per product/store',
                required: true,
            },
            {
                id: 'checkout_completed',
                label: 'Checkout Completed',
                description: 'To compute checkout abandonment rate',
                source: 'shopify',
                calculation: 'checkout_completed event',
                required: true,
            },
            {
                id: 'cart_abandon_rate',
                label: 'Cart Abandon Rate',
                description: 'To see how often intent turns into second thoughts',
                source: 'shopify',
                calculation: '(cart_created - checkout_started) / cart_created',
                required: true,
            },
            {
                id: 'anxiety_signal_count',
                label: 'Anxiety Signals',
                description: 'Count of explicit trust-seeking actions (Policy, Shipping, Returns, Size Guide)',
                source: 'ga4',
                calculation: 'count(events: view_refund_policy, view_shipping_info, view_size_guide, view_terms)',
                required: true,
            },
            {
                id: 'review_interaction_count',
                label: 'Review Intensity',
                description: 'Count of review-related interactions',
                source: 'ga4',
                calculation: 'count(events: view_reviews)',
                required: true,
            }
        ],
        high_value: [
            {
                id: 'brand_trust_page_views',
                label: 'Brand Trust Page Views',
                description: 'About page, security/payment info, guarantees, certifications',
                source: 'ga4',
                calculation: 'count(page_location matches /about|security|payment-info|guarantee|certifications/)',
                required: false,
            },
            {
                id: 'fit_guide_interaction_depth',
                label: 'Fit Guide Interaction Depth',
                description: 'Time spent, sections viewed, tool usage',
                source: 'ga4',
                calculation: 'time on fit guide pages + interaction events',
                required: false,
            },
            {
                id: 'product_variant_switches',
                label: 'Product Variant Switches',
                description: 'Size/color/model changes before cart add',
                source: 'ga4',
                calculation: 'count(unique product variant changes)',
                required: false,
            },
            {
                id: 'external_review_site_visits',
                label: 'External Review Site Visits',
                description: 'Clicks to third-party review sites during session',
                source: 'ga4',
                calculation: 'count(outbound clicks to review sites)',
                required: false,
            },
            {
                id: 'qna_section_engagement',
                label: 'Q&A Section Engagement',
                description: 'FAQ views, product Q&A interactions',
                source: 'ga4',
                calculation: 'count(FAQ or Q&A page views/interactions)',
                required: false,
            },
            {
                id: 'product_returns_rate',
                label: 'Product Returns / Refund Rate',
                description: 'High returns can fuel legitimate risk anxiety',
                source: 'shopify',
                calculation: 'returns / total_orders per product/category',
                required: false,
            },
            {
                id: 'payment_method_dropoff',
                label: 'Payment Method Dropoff',
                description: 'Signals lack of trust in payment options or perceived security',
                source: 'shopify',
                calculation: 'dropoff at payment selection step',
                required: false,
            },
            {
                id: 'discount_coupon_usage',
                label: 'Discount / Coupon Usage',
                description: 'Can show shoppers trying to reduce perceived risk/cost before committing',
                source: 'shopify',
                calculation: 'coupon application events',
                required: false,
            },
            {
                id: 'support_contact_events',
                label: 'Support Contact Events',
                description: 'Pre-purchase chats/emails with "Does this fit…?" / "What\'s your return policy?"',
                source: 'shopify',
                calculation: 'support contact events tracked via Shopify apps/metadata',
                required: false,
            },
        ],
    },

    // ============================================================================
    // DETECTION RULES
    // ============================================================================
    // detection_rules: {
    //     rules: [
    //         {
    //             id: 'rule_t1',
    //             name: 'Trust Deficit at Checkout',
    //             description: 'They started to buy, checked trust/guarantee signals, then bailed',
    //             conditions: [
    //                 { metric: 'has_intent', operator: '==', value: 1 },
    //                 { metric: 'reached_checkout', operator: '==', value: 1 },
    //                 { metric: 'completed_purchase', operator: '==', value: 0 },
    //                 { metric: 'policy_brand_views', operator: '>=', value: 2 },
    //                 { metric: 'time_on_cart_checkout', operator: '>=', value: 2, unit: 'minutes' },
    //             ],
    //             weight: 30,
    //         },
    //         {
    //             id: 'rule_r1',
    //             name: 'Risk / Fit Anxiety Before Purchase',
    //             description: 'They\'re actively worrying about fit/returnability and still don\'t commit',
    //             conditions: [
    //                 { metric: 'has_intent', operator: '==', value: 1 },
    //                 { metric: 'completed_purchase', operator: '==', value: 0 },
    //                 { metric: 'fit_guide_views', operator: '>=', value: 2 },
    //                 { metric: 'time_on_fit_guide', operator: '>', value: 45, unit: 'seconds' },
    //             ],
    //             weight: 30,
    //         },
    //         {
    //             id: 'rule_s1',
    //             name: 'Social Proof Seeking Instead of Converting',
    //             description: 'They go to reviews for reassurance but never make the decision',
    //             conditions: [
    //                 { metric: 'has_intent', operator: '==', value: 1 },
    //                 { metric: 'completed_purchase', operator: '==', value: 0 },
    //                 { metric: 'review_interactions', operator: '>=', value: 3 },
    //                 { metric: 'negative_review_focus_or_extended_time', operator: '==', value: 1 },
    //             ],
    //             weight: 25,
    //         },
    //         {
    //             id: 'rule_trs',
    //             name: 'Multi-Channel Reassurance Loop',
    //             description: 'They\'re clearly in "make-or-break" mode, seeking multiple reassurances, but still back out',
    //             conditions: [
    //                 { metric: 'has_intent', operator: '==', value: 1 },
    //                 { metric: 'completed_purchase', operator: '==', value: 0 },
    //                 { metric: 'total_reassurance_touches', operator: '>=', value: 3 },
    //                 { metric: 'time_on_cart_checkout', operator: '>=', value: 3, unit: 'minutes' },
    //             ],
    //             weight: 40,
    //         },
    //     ],
    //     confidence_thresholds: {
    //         high: 70,
    //         medium: 40,
    //         low: 25,
    //     },
    //     bonus_conditions: [
    //         {
    //             description: 'Extended time on cart/checkout (deep deliberation)',
    //             condition: { metric: 'time_on_cart_checkout', operator: '>', value: 3, unit: 'minutes' },
    //             points: 3,
    //         },
    //         {
    //             description: 'Pre-purchase support contact',
    //             condition: { metric: 'pre_purchase_support_touches', operator: '>=', value: 1 },
    //             points: 4,
    //         },
    //         {
    //             description: 'Heavy policy scrutiny',
    //             condition: { metric: 'policy_views', operator: '>=', value: 3 },
    //             points: 3,
    //         },
    //         {
    //             description: 'Intensive review consumption',
    //             condition: { metric: 'review_interactions', operator: '>=', value: 5 },
    //             points: 3,
    //         },
    //         {
    //             description: 'Multiple fit guide visits',
    //             condition: { metric: 'fit_guide_views', operator: '>=', value: 2 },
    //             points: 2,
    //         },
    //     ],
    // },
    detection_rules: {
        rules: [
            {
                id: 'rule_t1',
                name: 'The Cold Feet (Checkout Trust Deficit)',
                description: 'User enters checkout but bails after checking policies',
                conditions: [
                    { metric: 'reached_checkout', operator: '==', value: 1 },
                    { metric: 'completed_purchase', operator: '==', value: 0 },
                    // Policy views as anxiety signal
                    { metric: 'policy_views', operator: '>=', value: 1 },
                ],
                weight: 40,
            },
            {
                id: 'rule_r1',
                name: 'Fit Anxiety Loop',
                description: 'User is stuck validating fit/size',
                conditions: [
                    // Checks specifically for size guide interaction
                    { metric: 'fit_guide_views', operator: '>=', value: 1 },
                    { metric: 'products_viewed', operator: '>=', value: 2 },
                    { metric: 'completed_purchase', operator: '==', value: 0 },
                ],
                weight: 30,
            },
            {
                id: 'rule_s1',
                name: 'Social Proof Seeker',
                description: 'User is hunting for validation in reviews',
                conditions: [
                    // Uses review interactions count
                    { metric: 'review_interactions', operator: '>=', value: 2 },
                    { metric: 'completed_purchase', operator: '==', value: 0 },
                ],
                weight: 25,
            }
        ],
        confidence_thresholds: {
            high: 75,   // 75% normalized confidence
            medium: 40, // 40% normalized confidence
            low: 20,    // 20% normalized confidence
        },
        saturation_threshold: 45, // Single strong rule (Rule T1 - Checkout Trust Deficit) triggers 88% confidence - highly sensitive to revenue loss
        // We simplified bonus conditions to match data availability
        bonus_conditions: [
            {
                description: 'High Anxiety (Multiple Policy Checks)',
                condition: { metric: 'policy_views', operator: '>=', value: 3 },
                points: 5,
            },
            {
                description: 'Deep Review Research',
                condition: { metric: 'review_interactions', operator: '>=', value: 4 },
                points: 5,
            }
        ],
    },

    // ============================================================================
    // PRIMARY DRIVERS
    // ============================================================================
    driver_definitions: [
        // Trust-Related Drivers
        {
            id: 'checkout_trust_dropoff',
            label: 'Checkout Trust Dropoff',
            description: 'Shoppers start checkout but abandon after trust-sensitive steps (payment/shipping)',
            detection_conditions: [
                { metric: 'policy_views', operator: '>=', value: 2 },
                { metric: 'reached_checkout', operator: '==', value: 1 },
            ],
        },
        {
            id: 'policy_scrutiny_before_purchase',
            label: 'Policy Scrutiny Before Purchase',
            description: 'They check refund/returns/shipping/terms pages right before dropping',
            detection_conditions: [
                { metric: 'policy_views', operator: '>=', value: 2 },
                { metric: 'reached_checkout', operator: '==', value: 0 },
                { metric: 'has_intent', operator: '==', value: 1 },
            ],
        },
        {
            id: 'brand_reassurance_seeking',
            label: 'Brand Reassurance Seeking',
            description: 'They visit "About", guarantees, security, or brand-story pages during a buying attempt',
            detection_conditions: [
                { metric: 'brand_trust_views', operator: '>=', value: 1 },
            ],
        },

        // Risk / Fit Anxiety Drivers
        {
            id: 'fit_uncertainty_behavior',
            label: 'Fit Uncertainty Behavior',
            description: 'Heavy use of size guides, fit guides, compatibility charts without purchasing',
            detection_conditions: [
                { metric: 'fit_guide_views', operator: '>=', value: 2 },
            ],
        },
        {
            id: 'returns_anxiety_signals',
            label: 'Returns Anxiety Signals',
            description: 'Frequent views of returns/exchanges policy before buying, then abandonment',
            detection_conditions: [
                { metric: 'policy_views', operator: '>=', value: 1 },
                { metric: 'page_includes_return_refund', operator: '==', value: 1 },
            ],
        },
        {
            id: 'variant_hopping_without_commitment',
            label: 'Variant Hopping Without Commitment',
            description: 'Switching between sizes/colors/models repeatedly but not adding to cart or not completing',
            detection_conditions: [
                { metric: 'variant_switches', operator: '>=', value: 3 },
            ],
        },

        // Social Proof Seeking Drivers
        {
            id: 'intensive_review_consumption',
            label: 'Intensive Review Consumption',
            description: 'Reading many reviews, scrolling extensively, or expanding multiple review items',
            detection_conditions: [
                { metric: 'review_interactions', operator: '>=', value: 4 },
            ],
        },
        {
            id: 'negative_review_focus',
            label: 'Negative Review Focus',
            description: 'Filtering or sorting by lowest rating / 1–2 star reviews, then dropping',
            detection_conditions: [
                { metric: 'negative_review_focus', operator: '==', value: 1 },
            ],
        },
        {
            id: 'repeat_review_visits_across_sessions',
            label: 'Repeat Review Visits Across Sessions',
            description: 'Returning to the same product\'s reviews in multiple sessions without buying',
            detection_conditions: [
                { metric: 'repeat_review_visits', operator: '>=', value: 2 },
            ],
        },

        // Combined "High-Intent But Hesitating" Driver
        {
            id: 'multi_channel_reassurance_loop',
            label: 'Multi-Channel Reassurance Loop',
            description: 'In one or more sessions they add to cart / start checkout, then bounce through policies, reviews, fit guides and still don\'t purchase',
            detection_conditions: [
                { metric: 'total_reassurance_touches', operator: '>=', value: 5 },
                { metric: 'has_intent', operator: '==', value: 1 },
                { metric: 'completed_purchase', operator: '==', value: 0 },
            ],
        },
    ],

    // ============================================================================
    // INTERVENTION BUCKETS
    // ============================================================================
    intervention_buckets: [
        {
            id: 'trust_signals_risk_reversal',
            name: 'Trust Signals & Risk Reversal',
            what_it_does: 'Prominent trust badges (secure payment, SSL, verified merchant), "Trusted by X customers" messaging, clear guarantees ("30-day money-back guarantee"), brand story and credentials, real customer photos and testimonials, security certifications visible at checkout.',
            why_it_works: 'Reduces perceived risk about brand credibility. Lowers ambiguity about transaction safety. Authority bias: Certifications = legitimacy. Social proof: "X customers trust us" = herd validation.',
            implementation_examples: [
                'Trust badge bundle at checkout header',
                '"Money-back guarantee" above payment button',
                '"Verified secure checkout" with lock icon',
                'Customer count: "Join 50,000+ happy customers"',
            ],
        },
        {
            id: 'returns_shipping_policy_clarity',
            name: 'Returns, Shipping & Policy Clarity',
            what_it_does: 'Surface policies inline (not buried in footer), simple bullets for returns, exchanges, delivery, clear timelines and costs upfront, no-questions-asked return messaging, highlight free returns/shipping thresholds.',
            why_it_works: 'Decreases risk/fit anxiety by clarifying "what if it goes wrong?". Reduces decision paralysis from policy uncertainty. Transparency bias: Clear = trustworthy.',
            implementation_examples: [
                '"Free 30-day returns" badge on product page',
                'Shipping estimate calculator on cart page',
                'Policy summary box above "Add to Cart"',
                '"Try risk-free for 30 days" messaging',
            ],
        },
        {
            id: 'fit_will_this_work_helpers',
            name: 'Fit & "Will This Work For Me?" Helpers',
            what_it_does: 'Size/fit finding tools and quizzes, detailed measurements and model info, "True to size" indicators from reviews, before/after photos, usage context, AR try-on (if applicable), "Best for..." and "Not ideal for..." guidance.',
            why_it_works: 'Addresses outcome uncertainty. Supports mental simulation (picturing product in their life). Reduces anticipated regret from wrong choice.',
            implementation_examples: [
                '"Find your size" quiz (3 questions)',
                'Model measurements displayed prominently',
                'Customer fit feedback: "Runs small - order size up"',
                'Usage guide: "Best for daily commuting, not trail running"',
            ],
        },
        {
            id: 'social_proof_reassurance_layer',
            name: 'Social Proof & Reassurance Layer',
            what_it_does: 'Surface right social proof at right time, review highlights on product cards, "People like you chose..." filtering, UGC photos prominently displayed, expert/influencer endorsements, "Most bought with this" suggestions, real-time purchase notifications.',
            why_it_works: 'Social proof: Others\' choices validate yours. Similarity bias: "People like me" = relevant. Bandwagon effect: Popular = safer choice. Offloads decision burden to collective wisdom.',
            implementation_examples: [
                '"2,847 bought this month" badge',
                'Filter reviews: "Verified purchases only"',
                'Customer photo gallery on product page',
                '"Featured in [publication]" callout',
                '"Sarah from Seattle bought this 2 hours ago"',
            ],
        },
        {
            id: 'checkout_reassurance_friction_reduction',
            name: 'Checkout Reassurance & Friction Reduction',
            what_it_does: 'Clean, short checkout flow, visible security indicators throughout, clear total costs (no surprise fees), trusted payment method logos, progress indicator, inline guarantee reminders, guest checkout option.',
            why_it_works: 'Reduces process friction at commitment moment. Decreases last-minute doubt through clarity. Sunk cost effect: Progress bar shows investment. Loss aversion: "Don\'t lose your cart items".',
            implementation_examples: [
                'One-page checkout (minimal steps)',
                'Payment logos: Visa, PayPal, Apple Pay',
                '"Your data is encrypted and secure" message',
                'Total cost breakdown before payment entry',
                '"Still covered by our guarantee" reminder',
            ],
        },
        {
            id: 'pre_purchase_support_objection_handling',
            name: 'Pre-Purchase Support & Objection Handling',
            what_it_does: 'Contextual FAQs near decision points, "Still unsure? Chat with us" prompts, quick answers to common questions, "Help me choose" guided flows, pre-filled common questions, real-time chat availability.',
            why_it_works: 'Provides human safety net for edge cases. Resolves objections policies/reviews don\'t cover. Reduces decision anxiety through expert reassurance. Authority bias: Expert guidance = confidence.',
            implementation_examples: [
                'FAQ accordion on product page',
                'Live chat widget: "Questions about fit?"',
                '"Need help deciding?" with comparison tool',
                'Quick answer cards: "How do returns work?"',
                'Video explanation of key features',
            ],
        },
        {
            id: 'post_purchase_assurance_messaging',
            name: 'Post-Purchase Assurance Messaging',
            what_it_does: 'Confirmation page reminders of guarantees, "What to expect next" timeline, easy return/support access highlighted, welcome email with reassurance, first-time buyer extra assurance.',
            why_it_works: 'Calms anticipatory regret ("Did I make a mistake?"). Reduces buyer\'s remorse through reinforcement. Makes it easier to press "Pay Now" knowing support exists. Cognitive dissonance reduction: "I made the right choice".',
            implementation_examples: [
                'Order confirmation: "Love it or return it free"',
                'Email: "Your order is protected by our guarantee"',
                'Timeline: "Arriving in 3-5 days, easy returns within 30"',
                'Support widget: "Questions? We\'re here to help"',
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
                    drivers_include_all: ['fit_uncertainty_behavior', 'returns_anxiety_signals'],
                },
                primary: 'fit_will_this_work_helpers',
                secondary: 'returns_shipping_policy_clarity',
            },
            {
                condition: {
                    drivers_include: ['checkout_trust_dropoff'],
                },
                primary: 'trust_signals_risk_reversal',
                secondary: 'checkout_reassurance_friction_reduction',
            },
            {
                condition: {
                    drivers_include: ['policy_scrutiny_before_purchase'],
                },
                primary: 'returns_shipping_policy_clarity',
                secondary: 'trust_signals_risk_reversal',
            },
            {
                condition: {
                    drivers_include: ['brand_reassurance_seeking'],
                },
                primary: 'trust_signals_risk_reversal',
                secondary: 'social_proof_reassurance_layer',
            },
            {
                condition: {
                    drivers_include_all: ['intensive_review_consumption', 'negative_review_focus'],
                },
                primary: 'social_proof_reassurance_layer',
                secondary: 'pre_purchase_support_objection_handling',
            },
            {
                condition: {
                    drivers_include: ['repeat_review_visits_across_sessions'],
                },
                primary: 'social_proof_reassurance_layer',
                secondary: 'fit_will_this_work_helpers',
            },
            {
                condition: {
                    drivers_include: ['multi_channel_reassurance_loop'],
                },
                primary: 'checkout_reassurance_friction_reduction',
                secondary: 'trust_signals_risk_reversal',
            },
            {
                condition: {
                    drivers_include: ['variant_hopping_without_commitment'],
                },
                primary: 'fit_will_this_work_helpers',
                secondary: 'pre_purchase_support_objection_handling',
            },
        ],
        default_primary: 'trust_signals_risk_reversal',
        default_secondary: 'returns_shipping_policy_clarity',
    },
};
