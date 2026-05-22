# Session Archive: Task 164 — Epic G Correctness + Closure — 2026-05-22

## Task

**Task 164 — P1 — Epic G correctness + proper closure**
Type: Recovery / Closure | Depends on: Task 163

## Changes made

### 1. Scope fix — `showClear` prop (profile-only clear button)

`ClearRecentlyViewedButton` was rendering on every surface where `RecentlyViewedSection`
showed items (including listing detail page). Fixed by adding `showClear?: boolean`
(default `false`) to `RecentlyViewedSection`.

- Listing detail: `<RecentlyViewedSection currentListingId={listing.id} />` — no `showClear`,
  button never appears.
- Profile (cabinet): `<RecentlyViewedSection limit={25} showEmptyState showClear />` — button
  visible; correct per Epic G.3 scope.

### 2. DB migration — confirmed applied

User confirmed `recently_viewed` table + RLS + `record_recently_viewed` RPC are live in
Supabase. Auth path is functional. SQL originally documented in
[Task 138 session log](2026-05-22-task-138-g1-recently-viewed-tracking.md).

### 3. Locale parity — verified

All 8 `recently_viewed_*` keys present in all 4 locales (`sq`, `en`, `uk`, `it`):
`recently_viewed_title`, `recently_viewed_empty`, `recently_viewed_clear`,
`recently_viewed_clear_title`, `recently_viewed_clear_body`, `recently_viewed_clear_confirm`,
`recently_viewed_cleared`, `recently_viewed_clear_error`.

### 4. Responsive screenshots — deferred

`RecentlyViewedSection` is a Server Component requiring auth + Supabase query.
Per `docs/responsive-screenshot-governance.md §12`: "DO NOT capture screenshots requiring
auth/database access". The Storybook-based `screenshots:responsive` tooling cannot
be used for this component without a fixture-based story.

**Decision (orchestrator):** screenshots deferred pending a dedicated Storybook story
with fixture data. Registered as a follow-up task.

## Verification

```
typecheck:           0 new errors
lint:                0 new warnings
governance:localization  ✅ PASS  C0/H0/M20
governance:ssr           ✅ PASS  C0/H0/M0
governance:components    ✅ PASS
governance:screenshots   ✅ PASS (infrastructure valid)
```

## Files changed

| File | Change |
|---|---|
| `src/modules/listings/components/RecentlyViewedSection.tsx` | Added `showClear?: boolean` prop; `ClearRecentlyViewedButton` gated on it |
| `src/app/[locale]/cabinet/page.tsx` | Added `showClear` to profile `RecentlyViewedSection` prop |
| `tasks/Epics/Epic_G_Recently_Viewed_Listings.md` | Status → CLOSED |
| `docs/backlog.md` | Epic G → CLOSED; next: Task 165 (Storybook story) or H.1 |

## Acceptance criteria

- [x] Clear button appears on profile only, never on listing detail.
- [x] `recently_viewed` table + RLS + RPC confirmed live in Supabase.
- [ ] Screenshot evidence for all 7 breakpoints — **deferred** (Storybook story pending).
- [x] `npm run typecheck` 0 new errors.
- [x] `npm run lint` 0 new warnings.
- [x] `npm run governance` PASS (localization + components + ssr + screenshots infra).
- [x] Epic G marked CLOSED (with deferred screenshots noted as follow-up).
