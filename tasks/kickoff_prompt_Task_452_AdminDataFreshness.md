# Task 452 — Admin-wide Data Freshness / Synchronization (Epic KK, Slice KK.1)

> **Executor:** Sonnet 4.6. **Read this file directly.** Do not invent scope. If anything is ambiguous or
> missing, **STOP and ASK the orchestrator** — do not guess (agent-contract clause 2).
> **Epic:** `tasks/Epics/Epic_KK_Admin_Data_Freshness.md`.

## Pre-read (load ONLY these — rule-index selection)

**Always required:**
- `docs/agent-contract.md` (clauses 1–15)
- `docs/backlog.md`
- `docs/critical-flow-registry.md` — **this task ADDS a row** (admin data freshness / moderation visibility);
  clause 15 regression-coverage rule is in scope.

**Admin table / admin control bundle + state boundary (required for this task):**
- `docs/state-authority.md` — **the core reference.** SSR-L2 vs Live-L3 authority, the `useEffect([prop])`
  re-sync pattern, `router.refresh()` interaction, cache-invalidation/"dead zones" table.
- `docs/ai-behavior.md` → Note 19 (UX Flow Preservation), Note 20 (Existing-Control Preservation),
  Note 22 (Admin Table Preservation Rule), Canonical Task Template.
- `docs/data-access-rules.md` — admin fetch/caching conventions (confirm admin reads are dynamic, not cached stale).
- `docs/qa-rules.md` — test/error conventions.

**Only if you end up touching one:**
- `docs/ui-rules.md` + `docs/design-system.md` §26 — **only** if you discover a visible control must be added
  (see Mobile gate below — default is NO new visible control; if you need one, STOP and ASK first).

## Context / current state (verified by orchestrator 2026-06-17)

- Every `/admin/**` data page is an **SSR server component** that fetches via `createAdminClient()` and passes
  data to client table/manager components. List pages (Listings, Users) keep filter/search/tab/pagination in
  the **URL** (`searchParams`); other pages keep view state in **client manager `useState`**.
- `router.refresh()` re-runs the current route's server component and re-delivers fresh SSR props **without
  remounting** the client tree → URL filters survive, client-local view state is not reset, the server is the
  single source of truth (so no duplicate rows). Several admin components already call it after mutations
  (`AdminListingsTable`, `AdminUserProfile`, `AdminLocationsManager`, `AdminPagesManager`, `AdminLegalManager`).
- `AdminShell` (`src/components/admin/AdminShell.tsx`) is `'use client'`, rendered once by
  `src/app/admin/layout.tsx`, and already hosts the cross-cutting `usePresence()` hook → it is the single
  mount point.

## Scope (do EXACTLY this — no more)

1. **Investigation + classification doc.** Create `docs/admin-data-freshness-inventory.md` inventorying
   **every** `/admin/**` page. For each, record: route; **mutable-data page / mostly-static reference page**;
   **server-rendered / client-fetched**; current reload/refetch mechanism (router.refresh after own mutation /
   none / realtime); and **the prop-resync verdict**: does its client manager re-sync from refreshed SSR props
   via `useEffect([prop])` (Live-L3), or does it copy props into `useState` once and NOT re-sync? Pages in the
   second group are the only ones that need a code change beyond mounting the hook — list them explicitly.

2. **Build the shared hook** `useAdminPageFreshness` (suggested `src/hooks/useAdminPageFreshness.ts`):
   - On window `focus` AND on `document` `visibilitychange` when `document.visibilityState === 'visible'`,
     call `router.refresh()` (Next.js `useRouter` from `next/navigation`).
   - **Throttle/debounce**: collapse bursts (focus + visibilitychange fire together) and enforce a minimum
     interval (e.g. ≥ a few seconds) between refreshes so rapid tab-switching does not thrash the server.
   - **Skip when already fresh/hidden**: do not refresh while the tab is hidden; optionally skip if the last
     refresh was within the min interval.
   - Clean up listeners on unmount (no leaks; no double-binding under StrictMode/concurrent render).
   - Renders nothing; takes no required props. Make the min-interval injectable for tests.

3. **Mount it once in `AdminShell`** alongside `usePresence()`. This is the ONLY mount; do not add it
   per-page.

4. **Fix prop re-sync ONLY for the client managers investigation flags** in step 1 (the ones that don't
   re-sync from refreshed props). Apply the canonical Live-L3 `useEffect([prop])` re-sync from
   `docs/state-authority.md`. Do **not** refactor managers that already re-sync. Keep every existing control
   and manual refresh affordance (Note 20). If a flagged manager cannot be safely fixed within this task's
   scope, document it as a **KK.2 / Task 453 follow-up** in the inventory and the session log — do not force it.

