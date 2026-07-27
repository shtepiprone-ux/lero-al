# Task 670 — HeroSearch `ssr:false` fallback → Mantine, with measured first-paint geometry parity

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI / Layout / Component — **current Mantine path** (`docs/rule-index.md`).
- **Secondary types:** Storybook / Visual Proof (new canonical story + `ASSERT_STORIES` registration + manifest
  enrolment). Performance is **context, not scope** — see §8.
- **Boundary statement:** the changed surface is Mantine-current. No legacy shadcn/Tailwind surface is migrated by
  this task; `FiltersPanel` (still legacy raw markup, Task 671) is explicitly out of scope even though it is
  rendered by the same `HeroSearchView` subtree.

---

## 2. Objective

`src/components/shared/HeroSearchClient.tsx` loads `HeroSearch` with `ssr:false`. Its `loading:` fallback is a raw
Tailwind `<div>`. Because the import is `ssr:false`, **that raw `<div>` is the entire server-rendered HTML and the
entire first paint of the homepage hero search** — it is not an incidental spinner.

Two outcomes, both required:

1. Replace the raw fallback markup with Mantine primitives, extracted into its own presentational component so it can
   carry a canonical Mantine Story and be enrolled in `scripts/mantine-migration-scope.json`.
2. Drive the fallback's rendered height from **measured** `HeroSearchView` geometry instead of the current single
   hardcoded `h-[76px]`, so the hydration swap does not move the page. The measurement is produced by a harness in
   this task; **no height value may be invented, including by the executor.**

---

## 3. Verified context

All facts below were read from the working tree at commit `1428bfee2` on `main`. Line numbers are from that read.

### 3.1 The file being changed

`src/components/shared/HeroSearchClient.tsx` (19 lines, entire current content):

```tsx
'use client'

import dynamic from 'next/dynamic'

const HeroSearchDynamic = dynamic(
  () => import('@/components/shared/HeroSearch').then(m => ({ default: m.HeroSearch })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full max-w-3xl mx-auto h-[76px] rounded-2xl bg-background/10 animate-pulse" // design-tokens-allow: h-[76px] — hero search bar skeleton fixed height; off-scale (no spacing token = 76px)
      />
    ),
  }
)

export function HeroSearchClient() {
  return <HeroSearchDynamic />
}
```

Verified counts for this file: `className` occurrences = 1, `@mantine/core` imports = 0.

### 3.2 What the fallback is standing in for

`src/components/shared/HeroSearchView.tsx` (VERIFIED read, 160 lines) renders, inside
`<Box className="hero-search w-full max-w-3xl mx-auto">` (line 49):

- line 55–70: a wrapper `Box w={{ base: '100%', sm: 'fit-content' }}` containing a Mantine `SegmentedControl`
  (`fullWidth`, `mb={0}`, bottom radii and bottom border zeroed).
- line 91–147: a `Box bg="gray.1" bd="1px solid var(--mantine-color-gray-2)"` with
  `className="rounded-b-[var(--mantine-radius-lg)] sm:rounded-tr-[var(--mantine-radius-lg)] p-3"`, containing
  `<Box className="flex flex-wrap md:flex-nowrap gap-2">` with four controls in this order:
  `PropertyTypeCombobox` (`basis-full sm:basis-auto sm:w-48 shrink-0`), `LocationCombobox`
  (`basis-full sm:basis-0 grow min-w-0`), `MantineCountButton` (`shrink-0`), and a `Button`
  (`px-6 font-semibold basis-full sm:basis-full md:grow-0 md:basis-auto`).
- line 150–157: `<FiltersPanel …>` — a **sibling** of the `hero-search` Box, not a child of it.

**Consequence that makes the current fallback suspect:** the real subtree is a two-part stack (segmented strip +
padded bar) whose bar contents **wrap** — `flex-wrap` at base, `md:flex-nowrap` from 768px, with `basis-full` on
the property-type, location and search controls below `sm`. Its rendered height therefore varies by width, while the
fallback is a single flat `76px` at every width. `scripts/check-stories-rendered.mjs:404–414` already encodes a
`HeroSearch`-specific extra viewport (`band-700`) precisely because this subtree's row structure changes inside the
640–767 band (Task 573).

> This task does **not** assert that `76px` is currently wrong. It asserts that the correct value is **unknown and
> unmeasured**, and requires it to be measured. See AC3/AC4 and §13.3.

### 3.3 Consumer

`src/app/[locale]/page.tsx:37` renders `<HeroSearchClient />` inside
`<Box className="container-wide" pos="relative" style={{ zIndex: 10 }}>` (line 28), itself inside
`<Box component="section" bg="var(--primary)" pos="relative" py={{ base: '4rem', md: '6rem' }}>` (line 27).
The route shell is already Mantine (Task 659); `page.tsx` is **not** modified by this task.

