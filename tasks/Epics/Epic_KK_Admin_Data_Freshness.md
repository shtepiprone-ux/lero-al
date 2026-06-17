# Epic KK — Admin Data Freshness / Moderation Visibility

> **Status:** OPEN (created 2026-06-17)
> **Owner-layer:** Orchestrator-planned (Opus); implementation delegated to Sonnet 4.6.
> **Primary task:** Task 452 (single task + reserved follow-ups). Kickoff:
> `tasks/kickoff_prompt_Task_452_AdminDataFreshness.md`.

## Problem

Admin pages currently load their data **once** (SSR snapshot at navigation time) and then can go
**stale** while the admin panel stays open. Because moderation is a **multi-user** activity — several
admins/moderators may work in the panel at the same time, and end users mutate the same rows from the
public site — an already-open admin page does **not** reflect changes made in another tab/session until
the operator performs a **manual full page reload**.

This is unsafe for moderation/admin work: two moderators can act on a listing/report/ticket that another
has already resolved, status decisions can be made against stale data, and inbox/queue counts drift from
reality. The risk spans **all** mutable admin data surfaces, not just Admin Listings.

## Goal

Introduce **one shared, safe freshness strategy** for every admin data page that displays mutable backend
data — not one-off hacks per page. Specifically:

- Refresh the current admin page when the **browser window regains focus**.
- Refresh on **`visibilitychange`** when the tab becomes visible again.
- **Preserve** current filters / search / status tabs / pagination as much as possible.
- **No full page reload.**
- **No noisy polling** by default.
- **No Supabase realtime** unless investigation proves it is already used and safe; if realtime is genuinely
  needed for a surface, it is split out as a **separate follow-up**, explicitly justified — not added here.
- Preserve (do not remove) existing per-component manual refresh affordances.
- Ensure admin data fetches are **not accidentally cached/stale** when they must always be fresh.

## Architecture decision (grounds the smallest shared mechanism)

Investigation (2026-06-17, orchestrator) established the dominant pattern:

- **Every `/admin/**` data page is an SSR React Server Component.** It reads filter/search/tab/pagination
  state (where URL-backed) from `searchParams`, fetches via `createAdminClient()`, and passes data down to
  client table/manager components.
- **State that matters mostly lives in the URL** (`?tab=`, `?status=`, `?q=`, `?page=`, …) for the
  list-heavy pages (Listings, Users). Pages without `searchParams` keep view state in **client manager
  components** (local `useState`) and re-derive from SSR props.
- **`router.refresh()` already re-runs the current route's server component** and re-delivers fresh SSR
  props **without remounting** the client tree — so URL-backed filters survive for free, and client-local
  state (open filter panel, local pagination) is **not reset**. Several admin components already call
  `router.refresh()` after their own mutations (`AdminListingsTable`, `AdminUserProfile`,
  `AdminLocationsManager`, `AdminPagesManager`, `AdminLegalManager`).
- **`AdminShell`** (`src/components/admin/AdminShell.tsx`) is a `'use client'` component rendered exactly
  once by `src/app/admin/layout.tsx` and already hosts a cross-cutting client hook (`usePresence()`).

**Therefore the smallest shared mechanism is a single client hook — `useAdminPageFreshness` — that calls
`router.refresh()` on window `focus` + `document` `visibilitychange→visible`, throttled/debounced, mounted
once in `AdminShell`.** This covers all SSR pages at once: no per-page wiring, no full reload, no duplicate
rows (server is the source of truth on each refresh), no polling, no realtime.

**The one risk to verify per page (investigation gate):** a client manager that copies SSR props into
`useState` **without** a `useEffect([prop])` re-sync (the Live-L3 pattern in `docs/state-authority.md`)
will *not* pick up refreshed data even though the server re-rendered. Each such page must either be wired to
re-sync from props or be documented as **N/A / follow-up**.

## Scope — admin data pages in scope

Mutable-data pages that MUST be covered by the shared mechanism (verified present 2026-06-17):

- Admin Listings (`/admin/listings`)
- Admin Users (`/admin/users`, `/admin/users/[id]`)
- Internal Tickets (`/admin/support`)
- Support Inbox (`/admin/inquiries/support`)
- Sales Inbox (`/admin/inquiries/sales`)
- Reports (`/admin/reports`)
- Companies (`/admin/companies`)
- CMS Pages (`/admin/pages`)
- Property Types (`/admin/property-types`)
- Popular Locations (`/admin/popular-locations`) / Locations (`/admin/locations`)
- Currency (`/admin/currency`), Email templates (`/admin/email-templates`), Footer (`/admin/footer`),
  Site settings (`/admin/settings`), Permissions (`/admin/permissions`), Legal (`/admin/legal`) —
  **only if** investigation confirms they display mutable data another admin/session can change. Settings-style
  reference pages that are effectively single-writer/static may be documented as low-priority or N/A with
  rationale, but the shared hook covers them for free regardless (no per-page cost).

Out of scope: the dashboard (`/admin`), preview routes (`/admin/listings/[id]/preview`), `users/new`
(create form, no live list), and any non-UI map-marker popup.

## Slices

| Slice | Task | Content |
|---|---|---|
| KK.1 | **452** | Investigation + classification doc + shared `useAdminPageFreshness` hook + mount in `AdminShell` + per-manager prop re-sync audit/fixes + regression tests + docs + critical-flow registry row. |
| KK.2 | **453 (reserved)** | Follow-up ONLY for pages investigation flags as needing special handling (client-local list with no prop re-sync that can't be trivially fixed in 452; a surface that genuinely needs realtime/subscription). Opened only if 452's investigation produces such a page. |

## Definition of done (Epic-level)

- A single shared freshness mechanism exists and is mounted once; **no per-page one-off hacks.**
- Listings, Users, Tickets, Inboxes, Reports update after focus/visibility refresh when their data changed
  elsewhere; reference/content pages with mutable data are wired or explicitly documented N/A/follow-up.
- Filters/search/status tabs/pagination preserved; no duplicate rows; no full reload; loading is
  non-disruptive; error/empty states intact.
- No broad polling; no realtime added without explicit justification (else → KK.2 follow-up).
- Regression tests for the shared mechanism + representative pages; CI-wired; planted-violation FAIL proof.
- `docs/critical-flow-registry.md` carries an **admin data freshness / moderation visibility** row.
- Docs + session log + backlog updated.
