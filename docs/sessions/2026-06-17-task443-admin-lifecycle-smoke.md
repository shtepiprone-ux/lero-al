# Task 443 — Epic RS Slice 4: Admin-lifecycle regression smoke + CI gate

**Date:** 2026-06-17
**Epic:** RS (Regression Shield)
**Slice:** 4 — Admin lifecycle
**Status:** IMPLEMENTED — awaiting orchestrator review

## Investigation Notes (AC12)

### Harness reuse
The existing admin smoke harness from `updateUserProfileFull.smoke.test.ts` (Task 448) was mirrored for the new `hardDeleteUser` smoke. Same pattern: hoisted `vi.mock` of `@/lib/auth/server` (`getUser`), `@/lib/auth/permissions` (`hasPermission`), `@/lib/supabase/admin` (`createAdminClient` with a table-name `from()` router), and `@/modules/listings/actions/applyListingTransition` (`applyListingTransitionByStatus`). The `createAdminClient` mock additionally exposes `auth.admin.deleteUser` as a trackable spy.

### Stubbing seams for hardDeleteUser
- `hasPermission('users.hard_delete')` — controls the permission gate; tested with both `false` return and thrown error (the action's `.catch(() => false)` at `index.ts:565`).
- `getUser()` — returns the admin session or `null` for unauthorized.
- `createAdminClient().from('listings').select().eq().not()` — returns the non-terminal listings to archive.
- `applyListingTransitionByStatus(id, 'archived', actor)` — stubbed to `{ ok: true }`.
- `createAdminClient().from('users').delete().eq()` — profile row deletion; spy tracks call order.
- `createAdminClient().auth.admin.deleteUser(userId)` — auth deletion; spy tracks call count and order.

### Ordering-invariant rationale
The `hardDeleteUser` function has a critical ordering contract:
1. Archive non-terminal listings BEFORE deleting the user profile (otherwise listings are orphaned with no "deleted owner" notice).
2. Delete user profile BEFORE calling `auth.admin.deleteUser` (if profile delete fails, auth delete must NOT run — this prevents the "auth deleted but profile still exists" half-state).
3. `auth.admin.deleteUser` MUST be called on the happy path (this is what frees the email for re-signup — the email-reuse class invariant mirroring the self-delete flow from Task 441/439).

These ordering invariants are asserted via a `callOrder` array that records the sequence of mock invocations.

### Why hydration rows stay owner-run (🟡)
"Admin users list loads" (`/admin/users`) and "Admin user detail loads" (`/admin/users/[id]`) require:
- A live Next.js dev server
- Real auth cookies (admin session)
- A real user UUID (for the detail route)

These cannot be deterministically reproduced in Vitest without a full server + real Supabase auth. Converting them to Vitest smokes would require product changes (injectable auth, mock server). They are explicitly Slice 6 / Task 445 scope.

### Mobile <640 full-width gate
N/A — this slice modifies no rendered UI surface. Tests only.

## Test Results

### `npm run test:admin` (all 3 smoke files)
```
Test Files  3 passed (3)
     Tests  18 passed (18)
  Duration  971ms
```

### `hardDeleteUser.smoke.test.ts` (6 tests)
1. **happy path** — permitted admin: listings archived → profile deleted → auth.admin.deleteUser called once → `{}`. Ordering invariants asserted.
2. **forbidden (false)** — `hasPermission` returns `false` → `{ error: 'forbidden' }` + zero side effects.
3. **forbidden (throws)** — `hasPermission` throws → `{ error: 'forbidden' }` + zero side effects.
4. **unauthorized** — no session → `{ error: 'Unauthorized' }` + zero side effects.
5. **profile delete error** — `{ error: 'delete_failed' }` + `console.error('hardDeleteUser profile failed', …)` + `auth.admin.deleteUser` NOT called.
6. **auth delete error** — `{ error: 'profile_deleted_auth_failed' }` + `console.error('hardDeleteUser auth failed', …)`.

### Existing smokes (unchanged, confirmed green)
- `clearHistory.smoke.test.ts` — 7 tests PASS (Tasks 436/432)
- `updateUserProfileFull.smoke.test.ts` — 5 tests PASS (Task 448)

## Planted-Violation Transcripts (AC6)

### PV1 — auth.admin.deleteUser removed (email-reuse guard)
**Mutation:** Commented out `db.auth.admin.deleteUser(userId)` at `index.ts:592`, replaced with `const authError = null`.
**Result:** 2 tests FAIL:
- Happy path: `expected "vi.fn()" to be called 1 times, but got 0 times` (line 163)
- Auth delete error: `expected {} to deeply equal { error: 'profile_deleted_auth_failed' }` (line 256)
**Revert → PASS:** All 6 tests green.

### PV2 — profile-fail falls through to auth delete (ordering guard)
**Mutation:** Removed `return { error: 'delete_failed' }` from the `profileError` branch at `index.ts:588`, letting execution fall through.
**Result:** 1 test FAILS:
- Profile delete error: `expected {} to deeply equal { error: 'delete_failed' }` (line 232)
**Revert → PASS:** All 6 tests green.

### PV3 — console.error removed from auth-fail path (diagnosability guard)
**Mutation:** Removed `console.error('hardDeleteUser auth failed', …)` at `index.ts:594`.
**Result:** 1 test FAILS:
- Auth delete error: `expected "error" to be called with arguments: ['hardDeleteUser auth failed', …]` (line 257)
**Revert → PASS:** All 6 tests green.

## Validation Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npm run lint` | PASS (clean) |
| `npm run test:admin` | PASS (18/18) |
| `npm run check:file-integrity:all` | PASS (953/953 files clean) |

## AC Self-Audit

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ | `hardDeleteUser.smoke.test.ts` created; harness mirrors existing admin smokes |
| AC2 | ✅ | 6 tests: happy + forbidden(false) + forbidden(throws) + unauthorized + delete_failed + profile_deleted_auth_failed; ordering invariants + zero-side-effect assertions on permission/auth failures |
| AC3 | ✅ | `console.error` asserted on profile-fail (`'hardDeleteUser profile failed'`) and auth-fail (`'hardDeleteUser auth failed'`) paths |
| AC4 | ✅ | `test:admin` script added to package.json; runs all 3 admin smoke files |
| AC5 | ✅ | `npm run test:admin` wired into governance-pr.yml as blocking step "Admin lifecycle regression guard (Epic RS Slice 4)" |
| AC6 | ✅ | 3 planted-violation transcripts above (PV1: email-reuse, PV2: ordering, PV3: diagnosability) |
| AC7 | ✅ | Hard-delete row ❌ → ✅; clearHistory + updateUserProfileFull rows command updated to `npm run test:admin`; hydration rows kept 🟡 with Slice 6 note |
| AC8 | ✅ | No product/UI/migration change; no fix to live bugs; existing admin smokes unedited; `index.ts` fully reverted |
| AC9 | ✅ | `npx tsc --noEmit` clean |
| AC10 | ✅ | `npm run lint` clean |
| AC11 | ✅ | `npm run check:file-integrity:all` — 953/953 clean |
| AC12 | ✅ | Investigation notes above (harness reuse, stubbing seams, ordering rationale, hydration rows) |

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/modules/admin/actions/__tests__/hardDeleteUser.smoke.test.ts` | NEW | Hard-delete smoke: 6 tests covering happy + all failure paths with ordering invariants |
| `package.json` | MODIFIED | Added `test:admin` script running all 3 admin smoke files |
| `.github/workflows/governance-pr.yml` | MODIFIED | Added blocking "Admin lifecycle regression guard" CI step |
| `docs/critical-flow-registry.md` | MODIFIED | Hard-delete row ❌ → ✅; existing rows command → `npm run test:admin`; hydration rows 🟡 note |
| `docs/sessions/2026-06-17-task443-admin-lifecycle-smoke.md` | NEW | This session log |
| `docs/backlog.md` | MODIFIED | Last Session + Task 443 status |
