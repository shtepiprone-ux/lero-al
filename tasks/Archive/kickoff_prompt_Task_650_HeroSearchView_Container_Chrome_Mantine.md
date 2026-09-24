# Task 650 — Migrate the remaining container chrome in `HeroSearchView.tsx` (the wrapper/tab-strip/search-bar-surface/inner-row `<div>`s) from raw Tailwind to Mantine `Box`/`Paper`, preserving the look and leaving the already-Mantine controls (tabs, Comboboxes, CountButton, Search button) untouched

- **Task number:** 650
- **Epic:** MM — Mantine/TailAdmin Restyle (homepage completion; **block D — HeroSearch container chrome**). NOTE: the earlier "Phase-2 blocked" assessment was stale — `HeroSearchView`'s Combobox consumers (`PropertyTypeCombobox`/`LocationCombobox`) are already on `MantineCombobox`, so no blocker remains; only the container `<div>` chrome is still raw Tailwind.
- **Parent / origin:** Homepage Mantine-migration completion. Audit + code inspection (2026-07-20) found `HeroSearchView` is ~95% Mantine already: `Button` (tabs + Search), `MantineCountButton` (filters), `PropertyTypeCombobox` + `LocationCombobox` (both `MantineCombobox`), zero legacy `@/components/ui/*`. The only remaining raw-Tailwind pieces are the four layout container `<div>`s. Owner directive (2026-07-20): migrate the container chrome to `Box`/`Paper`, **keep the look**, leave the tab toggle as the existing styled Mantine `Button` (do NOT convert to `SegmentedControl` — that would change the visual).

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine chrome migration in one `'use client'` component — swap the four container `<div>`s for Mantine `Box`/`Paper`, preserving every layout/visual class. No control, behavior, prop, or i18n change. Visual target = **preserve the look exactly** (owner).
- **Build gate (governance `67340ff49`):** this non-Q0 task MUST include a final `npm run build` with exit 0.

## Objective

In `src/components/shared/HeroSearchView.tsx`, replace the raw-Tailwind container `<div>`s with Mantine primitives — the generic wrappers with `Box`, and the search-bar surface with `Paper` — keeping all existing `className`s (layout, background, border, shadow, radius, flex behavior) so the rendered hero search bar is pixel-identical. Do not touch the tab `Button`s, `PropertyTypeCombobox`, `LocationCombobox`, `MantineCountButton`, the Search `Button`, `FiltersPanel`, or any prop/handler.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 649 landed). `HeroSearchView` is a pure presentational `'use client'` component (Task 568). Already-Mantine controls (KEEP UNTOUCHED): the two listing-type `Button unstyled` tabs, `PropertyTypeCombobox`, `LocationCombobox`, `MantineCountButton`, the Search `Button variant="filled"`, `FiltersPanel`.

### The four container `<div>`s to migrate (verbatim)

```tsx
<div className="hero-search w-full max-w-3xl mx-auto">                                  {/* (1) outer wrapper */}
  <div className="flex mb-0">                                                          {/* (2) tab strip */}
    { …two Button tabs… }
  </div>
  <div className="bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3">  {/* (3) search-bar surface */}
    <div className="flex flex-wrap md:flex-nowrap gap-2">                               {/* (4) inner control row */}
      { …PropertyTypeCombobox, LocationCombobox, MantineCountButton, Search Button… }
    </div>
  </div>
</div>
```

### Mapping (preserve every class; `Box`/`Paper` render a `div` and accept `className`)

