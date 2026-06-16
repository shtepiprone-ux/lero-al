# Session Log — Task 448: Regression Shield Slice 1 REWORK — Close Task 436 Coverage Gaps

**Date:** 2026-06-16  
**Executor:** Sonnet 4.6  
**Type:** QA / tooling / governance (Epic RS Slice 1 rework)  
**Scope:** Close 5 findings from Task 436 orchestrator review — prevention only, no bug fixes

---

## Investigation Findings (pre-implementation)

| Item | Finding |
|---|---|
| Listing-detail URL pattern | Route is `/{locale}/listings/[slug]` — e.g. `/en/listings/my-slug-123`. No stable hardcoded slug exists; `HYDRATION_LISTING_PATH` env var is the right approach. |
| Admin action for history writes | `updateUserProfileFull` in `src/modules/admin/actions/index.ts` (lines 319–411). Writes `user_status_history` when `oldUser.status !== data.status`; writes `user_change_log` when `canChangeRole && oldType !== data.profileType`. Both inserts are in `try {} catch {}` (empty catch — fire-and-forget). `roleHasPermission` is async (`Promise<boolean>`) — mock must use `mockResolvedValue`. |
| reportListing.smoke.test.ts | Mock was `from: () => reportChain` — no `vi.fn()` capture, so table name argument was not observable. Simple fix: `const mockFrom = vi.fn(() => reportChain)` + assert `expect(mockFrom).toHaveBeenCalledWith('listing_reports')` in happy path. |
| Hydration gate admin-detail | Current: hardcoded `00000000-0000-0000-0000-000000000001` → not-found state, not real component coverage. Correct: `HYDRATION_ADMIN_USER_ID` env var; unset → NOT-REAL-COVERAGE/skip. |
| Registry hydration row | Single ✅ conflated detector (CI self-test) with live app routes (owner-run). Required split. |

---

## Finding A — Hydration gate listing-detail route + admin-detail parametrization (AC1)

### File modified
`scripts/check-hydration-console.mjs`

### Changes
- Added `LISTING_PATH = process.env.HYDRATION_LISTING_PATH || null` and `ADMIN_USER_ID = process.env.HYDRATION_ADMIN_USER_ID || null` at top.
- `PUBLIC_ROUTES` now includes listing-detail conditionally:
  - Set → `{ path: LISTING_PATH, label: 'Listing detail (…)' }` — real coverage.
  - Unset → `{ path: null, label: '…', notRealCoverage: true, reason: '…' }` — SKIP with warning, never green.
- `ADMIN_ROUTES` admin-detail:
  - Set → `/en/admin/users/${ADMIN_USER_ID}` (real UUID, real component coverage).
  - Unset → NOT-REAL-COVERAGE/skip — the dummy `00000000…001` UUID is gone.
- `runChecks` loop: `if (route.notRealCoverage)` → prints `SKIP ⚠ (NOT-REAL-COVERAGE: …)` and adds to results as SKIP, then `continue` (never calls `checkRoute`).
- Added env var documentation to JSDoc/usage comment block.

### Verification (hydration self-test still PASS)
```
npm run check:hydration:verify

🔬 Hydration gate self-test (--verify-gate)
   Planted-violation server started at http://127.0.0.1:62402/
   Route: Planted hydration violation
   Status: FAIL
   Violations detected:
     [1] (error) Hydration failed because the server rendered HTML didn't match the client…
     [2] (error) Text content does not match server-rendered HTML. Server: "January 1 2026" Client: "1 Jan 2026"…
✅ GATE IS FUNCTIONAL — planted violation was correctly detected.
```

---

## Finding B — Status/account-type change → history-entry smoke (AC2)

### File created
`src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts`

### Coverage (5 tests)
- **Happy path: status change** — `updateUserProfileFull(userId, { ...data, status: 'blocked' })` with `OLD_USER.status = 'active'` → `mockStatusHistoryInsert` called with `{ user_id, old_status: 'active', new_status: 'blocked', changed_by }`.
- **Happy path: profileType change** — `{ ...data, profileType: 'agent' }` with old type `'private'` → `mockChangeLogInsert` called with `{ user_id, changed_by, field_name: 'profile_type', old_value: 'private', new_value: 'agent' }`.
- **No history when status unchanged** — `BASE_DATA.status === OLD_USER.status === 'active'` → `mockStatusHistoryInsert` NOT called.
- **Forbidden** — `mockMyProfileSingle` returns `{ role: 'user' }` → `{ error: 'Forbidden' }`, no DB writes.
- **Unauthorized** — `mockGetUser` returns null → `{ error: 'Unauthorized' }`.

