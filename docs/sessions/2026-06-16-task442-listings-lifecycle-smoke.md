# Session Log — Task 442: Regression Shield Slice 3 — Listings-Lifecycle Smoke Tests

**Date:** 2026-06-16
**Task:** Task 442 — Regression Shield Slice 3, Listings lifecycle smoke (PREVENTION ONLY)
**Executor:** Sonnet 4.6
**Epic:** RS (Regression Shield)
**Status:** ✅ COMPLETE — 39/39 tests pass; tsc clean; lint clean; file-integrity clean / 952 files clean

---

## What was built

5 new Vitest smoke test files + 1 existing file included in `test:listings` script, covering all
P0/P1 listings-lifecycle registry rows (Create, Edit, Status change, Report dialog-open, Inquiry).

**Scope boundary:** PREVENTION ONLY. No product redesign, no fix to Task 433/434/435/437/439,
no incidental refactors. Tests verify existing shipped behavior.

**Mobile gate N/A:** This slice modifies NO rendered surface — smoke tests only. The `<640`
full-width gate does not apply per kickoff contract.

---

## Investigation notes (AC12)

### Harness reuse: Vitest + jsdom (same as Slice 2 / Task 441)

All contracts under test (return shapes, error codes, DB call sequences, UI wiring) are observable
at the call/return level without a running Next.js server. Same justification as Slice 2:
- Server actions → pure function-call contract (mock at module boundary, assert return value + DB call)
- `ListingReportDialog` → 'use client' component with only `useState`/`useTransition`; RTL renders
  it in jsdom via `act()`; all shadcn/ui dialog components mocked to simple HTML elements

Playwright would require: a full Next.js build, live Supabase with seed data, and wall-clock page
navigation time. None of that adds value to the behavioral contracts tested here.

### Stubbing seams — one line per action

| Action | Mock at | What's proven |
|---|---|---|
| `createListing` | `@/lib/supabase/server createClient`, `@/lib/auth/server getUser`, `@/lib/auth/blockCheck getBlockedError`, `@/modules/listings/validations listingSchema` | status:'pending' inserted, user_id pinned, validation gate, DB error surfaced |
| `updateListing` | above + `@/i18n/routing`, `@/lib/cloudinaryUpload`, `@/lib/cloudinaryDelete` | not_found guard, permission gate, validation gate, update error surfaced; `next/cache` aliased to stub (no vi.mock needed) |
| `applyListingTransitionByStatus` | `_db` injection parameter (existing pattern from `applyListingTransition.test.ts`) | owner-privileged write contract, forbidden, not_found, same-status invalid_transition |
| Pure engine functions | imported directly — no mock needed (pure TS functions with no Next.js deps) | resolveTransition matrix, canSetStatusPrivileged same-status guard |
| `submitListingInquiry` | `next/headers headers()`, `@/lib/supabase/admin createAdminClient`, `@/lib/auth/server getUser`, `@/modules/notifications/lib/emails/listingInquiry sendListingInquiryNotification` | rate-limit by IP, insert status:'new', email fired after insert, partial-success model |
| `ListingReportDialog` | `@/modules/listings/actions/reportListing reportListingAction`, `next-intl useTranslations`, `sonner toast`, `lucide-react`, `@/lib/utils cn`, all shadcn/ui dialog+button+label+textarea components | dialog-open wiring, reason selection, submit call, already_reported response handling |

### Status-change: pure engine vs. gateway split decision

The existing `src/modules/listings/actions/applyListingTransition.test.ts` already has 40+ gateway
tests using `_db` injection, covering: all 9 transition actions, all status sources, permission matrix
(admin/moderator/user/null role), not_found, db_error, and the privileged any-status paths.

The new `listingStatusChange.smoke.test.ts`:
- Tests `resolveTransition` and `canSetStatusPrivileged` DIRECTLY (pure engine functions) — the
  existing test exercises these only indirectly through the gateway.
- Adds thin gateway smoke (owner-privileged, admin-privileged, stranger-forbidden, not_found,
  same-status) via `_db` injection WITHOUT duplicating the 40+ existing test cases.

This split gives independent assurance at both layers without doubling the test surface.

### Report dialog mountability in jsdom

`ListingReportDialog.tsx` is a 'use client' component:
- Only uses `useState`, `useTransition`, `useTranslations` (next-intl)
- No `useRouter`, no `useParams`, no SSR data fetching
- All imports (shadcn/ui, lucide-react, sonner) are mocked to simple React elements

