# Task 451 — Regression Shield Slice 6b: authenticated admin runtime hydration harness (PREVENTION ONLY)

**Date:** 2026-06-17
**Type:** Regression Shield — PREVENTION ONLY (no product code changes)
**Status:** IMPLEMENTED (initial + rework) — awaiting orchestrator review

## Summary

Built a repeatable authenticated-admin session capture harness and wired the hydration gate to
consume it, closing the admin-route rows deferred by Slice 6 (Task 445).

**Rework (orchestrator-routed):** Fixed the false-green blocker where `--with-admin` without a
session still navigated admin routes (which redirected to login → PASS = fake coverage). Now all
admin route planning goes through a `planRoutes()` pure function that gates on session availability.
G-B (`--verify-admin-config`) now asserts all 3 session states using the same `planRoutes()`.

## Rework: what changed vs initial implementation

| Area | Before (false-green) | After (rework) |
|---|---|---|
| Admin route planning | Static `ADMIN_ROUTES` array, always navigable | `planRoutes()` pure function: no session → both admin routes `notRealCoverage` |
| `runChecks()` | Computed `hasSession` but never used it | Calls `planRoutes({ hasSession })` — admin routes SKIP when no session |
| `--with-admin` no session | Navigated `/en/admin/users` → login redirect → PASS | SKIP / NOT-REAL-COVERAGE (never navigated, never PASS) |
| G-B self-test | Asserted `ADMIN_ROUTES.length === 2` + UUID branch | Asserts all 3 states via `planRoutes()`: no-session, session-no-UUID, session+UUID |
| Usage header | Legacy `HYDRATION_GATE_COOKIES` as primary | storageState + `capture:admin-session` as primary, cookies as legacy fallback |

### What was kept unchanged
- Dual-source fail-fast (both STORAGE_STATE_PATH and COOKIES_JSON set → exit 1)
- `capture-admin-session.mjs` (G-A capture harness)
- npm scripts, CI wiring (G-B only blocking)
- Secrets hygiene (`.env*` + `playwright/.auth/` git-ignored)
- Registry row stays 🟡 (not flipped to ✅)

## Investigation notes (AC13 — from initial implementation)

### Login seam
`AuthSheet.tsx` → `signIn` → `supabase.auth.signInWithPassword`. Selectors: `#login-email`,
`#login-password`, `form button[type="submit"]`. Login button matches `/login|hyr|увійти|accedi/i`.

### Gate consumption
`HYDRATION_GATE_STORAGE_STATE` (path to storageState JSON, preferred) OR `HYDRATION_GATE_COOKIES`
(legacy). Both set → fail-fast.

### Admin user UUID
Owner obtains from admin users table — a user with history for real `/admin/users/[id]` rendering.

### Secrets hygiene
`.env*` git-ignored (line 37). `playwright/.auth/` git-ignored (line 58). No credential in any file.

### Mobile <640 full-width product gate
**N/A** — no rendered product UI is modified.

## Required session-state matrix (AC1/AC2)

| State | `/en/admin/users` (list) | `/en/admin/users/[id]` (detail) |
|---|---|---|
| `--with-admin`, **no session** | SKIP / NOT-REAL-COVERAGE | SKIP / NOT-REAL-COVERAGE |
| `--with-admin`, session, **no UUID** | navigated + checked | SKIP / NOT-REAL-COVERAGE |
| `--with-admin`, session, **UUID set** | navigated + checked | navigated + checked |

Implemented via `planRoutes()` pure function consumed by both `runChecks()` and `verifyAdminConfig()`.

## Negative-flow transcripts (AC5)

### G-A missing credentials (deterministic — no runtime)
```
HYDRATION_ADMIN_EMAIL= HYDRATION_ADMIN_PASSWORD= node scripts/capture-admin-session.mjs

❌ capture-admin-session: missing credentials.
EXIT: 1
```
No artifact written.

### G-B planted violation: no-session admin route made navigable
Changed `planRoutes()` to make the no-session list route navigable (path set, no `notRealCoverage`):
```
❌ [1] no-session plan has navigable admin route(s): Admin users list (Task 434 area) — false green
✅ [2] session-no-UUID: list route navigable → /en/admin/users
✅ [2] session-no-UUID: detail route → notRealCoverage (correct)
✅ [3] session+UUID: list route → /en/admin/users
✅ [3] session+UUID: detail route → /en/admin/users/test-uuid-451
❌ Admin-config self-test FAILED — misconfig detected.
EXIT: 1
```
Restored → PASSED (6 checks ✅).

