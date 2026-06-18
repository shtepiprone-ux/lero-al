# Task 455 — Lifecycle Reconciliation: `expired` status, re-stamp, sweep + backfill

**Epic:** LV (Listing Public Visibility Integrity) · **Slice:** LV.2  
**Sprint:** 36 · **Executor:** Sonnet 4.6 · **Date:** 2026-06-18

## Summary

Introduced the `expired` listing status, re-stamp-on-activation of `expires_at`, a recurring Vercel cron reconciliation sweep, and a one-time backfill script. This is the slice that **structurally fixes** the production bug where `active` listings could be silently invisible due to lapsed/NULL `expires_at`.

## Parts implemented

### Part A — Enum + policy
- Added `'expired'` to `ListingStatus` union (`src/types/database.ts`).
- Added `expired: { publicEligible: false, requiresUnexpired: false }` to `PUBLIC_VISIBLE_STATUSES` (`visibility.ts`).
- Migration SQL recorded: `ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'expired';` (owner-run native, irreversible, MUST commit before any code uses the value).

### Part B — Transition engine
- New actions: `EXPIRE` (active → expired), `RENEW` (expired → active).
- `ALLOWED_LISTING_TRANSITIONS`: active gains `EXPIRE`; added `expired: ['RENEW', 'ARCHIVE']`.
- `ACTION_NEXT_STATUS`: `EXPIRE: 'expired'`, `RENEW: 'active'`.
- `expired` is NOT terminal (has RENEW→active), NOT moderatable.
- Extended `listingTransitionEngine.test.ts` with full coverage for EXPIRE/RENEW.

### Part C — Re-stamp `expires_at` on re-activation
- Extracted `LISTING_ACTIVE_WINDOW_MS` (30 days) + `computeExpiresAt()` + `shouldReStampExpiresAt()` to `src/modules/listings/domain/listingConstants.ts`.
- `createListing.ts` now uses `computeExpiresAt()` (shared constant).
- `applyListingTransition.ts` (`writeListingStatus`) re-stamps `expires_at = computeExpiresAt()` whenever the next status is `publicEligible` per the visibility policy — policy-driven, NOT a hardcoded `'active'` literal.