**Useful precedent in the same file:** line 29 is `<Box maw={768} mx="auto" ta="center" mb={40}>` — the hero
title block already expresses the identical 48rem/768px cap as a Mantine `maw` prop rather than a Tailwind
`max-w-3xl` class. That is the established local form for I3's wrapper row; reuse it.

### 3.4 Governance state — the gap this task closes

- `scripts/mantine-migration-scope.json` (VERIFIED, 10 entries) contains `src/components/shared/HeroSearchView.tsx`
  but **does not** contain `src/components/shared/HeroSearchClient.tsx`. The fallback is therefore invisible to
  `check:story-coverage`, which by design "never checks, never blocks" anything absent from the manifest
  (`scripts/check-story-coverage.mjs:24–26`).
- `scripts/check-story-coverage.mjs:22–23`: a component **in** the manifest with no canonical Mantine story that
  **statically imports** it is a FAIL. This is why §7 requires extraction into a separately importable component —
  a story cannot deterministically import `HeroSearchClient` and stay in the loading branch, because
  `next/dynamic` would resolve the real `HeroSearch`.
- `scripts/check-stories-rendered.mjs:118+` `ASSERT_STORIES` is an explicit hand-maintained list of
  `{ id, label, anchors }`; a new story is **not** picked up by the rendered-proof sweep unless registered there.

### 3.5 Clause-16c finding — the canonical story has diverged from production

`src/stories/mantine/primitives/HeroSearch.stories.tsx:52` wraps the story in:

```tsx
<section className="relative bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950 text-primary-foreground py-16 md:py-24">
```

with the comment (lines 49–51) claiming these are the "**Same hero wrapper classes as
src/app/[locale]/page.tsx**". That claim is **stale**. Task 659 replaced the homepage hero gradient with a solid
coral: `src/app/[locale]/page.tsx:26` now reads `bg="var(--primary)"`. The story still renders the pre-659 gradient.

- **Diverged:** background (`bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950` vs `var(--primary)`) and
  the `text-primary-foreground` inherited text color.
- **NOT diverged (verified, do not "fix"):** vertical padding — story `py-16 md:py-24` = 64px/96px, production
  `py={{ base: '4rem', md: '6rem' }}` = 64px/96px. **Identical. Leave it alone.**

Per `docs/agent-contract.md` clause 16c, this task changes a visible artifact whose canonical Mantine Story is
`Mantine/Primitives/HeroSearch`, and it uses that Story as the measurement source in §13.3 — so correcting this
divergence is **in scope and mandatory**, not a drive-by refactor.

### 3.6 Precedents to reuse (inspected, not assumed)

- **Loading primitive:** `src/modules/listings/components/FeaturedListingsView.tsx:4,12–25` — `Skeleton` imported
  from `@mantine/core`, composed inside a `Box`, with `height`/`width` props and a `style={{ aspectRatio }}`
  escape hatch. Established by Task 657, carried through Task 665. This is the canonical loading source.
- **Container/presentational split for story determinism:** Task 665 (`FeaturedListings` container →
  `FeaturedListingsView`) and Task 568 (`HeroSearch` container → `HeroSearchView`).
- **Baseline/verify measurement harness:** `scripts/task668-qa-grid-1440.mjs:1–33` — explicit `--baseline` (writes
  `.screenshots/task668/baseline.json`, asserts nothing about expected values, must exit 0 against the pre-change
  tree) and `--verify` (asserts the expected table and diffs against the stored baseline) modes, reusing the
  already-built `storybook-static/`. **Copy this two-mode shape.**

### 3.7 Critical-flow status

`grep -n "HeroSearch\|hero" docs/critical-flow-registry.md` returns exactly one row (line 50), and it is the
**`FiltersPanel` shell / filter leaf controls** row — not the hero search bar and not the fallback. This task
touches neither `FiltersPanel` nor any filter leaf control. **Clause 15 regression-coverage obligation: does not
apply.** Do not add a registry row; do not claim one applies.

### 3.8 Performance context (context only — see §8 for the scope boundary)

