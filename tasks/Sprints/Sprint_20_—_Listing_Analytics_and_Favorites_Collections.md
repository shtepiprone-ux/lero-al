# Sprint 20 — Listing Analytics + Favorites Collections (spec-led)

> **Theme:** the two larger product features in the queue. Both are "spec → MVP → follow-ups"
> tasks: the kickoff defines a CONCRETE MVP slice Sonnet can ship now, and explicitly defers the
> bigger scope to follow-up tasks the orchestrator will file after reviewing the MVP. This keeps
> Sonnet productive without ballooning a single diff. Run **after Sprints 18–19**.

> **Mandatory rules (every task):** `docs/agent-contract.md` clause 6a (Positive + Negative flow)
> + clause 10 (Task 264 — Sonnet writes a "Files Changed" table, NEVER emits/runs git; orchestrator
> emits explicit-path commits; owner runs them).

## Tasks

| Task | Title | Priority | Kickoff |
|------|-------|----------|---------|
| **285** | Listing analytics page + admin metric controls (MVP slice) | MEDIUM | [`Sprint_20_kickoff_prompt_Task_285.md`](Sprint_20_kickoff_prompt_Task_285.md) |
| **286** | Favorites collections UX revamp (MVP + plan-aware roadmap) | MEDIUM | [`Sprint_20_kickoff_prompt_Task_286.md`](Sprint_20_kickoff_prompt_Task_286.md) |

## Measured foundations (2026-05-29)
- Analytics already exists: `listing_contact_events` table + `trackListingContactEvent`
  (`src/modules/listings/actions/contactEvents.ts`), `record_listing_view` RPC, view route
  `src/app/api/listings/[slug]/view/route.ts`. 285 builds the read/display layer on top.
- Collections already exist: `CollectionsSection.tsx`, `SaveToCollectionButton.tsx`,
  `FavoritesShell.tsx`, `FavoritesTypeFilter.tsx`. 286 revamps the UX on top of these.

## Sequencing
Independent of each other. Each ships an MVP, then STOP & ASK the orchestrator to file follow-up
tasks (Task 295+) for the deferred scope. Each gets its own diff review + commit hand-off.

> **Note (orchestrator):** these two were flagged in the backlog as "Opus → produces follow-up
> tasks". The MVP slices below are deliberately bounded. The full analytics dashboard (285) and the
> plan-aware Free/Pro/Expert collections roadmap (286) require a dedicated Opus planning pass once
> the MVPs land and the owner has seen them. Do NOT attempt the full scope in one Sonnet diff.