The component mounts cleanly in jsdom with RTL. Dialog open/close state is driven by `useState(false)`.
Clicking the report button calls `handleOpen()` → `setOpen(true)` → Dialog renders children. This
can be fully exercised in jsdom via `fireEvent.click` wrapped in `act(async () => {...})`.

No product changes needed — component is testable as-is.

### `isListingClosed` — not mocked

`isListingClosed` from `@/modules/listings/domain` is a pure domain function (no Next.js deps).
Test data uses `status: 'active'` for happy path (isListingClosed returns false). No mock needed —
using the real function increases confidence.

---

## Test files

### 1. `src/modules/listings/actions/__tests__/createListing.smoke.test.ts` — 4 tests
Happy (status:'pending' + user_id asserted), validation_failed (no DB), unauthenticated, insert DB error + console.error.

### 2. `src/modules/listings/actions/__tests__/updateListing.smoke.test.ts` — 5 tests
Happy → {slug, status}, not_found (no update), validation_failed, unauthenticated, DB update error + console.error.

### 3. `src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts` — 13 tests
Pure engine (4): resolveTransition pending+APPROVE→active, PUBLISH invalid from pending, active+ARCHIVE→archived,
sold+RESTORE→invalid; canSetStatusPrivileged (4): active→pending true, pending→sold true, active→active false (same-status),
archived→inactive true. Gateway (5 via _db injection): owner ok, admin ok, stranger forbidden, not_found, same-status invalid_transition.

### 4. `src/modules/listings/actions/__tests__/submitListingInquiry.smoke.test.ts` — 7 tests
Happy (status:'new' + email called), validation (short msg), validation (bad email), rate_limited (IP=real, count=5),
not_found (listing null), save_failed + console.error, email_transient partial-success + console.error.

### 5. `src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx` — 4 tests
Closed on mount, opens + 6 reasons rendered, submit wiring (reportListingAction called with listingId+reason+comment),
already_reported → toast.info + dialog closes.

### 6. `src/modules/listings/actions/__tests__/reportListing.smoke.test.ts` — 6 tests (existing, Task 436/448)
Included in `test:listings` script. Not modified.

**Total: 39 tests across 6 files.**

---

## Planted-violation transcripts (actual runs)

### Violation 1 — `createListing.smoke.test.ts`
**Change:** `src/modules/listings/actions/createListing.ts` line 50: `status: 'pending'` → `status: 'active'`

**Command:** `npx vitest run src/modules/listings/actions/__tests__/createListing.smoke.test.ts`

**FAIL output:**
```
FAIL  …/createListing.smoke.test.ts > … > happy path: valid payload → { slug }, status:pending inserted, user_id pinned
AssertionError: expected "vi.fn()" to be called with arguments: [ ObjectContaining{…} ]

Received:
  1st vi.fn() call:
  [
-   ObjectContaining {
-     "status": "pending",
+   {
+     "status": "active",
      "user_id": "user-create-1",
    },
  ]

Tests  1 failed | 3 passed (4)
```

**Revert:** restore `status: 'pending'`

**PASS rerun:** `Tests  4 passed (4)`

---

### Violation 2 — `updateListing.smoke.test.ts`
**Change:** `src/modules/listings/actions/updateListing.ts` line 37: commented out `if (!existing) return { error: 'not_found' }`

**Command:** `npx vitest run src/modules/listings/actions/__tests__/updateListing.smoke.test.ts`

**FAIL output:**
```
FAIL  …/updateListing.smoke.test.ts > … > not_found: listing does not exist → { error: "not_found" }, no DB update
TypeError: Cannot read properties of null (reading 'user_id')
 ❯ updateListing src/modules/listings/actions/updateListing.ts:41:16
     41|   if (existing.user_id !== user.id) {
              ^

Tests  1 failed | 4 passed (5)
```

**Revert:** restore `if (!existing) return { error: 'not_found' }`

**PASS rerun:** `Tests  5 passed (5)`

---

### Violation 3 — `listingStatusChange.smoke.test.ts` (both pure engine + gateway)
**Change:** `src/modules/listings/domain/listingTransitionEngine.ts` line 191:
Removed `from !== to &&` from `canSetStatusPrivileged` (same-status guard removed).

**Command:** `npx vitest run src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts`

**FAIL output:**
```
FAIL  …/listingStatusChange.smoke.test.ts > pure engine — canSetStatusPrivileged > same-status (active → active): privileged = false — not a real transition
AssertionError: expected true to be false

FAIL  …/listingStatusChange.smoke.test.ts > gateway — applyListingTransitionByStatus > same-status (active → active) → { ok: false, reason: "invalid_transition" }
AssertionError: expected { ok: false, reason: 'invalid_transition' } received { ok: true, nextStatus: 'active', listingId: 'l5' }

Tests  2 failed | 11 passed (13)
```

