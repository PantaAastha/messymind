# Security Checklist - Before Production

## Current Status

### ✅ Implemented
- **Authentication**: Login/signup pages working
- **Middleware**: Auth checks enabled
- **New tables**: `action_item_progress` has proper RLS
- **API Routes**: Using real `auth.uid()`

### ⚠️ Still Needs Fixing

#### **RLS Policies on Core Tables** (CRITICAL)

The following tables still use **"allow all"** policies from MVP development:
- `diagnostic_sessions` 
- `diagnostic_results`
- `patterns`

**Current (Insecure)**:
```sql
-- Anyone can insert/update/delete
CREATE POLICY "Allow insert for diagnostic sessions"
  ON diagnostic_sessions FOR INSERT
  WITH CHECK (true);  -- ⚠️ NO AUTH CHECK
```

**Production Fix**:
```sql
-- Drop insecure policies
DROP POLICY IF EXISTS "Allow insert for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow update for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow select for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow delete for diagnostic sessions" ON diagnostic_sessions;

-- Add secure policies
CREATE POLICY "Users can insert their own sessions"
  ON diagnostic_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions"
  ON diagnostic_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON diagnostic_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON diagnostic_sessions FOR DELETE
  USING (auth.uid() = user_id);
```

Apply same pattern for `diagnostic_results` (checking via session ownership).

---

## Quick Test

Run this to verify RLS is working:
```sql
-- Should return only policies with auth checks
SELECT tablename, policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('diagnostic_sessions', 'diagnostic_results');
```

---

## To Fix

1. **Create migration**: `supabase/migrations/999_enable_production_rls.sql`
2. **Copy SQL** from above
3. **Test**: Verify users can only see their own data
4. **Delete this file** once deployed ✅
