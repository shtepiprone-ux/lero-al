# Task 886 — every Mantine heading steps down on a phone, through one scale, and a gate keeps it that way

Sprint 83 · P1 · QA profile **Q3** (site-wide responsive typography + a new blocking governance gate) · **after 869 is
approved** · owner actions **O83-1**, **O83-2** · **Status: `KICKOFF FILED` 2026-09-26**

Sprint plan: [`Sprint_83_Text_That_Scales_Down_On_A_Phone.md`](Sprint_83_Text_That_Scales_Down_On_A_Phone.md).

Filed by owner instruction, 2026-09-26, verbatim: *"так, заводь задачу на аудит адаптивних шрифтів по всьому сайту"*.
It binds rule **GR-3c** (`docs/golden-rules.md`, owner rule 2026-09-26).

## 1. Mode and task type

`IMPLEMENTATION`. The task has three parts:
- a canonical responsive heading scale, added to an existing design-system module;
- one mechanical edit at each of 15 `Title` sites, plus the removal of one duplicate skeleton;
- one new blocking static gate, with a self-test and a legacy baseline.

Bundles: **UI / Layout / Component** + **Storybook / Visual Proof** + **Docs / Governance** (a new gate).

## 2. Objective

1. **No production Mantine text of 24px or more reaches a phone unstepped.**
   - Every `Title` whose effective size is `h1`–`h4` consumes one canonical breakpoint-keyed scale, `TITLE_FZ`.
   - Each site keeps its current desktop size.
   - Below 640px, each site renders at 20px or 18px.
2. **The scale is one source.** It lives in `src/design-system/mantine/typography.ts` and is made of theme keys only.
   No site picks its own steps.
3. **A gate makes the rule structural, not remembered.**
   - `check:type-responsive` fails on a new static large `Title`, `fz` or `size`.
   - It fails on a new static Tailwind `text-2xl`-or-larger class.
   - It carries a CI `--verify-gate` self-test.
   - The 8 legacy Tailwind sites that exist today are a baseline that can shrink but never grow.

## 3. Verified context — measured 2026-09-26 by the orchestrator

### 3.1 The Mantine census — 16 static large `Title` sites in 11 files

Method: a scratchpad scanner over `src/**/*.tsx`. It excludes `*.stories.tsx`, `*.test.tsx`, `__tests__/` and
`src/stories/`, and reads every `<Title …>` opening tag, including multi-line tags. For each tag it takes the
effective size in this order:
1. `fz`;
2. `size`;
3. `h{order}`, where the default `order` is 1.

A site is **responsive** when its `fz` is an object literal or an identifier imported from `typography.ts`.

Result:
- 26 `Title` sites in total;
- 7 responsive;
- 19 static, of which **16 have an effective size of `h1`–`h4`** (24px or more);
- 3 static sites have `h5`/`lg` (20px or less) and comply.

| # | Site | `order` | Effective size today (every width) |
|---|---|---|---|
| S1 | `src/design-system/mantine/patterns/MantineAuthFormPattern.tsx:99` | 2 | `h3` 30px |
| S2 | `src/design-system/mantine/patterns/MantineDashboardHeader.tsx:56` | 1 | `h4` 24px |
| S3 | `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:196` | 1 | `h2` 36px |
| S4 | `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:272` | 2 | `h4` 24px |
| S5 | `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:285` | 2 | `h4` 24px |
| S6 | `src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx:43` | 1 | `h2` 36px |
| S7 | `src/design-system/mantine/patterns/MantineTwoColumnForm.tsx:61` | 2 | `h3` 30px |
| S8–S10 | `src/modules/auth/components/ResetPasswordView.tsx:66`, `:85`, `:100` | 1 | `h3` 30px |
| S11 | `src/modules/listings/components/ListingDetailView.tsx:58` (`SimilarListingsSkeleton`) | 2 | `h4` 24px |
| S12 | `src/modules/listings/components/ListingDetailView.tsx:370` (inside `ListingDetailViewBody`, from `:185`) | 2 | `h4` 24px |
| S13, S14 | `src/modules/listings/components/RecentlyViewedGridView.tsx:46`, `:61` | 2 | `h4` 24px |
| S15 | `src/modules/listings/components/RecentlyViewedSection.tsx:79` (`RecentlyViewedSkeleton`) | 2 | `h4` 24px |
| S16 | `src/modules/listings/components/SimilarListingsView.tsx:52` | 2 | `h4` 24px |

