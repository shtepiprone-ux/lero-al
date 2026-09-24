# Task 598 — Remove the homepage stats block entirely (revert Task 597 + all related artifacts)

Sprint 44 (Epic MM Phase-2). **Owner decision 2026-07-14:** the three homepage stat tiles
("Активних оголошень 1+", "Міст 25+", "Агентів 0+") are unwanted — remove the whole stats section
and everything created for it (Task 597). This SUPERSEDES Task 597; do not re-style, delete.

> This is a **deletion / cleanup** task. Remove code cleanly, leave zero dead imports, zero orphan
> files, zero dangling i18n keys, all gates green. Do NOT touch any other homepage section.

## Pre-read (rule-index → UI/layout task + DB/query cleanup)

**Always:** `docs/agent-contract.md` (clauses 1–16), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan for a 597/`getSiteStats` row).
**UI:** `docs/mantine-responsive-design-system.md`, `docs/ui-rules.md`, `docs/qa-rules.md`.
**DB:** `docs/data-access-rules.md` (removing `getSiteStats`).

## Current state (what exists now — all from Task 597)

- `src/app/[locale]/page.tsx` — the `{/* ── Stats bar ── */}` `<section className="py-8 md:py-10">`
  (currently lines ~46–67): a `<SimpleGrid cols={{base:1,sm:3}}>` with three `<MantineMetricCard>`
  (Listings/Cities/Agents). Fed by `getSiteStats()` in the `Promise.all` (line ~23-24) with
  `.catch(() => ({ listings:0, cities:0, agents:0 }))`.
- `src/design-system/mantine/patterns/MantineMetricCard.tsx` — the primitive; exported from
  `src/design-system/mantine/patterns/index.ts`.
- `src/stories/mantine/primitives/MetricCard.stories.tsx` — its canonical story.
- `src/modules/listings/lib/queries.ts` — `getSiteStats` (the ONLY consumer is `page.tsx`; confirm by grep).
- `src/modules/listings/lib/__tests__/getSiteStats.smoke.test.ts` — its smoke test.
- `scripts/check-get-agent-count-grants.mjs` + `scripts/task-597-get-agent-count-function.sql` — the
  agent-count RPC gate + SQL (the RPC was NEVER required by anything else).
- `messages/{uk,sq,it,en}.json` — keys `stats_listings`, `stats_cities`, `stats_agents` (home namespace).
- Possibly a `docs/critical-flow-registry.md` row for `getSiteStats` (added by 597).
- `package.json` — a `check:get-agent-count-grants` script entry + any CI wiring.

## Implementation (literal)

### 1. `src/app/[locale]/page.tsx`
- Delete the entire `{/* ── Stats bar … */}` `<section>` (the `SimpleGrid` + three `MantineMetricCard`).
- Remove the `getSiteStats` call from the `Promise.all`; since `favoriteIds` is the only remaining
  awaited value, simplify to `const favoriteIds = await loadUserFavoriteListingIds(supabase)`
  (keep `createClient`/`supabase` — still needed for favorites).
- Remove now-unused imports: `SimpleGrid` (from `@mantine/core`), `getSiteStats`, `formatCount`,
  `MantineMetricCard`, and from lucide `TrendingUp`, `MapPin`, `Users` — **verify each is unused
  elsewhere in the file before removing** (`Search`, `Home`, `Phone`, `Building2` stay). Leave the
  Hero, Featured, Latest, PopularLocations, How-it-works, and Agent-CTA sections byte-identical.

### 2. Delete the primitive + story
- Delete `src/design-system/mantine/patterns/MantineMetricCard.tsx`.
- Remove its export line from `src/design-system/mantine/patterns/index.ts` (grep the barrel; leave
  every other export intact).
- Delete `src/stories/mantine/primitives/MetricCard.stories.tsx`.

### 3. Delete the data layer
- Remove `getSiteStats` from `src/modules/listings/lib/queries.ts` (and any now-unused import/helper
  that existed ONLY for it — verify each is not shared). Grep the repo first to CONFIRM `page.tsx` +
  the smoke test are the only references; if any other consumer exists, STOP and ASK.
- Delete `src/modules/listings/lib/__tests__/getSiteStats.smoke.test.ts`.

