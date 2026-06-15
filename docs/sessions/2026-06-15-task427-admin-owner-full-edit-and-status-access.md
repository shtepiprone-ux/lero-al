# Session: Task 427 — Admin/Owner full edit + any-status access (2026-06-15)

Kickoff: `tasks/Epics/Epic_I_kickoff_prompt_Task_427_AdminOwnerFullEditAndStatusAccess.md` (read in full, corrected/owner-resolved version).

## Rework Addendum (2026-06-15) — closes 4 review gaps

Rework kickoff: `tasks/Epics/Epic_I_kickoff_prompt_Task_427_REWORK.md`. The orchestrator routed Task 427 back with 1
blocker (literal-AC deviation) and 3 evidence gaps. All 4 deltas are addressed below (R1–R4); see the updated
"Files Changed" table, "Delete (AC5) — proof trace", "Validation" (build transcript), and "Rendered Mobile Matrix
(AC R4)" sections.

- **Delta 1 (BLOCKER, owner decision):** removed the same-status no-op success branch from
  `applyListingTransitionByStatus` (`applyListingTransition.ts:231-234`). Same-status is not a real transition;
  `canSetStatusPrivileged(x,x)` is already `false`, so the existing `invalid_transition` check now naturally covers
  `to===from` for privileged callers — zero engine changes. Tests rewritten accordingly.
- **Delta 2 (proof only, no code change):** added "Delete (AC5) — proof trace" subsection below.
- **Delta 3 (owner decision, no waiver):** ran `npm run build` — GREEN, transcript in "Validation".
- **Delta 4 (owner decision, no waiver):** added one new Storybook story export per surface
  (`AdminListingsTable.stories.tsx` / `ListingFormShellView.stories.tsx`) as rendered-evidence harnesses, captured
  uk@320/375/390 via `responsive-screenshots` infra — see "Rendered Mobile Matrix (AC R4)".

## Summary

Two coupled defects fixed:
1. Admin "Редагувати" on `sold`/`rented`/`archived` listings redirected to the public view instead of opening
   the editor (for everyone, including admin/owner).
2. From `sold`/`rented` only `ARCHIVE` was offered as a status action, when admin/moderator (any listing) AND
   the listing owner (own listing) should be able to move to ANY status from ANY status at any time — including
   owner pending→active self-approve on their OWN listing — and edit content at any status.

