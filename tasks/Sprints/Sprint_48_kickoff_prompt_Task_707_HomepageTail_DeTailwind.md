# Task 707 — Homepage tail de-Tailwind: two loading skeletons + one CTA icon, at zero rendered delta

**Sprint:** 48 (`tasks/Sprints/Sprint_48_Homepage_Tail_DeTailwind.md`). **Epic:** MM Phase-2.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI migration — **legacy-utility removal on an already-Mantine surface**
  (`docs/rule-index.md` → "UI / Layout / Component" → **Current Mantine path**).
- **Secondary type:** Storybook / visual proof — both Views are enrolled at
  `scripts/mantine-migration-scope.json:10-11`.
- **Origin:** the homepage audit that produced Sprint 47. With 673 (`FooterView`, `135e864e7`) and 706
  (`HeaderView`, `911852104`) landed, these three files are the last homepage surfaces holding raw Tailwind
  utilities outside the listing card, which Sprint 46 owns (691 → 702).

> **Read this first.** Zero rendered change (**D28**). This is a mechanism swap of **five** utility sites in total.
> Everything else in these files — every Mantine prop, every `Skeleton` dimension, both `SimpleGrid` `cols` maps,
> the `aspectRatio` inline style, both marker classes — is untouched. If you cannot reproduce a value exactly,
> **stop and report**; do not approximate and do not "improve".

---

## 2. Objective

1. Remove the **four** raw Tailwind utility `className=` sites from the two loading skeletons —
   `FeaturedListingsView.tsx:15,:17` and `LatestListingsView.tsx:13,:15` — replacing them with a colocated
   `.module.css` per file (**D28**, the Task 688 D16 pattern as executed by 673/706).
2. Replace the **one** icon utility site in `AgentCtaButton.tsx:19` (`<Building2 className="h-4 w-4" />`) with
   lucide's own `size` prop, **after measuring** that it reproduces the identical computed box — the exact
   decision Task 706 made and proved for the hamburger `<Menu>`.
3. Preserve the rendered output **byte-for-byte**: every enrolled cell of `Patterns/Mantine/HomepageListingGrids`
   (`Default` **and** `Loading`) keeps its current PNG md5 and its current verdict.
4. Keep `npm run check:homepage-grid` green — the second, independent gate on exactly these two Views.

**Non-goals stated as objectives so they are not silently attempted:** no visual value, token, spacing or typography
change; no story edit or re-title; no change to `ListingCard`, the listing-card pattern, the containers, or
`skeleton-chrome.css`; `check:design-tokens` must still read **23**.

---

## 3. Verified context

Every fact below was read or executed in the worktree on branch `task/q0-ci-rendered-locale-split` on **2026-08-03**,
at HEAD `911852104` with a clean tree. Nothing is inferred from a filename, a prior report, or a semantic-search hit.

### 3.1 Owner decisions

| ID | Ruling | Scope |
|---|---|---|
| **D28** (2026-08-01) | **Mechanism-only, zero visual delta.** Utilities → Mantine style props where a prop exists, colocated `.module.css` otherwise. No restyle, no token change. | Binds 673, 706, 707 |
| **D31** (2026-08-03, this task) | **`AgentCtaButton` is folded into 707**, not split out. Its single site is the lucide `size`-prop pattern 706 already measured. Its evidence is different in kind — no enrolled cell exists — and this task states that plainly rather than implying md5 coverage it does not have. | Binds 707 |
| **D16** (Task 688, 2026-07-29) | "Mantine style props where a prop exists; a colocated `.module.css` for everything a prop cannot express." | The mechanism D28 points at |
| **D6** (Task 684, standing) | `.screenshots/` evidence is local-only per `.gitignore:55`. Reference by path; it will not appear in `git status`. | Evidence handling |
| **D26** (`docs/storybook-governance.md` §14.11) | The rendered-matrix comparator and its sub-perceptual tolerance. **Do not invent a per-task pixel tolerance.** | AC4 comparator |

### 3.2 The three files as they stand — read at source

**`src/modules/listings/components/FeaturedListingsView.tsx`, 84 lines.** `'use client'`, prop-driven, calls only
`useTranslations('listing')`. Three branches: `loading` (`:54-63`), empty (`:65-72`), populated (`:74-83`).
`CardSkeleton` (`:13-26`) is the loading chrome, owned by the View since Task 665.

**`src/modules/listings/components/LatestListingsView.tsx`, 62 lines.** Same shape; `RowSkeleton` at `:11-23`;
branches at `:41-47` / `:49-53` / `:55-61`. It has no header `Group` (Featured does, `:45-52`).

