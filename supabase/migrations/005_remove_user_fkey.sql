-- Remove foreign key constraint on user_id for MVP
-- This allows using placeholder user_id without authentication

-- Drop the foreign key constraint
ALTER TABLE diagnostic_sessions 
DROP CONSTRAINT IF EXISTS diagnostic_sessions_user_id_fkey;

-- Note: In production, you'll want to re-add this constraint:
-- ALTER TABLE diagnostic_sessions 
-- ADD CONSTRAINT diagnostic_sessions_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