5. **Confirm admin reads are not accidentally cached stale.** Verify (in `docs/data-access-rules.md` terms)
   that the in-scope admin pages render dynamically so `router.refresh()` actually returns fresh rows. If any
   page is statically cached such that refresh returns stale data, document it and STOP and ASK before adding
   any cache directive (that is an architecture decision, not a freebie).

6. **Regression tests** (clause 15) + **docs/backlog/session log**.

## Current behavior to PRESERVE (Note 19 / 20 / 22)

- All existing admin filters, search inputs, status tabs, pagination, row actions, status switchers, sidebar
  entries, manual refresh buttons, and per-component `router.refresh()`-after-mutation behavior keep working
  **unchanged**.
- Open filter panels / local UI state on a page must NOT be reset by the focus/visibility refresh.
- No admin table loses a column, row action, or control (Note 22 — `AdminTableRow` pattern intact).

## Required AFTER-behavior (action by action)

- Operator A is on `/admin/listings?tab=all&status=pending&q=foo&page=2`. Operator B (other session) approves
  one of those listings. Operator A **switches away and back to the tab** (or focuses the window) → the page
  silently `router.refresh()`es → the approved listing reflects its new status, **and** `tab/status/q/page`
  are unchanged, scroll/local UI preserved, no full reload, no duplicate rows.
- Same behavior on `/admin/users`, `/admin/support`, `/admin/inquiries/support`, `/admin/inquiries/sales`,
  `/admin/reports`, `/admin/companies`, `/admin/pages`, `/admin/property-types`, `/admin/popular-locations`,
  `/admin/locations`, and any settings/reference page confirmed to hold mutable data.
- The refresh is **silent** (chosen UX 2026-06-17): no new spinner/indicator/button is added; existing
  affordances stay. (If product later wants a visible indicator/manual button, that is a separate task.)

## Positive flow (happy path)

- **Actor:** authenticated admin/moderator with an admin page already open.
- **Preconditions:** admin layout authorized (`admin/layout.tsx` guard passed); a data page mounted; data
  changed in another tab/session after initial load.
- **Steps & system responses:**
  1. Admin's tab loses focus / becomes hidden (switches to another app or tab). → hook does nothing while hidden.
  2. Admin returns: window `focus` and/or `visibilitychange→visible` fires. → hook debounces the burst to one call.
  3. Hook checks min-interval guard; interval elapsed → calls `router.refresh()`. → Next.js re-runs the route's
     server component with the **current URL** (filters preserved).
  4. Fresh SSR props delivered to the client tree without remount. → URL-backed pages reflect new data
     immediately; flagged client managers re-sync via `useEffect([prop])`.
- **Success state:** page shows current backend data; filters/search/tab/pagination intact; no duplicate rows;
  no full reload; loading is non-disruptive.
- **Post-conditions:** no DB write (read-only refresh); no toast; no navigation; URL unchanged.

## Negative flow (every off-happy-path branch)

- **Tab hidden / not visible:** `visibilitychange` to hidden → **no** refresh (guard on `visibilityState`).
- **Rapid focus/blur thrash:** multiple focus/visibility events inside the min interval → at most one
  `router.refresh()` (debounce + min-interval guard); no server storm.
- **Refresh in flight:** a second trigger while a refresh is pending → coalesced; no overlapping refreshes,
  no duplicate rows.
- **Not on an admin route:** hook only mounts inside `AdminShell` (admin layout) → never fires on public pages.
- **Unauthenticated / session lost mid-session:** `router.refresh()` re-hits the route; `admin/layout.tsx`
  SSR guard redirects to login (`?next=/admin&session=lost`) — existing behavior, **must not regress**.
  The hook must NOT swallow or interfere with that redirect.
- **Client manager that copies props to state without re-sync:** identified in investigation → either fixed
  with `useEffect([prop])` re-sync, or documented N/A/follow-up (Task 453). It must NOT silently show stale
  data while claiming coverage.
- **Empty list / no results after refresh:** empty state renders intact (no crash, no “0 then flash”).
- **Server error during refresh:** the route's existing error handling applies; the hook does not add a new
  error path or toast. No infinite refresh loop on error (min-interval guard prevents tight looping).
- **Reduced-motion / no `document` (SSR):** hook is client-only; guards against `typeof document/window`.
- **StrictMode double-invoke / unmount:** listeners added/removed cleanly; no duplicate handlers, no leak.
- **Locale mismatch:** refresh preserves the admin locale cookie path (no locale reset); no new strings, so
  no locale divergence.

## Mobile <640 full-width gate (OWNER P0)