`docs/performance.md:66–67` sets the budgets `LCP ≤ 2500ms`, `CLS ≤ 0.10`, and lines 86–92 document a standing
warning that fires when an image owns LCP on the homepage because **"hero text should own LCP"**. The hero `Title`
(`page.tsx:31`) is the intended LCP element, **not** the search bar. This task therefore has **no LCP target**; its
geometry work is about the hydration swap not moving content, which is a CLS concern.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Backlog "Open — needs action" (Task 670 reserved); `docs/agent-contract.md` cl. 16 | The homepage hero first-paint fallback renders via Mantine primitives, with zero raw `<div>`/`<span>` elements and zero Tailwind layout/utility `className` values of its own | P0 | Source inspection + AC1 | Confirmed |
| R2 | `scripts/check-story-coverage.mjs:22–26`; cl. 16c | The fallback is a separately importable component, enrolled in `scripts/mantine-migration-scope.json`, and statically imported by a canonical `Mantine/Primitives/*` story | P0 | `npm run check:story-coverage` (AC2) | Confirmed |
| R3 | `docs/performance.md:66–67`; §3.2 | The fallback's rendered height is derived from **measured** `HeroSearchView` height per width/locale, not from a hardcoded constant carried over from the current code | P0 | `task670-qa-hero-fallback-geometry.mjs --baseline`/`--verify` (AC3, AC4) | Confirmed |
| R4 | `docs/agent-contract.md` cl. 16c; §3.5 | The `Mantine/Primitives/HeroSearch` story's hero wrapper is corrected to the post-Task-659 production background; its (already-correct) padding is left untouched | P0 | Source diff + AC5 | Confirmed |
| R5 | `docs/agent-contract.md` cl. 3, 5 | Every existing behavior of `HeroSearchClient` is preserved: same `ssr:false` dynamic import, same `HeroSearch` module + named export, same public component name/signature, same mount position in `page.tsx` | P0 | AC6 + `page.tsx` unchanged | Confirmed |
| R6 | `scripts/check-stories-rendered.mjs:118+` | The new story is registered in `ASSERT_STORIES` with a working anchor and produces real rendered-proof cells | P0 | `npm run screenshots:assert` (AC7) | Confirmed |
| R7 | `docs/qa-profiles.md` Q3 | Full Q3 visual evidence: 14-width canon × 4 locales, `uk@320` mandatory | P0 | §13 verification plan (AC8) | Confirmed |
| R8 | `docs/agent-contract.md` cl. 9 | Final `npm run build` exits 0; no required gate left unrun or failing | P0 | AC9 | Confirmed |
| R9 | `docs/agent-contract.md` cl. 14 | Touched text files stay UTF-8 no-BOM, mojibake-free | P1 | AC10 | Confirmed |
| R10 | §3.2, `docs/qa-profiles.md` | If measured geometry parity cannot be met with existing Mantine/design tokens, the task **stops** rather than inventing a local value | P0 | AC4 escalation branch | Confirmed |

---

## 5. Assumptions and open questions

**Assumptions (stated, not verified — executor must confirm or escalate):**

- **A1.** The `Mantine/Primitives/HeroSearch` story renders `HeroSearchView` with a deterministic 2-item fixture
  location list and `activeFiltersCount={2}`. Real production data can produce a *longer* property-type or location
  label, which could change the wrap point and therefore the real height. The measurement in §13.3 is therefore a
  **fixture-relative** parity proof, not an all-content proof. State this limitation in the completion report; do
  not overclaim.
- ~~**A2.**~~ **Resolved during design, no longer an assumption:** `.screenshots/` is the established harness output
  root (`scripts/task668-qa-grid-1440.mjs` writes `.screenshots/task668/baseline.json`) and it **is** git-ignored —
  `.gitignore:54–55` (`# Responsive screenshots — generated locally, never committed` / `/.screenshots/`). Write the
  baseline to `.screenshots/task670/`; it will not appear in `git status` and must not be committed.

**Open questions — none blocking.** The one decision that could block (R10 / AC4 escalation) is handled by an
explicit stop condition rather than by pre-authorizing a guess. `A2` was resolved at design time and is retained
above only so the reviewer can see it was checked rather than dropped.

**Explicitly NOT assumed:** that `76px` is correct, that it is incorrect, or that the delta is large enough to be
user-visible. All three are outputs of AC3, not inputs.

---

## 6. Pre-read rule bundle

Read exactly these, in this order. Do not read the full `docs/` tree.

**Always required**

1. `docs/agent-contract.md` — pay particular attention to clauses 3, 5, 9, 12, 13, 14, 16, 16b, 16c.
2. `docs/rule-index.md`
3. `docs/qa-profiles.md` — Q3 row + viewport policy.
4. `docs/backlog.md` — current state; Task 670's row under "Open — needs action".
5. `docs/critical-flow-registry.md` — **scan only**, to confirm §3.7's finding independently.

**Current Mantine UI path**

6. `docs/mantine-responsive-design-system.md`
7. `docs/tailadmin-style-reference.md`
8. `docs/component-rules.md` — container/presentational split, no-duplicate, i18n.
9. `docs/ui-rules.md` — routing and legacy-boundary notes only.
10. `docs/qa-rules.md`

**Storybook / visual proof**

11. `docs/storybook-governance.md` — §15 (manifest enrolment) is load-bearing here.
12. `docs/storybook-visual-snapshots.md`

**Source pre-read (read before writing any code)**