Implementation per kickoff §1–§5: added a pure privileged any-status resolver to the transition engine, widened
the single-write gateway (`applyListingTransitionByStatus`) to `privileged = isOwner || canAdminEditListing`,
simplified `checkEditPermission` to drop the status-based `not_editable` reason, derived `AdminListingsTable`'s
status-action set from the engine (no divergent hardcode, Note 14), and switched the owner-cabinet
`StatusChangeControl` to the full privileged any-status set. `ALLOWED_LISTING_TRANSITIONS`, the action-based
`applyListingTransition` gateway, and all semantic helpers (`isTerminalListingStatus` /
`isMarketClosedStatus` / `isModeratableStatus` / `isListingEditableStatus`) are UNCHANGED.

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/modules/listings/domain/listingTransitionEngine.ts` | Added `ALL_LISTING_STATUSES`, `getPrivilegedTargetStatuses`, `canSetStatusPrivileged`, `getAllowedTargetStatuses` (lines 175–206). Base matrix, `ACTION_NEXT_STATUS`, `resolveTransition`, `getTransitionActionForStatus`, semantic helpers UNCHANGED. | §1 — pure privileged any-status resolver, single source of truth |
| `src/modules/listings/domain/index.ts` | Exported the 3 new functions from the barrel (lines 73–75). | §1 — public domain API |
| `src/modules/listings/actions/applyListingTransition.ts` | Extracted private `writeListingStatus` (the single DB-write point, line 82); `executeTransition` now delegates to it; rewrote `applyListingTransitionByStatus` (line 208) as the PRIVILEGED any-status gateway: fetches listing, `isOwner = current.user_id === actor.userId` (line 224), gate `!isOwner && !canAdminEditListing` → forbidden (line 225), else `canSetStatusPrivileged` (line 233) → `invalid_transition` or write. `applyListingTransition` (action-based) UNCHANGED. **Rework Delta 1:** removed the same-status no-op success branch (was lines 231-234) — `to===from` now falls through to `canSetStatusPrivileged`, which is `false` for `to===from`, naturally yielding `invalid_transition`. No engine change. | §2 — widen the single-write gateway, preserve single-write-point invariant; rework: literal-AC fix for `to===from` |
| `src/modules/listings/domain/listingPermissions.ts` | `EditPermissionCheck` narrowed to `{ok:true} \| {ok:false, reason:'forbidden'}` (line 49–51); `checkEditPermission` (line 62) now only calls `canUserEditListing` — no status check, `not_editable` removed; `ListingEditForbiddenError` reason narrowed to `'forbidden'`. | §3 — edit-at-any-status for authorized editor |
| `src/app/[locale]/listings/[slug]/edit/page.tsx` | `canManageStatus` (line 65) now `listing.user_id === user.id \|\| canAdminEditListing(userRole)` (was admin/mod only). `checkEditPermission` redirect (line 61) now only blocks non-owner/non-staff. | §3 — admin/owner editor access at any status + status control visibility |
| `src/modules/listings/components/ListingFormShellView.tsx` | `statusOptions` derivation (lines 114–127) now uses `getAllowedTargetStatuses(currentStatus, {privileged:true})` instead of `getTransitionActionForStatus`-only filtering — owner cabinet `StatusChangeControl` shows the full privileged set. Reuses existing `status_*` i18n labels (all 6 statuses, all 4 locales already present) — 0 new keys here. | §5 — owner cabinet any-status control |
| `src/components/admin/AdminListingsTable.tsx` | Replaced hardcoded `STATUS_ACTIONS: Record<ListingStatus, StatusActionDef[]>` map with `ACTION_LABELS: Record<ListingTransitionAction, {labelKey, className?}>` (lines 42–51) + `getStatusActionsForStatus()` (lines 59–67), engine-derived via `getPrivilegedTargetStatuses` + `getTransitionActionForStatus`. `ListingPreviewDialog` takes new `statusLabels` prop (full `STATUS_LABEL` map) for the generic `btn_set_status` label's `{status}` param; both call sites (`.length > 0` guard and `.map`) now call `getStatusActionsForStatus(listing.status)` (lines 319, 325). | §4 — admin table privileged status actions, no divergent hardcode (Note 14) |
| `messages/{sq,en,uk,it}.json` | Added `admin.listings.btn_set_status` (`"Set to {status}"` / `"Vendos si {status}"` / `"Встановити: {status}"` / `"Imposta su {status}"`) — the ONE new key, identical placement after `btn_restore` in all 4 files. | §4/§6 — generic label for privileged-only transitions with no base-matrix action |
| `src/modules/listings/domain/listingTransitionEngine.test.ts` | New describe blocks: regression guard (base matrix + semantic helpers unchanged), `getPrivilegedTargetStatuses`, `canSetStatusPrivileged`, `getAllowedTargetStatuses` (privileged true/false). | AC1 |
| `src/modules/listings/actions/applyListingTransition.test.ts` | `MockSelectResult` extended with optional `user_id`; new describe `applyListingTransitionByStatus — privileged any-status access` (owner self-approve sold→active / archived→pending, admin sold→active, non-owner/non-staff forbidden, owner-of-other's-listing forbidden, null-role forbidden); rewrote the old "invalid transitions" describe block (sold→active, sold→pending, archived→active, rented→inactive are now `ok:true` for privileged actors, not `invalid_transition`). **Rework Delta 1:** replaced the "owner of own listing: same-status no-op succeeds" test with a new describe block "applyListingTransitionByStatus — same-status is not a transition (Task 427 rework)" — admin and owner same-status calls now assert `{ok:false, reason:'invalid_transition'}`. | AC2; rework: literal-AC fix for `to===from` |
| `src/modules/listings/domain/listingPermissions.test.ts` | Rewrote `not_editable`-asserting tests: owner/admin on sold/rented/archived → `{ok:true}`; non-owner on sold → `{ok:false, reason:'forbidden'}` (removed the "not_editable takes precedence" test, no longer applicable); `assertCanEditListing` owner+sold no longer throws. | AC3 |
| `src/components/admin/AdminListingsTable.stories.tsx` | Added `PreviewDialogSoldStatusActions` story export (after `LocaleStress`) — opens `ListingPreviewDialog` for the `sold` fixture (`lst-004`) via a `play` function click on the listing title, rendering the full 5-button privileged status-action set. Added `within`/`userEvent` import from `storybook/test`. No production component/styling/i18n/engine/gateway/option-derivation change. | rendered-evidence harness for AC R4 |
| `src/modules/listings/components/ListingFormShellView.stories.tsx` | Added `StaffStatusControlOpen` story export (after `Staff`) — same `statusControl` args as `Staff` (`currentStatus:'pending'`), with a `play` function that clicks the `StatusChangeControl` Combobox trigger to render the open bottom sheet with the full 6-option privileged set. No production component/styling/i18n/engine/gateway/option-derivation change. | rendered-evidence harness for AC R4 |
| `scripts/responsive-screenshots.mjs` | Added 2 entries to `STORY_TARGETS`: `admin-adminlistingstable--preview-dialog-sold-status-actions` and `listings-listingformshellview--staff-status-control-open`, both `locales:['uk']`, `viewports:['mobile-320','mobile-375','mobile-390']`. | rendered-evidence harness for AC R4 |

No other files touched. `tasks/Epics/Epic_I_kickoff_prompt_Task_427_AdminOwnerFullEditAndStatusAccess.md` shows as modified in `git status` but was NOT edited in this session (already corrected by the orchestrator prior to handoff).

## Delete (AC5) — proof trace

AC5 requires that delete remains possible from ANY status (sold/rented/archived included), unaffected by the
privileged any-status changes in this task. `deleteListing.ts` was read in full (67 lines) and is **NOT edited**
in this task — no status gate exists to remove.

1. **Code trace — no status branch.** `deleteListingAction` (`deleteListing.ts:20-66`) performs a single
   unconditional delete-by-id:
   ```ts
   const { error } = await supabase
     .from('listings')
     .delete()
     .eq('id', listingId)          // deleteListing.ts:36-39
   ```
   There is no `.eq('status', ...)`, no `if (listing.status === ...)`, and no read of the listing's current status
   anywhere in the file before or after the delete call. The only preconditions checked are `!user` (unauthenticated,
   line 24) and `getBlockedError(user.id)` (blocked-user check, line 25-26) — both identity-based, not status-based.

2. **RLS citation.** The function comment (`deleteListing.ts:11-19`) states delete is RLS-enforced via the server
   `createClient()` — "only the listing owner (or admin/moderator via RLS) can delete their own rows." Per
   `docs/rls-rules.md` → "Supabase RLS Checklist": delete policies are required to check `auth.uid()` and role
   constraints, i.e. ownership/role-scoped, with **no status predicate** in the policy definition contract.

3. **Conclusion.** Delete authorization is ownership/role-scoped (RLS) and status-independent, both in application
   code (no status branch in `deleteListingAction`) and by the documented RLS contract (no status predicate).
   AC5 holds unchanged — confirmed by trace, not by a new test (delete is not unit-testable in isolation from the
   RLS layer per the kickoff's accepted fallback). No production code change required or made.

## AC-by-AC Self-Audit

| # | AC | Evidence | Status |
|---|---|---|---|
| 1 | Engine: pure privileged any-status resolver added, base matrix/semantic helpers unchanged | `listingTransitionEngine.ts:175-206`; regression-guard describe block in `listingTransitionEngine.test.ts` asserts `ALLOWED_LISTING_TRANSITIONS` unchanged for sold/rented/archived + all semantic helpers unchanged | ✅ |
| 2 | Gateway: `applyListingTransitionByStatus` widened to `privileged = isOwner \|\| canAdminEditListing`; single-write-point preserved | `applyListingTransition.ts:82` (`writeListingStatus`, the only `db.update({status})`), `:208-241` (privileged gateway); `applyListingTransition.test.ts` new privileged-access describe block, 8 new tests | ✅ |
| 3 | Permissions/edit-page: owner/admin/mod can edit at ANY status; non-owner/non-staff forbidden regardless of status | `listingPermissions.ts:49-71` (`EditPermissionCheck` = `{ok:true}\|{ok:false,reason:'forbidden'}`); `edit/page.tsx:56-65`; `listingPermissions.test.ts` rewritten (owner/admin sold/rented/archived → ok:true; non-owner sold → forbidden) | ✅ |
| 4 | Admin table: `STATUS_ACTIONS` engine-derived privileged set, no divergent hardcode (Note 14); all targets available from sold/rented/archived; Edit link resolves to editor | `AdminListingsTable.tsx:42-67` (`ACTION_LABELS` + `getStatusActionsForStatus`), `:319-339` (both usages); Edit link (`href=.../edit`) unaffected — AC3 now permits the editor to load at any status instead of redirecting | ✅ |
| 5 | Owner cabinet: `StatusChangeControl` shows full privileged status set via `getAllowedTargetStatuses(currentStatus,{privileged:true})`, reuses `changeListingStatusAction`/`applyListingTransitionByStatus` (no second pipeline) | `ListingFormShellView.tsx:114-127`; `changeListingStatusAction` (`changeListingStatus.ts`, unchanged) already calls `applyListingTransitionByStatus` — works automatically with the widened gateway | ✅ |
| 6 | i18n parity sq/en/uk/it, identical key sets, no English fallback, runtime-verified in uk | `messages/{sq,en,uk,it}.json` — 1 new key `admin.listings.btn_set_status`, all 4 locales translated (not English-fallback copies); `npm run check:i18n` → "Parity PASSED — all 4 locale files have identical key sets (1788 keys)" | ✅ |
| 7 | Mobile <640 full-width + bottom-sheet gate, rendered verification matrix | See "Mobile <640 Gate" section below — no new control types introduced; all touched controls reuse already-verified canonical primitives | ✅ (inherited, see below) |
| 8 | Self-validation: tsc=0, build/tests, AC table, file-integrity, UX-flow trace, control inventory | `npx tsc --noEmit` → 0 errors; `npx vitest run` → 585/585 pass (3 files touched: 0 fail); `check:file-integrity` → 15/15 clean; `check:i18n` + `check:i18n-dynamic` → PASS; see below | ✅ |
| R1 | (Rework, BLOCKER) Same-status is not a transition: `applyListingTransitionByStatus` with `to===from` must yield `{ok:false, reason:'invalid_transition'}`, not a no-op success | `applyListingTransition.ts:231-234` no-op branch removed; `canSetStatusPrivileged(x,x)` is `false` → falls through to existing `invalid_transition` check (line ~233); `applyListingTransition.test.ts` new describe "same-status is not a transition (Task 427 rework)" — admin + owner same-status → `invalid_transition`; `npx tsc --noEmit` → 0 errors; 48/48 tests pass for this file | ✅ |
| R2 | (Rework) Delete (AC5) remains status-independent — proof trace required | See "Delete (AC5) — proof trace" section above: `deleteListing.ts` unedited, no status branch, RLS ownership/role-scoped per `rls-rules.md` | ✅ |
| R3 | (Rework) `npm run build` GREEN transcript | See "Validation" below — exit 0, "✓ Compiled successfully in 54s", "✓ Generating static pages (39/39)" | ✅ |
| R4 | (Rework) Rendered mobile matrix (uk@320/375/390) for `ListingPreviewDialog` 5-button sold/rented set AND owner/editor `StatusChangeControl` full 6-option set, open/interactive state | See "Rendered Mobile Matrix (AC R4)" below — 2 new Storybook stories (rendered-evidence harnesses), 6 screenshots captured and reviewed, all 4 checks PASS at all 3 breakpoints for both surfaces | ✅ |

## Mobile <640 Gate (AC7)

No new control types, no new `className` width/height overrides, and no new popup primitives were introduced.
Every touched interactive surface reuses an existing canonical component whose <640 full-width / bottom-sheet
compliance was already established and rendered-verified in prior sessions:

| Surface | Component reused | Prior verification |
|---|---|---|
| `ListingPreviewDialog` status-action buttons (`AdminListingsTable.tsx:325-339`) — now up to 5 buttons per status instead of 1-3 | `<Button variant="outline" size="sm">` (unchanged element/props, only the data array driving `.map()` changed) | Task 421 (`44227e995`) added `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` to every non-icon `Button` size variant incl. `sm` (`button.tsx:26`) — applies identically regardless of how many buttons are rendered |
| `ListingPreviewDialog` itself (`Dialog`/`DialogContent`) | Canonical `Dialog`/`DialogContent` — unchanged | Canonical primitive, full-width bottom sheet at <640 per design-system contract |
| Owner-cabinet status `StatusChangeControl` (`ListingFormShellView.tsx:316-323`, `variant="select"`) — now up to 6 options instead of ≤4 | `StatusChangeControl` `variant="select"` (unchanged component/props; only `statuses` array length changed) | Task 425 (`docs/sessions/2026-06-14-task425-statuschangecontrol-mobile-note-submit.md`) rendered-verified `admin-statuschangecontrol--select` full-width Combobox trigger + bottom-sheet at uk@320/375/390; more rows inside an already-full-width bottom sheet does not change its width/anchoring behavior |

Since the diff is additive-only to existing `.map()` data sources feeding unchanged canonical components (no new
JSX elements, no new `className`), the <640 full-width/bottom-sheet behavior is inherited byte-for-byte from the
prior verified state. `npm run check:i18n` confirms no locale-leak regression on the new `btn_set_status` key
(parity PASSED, 1788 keys × 4 locales).

`npm run check:locale-leak:fast` (full Storybook rebuild + Playwright render) was run and reported 3 pre-existing
leaks ("ALL", "Gas", "Upload Widget" in `Listings/ListingFormShellView/Staff`/`Owner` for sq/uk/it) — all in the
currency-toggle, heating-option, and Cloudinary-widget areas, NONE of which are touched by this diff (confirmed
via `git diff` — zero lines changed in those regions). Pre-existing, non-blocking (exit 0), out of scope for
Task 427.

## Positive Flow

1. **Admin/moderator**, any listing, status = `sold`/`rented`/`archived`: clicks "Редагувати" → editor opens
   (no redirect, `checkEditPermission` returns `{ok:true}` via `canAdminEditListing`). The "Change status" block
   shows all 5 other statuses (`getAllowedTargetStatuses(currentStatus,{privileged:true})`), including direct
   `sold → active` / `archived → pending`. Selecting one calls `changeListingStatusAction` →
   `applyListingTransitionByStatus` → `isOwner=false, canAdminEditListing=true` → privileged write succeeds.
2. **Owner**, own listing, status = `pending`: in the admin table preview dialog (if staff) or their own cabinet,
   sees a `btn_set_status` "Set to Active" action (no base-matrix `APPROVE` semantics needed) — self-approve
   pending→active. `applyListingTransitionByStatus`: `isOwner=true` → `canSetStatusPrivileged('pending','active')`
   → true → write succeeds.
3. **Admin table**, listing status = `sold`: `getStatusActionsForStatus('sold')` now returns 5 buttons (one
   `ARCHIVE`-labeled via `ACTION_LABELS`, four `btn_set_status`-labeled with `{status}` interpolated from
   `STATUS_LABEL`) — all clickable, all route through `updateListingStatus` → `applyListingTransitionByStatus`.

## Negative Flow Verification

| Branch | Status |
|---|---|
| Unauthenticated user hitting `/listings/[slug]/edit` | Unchanged — `if (!user) redirect(.../auth/login...)` (`edit/page.tsx:25`) |
| Non-owner, non-staff user hitting `/listings/[slug]/edit` (any status) | `checkEditPermission` → `{ok:false, reason:'forbidden'}` → redirect to public view (`edit/page.tsx:61`), unchanged outcome, now status-independent |
| Non-owner, non-staff caller of `applyListingTransitionByStatus` (any target status, including same-status no-op) | `isOwner=false && !canAdminEditListing` → `{ok:false, reason:'forbidden'}` — verified `applyListingTransition.test.ts` ("non-owner, non-staff caller: forbidden even for same-status no-op", "...forbidden for any target status") |
| Owner targeting a listing they do NOT own | `isOwner=false` (user_id mismatch) and role insufficient → `forbidden` — verified ("owner targeting a listing they do not own: forbidden") |
| `applyListingTransition` (action-based, automation/moderation) — user/null role | UNCHANGED — still `{ok:false, reason:'forbidden'}` via `canAdminEditListing`-only gate; all pre-existing tests pass |
| DB write failure (`db_error`) | `writeListingStatus` unchanged error path — pre-existing test passes |
| `not_found` (listing missing) | UNCHANGED in both gateways — pre-existing tests pass |

## Control Inventory (Note 20) — before / after

| Control | Before | After |
|---|---|---|
| Admin "Редагувати" link on sold/rented/archived | Present (link unchanged), but server redirected to public view post-click | **Unchanged element** — now resolves to the editor (server no longer redirects for staff/owner) |
| `ListingPreviewDialog` status-action buttons | 0-3 buttons per status (sold/rented: 1 — ARCHIVE only; archived: 1 — RESTORE only) | 5 buttons per status (all other statuses reachable); same `<Button variant="outline" size="sm">` element, same disabled/loading wiring |
| Owner-cabinet `StatusChangeControl` (`variant="select"`) options | ≤4 options (base-matrix-derived, e.g. pending: active/inactive/archived) | Up to 6 options (current + all 5 others); same component/variant, `enableNote` unchanged |
| `checkEditPermission` status-gate | Returned `{ok:false, reason:'not_editable'}` for sold/rented/archived regardless of role | Removed — only ownership/role gates edit access now |

## Rendered Mobile Matrix (AC R4)

Per the owner's decision, two minimal Storybook story exports were added as rendered-evidence harnesses (no
production component/styling/i18n/engine/gateway/option-derivation change):

- `Admin/AdminListingsTable` → `PreviewDialogSoldStatusActions` — `play` opens `ListingPreviewDialog` for the
  `sold` fixture (`lst-004`), rendering the full 5-button privileged status-action set.
- `Listings/ListingFormShellView` → `StaffStatusControlOpen` — same args as `Staff` (`currentStatus:'pending'`),
  `play` opens the `StatusChangeControl` Combobox so the full 6-option privileged set renders as a bottom sheet.

Both registered in `scripts/responsive-screenshots.mjs` → `STORY_TARGETS`, captured at `uk@mobile-320/375/390`
(6 PNGs total) to `.screenshots/responsive/2026-06-15-task427-rework/` (gitignored) and reviewed individually.

| Surface | Viewport | No h-scroll | Full-width / wrap / ≥44px buttons | Bottom-sheet (not centered/mini-dropdown) | uk labels not clipped |
|---|---|---|---|---|---|
| `ListingPreviewDialog` sold (5 status-action buttons + 3 link rows) | uk@320 | ✅ | ✅ — 5 full-width status buttons ("Встановити: На модерації/Активне/Неактивне/Орендовано", "Архівувати") | ✅ — full-width bottom sheet, drag handle, edge-to-edge | ✅ |
| `ListingPreviewDialog` sold | uk@375 | ✅ | ✅ | ✅ | ✅ |
| `ListingPreviewDialog` sold | uk@390 | ✅ | ✅ | ✅ | ✅ |
| `ListingFormShellView` `StatusChangeControl` open (6 options) | uk@320 | ✅ | ✅ — 6 full-width option rows ("На модерації" ✓ current, "Активне", "Неактивне", "Продано", "Орендовано", "Архів") | ✅ — full-width bottom sheet, drag handle | ✅ — "Архів" is the full uk string (`messages/uk.json:177`), not truncated |
| `ListingFormShellView` `StatusChangeControl` open | uk@375 | ✅ | ✅ | ✅ | ✅ |
| `ListingFormShellView` `StatusChangeControl` open | uk@390 | ✅ | ✅ | ✅ | ✅ |

All 6 cells PASS on all 4 checks. The 5-button `ListingPreviewDialog` set and the 6-option `StatusChangeControl`
set are the maximum-density privileged variants introduced by this task (Note: discovered without any code change
that `getAllowedTargetStatuses('pending', {privileged:true})` already yields all 6 statuses for `currentStatus:
'pending'`, so the existing `Staff` story's args already produced the full privileged set — only the "open"
interaction needed to be added).

## i18n

1 new key added to `admin.listings` in all 4 locale files: `btn_set_status` (`"{status}"` param). No keys removed,
no English fallbacks. `npm run check:i18n` → Parity PASSED, 1788 keys × 4 locales.

## Validation

- `npx tsc --noEmit` → **0 errors**
- `npx vitest run` → **585/585 pass** (18 test files; 3 touched: `listingTransitionEngine.test.ts`,
  `applyListingTransition.test.ts`, `listingPermissions.test.ts`)
- `node scripts/check-file-integrity.mjs <15 touched files>` → **15/15 clean** (0 NUL, no BOM, JSON/`.ts` parse OK)
- `npm run check:i18n` → **Parity PASSED** (1788 keys × 4 locales); 2 pre-existing raw-enum warnings (non-blocking,
  unrelated files — `AdminInquiriesManager.tsx`/`AdminSupportManager.tsx`, not touched)
- `npm run check:i18n-dynamic` → **PASSED** (195 keys × 4 locales, 0 errors)
- `npm run check:locale-leak:fast` → 3 pre-existing leaks in `ListingFormShellView` stories, all in
  untouched regions (currency toggle / heating option / upload-widget text) — non-blocking, out of scope

### Rework Delta 3 — `npm run build` (GREEN, exit 0)

```
✓ Compiled successfully in 54s
   Linting and checking validity of types ...
   Collecting page data ...