**`src/components/shared/AgentCtaButton.tsx`, 34 lines.** `'use client'`, a Mantine `Button component={Link}` with
`leftSection`, a `styles={{root:{…}}}` object (`:22-29`) and `data-track="register"`. Used in exactly one place:
`src/app/[locale]/page.tsx`.

**All `className=` sites across the three files** (`grep -c 'className='` → 3 · 3 · 1 = **7**, of which **5** carry
Tailwind utilities):

| # | File · line | Element | Current value | Disposition |
|---:|---|---|---|---|
| 1 | `FeaturedListingsView.tsx:15` | `<Box>` (CardSkeleton root) | `rounded-xl border bg-card overflow-hidden` | → module `.skeletonCard` |
| 2 | `FeaturedListingsView.tsx:17` | `<Box>` (CardSkeleton body) | `p-3 space-y-2` | → module `.skeletonBody` |
| 3 | `FeaturedListingsView.tsx:58` | `<SimpleGrid>` (loading grid) | `featured-listings` | **marker only — no Tailwind. Preserve verbatim, do not touch this line** |
| 4 | `LatestListingsView.tsx:13` | `<Box>` (RowSkeleton root) | `flex flex-col rounded-xl border bg-card overflow-hidden` | → module `.skeletonRow` |
| 5 | `LatestListingsView.tsx:15` | `<Box>` (RowSkeleton body) | `p-3 space-y-2` | → module `.skeletonBody` |
| 6 | `LatestListingsView.tsx:43` | `<SimpleGrid>` (loading grid) | `latest-listings` | **marker only — preserve verbatim, do not touch this line** |
| 7 | `AgentCtaButton.tsx:19` | `<Building2>` (lucide SVG in `leftSection`) | `h-4 w-4` | **measure, then** `size={16}` (§5.2) |

**`space-y-2` is the one non-obvious utility.** Tailwind compiles it to a sibling selector
(`& > :not(:last-child) { margin-bottom: … }` in v4, historically `& > * + *  { margin-top: … }`) — **not** a `gap`.
Reproducing it as `gap` on a non-flex `Box` would silently do nothing. **Measure the compiled rule and the resulting
computed margins on the real children, do not translate it from memory** (§9, I2).

**What must not move:** every `<Skeleton>`'s `height`/`width` props, the `style={{ aspectRatio: '4 / 3' }}` inline
attribute on both first Skeletons, both `SimpleGrid cols`/`spacing` maps, the skeleton counts (3 for Featured,
4 for Latest), and the `Group`/`Title`/`Text`/`ViewAllLink` composition.

### 3.3 The two marker classes have zero live consumers — census, not assumption

`grep -rn "featured-listings\|latest-listings" src scripts .storybook` returns only:

- their own declarations (`FeaturedListingsView.tsx:58`, `LatestListingsView.tsx:43`),
- two prose comments in the same two files (`:38`, `:34`),
- one Storybook `docs.description` string (`LatestListings.stories.tsx:99`).

No gate, probe, test or provider selects on them — `check-homepage-grid.mjs` addresses the grids by **story ID**,
not by marker class. This mirrors `.site-footer` (Task 673), not `.site-header` (Task 706).

**Disposition: PRESERVE both verbatim anyway.** Removing them is out of scope (agent-contract cl. 9 would pull the
deletion audit into this task, and D28 authorizes no cleanup). Record the census in the session log as a finding.

### 3.4 Gate exposure — measured, not assumed

| Gate / registry | Exposure | Evidence |
|---|---|---|
| `docs/critical-flow-registry.md` | **None applicable.** Row 57 (*Listing card rendering — Mantine pattern is the COMPLETE single source of truth*) targets `ListingCard.tsx` → `MantineListingCardPattern`, i.e. the **populated** card that Sprint 46 owns. This task touches neither, and edits only the two Views' **loading** chrome. No row covers the skeletons or `AgentCtaButton`. | read 2026-08-03 |
| `check:design-tokens` | **0 violations across all three files.** Live `--strict` total is **23**, owned by `NotificationCenter.tsx` (4, `min-[390px]`), `FavoriteButton.module.css` (9) / `SaveToCollectionButton.module.css` (2) (colours), and `app/[locale]/page.tsx` (8). | live run 2026-08-03 |
| `check:design-tokens` on `.css` | The scanner collects `.css` (`scripts/check-design-tokens.mjs:438`) but raises only **colour** rules there — no `.css` file in the live run produces a `length:` finding. A colocated module is clean **provided every colour is `var(--*)`**. | live run 2026-08-03 (established in Task 706 §3.4) |
| **`check:homepage-grid`** | **Directly applicable.** `node scripts/check-homepage-grid.mjs`, with a planted-violation mode `check:homepage-grid:verify`. It drives `system-featuredlistings--default/--loading` and `system-latestlistings--default/--loading` (`:116-119`) and asserts grid column counts and gaps (plant specs at `:665,:676,:698,:709`, and a `removeChild` plant against `system-featuredlistings--loading` at `:726`). | read 2026-08-03 |
| `scripts/mantine-migration-scope.json` | Both Views **enrolled** at `:10-11`. `AgentCtaButton.tsx` is **not** enrolled. Membership must not change. | read 2026-08-03 |