13. `src/components/shared/HeroSearchClient.tsx`
14. `src/components/shared/HeroSearchView.tsx`
15. `src/app/[locale]/page.tsx` (hero band, lines 24–40)
16. `src/modules/listings/components/FeaturedListingsView.tsx` (lines 1–25 — the `Skeleton` precedent)
17. `src/stories/mantine/primitives/HeroSearch.stories.tsx`
18. `scripts/task668-qa-grid-1440.mjs` (lines 1–60 — the two-mode harness contract)
19. `scripts/check-stories-rendered.mjs` (lines 84–150 for viewports + `ASSERT_STORIES`; 400–420 for the
    `HeroSearch` band-700 special case)
20. `scripts/check-story-coverage.mjs` (lines 1–60)

---

## 7. Scope

Exactly these paths may be created or modified:

| Path | Action | Why |
|---|---|---|
| `src/components/shared/HeroSearchFallback.tsx` | **create** | Presentational, prop-free (or defaults-only) Mantine fallback. Separately importable so a canonical story can render it deterministically (R2) — `HeroSearchClient` itself cannot be story-rendered in its loading branch. |
| `src/components/shared/HeroSearchClient.tsx` | modify | `loading:` returns `<HeroSearchFallback />`. Everything else byte-identical. |
| `src/stories/mantine/primitives/HeroSearch.stories.tsx` | modify | Add a `Fallback` story that statically imports `HeroSearchFallback`; correct the diverged hero wrapper background (R4/§3.5). |
| `scripts/mantine-migration-scope.json` | modify | Add `src/components/shared/HeroSearchFallback.tsx` (append; do not reorder or remove existing entries). |
| `scripts/check-stories-rendered.mjs` | modify | Register the new story in `ASSERT_STORIES` with an anchor. **Additive registration only** — no change to viewport sets, assertion logic, or any existing entry. |
| `scripts/task670-qa-hero-fallback-geometry.mjs` | **create** | The `--baseline`/`--verify` measurement harness (§13.3). |
| `docs/backlog.md` | modify | Concise current-state row only (≤4 lines), per cl. 10. |
| `docs/sessions/2026-07-27-task670-hero-fallback-mantine-geometry.md` | **create** | Session log with a `Files Changed` table matching the real diff. |

---

## 8. Out of scope

- **`src/app/[locale]/page.tsx`** — the hero band is already Mantine (Task 659). Do not touch it. If parity appears
  to require a page-level change, stop and report (AC4 escalation).
- **Removing `ssr:false`.** Server-rendering the real `HeroSearch` would change hydration, bundle, and console-error
  surface, and is a separate owner decision. Preserve `ssr:false` exactly (R5).
- **`FiltersPanel`** (Task 671), **`PopularLocationsView`** (669), **`MobileBottomNav`** (672),
  **`HeaderView`/`FooterView`** (673), the Sonner `Toaster`. Do not touch them even though `HeroSearchView` renders
  `FiltersPanel` as a sibling.
- **`HeroSearchView.tsx` itself.** It is already migrated and enrolled. This task **measures** it; it must not
  change it. Any diff to this file is a scope violation — except that if measurement proves parity is impossible
  without changing it, that is the AC4 stop condition, not a licence.
- **LCP work.** Per §3.8 the hero `Title` owns LCP, not the search bar. Do not run or tune `profile:lcp*`.
- **OQ3** (`MantineHomeSection` 1536px band-padding step vs the 1440px grid step, recorded in the backlog by Task
  668). Unrelated band; leave it.
- **The `.git/index.lock` condition reported with this kickoff.** Owner-side, not executor-side.

---

## 9. Current and required behavior

### Current behavior to preserve

1. `HeroSearchClient` is a `'use client'` module exporting `HeroSearchClient`, rendered once by
   `src/app/[locale]/page.tsx:38`.
2. It loads `@/components/shared/HeroSearch` via `next/dynamic` with `ssr:false`, mapping the named export
   `HeroSearch` to `default`.
3. Until that chunk resolves, a placeholder occupies the hero slot: full width, capped at `max-w-3xl` (48rem),
   horizontally centred, translucent, with a pulse animation.
4. After resolution, the real `HeroSearchView` replaces the placeholder in the same slot.
5. The placeholder contains **no text** and no interactive control. It is not focusable and announces nothing.

### Required after behavior

1. Items 1, 2, 4 and 5 above: **unchanged**.
2. Item 3 is produced by `<HeroSearchFallback />` built from `@mantine/core` primitives (`Box`/`Skeleton`, per the
   §3.6 precedent), preserving the full-width / `max-w-3xl` cap / centred / translucent / animated reading.
3. The fallback's rendered height at each measured cell equals the real `HeroSearchView` height at that same cell,
   within the AC4 tolerance, replacing the single flat `76px`.
4. `HeroSearchFallback` is enrolled in the migration manifest and proven by a canonical story that statically
   imports it.
5. The `Mantine/Primitives/HeroSearch` story renders the post-Task-659 solid-coral hero background.

---

## 10. Implementation requirements

**I1 — Extract, then migrate.** Create `HeroSearchFallback.tsx` as a `'use client'` presentational component with
no hooks, no data fetching, and no required props (the Task 568 / Task 665 presentational contract). `HeroSearchClient`
imports it statically and returns it from `loading:`.

