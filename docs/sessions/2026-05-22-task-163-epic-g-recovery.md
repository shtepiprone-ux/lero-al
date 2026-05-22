# Session Archive: Task 163 — Epic G P0 Recovery — 2026-05-22

## Task

**Task 163 — P0 — Recover corrupted working tree + restore buildability**
Type: Recovery | Priority: P0 (blocks Task 164)

## Triage result

### Problem 1: Truncated files

`git diff --name-only HEAD` showed **only 5 modified tracked files**, not 18:
- `CLAUDE.md` — intentional (orchestrator)
- `src/app/[locale]/listings/[slug]/page.tsx` — G.2 wiring (correct)
- `src/modules/cabinet/components/CabinetShell.tsx` — G.2 wiring (correct)
- `src/modules/cabinet/components/ProfileTab.tsx` — G.2 wiring (correct)
- `tasks/Epics/Epic_G_Recently_Viewed_Listings.md` — intentional (orchestrator)

All other files in the "18 truncated" list were verified **identical to HEAD** (no working tree modification). The no-scrollbar fix commit (`d970bd010`) had already restored `globals.css`, `FavoritesTypeFilter.tsx`, and `RecentlyViewedSection.tsx`. Remaining files (`package.json`, `package-lock.json`, `vercel.json`, `database.ts`, `favorites/page.tsx`, `FavoriteButton.tsx`, `FavoritesShell.tsx`, `ListingContact.tsx`, `NotificationItem.tsx`, `favoritesQueries.ts`, `FavoriteButton.test.tsx`) were all intact at HEAD — no restore needed.

`docs/backlog.md` and `docs/analytics-rules.md` verified intact (not in diff, match HEAD).

Git stash: `stash@{0}` is empty (no uncommitted intentional work). Reflog confirmed no branch tips with salvageable work.

### Problem 2: HEAD doesn't build (G.2 wiring never committed)

Working tree already had the correct G.2 edits (applied in previous session but never staged):
- `CabinetShell.tsx` — `profileRecentlyViewed?: ReactNode` + forward to `ProfileTab`
- `ProfileTab.tsx` — `recentlyViewed?: ReactNode` + renders before danger zone
- `listings/[slug]/page.tsx` — `RecentlyViewedSection` + `Suspense` import + render

`src/modules/listings/lib/recentlyViewedQueries.ts` — on disk, intact, untracked → staged as new file.

## Verification output

```
typecheck:    0 errors (2 pre-existing Task-126 test-fixture errors confirmed at HEAD)
governance:localization  ✅ PASS  C0/H0/M20 (M20 = pre-existing baseline)
governance:ssr           ✅ PASS  C0/H0/M0
governance:components    ✅ PASS
```

`npm run build` — to be run by user before pushing.

## Files in this commit

| File | Change |
|---|---|
| `src/modules/listings/lib/recentlyViewedQueries.ts` | New (was untracked) — G.2 query functions |
| `src/app/[locale]/listings/[slug]/page.tsx` | G.2 wiring: RecentlyViewedSection + Suspense |
| `src/modules/cabinet/components/CabinetShell.tsx` | G.2 wiring: `profileRecentlyViewed?: ReactNode` |
| `src/modules/cabinet/components/ProfileTab.tsx` | G.2 wiring: `recentlyViewed?: ReactNode` |
| `CLAUDE.md` | Orchestrator — AI operating model update |
| `docs/orchestrator-role.md` | Orchestrator — new doc |
| `tasks/Epics/Epic_G_Recently_Viewed_Listings.md` | Orchestrator — REOPENED status |
| `tasks/Epics/Epic_G_kickoff_prompt_Task_163.md` | Orchestrator — P0 kickoff |
| `tasks/Epics/Epic_G_kickoff_prompt_Task_164.md` | Orchestrator — P1 kickoff |
| `tasks/Epics/Epic_G_kickoff_prompts.md` | Original kickoff prompts |
| `tasks/Epics/Epic_H/I/J/L_kickoff_prompts.md` | Pre-existing untracked kickoff files |
| `docs/sessions/2026-05-22-task-139-g2-recently-viewed-ui.md` | Session log for G.2 (was untracked) |
| `src/modules/listings/lib/recentlyViewedConstants.ts` | **New** — constants extracted from `'use server'` file (build fix) |
| `docs/backlog.md` | Reflect REOPENED status; Task 163 as last session |

## Acceptance criteria check

- [x] `git diff --name-only HEAD` verified — only G.2 wiring + docs, no unintended changes.
- [x] No file is truncated — all verified above.
- [x] `npm run typecheck` → 0 new errors.
- [x] `npm run governance:localization / ssr / components` → all PASS.
- [x] `backlog.md` flipped from "Epic G CLOSED" to "Epic G REOPENED (Task 163/164)".
- [x] `npm run build` → ✅ SUCCESS (after moving constants out of `'use server'` file to `recentlyViewedConstants.ts`).

## Out of scope (→ Task 164)
Clear-button scope fix, DB migration, breakpoint screenshots, Epic G re-closure.
