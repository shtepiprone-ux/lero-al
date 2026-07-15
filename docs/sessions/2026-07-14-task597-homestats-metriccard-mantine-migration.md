# Task 597 — Homepage stats block → TailAdmin white metric cards (Mantine), 3 responsive tiles + real agent count

Sprint 44 (Epic MM Phase-2). Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_597_HomeStatsMetricCardMantineMigration.md`.
Owner-reported 2026-07-14: the homepage stats tiles are not adaptive (Agents `hidden md:flex`, hardcoded `100+`).
Owner decisions: show all 3 tiles at every breakpoint, rebuild on Mantine/TailAdmin white metric cards (§6u),
fetch a REAL agent count.

## STOP-AND-ASK resolution (already recorded in the kickoff before this session)

The kickoff's Data section (§1) named `public_user_profiles` as the preferred anon-readable source for the
agent count. That view's GRANT is authenticated-only (Task 266/268, deliberate). Since `getSiteStats()` runs
for every homepage visitor including guests, and the kickoff forbids a service-role client or the base table
on this public cached read, the orchestrator resolved this pre-kickoff to **Option 1 — a new anon-callable,
count-only `SECURITY DEFINER` RPC** (matching the `record_listing_view` / `record_recently_viewed` precedent
already acknowledged in `docs/rls-rules.md`). The kickoff's exact function spec is dated "ORCHESTRATOR-RESOLVED
2026-07-14" (§1).

**Correction to the kickoff's draft SQL:** the kickoff's snippet referenced `public.profiles`, which does not
exist in this schema. Verified via `src/types/database.ts` (`User` interface, `user_type` field) and
`scripts/schema-drift-check.sql` (lists `('users', 'user_type')`, no `profiles` table anywhere) that the real
table is `public.users`. Corrected in the migration SQL — documented inline in the file itself.

## Current behavior to preserve / change

Before: `src/app/[locale]/page.tsx` — `<section class="bg-primary text-primary-foreground">`, `grid grid-cols-2
md:grid-cols-3 divide-x` with 3 hand-rolled tiles; Agents tile `hidden md:flex` + hardcoded `100+`. `getSiteStats()`
returned only `{ listings, cities }`.

After: three `MantineMetricCard` tiles (§6u chrome) in `grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6`, all visible at
every breakpoint, brand-red band removed, Agents shows a real DB-backed count.

Every other homepage section (Hero, Featured/Latest listings, Popular locations, How-it-works, Agent CTA) is
byte-identical — only the stats `<section>` (lines 44–71 pre-change) and the `getSiteStats` fallback were touched.

## Implementation

### 1. Data — `public.get_agent_count()` RPC (`scripts/task-597-get-agent-count-function.sql`, new)

`SECURITY DEFINER`, `language sql`, `set search_path = ''` (hardened, fully-qualified `public.users` reference),
`stable`, body `select count(*)::int from public.users where user_type = 'agent'`. `revoke all ... from public`
then `grant execute ... to anon, authenticated`. Returns ONLY an integer — zero rows, zero PII. Rationale comment
in the file documents the STOP-AND-ASK outcome and the `profiles`→`users` correction. **Owner action required:**
apply this SQL in the Supabase SQL Editor (single-writer) — until then `getSiteStats` degrades to `agents: 0`.

### 2. Grant-audit gate — `scripts/check-get-agent-count-grants.mjs` (new) + `npm run check:get-agent-count-grants`

Static scan (modeled on `check-listing-reports-grants.mjs`) asserting: anon+authenticated EXECUTE present, no
un-countered revoke, function body is count-only (`select count(*)`, not `select *`), `security definer` +
explicit `search_path` present. Planted-violation proof (dropped the anon grant, reran, genuine FAIL, reverted,
genuine PASS) — see "Regression coverage" below.

### 3. `getSiteStats` (`src/modules/listings/lib/queries.ts`)

Added `supabase.rpc('get_agent_count')` to the existing `Promise.all`; `agents: agentCountResult.error ? 0 :
(agentCountResult.data ?? 0)`. Existing 1h `unstable_cache` window unchanged. Returns `{ listings, cities, agents }`.

### 4. `MantineMetricCard` primitive (`src/design-system/mantine/patterns/MantineMetricCard.tsx`, new)

Pure, prop-driven (`icon`, `value`, `label` — zero data/network hooks, Presentational-Primitive Split Gate).
Chrome: `Card withBorder p={{base:'lg',md:'xl'}}` — theme's existing `Card` defaults (radius `2xl`=16px, border
`gray.2`=#e4e7ec, no shadow) already byte-match §6u's card wrapper; only the responsive padding (20→24px) needed
a local override, using existing spacing tokens (no invented px). Icon badge: 48×48 `Box` (`gray.1` bg, `xl`
radius=12px — no existing theme token for this exact geometry, set directly per kickoff's "cite the utility
class, don't invent a value" instruction). Label 14px `gray.5`, wraps (`whiteSpace:'normal', wordBreak:'break-word'`);
value `text-title-sm` (an existing Tailwind v4 `@theme` utility already in `globals.css` — 30px/38px — applied via
`className` since Mantine's `fontSizes` scale has no matching token) + `fw={700}` + `gray.8`. No trend badge (no
delta datum). No brand color (§6u brand-note — deliberate departure from the legacy brand-red strip). Exported
from `src/design-system/mantine/patterns/index.ts`.

### 5. Story — `src/stories/mantine/primitives/MetricCard.stories.tsx` (new)

Single `Default` export, `Mantine/Primitives/MetricCard` title (required prefix for the `--mantine-only` gate),
renders all 3 real tiles (`TrendingUp`/`MapPin`/`Users`) in the §6u `grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6`,
labels via `storyT(locale, 'home.stats_*')` (existing keys, no new i18n needed), no hardcoded strings, no
`layout:'centered'`.

### 6. Consumer — `src/app/[locale]/page.tsx`

Replaced the brand-red `<section>` with the §6u group wrapping 3 `<MantineMetricCard>`; Agents tile no longer
`hidden md:flex`, value is `formatCount(stats.agents, locale)+'+'` (real). `.catch()` fallback updated to
`{ listings: 0, cities: 0, agents: 0 }`.

### 7. Documentation

`docs/rls-rules.md` — added a new row to "Acknowledged Advisor Exceptions" for `get_agent_count()`'s intentional
anon+authenticated EXECUTE grant (mirrors the `record_listing_view` row), citing the STOP-AND-ASK resolution.

## UX flow trace

Entry: any visitor (anon or authed) loads `/{locale}`. `getSiteStats()` resolves `{listings, cities, agents}` →
3 `MantineMetricCard` tiles render in the stats section, between Hero and Featured Listings (same position as
before). `<640`: 1 column, each card full-width edge-to-edge (clause 11 — documented touch-target exemption, cards
are non-interactive display surfaces). `≥640`: 3-across. Error state: `getSiteStats().catch()` → all three render
`0+`, section still renders, no crash. Agent-count-specific negative: RPC not yet applied in Supabase / RPC errors
→ `agents: 0`, tile shows `0+` (real, not hidden) rather than the old hardcoded `100+`. No other homepage entry
point, control, or downstream step was touched.

## Regression coverage (clause 15)

**`getSiteStats` mocked-client smoke test** — `src/modules/listings/lib/__tests__/getSiteStats.smoke.test.ts` (new).
Mocks `@/lib/supabase/client` (thenable query-builder chain for `.from()`, direct promise for `.rpc()`); `next/cache`
is already stubbed to identity in the vitest env, so the real (unwrapped) `getSiteStats` function runs on every
call. Three cases: (1) positive — `rpc('get_agent_count')` called, its `data` maps into `agents`; (2) negative —
RPC error object degrades to `agents: 0`, no throw; (3) negative — RPC resolving `{data: null, error: null}` also
degrades to `0`.

**Planted-violation transcript (test):** temporarily changed `agents: agentCountResult.error ? 0 : (...)` to a
literal `agents: 999` in `queries.ts`, reran:
```
 Test Files  1 failed (1)
      Tests  3 failed (3)
 - "agents": 15,
 + "agents": 999,