**I2 — Mantine primitives only.** Compose from `@mantine/core`. Zero raw `<div>`/`<span>`. The width cap, centring
and radius must come from Mantine props or CSS variables, not from Tailwind utility classes — with the single
exception in I3.

**I3 — Canonical UI decision record** (mandatory artifact, `docs/orchestrator-ui-task-design.md`):

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Pulsing placeholder block | `grep -rn "Skeleton" --include=*.tsx src/`; inspected `FeaturedListingsView.tsx:12–25`, and `src/design-system/mantine/patterns/` (35 entries, **zero** matching `*Skel*` — no skeleton pattern exists to extend) | `Skeleton` from `@mantine/core`, as composed in `FeaturedListingsView` `CardSkeleton` (Task 657/665) | **reuse** | `@mantine/core` `Skeleton`; new consumer registered via the `Fallback` story + `mantine-migration-scope.json` |
| Wrapper box (full width, `max-w-3xl` cap, centred) | inspected `HeroSearchView.tsx:49` (`Box className="hero-search w-full max-w-3xl mx-auto"`) and `page.tsx:29` (`Box maw={768} mx="auto"`) | Mantine `Box` with `maw`/`mx` props — **already used for this exact cap one element above the mount point** | **reuse** | Mantine style props. `max-w-3xl` = 48rem = **768px**; use `maw={768}` per the `page.tsx:29` precedent, and prove equality by computed style in the harness rather than by assertion |
| Corner radius | `HeroSearchView.tsx:94` uses `rounded-b-[var(--mantine-radius-lg)]`; the current fallback uses `rounded-2xl` | `var(--mantine-radius-lg)` (theme.ts, 8px) | **extend** | Match the real bar's radius token, not the legacy shadcn `rounded-2xl`. If the visual reading changes materially, record it in the completion report |
| Translucent fill | current fallback `bg-background/10` | — | **decide by measurement** | If no Mantine/TailAdmin token reproduces the current translucency over the solid-coral hero, **stop: `BLOCKED — CANONICAL STYLE DECISION REQUIRED`**. Do not guess an opacity |

**I4 — Height must be measured, not chosen.** Implement `HeroSearchFallback` so its height is expressed through
Mantine responsive props keyed to the project's existing breakpoints. Populate those values **from the AC3 baseline
run**, not from reading the source and estimating. The sequence is mandatory and non-negotiable:

1. Write the harness. Run `--baseline` **against the unmodified tree**; it must exit 0 and record, per cell:
   the real `HeroSearchView` height, and the current fallback's height.
2. Only then write `HeroSearchFallback` using those recorded numbers.
3. Run `--verify` and diff.

Recording the baseline *after* changing the component invalidates the entire proof. If step 1 is run out of order,
restart it from a clean tree.

**I5 — Story work (clause 16c).** In `HeroSearch.stories.tsx`: add `export const Fallback` that statically imports
and renders `HeroSearchFallback` inside the same `MantineStoryShell` + hero wrapper as `Default`, so the two are
measured under identical conditions. Correct the wrapper background on **both** stories to the production
solid-coral (`page.tsx:26`), and update the now-false "Same hero wrapper classes as `src/app/[locale]/page.tsx`"
comment (lines 49–51) to state what it actually mirrors. **Do not change the wrapper padding** (§3.5 — already
identical).

**I6 — Anchor for the rendered sweep.** Give the fallback's root a stable `data-testid` and register the story in
`ASSERT_STORIES` using a `{ type: 'testid', … }` anchor (the shape used at
`scripts/check-stories-rendered.mjs:128`). Additive only.

**I7 — No new user-facing strings.** The fallback has no text (§9 item 5) and must not gain any. `check:i18n`
parity counts must be unchanged. If accessibility review suggests an `aria-label`, that is a **localized string** —
stop and report rather than hardcoding English.

**I8 — Preserve the token allowlist honestly.** The current `design-tokens-allow: h-[76px]` comment exists only for
the value being removed. Remove that allowlist comment along with the value. If `check:design-tokens` then demands a
new allowlist entry, that is a signal the new implementation is not token-clean — fix the implementation, do not
add an entry.

---

## 11. Positive and negative flows

### Positive flow

Cold load of `/{locale}` (any of `sq`/`en`/`uk`/`it`), JS enabled, `HeroSearch` chunk not yet cached:

