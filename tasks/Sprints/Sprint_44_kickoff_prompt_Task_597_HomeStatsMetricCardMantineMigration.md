# Task 597 — Homepage stats block → TailAdmin white metric cards (Mantine), 3 responsive tiles + real agent count

Sprint 44 (Epic MM Phase-2). Owner-reported 2026-07-14: the homepage stats tiles ("1+ Активних оголошень",
"25+ Міст", + Agents) are not adaptive. Owner decisions (2026-07-14, orchestrator Q&A):
1. **Show all 3 tiles**, adaptive at every breakpoint (Agents currently `hidden md:flex`).
2. **Rebuild on Mantine/TailAdmin white metric cards** (a deliberate visual change from the legacy brand-red strip).
3. **Fetch a REAL agent count** (the tile currently hardcodes `100+`).

## Pre-read (rule-index → UI/layout task + DB/query task)

**Always:** `docs/agent-contract.md` (clauses 1–16), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan).
**UI:** `docs/mantine-responsive-design-system.md` (FIRST — §7 mobile gate, §12 patterns, §16 acceptance, §18 theming pitfalls), `docs/tailadmin-style-reference.md` **§6u (the metric-card row extracted for this task — your single style source) + §6, §1**, `docs/ui-rules.md`, `docs/component-rules.md` (Container/Presentational split), `docs/qa-rules.md`.
**DB:** `docs/data-access-rules.md`, `docs/rls-rules.md` (anon-readable source for the agent count).

## Current behavior to preserve / change

Current: `src/app/[locale]/page.tsx` lines 44–71 — a `<section class="bg-primary text-primary-foreground">`
with `grid grid-cols-2 md:grid-cols-3 divide-x` holding three hand-rolled tiles. Tile 1 `stats_listings`
(`formatCount(stats.listings, locale)+'+'`, `TrendingUp`), tile 2 `stats_cities` (`stats.cities+'+'`, `MapPin`),
tile 3 `stats_agents` (**hardcoded `100+`**, `Users`, `hidden md:flex`). `getSiteStats()` returns only
`{ listings, cities }`; page fallback is `.catch(() => ({ listings: 0, cities: 0 }))`.

Change to: three **TailAdmin white metric cards** (§6u), all three visible at every breakpoint, in a responsive
grid; the brand-red band is removed; the Agents tile shows a **real** count from `getSiteStats`.

## Implementation (literal)

### 1. Data — `src/modules/listings/lib/queries.ts` → `getSiteStats`
- Add `agents` to the returned object. Count agent-type profiles from a **publicly/anon-readable source**.
  **Default predicate: `user_type = 'agent'`** (all agent accounts — matches the public `register?type=agent`
  designation; NOT verification-gated). Keep the existing `unstable_cache(['site-stats'], … 1h)` window — add the
  agents count to the same `Promise.all`.
- **🛑 STOP-AND-ASK gate (do NOT guess):** the base `profiles` table may not be anon-countable under RLS. Determine
  the correct public source: prefer the existing **`public_user_profiles` view** (safe public subset, has
  `user_type`) via `.select('user_id', { count:'exact', head:true }).eq('user_type','agent')`. If that view is NOT
  anon-readable / lacks `user_type`, or the only way to count is the service-role client (forbidden on a public
  cached read), **STOP and ASK the orchestrator** — do not silently switch to an admin client or the base table.