```
All 3 tests genuinely FAILed. Reverted; reran → `Test Files 1 passed (1)`, `Tests 3 passed (3)`.
`git diff --stat -- src/modules/listings/lib/queries.ts` after revert shows only the intended addition (no stray
planted-violation residue).

**Planted-violation transcript (SQL grant-audit script):** temporarily changed the migration's
`grant execute ... to anon, authenticated` → `... to authenticated` (dropping anon), reran
`node scripts/check-get-agent-count-grants.mjs`:
```
❌ get_agent_count grant check FAILED:
   anon is NOT granted EXECUTE on get_agent_count — the homepage Agents tile needs anon access.
```
Reverted; reran → `✅ get_agent_count grant check PASSED`.

No existing `docs/critical-flow-registry.md` row covers `getSiteStats` — per the kickoff, the smoke test is
sufficient for this P2 surface; a registry row can be added if the orchestrator wants one at review.

## Files Changed

| File | Rationale |
|---|---|
| `scripts/task-597-get-agent-count-function.sql` (new) | SECURITY DEFINER count-only RPC + grants; owner must apply in Supabase SQL Editor (single-writer). |
| `scripts/check-get-agent-count-grants.mjs` (new) | Static grant-audit gate for the new RPC (RLS-Change Test Requirement). |
| `package.json` | Added `check:get-agent-count-grants` npm script. |
| `src/modules/listings/lib/queries.ts` | `getSiteStats` gains real `agents` count via `rpc('get_agent_count')`, graceful `0` degradation. |
| `src/modules/listings/lib/__tests__/getSiteStats.smoke.test.ts` (new) | Regression coverage (clause 15) — positive + 2 negative cases, planted-violation proven. |
| `src/design-system/mantine/patterns/MantineMetricCard.tsx` (new) | §6u TailAdmin white metric card, pure prop-driven primitive. |
| `src/design-system/mantine/patterns/index.ts` | Export `MantineMetricCard` + its props type. |
| `src/stories/mantine/primitives/MetricCard.stories.tsx` (new) | Canonical single-`Default` Mantine story, 3 real tiles, responsive grid. |
| `src/app/[locale]/page.tsx` | Stats section rebuilt on `MantineMetricCard` × 3; Agents no longer hidden/hardcoded; `.catch` fallback includes `agents:0`. |
| `docs/rls-rules.md` | New "Acknowledged Advisor Exceptions" row for `get_agent_count()`'s anon EXECUTE grant. |
| `docs/backlog.md` | Last Session summary updated (this task). |
| `docs/backlog-archive.md` | Archived the Task 596 ledger row (moved out of `backlog.md`'s Last Session per the Backlog & Session Log Rules). |

## Self-validation

1. **Build + typecheck gate:** `npx tsc --noEmit` → 0 errors.

2. **Acceptance-criteria self-audit:**

   | AC bullet | Where verified | Result |
   |---|---|---|
   | `getSiteStats` returns `{listings, cities, agents}`; agents from anon-readable source `user_type='agent'`; 1h cache preserved; `.catch` fallback includes `agents:0` | `queries.ts:104-128`, `page.tsx:24` | ✅ |
   | `MantineMetricCard.tsx` — pure prop-driven, §6u chrome, no brand color, label wraps, no trend badge | `MantineMetricCard.tsx` (full file) | ✅ |
   | `MetricCard.stories.tsx` — single-`Default` Mantine story, 3 tiles, responsive grid, no hardcoded strings, no `layout:'centered'` | `MetricCard.stories.tsx`; `check:stories` PASSED | ✅ |
   | `page.tsx` stats section rebuilt: 3 cards, `grid-cols-1 sm:grid-cols-3`, Agents visible at all breakpoints, real values, brand band removed | `page.tsx` stats section | ✅ |
   | Mobile <640 full-width gate: cards full-width stacked, labels wrap, no clip/h-scroll@320 | `SimpleGrid cols={{base:1,sm:3}}` — 1 column <640, native Mantine responsive prop | ✅ |
   | Regression smoke test for agents count, red/green planted-violation transcript | Above ("Regression coverage") | ✅ |
   | Gates: tsc=0, eslint clean, check:i18n unchanged, check:stories, check:file-integrity, check:mojibake green; `screenshots:assert --mantine-only` includes MetricCard, no new FAIL | Below | ✅ |
   | Session log + Files Changed table + UX flow trace; `docs/backlog.md` updated; no git run | This file + backlog.md edit | ✅ |

3. **Diff self-review:** scope is the 9 authored/modified files above. No unrelated homepage sections touched. No
   raw `<button>`/`div.fixed.inset-0`/hardcoded strings introduced. No `window.location.href`. Every other homepage
   entry point/control/state unchanged.

4. **Gate transcript (run natively in the main working tree):**
   - `npx tsc --noEmit` → 0 errors
   - `npx eslint <touched files>` → 0 errors, 0 warnings
   - `npm run check:i18n` → PASSED, 2147×4 keys (unchanged parity — `home.stats_*` already existed in all 4 locales)
   - `npm run check:stories` → PASSED, 117 files, 0 violations
   - `node scripts/check-file-integrity.mjs` → PASSED, 10 files clean
   - `npm run check:mojibake` → PASSED, 0 artifacts in 1711 files
   - `node scripts/check-get-agent-count-grants.mjs` → PASSED (+ planted-violation red/green above)
   - `npx vitest run src/modules/listings/` → 42 test files, 1038 tests, all passed (zero regression)
   - `npm run screenshots:assert -- --mantine-only` → `Results: 665/692 PASS, 0 FAIL, 27 AMBIGUOUS`. The new
     `MetricCard` story is the 43rd Mantine/Primitives story (692 = 43×16 cells + 4 extra-viewport); zero FAIL,
     and "MetricCard" does not appear anywhere in the ambiguous listing (grep-confirmed) — all 27 ambiguous cells
     are pre-existing `Combobox`/`RangeDatePicker`/`Tabs`/`NotificationBellView` overlay-backdrop or swipe-tab
     ambiguities, unrelated to this task.

**Self-validation: tsc=0 errors · AC table=all green · gates green · rendered gate=665/692 PASS/0 FAIL · scope=clean**

## Owner action required (not run by this session — single-writer)

1. Apply `scripts/task-597-get-agent-count-function.sql` in the Supabase SQL Editor. Until applied, the Agents
   tile shows `0+` (real degraded value, not a fake number) — acceptable per the kickoff's negative flow.
2. Commit the files in "Files Changed" above (the orchestrator emits the exact `git add`/`git commit` commands at
   review, per the single-writer rule).

Git NOT run by this session. HELD for orchestrator review.