The 7 responsive sites comply and are unchanged:
- `src/app/[locale]/page.tsx:40`, the homepage hero: 30px at base, a named hero within GR-3c's 30px limit;
- `src/app/[locale]/page.tsx:59` and `:87`, `HowItWorksSteps.tsx:29`, `FeaturedListingsView.tsx:62` and
  `PopularLocationsView.tsx:59`, all `SECTION_HEADING_FZ` (20/24/30);
- `CmsPageView.tsx:23`, Task 869.

**Other large-text sources, checked and clean:**
- **Other components.** No non-`Title` element has a static `fz`/`size` of `h1`–`h4`. The only three matches are
  comments.
- **Raw values.** No raw `fz` px/rem literal appears anywhere.
- **CSS modules.** The three CSS modules that set `font-size` use 20px or less (`FooterView.module.css:47` is
  `--homepage-runtime-font-size-xl` = 20px).
- **The theme.** No `theme.ts` component style sets a size of 24px or more. The only such values are
  `headings.sizes` themselves, at `theme.ts:581-584`.
- **Rich text.** `Typography` has one consumer, `CmsPageView`, and it is covered by 869's `typography-chrome.css`.

**Stories and manifest, per file:**

| File | Manifest | Story that imports it |
|---|---|---|
| `MantineAuthFormPattern` | yes | `src/stories/patterns/mantine/AuthFormPattern.stories.tsx` |
| `MantineDashboardHeader` | yes | `…/DashboardHeader.stories.tsx` |
| `MantineListingDetailPattern` | yes | `…/ListingDetailPattern.stories.tsx` |
| `MantinePageHeaderWithActions` | yes | `…/PageHeaderWithActions.stories.tsx` |
| `MantineTwoColumnForm` | yes | `…/TwoColumnForm.stories.tsx` |
| `ResetPasswordView` | yes | `…/ResetPasswordView.stories.tsx` |
| `ListingDetailView` | yes | `…/ListingDetailView.stories.tsx`, which imports `ListingDetailViewBody` |
| `RecentlyViewedGridView` | yes | `src/stories/mantine/primitives/RecentlyViewedGridView.stories.tsx` |
| `SimilarListingsView` | yes | `src/stories/mantine/primitives/SimilarListingsView.stories.tsx` (title `Mantine/Primitives/SimilarListingsView`) |
| `RecentlyViewedSection` | **no** | **none** |

`RecentlyViewedSection` is baselined as `tier1-unenrolled-or-unstoried` under three surfaces
(`scripts/surface-census-baseline.json:94`, `:205`, `:493`).

**S11 and S15 are the same component, written twice.** The bodies of `SimilarListingsSkeleton` and
`RecentlyViewedSkeleton` are byte-identical. That was measured with `diff` over both function bodies, and
`RecentlyViewedSection.tsx`'s own comment says it was *"rewritten to `SimilarListingsSkeleton`'s composition"*.
`RecentlyViewedSkeleton` has exactly one consumer, `ListingDetailView.tsx:529`
(`<Suspense fallback={<RecentlyViewedSkeleton />}>`), which it imports at `:26`.

### 3.2 The legacy Tailwind census — 8 static `text-2xl` (24px) sites

| # | Site | Owning migration task |
|---|---|---|
| L1 | `src/app/admin/page.tsx:113` | **853** (`/admin` operations dashboard, Sprint 78) |
| L2 | `src/components/admin/AdminPageHeader.tsx:11` | **877** (`AdminPageHeader` → adapter over canonical patterns, Sprint 78) |
| L3 | `src/app/admin/users/page.tsx:84` | none |
| L4 | `src/app/[locale]/favorites/page.tsx:85` | none |
| L5 | `src/components/admin/AdminPageShell.tsx:35` | none |
| L6 | `src/components/admin/AdminSupportManager.tsx:776` | none |
| L7 | `src/modules/listings/components/ListingFormShellView.tsx:135` | none |
| L8 | `src/modules/listings/components/steps/StepPreview.tsx:60` | none |

One more Tailwind site already has a step and complies: `src/app/[locale]/contact/page.tsx:32`,
`text-2xl sm:text-3xl`.

**These are not fixed here.** `docs/mantine-responsive-design-system.md` §15 (owner P0, 2026-06-24) forbids new
`sm:`/`md:` Tailwind responsive classes, and the owner's standing rule is to migrate legacy surfaces rather than
patch them. 886 **baselines** them in the gate, so they cannot grow. Their disposition is **O83-2**.

### 3.3 The mechanism, read in source

