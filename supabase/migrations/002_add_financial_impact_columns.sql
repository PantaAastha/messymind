-- Add Phase 1 financial impact columns to diagnostic_results table

ALTER TABLE diagnostic_results
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('critical', 'warning', 'healthy')),
ADD COLUMN IF NOT EXISTS revenue_at_risk NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS journey_timeline JSONB,
ADD COLUMN IF NOT EXISTS aov_is_placeholder BOOLEAN DEFAULT false;

-- Add conversion rate columns (improved calculation)
ALTER TABLE diagnostic_results
ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(6,4),
ADD COLUMN IF NOT EXISTS conversion_is_calculated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_potential_revenue NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS intent_session_count INTEGER DEFAULT 0;

-- Add index for revenue_at_risk for faster sorting
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_revenue_at_risk 
ON diagnostic_results(revenue_at_risk DESC);

-- Add index for severity
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_severity 
ON diagnostic_results(severity);
