# Sprint 57 — Delete what no longer earns its place

**Opened:** 2026-08-08. **Owner decision:** 2026-08-08 — two small removals have accumulated with no sprint that
fits them, and neither is worth its own sprint alone.

Why not an existing sprint: 46 is de-Tailwind under D28, 52 is gates, 54 is an overlay collision, 55 is ARIA, 56 is
the locale-leak pair. None has a goal these two fit; both are pure removal.

---

## Goal

Remove two pieces of the repository that are carried, referenced or scanned but no longer earn it — and prove in
each case that nothing depended on them.

## Tasks

| Task | Scope, verified 2026-08-08 |
|---|---|
| **676** | Stale hex comments in `src/app/globals.css`. The file currently holds **36** six-digit hex occurrences; the task's first job is to classify each as a live value, a token-backed comment, or a stale comment describing a value that has since moved — **only the third class is removed** |
| **682** | Drop `sonner` (`^2.0.7`) and `next-themes` (`^0.4.6`) from `package.json`, both still present and both superseded (Task 681) |
| **897** | `KICKOFF FILED` 2026-09-29 — [kickoff](Sprint_57_kickoff_prompt_Task_897_Retire_Legacy_Governance_Scans.md). Retire the three legacy governance scans (`scan-primitives`/`scan-responsive`/`scan-tailwind` + `tailwind-entropy.mjs` + two allowlists): they apply shadcn/Tailwind rules to all of `src/` and fail the weekly and PR workflows on correct Mantine code (all 15 tailwind HIGH are TailAdmin provenance comments in `src/design-system/mantine/`; the two "new" responsive HIGH are Task 852's approved `useMediaQuery`). Also: the weekly workflow stops pushing to `main`; CI on Node 22 via `.nvmrc`. Owner D897-1 *"Retire them"*, D897-2 *"Stop pushing"* (2026-09-29, quoted in the kickoff). Q1 |

## Exit criteria

*Amended 2026-09-29 (Task 897 joins, goal fit: a gate that is carried and scanned but no longer earns its place):* **4.** `npm run governance` runs only ssr + l10n and still fails on a planted SSR violation; the weekly workflow run after the owner push is green, uploads its report and adds no commit to `main`.


1. Every hex occurrence in `globals.css` is classified before any is deleted, and the classification ships with the
   task. **A comment is not stale because it looks stale** — cite what replaced the value.
2. `sonner` and `next-themes` are absent from `package.json` and `package-lock.json`, with a repo-wide import
   census proving zero consumers **before** removal, not a build that happens to pass after it.
3. `npm run build` exit 0 and the full gate set unchanged. Zero visual delta is expected; if anything moves, the
   removal was not inert and the task stops.

## Explicitly NOT in this sprint

**Owner cleanup step 3** — the three consolidated probes (`task420-qa-grid-step.mjs`, `task668-qa-grid-1440.mjs`,
`task668-qa-header-geometry.mjs`, all three still present, with exactly **18** provenance comments naming them in
`check-homepage-grid.mjs`) is already owned by **Sprint 46's exit criterion 4**. It stays there. Two sprints
claiming one deletion is how 729 ended up assigned to two sprints at once.