| # | Fact | Evidence |
|---|---|---|
| M1 | The theme heading sizes are single values, with no breakpoint. | `theme.ts:581-586`: h1 `3rem` · h2 `2.25rem` · h3 `1.875rem` · h4 `1.5rem` · h5 `1.25rem` · h6 `1.125rem` |
| M2 | Mantine's `fz` style prop accepts heading keys and resolves each one to that heading's variable. So a responsive `fz` built from `h4`/`h5`/`h6` needs no raw value. | `node_modules/@mantine/core/cjs/core/Box/style-props/resolvers/font-size-resolver/font-size-resolver.cjs:9-16` (`headings.includes(value)` → `` `var(--mantine-${value}-font-size)` ``); `@mantine/core` 8.3.18 |
| M3 | The breakpoints used are `sm` 40em = 640px, `md` 48em = 768px and `lg` 64em = 1024px. | `theme.ts:566-568` |
| M4 | `typography.ts` has no imports and no `'use client'`, so server components can import it. It is already the home of a responsive `fz` constant. | `src/design-system/mantine/typography.ts:1-16` |
| M5 | The precedent for the gate's shape is a directory-listing-driven checker with `evaluateGateExitCode`, a printed scope and a `--verify-gate` arm set, wired as two steps in the PR governance job. | `scripts/check-media-enrolment.mjs:17`, `:60`, `:131-222`; `.github/workflows/governance-pr.yml:148-152`; `package.json:85-86` |

### 3.4 GR preflights, run at design time

`GR-0 CANONICAL REUSE PREFLIGHT — request: a responsive font-size scale for Mantine Title sites whose static size is h1–h4; semantic queries: fz, responsive font size, heading scale, SECTION_HEADING_FZ, typography, Title size, headings.sizes; inspected candidates: src/design-system/mantine/typography.ts (SECTION_HEADING_FZ — responsive, but raw rem literals reserved as N1 debt by 734, and a homepage-section role), src/design-system/mantine/theme.ts:577-587 (headings.sizes — fixed, no breakpoint support), src/design-system/mantine/typography-chrome.css (869, rich-text descendants only, not Title); decision: EXTEND; selected canonical owner: src/design-system/mantine/typography.ts (new export TITLE_FZ beside SECTION_HEADING_FZ); Mantine/TailAdmin token path: theme.ts:581-586 heading keys via Mantine's fz heading resolver (M2), breakpoints theme.ts:566-568; new hardcoded visual values: NONE; rationale: the only responsive constant in the module carries raw literals and a different role, and the theme cannot express breakpoints, so the canonical module is extended with a theme-key-only map.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: the recently-viewed Suspense fallback; semantic queries: skeleton, rail skeleton, Suspense fallback, MantineListingCardTrack rail; inspected candidates: ListingDetailView.tsx:54 SimilarListingsSkeleton, RecentlyViewedSection.tsx RecentlyViewedSkeleton (byte-identical body); decision: REUSE; selected canonical owner: SimilarListingsSkeleton; Mantine/TailAdmin token path: unchanged; new hardcoded visual values: NONE; rationale: two identical components, and the one in the enrolled file is kept.`

`GR-3a STORY PREFLIGHT — SimilarListingsSkeleton × loading; canonical candidates: Mantine/Primitives/SimilarListingsView (imports SimilarListingsView, not the skeleton), Patterns/Mantine/ListingDetailView (imports ListingDetailViewBody; the Suspense fallback is not a rendered story state); direct-import evidence: NONE; toolbar coverage: locale=storyT/_storyI18n toolbar, viewport=Storybook toolbar; decision: EXTEND; target: Mantine/Primitives/SimilarListingsView — add a Loading export that imports SimilarListingsSkeleton from ListingDetailView; rationale: the skeleton is the loading state of the same block that Story already documents, and a changed visible component needs its own Story (GR-3).`

