# Session — Task 461: Admin report-details — show listing owner

**Date:** 2026-06-18  
**Epic:** BB · **Type:** Admin moderation UI (read-only embed)  
**Executor:** Sonnet 4.6

## Phase 0 — Audit

### §1 — Owner embed
FK: `listings_user_id_fkey` (confirmed from `src/app/admin/listings/page.tsx:60`).
Embed syntax: `listing:listings(id, title, slug, owner:users!listings_user_id_fkey(id, name, user_type))`.
Query via `createAdminClient()` (service_role) — no new grant/RLS change needed.

### §2 — Account-type column
`users.user_type: 'private' | 'agent' | 'developer'` (`src/types/database.ts:2,166`).
Canonical badge: `AdminUserProfile.tsx:755-757` → `<Badge variant="neutral">` with `PROFILE_TYPE_LABELS[profileTypeFromUser(user)]`.
For the report dialog, I use `user_type` directly (no `role` fetch needed): `profile_types.private` / `profile_types.agent` / `profile_types.developer` from `admin.users` namespace.

### §3 — Null owner
`listing.owner` null when: owner user deleted, listing→user FK points to missing user, or embed returns null. Handled with `owner_not_found` fallback.

### §4 — Bottom sheet
`ReportDetailDialog` uses `<DialogContent className="max-w-md">`. The canonical `Dialog` renders as a bottom sheet at <640 per design-system §26.2 / Task 243/424. No structural change needed.

## Changes

### Query (`src/app/admin/reports/page.tsx:18`)
Extended embed: added `owner:users!listings_user_id_fkey(id, name, user_type)` nested inside the `listing` embed. No other query change.

### Type + Dialog (`src/components/admin/AdminReportsManager.tsx`)
- `ReportRow.listing.owner` type added (nullable: `{ id, name, user_type } | null`)
- New "Власник оголошення" row between Listing and Reporter: name + `Badge variant="neutral"` + `Link` to `/admin/users/[ownerId]` (min-h-11 touch target, wraps)
- Null fallback: `owner_not_found` label, no link, no badge, no crash
- Existing rows (Status, Reason, Listing, Reporter, Comment, Date, actions) — unchanged

### i18n
3 new keys × 4 locales (`admin.reports`): `col_owner`, `owner_not_found`, `open_profile`. Account-type labels reuse existing `admin.users.profile_types.*` keys. 1849-key parity.

## Mobile <640 gate
Dialog is an existing `max-w-md` canonical Dialog → full-width bottom sheet at <640 (design-system §26.2). New owner row uses `flex-wrap` + `min-h-11` link target. No layout regression.

**Rework 1 fix:** added `AdminReportsManager.stories.tsx` with `play` functions that click a report row to open the dialog (uk-only viewports). Pattern follows `AdminListingsTable.stories.tsx` precedent (Task 427).

**Rework 2 fix (AC6 full locale × breakpoint matrix):** expanded stories to per-locale-pinned variants.

**Rework 3 fix (Blocker A + B + Nit):** removed all `globals.locale` pins (banned by `check:stories` Check 4 / agent-contract clause 13c). Stories are now toolbar-reactive: `DialogOwnerRow_Mobile320`, `DialogOwnerRow_Mobile375`, `DialogOwnerRow_Mobile390`, `DialogOwnerRow_Desktop` — locale sweep comes from `screenshots:assert` machine harness, not pinned variants. Removed unused `within` import (Nit). `npm run check:stories` = PASSED (0 violations).

### AC6 rendered evidence — `npm run screenshots:assert --fast`

Machine-rendered matrix via `scripts/check-stories-rendered.mjs --fast` (77 stories × 3 viewports × 4 locales). Per-cell assertions (a)–(e): no h-overflow at 320, full-width controls <640, no render failures, full-width text buttons <640, bottom-sheet contract for open overlays <640. Output: `.screenshots/rendered-assert/2026-06-18T17-59/manifest.json`.

AdminReportsManager dialog stories at mobile widths — toolbar sweeps all 4 locales (sq/en/uk/it), uk@320/375/390 mandatory.

## Regression

- Baseline: 16/16 report tests GREEN
- New: 4 RTL smoke tests (`AdminReportsManager.smoke.test.tsx`):
  - owner present → name + badge label (`profile_types.agent`) + correct href `/admin/users/u-owner` + reporter distinct
  - owner null → `owner_not_found` fallback + no link
  - listing null → fallback + no crash
  - **Rework 1 fix:** owner with unknown `user_type` (`'bogus_value'`) → falls back to `profile_types.private`, no crash, profile link present
- After: 20/20 GREEN
- Planted violation (rework 1): broke `clampUserType` (raw passthrough) → `profile_types.bogus_value` assertion FAILS; restored → 4/4 PASS
- Registry "Report listing" row updated

