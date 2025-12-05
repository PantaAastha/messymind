-- ============================================================================
-- Messy Mind Diagnostic Tool - Database Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for future AI/RAG (optional for now)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- PATTERNS TABLE
-- Knowledge base for behavioral patterns
-- ============================================================================

CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id TEXT UNIQUE NOT NULL, -- e.g., "comparison_paralysis"
  label TEXT NOT NULL, -- e.g., "Comparison Paralysis"
  category TEXT NOT NULL, -- e.g., "Decision Friction"
  description TEXT NOT NULL,
  
  -- Pattern structure (JSONB for flexibility)
  inputs_schema JSONB NOT NULL,
  detection_rules JSONB NOT NULL,
  driver_definitions JSONB NOT NULL,
  intervention_buckets JSONB NOT NULL,
  intervention_mapping JSONB NOT NULL,
  
  -- Future AI/RAG support (commented out until vector extension is enabled)
  -- embedding VECTOR(1536), -- Nullable, for semantic search
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for pattern lookups
CREATE INDEX idx_patterns_pattern_id ON patterns(pattern_id);
CREATE INDEX idx_patterns_category ON patterns(category);

-- ============================================================================
-- DIAGNOSTIC SESSIONS TABLE
-- User analysis sessions
-- ============================================================================

CREATE TABLE diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data_source TEXT NOT NULL DEFAULT 'csv_upload',
  date_range_start DATE,
  date_range_end DATE,
  
  -- Raw uploaded data
  raw_data JSONB NOT NULL,
  data_quality JSONB,
  
  -- Calculated metrics
  session_metrics JSONB,
  aggregate_metrics JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_diagnostic_sessions_user_id ON diagnostic_sessions(user_id);
CREATE INDEX idx_diagnostic_sessions_created_at ON diagnostic_sessions(created_at DESC);

-- ============================================================================
-- DIAGNOSTIC RESULTS TABLE
-- Pattern detection results
-- ============================================================================

CREATE TABLE diagnostic_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  pattern_id TEXT NOT NULL REFERENCES patterns(pattern_id) ON DELETE CASCADE,
  
  -- Detection output
  detected BOOLEAN NOT NULL DEFAULT false,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  scope TEXT NOT NULL CHECK (scope IN ('store', 'category', 'segment')),
  scope_target TEXT NOT NULL,
  
  -- Evidence and recommendations (full diagnosis output as JSONB)
  primary_drivers TEXT[],
  evidence_metrics JSONB NOT NULL,
  benchmark_comparison JSONB,
  example_sessions JSONB,
  
  -- Interventions
  primary_intervention JSONB,
  secondary_intervention JSONB,
  all_relevant_buckets TEXT[],
  
  -- Impact
  estimated_impact JSONB,
  priority_score NUMERIC(5,2) CHECK (priority_score >= 0 AND priority_score <= 100),
  
  summary TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_diagnostic_results_session_id ON diagnostic_results(session_id);
CREATE INDEX idx_diagnostic_results_pattern_id ON diagnostic_results(pattern_id);
CREATE INDEX idx_diagnostic_results_detected ON diagnostic_results(detected);
CREATE INDEX idx_diagnostic_results_confidence ON diagnostic_results(confidence);

-- ============================================================================
-- SAVED REPORTS TABLE
-- User-saved reports
-- ============================================================================

CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostic_session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  snapshot_data JSONB NOT NULL, -- Full report snapshot
  is_favorite BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_saved_reports_user_id ON saved_reports(user_id);
CREATE INDEX idx_saved_reports_session_id ON saved_reports(diagnostic_session_id);
CREATE INDEX idx_saved_reports_is_favorite ON saved_reports(is_favorite);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- Patterns table is publicly readable (no RLS needed for reads)
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- Patterns: Public read access
CREATE POLICY "Patterns are viewable by everyone"
  ON patterns FOR SELECT
  USING (true);

-- Patterns: Admin-only write access (you can add admin role check later)
CREATE POLICY "Patterns are insertable by authenticated users"
  ON patterns FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Patterns are updatable by authenticated users"
  ON patterns FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Diagnostic Sessions: Users can only access their own sessions
CREATE POLICY "Users can view their own diagnostic sessions"
  ON diagnostic_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnostic sessions"
  ON diagnostic_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnostic sessions"
  ON diagnostic_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagnostic sessions"
  ON diagnostic_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Diagnostic Results: Users can only access results for their sessions
CREATE POLICY "Users can view results for their sessions"
  ON diagnostic_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert results for their sessions"
  ON diagnostic_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.user_id = auth.uid()
    )
  );

-- Saved Reports: Users can only access their own reports
CREATE POLICY "Users can view their own saved reports"
  ON saved_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved reports"
  ON saved_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved reports"
  ON saved_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved reports"
  ON saved_reports FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_patterns_updated_at
  BEFORE UPDATE ON patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnostic_sessions_updated_at
  BEFORE UPDATE ON diagnostic_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_reports_updated_at
  BEFORE UPDATE ON saved_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