### Mock architecture
- `@/lib/auth/server` → `mockGetUser` (vi.fn)
- `@/lib/supabase/server` → `mockCreateClient` → resolves to `{ from: () => myProfileChain }` (admin's own role read)
- `@/lib/supabase/admin` → `createAdminClient` → `{ from: mockAdminFrom }` — routes by table:
  - `'users'` → select/eq/single (read old user state) + update/eq (write user row)
  - `'user_status_history'` → `{ insert: mockStatusHistoryInsert }`
  - `'user_change_log'` → `{ insert: mockChangeLogInsert }`
  - others → generic no-op chain
- `@/lib/auth/permissions` → `mockRoleHasPermission` (async, `mockResolvedValue(true)`)
- Side effects mocked: `createNotification`, `applyListingTransitionByStatus`

### Planted-violation transcript (status-change)
Change `OLD_USER.status` from `'active'` to `'blocked'` in the fixture (matching the test's new status):
```
updateUserProfileFull — smoke tests (Guard 1, Task 448)
  ✗ happy path — status change writes a user_status_history row
    AssertionError: expected "mockStatusHistoryInsert" to have been called at least once
    → if (oldUser.status !== data.status) is FALSE (both 'blocked') → insert NOT called

  ✗ no history row when status is unchanged
    AssertionError: expected "mockStatusHistoryInsert" to not have been called
    → BASE_DATA.status='active' ≠ OLD_USER.status='blocked' → insert IS called (wrong branch)

Tests  2 failed | 3 passed (5)
```
Revert `OLD_USER.status` to `'active'` → 5/5 PASS.

### Vitest run transcript
```
 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  20:41:02
   Duration  926ms
```

---

## Finding C — Pin `listing_reports` table name (AC3)

### File modified
`src/modules/listings/actions/__tests__/reportListing.smoke.test.ts`

### Changes
- Added `const mockFrom = vi.fn(() => reportChain)` after `reportChain` definition.
- `beforeEach`: `mockCreateClient.mockResolvedValue({ from: mockFrom })` (was `from: () => reportChain`).
- Happy-path test: added `expect(mockFrom).toHaveBeenCalledWith('listing_reports')`.
- All 6 prior test cases pass unchanged.

### Planted-violation transcript (wrong table name)
Change `from: mockFrom` to `from: (t) => { mockFrom('listing_WRONG'); return reportChain }`:
```
reportListingAction — PLANTED VIOLATION
  ✗ PLANTED: from called with wrong table → expect listing_reports FAILS
    AssertionError: expected "mockFrom" to have been called with arguments: [ 'listing_reports' ]
    Received calls: [ "listing_WRONG", "listing_WRONG" ]
    Error message: [ -"listing_reports", +"listing_WRONG" ]

Tests  1 failed (1)
```
Revert `from: mockFrom` → PASS.

---

## Finding D — Registry + session-log honesty (AC4 + AC5)

### Files modified
- `docs/critical-flow-registry.md`:
  - **Hydration row** split into three rows:
    - Detector + self-test: ✅ CI-safe, planted-violation FAIL confirmed.
    - Live public routes: 🟡 (listing-detail HYDRATION_LISTING_PATH-parametrized; owner-run).
    - Admin routes: 🟡 (HYDRATION_ADMIN_USER_ID-parametrized; when unset → NOT-REAL-COVERAGE/skip).
  - **Admin user detail** command updated to use `HYDRATION_ADMIN_USER_ID` env var.
  - **User status/role/account-type change**: flipped from ❌ to ✅ (Task 448 smoke added).
  - **Report listing**: updated evidence to include table-name assertion note.
- `docs/sessions/2026-06-16-task436-regression-protection-guards.md`:
  - AC2 row marked **OVER-CLAIMED** with inline correction note and pointer to Task 448 session log.

---

## AC self-audit

| AC | Status | Evidence |
|---|---|---|
| AC1 — listing-detail route in hydration gate; admin-detail parametrized | ✅ | `HYDRATION_LISTING_PATH` route in PUBLIC_ROUTES; `HYDRATION_ADMIN_USER_ID` admin-detail; both unset → NOT-REAL-COVERAGE/skip |
| AC2 — status/account-type smoke: writes history + permission-denied + planted-violation FAIL | ✅ | `updateUserProfileFull.smoke.test.ts` 5/5 PASS; planted-violation transcript above |
| AC3 — `reportListing.smoke.test.ts` asserts `.from('listing_reports')`; prior cases still pass | ✅ | `expect(mockFrom).toHaveBeenCalledWith('listing_reports')` added; 6/6 PASS; planted-violation FAIL confirmed |
| AC4 — registry splits hydration detector/live-routes; admin 🟡; status-change ✅; report evidence updated | ✅ | See Finding D above |
| AC5 — Task 436 session-log AC2 over-claim corrected | ✅ | AC2 row annotated with OVER-CLAIMED + Task 448 pointer |
| AC6 — new tests run in CI; planted-violation FAIL transcripts present | ✅ | `updateUserProfileFull.smoke.test.ts` and `reportListing.smoke.test.ts` run in CI via `npx vitest run`; transcripts above |
| AC7 — no 434/435 fix; no UI redesign; clause 14 green; Files Changed table present; no git commands | ✅ | Only test files, script, docs changed; 0 NUL; tsc 0 errors; lint 0 warnings |

---

## Validation

- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 warnings/errors
- `npx vitest run` → **642/642 PASS** (25 test files, +5 from `updateUserProfileFull.smoke.test.ts`)
- `npm run check:hydration:verify` → PASS (gate functional, planted violation detected)
- Planted-violation FAIL transcripts: status-change smoke ✅ (above) · report table assertion ✅ (above)
- File-integrity (clause 14): all touched files parse cleanly, 0 NUL bytes, 0 UTF-8 BOM

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts` | NEW | Finding B: status/account-type change → writes `user_status_history` / `user_change_log`; forbidden + unauthorized paths; planted-violation proof |
| `src/modules/listings/actions/__tests__/reportListing.smoke.test.ts` | MODIFIED | Finding C: capture `from` as `vi.fn()` + assert `'listing_reports'` table name in happy-path test |
| `scripts/check-hydration-console.mjs` | MODIFIED | Finding A: `HYDRATION_LISTING_PATH` listing-detail route + `HYDRATION_ADMIN_USER_ID` admin-detail parametrization; NOT-REAL-COVERAGE/skip when unset |
| `docs/critical-flow-registry.md` | MODIFIED | Finding D: split hydration row (detector ✅ / live-routes 🟡); admin-detail 🟡; status-change flipped ✅; report evidence updated |
| `docs/sessions/2026-06-16-task436-regression-protection-guards.md` | MODIFIED | Finding D: AC2 over-claim annotated with OVER-CLAIMED + Task 448 correction note |
| `docs/backlog.md` | MODIFIED | Last Session updated; Task 448 marked executor-complete |