1. Server HTML ships the hero band with `HeroSearchFallback` in the search slot.
2. First paint shows a Mantine skeleton occupying the measured height for the current viewport width.
3. The `HeroSearch` chunk resolves; `HeroSearchView` mounts in the same slot.
4. Content below the hero (`Featured` band) does **not** move vertically at the swap, within the AC4 tolerance.
5. All four controls are interactive; search navigates to `/{locale}/listings?…` exactly as before.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | The fallback accepts no input and has no form schema | N/A | — |
| Authorization / RLS | **No** | Public route, no data access in the fallback (`HeroSearchClient` performs no query; `useLocations` lives in the `HeroSearch` container) | N/A | — |
| Offline / network — chunk never resolves | **Yes** | `next/dynamic` existing behavior | Fallback remains visible indefinitely at its measured height; no crash, no collapse to `0px`, no error boundary | Manual: throttle to offline in devtools after first paint, confirm the block persists at full height |
| Slow network — long fallback dwell | **Yes** | Same | The fallback is visible long enough to be read as intentional loading chrome, not as a broken empty band | Manual at `uk@320` and `1440`, CPU/network throttled |
| Concurrent writer | **No** | No mutable data | N/A | — |
| JS disabled | **Yes** | `ssr:false` — pre-existing behavior | The fallback is the **permanent** rendered state; the search bar is never interactive. This is unchanged from today and is **not** fixed by this task | State explicitly in the completion report as a preserved pre-existing limitation |
| Hydration mismatch | **Yes** | `docs/performance.md`; existing `check:hydration` gate | Zero new hydration console errors on `/en`, `/sq`, `/uk` | `npm run check:hydration` (§13.4) |
| RTL | **No** | Project locales are `sq`/`en`/`uk`/`it` — none RTL | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* `src/components/shared/HeroSearchFallback.tsx` and the modified `HeroSearchClient.tsx`,
  *when* both are inspected, *then* neither contains a raw `<div>` or `<span>`; `HeroSearchFallback` imports from
  `@mantine/core`; and no Tailwind layout/spacing/color utility class remains on the fallback markup. Evidence: the
  real diff plus `grep -c 'className=' src/components/shared/HeroSearchFallback.tsx src/components/shared/HeroSearchClient.tsx`.

- **AC2 [R2]** — *Given* `HeroSearchFallback.tsx` appended to `scripts/mantine-migration-scope.json`, *when*
  `npm run check:story-coverage` runs, *then* it exits 0 and reports **11/11** (10 today + this one), with the new
  component shown as covered by a canonical `Mantine/Primitives/*` story. A pass with an unchanged 10/10 count
  means enrolment did not happen — that is a FAIL.

- **AC3 [R3]** — *Given* the **unmodified** tree, *when* `node scripts/task670-qa-hero-fallback-geometry.mjs --baseline`
  runs, *then* it exits 0 and writes a baseline recording, for every cell in the AC8 matrix, the real
  `HeroSearchView` rendered height and the current fallback rendered height, plus their signed delta. It asserts no
  expected values. The resulting **before-state delta table is reproduced verbatim in the session log** — this is
  the first factual answer to whether `76px` was ever right.

- **AC4 [R3, R10]** — *Given* the implemented `HeroSearchFallback`, *when*
  `node scripts/task670-qa-hero-fallback-geometry.mjs --verify` runs, *then* for every cell
  `|fallbackHeight − realHeight| ≤ 1px`, **and** that absolute delta is ≤ the same cell's baseline delta at every
  cell (no cell is made worse). If any cell cannot reach ≤ 1px using existing Mantine breakpoints and tokens, the
  executor **stops** and returns `BLOCKED — CANONICAL STYLE DECISION REQUIRED`, attaching the full measured table
  and the specific cells that fail. Inventing a bespoke breakpoint, a magic pixel constant, or a new allowlist
  entry to force this green is an explicit failure of the task.
  *(1px, not 0px: sub-pixel rounding across locale-dependent font metrics is expected and is not a defect.)*

- **AC5 [R4]** — *Given* `HeroSearch.stories.tsx`, *when* inspected, *then* the hero wrapper renders the
  production solid-coral background rather than the pre-659 gradient; the wrapper padding is **unchanged**
  (`py-16 md:py-24`); and the stale "Same hero wrapper classes" comment is corrected. Evidence: diff, plus a
  rendered capture of `Mantine/Primitives/HeroSearch/Default` showing the solid background.

- **AC6 [R5]** — *Given* the modified `HeroSearchClient.tsx`, *when* diffed, *then* the `dynamic()` call retains
  `ssr:false`, the same import specifier and the same `m.HeroSearch → default` mapping; the exported component name
  and signature are unchanged; and `src/app/[locale]/page.tsx` has **zero** diff lines. Evidence:
  `git diff --stat` showing `page.tsx` absent, plus the file diff.

- **AC7 [R6]** — *Given* the new story registered in `ASSERT_STORIES`, *when* `npm run screenshots:assert` runs,
  *then* the run exits with **no new FAIL** attributable to this task's stories, and the new story contributes
  real (non-zero) cells with its anchor resolving. Report total PASS/FAIL/AMBIGUOUS before and after; the totals
  must differ only by this task's added cells.