### 4. Delete the agent-count RPC scaffolding
- Delete `scripts/check-get-agent-count-grants.mjs` and `scripts/task-597-get-agent-count-function.sql`.
- Remove the `check:get-agent-count-grants` entry from `package.json` `scripts` and any CI workflow /
  `pre*` aggregate that calls it (grep `get-agent-count` across `package.json` + `.github`/CI config).
- **Owner action note (record in session log):** if `public.get_agent_count()` was already applied in
  Supabase, the owner must `drop function public.get_agent_count();` (single-writer SQL apply). If it
  was never applied (the pending default), no DB action is needed.

### 5. i18n keys
- Remove `stats_listings`, `stats_cities`, `stats_agents` from the `home` namespace in ALL FOUR
  `messages/{uk,sq,it,en}.json`. Removing from all four keeps `check:i18n` parity equal. Confirm no
  other file references these keys (grep) before removing.

### 6. Registry
- If `docs/critical-flow-registry.md` has a 597/`getSiteStats` row, remove it (the covered flow no
  longer exists). If none, note "no registry row existed" in the session log.

## Positive flow
Visitor loads `/{locale}`. The homepage renders Hero → (no stats section) → Featured → Latest →
Popular locations → How it works → Agent CTA, with no layout gap or double spacing where the stats
section used to be. No console error, no missing-key warning, no unused-import lint error.

## Negative flow
- A leftover reference to any deleted symbol (`getSiteStats`, `MantineMetricCard`, `formatCount` if
  now unused, the three i18n keys) → build/lint/tsc FAILS. There must be NONE — grep-clean.
- `check:i18n` must stay green (parity preserved because all four locales lose the same 3 keys).
- The MetricCard story removal must not break `check:stories` / `screenshots:assert` (the story is
  gone, not orphaned).

## Mobile <640 full-width gate (clause 11)
No new UI is added; the remaining sections already satisfy the gate. Provide rendered proof the
homepage still renders correctly WITHOUT the stats section at the canonical breakpoints × sq/en/uk/it
(**uk@320/375/390 mandatory**) — i.e. no orphan spacing / broken grid where it was removed.

## Regression coverage (clause 15)
This removes `getSiteStats` and its smoke test. Deleting a feature + its own test is allowed (no flow
remains to protect). Confirm no OTHER test imports the deleted symbols; run the full suite and paste
the green transcript. No planted-violation needed for a pure deletion, but the suite must be green
with the deletions in place.

## Acceptance criteria (each verifiable in the diff)
1. `page.tsx` — stats `<section>` gone; `Promise.all` simplified; every stats-only import removed;
   all other sections byte-identical. (file:line)
2. `MantineMetricCard.tsx`, `MetricCard.stories.tsx`, `getSiteStats.smoke.test.ts`,
   `check-get-agent-count-grants.mjs`, `task-597-get-agent-count-function.sql` — deleted.
3. `patterns/index.ts` — `MantineMetricCard` export removed; all others intact.
4. `queries.ts` — `getSiteStats` removed; grep proves zero remaining references repo-wide.
5. `package.json` — `check:get-agent-count-grants` removed; no CI step references it.
6. `messages/{uk,sq,it,en}.json` — the 3 `stats_*` keys removed from all four; `check:i18n` green (parity).
7. `docs/critical-flow-registry.md` — 597 row removed (or documented as none existed).
8. Gates: `tsc --noEmit`=0, eslint clean (no unused-import), `check:i18n`, `check:stories`,
   `check:file-integrity`, `check:mojibake` green; `screenshots:assert --mantine-only` green with the
   MetricCard story gone (no orphan). Rendered matrix (breakpoints × sq/en/uk/it, uk@320/375/390) of the
   homepage without the stats section in the session log.
9. Session log with AC-by-AC self-audit + "Files Changed" table (one row per deleted/edited path) +
   UX flow trace + owner-action note (drop RPC if applied); `docs/backlog.md` updated. No git run.

## Hard contract
No scope change beyond the files listed above; do NOT touch Hero/Featured/Latest/PopularLocations/
How-it-works/Agent-CTA; if any deleted symbol turns out to have another consumer, STOP and ASK instead
of leaving a broken reference; self-validate before "complete"; "Files Changed" table required; executor
emits NO `git add`/`git commit` (orchestrator emits at review, single-writer).
