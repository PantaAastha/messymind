-- Fix RLS Policy for Pattern Seeding
-- Run this in Supabase SQL Editor to allow pattern insertion

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Patterns are insertable by authenticated users" ON patterns;

-- Create a new policy that allows anyone to insert patterns
-- (This is safe since patterns are knowledge base data, not user data)
CREATE POLICY "Patterns are insertable by anyone"
  ON patterns FOR INSERT
  WITH CHECK (true);

-- Also update the update policy
DROP POLICY IF EXISTS "Patterns are updatable by authenticated users" ON patterns;

CREATE POLICY "Patterns are updatable by anyone"
  ON patterns FOR UPDATE
  USING (true);
