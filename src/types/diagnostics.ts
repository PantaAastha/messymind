/**
 * Diagnostic Type Definitions
 * 
 * Types for diagnostic sessions, metrics, and results
 */

import type { GA4Event } from './csv';

// ============================================================================
// SESSION METRICS (Calculated from CSV data)
// ============================================================================

export interface SessionMetrics {
    session_id: string;

    // Core metrics
    products_viewed: number;
    add_to_cart_count: number;
    session_duration_minutes: number;

    // Derived metrics
    view_to_cart_rate: number;
    same_category_views_ratio: number;
    category_switches: number;

    // Price analysis
    price_range_cv: number; // Coefficient of Variation
    viewed_prices: number[];

    // Engagement patterns
    return_views: number; // Products viewed multiple times
    search_count: number;
    avg_time_per_product: number; // seconds

    // Category data
    categories_viewed: string[];
    primary_category?: string;

    // Trust & Risk Metrics (New)
    reached_checkout: number; // 0 or 1
    completed_purchase: number; // 0 or 1
    has_intent: number; // 0 or 1
    policy_views: number;
    review_interactions: number;
    fit_guide_views: number;
    brand_trust_views: number;
    time_on_cart_checkout: number; // minutes

    // Composite Metrics (for Rules Engine)
    total_reassurance_touches: number;
    policy_brand_views: number;
    negative_review_focus: number; // 0 or 1 placeholder
}

// ============================================================================
// AGGREGATE METRICS (Store/Category level)
// ============================================================================

export interface AggregateMetrics {
    scope: "store" | "category";
    scope_target: string; // Category name or "All products"

    total_sessions: number;
    date_range_start: string;
    date_range_end: string;

    // Averages
    avg_products_viewed: number;
    avg_session_duration: number;
    avg_view_to_cart_rate: number;
    avg_same_category_ratio: number;
    avg_category_switches: number;
    avg_price_range_cv: number;
    avg_return_views: number;
    avg_search_count: number;

    // Distribution
    sessions_by_confidence?: {
        high: number;
        medium: number;
        low: number;
        none: number;
    };
}

// ============================================================================
// DIAGNOSIS OUTPUT
// ============================================================================

export interface DiagnosisOutput {
    pattern_id: string;
    label: string;

    confidence: "high" | "medium" | "low";
    confidence_score: number; // 0-100

    category: string; // e.g., "Decision Friction"
    severity: "critical" | "warning" | "healthy";

    scope: "store" | "category" | "segment";
    scope_target: string;

    summary: string; // 1-2 sentence description

    primary_drivers: string[]; // Array of driver IDs
    driver_info?: { id: string; label: string; description: string }[]; // Enriched details

    evidence_metrics: EvidenceMetrics;
    benchmark_comparison: BenchmarkComparison;
    estimated_impact: EstimatedImpact;

    priority_score: number; // 0-100

    intervention_recommendations: InterventionRecommendations;

    example_sessions: ExampleSession[];

    data_quality: DataQuality;
}

export interface EvidenceMetrics {
    avg_products_viewed_per_session: number;
    avg_same_category_ratio: number;
    avg_view_to_cart_rate: number;
    avg_session_duration_minutes: number;
    pct_sessions_flagged: number; // 0-1

    // Optional supporting metrics
    avg_return_views?: number;
    avg_search_count?: number;
    avg_price_range_cv?: number;

    // Additional context
    affected_session_count: number;
    total_sessions_analyzed: number;
}

export interface BenchmarkComparison {
    your_view_to_cart_rate: string; // e.g., "4.2%"
    industry_benchmark: string; // e.g., "6-11%"
    deviation: string; // e.g., "-38% below benchmark"
    category_benchmark?: string;
}

export interface EstimatedImpact {
    affected_sessions: string; // e.g., "22% of Running Shoes traffic"
    affected_session_count: number;
    potential_uplift_range: string; // e.g., "15-25% improvement"
    estimated_monthly_revenue_impact?: string;
}

export interface InterventionRecommendations {
    primary: InterventionRecommendation;
    secondary: InterventionRecommendation;
    all_interventions: InterventionRecommendation[]; // List of all relevant interventions
    all_relevant_buckets: string[]; // IDs
}

export interface InterventionRecommendation {
    bucket: string; // Intervention bucket ID
    label: string;
    description: string;
    why_it_works: string;
    rationale: string;
    quick_wins: string[];
    triggered_by?: string[]; // Labels of drivers that triggered this
}

export interface ExampleSession {
    session_id: string;
    products_viewed: number;
    same_category_ratio: number;
    session_minutes: number;
    cart_adds: number;
    confidence: "high" | "medium" | "low";
    key_behavior: string; // Human-readable summary
}

export interface DataQuality {
    sample_size: number;
    flagged_count: number;
    date_range: string;
    coverage: "complete" | "partial";
    missing_metrics?: string[];
}

// ============================================================================
// DIAGNOSTIC SESSION (Database record)
// ============================================================================

export interface DiagnosticSession {
    id: string;
    user_id: string;
    name: string;
    data_source: "csv_upload";
    date_range_start: string;
    date_range_end: string;

    // Raw uploaded data
    raw_data: GA4Event[];
    data_quality: DataQuality;

    // Calculated metrics
    session_metrics: SessionMetrics[];
    aggregate_metrics: AggregateMetrics[];

    created_at: string;
    updated_at: string;
}

// ============================================================================
// DIAGNOSTIC RESULT (Database record)
// ============================================================================

export interface DiagnosticResult {
    id: string;
    session_id: string;
    pattern_id: string;

    // Full diagnosis output
    diagnosis: DiagnosisOutput;

    created_at: string;
}

// ============================================================================
// SAVED REPORT
// ============================================================================

export interface SavedReport {
    id: string;
    user_id: string;
    diagnostic_session_id: string;
    name: string;
    snapshot_data: {
        session: DiagnosticSession;
        results: DiagnosticResult[];
    };
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}