### Admin without session at check time
`--with-admin` with no session → admin routes SKIP/NOT-REAL-COVERAGE (never navigated).
The `Auth: NO session — admin routes will be SKIPPED (not navigated)` log line confirms.

## Owner-run LIVE evidence (NOT a CI step)

### Step 1: Set credentials in `.env.local` (git-ignored)
```
HYDRATION_ADMIN_EMAIL=admin@yourdomain.com
HYDRATION_ADMIN_PASSWORD=your-password
```

### Step 2: Start the dev server
```
npm run dev
```

### Step 3: Capture admin session
```
BASE_URL=http://localhost:3000 npm run capture:admin-session
```

### Step 4: Run admin hydration check
```
HYDRATION_GATE_STORAGE_STATE=playwright/.auth/admin-storage-state.json \
  HYDRATION_ADMIN_USER_ID=<real-uuid> \
  BASE_URL=http://localhost:3000 \
  npm run check:hydration -- --with-admin
```

**Owner pastes PASS results here for `/en/admin/users` AND `/en/admin/users/[id]`:**

> **✅ Owner-verified live, 2026-06-17.** Real authenticated admin storageState (`capture:admin-session`,
> 1 auth cookie) + real admin UUID `HYDRATION_ADMIN_USER_ID`, `BASE_URL=http://localhost:3002`:
> ```
> npm run check:hydration -- --with-admin
>   Auth: storageState from playwright/.auth/admin-storage-state.json
>   Homepage (en) … PASS ✅
>   Listings list (en) … PASS ✅
>   Homepage (sq) … PASS ✅
>   Homepage (uk) … PASS ✅
>   Listing detail — AC1 route … SKIP ⚠ (HYDRATION_LISTING_PATH not set — covered by public-route row)
>   Admin users list (Task 434 area) … PASS ✅
>   Admin user detail /admin/users/[id] (EXACT Task 434 route) … PASS ✅
>   Summary: PASS 6  FAIL 0  SKIP 1  → ✅ No hydration violations
> ```
> Both admin routes were NAVIGATED (not SKIP) → confirms session loaded + planner navigates admin
> routes when authenticated. Admin hydration registry row flipped 🟡 → ✅.

## Self-validation (AC6/AC7)

- `node --check scripts/check-hydration-console.mjs` = exit 0 (parses)
- `npm run check:file-integrity:all` = 964 files clean (0 NUL bytes)
- `npx tsc --noEmit` = 0 errors
- `npm run lint` = clean
- `npm run check:hydration:admin-config` = PASSED (6 checks: 3 states × 2 assertions)
- `npm run check:hydration:verify` = GATE IS FUNCTIONAL

## AC-by-AC checklist

| AC | Status | Evidence |
|----|--------|----------|
| AC1 — No-session admin routes → SKIP, never PASS | DONE | `planRoutes({ hasSession: false })` → both admin routes `notRealCoverage`; never navigated |
| AC2 — Session-present matrix preserved | DONE | List checked when session present; detail gated on UUID |
| AC3 — G-B 3-state assertions via `planRoutes()` | DONE | `--verify-admin-config` tests no-session, session-no-UUID, session+UUID |
| AC4 — Usage header updated to storageState-first | DONE | Primary path = `capture:admin-session` → `HYDRATION_GATE_STORAGE_STATE`; cookies = legacy fallback |
| AC5 — No product/route/component change | DONE | Only `scripts/check-hydration-console.mjs` + docs |
| AC6 — clause-14 integrity | DONE | `node --check` = 0; `check:file-integrity:all` = 964 clean |
| AC7 — Self-validation | DONE | tsc=0, lint clean, admin-config PASSED, verify FUNCTIONAL |
| AC8 — Registry row stays 🟡 | DONE | No false green; note updated with "no-session false-green hole closed" |
| AC9 — Files Changed table | DONE | See below |

## Files Changed

| Path | Why |
|------|-----|
| `scripts/check-hydration-console.mjs` | REWORK: `planRoutes()` pure function gates admin routes on session; G-B asserts 3 states; usage header storageState-first; no-session admin → SKIP |
| `docs/critical-flow-registry.md` | Admin hydration row: appended "no-session false-green hole closed" note |
| `docs/backlog.md` | Task 451 status → IMPLEMENTED + REWORK DONE |
| `docs/sessions/2026-06-17-task451-admin-runtime-hydration-harness.md` | This session log (updated with rework) |
