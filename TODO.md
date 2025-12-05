# MessyMind - TODO List

## 🔴 Critical - Before Production

### Authentication & Security
- [ ] **Enable Supabase Authentication**
  - Set up email/password or OAuth providers
  - Create login/signup pages
  - Implement session management

- [ ] **Fix RLS Policies** (SECURITY CRITICAL)
  - Replace temporary MVP RLS policies with production policies
  - Files to update:
    - `supabase/migrations/003_fix_diagnostic_sessions_rls.sql`
    - `supabase/migrations/002_fix_pattern_rls.sql`
  - Use `auth.uid()` instead of allowing all inserts
  
- [ ] **Re-enable Middleware Authentication**
  - Uncomment authentication checks in `src/lib/supabase/middleware.ts`
  - Protect routes that require authentication

- [ ] **Update API Routes**
  - Replace placeholder `user_id` with real `auth.uid()`
  - File: `src/app/api/upload/route.ts` (line 30)

---

## 🟡 Phase 2 - Metrics & Detection (Next Priority)

### Metrics Calculation
- [ ] Create metrics calculator module
- [ ] Group events by session_id
- [ ] Calculate all SessionMetrics fields
- [ ] Store metrics in database

### Pattern Detection
- [ ] Run detection engine for both patterns
- [ ] Store results in diagnostic_results table
- [ ] Generate diagnosis outputs

### Results UI
- [ ] Create results dashboard
- [ ] Display detected patterns
- [ ] Show intervention recommendations
- [ ] Add visualizations/charts

---

## 🟢 Phase 3 - Polish & Features

### UI Improvements
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add success animations
- [ ] Mobile responsive design

### Features
- [ ] Report saving
- [ ] Report export (PDF/JSON)
- [ ] Session history
- [ ] Pattern comparison

### Performance
- [ ] Optimize large CSV handling
- [ ] Add pagination for results
- [ ] Cache pattern data

---

## 📝 Notes

**Current Status**: Phase 1 (CSV Upload) complete with temporary security bypass for MVP testing

**Security Warning**: The current implementation allows unauthenticated access. This is ONLY for development/testing. Do NOT deploy to production without implementing authentication.
