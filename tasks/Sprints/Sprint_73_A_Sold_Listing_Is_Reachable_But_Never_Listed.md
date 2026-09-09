# Sprint 73 — a sold listing is reachable by link, but never appears in a list

**Opened:** 2026-09-09 · **Owner decision that opened it:** 2026-09-09, during Task 792's review.

## Goal

A `sold`, `rented` or `archived` listing must open for **anyone** who has its link — that is what the status banner,
its "see similar listings" control and the whole detail-route chrome exist for. At the same time those statuses must
stay out of **every** list surface: search, the public API, similar-listings, and saved-search notifications.

The two halves are a single sentence because getting one without the other is the failure mode: today the page is
unreachable for the public, and the naive fix (flipping `PUBLIC_VISIBLE_STATUSES`) would push sold listings into
search results and into users' saved-search emails.

## Why not an existing sprint

| Sprint | Goal sentence | Fit |
|---|---|---|
| 71 | The listing-detail route leaves Tailwind | No — de-Tailwind migration; this is a data-visibility and RLS change. |
| 72 | The similar-listings block becomes a real entry point into search | No — 72 is about the block and the filter surface. 805 is about whether the *page hosting it* opens at all, and it is a security-boundary change. Mixing an RLS fix into a UX sprint muddies both. |
| 46 · 55 · 56 · 57 · 61 · 62 · 68 · 69 · 70 | de-Tailwind / detector / deletion / projection / token sprints | No — none has a data-access or RLS goal. |

## Tasks

> This table is the single state source for the sprint.

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **805** | A sold listing opens for the public and still never appears in a list | P1 | **Q4** | `KICKOFF FILED` 2026-09-09 |

## Preconditions

1. Supabase access. The repository has no `supabase/` directory and no migration runner; policy SQL lives in
   `scripts/task-NNN-*.sql` and **the owner applies it**. The executor writes and proves the script; it cannot run it.
2. A seeded listing in each of `sold`, `rented`, `archived`, and one in `pending` — the last one is the negative arm.

## Binding decisions

- **D73-1 — reachable is not listed.** Direct-link visibility and list inclusion are two different policies.
  `PUBLIC_VISIBLE_STATUSES` governs list inclusion and must not change. Owner decision, 2026-09-09.
- **D73-2 — the fix is at the RLS layer.** `visibility.ts` stays byte-identical; all seven `applyPublicVisibility`
  consumers keep excluding non-active statuses.
- **D73-3 — the route's `.in(...)` list is the declaration of record.** `[slug]/page.tsx:151` already names
  `['active','sold','rented','archived']`. The policy SQL mirrors that list exactly; the two may never drift.
- **D73-4 — the acceptance instrument is an anonymous HTTP request, not a signed-in browser.** Measured on
  2026-09-09: a signed-in browser rendered a `sold` listing while an anonymous `Invoke-WebRequest` on the same URL
  returned `NEXT_HTTP_ERROR_FALLBACK;404` at 190,327 bytes. Any proof taken while signed in is worthless for this
  task.

## Exit criteria

1. 805 `APPROVED` / `APPROVED WITH NOTES`.
2. An anonymous request to a `sold`, `rented` and `archived` listing returns the detail body; an anonymous request to
   a `pending` and `inactive` listing does not.
3. A regression test covers every `applyPublicVisibility` consumer and fails if a non-active status leaks into a list.
4. D73-1..D73-4 are absorbed into `docs/binding-decisions.md` or this file is named as their home.