`GR-1 CENSUS COMPLETE — 11 changed files; tier1 9 migrated+enrolled+story (the ten Stories of §3.1 cover them, with the SimilarListingsSkeleton Loading export added by R6), + RecentlyViewedSection (baselined tier1, unchanged row; after R5 it renders no visual node of its own); tier2 0 imports removed; tier3 0 listed.` Each surface touched is re-censused by `check:surface-census:changed` in §13.2. It must add **no** baseline row.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | GR-3c, M2-M4 | `src/design-system/mantine/typography.ts` exports `TITLE_FZ`, exactly the §4.1 table, `as const`, with theme heading keys only. There is no px/rem literal in it. Its doc comment cites GR-3c and this kickoff. `SECTION_HEADING_FZ` is unchanged. | P0 | AC1 | Confirmed |
| **R2** | §3.1 | At **each** of S1–S10, S12–S14 and S16, add `fz={TITLE_FZ.hN}`, where `hN` is that site's effective size today. `size` and `order` stay as they are, so the line-height and the desktop size are preserved. No other attribute on those tags changes. | P0 | AC2, AC5 | Confirmed |
| **R3** | §3.1 S11 | `SimilarListingsSkeleton`'s `Title` (S11) gets `fz={TITLE_FZ.h4}`, the same as the loaded headings it stands in for (S13, S14, S16), so nothing re-lays out when the Suspense boundary resolves. | P0 | AC2, AC5 | Confirmed |
| **R4** | GR-3c | `CmsPageView.tsx`'s title `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}` becomes `fz={TITLE_FZ.h3}`. The value is identical. That is the only change to the file. | P2 | AC2 | Confirmed |
| **R5** | §3.1, GR-0 REUSE | `RecentlyViewedSkeleton` is deleted from `RecentlyViewedSection.tsx`, together with the imports only it used (`Paper`, `Skeleton`, `Stack`, `Text`, `Title`, `MantineListingCardTrack`). `ListingDetailView.tsx:529`'s fallback renders `<SimilarListingsSkeleton />`, and `:26` no longer imports `RecentlyViewedSkeleton`. | P1 | AC3 | Confirmed |
| **R6** | GR-3, GR-3a | `src/stories/mantine/primitives/SimilarListingsView.stories.tsx` gains one export, `Loading`, which renders `SimilarListingsSkeleton`, imported by name from `@/modules/listings/components/ListingDetailView`. It uses the file's existing shell, with no new decorator, `style` or viewport pin (GR-3b). | P1 | AC4 | Confirmed |
| **R7** | §2 item 3, M5 | New `scripts/check-type-responsive.mjs`, plus `check:type-responsive` and `check:type-responsive:verify` in `package.json`, plus two steps in `.github/workflows/governance-pr.yml` right after the media-enrolment pair. The contract is §10.4. | P0 | AC6, AC7 | Confirmed |
| **R8** | §3.2 | New `scripts/type-responsive-baseline.json`, which holds exactly L1–L8. Each entry is keyed `path :: token` and is line-insensitive, and each carries its owning task (or `none`) as the reason. | P0 | AC6 | Confirmed |
| **R9** | governance | Update the docs:<br>• `docs/golden-rules.md`: the GR-3c row of the Enforcement table names `check:type-responsive` (Task 886) and its blind spots;<br>• `docs/mantine-responsive-design-system.md` §7: the P0 responsive-type row names `TITLE_FZ`.<br>No rule text is narrowed. | P2 | AC8 | Confirmed |

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: none.`

### 4.1 Type-scale table (GR-3c) — binding

The table is keyed by the site's **current desktop rung**, so desktop rendering does not change. Pixel sizes come
from `theme.ts:581-586`.

| `TITLE_FZ` key | base (<640) | sm (640–767) | md (768–1023) | lg (≥1024) | Sites |
|---|---|---|---|---|---|
| `h2` | `h5` 20 | `h4` 24 | `h3` 30 | `h2` 36 | S3, S6 |
| `h3` | `h5` 20 | `h4` 24 | `h3` 30 | — (30) | S1, S7, S8–S10, CmsPageView |
| `h4` | `h6` 18 | `h5` 20 | `h4` 24 | — (24) | S2, S4, S5, S11–S14, S16 |

Provenance and invariants:
- **Base at or under 20px:** GR-3c, and the legacy `text-xl` rule in `docs/ui-rules.md` "Responsive Typography Rules".
- **The top step equals today's size:** desktop is preserved.
- **The map is monotonic:** at every width, `h4` ≤ `h3` ≤ `h2`. So wherever a surface has a hierarchy today, it keeps
  it. For example, on `ListingDetailPattern` the title (`h2`) and the section headings (`h4`) measure 20/18,
  24/20, 30/24 and 36/24.
- **It matches existing values:** `h3` equals 869's `CmsPageView` title and `SECTION_HEADING_FZ`'s 20/24/30 steps.

## 5. Assumptions and open questions

1. **DECIDED — per-site scale, not a global theme remap.** Overriding `--mantine-h1…h4-font-size` at `:root` per
   breakpoint would fix every `Title` by construction. It was rejected for two reasons:
   - it collapses h1–h4 to one size on a phone, which destroys hierarchy;
   - it contradicts GR-3c's per-role type-scale table.

   One active route: `TITLE_FZ`.
2. **DECIDED — `size` stays.** It keeps the current line-height (`--title-lh`) and acts as the fallback. `fz` is the
   responsive override. §13.2's measurement proves `fz` wins at every width. If it does not, that is a
   `TASK SPECIFICATION CONTRADICTION` report, not a local workaround.
3. **OPEN — O83-2 (owner):** L3–L8, which have no owning task. 886 baselines them either way; the decision only
   changes whether migration tasks are filed now.
4. **ASSUMED, re-checked at I0:** the census in §3.1 and §3.2. State can drift, for example 852's `AdminHeader` is in
   flight. I0 re-runs the scanner. A new static large site that appeared since then is **in scope** at the same
   `TITLE_FZ` key as its current size. Record it; do not skip it.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: **GR-0, GR-1, GR-2, GR-3, GR-3a, GR-3b, GR-3c in full**, plus GR-4…GR-6.
- `docs/agent-contract.md`: clauses 9, 10, 11, 14, 16, 16a, **16b, 16c, 16d in full**.
- `docs/rule-index.md`: "UI / Layout / Component", "Storybook / Visual Proof", "Docs / Governance / Task Template".
- `docs/qa-profiles.md`: the `Q3` row and "Viewport policy".
- `docs/mantine-responsive-design-system.md`: §7 and §15.
- `docs/orchestrator-procedures.md`: "Recurring orchestrator failure modes" (two-armed plants; print the gate's
  scope) and the corollary on `git hash-object` witnesses.
- `scripts/check-media-enrolment.mjs`: read in full before writing R7.

## 7. Scope

Files the executor may create or change:

- `src/design-system/mantine/typography.ts` (R1)
- `src/design-system/mantine/patterns/MantineAuthFormPattern.tsx`, `MantineDashboardHeader.tsx`,
  `MantineListingDetailPattern.tsx`, `MantinePageHeaderWithActions.tsx`, `MantineTwoColumnForm.tsx` (R2)
- `src/modules/auth/components/ResetPasswordView.tsx` (R2)
- `src/modules/listings/components/ListingDetailView.tsx` (R2 S12, R3, R5)
- `src/modules/listings/components/RecentlyViewedGridView.tsx`, `SimilarListingsView.tsx` (R2)
- `src/modules/listings/components/RecentlyViewedSection.tsx` (R5 — deletion only)
- `src/modules/cms/components/CmsPageView.tsx` (R4 — the title line only)
- `src/stories/mantine/primitives/SimilarListingsView.stories.tsx` (R6)
- `scripts/check-type-responsive.mjs` *(new)*, `scripts/type-responsive-baseline.json` *(new)*, `package.json` (two
  script lines), `.github/workflows/governance-pr.yml` (two steps) (R7, R8)
- `docs/golden-rules.md` (the GR-3c Enforcement row only) and `docs/mantine-responsive-design-system.md` (the §7
  GR-3c row only) (R9)
- Any static large `Title` that I0 finds beyond §3.1 (§5.4)
- `docs/sessions/2026-09-2*-task886-*.md`, `docs/sessions/evidence/task886/**`, and the 886 cell of `docs/backlog.md`

## 8. Out of scope

- `theme.ts` `headings.sizes`: no change (§5.1).
- L1–L8, the legacy Tailwind sites: baselined, not edited (§3.2, O83-2).
- `SECTION_HEADING_FZ` and its five consumers. Its literals are reserved **734**.
- The homepage hero (`src/app/[locale]/page.tsx:40`): a named hero, compliant.
- `typography-chrome.css` and anything else in 869's or 884's scope, except R4's one line.
- `scripts/surface-census-baseline.json`: **do not edit it**. Removing `RecentlyViewedSkeleton` leaves the existing
  rows correct.
- Any change to a Story other than R6's one export.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| S3/S6 (`h2`) at 320 / 640 / 768 / 1024 / 1440 | 36 / 36 / 36 / 36 / 36 px | 20 / 24 / 30 / 36 / 36 |
| S1, S7, S8–S10 (`h3`) | 30 at every width | 20 / 24 / 30 / 30 / 30 |
| S2, S4, S5, S11–S14, S16 (`h4`) | 24 at every width | 18 / 20 / 24 / 24 / 24 |
| Desktop at ≥1024 | as above | **unchanged** at every site |
| Recently-viewed Suspense fallback | `RecentlyViewedSkeleton` (a duplicate) | `SimilarListingsSkeleton`, the identical markup, now responsive |
| New static `<Title>` of `h1`–`h4`, or a static `fz`/`size` `h1`–`h4` | nothing fails | `check:type-responsive` fails |
| New static Tailwind `text-2xl`+ with no `sm:`/`md:`/`lg:` `text-` step | nothing fails | the gate fails, unless the site is baselined |

## 10. Implementation requirements

1. **I0, before any write.**
   - Run §13.1.
   - Re-derive §3.1 and §3.2 with your own scanner (a throwaway script under the gitignored `.artifacts/`, never
     committed), then compare the result to both tables.
   - Confirm the `diff` of the two skeleton bodies is still empty.
   - Record everything under `docs/sessions/evidence/task886/`.
   - A contradiction other than §5.4's is `TASK SPECIFICATION CONTRADICTION`: stop.
2. **Order.**
   1. R1.
   2. R6's Story export, proven to render.
   3. R2–R5.
   4. R7/R8.
   5. R9.
3. **R2 is mechanical.** At each site, add `fz={TITLE_FZ.hN}` and add the import. Change nothing else. The key is the
   effective size in §3.1.
4. **R7 contract (`scripts/check-type-responsive.mjs`).**
   - **Scan scope.** Scan `src/**/*.tsx`, excluding `*.stories.tsx`, `*.test.tsx`, `__tests__/` and `src/stories/`.
     Parse opening tags across lines.
   - **Arm A (Mantine).** Each of these is a violation:
     - a `<Title …>` whose effective size (§3.1 method) is `h1`–`h4`, with a `fz` that is neither an object literal
       `{{…}}` nor a member or identifier imported from `@/design-system/mantine/typography`;
     - any other element with a static `fz` or `size` of `"h1"`–`"h4"`.
   - **Arm B (legacy Tailwind).** A `className` string literal that contains `text-(2xl|3xl|4xl|5xl|6xl|title-…)`
     with no `sm:`/`md:`/`lg:`/`xl:` `text-` token in the same literal is a violation, unless its `path :: token` is
     in the baseline. A baseline entry that no longer matches is **stale**, and a stale entry fails.
   - **Printed scope, on every run.** The gate prints what it cannot see:
     - `font-size` in CSS modules or `theme.ts` `styles`;
     - a `className` composed across variables or `cn()` arguments;
     - `fz` passed through a variable not imported from `typography.ts`;
     - computed sizes (the GR-3c measurement stays binding).
   - **Exit codes.** It exits 0 when clean, 1 on a violation or a stale baseline entry, and 2 on a usage or parse
     error.
   - **`--verify-gate`.** It runs these in-memory arms and fails unless each one resolves as stated:
     1. static `<Title order={1}>` → fail;
     2. `<Title size="h3">` → fail;
     3. `<Title order={2} size="h4" fz={TITLE_FZ.h4}>` → pass;
     4. `<Title fz={{ base: 'h5', md: 'h3' }}>` → pass;
     5. `<Title order={5}>` → pass;
     6. `<Text fz="h2">` → fail;
     7. new `className="text-3xl"` → fail;
     8. `className="text-xl sm:text-2xl"` → pass;
     9. a baselined literal → pass;
     10. a stale baseline entry → fail.
5. **Encoding.** New files are UTF-8 without BOM. Use Node `fs` for any read-modify-write. Never use
   `Get-Content -Raw` without `-Encoding utf8`.
6. **No probe Stories.** R6 is a real loading state of a production component, not a gate probe.

## 11. Positive and negative flows

**Positive flow.** At 320px, a visitor opens a listing. The title renders at 20px, the "Similar listings" and
"Recently viewed" headings at 18px, and their loading placeholders at the same 18px. At 1440px everything is exactly
as today.

| Negative flow | Applicable | Expected | Evidence |
|---|---|---|---|
| A new static large `Title` is added later | **Yes** | the gate fails in CI | AC7 arms 1, 2 |
| A responsive `fz` is written inline instead of `TITLE_FZ` | **Yes** | passes (object literal); GR-3c review still checks its values | AC7 arm 4 |
| A legacy site is fixed or deleted | **Yes** | the stale baseline entry fails until it is removed | AC7 arm 10 |
| A new static Tailwind `text-2xl` | **Yes** | fails | AC7 arm 7 |
| Suspense fallback shape differs from the loaded content | **Yes** | same component, same responsive size, so no re-layout | AC3, AC5 |
| Long locale (`uk`/`sq`) heading at 320 wraps | **Yes** | wraps inside its container, with no horizontal scroll | O83-1 |
| Authorization/RLS, data, network | No | the task is presentational plus a static gate | — |

## 12. Acceptance criteria

- **AC1 [R1].** Given `typography.ts`, when read, `TITLE_FZ` equals the §4.1 table and contains no px/rem literal.
  `SECTION_HEADING_FZ`'s hash-relevant line is unchanged: show it with `git diff -U0` of the file.
- **AC2 [R2, R3, R4].** Given `node.exe scripts\check-type-responsive.mjs`, when run on the final tree, then:
  - Arm A reports **0** violations;
  - Arm B reports exactly the baselined L1–L8, with 0 stale entries and 0 new entries;
  - the gate exits 0;
  - the printed scope statement is present.
- **AC3 [R5].** Given `git --no-optional-locks grep -n --untracked "RecentlyViewedSkeleton" -- src`, when run, it
  returns no match. `ListingDetailView.tsx` renders `SimilarListingsSkeleton` in both fallbacks.
- **AC4 [R6].** Given `r-index.log` (the §13.2 index check), when read, `mantine-primitives-similarlistingsview--loading`
  exists. `check:story-coverage` exits 0.
- **AC5 [R2, R3, GR-3c].** Given `type-measure.log` (§13.2), when read, then every measured `Title` equals §4.1 for its
  key at 320, 390, 768, 1024 and 1440, within 0.5px. At 320 no heading is above 20px, and at every tuple no child
  heading is larger than its page title.
- **AC6 [R7, R8].** Given `package.json`, `governance-pr.yml` and `type-responsive-baseline.json`, when read, the two
  scripts and two CI steps exist, and the baseline has exactly 8 entries, each with a reason.
- **AC7 [R7].** Given `npm.cmd run check:type-responsive:verify`, when run, then all 10 arms print their expected
  outcome and the command exits 0. In addition, a **real** plant, made by adding
  `<Title order={1}>x</Title>` to `MantineDashboardHeader.tsx`:
  - makes `check:type-responsive` exit 1 and name that file;
  - is reverted afterwards, with the file's `git hash-object` equal before and after.
- **AC8 [R9].** Given the two doc diffs, when read, they only add the gate name and `TITLE_FZ`, and no GR-3c
  sentence is removed or weakened.
- **AC9 [all].** Given `npm run build`, when run on the final diff, it exits 0. Its transcript is retained with
  `git hash-object` of every changed file, captured in the same pass.

## 13. QA profile and verification plan

**Q3 Full Visual Matrix.** It is selected because the task changes rendered typography across ten Stories and many
routes (high-risk responsive work) and adds a Storybook export and a governance gate. It is not `Q4`: no critical
flow, grant or write path changes.

### 13.1 I0

```powershell
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"
git --no-optional-locks status --short
git --no-optional-locks hash-object src/design-system/mantine/typography.ts src/modules/listings/components/ListingDetailView.tsx src/modules/listings/components/RecentlyViewedSection.tsx src/stories/mantine/primitives/SimilarListingsView.stories.tsx
```

Expected: `win32`. Retain the status snapshot and the hashes as the pre-write witness. Then run your census script
(§10.1) and retain its output.

### 13.2 Final gate block

Run from the project root in Windows PowerShell:
- each command writes to its own log under `docs/sessions/evidence/task886/` and appends its `EXIT_CODE`;
- normalise the `Tee-Object` files to UTF-8 without BOM through Node.

```powershell
$ev = "docs\sessions\evidence\task886"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\platform.log"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\typecheck.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\typecheck.log"
npm.cmd run lint *>&1 | Tee-Object "$ev\lint.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\lint.log"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\check-type-responsive.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-type-responsive.log"
npm.cmd run check:type-responsive:verify *>&1 | Tee-Object "$ev\check-type-responsive-verify.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-type-responsive-verify.log"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\check-design-tokens.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-design-tokens.log"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\check-story-coverage.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-story-coverage.log"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\check-rendered-scope.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-rendered-scope.log"
npm.cmd run check:pattern-enrolment *>&1 | Tee-Object "$ev\check-pattern-enrolment.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-pattern-enrolment.log"
node.exe scripts\check-surface-census-changed.mjs --base HEAD *>&1 | Tee-Object "$ev\census-changed.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\census-changed.log"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\check-file-integrity.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-file-integrity.log"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\check-mojibake.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-mojibake.log"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\build-storybook.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\build-storybook.log"
node.exe -e "const r=require('./storybook-static/index.json');console.log(Object.keys(r.entries).filter(k=>k==='mantine-primitives-similarlistingsview--loading').join('\n')||'MISSING')" *>&1 | Tee-Object "$ev\r-index.log"
npm.cmd run build *>&1 | Tee-Object "$ev\build.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\build.log"
git --no-optional-locks diff --stat | Tee-Object "$ev\diff-stat.log"
git --no-optional-locks status --short | Tee-Object "$ev\git-status.log"
```

Then, in the same pass:
1. Capture `git hash-object` of every changed and new file listed in §7 into `hash-object.log`.
2. Run the AC7 real-plant probe with its before/after hash witness, and write it to `plant.log`.
3. Measure computed font sizes with a throwaway Playwright probe under `.artifacts/`, against `storybook-static`.
   Record the `getComputedStyle(el).fontSize` of every `h1`–`h4` `Title` rendered by each of these Stories, in `en`,
   at 320, 390, 768, 1024 and 1440:
   - `AuthFormPattern`, `DashboardHeader`, `ListingDetailPattern`, `PageHeaderWithActions`, `TwoColumnForm`,
     `ResetPasswordView`, `ListingDetailView`, `RecentlyViewedGridView`, `SimilarListingsView` (including `Loading`)
     and `CmsPageView`;
   - write one line per tuple to `type-measure.log`.

   If a site in §3.1 is not rendered by any state of its Story, say so, and extend that Story's existing file with
   the missing state. Do not create a new Story file.

Expected result:
- every command ends `EXIT_CODE=0`, except that `check:i18n-hardcode` is not in this block;
- `census-changed.log` adds no new blocking node;
- `r-index.log` prints the Loading id;
- `type-measure.log` matches §4.1.

### 13.3 OWNER VISUAL QA REQUIRED — O83-1

```powershell
npm.cmd run storybook
```

Open each Story and record **accepted** or **returned with a concrete defect** for every tuple below.

1. `Patterns/Mantine/ListingDetailPattern`, `PageHeaderWithActions` × `en` × 320 / 768 / 1024 / 1440.
2. `AuthFormPattern`, `TwoColumnForm`, `ResetPasswordView`, `DashboardHeader` × `en` × 320 / 1440.
3. `ListingDetailView` × `en` / `uk` × 320 / 1440.
4. `Mantine/Primitives/RecentlyViewedGridView`, `SimilarListingsView` (incl. `Loading`) × `en` × 320 / 1440.

## 14. Completion report contract

Report, in this order:
1. A changed-files table that matches the real diff.
2. R1–R9, each with its evidence path.
3. The I0 census against §3.1 and §3.2, including any §5.4 additions.
4. Every §13.2 command with its actual exit code.
5. The 10 self-test arm lines.
6. `plant.log` with its hash witness.
7. `type-measure.log`, summarised per key.
8. The hash list.
9. Assumptions, deviations, known limitations and unresolved issues.

Emit these receipts:
- `GR-0` and `GR-3a`, as executed;
- `GR-1`, per changed file;
- `GR-2`, for `check:type-responsive`: what it cannot see;
- `GR-3`, for `SimilarListingsSkeleton` ← `SimilarListingsView.stories.tsx`;
- `GR-3b`, for the changed Story;
- `GR-3c TYPE RESPONSIVE CHECK`, one per Story in §13.2.

Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Update the 886
cell of `docs/backlog.md` with concise state only, and write the session log. No mutating git.

## 15. Task quality gate

- **Executable by a fresh Sonnet session:** yes. Every site has a path, a line, an order and a size. The scale is a
  table, and the gate has a written contract and ten arms.
- **Exactly one active route:** yes. `TITLE_FZ` was chosen, and the global remap is recorded as rejected (§5.1).
- **Every requirement maps to an AC:** R1→AC1 · R2/R3/R4→AC2/AC5 · R5→AC3 · R6→AC4 · R7→AC6/AC7 · R8→AC2/AC6 ·
  R9→AC8 · all→AC9.
- **No static absolute AC:** measurement tolerance is 0.5px. The baseline count is a set compared by content.
- **The gate can fail:** ten in-memory arms plus one real plant, with a hash witness.
- **The gate prints its blind spots on every run (GR-2):** §10.4.
- **Legacy sites neither excluded silently nor patched against §15:** they are baselined, with owners named (§3.2),
  and O83-2 decides the rest.
- **Sprint assignment:** Sprint 83, opened in the same edit. Its goal-fit table rules out every open sprint.

---

**FACTS:** §3.1–§3.3. They were measured in this session: the scanner output, the skeleton `diff`, the Mantine
resolver source and the `theme.ts` lines.
**INFERENCES:** that keeping `size` plus a responsive `fz` renders `fz` at every width. The resolver and style-prop
precedence support this, and §13.2's measurement is the proof.
**UNKNOWNS:** whether every §3.1 site is rendered by a current Story state. §13.2 requires extending the Story if not.
**CONFLICTS:** None.