**`check:design-tokens` must still read exactly 23 after this task.** A change in either direction is a defect.

### 3.5 Story and rendered-proof path — read this carefully, it is the one thing that differs from 673/706

There are **two** story families over these Views, and they play different roles:

1. **`System/FeaturedListings` and `System/LatestListings`** (`src/stories/FeaturedListings.stories.tsx`,
   `src/stories/LatestListings.stories.tsx`) — four exports each (`Default`, `LocaleStress`, `Loading`, `Empty`).
   These are **not** in the standing `--mantine-only` gate: `scripts/lib/mantine-story-scope.mjs:14` defines the
   canonical prefixes as exactly `['Mantine/Primitives/', 'Patterns/Mantine/']`, and `System/` is neither.
   **They are still load-bearing** — their story IDs are hard-coded in `check-homepage-grid.mjs` and in
   `check-stories-rendered.mjs`'s `ASSERT_STORIES` (`:173-174`).
   **Do not re-title them, do not edit them.** A rename changes the IDs and silently rewires two gates.

2. **`Patterns/Mantine/HomepageListingGrids`** (`src/stories/patterns/mantine/HomepageListingGrids.stories.tsx`,
   Task 668) — the **additive canonical enrolment story**. Its own header comment states the intent: it statically
   imports the real production `FeaturedListingsView` and `LatestListingsView` by direct file path so
   `check-story-coverage.mjs` resolves both to their `mantine-migration-scope.json` entries, and the `System/*`
   stories are explicitly left unaffected. It exports **`Default`** (`:84`) and **`Loading`** (`:125`).

**The enrolled matrix is 32 cells:** `patterns-mantine-homepagelistinggrids--default` and
`…--loading`, each at `MANTINE_VIEWPORTS` = `320 / 375 / 390 / 1024`
(`scripts/check-stories-rendered.mjs:392-397`) × 4 locales. Neither has an entry in
`MANTINE_STORY_EXTRA_VIEWPORTS` (`:417-444`). Both were `verdict: "pass"` in the 2026-08-02 sweeps.

**The `Loading` export is what makes this task provable** — it renders each View's own loading branch, i.e. the
exact `CardSkeleton`/`RowSkeleton` chrome being migrated. Without it, four of the five sites would have no rendered
proof at all.

**`AgentCtaButton` has no story and no enrolled cell.** Its proof is necessarily different in kind (§12 AC5) and
this task says so rather than implying coverage it does not have (**D31**).

### 3.6 Token provenance for the values in play

| Utility | Variable / source | Declared |
|---|---|---|
| `bg-card` | `--color-card` → `--card` → `--neutral-0` | `globals.css:38`, `:369` |
| `border` | `--border` → `--neutral-200` | `globals.css:396` |
| `rounded-xl` | `--radius-xl` = `calc(var(--radius) * 1.5)`, `--radius: 0.75rem` | `globals.css:118`, `:438` |
| `p-3`, `space-y-2`, `flex flex-col`, `overflow-hidden`, `h-4 w-4` | plain Tailwind scale utilities | measure (§9, I2) |

