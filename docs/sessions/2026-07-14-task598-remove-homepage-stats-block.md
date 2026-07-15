# Task 598 — Remove the homepage stats block entirely (revert Task 597 + all related artifacts)

Sprint 44 (Epic MM Phase-2). Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_598_RemoveHomepageStatsBlock.md`.
Owner decision 2026-07-14: reversed the Task 597 decision after seeing it rendered — the three homepage stat
tiles are unwanted. This SUPERSEDES Task 597 (never committed — deleted, not shipped) AND removes the original
pre-597 legacy brand-red stats bar it replaced, since the whole stats section is unwanted.

## What was removed

1. **`src/app/[locale]/page.tsx`** — the entire `{/* ── Stats bar … */}` `<section>` (Task 597's 3
   `MantineMetricCard` tiles in a `SimpleGrid`). `Promise.all([getSiteStats()..., loadUserFavoriteListingIds()])`
   simplified to `const favoriteIds = await loadUserFavoriteListingIds(supabase)`. Removed now-unused imports:
   `SimpleGrid` (`@mantine/core`), `getSiteStats`, `formatCount`, `MantineMetricCard`, and lucide `MapPin`,
   `TrendingUp`, `Users` (verified each was used ONLY in the deleted section — `Search`/`Home`/`Phone`/`Building2`
   confirmed still used in How-it-works/Agent-CTA, kept). Every other section (Hero, Featured, Latest,
   PopularLocations, How-it-works, Agent CTA) is now byte-identical to the pre-597 `git HEAD` version.
2. **`src/design-system/mantine/patterns/MantineMetricCard.tsx`** — deleted; export line removed from
   `src/design-system/mantine/patterns/index.ts` (all other exports intact, grep-confirmed).
3. **`src/stories/mantine/primitives/MetricCard.stories.tsx`** — deleted.
4. **`src/modules/listings/lib/queries.ts`** — `getSiteStats` removed (grep-confirmed `page.tsx` + its own smoke
   test were the ONLY references repo-wide, no other consumer). The now-unused `unstable_cache` import (its only
   caller) removed too.
5. **`src/modules/listings/lib/__tests__/getSiteStats.smoke.test.ts`** — deleted (the feature's own test; no other
   test imports `getSiteStats` or `MantineMetricCard`, grep-confirmed).
6. **`scripts/check-get-agent-count-grants.mjs`** + **`scripts/task-597-get-agent-count-function.sql`** — deleted.
   `package.json`'s `check:get-agent-count-grants` script entry removed. Grepped `.github/` — no CI workflow ever
   referenced it, so no CI wiring to clean up.
7. **`messages/{uk,sq,it,en}.json`** — removed `stats_listings`, `stats_cities`, `stats_agents` from the `home`
   namespace in all four locale files (same 3 lines, same position in each — grep-confirmed no other file
   references these keys). These keys pre-date Task 597 (they were already used by the original legacy brand-red
   stats bar), so their removal is a real deletion relative to `git HEAD`, not just an undo of 597's own diff.
8. **`docs/rls-rules.md`** — removed the "Acknowledged Advisor Exceptions" row Task 597 added for
   `get_agent_count()`'s anon EXECUTE grant (the function no longer exists, so documenting an exception for it
   would be stale/misleading). Not explicitly listed in the kickoff's file list, but squarely inside "everything
   created for it (Task 597)" — flagging here as a small necessary addition to scope.
9. **`docs/critical-flow-registry.md`** — grepped for a 597/`getSiteStats` row: none exists, so nothing to remove
   (confirmed both before and after this session's edits).

## UX flow trace

Visitor loads `/{locale}`. Homepage now renders Hero → Featured → Latest → Popular locations → How it works →
Agent CTA, with no stats section and no layout gap or double spacing where it used to sit — confirmed by
rendered screenshots (below) at every breakpoint × all 4 locales: Hero flows directly into the Featured/Premium
section with the section's own `py-12 md:py-16 2xl:py-20` padding, no orphan gap. No console error, no
missing-translation-key warning (`check:i18n` stayed parity-green), no unused-import lint error.

## Negative flow verification

- Grep-clean repo-wide for every deleted symbol: `getSiteStats`, `MantineMetricCard`/`MetricCard`,
  `get_agent_count`/`get-agent-count` (outside historical docs/kickoffs — see below), `stats_listings`,
  `stats_cities`, `stats_agents` — zero remaining references in `src/`.
  `get_agent_count`/`get-agent-count` still appears in `docs/backlog.md`, `docs/backlog-archive.md`,
  `docs/sessions/2026-07-14-task597-*.md`, and both Task 597/598 kickoff files — all historical record, expected
  and correct to retain (the kickoff explicitly says the 597 session log "remains ... for history").
- `check:i18n` stayed green — parity preserved because all four locales lost the same 3 keys (2147→2144×4).
- `check:stories` stayed green with the MetricCard story gone, not orphaned (117→116 files, 0 violations).
- `screenshots:assert --mantine-only`: rebuilt Storybook first (a stale `storybook-static/` from the Task 597
  session was still on disk and would have hidden the deletion), then reran — `Mantine/Primitives/MetricCard`
  confirmed absent from the built Storybook index (`storybook-static/index.json` — 43 unique
  `Mantine/Primitives/*` titles, none named `MetricCard`), 665/692 PASS, 0 FAIL, 27 pre-existing AMBIGUOUS
  (Combobox/RangeDatePicker/Tabs/NotificationBellView overlay-backdrop ambiguities — same families as every
  prior run on this repo, unrelated to this deletion).

## Regression coverage (clause 15)

Pure deletion — no planted-violation needed. Full `src/modules/listings/` suite run after the deletion:
41 test files, 1035 tests, all passing (down exactly 1 file / 3 tests from the pre-deletion 42/1038 — the
deleted `getSiteStats.smoke.test.ts`, confirming no other test broke).

## Rendered proof (Mobile <640 full-width gate / homepage-without-stats check)

Since the homepage itself isn't a Storybook story, verified directly against a local `next dev` server with a
throwaway Playwright script (removed after use, never committed): captured `/uk` at 320/375/390/1280 and
`/en`, `/sq`, `/it` at 1280. All 7 cells show a clean Hero → Featured transition with no orphan spacing, no
horizontal scroll, and correctly localized copy (uk Cyrillic, sq/it/en Latin). uk@320/375/390 (mandatory)
confirmed no clip/no h-scroll.

## Files Changed

| File | Rationale |
|---|---|
| `src/app/[locale]/page.tsx` | Stats `<section>` deleted; `Promise.all` simplified; unused imports removed; every other section byte-identical to pre-597. |
| `src/design-system/mantine/patterns/MantineMetricCard.tsx` (deleted) | Task 597 primitive, no longer used. |
| `src/design-system/mantine/patterns/index.ts` | `MantineMetricCard` export line removed; all others intact. |
| `src/stories/mantine/primitives/MetricCard.stories.tsx` (deleted) | Its story, no longer used. |
| `src/modules/listings/lib/queries.ts` | `getSiteStats` (+ its sole `unstable_cache` import) removed; grep-confirmed zero remaining references. |
| `src/modules/listings/lib/__tests__/getSiteStats.smoke.test.ts` (deleted) | Its own smoke test; deleting a feature + its own test is allowed. |
| `scripts/check-get-agent-count-grants.mjs` (deleted) | RPC grant-audit gate, RPC no longer exists. |
| `scripts/task-597-get-agent-count-function.sql` (deleted) | The RPC SQL itself. |
| `package.json` | `check:get-agent-count-grants` script entry removed. |
| `messages/uk.json`, `messages/sq.json`, `messages/it.json`, `messages/en.json` | `stats_listings`/`stats_cities`/`stats_agents` removed from `home` namespace in all four (parity preserved). |
| `docs/rls-rules.md` | Removed the now-stale `get_agent_count()` Acknowledged-Advisor-Exceptions row (function no longer exists). |
| `docs/backlog.md` | Last Session summary updated (this task). |

## Self-validation

1. **AC-by-AC:**

   | AC | Where verified | Result |
   |---|---|---|
   | 1. `page.tsx` stats section gone, `Promise.all` simplified, stats-only imports removed, other sections byte-identical | `page.tsx` (full file); diffed against `git HEAD` — exact inverse of the original legacy stats bar + Task 597 additions, nothing else touched | ✅ |
   | 2. `MantineMetricCard.tsx`, `MetricCard.stories.tsx`, `getSiteStats.smoke.test.ts`, `check-get-agent-count-grants.mjs`, `task-597-get-agent-count-function.sql` deleted | `git status` shows all 5 gone, confirmed via `ls` | ✅ |
   | 3. `patterns/index.ts` — export removed, others intact | Diff shows only the 2-line removal | ✅ |
   | 4. `queries.ts` — `getSiteStats` removed, zero remaining references | Grep repo-wide: no matches outside historical docs | ✅ |
   | 5. `package.json` — script removed, no CI reference | Grep `.github/` — no matches (none ever existed) | ✅ |
   | 6. i18n keys removed from all 4 locales, `check:i18n` parity green | 2147→2144×4, PASSED | ✅ |
   | 7. `critical-flow-registry.md` — no row existed (confirmed both before and after) | Grep, no matches | ✅ |
   | 8. Gates green; `screenshots:assert --mantine-only` green, MetricCard gone, no orphan; rendered matrix | See "Rendered proof" + gate transcript below | ✅ |
   | 9. Session log, Files Changed table, UX flow trace, owner-action note, `docs/backlog.md` updated, no git run | This file + backlog.md edit | ✅ |

2. **Gate transcript:**
   - `npx tsc --noEmit` → 0 errors
   - `npx eslint <touched files>` → 0 errors, 0 warnings
   - `npm run check:i18n` → PASSED, 2144×4 keys (parity preserved, 3 fewer than before across all locales)
   - `npm run check:stories` → PASSED, 116 files, 0 violations (down from 117)
   - `node scripts/check-file-integrity.mjs` → PASSED, 8 files clean
   - `npm run check:mojibake` → PASSED, 0 artifacts in 1710 files
   - `npx vitest run src/modules/listings/` → 41 test files, 1035 tests, all passing (down exactly 1 file/3 tests
     from pre-deletion, confirming clean removal with zero collateral breakage)
   - `npm run build-storybook` → succeeded (rebuilt fresh so the assert below reflects the deletion, not a stale
     build)
   - `npm run screenshots:assert -- --mantine-only` → `Results: 665/692 PASS, 0 FAIL, 27 AMBIGUOUS`. `MetricCard`
     confirmed absent from `storybook-static/index.json`'s 43 `Mantine/Primitives/*` titles; the 27 ambiguous
     cells are the same pre-existing Combobox/RangeDatePicker/Tabs/NotificationBellView families seen on every
     prior run, unrelated to this deletion.

**Self-validation: tsc=0 errors · grep-clean of every deleted symbol · gates green · rendered homepage-without-stats confirmed at uk@320/375/390/1280 + en/sq/it@1280 · scope=clean**

## Owner action required (not run by this session — single-writer)

1. If `public.get_agent_count()` was already applied in Supabase, run `drop function public.get_agent_count();`
   (single-writer SQL apply). If it was never applied (the pending default, since Task 597 was never committed
   and this is the first the owner would have run it), no DB action is needed.
2. Commit the files in "Files Changed" above (the orchestrator emits the exact `git add`/`git commit` commands —
   including the deletions — at review, per the single-writer rule). Since Task 597 was never committed, there
   is nothing to "un-commit" — this is a single clean commit removing the legacy stats bar entirely.

Git NOT run by this session. HELD for orchestrator review.