- **AC8 [R7]** — *Given* Q3, *when* rendered evidence is captured, *then* it covers the canonical 14 widths
  (`320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560`) × all four locales, **plus** the
  `HeroSearch` `band-700` cell already defined at `scripts/check-stories-rendered.mjs:414`, with `uk@320`
  explicitly present. TailAdmin side-by-side evidence is required for the skeleton's fill/radius reading.

- **AC9 [R8]** — *Given* the completed change, *when* `npm run build` runs, *then* it exits 0, and the transcript
  is fresh (post-change), not carried over.

- **AC10 [R9]** — *Given* every touched text file, *when* `npm run check:file-integrity` and
  `npm run check:mojibake` run, *then* both exit 0.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`.**

Justification against `docs/qa-profiles.md`: the change creates a **new Mantine component**, adds a **canonical
Storybook story with governance registration**, alters the **homepage first-paint page shell**, and changes
**responsive geometry**. Four separate Q3 triggers. It is not a logic-only change to a UI file, so the Q2
de-escalation clause does not apply.

### 13.2 Order of operations (mandatory)

1. `git status --short` — record a clean pre-write snapshot. **See §15 note on `.git/index.lock`.**
2. Build Storybook once: `npm run build-storybook`.
3. Write `scripts/task670-qa-hero-fallback-geometry.mjs`.
4. `node scripts/task670-qa-hero-fallback-geometry.mjs --baseline` → must exit 0 **against the unmodified
   component tree**. Preserve the output.
5. Implement `HeroSearchFallback.tsx` + `HeroSearchClient.tsx` using the baseline numbers.
6. Story + manifest + `ASSERT_STORIES` work.
7. Rebuild Storybook; `--verify`; then the full gate list in §13.4.

### 13.3 The measurement harness

`scripts/task670-qa-hero-fallback-geometry.mjs`, modelled on `scripts/task668-qa-grid-1440.mjs:1–33`:

- **Two modes**, `--baseline` (writes `.screenshots/task670/baseline.json`, asserts nothing about expected values,
  fails only on infrastructure problems) and `--verify` (default; asserts AC4 and diffs against the baseline).
- **Cells:** the AC8 matrix (14 widths + `band-700`) × `sq`/`en`/`uk`/`it`.
- **Two subjects per cell:** `Mantine/Primitives/HeroSearch/Default` (the real view) and
  `Mantine/Primitives/HeroSearch/Fallback` (the placeholder), rendered in the identical wrapper.
- **Locator:** must work on the pre-change tree too, where the fallback is a raw Tailwind `<div>` with no testid.
  Use a mechanism-agnostic locator — within `#storybook-root`, the hero content block's bounding rect — rather than
  a class or testid that only exists after the change. State the chosen predicate in the harness header comment,
  as `task668-qa-grid-1440.mjs:24–27` does.