- Update the type/return so `{ listings, cities, agents }`. Update `page.tsx`'s `.catch(() => ({ listings:0,
  cities:0 }))` to `({ listings:0, cities:0, agents:0 })`.

### 2. New presentational primitive — `src/design-system/mantine/patterns/MantineMetricCard.tsx`
- **Pure, prop-driven** (no data/network hook — satisfies the Presentational-Primitive Split Gate). Props:
  `icon: ReactNode` (a lucide element), `value: string` (pre-formatted, e.g. `"1+"`), `label: string`.
- Chrome = **§6u literal** (verify rendered side-by-side; zero invented values):
  - card: `rounded-2xl border border-gray-200 bg-white p-5 md:p-6`, **no shadow**;
  - icon badge: `flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100`, icon 24px `text-gray-800`;
  - `mt-5 flex items-end justify-between` → left column: label `text-sm text-gray-500`, number `mt-2 text-title-sm
    font-bold text-gray-800` (30/38, bold); **no trend badge** (§6u: omitted — no delta datum).
  - Build with Mantine primitives where they map (`Paper`/`Box`/`ThemeIcon`); if a token isn't already in `theme.ts`
    (e.g. radius 16 card / 12 badge), apply the cited utility class rather than inventing a value.
- **NO brand color** on the card (neutral white/gray tile per §6u brand-note). Label must wrap (`whitespace-normal
  break-words`) for long sq/en/uk/it strings; no clip, no h-scroll at 320.

### 3. Story — `src/stories/mantine/primitives/MetricCard.stories.tsx`
- Canonical `Mantine/Primitives/MetricCard`, **single `Default` export**, Mantine proof path (`skipCanvas`,
  `storybook.mantine.*` i18n if any label text is needed, toolbar-driven viewport/locale — per
  `docs/storybook-governance.md` §14 + `docs/mantine-responsive-design-system.md` §8). Render all three real tiles
  (Listings/Cities/Agents) in the §6u `grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6` so the responsive stack is
  provable. No hardcoded user-facing string literal (use `t()`/`storyT()`); no `layout:'centered'`.

### 4. Consumer — `src/app/[locale]/page.tsx` stats `<section>` (lines 44–71)
- Replace the brand band + hand-rolled tiles with the §6u group: `grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6`
  inside `container-wide`, section padding e.g. `py-8 md:py-10` (cite spacing to §6l/§1 rhythm, no invented px).
- Three `<MantineMetricCard>`: `{icon:<TrendingUp/>, value: formatCount(stats.listings, locale)+'+', label:
  t('stats_listings')}`, `{<MapPin/>, stats.cities+'+', t('stats_cities')}`, `{<Users/>, formatCount(stats.agents,
  locale)+'+', t('stats_agents')}`. **Agents is no longer `hidden md:flex`** and no longer hardcoded.
- Keep icons decorative (`aria-hidden`). No new i18n keys — `stats_listings/stats_cities/stats_agents` already exist
  in all 4 locales (`check:i18n` parity unchanged).

## Positive flow

Anon or authed visitor loads `/{locale}`. `getSiteStats()` returns `{listings, cities, agents}` (cached 1h). The
stats section renders 3 white metric cards. `<640`: 1 column, each card **full-width edge-to-edge** (clause 11),
label wraps if long. `≥640`: 3 across, equal columns, §6u chrome (radius 16, gray-200 border, no shadow, 30px bold
number, gray icon badge). Numbers are real (agents from the DB).

## Negative flow

- `getSiteStats` throws → `.catch` fallback `{listings:0, cities:0, agents:0}` → cards render `0+`, no crash.
- Agent-count source blocked by RLS → STOP-AND-ASK (above); do NOT fall back to a service-role client on a public
  cached read, and do NOT re-hardcode a fake number.
- Long uk/it labels ("Активних оголошень" / "Agenti immobiliari") → wrap, never clip, no h-scroll at 320.
- `agents = 0` (no agent accounts yet) → tile shows `0+` (real), not hidden.

## Mobile <640 full-width gate (clause 11)

At `<640` the group is `grid-cols-1` → every card spans the full row edge-to-edge (documented: cards are the
container surface). Cards are **non-interactive** (no ≥44px touch-target requirement — document this exemption).
Labels wrap; no clip; no horizontal scroll at 320 in any of sq/en/uk/it.

## TailAdmin conformance (clause 16) — §6u

Every card token traces to `docs/tailadmin-style-reference.md §6u` (zip-cited from `index.html` "Metric Item").
Rendered proof MUST be **side-by-side with the §6u reference** (border gray-200, radius 16, no shadow, icon badge
48/rounded-xl/gray-100, number 30px bold gray-800, label 14 gray-500) at the canonical breakpoints × sq/en/uk/it.
`tsc=0`/build-green is NOT style proof.

## Presentational-primitive split gate

`MantineMetricCard` is prop-driven with zero data/network hooks; the story targets it with plain fixtures (NO hook
mock / `.storybook` alias / live Supabase). The server fetch stays in `page.tsx` (the container).

## Regression coverage (clause 15)

`getSiteStats` gains an `agents` count. No existing `critical-flow-registry.md` flow covers `getSiteStats`
(the listings-display row covers `ListingCard` formatting, not this). Add a **light smoke test** for `getSiteStats`
(mock the Supabase client) asserting: it issues the agents count query against the chosen public source with
`.eq('user_type','agent')`, and returns `{listings, cities, agents}`; a **planted-violation** (drop the agents
query / return) makes the test FAIL. Paste the red/green transcript. (If the orchestrator confirms this warrants a
registry row at review, add one then — otherwise the smoke test is sufficient for this P2 surface.)

## Acceptance criteria (each verifiable in the diff / rendered)

1. `getSiteStats` returns `{listings, cities, agents}`; agents counted from the anon-readable source with
   `user_type='agent'`; 1h cache preserved; `page.tsx` `.catch` fallback includes `agents:0`. (file:line)
2. `MantineMetricCard.tsx` — pure prop-driven primitive, §6u chrome, no brand color, label wraps, no trend badge.
3. `MetricCard.stories.tsx` — canonical single-`Default` Mantine story, all 3 tiles in the responsive grid, no
   hardcoded strings, no `layout:'centered'`.
4. `page.tsx` stats section rebuilt: 3 metric cards, `grid-cols-1 sm:grid-cols-3`, Agents visible at all
   breakpoints, real values, brand band removed.
5. **Mobile <640 full-width gate:** cards full-width stacked at `<640`; labels wrap; no clip/h-scroll@320 (Positive +
   Negative flows). Rendered matrix (breakpoints × sq/en/uk/it, **uk@320/375/390 mandatory**) in the session log
   with real per-cell evidence + §6u side-by-side proof.
6. Regression smoke test for `getSiteStats` agents count, red/green planted-violation transcript.
7. Gates: `tsc --noEmit`=0, eslint clean, `check:i18n` unchanged parity, `check:stories`, `check:file-integrity`,
   `check:mojibake` green; `screenshots:assert --mantine-only` includes the new MetricCard story, no new FAIL.
8. Session log with AC-by-AC self-audit + "Files Changed" table + UX flow trace; `docs/backlog.md` updated. No git run.

## Hard contract

No scope change beyond the four files above (+ the test); no architecture invention (STOP-AND-ASK on the agent-count
source per §1 above); literal AC; preserve every other homepage section; self-validate before "complete"; "Files
Changed" table; executor emits NO `git add`/`git commit` (orchestrator emits at review, single-writer).
