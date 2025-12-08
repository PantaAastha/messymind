-- Migration to add Triage Dashboard columns to diagnostic_results

ALTER TABLE diagnostic_results
ADD COLUMN category TEXT DEFAULT 'Uncategorized',
ADD COLUMN severity TEXT DEFAULT 'warning';

-- Add check constraint for severity
ALTER TABLE diagnostic_results
ADD CONSTRAINT check_severity CHECK (severity IN ('critical', 'warning', 'healthy'));