- **Recorded per cell:** `realHeight`, `fallbackHeight`, `delta`, `baselineDelta`, `pass`.
- **Failure behavior:** any missing baseline row sets `pass = false`. *(This is the exact defect that required
  Task 668's revision-7 F3 fix — a missing-baseline branch that silently passed. Do not reproduce it.)*
- **Anti-no-op proof:** demonstrate the harness can fail — plant a deliberate wrong height, show `--verify` exits
  non-zero and names the affected cells, then revert and show the plant is absent from the final `git status`.

### 13.4 Gates (all must be run; report actual exit codes)

| Command | Expected | Purpose |
|---|---|---|
| `npm run typecheck` | 0 | AC1 baseline |
| `npm run check:stories` | 0 | Story validity |
| `npm run check:story-coverage` | 0, **11/11** | AC2 |
| `npm run build-storybook` | 0 | Prereq for rendered proof |
| `node scripts/task670-qa-hero-fallback-geometry.mjs --baseline` | 0, pre-change | AC3 |
| `node scripts/task670-qa-hero-fallback-geometry.mjs --verify` | 0, post-change | AC4 |
| `npm run screenshots:assert` | no new FAIL vs. recorded baseline | AC7, AC8 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL before **and** after | Mantine-scope regression |
| `npm run governance:screenshots` | 0 | Screenshot governance |
| `npm run governance:components` | 0 | Catalog governance |
| `npm run check:design-tokens` | 0, **no new allowlist entry** | I8 |
| `npm run check:locale-leak -- --mantine-only` | no new leak vs. baseline | Locale hygiene |
| `npm run check:i18n` | 0, key counts **unchanged** | I7 |
| `npm run check:hydration` | 0 on `/en`, `/sq`, `/uk` | Hydration branch (§11) |
| `npm run check:file-integrity` | 0 | AC10 |
| `npm run check:mojibake` | 0 | AC10 |
| `npm run build` | **0 — hard gate** | AC9, cl. 9 |

For `screenshots:assert`, `--mantine-only` and `check:locale-leak`, record the **before** numbers first; a bare
"passes" without a before/after delta is not acceptable evidence.

### 13.5 Manual steps

- Offline / slow-network dwell checks per the §11 applicability table, at `uk@320` and `1440`.
- TailAdmin side-by-side for the skeleton fill and radius (AC8).

---

## 14. Completion report contract

The session log at `docs/sessions/2026-07-27-task670-hero-fallback-mantine-geometry.md` must contain:

1. **Files Changed** table matching the real `git diff` exactly — path, action, one-line reason.
2. **Requirement IDs completed** (R1–R10), each mapped to the AC and the evidence that closed it.
3. **Commands run**, each with its **actual** exit code and the salient output. Not "all pass".
4. **The AC3 before-state delta table, verbatim** — the measured answer to whether `76px` was correct — and the
   AC4 after-state table beside it.
5. **The anti-no-op planted-failure proof** for the harness (§13.3), including the revert confirmation.
6. **`screenshots:assert` before/after totals** (PASS / FAIL / AMBIGUOUS) with the delta explained cell by cell.
7. **Assumptions A1–A2**, confirmed or corrected.
8. **Deviations** from this kickoff, each with its reason.
9. **Limitations**, explicitly including: the JS-disabled state is unchanged and still non-interactive; the parity
   proof is fixture-relative (A1).
10. **Unresolved issues** and anything discovered but out of scope.

Backlog: add a **concise** current-state entry (≤ 4 lines) under "Last Session". Do not paste the session detail
into `docs/backlog.md`; if the 80-line limit would be breached, raise `BACKLOG LIMIT BREACH` instead of trimming
another task's row.

**Status vocabulary.** Terminal status is `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or
`BLOCKED`. Sonnet does not self-approve. Sonnet does not run, emit, suggest, or delegate any mutating git command,
including any form of `git push`.

**Handoff:** execute from this saved path — `tasks/kickoff_prompt_Task_670_HeroSearch_SSR_Fallback_Mantine_Geometry.md`
— under `.claude/skills/execute-task/SKILL.md`.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, command and precedent is named inline |
| Every primary requirement has ≥1 binary AC and ≥1 verification method | **Yes** — R1–R10 → AC1–AC10 |
| Scope names what must not change | **Yes** — §8; `page.tsx` and `HeroSearchView.tsx` explicitly frozen, with AC6 asserting a zero-line diff on `page.tsx` |
| Current/legacy boundary explicit | **Yes** — §1; `FiltersPanel` named as the adjacent legacy surface and excluded |
| QA profile + source map + canonical decision record present | **Yes** — §13.1, §3.2, §10 I3 |
| Negative flows selected by applicability, not copied | **Yes** — §11; 5 of 9 branches marked `No` with a stated owner/reason |
| No uninspected claim about a command, file, test, story, or behavior | **Yes** — every command verified against `package.json` lines 20–80; every line number read this session |
| Owner-only exceptions traceable | **N/A** — this task authorizes none. Task 668's owner-approved 1440 breakpoint decision is referenced only as history |
| Gates prove the changed behavior, not merely procedural | **Yes** — AC3/AC4 are measurements with a mandatory stop condition, plus a planted-failure proof |
| Single active owner route | **Yes** — one route; the only fork is the AC4 `BLOCKED` stop |
| Every checkpoint names producer, output, comparator, failure behavior | **Yes** — §13.3 |
| Dirty-worktree handling | **N/A for content** — worktree was clean at design time (`git status --short` empty). **But see the `.git/index.lock` note below**; step 13.2.1 requires the executor to re-snapshot before writing |
| Baselines account for task-created artifacts | **Yes** — AC3 must run pre-change; §13.2 fixes the ordering and I4 requires a restart if violated |
| Assumptions visible to executor and reviewer | **Yes** — §5 A1–A2, plus the explicit "not assumed" clause |

**`.git/index.lock` — GIT WRITE BLOCKED at design time.** A zero-byte `.git/index.lock` is present in the working
tree. Read-only `git status` reports `warning: unable to unlink … Operation not permitted`, and the agent sandbox
cannot remove it. Per `docs/orchestrator-procedures.md:277–280`, the lock could not be confirmed cleared, so **no
commit handoff is emitted with this kickoff.** Owner action required first — see the response accompanying this
file.

**Backlog inconsistency found during design (not fixed here).** `docs/backlog.md` states "Next free: **674**", but
`tasks/kickoff_prompt_Task_674_mojibake_gate_scripts_coverage.md` and `tasks/task674-preflight-ledger-and-contract.md`
are both tracked and committed (`ebfbb07c4 fix(Task674): scan scripts/ in check:mojibake; allowlist the detector`).
**674 is used; next free is 675.** Task 670 itself remains correctly reserved and unused. Flagged for orchestrator
reconciliation; deliberately not corrected inside this kickoff, since editing the backlog is the executor's
clause-10 step and an unrelated numbering fix does not belong in this diff.