**Revert:** restore `from !== to &&`

**PASS rerun:** `Tests  13 passed (13)`

---

### Violation 4 — `submitListingInquiry.smoke.test.ts`
**Change:** `src/modules/listings/actions/submitListingInquiry.ts` line 57:
`return { error: 'rate_limited' }` → `return {}` (rate_limited swallowed)

**Command:** `npx vitest run src/modules/listings/actions/__tests__/submitListingInquiry.smoke.test.ts`

**FAIL output:**
```
FAIL  …/submitListingInquiry.smoke.test.ts > … > rate_limited: 5th+ request from real IP → { error: "rate_limited" }
AssertionError: expected {} to deeply equal { error: 'rate_limited' }

- Expected: { "error": "rate_limited" }
+ Received: {}

Tests  1 failed | 6 passed (7)
```

**Revert:** restore `return { error: 'rate_limited' }`

**PASS rerun:** `Tests  7 passed (7)`

---

## CI wiring

Added as blocking step in `.github/workflows/governance-pr.yml` (alongside existing `test:auth`):
```yaml
- name: Listings lifecycle regression guard (Epic RS Slice 3)
  run: npm run test:listings
```

Local command: `npm run test:listings`

---

## AC checklist

| AC | Description | Status |
|---|---|---|
| AC1 | New Vitest smoke files under `src/modules/listings/**/__tests__/` covering Create, Edit, Status change (pure engine + gateway), Inquiry, Report dialog-open; harness reused from Slice 2 | ✅ 5 new files, Slice 2 harness reused |
| AC2 | Each flow has happy + ≥1 failure/edge path; literal return shapes asserted (validation_failed, not_found, {ok:false,reason:'invalid_transition'}, rate_limited, email_transient, etc.) | ✅ all error codes asserted literally |
| AC3 | Diagnosable-failure paths assert console.error (createListing insert, updateListing update, submitListingInquiry save_failed + email_transient) | ✅ 4 console.error assertions |
| AC4 | `test:listings` script in package.json; runs new + existing reportListing.smoke.test.ts | ✅ 6 files, 39 tests |
| AC5 | `npm run test:listings` wired in governance-pr.yml as blocking step | ✅ added after test:auth step |
| AC6 | Planted-violation FAIL → revert → PASS transcript per gate (4 violations) | ✅ documented above |
| AC7 | `docs/critical-flow-registry.md` listings rows ❌ → ✅ + commands + evidence; Report row dialog-open note appended | ✅ |
| AC8 | No product/UI/migration change; no fix to live bugs; no unrelated refactor | ✅ 0 production files touched |
| AC9 | `npx tsc --noEmit` clean | ✅ no errors |
| AC10 | `npm run lint` clean | ✅ no errors (fixed unused `vi` import in statusChange file) |
| AC11 | `npm run check:file-integrity:all` clean | ✅ `npm run check:file-integrity:all` — 952 files clean |
| AC12 | Investigation notes in session log (harness, stubs, pure-vs-gateway split, dialog mountability) | ✅ documented above |

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/modules/listings/actions/__tests__/createListing.smoke.test.ts` | NEW | Create listing coverage (AC1) — 4 tests |
| `src/modules/listings/actions/__tests__/updateListing.smoke.test.ts` | NEW | Edit listing coverage (AC1) — 5 tests |
| `src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts` | NEW | Status change coverage: pure engine + gateway smoke (AC1) — 13 tests |
| `src/modules/listings/actions/__tests__/submitListingInquiry.smoke.test.ts` | NEW | Inquiry / send message coverage (AC1) — 7 tests |
| `src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx` | NEW | Report dialog-open wiring coverage (AC1) — 4 tests |
| `package.json` | MODIFIED | Add `test:listings` script (AC4) |
| `.github/workflows/governance-pr.yml` | MODIFIED | Add blocking `test:listings` CI step (AC5) |
| `docs/critical-flow-registry.md` | MODIFIED | Flip 4 listings rows ❌ → ✅; append dialog-open note to Report row (AC7) |
| `docs/sessions/2026-06-16-task442-listings-lifecycle-smoke.md` | NEW | This session log |
| `docs/backlog.md` | MODIFIED | Last Session updated; Task 442 status |
| `docs/backlog-archive.md` | MODIFIED | Task 441 REWORK archived at top |
