/**
 * Pattern Type Definitions
 * 
 * Core types for the pattern-based knowledge system
 */

// ============================================================================
// PATTERN STRUCTURE
// ============================================================================

export interface Pattern {
  id: string;
  pattern_id: string; // e.g., "comparison_paralysis"
  label: string; // e.g., "Comparison Paralysis"
  category: string; // e.g., "Decision Friction"
  description: string;
  behavioral_stage: 'pre_intent' | 'post_intent'; // NEW: When pattern occurs in user journey
  expected_conversion_rate: number; // Stage-specific conversion rate (e.g., 0.03 for pre-intent, 0.30 for post-intent)
  inputs_schema: InputsSchema;
  detection_rules: DetectionRules;
  driver_definitions: DriverDefinition[];
  intervention_buckets: InterventionBucket[];
  intervention_mapping: InterventionMappingConfig;
  embedding?: number[]; // For future AI/RAG
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// INPUTS SCHEMA
// ============================================================================

export interface InputsSchema {
  essential: MetricDefinition[];
  high_value: MetricDefinition[];
}

export interface MetricDefinition {
  id: string; // e.g., "products_viewed"
  label: string;
  description: string;
  source: "ga4" | "shopify" | "calculated";
  calculation?: string; // Human-readable formula
  required: boolean;
}

// ============================================================================
// DETECTION RULES
// ============================================================================

export interface DetectionRules {
  rules: Rule[];
  confidence_thresholds: ConfidenceThresholds;
  bonus_conditions?: BonusCondition[];
}

export interface Rule {
  id: string; // "rule_a", "rule_b", "rule_c"
  name: string;
  description: string;
  conditions: Condition[];
  weight: number; // Points awarded if triggered
}

export interface Condition {
  metric: string; // Metric ID
  operator: ">" | ">=" | "<" | "<=" | "==" | "!=";
  value: number;
  unit?: string;
}

export interface ConfidenceThresholds {
  high: number; // e.g., 70
  medium: number; // e.g., 40
  low: number; // e.g., 25
}

export interface BonusCondition {
  description: string;
  condition: Condition;
  points: number;
  max_total?: number; // Max bonus points from all conditions
}

// ============================================================================
// PRIMARY DRIVERS
// ============================================================================

export interface DriverDefinition {
  id: string; // e.g., "high_exploration_breadth"
  label: string;
  description: string;
  detection_conditions: Condition[];
}

// ============================================================================
// INTERVENTIONS
// ============================================================================

export interface InterventionBucket {
  id: string; // e.g., "curation_defaults"
  name: string;
  what_it_does: string;
  why_it_works: string;
  implementation_examples: string[];
}

export interface InterventionMappingConfig {
  rules: InterventionMappingRule[];
  default_primary: string;
  default_secondary: string;
}

export interface InterventionMappingRule {
  condition: {
    drivers_include?: string[]; // Any of these drivers
    drivers_include_all?: string[]; // All of these drivers
  };
  primary: string; // Intervention bucket ID
  secondary: string;
}