| # | Current | Mantine | Note |
|---|---|---|---|
| (1) outer wrapper | `<div className="hero-search w-full max-w-3xl mx-auto">` | `<Box className="hero-search w-full max-w-3xl mx-auto">` | generic wrapper → `Box`; class kept verbatim (incl. the `hero-search` hook used by `HeroSearchClient`'s skeleton sizing) |
| (2) tab strip | `<div className="flex mb-0">` | `<Box className="flex mb-0">` | generic flex row → `Box`; class kept |
| (3) search-bar surface | `<div className="bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3">` | `<Paper className="bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3">` | semantic surface → `Paper`; **keep all classes as-is** (bg/asymmetric-radius/border/shadow/padding) — do NOT substitute `withBorder`/`shadow="xl"`/`radius`/`p` Mantine props unless each is independently verified to render the identical value (Tailwind `shadow-xl` ≠ Mantine `shadow="xl"`; the radius is asymmetric with no uniform-`radius` equivalent; `border`=`border-border`). Safest: `Paper` with the classes verbatim, so it is a semantic surface with zero pixel change |
| (4) inner control row | `<div className="flex flex-wrap md:flex-nowrap gap-2">` | `<Box className="flex flex-wrap md:flex-nowrap gap-2">` | generic flex-wrap → `Box`; class kept (the Task-572 flex-basis behavior lives on the children, unaffected) |

- Add `Box, Paper` to the existing `@mantine/core` import (which already imports `Button`).
- **Do not** change any child control, prop, handler, comment-documented class on the tabs/controls, or the `FiltersPanel` block.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Chrome swap | The four container `<div>`s become `Box` (1,2,4) / `Paper` (3), with every existing `className` preserved verbatim; `Box, Paper` added to the `@mantine/core` import | P0 | `git diff`; rendered hero | Confirmed |
| R2 | Preserve look | The rendered hero search bar is pixel-identical to before (wrapper width/centering, tab strip, search-bar bg/border/shadow/asymmetric radius/padding, inner control wrapping across breakpoints) | P0 | Rendered `/{locale}` hero before/after incl. uk@320 + the sm 640–767 wrap band | Confirmed |
| R3 | Controls untouched | The tab `Button`s, `PropertyTypeCombobox`, `LocationCombobox`, `MantineCountButton`, Search `Button`, `FiltersPanel`, and every prop/handler/child class are unchanged | P0 | `git diff` shows only the four container elements + the import line | Confirmed |
| R4 | Behavior parity | Search, listing-type toggle, property/location select, filters open/count, Enter-to-search, and the `hero-search` skeleton hook all behave exactly as before | P0 | `git diff`; rendered interaction; `hero-search` class preserved | Confirmed |
| R5 | Isolation | No i18n, `theme.ts`, `HeroSearch.tsx` (container), or other-file change | P0 | `git diff` scope | Confirmed |
| R6 | Gates + build | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` green AND `npm run build` exits 0; no i18n key change | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Preserve classes verbatim, do NOT re-tokenize** the surface's bg/shadow/radius/border into Mantine `Paper` props — Tailwind `shadow-xl`/asymmetric radius/`border-border` have no exact uniform-prop equivalent, and the owner chose preserve-the-look. `Box`/`Paper` are the primitives; the classes stay. (If the executor verifies a specific prop renders byte-identical, it may use it, but the default is class-verbatim.)
- **Tabs stay as the styled Mantine `Button`** — no `SegmentedControl` (owner decision; that would change the look). Do not touch the tab block.
- **`hero-search` class must stay** on wrapper (1) — `HeroSearchClient.tsx`'s loading skeleton and any CSS hook depend on it.
- **`HeroSearch.tsx` (the container) is not touched** — only `HeroSearchView.tsx`.
- **No `'use client'` change** — the file already has it.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 7 i18n, 9 validation + **mandatory build**, 11 mobile, 12 rendered evidence, 14 file integrity, 16 TailAdmin).
- `docs/rule-index.md` (current-Mantine chrome migration).
- `docs/qa-profiles.md` (Q3 visual — live homepage hero) + viewport policy (note the sm 640–767 wrap band, Tasks 570/572/573).
- `docs/mantine-responsive-design-system.md` (Box/Paper), `docs/component-rules.md`.
- Source: `src/components/shared/HeroSearchView.tsx` (target), `src/components/shared/HeroSearch.tsx` (container, unchanged, context), `src/components/shared/HeroSearchClient.tsx` (the `hero-search`/skeleton hook, context), `src/components/layout/FooterView.tsx` (Box-with-className precedent).

## Scope

1. In `HeroSearchView.tsx`: add `Box, Paper` to the `@mantine/core` import; convert container `<div>` (1)/(2)/(4) → `Box` and (3) → `Paper`, preserving all classes; leave every control/prop/child untouched.
2. Produce the Q3 rendered proof on the real `/{locale}` hero (before/after parity, viewports incl. uk@320 and the sm 640–767 wrap band, four locales) **and the `npm run build` exit-0 transcript**.
3. Write the session log + a concise `docs/backlog.md` entry; note this completes the homepage Mantine chrome migration (HeroSearch container chrome done; tab toggle intentionally kept as styled Button; `SegmentedControl` conversion explicitly not done). Keep ≤80 lines (consolidate first if needed).

## Out of scope

- The tab toggle → `SegmentedControl` (owner deferred/declined — look change).
- The controls (`PropertyTypeCombobox`/`LocationCombobox`/`MantineCountButton`/Search `Button`/tabs), `FiltersPanel`, `HeroSearch.tsx`, i18n, `theme.ts`.
- Re-tokenizing the surface bg/shadow/radius into Mantine props (kept as class, preserve-look).

## Current and required behavior

- **Current:** `HeroSearchView`'s controls are Mantine, but the four container `<div>`s are raw Tailwind.
- **Required after:** those containers are Mantine `Box`/`Paper` with identical classes; the hero looks and behaves exactly the same; controls/props/`FiltersPanel`/`HeroSearch.tsx` unchanged.

## Positive and negative flows

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Hero renders (desktop) | **Yes** | R1/R2 | wrapper/tabs/surface/controls identical to legacy | Rendered `/en` desktop |
| Mobile uk@320 | **Yes** | R2 | full-width tabs, squared top corners, no overflow, identical | Rendered uk@320 |
| sm 640–767 wrap band | **Yes** | R2 | Search wraps to row 2, Location regains width (Task 572) — unchanged | Rendered ~720px |
| Search / toggle / select / filters / Enter | **Yes (regression)** | R4 | all behave as before | Rendered interaction |
| `hero-search` skeleton hook | **Yes** | R4 | class preserved → `HeroSearchClient` skeleton sizing intact | `git diff` |
| Production build | **Yes** | R6 | `npm run build` exits 0 | Build transcript |
| i18n key change | No | reuse existing keys | `check:i18n` unchanged |

## Acceptance criteria

- `AC1 [R1]` Given the diff, then containers (1)/(2)/(4) are `Box` and (3) is `Paper`, all classes preserved, `Box, Paper` imported; no other element changed.
- `AC2 [R2]` Given the rendered `/{locale}` hero at viewports incl. uk@320 and the sm 640–767 band × four locales, then it is visually identical to the pre-swap legacy render.
- `AC3 [R3,R4]` Given the diff, then all controls/props/handlers/child classes and `FiltersPanel`/`HeroSearch.tsx` are unchanged, and search/toggle/select/filters/Enter/skeleton-hook behave identically.
- `AC4 [R5,R6]` Given the repo, then no i18n/`theme.ts`/other-file change, and typecheck + check:stories + check:i18n + check:mojibake + `npm run build` all exit 0.

## QA profile and verification plan

**Profile: Q3 Visual (live homepage hero) + mandatory build gate.** Evidence:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity.
4. `npm run check:mojibake` → 0 artifacts.
5. `npm run build` → **exit 0** (mandatory; capture transcript).
6. **Rendered proof (real `/{locale}` hero):** capture the hero search bar before (legacy `HEAD`) and after at the mandated viewports incl. `uk@320` and the sm 640–767 wrap band × four locales; confirm pixel parity (tab strip, surface bg/border/shadow/asymmetric radius/padding, control wrapping). Live-app capture path (Tasks 621/630/645/646 precedent). `HeroSearch`/`HeroSearchView` also has a Storybook story (`Mantine/Primitives/HeroSearch`) — may be used for the isolated render. If the sandbox cannot run the app, record it as missing evidence with the exact owner-native command + expected result and request owner confirmation.
7. `git status --short` / `git diff --stat` → only `HeroSearchView.tsx`, `docs/backlog.md`, and the session log. Classify any harness/other-WIP path as `EXCLUDED AS UNRELATED`.

Q3 cannot be approved without the rendered hero parity evidence (incl. uk@320 + the sm band) and the passing `npm run build`.

## Completion report contract

Write `docs/sessions/2026-07-20-task650-herosearchview-container-chrome-mantine.md` + a concise `docs/backlog.md` update. Include: a Files Changed table; R1–R6 with evidence; the before/after of the four containers; typecheck/check:stories/check:i18n/mojibake **and `npm run build`** results; the rendered `/{locale}` hero before/after parity (incl. uk@320 + sm band × four locales); explicit confirmation that all controls/props/`FiltersPanel`/`HeroSearch.tsx`/i18n/`theme.ts` are unchanged and the `hero-search` class is preserved; and a note that this completes the homepage Mantine chrome migration (tab toggle kept as styled Button; `SegmentedControl` not done). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the four containers verbatim, the `div`→`Box`/`Paper` mapping with class-verbatim preservation, the explicit "do not re-tokenize / do not touch controls / do not convert tabs to SegmentedControl / keep `hero-search` class" boundaries, and the Q3 render matrix (incl. sm band) + mandatory build gate are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the build gate is explicit. ✅
- Scope is container-chrome only; controls, tabs, `FiltersPanel`, `HeroSearch.tsx` are protected; names what must not change. ✅
- Visual target = preserve the look (classes verbatim); no i18n change. ✅
- Negative flows selected by applicability (desktop/mobile/sm-band/behavior-regression/skeleton-hook/build in; i18n-change + tab-redesign out). ✅