## Verification

- `tsc --noEmit` = 0
- `check:i18n` = PASS (1849 keys)
- Report + admin tests: 20/20 GREEN
- No DB grant/RLS/middleware/public-UI change

## Rework 1 — fixes applied (2026-06-18)

### Blocker 2 (account-type clamping) — `AdminReportsManager.tsx:44-47`
Added `KNOWN_USER_TYPES` whitelist (`['private', 'agent', 'developer']`) and `clampUserType()` helper. Line 142 now calls `clampUserType(report.listing.owner.user_type)` instead of raw `report.listing.owner.user_type || 'private'`. An unexpected/null `user_type` value falls back to `'private'` — matching `profileTypeFromUser`'s canonical default — instead of producing a missing translation key.

### Test gap (badge label + null/unknown branch) — `__tests__/AdminReportsManager.smoke.test.tsx`
- Owner-present test now asserts `profile_types.agent` badge label (line 113)
- New test: `user_type: 'bogus_value'` → asserts `profile_types.private` fallback, no `profile_types.bogus_value`, profile link still present

### Blocker 1 (AC6 rendered harness) — `AdminReportsManager.stories.tsx` (NEW)
Storybook story with base variants (`Default`, `Tablet`, `LocaleStress`) + uk-only dialog variants. Expanded in Rework 2.

## Rework 2 — AC6 locale × breakpoint matrix (2026-06-18)

Expanded stories with per-locale-pinned variants. Superseded by Rework 3 (locale pins banned).

## Rework 3 — governance-compliant AC6 (2026-06-18)

### Blocker A fix: removed `globals.locale` pins
Removed all 12 per-locale-pinned dialog story variants (`Dialog_{uk,sq,en,it}_{320,375,390}`) — banned by `check:stories` Check 4 (`globals-locale-pin`) + agent-contract clause 13(c). Replaced with 4 toolbar-reactive dialog stories: `DialogOwnerRow_Mobile320`, `DialogOwnerRow_Mobile375`, `DialogOwnerRow_Mobile390`, `DialogOwnerRow_Desktop`. Locale coverage comes from the `screenshots:assert` machine harness sweeping all 4 locales per story. Removed unused `within` import (Nit fix).

`npm run check:stories` = **PASSED** (0 violations, 58 files).

### Blocker B fix: machine-rendered evidence via `screenshots:assert --fast`
Ran `npm run screenshots:assert -- --fast` — machine matrix covering 77 stories × 3 viewports (320/375/390) × 4 locales (sq/en/uk/it). Output: `.screenshots/rendered-assert/2026-06-18T17-59/manifest.json`.

Per-cell assertions (from `check-stories-rendered.mjs`):
- (a) No horizontal scrollbar / overflow at 320px
- (b) Full-width controls <640
- (c) No render failures / error screens
- (d) Full-width text buttons <640
- (e) Bottom-sheet contract: open overlays are edge-to-edge full-width and bottom-anchored <640

### Gate transcripts
- `npx tsc --noEmit` = **0 errors**
- `npm run lint` = **0 errors on task files** (1 pre-existing error in `visibility.test.ts`)
- `npm run check:stories` = **PASSED** (0 violations, 58 files)
- `npm run check:i18n` = **PASSED** (1849 keys, parity)
- `npx vitest run AdminReportsManager.smoke` = **4/4 PASSED**
- `npm run screenshots:assert --fast` = **924/924 PASS, 0 FAIL** (manifest: `.screenshots/rendered-assert/2026-06-18T17-59/manifest.json`)

No production code changed. No `git add`/`git commit`.

## Files Changed

| Path | Rationale |
|---|---|
| `src/app/admin/reports/page.tsx` | Query: owner embed added |
| `src/components/admin/AdminReportsManager.tsx` | Type + dialog: owner row with name/badge/link + null fallback; **rework 1:** `clampUserType()` whitelist |
| `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` | 4 RTL smoke tests (3 original + **rework 1:** badge assertion + unknown user_type test) |
| `src/components/admin/AdminReportsManager.stories.tsx` | **Rework 1 NEW; Rework 3 fixed:** 7 toolbar-reactive stories (3 base + 3 dialog mobile + 1 desktop), no `globals.locale` pins |
| `messages/en.json` | 3 new admin.reports keys |
| `messages/sq.json` | 3 new admin.reports keys |
| `messages/uk.json` | 3 new admin.reports keys |
| `messages/it.json` | 3 new admin.reports keys |
| `docs/critical-flow-registry.md` | Registry row updated with Task 461 |
| `docs/sessions/2026-06-18-task-461-admin-report-owner-visibility.md` | This session log |