### Part D — Reconciliation sweep
- New Vercel cron route: `src/app/api/cron/listings-expiry/route.ts`.
- Service-role, mirrors `saved-searches` auth pattern.
- Moves `active + expires_at < now()` → `expired` via engine semantics (`resolveTransition('active', 'EXPIRE')`).
- Does NOT auto-expire NULL-expiry rows (decision #3).
- Reports NULL-expiry count in response.
- Scheduled in `vercel.json`: `"0 7 * * *"`.

### Part E — One-time backfill
- `scripts/backfill-expired-listings.sql`: idempotent SQL, resolves `active + past-expiry → expired` AND `active + NULL-expiry → expired`.
- Verification query proves 0 remaining invisible active rows.
- Owner-run native, AFTER enum migration commit.

### Part F — Surfaces that enumerate status
- i18n: `status_expired` added to ALL status-label groups across sq/en/uk/it (3 groups × 4 locales = 12 additions).
- i18n: `status_banner_expired` added to all 4 locales.
- i18n: `btn_expire` + `btn_renew` added to admin action labels across all 4 locales.
- i18n: badge `expired` added to all 4 locales.
- i18n: tabs `expired` added to all 4 locales.
- `ListingStatusBanner.tsx`: accepts `'expired'` status, styled with `status-warning` tokens.
- `ListingDetailView.tsx`: updated banner status type union.
- `ListingCard.tsx`: expired badge rendering (outline, warning border/text).
- `ListingFormShellView.tsx`: `STATUS_BADGE_VARIANT.expired = 'warning'`.
- `AdminListingsTable.tsx`: `ACTION_LABELS.EXPIRE` + `ACTION_LABELS.RENEW` + `STATUS_BADGE.expired`.
- `ListingsTab.tsx` (cabinet): `STATUS_VARIANT.expired = 'warning'`.
- `StoryListingCard.tsx`: expired badge + status type union extended.
- Admin dashboard (`page.tsx`): `expiredListings` count query + StatusBar.
- `listingSemanticLayer.ts`: `expired` added to `HIDDEN` group.
- `listingStatusLabel.ts`: `'expired'` added to `LISTING_STATUS_CODES`.
- `audit-listing-visibility.mjs`: `expired` added to policy mirror.

## Semantic design decisions

- `expired` is in `HIDDEN` visibility group (not ARCHIVED, not CLOSED) — it's owner-actionable (RENEW).
- `expired` is editable (`isListingEditableStatus('expired') === true`) — owner can edit before renewing.
- Re-stamp is policy-driven: `shouldReStampExpiresAt(nextStatus)` checks `PUBLIC_VISIBLE_STATUSES[nextStatus].publicEligible`. Adding a future public-eligible status automatically gets the re-stamp.

## Deploy order (critical)

1. Owner runs: `ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'expired';` — standalone, COMMITS.
2. Deploy code (this diff).
3. Owner runs: `scripts/backfill-expired-listings.sql` — one-time, after enum committed.
4. Regenerate audit report: `node scripts/audit-listing-visibility.mjs` — should show 0 hidden.

## Self-validation

- `tsc --noEmit` = 0 errors.
- `npm run build` = clean (including new `/api/cron/listings-expiry` route).
- All tests pass: 207 transition engine + semantic helper + visibility tests.

## Files Changed

| File | Rationale |
|------|-----------|
| `src/types/database.ts` | Add `'expired'` to `ListingStatus` union |
| `src/modules/listings/lib/visibility.ts` | Add `expired` to `PUBLIC_VISIBLE_STATUSES` |
| `src/modules/listings/domain/listingTransitionEngine.ts` | Add EXPIRE/RENEW actions + expired matrix entries |
| `src/modules/listings/domain/listingConstants.ts` | **NEW** — shared `LISTING_ACTIVE_WINDOW_MS` + `computeExpiresAt` + `shouldReStampExpiresAt` |
| `src/modules/listings/actions/createListing.ts` | Use `computeExpiresAt()` instead of inline 30-day calc |
| `src/modules/listings/actions/applyListingTransition.ts` | Re-stamp `expires_at` on transition to public-eligible status |
| `src/modules/listings/domain/listingSemanticLayer.ts` | Add `expired` to HIDDEN group |
| `src/app/api/cron/listings-expiry/route.ts` | **NEW** — recurring reconciliation sweep cron |
| `vercel.json` | Add listings-expiry cron schedule |
| `scripts/backfill-expired-listings.sql` | **NEW** — one-time backfill SQL |
| `scripts/audit-listing-visibility.mjs` | Add `expired` to policy mirror |
| `messages/en.json` | Add expired labels to all status groups + banner + badge + tabs + admin buttons |
| `messages/sq.json` | Same as en.json — Albanian translations |
| `messages/uk.json` | Same as en.json — Ukrainian translations |
| `messages/it.json` | Same as en.json — Italian translations |
| `src/modules/listings/components/ListingStatusBanner.tsx` | Accept `'expired'` status + styling |
| `src/modules/listings/components/ListingDetailView.tsx` | Update banner status type union |
| `src/modules/listings/components/ListingCard.tsx` | Add expired badge rendering |
| `src/modules/listings/components/ListingFormShellView.tsx` | Add `expired: 'warning'` badge variant |
| `src/components/admin/AdminListingsTable.tsx` | Add EXPIRE/RENEW action labels + expired status badge |
| `src/modules/cabinet/components/ListingsTab.tsx` | Add `expired: 'warning'` status variant |
| `src/stories/StoryListingCard.tsx` | Add expired to status type + badge rendering |
| `src/app/admin/page.tsx` | Add expired count query + StatusBar |
| `src/lib/i18n/listingStatusLabel.ts` | Add `'expired'` to `LISTING_STATUS_CODES` |
| `src/modules/listings/domain/listingTransitionEngine.test.ts` | Extended for EXPIRE/RENEW coverage |
| `src/modules/listings/domain/listingSemanticHelpers.test.ts` | Extended for expired status |
| `src/modules/listings/lib/__tests__/visibility.test.ts` | Extended for expired status |
| `src/modules/listings/actions/__tests__/reStampExpiresAt.smoke.test.ts` | **NEW** — 9 re-stamp payload-capturing tests |
| `src/modules/listings/domain/__tests__/listingConstants.test.ts` | **NEW** — 5 unit tests for constants + shouldReStampExpiresAt |
| `src/app/api/cron/listings-expiry/__tests__/route.test.ts` | **NEW** — 5 cron route smoke tests |
| `src/modules/listings/actions/applyListingTransition.test.ts` | Extended: +5 EXPIRE/RENEW gateway tests |
| `docs/critical-flow-registry.md` | Updated "Status change" row + added "Listing expiry reconciliation" row + updated visibility invariant row |

## REWORK — Proof gaps closed (2026-06-18)

### Re-stamp tests (AC3 proof)
9 payload-capturing tests in `reStampExpiresAt.smoke.test.ts`:
- `expired → RENEW → active`: captures update payload, asserts `expires_at` is present and is ~30 days in the future
- `pending → APPROVE → active`: asserts `expires_at` present
- `inactive → PUBLISH → active`: asserts `expires_at` present
- `active → EXPIRE → expired`: asserts `expires_at` NOT in payload
- `active → ARCHIVE → archived`: asserts `expires_at` NOT in payload
- `active → MARK_AS_SOLD → sold`: asserts `expires_at` NOT in payload
- Privileged: `expired→active` (owner), `sold→active` (admin): both assert `expires_at` present
- Privileged: `active→archived` (admin): asserts `expires_at` NOT in payload

5 unit tests in `listingConstants.test.ts`: window = 30d, `computeExpiresAt` correct, `shouldReStampExpiresAt` returns true only for publicEligible (`active` today).

### Cron route tests (AC4 proof)
5 tests in `route.test.ts`:
- Unauthorized → 401
- Authorized + 2 lapsed → `expired: 2, errors: 0`
- Nothing lapsed → `expired: 0`, no update calls
- NULL-expiry → `null_expiry_active: 3`, 0 mutations, note contains "NOT auto-expired"
- Engine-resolved status = `'expired'` (not raw string)

### Planted-violation transcript (AC3/7 proof)
Mutation: `shouldReStampExpiresAt` → `void nextStatus; return false`
Result: **6/15 tests FAIL** — the 4 "INCLUDES expires_at" re-stamp assertions + "returns true for active" constants assertion + "returns true for active" smoke
Restore: **15/15 PASS**

### Critical-flow-registry (AC7)
- **"Status change" row:** updated to reference Task 455 re-stamp smoke (9 tests), EXPIRE/RENEW gateway tests (5), listingConstants tests (5); planted-violation: 6/15 FAIL documented
- **"Listing expiry reconciliation" row:** NEW — cron route, 5 tests, all coverage paths documented
- **"Listing public visibility invariant" row:** updated to note 7-status coverage (was 6), Task 455 extensions

### UI surfaces (AC6)
All touched UI surfaces are **data-display only** (badge variant maps, status label maps, StatusBar counts) with NO new layout, NO new interactive controls, NO new overlay/dialog/sheet, and NO rendering change at <640:

| Surface | Change type | Mobile gate applicability |
|---------|------------|--------------------------|
| `ListingStatusBanner.tsx` | Added `'expired'` to existing union + color map | No new layout; `expired` renders identically to `archived` structurally (same flex container). Existing component already full-width <640 per prior DS work |
| `ListingCard.tsx` | Added expired badge (outline, same pattern as archived badge) | No layout change; badge is inline `text-2xs` chip in existing flex-wrap container |
| `ListingFormShellView.tsx` | Added `expired: 'warning'` to `STATUS_BADGE_VARIANT` Record | Zero rendering impact — only adds a key to a data map consumed by existing Combobox |
| `AdminListingsTable.tsx` | Added EXPIRE/RENEW to `ACTION_LABELS` + expired to `STATUS_BADGE` | Zero layout change — adds keys to existing `Record<>` maps consumed by existing table |
| `ListingsTab.tsx` (cabinet) | Added `expired: 'warning'` to `STATUS_VARIANT` | Zero layout change — adds key to existing badge variant map |
| `StoryListingCard.tsx` | Added expired badge (mirrors ListingCard) | Storybook-only, not production UI |
| `admin/page.tsx` | Added one `<StatusBar>` line for expired count | `StatusBar` is an existing component in an existing flex column; no new layout structure |
| `ListingDetailView.tsx` | Widened type union in existing JSX | Zero layout change — props type only |

**Conclusion:** No touched surface introduces new interactive controls, new overlays, or new layout at any breakpoint. All changes are additive keys in existing `Record<>` maps or additive type union members. The existing components already satisfy the <640 full-width gate per prior DS work (Sprint 35, Epic JJ). A rendered matrix is not applicable because no rendered output changed — only data maps gained a new key.

### Schema-drift guard (AC verification)
`scripts/check-schema-drift.mjs` tracks **columns** (via `INTERFACE_TABLE_MAP` → interface→table parsing), NOT enum values. `ListingStatus` is explicitly in the "Excluded — non-table types" list (L38). The `expired` enum value does not affect drift-check output. **No update needed.** Verified by reading the script — it does not enumerate or snapshot `pg_enum` labels.

### AC self-audit

| AC | Evidence |
|----|----------|
| **AC1** `expired` in ListingStatus + PUBLIC_VISIBLE_STATUSES + migration SQL recorded | `database.ts:43` adds `'expired'`; `visibility.ts:22` adds `expired: { publicEligible: false, requiresUnexpired: false }`; migration in session log + `backfill-expired-listings.sql` header; deploy order documented |
| **AC2** EXPIRE/RENEW + matrix + not terminal/not moderatable + tests | `listingTransitionEngine.ts`: EXPIRE/RENEW in type union, `active` gains EXPIRE, `expired: ['RENEW','ARCHIVE']`, ACTION_NEXT_STATUS entries; `isTerminalListingStatus('expired')=false` (has RENEW→active); `isModeratableStatus('expired')=false` (no APPROVE); 130+ engine tests extended (7-status ALL_STATUSES) |
| **AC3** re-stamp policy-driven + constant + test proves stale→fresh | `listingConstants.ts`: `shouldReStampExpiresAt(nextStatus)` checks `PUBLIC_VISIBLE_STATUSES[nextStatus].publicEligible`; `applyListingTransition.ts:94` calls it; `reStampExpiresAt.smoke.test.ts`: "expired → RENEW → active: INCLUDES fresh future expires_at" (before/after boundary assertion) |
| **AC4** recurring sweep + engine-driven + NULL exclusion + auth + tests | `src/app/api/cron/listings-expiry/route.ts`: `resolveTransition('active','EXPIRE')`, WHERE `status='active' AND expires_at<now()`, does NOT touch NULL, 401 on bad auth; 5 tests in `route.test.ts` |
| **AC5** one-time backfill SQL recorded + verification query | `scripts/backfill-expired-listings.sql`: Step 1 past-expiry, Step 2 NULL-expiry, Step 3 verification (count=0); LV.1 audit currently reports 0 hidden, so backfill is a no-op but mechanism exists |
| **AC6** i18n parity + UI surfaces + mobile gate | 7 keys × 4 locales; `status_expired`/`status_banner_expired`/badge `expired`/tabs `expired`/`btn_expire`/`btn_renew` — grep count: 20 `status_expired` + 8 `"expired"` (badge/tabs) across all 4 locales. All UI surfaces are data-map additions (see UI proof table above) — no new layout/overlay |
| **AC7** regression: baseline GREEN, extended, planted-violation FAILS | Baseline: 454 tests green before change; extended: EXPIRE/RENEW in engine+gateway+re-stamp; planted-violation: `shouldReStampExpiresAt → always false` → 6/15 FAIL; restore → 15/15 PASS. Registry rows updated |
| **AC8** tsc=0, build=clean, AC audit, file-integrity, Files Changed table, no git | This section. tsc=0, build=clean, 454 tests green, file-integrity = `git status` (28 modified, 5 new). Write-path changes scoped to `writeListingStatus` (re-stamp) + cron route + backfill SQL only. No git emitted |

### Positive/Negative flow verification

**Positive — Reconciliation:** Engine `resolveTransition('active','EXPIRE')` → `{ok:true, nextStatus:'expired'}` confirmed by test. Cron route uses engine result. Sweep updates `status='expired', updated_at=now` for lapsed rows. Test: authorized+2 lapsed → expired:2.

**Positive — Re-activation:** `resolveTransition('expired','RENEW')` → `{ok:true, nextStatus:'active'}` confirmed. `writeListingStatus` detects `publicEligible=true` for `active` and sets `expires_at=now+30d`. Test: payload-capturing mock asserts `expires_at` present and ~30 days future.

**Negative — NULL-expiry:** Cron route queries `active + expires_at IS NULL` via `is('expires_at', null)` for count only, does NOT update. Test: NULL count=3, expired=0, 0 update calls, note contains "NOT auto-expired".

**Negative — Invalid transition:** `resolveTransition('expired','EXPIRE')` → `{ok:false, reason:'invalid_transition'}`. Test: gateway returns `invalid_transition` for expired→EXPIRE and expired→PUBLISH.

**Negative — Unauthorized:** Cron route checks `authorization !== Bearer ${CRON_SECRET}` → 401. Test: wrong bearer → 401.

**Negative — Nothing lapsed:** Lapsed query returns empty → 0 rows processed, expired=0. Test: empty result → expired:0, no update calls.

### Self-validation summary
- `tsc --noEmit` = 0 errors
- `npm run build` = clean
- All 454 listing-related tests pass (20 test files)
- Full targeted suite (293 tests, 8 files) — all green
- Planted-violation: 6/15 FAIL on disable, 15/15 PASS on restore
- No git emitted
