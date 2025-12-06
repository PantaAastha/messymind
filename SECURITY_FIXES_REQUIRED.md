# Security Fixes Required Before Production

## ⚠️ CRITICAL - These are temporary MVP bypasses that MUST be fixed

### 1. **RLS Policies - Allow All Access**

**Current State (INSECURE):**
- Anyone can insert/update/select/delete diagnostic sessions
- Anyone can insert/update patterns
- No authentication required

**Files:**
- `supabase/migrations/002_fix_pattern_rls.sql`
- `supabase/migrations/003_fix_diagnostic_sessions_rls.sql`
- `supabase/migrations/004_fix_select_delete_policies.sql`
- `supabase/migrations/006_fix_diagnostic_results_rls.sql`

**What to do:**
1. Remove the "Allow all" policies
2. Implement the production policies (already included as comments in the SQL files)
3. Policies should check `auth.uid() = user_id`

**Production SQL (ready to use):**
```sql
-- For diagnostic_sessions
DROP POLICY IF EXISTS "Allow insert for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow update for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow select for diagnostic sessions" ON diagnostic_sessions;
DROP POLICY IF EXISTS "Allow delete for diagnostic sessions" ON diagnostic_sessions;

CREATE POLICY "Users can insert their own diagnostic sessions"
  ON diagnostic_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnostic sessions"
  ON diagnostic_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own diagnostic sessions"
  ON diagnostic_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagnostic sessions"
  ON diagnostic_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- For diagnostic_results
DROP POLICY IF EXISTS "Allow insert for diagnostic results" ON diagnostic_results;
DROP POLICY IF EXISTS "Allow select for diagnostic results" ON diagnostic_results;

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
```

---

### 2. **Foreign Key Constraint Removed**

**Current State (INSECURE):**
- `user_id` has no foreign key constraint
- Can insert any random UUID as user_id
- No referential integrity

**File:**
- `supabase/migrations/005_remove_user_fkey.sql`

**What to do:**
Re-add the foreign key constraint:
```sql
ALTER TABLE diagnostic_sessions 
ADD CONSTRAINT diagnostic_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

### 3. **Middleware Authentication Disabled**

**Current State (INSECURE):**
- All routes are accessible without login
- No authentication checks

**File:**
- `src/lib/supabase/middleware.ts` (lines 38-62 commented out)

**What to do:**
1. Uncomment the authentication logic
2. Protect routes that require authentication
3. Keep `/`, `/login`, `/signup` public

---

### 4. **Placeholder User ID in API**

**Current State (INSECURE):**
- Using hardcoded `00000000-0000-0000-0000-000000000000` as user_id
- All sessions belong to same fake user

**File:**
- `src/app/api/upload/route.ts` (line 30)

**What to do:**
Replace with real authenticated user:
```typescript
// Get authenticated user
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

const userId = user.id; // Use real user ID
```

---

## Implementation Checklist

### Phase 1: Set Up Authentication
- [ ] Enable Supabase Auth in dashboard
- [ ] Create login page (`/login`)
- [ ] Create signup page (`/signup`)
- [ ] Implement auth state management
- [ ] Add logout functionality

### Phase 2: Update Middleware
- [ ] Uncomment authentication checks in `middleware.ts`
- [ ] Test protected routes redirect to login
- [ ] Test authenticated users can access protected routes

### Phase 3: Update API Routes
- [ ] Replace placeholder user_id with `auth.uid()`
- [ ] Add authentication checks to all API routes
- [ ] Return 401 for unauthenticated requests

### Phase 4: Fix Database
- [ ] Re-add foreign key constraint on `user_id`
- [ ] Replace "Allow all" RLS policies with user-scoped policies
- [ ] Test that users can only access their own data

### Phase 5: Testing
- [ ] Test login/signup flow
- [ ] Test that unauthenticated users cannot upload
- [ ] Test that users can only see their own sessions
- [ ] Test that RLS policies work correctly
- [ ] Test foreign key constraint prevents invalid user_ids

---

## Quick Reference: Files to Change

1. **Database (Supabase SQL Editor):**
   - Re-add foreign key constraint
   - Replace RLS policies

2. **Code Files:**
   - `src/lib/supabase/middleware.ts` - Uncomment auth checks
   - `src/app/api/upload/route.ts` - Use real user_id
   - Create: `src/app/login/page.tsx`
   - Create: `src/app/signup/page.tsx`

---

## Testing in Development

For now, you can continue testing without authentication. Just remember:
- **DO NOT deploy to production** with these security bypasses
- **DO NOT expose the database publicly** 
- **DO NOT share the Supabase URL/keys** publicly

When you're ready to add authentication, follow the checklist above in order.