**No visible UI control is added** by this task — the shared hook renders nothing and the chosen UX is silent
refresh with existing affordances preserved. **There is therefore no in-scope `<640` surface.** If, during
implementation, you conclude you must add ANY visible control (a “refreshing…” indicator, a manual Refresh
button, a badge), **STOP and ASK the orchestrator first** — do not add it unilaterally. If the owner then
authorizes a control, this gate reactivates in full: full-width at `max-sm`, ≥44px touch target, labels wrap
across sq/en/uk/it, any popup → full-width bottom sheet, with the rendered verification matrix
(breakpoints × 4 locales, uk@320/375/390) per agent-contract clauses 11–12.

## Localization

No new user-facing strings are expected (silent refresh). If any string is unavoidably added, it MUST exist in
all four locales — `sq`, `en`, `uk`, `it` — same key set, with runtime locale switching visually confirmed.

## Regression coverage (agent-contract clause 15 — MANDATORY)

This task ADDS a `docs/critical-flow-registry.md` row:

| Flow | Route / component | Owner task | Happy path | Failure path | Required regression test | Coverage |
|---|---|---|---|---|---|---|
| Admin data freshness / moderation visibility | `useAdminPageFreshness` + `AdminShell` | **452** | focus/visibility→visible while admin tab open → exactly one throttled `router.refresh()`; URL filters preserved | hidden tab → no refresh; burst → ≤1 refresh in interval; non-admin route → never fires | vitest: (1) focus fires router.refresh once; (2) visibilitychange→visible fires once, hidden→none; (3) burst within interval → 1 call; (4) listeners cleaned on unmount | ✅ on landing |

- Establish/record the baseline; add the named test; wire it into the existing vitest/CI lane used by the
  admin smokes (e.g. `test:admin` or a new `test:admin-freshness` if cleaner — confirm with orchestrator if
  adding a script).
- **Planted-violation proof:** removing the visibility guard / min-interval guard must make specific assertions
  FAIL (paste the transcript). A no-op gate is a task failure.
- Mock `useRouter().refresh` and `document.visibilityState` / dispatch `focus`+`visibilitychange` events in
  jsdom. No live server needed for the unit coverage.

## Acceptance criteria (each maps to a flow + must be verifiable in the diff)

1. `docs/admin-data-freshness-inventory.md` exists and classifies **every** `/admin/**` page with the
   prop-resync verdict column. *(Scope step 1)*
2. `useAdminPageFreshness` hook exists, refreshes on focus + visibilitychange→visible, throttled, cleans up
   listeners, client-guarded, injectable interval. *(Positive flow steps 2–3; Negative: hidden/burst/unmount)* — file:line.
3. Hook mounted exactly once in `AdminShell.tsx`; not per-page. *(Required after-behavior)* — file:line.
4. Every flagged client manager re-syncs from refreshed props (or is documented N/A/Task 453). No manager that
   already re-syncs is refactored. *(Negative: stale-state branch)* — file:line or inventory entry.
5. Admin Listings reflects an externally-changed listing after focus/visibility refresh with
   `tab/status/q/page` preserved and no duplicate rows. *(Positive flow)* — runtime evidence.
6. Admin Users + at least Reports + one Inbox + Support tickets verified to refresh on focus/visibility.
   *(Positive flow)* — runtime evidence.
7. Unauthenticated-mid-session refresh still redirects to login via the layout guard (not regressed, not
   swallowed). *(Negative flow)* — runtime/test evidence.
8. No full page reload anywhere; no polling; no realtime added. *(Goal)* — confirmed in diff (no `setInterval`
   polling, no `location.reload`, no new realtime channel).
9. Regression test added, green on correct behavior, FAILS on planted violation, wired into CI; registry row
   added. *(clause 15)* — test file:line + transcript.
10. `docs/backlog.md` + `docs/sessions/` updated; **Files Changed** table present; **no** `git add`/`git commit`
    emitted by you (orchestrator emits at review).
11. Self-validation block: `npx tsc --noEmit` = 0 errors, `npm run build` if non-trivial, AC-by-AC audit table,
    file-integrity transcript (clause 14: 0 NUL bytes / parses / not truncated), final
    `Self-validation: …` verdict line.

## Hard contract (verified against the diff on return)

- No scope change; no invented architecture (STOP and ASK on ambiguity).
- No removed/relocated control without explicit authorization (Notes 20/21).
- Both positive AND every negative branch above implemented and verifiable in the diff (clause 6a).
- Self-validate before claiming complete (clause 9); file-integrity clean (clause 14); regression proof
  (clause 15).
- Session log includes: Files Changed table, AC-by-AC audit, UX flow trace, before/after control inventory
  for `AdminShell` + any touched manager, planted-violation transcript.