The module must consume these **variables**, never their hex values (D27's "token not hex"). `rounded-xl`'s value is
a `calc()` over a variable — **measure the compiled result, do not compute it**, and note that
`theme.components.Skeleton` separately sets the *Skeleton's own* border/radius (`theme.ts`, see
`skeleton-chrome.css`'s header), which is a different element from the wrapper `Box` you are styling.

### 3.7 Canonical-source search — perform it, and record the result

Agent-contract **16b** requires the canonical search before any new style. Two candidates exist and **neither is the
right home**; record both findings rather than re-deriving them silently:

- `src/design-system/mantine/skeleton-chrome.css` — a **global** stylesheet (imported by `src/app/layout.tsx:10`
  and `.storybook/preview.tsx:15`) whose only rules target `.mantine-Skeleton-root::after` (the pulse fill) and its
  `prefers-reduced-motion` branch. It styles the Mantine `Skeleton` itself, not the wrapper `Box` chrome around it,
  and Tasks 704/705 own it. **Do not edit it.**
- `src/components/layout/FooterView.module.css` / `HeaderView.module.css` (Tasks 673/706) — the **convention** to
  copy: a header comment naming what was reproduced and the capture that verified it, `var(--*)` for every colour,
  and `:hover`/`transition` in the module rather than an inline `style`.

**Two colocated modules, one per View.** `.skeletonBody` will be near-identical in both files; that duplication is
intentional colocation, not an oversight — do **not** invent a third shared stylesheet for two 2-property classes,
and do not make one View import the other's module.

**Carried over from the 673 and 706 reviews, binding here:**

- **Prop before module.** If a Mantine style prop expresses the value on its own, use the prop; the module holds
  only what a prop cannot express. (`Box` accepts `p`, but `p-3` must be *measured* first — do not assume Mantine's
  `p="xs"`/`p="sm"` scale equals Tailwind's `p-3`.)
- **Report the actual counts you observe.** Both prior tasks misreported their own post-edit `grep -c 'className='`
  number. AC1 asks for the live count; produce it from a real run, not from arithmetic on this table.

### 3.8 Worktree state at design time — clean

`git status --porcelain` at HEAD `911852104` on 2026-08-03, **before** any write in this session: **empty**.
Task 706's four paths were committed by the owner immediately before this design session. There is no dirty-tree
manifest to reconcile. **Re-verify this yourself before your first edit** — if your own `git status --short` is not
empty at session start, snapshot it and reconcile against that snapshot instead.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D28, §3.2 | The three files contain **zero** Tailwind utility classes. Every surviving `className=` is `styles.*` or one of the two verbatim marker strings. | P0 | AC1 |Confirmed|
| R2 | D28, §3.7 | Two new colocated modules exist — `FeaturedListingsView.module.css` and `LatestListingsView.module.css` — each consuming `globals.css` variables (never hex) and carrying a header comment naming the capture that verified it. | P0 | AC2 |Confirmed|
| R3 | §3.2 | `space-y-2` is reproduced as the sibling-margin rule Tailwind actually compiles, not as `gap`; the resulting computed margins on the real Skeleton children are unchanged. | P0 | AC3 |Confirmed|
| R4 | D26, §3.5 | All **32** enrolled `HomepageListingGrids` cells (`Default` + `Loading`) keep their pre-task PNG md5 **and** verdict. | P0 | AC4 |Confirmed|
| R5 | D31, §3.5 | `AgentCtaButton`'s icon renders the identical computed box after the swap, measured — not assumed. | P0 | AC5 |Confirmed|
| R6 | §3.3 | `featured-listings` and `latest-listings` survive byte-identically on their existing lines. | P0 | AC6 |Confirmed|
| R7 | §3.4 | `npm run check:homepage-grid` passes, with the pre-edit baseline recorded first. | P0 | AC7 |Confirmed|
| R8 | §3.4 | `check:design-tokens` still totals **23**, with no entry for any of the three touched files or either new module. | P1 | AC8 |Confirmed|
| R9 | §3.5 | Neither `System/*` story is edited or re-titled, and `HomepageListingGrids.stories.tsx` is unchanged. | P0 | AC9 |Confirmed|
| R10 | agent-contract cl. 9 | `npm run build` exits 0. | P0 | AC10 |Confirmed|
| R11 | §9 I4 | The visual comparator is shown to be capable of failing (two-armed plant + pre-plant census), **with both arms' output persisted**. | P0 | AC11 |Confirmed|
| R12 | agent-contract cl. 14 | Touched files stay UTF-8 without BOM, no mojibake. | P2 | AC12 |Confirmed|

---

## 5. Assumptions and open questions

### 5.1 Stated assumptions

- **A1.** Mantine `Box` forwards `className` and accepts a CSS-module class without needing `unstyled` — `Box`
  ships zero baked CSS of its own (stated at `HeaderView.tsx:108-109`, Task 629, and relied on by both 673 and 706).
  **Do not add `unstyled` to `Box`.**
- **A2.** The `Skeleton` children's own `height`/`width` props and the `aspectRatio` inline style are independent of
  the wrapper chrome and are not in scope. An inline `style` attribute unconditionally beats an external stylesheet
  rule for the same property (Task 653) — so do not attempt to move `aspectRatio` into a module.

### 5.2 The lucide icon at `AgentCtaButton.tsx:19` — decide by measurement, then record

`<Building2 className="h-4 w-4" />` sets **CSS** `width`/`height: 1rem`, overriding lucide's own default SVG
`width`/`height` attributes of `24`. `size={16}` writes `width="16" height="16"` as SVG attributes instead. Task 706
measured the equivalent swap (`h-5 w-5` → `size={20}`) on the header hamburger and confirmed an identical computed
box — but that was a different icon inside a different parent. **Measure this one** (§9, I2): capture the computed
box of the icon inside the real `Button`'s `leftSection` before and after. If `size={16}` reproduces it exactly, use
the prop (§3.7 "prop before module"); if it does not, use a module class and say why.

### 5.3 Nothing is left ambiguous for the executor

There is no unresolved owner decision in this task. D28 and D31 close both that existed.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (**row 57 in full** — §3.4 argues its non-applicability from it; verify that
yourself before accepting Q3).

**Current Mantine path:** `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/ui-rules.md` (routing/legacy-boundary notes only) · `docs/qa-rules.md`.

**Because the surfaces are story-enrolled:** `docs/storybook-governance.md` **§14.11 (D26)** and §14.9.17.

**Task-specific sources:** this file · `tasks/Sprints/Sprint_48_Homepage_Tail_DeTailwind.md` ·
`tasks/Sprints/Sprint_47_kickoff_prompt_Task_706_HeaderView_DeHybrid.md` and
`docs/sessions/2026-08-02-task706-headerview-de-hybrid.md` (the pattern and evidence shape being inherited,
including its review addendum §14) · `src/components/layout/HeaderView.module.css` (the reference output) ·
`src/stories/patterns/mantine/HomepageListingGrids.stories.tsx` (the proof story — read it, do not edit it).

---

## 7. Scope

- `src/modules/listings/components/FeaturedListingsView.tsx` — sites #1, #2 only.
- `src/modules/listings/components/LatestListingsView.tsx` — sites #4, #5 only.
- `src/components/shared/AgentCtaButton.tsx` — site #7 only.
- `src/modules/listings/components/FeaturedListingsView.module.css` — **new**.
- `src/modules/listings/components/LatestListingsView.module.css` — **new**.
- Nothing else.

---

## 8. Out of scope

- **Every story file.** `src/stories/FeaturedListings.stories.tsx`, `src/stories/LatestListings.stories.tsx`,
  `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx` — no edit, no re-title (§3.5). A story diff is a
  signal that scope leaked.
- `src/design-system/mantine/skeleton-chrome.css` (Tasks 704/705) and `theme.ts`'s `Skeleton` entry.
- `ListingCard.tsx`, `MantineListingCardPattern.tsx` — Sprint 46 (691/702).
- The containers `FeaturedListings.tsx` / `LatestListings.tsx`, and `src/app/[locale]/page.tsx`.
- Removing either marker class (§3.3) · `scripts/mantine-migration-scope.json` membership · the enrolled viewport
  set (§3.5) · `globals.css` · any TailAdmin restyle, token, spacing or typography change (D28).
- The populated and empty branches of both Views — this task changes only the loading chrome and one icon.

---

## 9. Current and required behavior

**Current:** both Views are Mantine components whose **loading branch** wraps Mantine `Skeleton`s in raw
Tailwind-styled `Box`es — 4 utility sites total — while every other branch is already utility-free. `AgentCtaButton`
is a Mantine `Button` whose lucide icon carries a Tailwind size utility.

**Required after:** identical rendered output at every enrolled cell; zero Tailwind utilities in the three files;
the skeleton chrome's values live in two colocated modules consuming `globals.css` variables; the icon uses lucide's
own `size` prop (or a module class, if measurement says otherwise); both marker classes unchanged;
`check:homepage-grid` green and `check:design-tokens` still 23.

### Implementation sequence

- **I1 — Baseline first, before any edit.** Capture the current `--mantine-only` rendered run and persist the PNG
  md5 list for **both** `homepagelistinggrids` story IDs (32 cells). Record `check:design-tokens` (expect **23**),
  `npm run check:homepage-grid` (expect pass), and `git status --porcelain` (expect empty, §3.8).
  **A baseline captured after an edit is not a baseline.**
- **I2 — Measure, do not compute.** With the `Loading` story rendered, take a live `getComputedStyle` capture of
  sites #1, #2, #4, #5 **and of their Skeleton children's margins** (this is how `space-y-2` is measured — the
  utility acts on the children, not the parent). Separately capture the `AgentCtaButton` icon's computed box on the
  real page. Persist both captures.
- **I3 — Migrate**, in §3.2 table order. Two modules, one per View. Leave lines `:58` and `:43` untouched.
- **I4 — Prove the comparator can fail (two-armed plant).** See AC11. **Persist both arms' PNG output** under
  `.screenshots/task707-ac11/{migrated-clean,armA-planted,armB-reverted}/` — Task 706's arms were not persisted and
  could not be re-inspected at review.
- **I5 — Re-run** the full evidence set and diff against I1.

---

## 10. Implementation requirements

1. **`space-y-2` is a sibling-margin rule, not a gap** (§3.2). Reproduce what Tailwind actually compiles, verified
   against the built CSS and the measured child margins.
2. **Do not add `unstyled` to `Box`** (A1) — it ships no CSS of its own; adding it is a no-op that misleads the
   next reader.
3. **Consume variables, not hex** (§3.6). A hex or `rgba(` literal in either module breaks AC8.
4. **Prop before module** (§3.7), but only after measuring — Mantine's spacing scale is not Tailwind's.
5. **Do not touch the marker lines.** `FeaturedListingsView.tsx:58` and `LatestListingsView.tsx:43` carry no
   Tailwind utility; the correct diff leaves them byte-identical.
6. **Preserve every `Skeleton` prop, the `aspectRatio` inline style, both `SimpleGrid` `cols`/`spacing` maps, and
   the skeleton counts** (3 Featured, 4 Latest).
7. **Preserve `'use client'`** in all three files, and `AgentCtaButton`'s `data-track="register"`, its
   `styles={{root:{…}}}` object, and its `w={{ base: '100%', sm: 'auto' }}`.
8. **Do not change any prop interface.** `FeaturedListingsViewProps`, `LatestListingsViewProps` and
   `AgentCtaButtonProps` are consumed by their containers and by the stories.

---

## 11. Positive and negative flows

**Positive flow:** `/[locale]` renders the Featured and Latest sections; while data is loading each shows its
skeleton grid (3 cards / 4 rows), then swaps to real `ListingCard`s. The agent CTA renders with its building icon.
All four locales, all four enrolled widths, unchanged from baseline.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Loading branch | **Yes** | `FeaturedListingsView.tsx:54-63`, `LatestListingsView.tsx:41-47` — the only branch this task edits | Skeleton chrome pixel-identical to baseline | AC4 — the `Loading` story's 16 cells |
| Populated branch | **Yes** | `:74-83` / `:55-61` — untouched, but shares the `SimpleGrid` and must not regress | Identical to baseline | AC4 — the `Default` story's 16 cells; AC7 |
| Empty branch (`listings: []`) | **Yes** | `:65-72` / `:49-53` — renders a centered `Text`, no skeleton, no grid | Unchanged; no orphan chrome | Story fixture run locally at 320 + 1024; not a new persisted story (§8) |
| Long localized strings (`uk`, `sq`) | **Yes** | The Featured header `Title` + `ViewAllLink` share one row (`:45-52`) | No wrap or overflow change vs baseline | AC4 — `uk@320` and `sq@320` are mandatory cells |
| `AgentCtaButton` at mobile | **Yes** | `w={{ base: '100%', sm: 'auto' }}` — full width below `sm` | Icon box and button width unchanged | AC5 measured at 320 and 1024 |
| Hydration mismatch | **No** | These are `'use client'` leaf presentational components with no `useId` consumer; the registry's hydration row targets `Header.tsx` (Task 706), not these | N/A | — |
| RTL | **No** | No RTL locale ships (`sq`/`en`/`uk`/`it`) | N/A | — |
| Authorization / RLS | **No** | Prop-driven, no data access | N/A | — |
| Concurrent writer / offline | **No** | No writes, no network | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the three migrated files, when `grep -c 'className='` and `grep -n 'className='` run on each,
  then every returned value is a `styles.*` reference or one of the two verbatim marker strings, and **no** line
  contains a Tailwind utility. **Report the actual counts you observe**, per file, from a real run.
- **AC2 [R2]** Given the two new modules, when each is read, then it exists, references only `var(--*)` for colour,
  contains **zero** hex literals and zero `rgba(`, and carries a header comment naming what it reproduces and the I2
  capture that verified it.
- **AC3 [R3]** Given the migrated `Loading` story DOM, when the Skeleton children of sites #2 and #5 are inspected,
  then their computed sibling margins equal the I2 pre-edit capture exactly, and the module reproduces Tailwind's
  own compiled `space-y-2` selector shape rather than a `gap` declaration.
- **AC4 [R4]** Given the post-change `--mantine-only` run, when its **32** `HomepageListingGrids` cells
  (`--default` and `--loading`) are compared against the I1 baseline under the `docs/storybook-governance.md`
  §14.11 (D26) comparator, then **PNG md5 and verdict are identical for all 32**. A changed cell is reported as a
  finding with per-cell attribution — it is not absorbed into a tolerance. **The official
  `npm run screenshots:assert -- --mantine-only` invocation must complete and its `manifest.json` must exist**; a
  proxy capture may corroborate it but may not replace it.
- **AC5 [R5]** Given the `AgentCtaButton` icon before and after the swap, when its computed box is measured at 320
  and 1024 on the real page, then width and height are identical in both states, and the measurement is recorded.
  This component has **no enrolled cell** — do not claim md5 coverage for it.
- **AC6 [R6]** Given the migrated files, when `FeaturedListingsView.tsx:58` and `LatestListingsView.tsx:43` are
  diffed, then both lines are byte-identical to HEAD and still carry `featured-listings` / `latest-listings`.
- **AC7 [R7]** Given `npm run check:homepage-grid`, when it runs post-change, then it passes, and its pre-edit
  result was recorded first.
- **AC8 [R8]** Given `npm run check:design-tokens`, when it runs, then the total is **23** — unchanged — and the
  per-file breakdown lists no entry for any of the three touched files or either new module.
- **AC9 [R9]** Given `git status --short`, when the three story paths of §8 are checked, then all are empty.
- **AC10 [R10]** Given the final state, when `npm run build` runs, then it exits **0**, and the actual transcript is
  recorded.
- **AC11 [R11]** Given the migrated components, when the **two-armed plant** below runs, then the comparator flips
  as specified in both arms, **and both arms' PNG output is persisted** under
  `.screenshots/task707-ac11/{migrated-clean,armA-planted,armB-reverted}/`.
  - *Pre-plant census (mandatory first):* prove that **nothing else** declares the planted property on the target
    element — no surviving Tailwind utility, no inline `style`, no Mantine leak. Quote the evidence. Without this a
    lifeline can mask the plant and the arms prove nothing (the M4 failure mode).
  - *Arm A (must FAIL):* change `.skeletonCard`'s reproduced `background-color` to a visibly different `var(--*)`
    value. **Choose a property that is live in every enrolled cell** — Task 706 planted a `gap` under
    `justify-content: space-between` and only 9 of 16 cells moved, leaving the rest unproven. Re-run the 32 cells;
    **every `--loading` cell's md5 must change**. If nothing changes, the comparator is blind and the task is
    `BLOCKED` — not `IMPLEMENTED`.
  - *Arm B (must PASS):* revert the plant exactly. Re-run. All 32 cells identical to the I1 baseline again.
- **AC12 [R12]** Given the five touched/created files, when `npm run check:file-integrity` and
  `npm run check:mojibake` run, then both pass and the files are UTF-8 without BOM.

---

## 13. QA profile and verification plan

**Profile: `Q3` Full Visual Matrix.** `docs/qa-profiles.md` routes migrated Mantine surfaces with a standing
rendered gate to Q3. **Not `Q4`:** Q4 requires a `docs/critical-flow-registry.md` entry, and §3.4 establishes by
direct read that row 57 targets `ListingCard.tsx` → `MantineListingCardPattern` — the populated card owned by
Sprint 46 — not these Views' loading chrome and not `AgentCtaButton`. Verify that yourself before accepting Q3; if
you conclude a row does apply, stop and report rather than downgrading the evidence.

**Proof path — the enrolled matrix is 32 cells** (2 exports × 4 widths × 4 locales, §3.5).

| # | Command / step | Expected |
|---:|---|---|
| 1 | Rendered `--mantine-only` baseline, **pre-edit** (I1) | 32 `homepagelistinggrids` cells, md5 list persisted, `manifest.json` present |
| 2 | `npm run check:homepage-grid`, **pre-edit** | pass — the baseline for AC7 |
| 3 | Live `getComputedStyle` capture of sites #1/#2/#4/#5 **and their Skeleton children's margins**, plus the `AgentCtaButton` icon box at 320/1024 (I2) | persisted; the modules' source of truth |
| 4 | `npm run check:design-tokens`, pre-edit | **23**, 0 for all three files |
| 5 | Post-change `npm run screenshots:assert -- --mantine-only` | run **completes**, `manifest.json` present, 32/32 identical to step 1 (AC4) |
| 6 | Two-armed plant + pre-plant census, **arms persisted** (I4) | Arm A flips every `--loading` cell; Arm B restores all 32 (AC11) |
| 7 | `npm run check:homepage-grid`, post-change | pass (AC7) |
| 8 | `npm run check:design-tokens`, post-change | **23**, no entry for any touched file or new module (AC8) |
| 9 | DOM witness: marker classes, module class application, Skeleton child margins, icon box | AC3, AC5, AC6 |
| 10 | `npm run check:file-integrity` · `npm run check:mojibake` | pass (AC12) |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate**, transcript recorded (AC10) |

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `docs/sessions/` (assets alongside the log) and `.screenshots/task707-ac11/`;
`.screenshots/` output is local-only per **D6**.

---

## 14. Completion report contract

Write `docs/sessions/2026-08-03-task707-homepage-tail-de-tailwind.md` containing:

1. **Files changed** — a table matching the real `git diff --stat` exactly, reconciled against your own pre-write
   `git status --porcelain` snapshot (§3.8 expects it empty).
2. **Requirement IDs completed** — R1–R12, each with its AC verdict.
3. **Commands run and their actual results** — real exit codes and real numbers, including the step-12 build
   transcript and both `check:homepage-grid` runs. **Report the counts you actually observed**; do not restate a
   pre-edit number as if you re-measured it, and do not compute a count you did not run.
4. **Evidence locations** — the I1 baseline md5 list (32 cells), the I2 computed-style capture (including the child
   margins and the icon box), the **persisted** AC11 arm directories, and the final official run's `manifest.json`
   path.
5. **The §3.2 disposition table, filled in** — what each of the 7 sites actually became, the §5.2 icon decision with
   its measured justification, and every "prop vs module" call you made under §3.7's rule.
6. **The `space-y-2` reproduction** — the compiled Tailwind rule you matched and the measured child margins.
7. **The marker-class zero-consumer census** (§3.3), recorded as a finding, not acted on.
8. **Assumptions, deviations, limitations, unresolved issues.**
9. Concise current state appended to `docs/backlog.md` — **state only**, no history, and flag a
   `BACKLOG LIMIT BREACH` if the file cannot stay at or below 80 lines (it is currently **108** — a known
   pre-existing breach; do not add net lines).

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.**
Never self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit,
suggest, or delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every path, line number, count and command is named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R12 → AC1–AC12 → §13 steps 1–12 |
| Scope protects existing behavior and names what must not change | ✅ §8, plus R6's verbatim markers and §10.6's preservation list |
| Negative flows selected by applicability, not copied | ✅ §11 — 5 applicable, 4 marked `No` with the source that makes them inapplicable |
| No uninspected claim | ✅ every count, line and gate in §3 was read or run on 2026-08-03; compiled utility values are deliberately **not** asserted — I2 measures them |
| The gate proves the changed behavior, not merely procedure | ✅ AC11's Arm A must flip every `--loading` cell and its arms must be persisted; AC3 asserts the measured child margins, which is the only way `space-y-2` can be got wrong silently |
| Critical flow named or excluded from evidence | ✅ §3.4 / §13 argue row 57's non-applicability from its own text, and instruct the executor to re-verify rather than accept it |
| Owner exceptions have traceable authorization | ✅ D28 in Sprint 47 §"Owner decisions"; D31 recorded here and in Sprint 48; D16/D6/D26 cited with file and date |
| Exactly one active executable route | ✅ D28's mechanism-only route; §5.2's icon choice is a measured in-task decision, not a second route |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 table + AC4's D26 comparator + AC11's blind-comparator `BLOCKED` clause + AC7's pre/post pairing |
| Zero/empty input covered | ✅ §11 — the empty branch (`listings: []`) is an applicable flow with named evidence |
| Worktree state established with a pre-write snapshot | ✅ §3.8 — empty at HEAD `911852104`, with an explicit re-verify instruction |
| UI: current/legacy boundary, QA profile, source map, canonical decision record, preservation classifications | ✅ §3.2 source map · §3.6 token provenance · §3.7 canonical search with **two** recorded negatives · §13 profile with the Q4 exclusion argued from evidence |
| Prior-review corrections folded in | ✅ persisted plant arms and a live-in-every-cell plant property (706's P3s); "report the actual count" (673's and 706's P3) |
| Sprint assigned before creation | ✅ Sprint 48, opened first per the 2026-08-01 owner rule |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none** — D28 and D31 close both.