✓ Generating static pages (39/39)
   Finalizing page optimization ...
```

Only warning emitted was a pre-existing, unrelated CSS warning about `.rounded-[min/calc(var(--radius...)...)]`
(not touched by this diff). Exit code 0.

### Rework re-validation summary

- `npx tsc --noEmit` → **0 errors** (re-run after Delta 1 + Delta 4 story additions)
- `npx vitest run` → **585/585 pass** (net-zero test-count change from Delta 1's rewrite)
- `node scripts/check-file-integrity.mjs` (20 touched files: 15 original + 5 rework: `applyListingTransition.ts`,
  `applyListingTransition.test.ts`, `AdminListingsTable.stories.tsx`, `ListingFormShellView.stories.tsx`,
  `scripts/responsive-screenshots.mjs`) → **20/20 clean**
- `npm run check:i18n` → **Parity PASSED** (1788 keys × 4 locales, unchanged — 0 new i18n keys from Delta 4 stories),
  same 2 pre-existing non-blocking raw-enum warnings as before
- `npm run build` → **GREEN**, exit 0 (transcript above)

## Self-Validation Verdict

**PASS — rework complete, all 4 deltas closed.** All 8 parent ACs + R1-R4 satisfied. Single-write-point invariant
preserved (`writeListingStatus` is the only `db.update({status})`). Base transition matrix, action-based gateway,
and semantic helpers unchanged (regression-guarded by new tests). Same-status (`to===from`) now correctly yields
`invalid_transition` for the privileged gateway (Delta 1, zero engine changes). Delete (AC5) confirmed
status-independent by code + RLS trace (Delta 2). `npm run build` GREEN (Delta 3). Rendered mobile matrix for both
maximum-density privileged surfaces (5-button `ListingPreviewDialog`, 6-option `StatusChangeControl`) at
uk@320/375/390 — all PASS via 2 new rendered-evidence Storybook stories (Delta 4). No new control types or popups
beyond the 2 story harnesses — mobile <640 gate compliance inherited from Task 421/425 canonical primitives. 1 new
i18n key (parent task only, unchanged), full 4-locale parity. 0 tsc errors, 585/585 tests pass, file-integrity
20/20 clean.
