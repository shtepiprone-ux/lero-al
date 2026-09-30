# Task 886 — every Mantine heading steps down on a phone, through one scale, and a gate keeps it that way

Sprint 83 · P1 · QA profile **Q3** (site-wide responsive typography + a new blocking governance gate) · **after 869 is
approved** · **after 853 is approved** (added 2026-09-26 by 853 review 1, §3.1a) · owner actions **O83-1**, **O83-2**,
**O83-3**, **O83-4** · **Status: `NEEDS REVISION` — review 4, 2026-09-30. The owner returned O83-1 rows 1 and 4.
Start at §18 (Revision 3); it overrides every earlier section it names. §16–§17 are implemented and kept.**

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

### 3.1a Addendum — Task 853 review 1 (2026-09-26): S2 moves to 853, S17 found, L1 removed

- **Census miss, S17.** `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx:139` renders the KPI value
  as `<Text fz={theme.headings.sizes.h3.fontSize} …>`, a static **30 px** at every width (measured on
  `patterns-mantine-admindashboardview--default`, 320–1440). §3.1's "no non-`Title` element has a static size of
  `h1`–`h4`" is false for this site: the scanner reads literal keys, and this is a theme expression. §10's gate must
  handle it too. `fz` bound to a `theme.headings.sizes.*` expression is a static large size, and the gate must fail
  it. Add that as a `--verify-gate` arm.
- **853 edits S2 and S17 before this task** (853 §16, R12), because `AdminDashboardView` is their only production
  consumer:
  - S2 (`MantineDashboardHeader.tsx:56`) becomes `fz={{ base: 'h5', sm: 'h4' }}`, which is 20 / 24 / 24 / 24. This
    is deliberately **not** `TITLE_FZ.h4`: that row's 18 px base would put the page title under the 20 px card titles
    on the same page (853 §16.4). Leave it as an inline responsive object; the gate accepts one (arm 4).
  - S17 becomes `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}`. This task converts it to `fz={TITLE_FZ.h3}`, which has
    the same values.
- **L1 is gone.** 853 replaced `src/app/admin/page.tsx` with a thin server component. The `text-2xl` at `:113` no
  longer exists, so it must not enter the legacy baseline; a stale entry would fail the gate.
- **I0 re-check.** If 853 has not been committed when this task starts, stop. Those paths are 853's uncommitted
  work, and this task must neither edit nor stage them.

### 3.2 The legacy Tailwind census (L1–L8)

**Revision 1 (review 1, 2026-09-30):** L2 is also gone — Task 877 (`848611017`) rewrote `AdminPageHeader.tsx` as an
adapter, and the reviewer's grep finds no `text-2xl`/`text-3xl` in it. The live set is **L3–L8, six entries** (§16.2).

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
| **R9** | governance | Update the docs:<br>• `docs/golden-rules.md`: the GR-3c row of the Enforcement table names `check:type-responsive` (Task 886) and its blind spots — **Revision 1: applied by Opus at approval closure, not by Sonnet (§16.2)**;<br>• `docs/mantine-responsive-design-system.md` §7: the P0 responsive-type row names `TITLE_FZ`.<br>No rule text is narrowed. | P2 | AC8 | Confirmed |

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
- `docs/mantine-responsive-design-system.md` (the §7 GR-3c row only) (R9). *(Revision 1: `docs/golden-rules.md` is
  removed from this list — Opus applies that half of R9, §16.2.)*
- Revision 1 additions (§16.3): `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` (R10, the `fz` line
  and the import only); `src/stories/patterns/mantine/AuthFormPattern.stories.tsx`,
  `PageHeaderWithActions.stories.tsx`, `TwoColumnForm.stories.tsx`, `ListingDetailPattern.stories.tsx`,
  `ListingDetailView.stories.tsx` (R11, R12)
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
- Any change to a Story other than R6's one export **and the Story edits Revision 1 lists in §16.3 (R11, R12)**.
- `docs/golden-rules.md`: **read-only for Sonnet** (`execute-task` → "Absolute policy-file boundary"). R9's
  golden-rules half moves to Opus (§16.2).

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
  - Arm B reports exactly the baselined L3–L8 (six entries; amended by Revision 1, §16.2), with 0 stale entries and
    0 new entries;
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
  scripts and two CI steps exist, and the baseline holds exactly the L3–L8 set (six entries, each with a reason;
  amended by Revision 1, §16.2).
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

**Revision 1:** every row below carries a GR-3d line in §16.4. The reviewer hands the matrix to the owner only after
§16.4's four wraps are measured and O83-3 is decided.

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

---

## 16. Revision 1 — review 1, 2026-09-30 (`NEEDS REVISION`)

This section overrides every earlier section it names. The first pass (session
`docs/sessions/2026-09-30-task886-responsive-heading-scale.md`) is **kept**: the reviewer re-ran
`check:type-responsive` (298 files, Arm A 0, Arm B 6/0/0, exit 0) and `:verify` (12/12, exit 0) natively, and measured
every production `Title` in the owner-matrix Stories at 320/390/768/1024/1440 against §4.1 with an independent
Playwright probe. All of them match. What fails is the Stories the owner will review, one gate contract clause, and
one evidence artifact.

### 16.1 Re-entry mode — `remediation`

- **Start at I0-R (§16.5), then R10 → R11 → R12 → R13 → R14 → R15, then the §16.5 gate block.**
- **Keep, do not rewrite:** R1–R8 as shipped — `TITLE_FZ`, the 15 `Title` sites and `CmsPageView`, the skeleton
  de-duplication, the `Loading` export, the gate, its baseline (six entries), the two scripts, the two CI steps and the
  `mantine-responsive-design-system.md` row. Edit `scripts/check-type-responsive.mjs` only as R13 says.
- **Do not overwrite** any first-pass file in `docs/sessions/evidence/task886/`. Revision evidence goes to
  `docs/sessions/evidence/task886/rev1/`. Append a `## Revision 1` section to the existing session log.
- **Not yours:** `scripts/check-hydration-console.mjs`, `docs/critical-flow-registry.md`, and every Task 888 file.

### 16.2 Findings from review 1, and what changes

| # | Severity | Evidence (reviewer, 2026-09-30) | Correction |
|---|---|---|---|
| F1 | **P1** GR-3d | Owner-matrix Stories with `skipCanvas: true` and no `StoryPageGutter`. The reviewer measured edge gaps: `PageHeaderWithActions--default` **0/0** at every width (full bleed); `TwoColumnForm--default` **0/0**; `AuthFormPattern--default` **40** at 320, from gutters written in the Story (`Stack p="md"` `:45`, `Center p="xl"` `:46`/`:49`/`:65`); `ListingDetailPattern--default` 16 at 1024/1440 (expected 32), from `SECTION_STYLE`, a `style` object. The first pass emitted a GR-3d receipt for `Loading` only; `execute-task` item 7 makes every owner-matrix Story blocking. The first kickoff predates GR-3d (2026-09-29) and carried no GR-3d line per matrix row — an orchestrator defect, corrected in §16.4. | R11 |
| F2 | **P1** GR-3c | `AuthFormPattern--auth-card` renders its own `<Title order={2} size="h3">` (`AuthFormPattern.stories.tsx:68`) at **30px at 320**. It is in the owner matrix (§13.3 item 2). The §8 "no other Story change" line blocked the fix; that line is amended. | R12 |
| F3 | **P2** gate contract | §10.4 says the gate exits **2 on a parse error**. The shipped gate counts an opening tag it cannot close, prints the count, **skips the tag and exits 0**. The reviewer reproduced a false negative in memory: in `<Title order={5} title=" //x">`, `stripComments` blanks the rest of the line from ` //`, the tag no longer closes, and it is skipped. Today's tree has 0 such tags, so there is no live miss, but the gate can go blind silently. | R13 |
| F4 | **P2** AC9 | `docs/sessions/evidence/task886/hash-object.log` holds 18 **paths and no hashes**. AC9 and the §13.2 hash requirement are unmet. (The build log at 12:42 is later than every source edit, 12:33–12:37, so the build itself is fresh — an inference from mtimes, not a hash witness.) | R14 |
| F5 | P3 kickoff defect | §3.1a says 886 converts S17 (`MantineDashboardStatCard.tsx`) to `TITLE_FZ.h3`; §7 omitted the file, so the executor correctly left it. Its inline object duplicates `TITLE_FZ.h3` exactly, against objective 2 ("no site picks its own steps"). | R10 |
| F6 | P3 gate scope | The printed scope does not state two blind spots the reviewer measured: an `fz` object literal is accepted without checking its values (`fz={{ base: 'h2' }}` passes), and `size`/`fz` written as another expression is not read as static (`<Title order={5} size={'h3'}>` passes). | R13 |
| F7 | NEEDS VERIFICATION | Reserved **901** (`docs/backlog-reserved.md`): `/en/auth/login` logged an attribute hydration mismatch under `next dev`, measured with this task's uncommitted `MantineAuthFormPattern.tsx` in the tree. Its row hands the finding to this review if it does not reproduce on `HEAD`. Not attributed yet. | R15 |

**Kickoff defects corrected by Opus in this revision (no executor action):**
- **AC2/AC6: six baseline entries, not eight.** The executor was right: L2 (`AdminPageHeader.tsx`) has no `text-2xl`
  after Task 877, re-measured by the reviewer. §3.2, AC2 and AC6 now say L3–L8.
- **§3.2 existed only as a reference.** The heading is now in the file, above the L-table.
- **R9's `docs/golden-rules.md` half is Opus's.** That file is read-only for Sonnet. Opus applies the GR-3c
  Enforcement-row wording (session log §9.2 proposal) at approval closure. §7 and §8 are amended.

**Known, out of scope, recorded (not in the owner matrix, not changed by 886):** Story-fixture `Title`s at 24px or
more with no responsive `fz` — `src/stories/patterns/mantine/HomeSection.stories.tsx:38/44/50` (`order={3}`, 30px),
`src/stories/mantine/primitives/ListingCard.stories.tsx:120/129` and
`src/stories/patterns/mantine/ListingCardPattern.stories.tsx:226/246` (`order={4}`, 24px). The gate excludes Stories
and says so. Opus files them at 886's closure. Also out of scope: the four `globals.viewport` pins in
`ListingDetailView.stories.tsx` (`:178/:190/:202/:217`). 886 does not change that Story, it is a default-canvas Story,
and its state rework belongs to reserved **800**.

### 16.3 Revision requirements

| ID | Finding | Observable requirement | P | AC |
|---|---|---|---|---|
| **R10** | F5 | **Withdrawn by §17.6 (R17 reverts it).** `MantineDashboardStatCard.tsx:184`: `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}` becomes `fz={TITLE_FZ.h3}`, with the `TITLE_FZ` import. Nothing else in the file changes (the `lh` expression stays). | P3 | AC10 |
| **R11** | F1 | Wrap the page content of every export of these four Stories in `<StoryPageGutter>` (`src/stories/_StoryPageGutter.tsx`), and delete every gutter the Story writes itself:<br>• `PageHeaderWithActions.stories.tsx` `Default`;<br>• `TwoColumnForm.stories.tsx` `Default`;<br>• `AuthFormPattern.stories.tsx` `Default` and `AuthCard`: remove `p="md"` from the `Stack` and `p="xl"` from every `Center` (`Center` stays for centring, `Stack gap="xl"` stays);<br>• `ListingDetailPattern.stories.tsx` `Default`: delete `SECTION_STYLE` and its `CSSProperties` import; each `<div style={SECTION_STYLE}>` becomes `<Box pt={theme.other.layout.listingContactStickyOffset}>`, with `const theme = useMantineTheme()` in the `render` (precedent: `GalleryDesktopNavigation.stories.tsx:31`). The token is `theme.ts:798` `listingContactStickyOffset: 80`, the sticky offset the comment above `SECTION_STYLE` already cites, consumed by `MantineListingContactPattern.tsx:126`. Keep that comment, re-pointed at the token. `SlotDemoCard`'s `style={{ textAlign: 'center' }}` becomes `ta="center"` on its `Text` (GR-3b: a changed Story carries no `style` object).<br>No other line in these files changes. | P1 | AC11 |
| **R12** | F2 | `AuthFormPattern.stories.tsx` `AuthCard`: the `Title` gains `fz={TITLE_FZ.h3}` (import `TITLE_FZ`). | P1 | AC12 |
| **R13** | F3, F6 | `scripts/check-type-responsive.mjs`:<br>• an opening tag the scanner cannot close is a **parse error**: print `ERROR  <path>:<line>  opening <Name> tag could not be closed — the gate cannot classify it` for each, and exit **2** (§10.4), before any PASS line;<br>• `evaluateGateExitCode` takes the unparsed count and returns 2 for it (a finding alone returns 1; a parse error wins over a finding);<br>• self-test **Arm 13**: an unclosable tag (e.g. `export const A = () => <Title order={2}` with no `>`) resolves to a parse error; Arm 12's wiring check adds the `unparsed → 2` case; the header line says "13 arms + exit wiring";<br>• the printed "Cannot see" list gains two lines: *an `fz` object literal is accepted without checking its values (the GR-3c measurement closes it)*; *`size`/`fz` written as any other expression (e.g. `size={'h3'}`, a ternary) is not read as static*.<br>No other behaviour changes. | P2 | AC13 |
| **R14** | F4 | The final hash witness is one `<hash>  <path>` line per file in the §16.5 list, captured in the same pass as the gate block. | P2 | AC14 |
| **R15** | F7 | A/B the `/en/auth/login` hydration warning (§16.5 step 4). Record the full console text of each arm. If the mismatch appears with 886's `MantineAuthFormPattern.tsx` and **not** with its `HEAD` content, stop and report `BLOCKED — 886 HYDRATION` with the attribute named; do not attempt a fix. Otherwise record the result; 901 stays Opus's to dispose. | P2 | AC15 |

### 16.4 Owner-matrix GR-3d lines (the lines §13.3 lacked), and O83-3

| §13.3 Story | GR-3d |
|---|---|
| `Patterns/Mantine/ListingDetailPattern` | **wrap in this task** (R11) |
| `Patterns/Mantine/PageHeaderWithActions` | **wrap in this task** (R11) |
| `Patterns/Mantine/AuthFormPattern` (`Default`, `AuthCard`) | **wrap in this task** (R11) |
| `Patterns/Mantine/TwoColumnForm` | **wrap in this task** (R11) |
| `Patterns/Mantine/DashboardHeader` | profile present (reviewer measured 16/16/32/32) |
| `Patterns/Mantine/ListingDetailView` | n/a: default canvas |
| `Mantine/Primitives/RecentlyViewedGridView`, `SimilarListingsView` (incl. `Loading`) | n/a: `MantineStoryShell` primitive |
| `Patterns/Mantine/ResetPasswordView` | **n/a: View carries the page gutter** (`src/modules/auth/components/ResetPasswordView.tsx`, `Center mih="60vh" p="md"`) — owner O83-3 = (b), 2026-09-30. Make no edit to this Story. **Review 2: the `Loading` export fails condition 1 and is wrapped — §17.2 R16.** |

**O83-3 — DECIDED 2026-09-30, owner verbatim: *"Моє рішення (b)"*.** The exemption is now in `docs/golden-rules.md`
GR-3d ("Page-level View exemption", three conditions). The executor makes **no** edit to `ResetPasswordView.stories.tsx`,
measures it per §16.5 step 2, and emits `GR-3d STORY GUTTER CHECK — <story id>: StoryPageGutter n/a: View carries the
page gutter (src/modules/auth/components/ResetPasswordView.tsx:<line of each Center p="md">); edge gap 320 · 390 · 1024 ·
1440 …; gutter written in the Story: NONE.` for every export that renders the page. The `Loading` export renders
the View's own page root too; if any export's gap is not 16 at 320/390 and at least 32 at 1024/1440, report it —
that export is then not exempt. The decision record below is kept for provenance.

**Decision record — O83-3 (scoped to `ResetPasswordView.stories.tsx` only).** The Story is `skipCanvas` with no `StoryPageGutter`, so GR-3d's literal text requires the wrapper. But the
production View already carries the page gutter itself (`ResetPasswordView.tsx` renders `Center mih="60vh" p="md"`):
the reviewer measured 16/16 at 320/390, and the card sits centred at 184/312/520 at 768/1024/1440. Wrapping it doubles
the phone gutter to 32. GR-3d lets no agent reinterpret it, so the owner chooses:
- **(a)** wrap it anyway: the 320/390 edge gap becomes 32, not the profile's 16. Unlocks: a one-line wrap in a later
  revision, re-measured.
- **(b) (recommended)** record a GR-3d exemption for a page-level View whose production root already carries the page
  gutter, written verbatim into `docs/golden-rules.md` by Opus. Unlocks: no Story edit; the receipt reads
  `n/a: View carries the page gutter (O83-3)` with the measured values.
- **(c)** move the page padding out of the production View into its route, then wrap the Story. Unlocks: a separate
  production task on `/auth/reset-password`, outside 886.

*(Superseded 2026-09-30 by the owner's decision above: the `pending O83-3` receipt no longer applies.)*

### 16.5 Revision verification plan

**I0-R**, before any write:

```powershell
$ev = "docs\sessions\evidence\task886\rev1"
New-Item -ItemType Directory -Force $ev
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\i0.log"
git --no-optional-locks status --short | Tee-Object -Append "$ev\i0.log"
git --no-optional-locks hash-object src/design-system/mantine/patterns/MantineDashboardStatCard.tsx src/stories/patterns/mantine/AuthFormPattern.stories.tsx src/stories/patterns/mantine/PageHeaderWithActions.stories.tsx src/stories/patterns/mantine/TwoColumnForm.stories.tsx src/stories/patterns/mantine/ListingDetailPattern.stories.tsx scripts/check-type-responsive.mjs src/design-system/mantine/patterns/MantineAuthFormPattern.tsx | Tee-Object -Append "$ev\i0.log"
```

Expected: `win32`, and the 886 paths still modified as the first pass left them (`MantineAuthFormPattern.tsx` =
`e47cef761dfb8f4c32a99e477ddea66f8be4c9b7`, `check-type-responsive.mjs` = `8555e07158184dfa02271417098598901a80dcf0`,
the reviewer's hashes). A different hash is `TASK SPECIFICATION CONTRADICTION`: stop.

**Final gate block** (normalise every `Tee-Object` file to UTF-8 without BOM through Node afterwards):

```powershell
$ev = "docs\sessions\evidence\task886\rev1"
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
npm.cmd run build *>&1 | Tee-Object "$ev\build.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\build.log"
git --no-optional-locks diff --stat | Tee-Object "$ev\diff-stat.log"
git --no-optional-locks status --short | Tee-Object "$ev\git-status.log"
$files = @("src/design-system/mantine/typography.ts","src/design-system/mantine/patterns/MantineAuthFormPattern.tsx","src/design-system/mantine/patterns/MantineListingDetailPattern.tsx","src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx","src/design-system/mantine/patterns/MantineTwoColumnForm.tsx","src/design-system/mantine/patterns/MantineDashboardStatCard.tsx","src/modules/auth/components/ResetPasswordView.tsx","src/modules/cms/components/CmsPageView.tsx","src/modules/listings/components/ListingDetailView.tsx","src/modules/listings/components/RecentlyViewedGridView.tsx","src/modules/listings/components/RecentlyViewedSection.tsx","src/modules/listings/components/SimilarListingsView.tsx","src/stories/mantine/primitives/SimilarListingsView.stories.tsx","src/stories/patterns/mantine/AuthFormPattern.stories.tsx","src/stories/patterns/mantine/PageHeaderWithActions.stories.tsx","src/stories/patterns/mantine/TwoColumnForm.stories.tsx","src/stories/patterns/mantine/ListingDetailPattern.stories.tsx","scripts/check-type-responsive.mjs","scripts/type-responsive-baseline.json","package.json",".github/workflows/governance-pr.yml","docs/mantine-responsive-design-system.md")
foreach ($f in $files) { "$(git --no-optional-locks hash-object $f)  $f" | Tee-Object -Append "$ev\hash-object.log" }
```

Expected: every log ends `EXIT_CODE=0`; `census-changed.log` adds no new blocking node; `hash-object.log` has 22
lines of `<40-hex>  <path>`.

Then, in the same pass:
1. **R13 real plant, two arms, hash-witnessed** (Node read/write only, never `Get-Content -Raw`), into
   `$ev\plant.log`: (i) append `export const P = () => <Title order={2}` (no `>`) to
   `src/design-system/mantine/patterns/MantineDashboardHeader.tsx` → `check:type-responsive` exits **2** and names that
   file; restore → exit 0, `git hash-object` equal before/after; (ii) repeat the first pass's
   `<Title order={1}>x</Title>` plant → exit **1**; restore, hashes equal.
2. **GR-3b/3c/3d measurement** with a throwaway Playwright probe under `.artifacts/`, against `storybook-static`, `en`:
   every export of the four R11 Stories plus `ResetPasswordView` and `DashboardHeader`, at 320/390/768/1024/1440. Per
   tuple, write to `$ev\story-measure.log`: the `fontSize` of every `h1`–`h4`, the left/right edge gap of the first
   page-content box, and horizontal overflow. Expected: fonts per §4.1 (AuthCard `h2` 20/20/30/30/30); edge gap
   16/16/32/32 at 320/390/1024/1440 for the four R11 Stories; no overflow.
3. Run this and write its output to `$ev\story-grep.log`; expected: no match.

   ```powershell
   git --no-optional-locks grep -n -E "SECTION_STYLE|style=\{|p=.(md|xl)." -- src/stories/patterns/mantine/AuthFormPattern.stories.tsx src/stories/patterns/mantine/ListingDetailPattern.stories.tsx src/stories/patterns/mantine/PageHeaderWithActions.stories.tsx src/stories/patterns/mantine/TwoColumnForm.stories.tsx
   ```
4. **R15 A/B** into `$ev\hydration-ab.log`. Start `npm.cmd run dev` in the background and wait until it serves. With a
   throwaway Playwright probe under `.artifacts/`, open `http://localhost:3000/en/auth/login` in a fresh context, wait
   for `networkidle` plus 2 s, and record **every** console message in full. Arm X: the current tree. Arm Y: write the
   output of `git show HEAD:src/design-system/mantine/patterns/MantineAuthFormPattern.tsx` over the file through Node,
   wait for the dev rebuild, and record again in a fresh context. Then restore the 886 content through Node and prove
   its `git hash-object` equals the I0-R value. Stop the dev server.

### 16.6 Revision acceptance criteria

`GR-4 AC AUDIT — 6 revision criteria; each states an observable property; absolutes: none.`

- **AC10 [R10].** `git diff -U0 -- src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` shows only the
  `fz` line and the import; `check-type-responsive.log` still reports Arm A 0.
- **AC11 [R11].** `story-measure.log` shows edge gaps of 16/16/32/32 (±1px) at 320/390/1024/1440 for every export of
  the four R11 Stories, and no horizontal overflow. `story-grep.log` has no match. The session log carries one GR-3b
  and one GR-3d receipt per changed Story, and the `n/a: View carries the page gutter` receipt per `ResetPasswordView`
  export (O83-3 = (b)), with its measured gaps.
- **AC12 [R12].** `story-measure.log`: `authformpattern--auth-card` `h2` measures 20 at 320/390 and 30 at
  768/1024/1440.
- **AC13 [R13].** `check-type-responsive-verify.log` shows 13 arms plus the exit wiring, all PASS, exit 0.
  `plant.log` shows arm (i) exit 2 naming the file and arm (ii) exit 1, each restored with equal hashes. The printed
  scope has the two new lines.
- **AC14 [R14].** `hash-object.log` has one `<40-hex>  <path>` line per listed file.
- **AC15 [R15].** `hydration-ab.log` holds both arms' full console text and the restore hash check, and the session log
  states which outcome occurred (886-only, both arms, or neither).
- **AC1–AC9** stand as amended (AC2/AC6: six entries). AC9 is re-proved by `rev1\build.log` together with AC14.

### 16.7 Completion report for Revision 1

Append `## Revision 1` to the session log with:
- a Files Changed table for this revision;
- R10–R15, each with its evidence path;
- every §16.5 command with its exit code;
- the 13 arm lines, `plant.log`, and `story-measure.log` summarised per Story;
- the A/B outcome;
- receipts: GR-0 for R11's token reuse (`REUSE theme.other.layout.listingContactStickyOffset`), GR-3b, GR-3c and
  GR-3d per changed Story, and GR-2 for the gate's two new scope lines.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Update the 886 cell of
`docs/backlog.md` with concise state only. No mutating git.

---

## 17. Revision 2 — review 2, 2026-09-30 (`NEEDS REVISION`)

This section overrides every earlier section it names. Revision 1 is **kept**. The reviewer re-ran
`check:type-responsive` (298 files, Arm A 0, Arm B 6/0/0, 0 unclosable, exit 0) and `:verify` (13 arms, exit 0) in
native PowerShell. All 22 `rev1/hash-object.log` hashes equal the current tree. An independent Playwright probe
measured every export of the four R11 Stories and all four `DashboardHeader` exports: 16/16/32/32 at 320/390/1024/1440,
fonts per §4.1, no overflow. Every `ResetPasswordView` export except `Loading` measures 16/16 on the View's own
`Center p="md"` box, with the card centred. One Story fails GR-3d, and one kickoff instruction was wrong.

### 17.1 Findings from review 2

| # | Severity | Evidence (reviewer, 2026-09-30) | Correction |
|---|---|---|---|
| F8 | **P2** GR-3d | `patterns-mantine-resetpasswordview--loading` (`ResetPasswordView.stories.tsx:55`) has no `StoryPageGutter` and is not exempt. The View's `loading` branch (`ResetPasswordView.tsx:51-55`) renders `<Center mih="60vh">` with **no** `p="md"`, so the production root carries no gutter, and O83-3 condition 1 fails. The reviewer's probe finds no padded box in that export at any width; the loader sits 138/173/490/698 px from each edge. GR-3d is explicit: *"A View that fails any condition is not exempt, and it is wrapped as usual."* The executor reported this correctly (session log R1-5 item 1). No owner decision is needed: the rule already gives the route. Adding `p="md"` to the production branch is **rejected**: it changes a production View only to satisfy a Story rule, and it has no visible effect. | R16 |
| K1 | kickoff defect (Opus) | §16.5 step 3's regex `p=.(md\|xl).` also matches the tail of `gap="xl"` and `gap="md"`. So its "expected: no match" could not hold for the Stories R11 keeps (`Stack gap="xl"`). The executor's three lines are two `gap=` false positives and `SlotDemoCard`'s `Paper p="xl"`, which is the card's inner padding, not a page gutter. No executor action is needed on those lines. | §17.3 step 2 |

**Notes, no action:**
- The `listingdetailpattern--default` gallery strip has leaves past the viewport at 320/390. The page does not overflow
  (`scrollWidth ≤ clientWidth` in both probes); these are carousel slides clipped by the strip.
- The `<StoryPageGutter>` block in `ListingDetailPattern.stories.tsx` is not re-indented. Leave it as it is: lint is
  clean, and re-indenting would churn about 130 lines.
- R15: neither A/B arm reproduced a hydration warning. Opus disposes of reserved **901** at 886's closure, citing
  `rev1/hydration-ab.log`.

### 17.2 Revision requirement

| ID | Finding | Observable requirement | P | AC |
|---|---|---|---|---|
| **R16** | F8 | In `src/stories/patterns/mantine/ResetPasswordView.stories.tsx`, the `Loading` export's `render` wraps `<ResetPasswordView pageState="loading" … />` in `<StoryPageGutter>`, imported from `@/stories/_StoryPageGutter`. **No other export changes**: they stay exempt under O83-3. Do not touch `ResetPasswordView.tsx`, and do not write a gutter in the Story. | P2 | AC16 |

Scope (amends §7): `src/stories/patterns/mantine/ResetPasswordView.stories.tsx`, for R16 only. Its edit amends §16.4's
"Make no edit to this Story" for this export only.

### 17.3 Revision verification plan — re-entry `remediation`

- Start at I0-R2, then R16, then the gate block.
- Evidence goes to `docs/sessions/evidence/task886/rev2/`. Do not overwrite anything in `task886/` or `task886/rev1/`.
- Append `## Revision 2` to the session log.

**I0-R2**, before any write:

```powershell
$ev = "docs\sessions\evidence\task886\rev2"
New-Item -ItemType Directory -Force $ev
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\i0.log"
git --no-optional-locks status --short | Tee-Object -Append "$ev\i0.log"
git --no-optional-locks hash-object src/stories/patterns/mantine/ResetPasswordView.stories.tsx scripts/check-type-responsive.mjs src/stories/patterns/mantine/AuthFormPattern.stories.tsx src/stories/patterns/mantine/ListingDetailPattern.stories.tsx | Tee-Object -Append "$ev\i0.log"
```

Expected: `win32`, and these reviewer-measured hashes:
- `ResetPasswordView.stories.tsx` = `14809fd64f43d97bc940177e3a30da4ecf5c0e48` (R16 already applied; **superseded by §17.7**, which replaced the original `cae86b5a…` = `HEAD` value);
- `check-type-responsive.mjs` = `959e73ab5200d35bce8908a163a2af2389ea09b4`;
- `AuthFormPattern.stories.tsx` = `9a3bd0c642bf81e70983c76a754a039297180747`;
- `ListingDetailPattern.stories.tsx` = `c2c5d744d34e0c7c1f52b786bf7f4d6804c20d72`.

A different hash is `TASK SPECIFICATION CONTRADICTION`: stop.

**Final gate block:** run §16.5's block unchanged, with two changes:
- set `$ev = "docs\sessions\evidence\task886\rev2"`;
- add `"src/stories/patterns/mantine/ResetPasswordView.stories.tsx"` to `$files`, so `hash-object.log` has **23**
  lines of `<40-hex>  <path>`.

Normalise every `Tee-Object` file to UTF-8 without BOM through Node afterwards. Every log must end `EXIT_CODE=0`, and
`census-changed.log` must add no new blocking node. **No plant is re-run:** the gate script is unchanged, and the
I0-R2 hash proves it.

Then, in the same pass:
1. **Measurement.** Use a throwaway Playwright probe under `.artifacts/`, against the rebuilt `storybook-static`, in
   `en`. Measure every export of `Patterns/Mantine/ResetPasswordView` and of the four R11 Stories, at
   320/390/768/1024/1440, and write the results to `$ev\story-measure.log`. Per tuple, record:
   - the `fontSize` of every `h1`–`h4`;
   - the left/right edge gap of the first box with horizontal padding;
   - horizontal overflow.

   Expected:
   - `resetpasswordview--loading`: 16/16/32/32 at 320/390/1024/1440, from `StoryPageGutter`;
   - the other seven `ResetPasswordView` exports: unchanged, 16/16 on the View's own `Center p="md"` at every width;
   - the four R11 Stories: unchanged from `rev1/story-measure.log`;
   - no overflow anywhere.
2. **Grep.** This replaces §16.5 step 3, whose regex was wrong (K1). Write the output to `$ev\story-grep.log`.

   ```powershell
   git --no-optional-locks grep -n -E "SECTION_STYLE|style=\{|[[:space:]](p|px|py)=.(md|xl)." -- src/stories/patterns/mantine/AuthFormPattern.stories.tsx src/stories/patterns/mantine/ListingDetailPattern.stories.tsx src/stories/patterns/mantine/PageHeaderWithActions.stories.tsx src/stories/patterns/mantine/TwoColumnForm.stories.tsx src/stories/patterns/mantine/ResetPasswordView.stories.tsx
   ```

   Expected: exactly one line, `ListingDetailPattern.stories.tsx` `SlotDemoCard` `<Paper … p="xl" …>` (the card's
   inner padding, allowed). Any other line is a finding: report it; do not edit around it.

### 17.4 Revision acceptance criteria

`GR-4 AC AUDIT — 2 revision criteria; each states an observable property; absolutes: none.`

- **AC16 [R16].** `git diff -- src/stories/patterns/mantine/ResetPasswordView.stories.tsx` shows only the
  `StoryPageGutter` import and the `Loading` render wrapped. `rev2/story-measure.log` shows
  `resetpasswordview--loading` at 16/16/32/32 (±1px) at 320/390/1024/1440 and no overflow. The other seven exports
  are unchanged. `rev2/story-grep.log` holds only the one allowed line.
- **AC17 [all].** Every `rev2` gate log ends `EXIT_CODE=0`, `rev2/build.log` included. `rev2/hash-object.log` has 23
  `<40-hex>  <path>` lines, captured in the same pass. This re-proves AC9 and AC14 for the final diff.
- AC1–AC15 stand as amended.

### 17.5 Completion report for Revision 2

Append `## Revision 2` to the session log, with:
- a Files Changed table;
- R16 with its evidence paths;
- every §17.3 command with its exit code;
- `story-measure.log` summarised per Story.

Emit these receipts for `ResetPasswordView`:
- `GR-3b STORY RESPONSIVE CHECK` and `GR-3d STORY GUTTER CHECK` for `--loading` (`StoryPageGutter yes`);
- the `n/a: View carries the page gutter` receipt for the other seven exports, re-measured.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Update the 886 cell of
`docs/backlog.md` with concise state only. No mutating git.

### 17.6 Addendum — review 2b, 2026-09-30: R10's GR-3d blast radius (F9, R17)

A second review pass on the same tree found one more GR-3d gap. Review 2 did not list it. R16 and §17.1–§17.5 stand;
this addendum adds one requirement and one revert.

| # | Severity | Evidence (reviewer, 2026-09-30) | Correction |
|---|---|---|---|
| F9 | **P2** GR-3d scope | R10 (Revision 1) changed `MantineDashboardStatCard.tsx`. GR-3d's scope covers *"every Story a task … **renders a changed component in**"*, and four `skipCanvas` Stories render that component: `DashboardStatCard.stories.tsx` (direct), `DashboardGrid.stories.tsx` (direct), `AdminDashboardView.stories.tsx` and `AgentStatisticsView.stories.tsx` (through the Views, `AdminDashboardView.tsx`, `AgentStatisticsView.tsx`). None of them uses `StoryPageGutter`. The reviewer's probe on the rev1 `storybook-static` measured the first padded box at 320/390/1024/1440: `dashboardstatcard--default` 16/16/16/16 (gutter written in the Story, `SimpleGrid p="md"` `:27`); `dashboardgrid--default` 16/16/24/24; `admindashboardview--default` 16/16/24/24; `agentstatisticsview--default` 16/16/24/24. R10's rendered output is identical to `HEAD` (the object literal and `TITLE_FZ.h3` hold the same three keys), so R10 buys no visible change, and it puts four Stories owned by the 853/891 surfaces into 886's scope. Two of them are View Stories whose Views appear to carry a 16/24 gutter of their own, which is the O83-3 conflict again (condition 2 needs ≥32 at 1024). That is not 886's work. F5 (P3, "no site picks its own steps") was the orchestrator's own review-1 addition, and it is withdrawn: S17 keeps its inline responsive object, which the gate accepts (Arm 4) and which equals `TITLE_FZ.h3`. The four Stories' gutters are filed as reserved **902** (`docs/backlog-reserved.md`). | R17 |

| ID | Finding | Observable requirement | P | AC |
|---|---|---|---|---|
| **R17** | F9 | Restore `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` to its `HEAD` content, byte for byte, through Node: write the output of `git --no-optional-locks show HEAD:src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` over the file with `writeFileSync` (never `Get-Content -Raw`, never a mutating git command). Afterwards its `git hash-object` is `c19dd9fabdf7638045eaee7344a319ae7bbbee51` and it drops out of `git status`. Make no other change to the file, and do not edit any of the four Stories named in F9. | P2 | AC18 |

**How this changes §17.3:**
- **I0-R2** also hashes `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx`. Expected:
  `2437603de9633eeb0161a1751479667a42c26562` (Revision 1's content). Anything else is `TASK SPECIFICATION
  CONTRADICTION`: stop.
- **Order:** I0-R2 → R17 → R16 → the final gate block.
- **Final gate block:** unchanged. `$files` keeps `MantineDashboardStatCard.tsx`, so `hash-object.log` still has
  **23** lines. That file's line must read `c19dd9fabdf7638045eaee7344a319ae7bbbee51`. Also run this, into
  `$ev\statcard-revert.log`:

  ```powershell
  $ev = "docs\sessions\evidence\task886\rev2"
  git --no-optional-locks diff --quiet HEAD -- src/design-system/mantine/patterns/MantineDashboardStatCard.tsx; "DIFF_QUIET_EXIT=$LASTEXITCODE" | Tee-Object "$ev\statcard-revert.log"
  git --no-optional-locks hash-object src/design-system/mantine/patterns/MantineDashboardStatCard.tsx | Tee-Object -Append "$ev\statcard-revert.log"
  ```

  Expected: `DIFF_QUIET_EXIT=0` and `c19dd9fabdf7638045eaee7344a319ae7bbbee51`.
- **Measurement:** unchanged. The four F9 Stories are **not** measured by this task and **not** in O83-1.

**AC18 [R17].** `rev2/statcard-revert.log` shows `DIFF_QUIET_EXIT=0` and the `HEAD` hash. `rev2/git-status.log` does not
list `MantineDashboardStatCard.tsx`. `rev2/check-type-responsive.log` still reports Arm A 0 and exit 0. AC10 is
withdrawn with R10.

**Completion report addition (§17.5):** the Revision 2 Files Changed table lists `MantineDashboardStatCard.tsx` as
"reverted to `HEAD` (R17); not in the final diff". The first-pass and Revision 1 tables stay as written.

`GR-4 AC AUDIT — 1 addendum criterion; it states an observable property; absolutes: none.`

### 17.7 Ruling on the I0-R2 block — review 2c, 2026-09-30

The executor stopped at I0-R2: `ResetPasswordView.stories.tsx` hashed `14809fd6…`, not the expected `cae86b5a…`. The
stop was correct. The defect is the orchestrator's (K2).

| # | Evidence (reviewer, 2026-09-30) | Disposition |
|---|---|---|
| K2 | `git --no-optional-locks diff HEAD -- src/stories/patterns/mantine/ResetPasswordView.stories.tsx` shows exactly R16: the `StoryPageGutter` import and the `Loading` render wrapped, nothing else. The file's mtime is 16:17:48 and `rev2/` was created at 16:17:38. This addendum (§17.6) was committed at 16:21:45 (`8a4b2f7ef`). So an earlier Revision 2 pass applied R16 after review 2 and before §17.6, and §17.6 re-published I0-R2's `HEAD` hash without re-hashing the tree. That earlier pass ran without R17, so none of its artifacts can close AC16–AC18. | Option 1: the existing edit **is** R16. |

**Amended route (overrides §17.3 and §17.6 where they differ):**
- **I0-R2** expects `ResetPasswordView.stories.tsx` = `14809fd64f43d97bc940177e3a30da4ecf5c0e48`. Every other I0-R2 hash is
  unchanged. In the same step, write the Story's content witness:

  ```powershell
  $ev = "docs\sessions\evidence\task886\rev2"
  git --no-optional-locks diff HEAD -- src/stories/patterns/mantine/ResetPasswordView.stories.tsx | Tee-Object "$ev\r16-diff.log"
  ```

  Expected: only the `StoryPageGutter` import line and the `Loading` export's wrap, as AC16 describes. Any other
  hunk is `TASK SPECIFICATION CONTRADICTION`: stop.
- **R16 needs no write.** Do not revert the Story and re-apply it; that would produce the same bytes and add a write
  with no evidence value.
- **Order:** I0-R2 → R17 → the final gate block → measurement → grep.
- **Superseded artifacts.** Every `rev2/` file from the earlier pass is superseded. Only files written in the pass that
  starts at this I0-R2 and ends with the final gate block count as evidence. `hash-object.log` still has 23 lines. The
  Story's line reads `14809fd6…` and `MantineDashboardStatCard.tsx`'s line reads `c19dd9fa…`.
- **Completion report (§17.5).** The Revision 2 Files Changed table lists the Story as "R16, applied in an earlier
  interrupted pass; content witnessed by `rev2/r16-diff.log`".

AC16–AC18 stand. AC16's diff clause is proven by `rev2/r16-diff.log`.

`GR-4 AC AUDIT — 0 new criteria; AC16 gains an evidence path; absolutes: none.`

### 17.8 Review 3, 2026-09-30 — `PARTIALLY VERIFIED`, awaiting O83-1

Revision 2 is verified on the final tree. The only thing left is the owner matrix.
- **Hashes.** All 23 `rev2/hash-object.log` hashes equal the current tree. Against `rev1/hash-object.log`, exactly two
  files differ: `MantineDashboardStatCard.tsx`, now at the `HEAD` hash `c19dd9fa…` (R17), and
  `ResetPasswordView.stories.tsx`, which is new to the list. The `rev2/r16-diff.log` content matches AC16.
- **Gates.** Every `rev2` gate log ends `EXIT_CODE=0`. `.next/BUILD_ID` (16:29:20) and `storybook-static` (16:26:34)
  are both newer than the last source write (R17, 16:25:36).
- **Measurement.** The reviewer ran an independent native probe on the rev2 `storybook-static`:
  - `resetpasswordview--loading` measures 16/16/24/32/32 at 320/390/768/1024/1440, with no overflow;
  - the seven exempt exports measure 16 on the View box at every width, and the card sits at 16/16/184/312/520;
  - so O83-3 condition 2 (at least 32 at 1024 and 1440) holds, which closes the executor's R2-6 item 3;
  - `h1` measures 20/20/30/30/30.
- **Record accuracy (P3, recorded, no action).** The session log's Revision 2 intro and executor report state an
  order of I0-R2 → R17 → R16, with I0 hashes `cae86b5a…` and `2437603d…`. That does not match the file times:
  - the Story's mtime is 16:17:48, so R16 was never re-applied (the §17.7 route);
  - the retained `rev2/i0.log` was written at 16:34:38, after the gate logs. It holds the post-R17 hashes, so it is not
    a pre-write witness.

  The substance is unaffected, because the hash comparison above proves there was no drift. `rev2/i0.log` and
  `rev2/r16-diff.log` carried a UTF-8 BOM, and the reviewer stripped it through Node (see the session log's Review 3).
- **Next.** The owner runs O83-1 (§13.3, plus `patterns-mantine-resetpasswordview--loading`). If every tuple is
  accepted, the next review approves and closes 886. If a tuple is returned, the next review writes Revision 3.

---

## 18. Revision 3 — review 4, 2026-09-30 (`NEEDS REVISION`, owner returned O83-1)

This section overrides every earlier section it names. The first pass and Revisions 1–2 are **kept**. Review 3
verified them (§17.8).

### 18.1 Owner result for O83-1 (2026-09-30, verbatim)

| §13.3 row | Owner verdict |
|---|---|
| 1 `ListingDetailPattern`, `PageHeaderWithActions` | *"все ок, окрім кнопки "Додати у колекцію". Вона не співпадає з канонічними кнопками MInetine. Схоже вона або не мігрована, або хардкод."* |
| 2 `AuthFormPattern`, `TwoColumnForm`, `ResetPasswordView`, `DashboardHeader` | *"все ок."* — **accepted** |
| 3 `ResetPasswordView` → `Loading` | *"все ок."* — **accepted** |
| 4 `ListingDetailView` | *"не ок. … Необхідно розробити photo placeholder (типу сіросиній бекграунд і іконка картинки по центру). Згідно UI/UX best practices 2026 року. Додай це завдання у цю задачу! Також біда з кнопками, контент в кнопках не читабельний, що свідчить про те, що немає балансу між контейнером контенту оголошення і карткою контактів. Виправити згідно UI/UX best practices 2026 Року!"* |
| 5 `RecentlyViewedGridView`, `SimilarListingsView` (incl. `Loading`) | *"все ок."* — **accepted** |

`PageHeaderWithActions` is accepted, because the owner's row-1 defect names only the collection button.

**O83-4 — DECIDED 2026-09-30, owner verbatim option chosen: *"Усе в 886, розширити O83-3 (Recommended)"*.** The
option read: *"Плейсхолдер + кнопка + контакт-картка в 886. Виняток O83-3, умова 2: View з власним gutter 16/24 на
≥1024 теж звільнена. Нічого не подвоюється, і AgentStatisticsView переходить з 902 у 886. Це зміна правила GR-3d, я
впишу її дослівно."* The GR-3d text change in `docs/golden-rules.md` (condition 2: "at least **24** at 1024 and 1440")
is **owner-applied** (the reviewer's write to that file was refused by the session's permission classifier). §18.5
I0-R3 checks that it has landed.

### 18.2 Findings (review 4, reviewer-measured on the rev2 `storybook-static`, native Playwright, `win32`)

| # | Severity | Evidence | Req |
|---|---|---|---|
| F10 | **P1** owner return, GR-0 | `SaveToCollectionButton.tsx`, default shape: `MantineButton variant="default" size={PILL_SIZE_MAP[size]} radius="1.125rem" bd="1px solid var(--border)"` (hardcoded radius and a legacy border token, with a `design-tokens-allow` marker), plus `<Text span ml={4}>` as the label. It is not `fullWidth`: it measures **170 px** (`en`) and **198 px** (`uk`) while every sibling CTA in the card is full width (278–417 px). The modal it opens carries two `style` objects (`Flex … style={{ borderTop … }}`, `TextInput style={{ flex: 1 }}`). The `ListingContactPattern` Story's own stand-in for this slot is already the canonical shape: `Button variant="default" fullWidth leftSection=…` (`ListingContactPattern.stories.tsx:62`). | R18 |
| F11 | **P1** owner return | `MantineListingContactPattern.tsx` puts Call and WhatsApp in one row on **viewport** breakpoints (`direction={{ base:'column', xs2:'row', md:'column', xl:'row' }}`), not on the card's width. `listingdetailview--public-listing` at 1280/1440 gives the card 384/416 px, and each CTA 165/181 px. "Write on WhatsApp" wraps to 2 lines (`en`, `uk`), and "Зателефонувати" wraps at 1280 (`uk`). At 1024 the sidebar card is only 299 px (span 4/12). In `listingdetailpattern--default` at 768 it is 240 px, and the `uk` "Надіслати повідомлення" and "Поскаржитися…" wrap. In the Docs view the owner opened, the preview box is narrower than the window, so viewport queries pick the row layout inside a ~280 px card (the screenshot). The CTA rows also carry `style`/`styles` objects and `<span style>` label wrappers. | R19, R20 |
| F12 | **P1** owner return, GR-0 | There is no canonical photo placeholder. When a photo fails to load, `AppImage` still renders the `<img>`, so the browser shows the broken glyph and the **alt text** inside the frame (the owner's screenshot; `listingdetailview--public-listing` has 3 broken `<img>` at every width, from fixture URLs on `example.com`). An empty `src` leaves a bare muted box. Three consumers each wrote their own empty-cover fallback, and none of them handles a failed load: `ListingCard.tsx:161-167` and `:252-258` (`Maximize2` via `ListingCard.module.css` `.placeholderIcon`/`.placeholderIconLarge`), `AgentStatisticsView.tsx:268-273` (`ImageOff`, `gray[5]`), and `StepPreview.tsx:29-34` (legacy Tailwind, variant `preview`). | R21, R22 |

### 18.3 Canonical UI decision record (GR-0) — Revision 3

`GR-0 CANONICAL REUSE PREFLIGHT` (reviewer, design time):
- **Semantic queries:** `placeholder`, `fallback`, `ImageOff`, `Maximize2`, `no photo`, `onError`, `framePlaceholder`; `SaveToCollectionButton`, `variant="default" fullWidth`; `type="container"`, `@container`.
- **Candidates inspected:** `src/design-system/media/AppImage.tsx` + `appImageConfig.ts` + `AppImage.module.css` (`.framePlaceholder` = `var(--muted)`, no icon, no error branch); `Mantine/Primitives/AppImage` Story (`NoSrcSquare`, a `Text` label child); `ListingCard.tsx`; `AgentStatisticsView.tsx`; `StepPreview.tsx`; `MantineListingGalleryPattern.tsx` (Mantine `Image`, not `AppImage`); `ListingContactPattern.stories.tsx:62` (canonical secondary CTA shape); `MantineListingCardTrack.module.css:149-181` (owner **D74-9**: container queries keyed on theme breakpoints); Mantine 8.3.18 `SimpleGrid type="container"` (`SimpleGridVariables.mjs`: the `cols` keys are used verbatim as `@container simple-grid (min-width: <key>)`).

| Visible artifact | Disposition | Canonical owner and token path |
|---|---|---|
| Photo placeholder (empty `src` or failed load) | **CREATE** `MediaPlaceholder` + **EXTEND** `AppImage` | New `src/design-system/media/MediaPlaceholder.tsx`: Mantine `Center pos="absolute" inset={0} bg="gray.2"`, lucide `Image` icon (`import { Image as ImageIcon }`), `color={theme.colors.gray[5]}`, `size={theme.other.iconSize[<key>]}`, `aria-hidden`. The tokens are the TailAdmin gray scale (`theme.ts:352-363`, gray.2 `#e4e7ec`, gray.5 `#667085`; the owner's *"сіросиній"*); the icon contrast is ≈4:1 (≥3:1 for a graphic). No px/rem, no CSS rule, no `style`. |
| Save-to-collection trigger, default shape | **REUSE** the canonical Mantine `Button` | `variant="default"`, `fullWidth`, `leftSection`, theme radius and size (as the sibling CTAs); nothing overridden. |
| Contact-card CTA row | **REUSE** Mantine `SimpleGrid type="container"` | `cols={{ base: 1, [theme.breakpoints.xs2]: 2 }}` (`'30em'`, `theme.ts:592`): two-up only when the card itself is ≥480px wide. The D74-9 precedent for container-keyed layout. |
| Detail grid balance | **EXTEND** `MantineListingDetailPattern` spans | Grid spans only (§18.4 R20). |

`new hardcoded visual values: NONE`.

### 18.4 Revision requirements

| ID | Finding | Observable requirement | P | AC |
|---|---|---|---|---|
| **R18** | F10 | `src/modules/listings/components/SaveToCollectionButton.tsx`:<br>• the default shape becomes `<MantineButton {...commonProps} variant="default" fullWidth leftSection={icon}>{t('save_to')}</MantineButton>`: no `size`, `radius`, `bd` or `Text span`, and the `design-tokens-allow` marker on that element goes with them;<br>• delete `PILL_SIZE_MAP` and the `size` prop from `Props`, and remove `size="lg"` from its two callers (`ListingContact.tsx:228`, `ListingDetailPattern.stories.tsx:185`); grep for any other caller first;<br>• in the modal, `Flex … style={{ borderTop … }}` becomes `<Divider />` followed by `<Flex gap="xs">`, and the `TextInput`'s `style={{ flex: 1 }}` becomes `flex={1}`;<br>• the **icon shape** (`ActionIcon`, its `radius` marker and `SaveToCollectionButton.module.css`) is **unchanged**: the owner did not return it. | P1 | AC19 |
| **R19** | F11 | `src/design-system/mantine/patterns/MantineListingContactPattern.tsx`:<br>• the Call/WhatsApp row becomes `<SimpleGrid type="container" cols={{ base: 1, [theme.breakpoints.xs2]: 2 }} spacing="sm">`, and each `Button` gains `fullWidth`;<br>• delete the rows' `style`/`styles` props and the `<span style>` label wrappers; the label is the plain string;<br>• `onClick`, `disabled`, `title`, `aria-disabled` and the loading `leftSection` stay as they are;<br>• the send-message row and the save row drop their `Flex`/`Box style={{ flex: 1, minWidth: 0 }}` wrappers and render the trigger directly (both triggers are `fullWidth`);<br>• the comments above the rows are rewritten to describe the container rule;<br>• the report row is unchanged. | P1 | AC20 |
| **R20** | F11 | `MantineListingDetailPattern.tsx:141-144`: `leftSpan` = `{ base: 12, [from]: 7, xl: 8 }` and `rightSpan` = `{ base: 12, [from]: 5, xl: 4 }`, where `from` is `sidebarFrom` (`'md'` or `'lg'`). `leftPr` and `leftMb` are unchanged. | P1 | AC20 |
| **R21** | F12 | Create `src/design-system/media/MediaPlaceholder.tsx` exactly as §18.3 describes, with props `iconSize: keyof MantineThemeOther['iconSize']` and `label: string`. The root is `role="img"` with `aria-label={label}` when `label` is non-empty, and `aria-hidden` otherwise.<br>`appImageConfig.ts` gives every variant `placeholder: boolean` and `placeholderIconSize`: **true** for `listing` (`prominent`), `listing-thumb` (`decorative`), `gallery-main` (`hero`), `gallery-side` (`prominent`), `gallery-strip` (`decorative`) and `lightbox` (`hero`); **false** for `preview`, `upload` and `avatar`.<br>`AppImage.tsx`:<br>• a `failed` state is set by the `<img>`'s `onError`, and by the mount effect when `imgRef.current.complete && naturalWidth === 0` (an error that fired before hydration);<br>• it resets when `optimizedSrc` changes;<br>• the `<img>` renders only when `hasImage && !failed`;<br>• `MediaPlaceholder` (`label={alt}`) renders when the variant's `placeholder` is true and `!hasImage` or `failed`, **before** `children`, so overlays stay on top;<br>• no blur background while `failed`.<br>Register `MediaPlaceholder.tsx` in `scripts/mantine-migration-scope.json`, and satisfy `check:media-enrolment` (directory-listing driven). | P1 | AC21 |
| **R22** | F12 | Delete the now-duplicate local fallbacks:<br>• `ListingCard.tsx:162-166` and `:253-257` (the `{!coverImage && (<Center …><Maximize2 …/></Center>)}` children), and the `Maximize2` and `Center` imports if they become unused;<br>• the `.placeholderIcon` and `.placeholderIconLarge` rules in `ListingCard.module.css`, and their comments;<br>• `AgentStatisticsView.tsx:269-273` (the `{!row.coverUrl && …ImageOff…}` children), and the `ImageOff` import if unused; the `Box … bg="gray.1"` frame stays.<br>`StepPreview.tsx` is **not** edited: its variant `preview` is `placeholder: false`, so nothing doubles.<br>In `AppImage.stories.tsx`, `NoSrcSquare` drops its `Text` child, because the canonical placeholder replaces it. If `naLabel`'s locale key is then unreferenced, remove it from all four `messages/*` files. | P1 | AC21 |
| **R23** | GR-3d | The blast-radius Stories in §18.6 are handled exactly as their GR-3d line says. | P1 | AC22 |
| **R24** | GR-3b, GR-3c | Every Story this revision changes passes GR-3b and GR-3c:<br>• no raw px/rem; for example `ListingContactPattern.stories.tsx:45/62` `size={18}` becomes `theme.other.iconSize.comfortable`;<br>• no `style`;<br>• every fixture `Title` of 24px or more gains `fz={TITLE_FZ.hN}` matching its `order`; known: `ListingCardPattern.stories.tsx:226/246` (`order={4}`) gets `TITLE_FZ.h4`;<br>• the executor reports every other one it finds. | P1 | AC22 |
| **R25** | F12 | `Mantine/Primitives/AppImage` gains one export, `Placeholder`. For each of the six placeholder variants it renders:<br>• `src={null}`;<br>• `src="/__missing-photo__.jpg"`, a relative path that `storybook-static` answers with 404, so it fails with no network dependency.<br>Each sits in the same sized frames `Default` uses (`AspectRatio` + `theme.other.boxSize.*`).<br>The same export also renders one standalone `<MediaPlaceholder>`, **imported by name** in `AppImage.stories.tsx` (GR-3: *"the file must import that component by name"*; `check:story-coverage` checks that enrolled `MediaPlaceholder` has a Story that imports it). GR-3a: **EXTEND** the existing canonical Story; no new file. | P1 | AC21 |

**Out of scope, recorded:**
- `MantineListingGalleryPattern.tsx` renders Mantine `Image`, not `AppImage`. Production uses `gallerySlot` → `ListingGallery` → `AppImage`, so the owner's gallery is covered.
- `StepPreview.tsx` (legacy; `preview` excluded).
- `GalleryStaticFrame.tsx`: its SSR `<img>` is swapped out on mount, and it is baselined debt of the listing-detail surface.
- The `ListingDetailView` fixture URLs stay on `example.com`. They now fail into the placeholder, and that is the state the owner asked to see.
- **No production file outside §18.4 changes.** In particular, not `ListingGallery.tsx` (unenrolled legacy; it gets the placeholder through `AppImage`'s variant config) and not `ListingDetailView.tsx`.

### 18.5 Verification plan — re-entry `remediation`

Order: I0-R3 → R18 → R19 → R20 → R21 → R22 → R25 → R23/R24 → gate block → measurement → grep. Evidence goes to
`docs/sessions/evidence/task886/rev3/`. Do not overwrite `task886/`, `rev1/` or `rev2/`. Append `## Revision 3` to the
session log.

**I0-R3**, before any write:

```powershell
$ev = "docs\sessions\evidence\task886\rev3"
New-Item -ItemType Directory -Force $ev
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\i0.log"
git --no-optional-locks status --short | Tee-Object -Append "$ev\i0.log"
git --no-optional-locks hash-object src/modules/listings/components/SaveToCollectionButton.tsx src/design-system/mantine/patterns/MantineListingContactPattern.tsx src/design-system/media/AppImage.tsx src/stories/patterns/mantine/ListingDetailPattern.stories.tsx src/stories/patterns/mantine/ResetPasswordView.stories.tsx | Tee-Object -Append "$ev\i0.log"
Select-String -Path docs\golden-rules.md -Pattern "at least 24 at 1024 and 1440" | Tee-Object -Append "$ev\i0.log"
```

Expected:
- the platform line reads `win32`;
- `SaveToCollectionButton.tsx`, `MantineListingContactPattern.tsx` and `AppImage.tsx` are absent from `git status`, at their
  `HEAD` content;
- `ListingDetailPattern.stories.tsx` = `c2c5d744d34e0c7c1f52b786bf7f4d6804c20d72`;
- `ResetPasswordView.stories.tsx` = `14809fd64f43d97bc940177e3a30da4ecf5c0e48`;
- the `Select-String` prints one GR-3d condition-2 line.

A different hash is `TASK SPECIFICATION CONTRADICTION`: stop. **No `Select-String` match means the owner's O83-4 rule
edit has not landed: stop with `BLOCKED — GR-3d O83-4 NOT APPLIED`, before any write.**

**Final gate block:** run §16.5's block unchanged, except:
- set `$ev = "docs\sessions\evidence\task886\rev3"`;
- add to `$files`:
  - `src/modules/listings/components/SaveToCollectionButton.tsx`, `src/modules/listings/components/ListingContact.tsx`;
  - `src/design-system/mantine/patterns/MantineListingContactPattern.tsx`;
  - `src/design-system/media/MediaPlaceholder.tsx`, `src/design-system/media/AppImage.tsx`, `src/design-system/media/appImageConfig.ts`;
  - `src/modules/listings/components/ListingCard.tsx`, `src/modules/listings/components/ListingCard.module.css`;
  - `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx`;
  - `scripts/mantine-migration-scope.json`;
  - `src/stories/patterns/mantine/ResetPasswordView.stories.tsx`;
  - every Story file §18.6 changes;
  - every `messages/*.json` R22 changes;
- add these steps:

  ```powershell
  npm.cmd run check:media-enrolment *>&1 | Tee-Object "$ev\check-media-enrolment.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-media-enrolment.log"
  npm.cmd run test -- src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx *>&1 | Tee-Object "$ev\smoke-tests.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\smoke-tests.log"
  ```

Every log must end `EXIT_CODE=0`, `census-changed.log` must add no new blocking node, and `hash-object.log` has one
`<40-hex>  <path>` line per `$files` entry. Normalise every `Tee-Object` file to UTF-8 without BOM through Node, and
check `i0.log` too (review 3 found it left with a BOM). **No plant:** `check-type-responsive.mjs` is not changed.

Then, in the same pass, against the rebuilt `storybook-static`, with a throwaway Playwright probe under `.artifacts/`,
into `$ev\story-measure.log`, for every Story in §18.6 plus `Mantine/Primitives/AppImage` (`Default`,
`Placeholder`) and `Mantine/Primitives/SaveToCollectionButton` (`Closed`):
1. **Every tuple.** At 320/390/768/1024/1440 in `en` (and `uk` for the three detail/contact Stories), record:
   - the edge gap of the first padded box;
   - horizontal overflow;
   - the `fontSize` of every `h1`–`h4`.
2. **Contact card.** For `listingdetailview--public-listing`, `listingdetailpattern--default` and
   `listingcontactpattern--default`, per width, record:
   - the card's width;
   - each CTA's width and label line count (`label.scrollHeight / lineHeight`).
3. **Placeholder.** Per `AppImage` frame, record:
   - whether an `<img>` is present;
   - whether the placeholder is present;
   - the placeholder's computed `background-color` and the icon's `width`.

Then this grep, into `$ev\story-grep.log`:

```powershell
git --no-optional-locks grep -n -E "style=\{|styles=\{|radius=.1\.125rem.|bd=.1px|PILL_SIZE_MAP|size=\{[0-9]+\}" -- src/modules/listings/components/SaveToCollectionButton.tsx src/design-system/mantine/patterns/MantineListingContactPattern.tsx src/design-system/media/MediaPlaceholder.tsx src/stories/patterns/mantine/ListingContactPattern.stories.tsx src/stories/patterns/mantine/ListingCardPattern.stories.tsx
```

Expected: no line, except any `style=` or `radius` line inside `SaveToCollectionButton.tsx`'s **icon** shape. Report
every line that is printed.

### 18.6 Owner-matrix and blast-radius GR-3d lines (Revision 3)

The reviewer computed the blast radius on the render graph: JSX use through named barrels, every Story reaching
`AppImage`, `SaveToCollectionButton`, `MantineListingContactPattern`, `MantineListingDetailPattern` or `ListingCard`.

| Story | GR-3d |
|---|---|
| `Patterns/Mantine/ListingDetailPattern` | profile present |
| `Patterns/Mantine/ListingDetailView` | n/a: default canvas |
| `Patterns/Mantine/ListingContactPattern` | **wrap in this task** |
| `Patterns/Mantine/ListingCardPattern` | **wrap in this task** |
| `Patterns/Mantine/ListingCardTrack` | **wrap in this task** |
| `Patterns/Mantine/ListingGalleryPattern` | **wrap in this task** |
| `Patterns/Mantine/AgentStatisticsView` (moved from reserved **902**) | View Story: measure first. If the View's own root sets the gutter in production source and it measures 16/16 at 320/390 and at least 24 at 1024/1440 (GR-3d as amended by O83-4), the line is `n/a: View carries the page gutter (<path:line>)`. Otherwise **wrap**. |
| `Patterns/Mantine/ListingsShellView`, `Patterns/Mantine/HomepageListingGrids`, `Mantine/Primitives/PopularLocationsView` | same rule as `AgentStatisticsView` |
| `Mantine/Primitives/AppImage`, `SaveToCollectionButton`, `ListingCard`, `LightboxView`, `FavoritesShell`, `SimilarListingsView`, `RecentlyViewedGridView` | n/a: `MantineStoryShell` primitive |

A wrap is `<StoryPageGutter>` around the page content of **every** export, and it deletes any gutter the Story writes
itself. The executor needs no further permission for any row. One GR-3d receipt per Story.

### 18.7 Type scale (GR-3c)

Revision 3 adds or resizes no production text: the button labels keep the theme `Button` size, and the price and
names are unchanged. Wrapped Stories' fixture `Title`s follow R24. Every changed Story gets a
`GR-3c TYPE RESPONSIVE CHECK` receipt, measured at 320/390/768/1440.

### 18.8 Acceptance criteria

`GR-4 AC AUDIT — 4 revision criteria; each states an observable property; absolutes: none.`

- **AC19 [R18].**
  - Given `story-measure.log`, the save trigger's width equals its sibling send-message CTA's width (±1 px) in
    `listingdetailpattern--default` at every width.
  - Given the `git diff` of `SaveToCollectionButton.tsx`, the default shape has no `size`, `radius`, `bd` or `Text`,
    and the icon shape's lines are unchanged.
  - `story-grep.log` holds no line for the default shape.
- **AC20 [R19, R20].** In `story-measure.log`, for the three detail/contact Stories in `en` and `uk`:
  - every Call/WhatsApp/send/save label has a line count of **1** at every measured width where the card is in the
    sidebar;
  - the sidebar card is at least 360 px at 1024, 1280 and 1440 in `listingdetailview--public-listing`;
  - there is no overflow.
- **AC21 [R21, R22, R25].** In `story-measure.log`, for `appimage--placeholder`:
  - every `src={null}` frame and every missing-URL frame has **no** `<img>` and has a placeholder;
  - the placeholder's background is `rgb(228, 231, 236)` and the icon's width is its token;
  - `listingdetailview--public-listing` shows placeholders, and no broken `<img>`, in its three gallery frames.

  `git grep -n "Maximize2\|placeholderIcon" -- src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingCard.module.css`
  prints nothing, and `check:media-enrolment` and the two smoke tests exit 0.
- **AC22 [R23, R24].**
  - The session log has one GR-3d, GR-3b and GR-3c receipt per Story in §18.6 that this revision changed or
    exempted.
  - Every wrapped Story measures 16/16/32/32 (±1) at 320/390/1024/1440.
  - Every exempt View Story measures 16/16 and at least 24/24, with its source line cited.
  - Every rev3 gate log ends `EXIT_CODE=0`, `build.log` included, and `hash-object.log` covers `$files`.
- AC1–AC18 stand as amended.

### 18.9 OWNER VISUAL QA REQUIRED — O83-1, Revision 3

Rows 2, 3 and 5 of §13.3, and the `PageHeaderWithActions` half of row 1, are **accepted** and carried forward. The
owner reviews these, and records **accepted** or **returned** with a concrete defect for each:
1. `Patterns/Mantine/ListingDetailPattern` × `en` / `uk` × 320 / 768 / 1024 / 1440: the collection button, the CTA rows
   and the column balance.
2. `Patterns/Mantine/ListingDetailView` → `Public Listing` × `en` / `uk` × 320 / 1024 / 1440: the photo placeholder, the
   contact card and the balance.
3. `Patterns/Mantine/ListingContactPattern` × `en` / `uk` × 320 / 1440.
4. `Mantine/Primitives/SaveToCollectionButton` → `Closed` × `en` × 320 / 1440.
5. `Mantine/Primitives/AppImage` → `Default`, `Placeholder` × `en` × 320 / 1440.
6. Gutter re-look, × `en` × 320 / 1440: `ListingCardPattern`, `ListingCardTrack`, `ListingGalleryPattern`,
   `AgentStatisticsView`, `ListingsShellView`, `HomepageListingGrids`, `PopularLocationsView`.

### 18.10 Completion report for Revision 3

Append `## Revision 3` to the session log with these items:
- **Files Changed** table.
- **R18–R25** with their evidence paths.
- **Commands** — every §18.5 command with its exit code.
- **`story-measure.log`** summarised per Story (contact-card label lines, placeholder frames, edge gaps).
- **Receipts:**
  - GR-0 (`MediaPlaceholder` CREATE; the rest REUSE/EXTEND, as §18.3);
  - GR-1 per changed production file;
  - GR-2;
  - GR-3a (the `AppImage` `Placeholder` export);
  - GR-3 (`MediaPlaceholder` ← `AppImage.stories.tsx`, which imports it by name, per R25);
  - GR-3b, GR-3c and GR-3d per changed or exempted Story.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Update the 886 cell of
`docs/backlog.md` (concise state). No mutating git.

### 18.11 Ruling on the I0-R3 block — review 4b, 2026-09-30

The executor stopped at I0-R3 with `BLOCKED — GR-3d O83-4 NOT APPLIED`, and that stop was correct.
- The review-4 commit `4bd15b823` landed without the owner's rule edit.
- `docs/golden-rules.md:274` still reads "at least **32** at 1024 and 1440", and it is the file's only occurrence. The
  "matching sentence" the executor asked about is that same line, so there is nothing else to change.
- The executor's other I0 values match §18.5, and the only file written was `rev3/i0.log`.

**Amended route (overrides §18.5 where they differ):** the O83-4 check gates **only** the four View-Story rows of §18.6
(`AgentStatisticsView`, `ListingsShellView`, `HomepageListingGrids`, `PopularLocationsView`). Nothing else depends on
it.
1. **I0-R3** runs as §18.5 says, without the `Select-String` line and its stop. Re-running it overwrites the current
   `rev3/i0.log`, which is not evidence.
2. Then R18 → R19 → R20 → R21 → R22 → R25 → R24, plus the four `wrap in this task` rows of §18.6
   (`ListingContactPattern`, `ListingCardPattern`, `ListingCardTrack`, `ListingGalleryPattern`).
3. **O83-4 gate**, before the four View-Story rows:

   ```powershell
   $ev = "docs\sessions\evidence\task886\rev3"
   Select-String -Path docs\golden-rules.md -Pattern "at least 24 at 1024 and 1440" | Tee-Object "$ev\o83-4-gate.log"
   ```

   - **One match:** do the four View-Story rows per §18.6, then the gate block, measurement and grep, and report
     `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
   - **No match:** stop before the four rows and before the gate block, and report
     `BLOCKED — GR-3d O83-4 NOT APPLIED (R18–R22, R24, R25 and four wraps done)`. List the files written so far,
     each with its `git hash-object`. Run no gate block on a partial tree: it runs once, on the final tree.
4. **Do not wrap a View Story on the current rule text.** That doubles the phone gutter, and O83-4 exists to prevent
   it.

AC19–AC22 stand. AC22's "every exempt View Story" clause is satisfied only once the gate has passed.

---

## 19. Revision 4 — review 5, 2026-09-30 (`NEEDS REVISION`)

This section overrides every earlier section it names. Revision 3 (§18, R18–R25) is **kept**. Review 5 verified it
on the final tree:
- all 41 `rev3/hash-object.log` hashes equal the tree;
- every rev3 gate log ends `EXIT_CODE=0`;
- `storybook-static` and `.next/BUILD_ID` are newer than the last source write.

The reviewer's own native probe (`win32`, Node v22.22.3) re-measured:
- the wrapped Stories at 16/16/32/32;
- `AgentStatisticsView` at 16/16/24/24 and `PopularLocationsView` at 16/16/32/48;
- `appimage--placeholder`: 13 placeholders and 0 `<img>`;
- save = send width at every width;
- no broken `<img>` anywhere.

A below-the-fold `loading="lazy"` `<img>` reads `complete:false` in Chromium, so R21's mount check cannot switch a
lazy image to the placeholder.

### 19.1 Owner result (2026-09-30, verbatim)

*"візуально кнопка тепер така як треба"*. The save-to-collection button (§18.9 row 1's collection button, and row 4)
is **accepted**. Every other §18.9 row is still owed.

### 19.2 Findings (review 5)

| # | Severity | Evidence | Req |
|---|---|---|---|
| F13 | **P1** GR-3b, R24 | R24 required every Story this revision changed to pass GR-3b. The executor left four violations in changed Stories and asked whether to waive them (session log R3-6 item 1). GR-3b gives no waiver for "pre-existing", and R24 already authorised the fix. The violations:<br>• `ListingCardTrack.stories.tsx:188` `globals: { viewport: { value: 'desktop1440' … } }` (a pin);<br>• `HomepageListingGrids.stories.tsx:93/133/171` `Box maw="var(--width-page-max)" mx="auto" w="100%"` (a max-width container);<br>• `ListingDetailPattern.stories.tsx:103` `size={18}` and `:124-127` `size={14}` (raw px);<br>• `ListingCardPattern.stories.tsx:79-90` `DemoImage`: `className="h-[180px] …"` and `Image h={180}` (raw px), plus a local no-photo stand-in that diverges from the canonical `MediaPlaceholder`. | R26–R29 |
| F14 | owner decision | `mantine-primitives-popularlocationsview`: the gutter comes from `MantineHomeSection.tsx:51` `Box className="container-wide"` (`globals.css:714-724`). GR-3d exemption condition 1 requires "Mantine spacing props", so a literal reading makes it non-exempt. Wrapping it would double the gutter. → **O83-5**, §19.4. | — |
| — | NOTE, accepted | `ListingCard.smoke.test.tsx` edit (R3-6 item 2): `HEAD`'s `MantineListingCardPattern.tsx:186/313` applies `styles.archived`, and there is no `.grayscale.opacity-60`, so those two assertions were already failing before 886. The two placeholder assertions test R21. `MantineListingContactPattern.tsx`'s three extra `style` → prop conversions are equivalent (R3-6 item 4). The `uk` 320 two-line inquiry label sits in the stacked card, outside AC20's sidebar scope, and goes to the owner matrix (§18.9 row 2). | — |

### 19.3 Revision requirements

| ID | Observable requirement | AC |
|---|---|---|
| **R26** | `ListingCardTrack.stories.tsx` `RailNoOverflow`:<br>• delete the `globals` line;<br>• rewrite the comment above it: the no-overflow state holds once the track is at least 480px wide (the D74-9 `xs2` rung); below that, the two cards scroll, which is `Rail`'s state; there is no viewport pin (GR-3b).<br>First `git grep -n "RailNoOverflow\|rail-no-overflow"` outside `storybook-static/`. If any gate or test reads the pin, stop and report it. | AC23 |
| **R27** | `HomepageListingGrids.stories.tsx`, all three exports: delete the `<Box maw="var(--width-page-max)" mx="auto" w="100%">` wrapper and its closing tag, so that `StoryPageGutter` wraps the content directly. Remove `Box` from the import if it becomes unused. | AC23 |
| **R28** | `ListingDetailPattern.stories.tsx`: `:103` `size={18}` becomes `theme.other.iconSize.comfortable`, and `:124-127` `size={14}` becomes `theme.other.iconSize.compact`. Follow the file's existing `useMantineTheme()` idiom. | AC23 |
| **R29** | `ListingCardPattern.stories.tsx`:<br>• delete `DemoImage`;<br>• the `image` slot renders the real `<AppImage variant="listing" src={noImage ? null : DEMO_IMAGE_URL} alt={…} />` (`@/design-system/media/AppImage`), as production `ListingCard.tsx` does. The no-image card then shows the canonical `MediaPlaceholder`;<br>• remove the `Image` import if it becomes unused;<br>• update the comment that described the stand-in. | AC23 |
| **R30** | `AppImage.stories.tsx` `PlaceholderCases` thumb frames: add a comment citing `GalleryThumbnailButton.tsx:32`. That is the production parent that sizes the thumb with the same `theme.other.boxSize.galleryThumb` token, which GR-3b's "Required" clause asks the Story to cite. No code change. | AC23 |

**Out of scope:** `PopularLocationsView` (O83-5) and any production file. The legacy `className` chains in
`ListingCardPattern.stories.tsx`'s footer fixture (`:121`, `:133`, `:200`) are not in GR-3b's list, so they are not
touched here.

### 19.4 STOP - OWNER DECISION REQUIRED — O83-5 (`PopularLocationsView` only; it does not block §19.3)

`Mantine/Primitives/PopularLocationsView` measures 16/16/32/48. That meets condition 2: the 48 at 1440 is
`.container-wide` centring its 1408px max-width. Its gutter is the canonical page-container **class**, not Mantine
spacing props, so condition 1 fails on a literal reading. The options:
- **(a) Recommended:** condition 1 also accepts a View whose root renders the canonical `.container-wide` page
  container. That class is the ladder `StoryPageGutter` copies. The owner applies the rule text to
  `docs/golden-rules.md`, and nothing in code changes.
- **(b)** Wrap the Story in `StoryPageGutter`. The gutter doubles to 32/32/64/80, which fails the profile. Not viable
  alone.
- **(c)** A separate task moves `MantineHomeSection`'s gutter to Mantine spacing props. That is a production change to
  every homepage section, so it stays out of 886.

The executor does not touch `PopularLocationsView` under any option. The review that closes 886 applies the owner's
answer.

### 19.5 Verification plan — re-entry `remediation`

Order: I0-R4 → R26 → R27 → R28 → R29 → R30 → gate block → measurement → grep. Evidence goes to
`docs/sessions/evidence/task886/rev4/`. Do not overwrite `task886/`, `rev1/`, `rev2/` or `rev3/`. Append
`## Revision 4` to the session log.

**I0-R4**, before any write:

```powershell
$ev = "docs\sessions\evidence\task886\rev4"
New-Item -ItemType Directory -Force $ev
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\i0.log"
git --no-optional-locks hash-object src/stories/patterns/mantine/ListingCardTrack.stories.tsx src/stories/patterns/mantine/HomepageListingGrids.stories.tsx src/stories/patterns/mantine/ListingDetailPattern.stories.tsx src/stories/patterns/mantine/ListingCardPattern.stories.tsx src/stories/mantine/primitives/AppImage.stories.tsx | Tee-Object -Append "$ev\i0.log"
```

Expected: `win32`, then these hashes, in this order:
1. `409d44afa3d4e686ba23bded8e08e4a5ae7080cd`
2. `7711aeac59fc6443c584c7d0fc3eaeff7734738b`
3. `e86072613bd52c17bd703c4d405941412c128f0f`
4. `4289df36c811de6fe6bc5663e75544c996b3cfdf`
5. `52ea17b5bffa7a0c608d7c35d51a6f0a4a3c0ebd`

A different hash is `TASK SPECIFICATION CONTRADICTION`: stop.

**Gate block:** §18.5's final gate block, unchanged, with `$ev = "docs\sessions\evidence\task886\rev4"`, and the same
`$files` list. Every log ends `EXIT_CODE=0`, and each log is normalised to UTF-8 without a BOM through Node.

**Measurement**, against the rebuilt `storybook-static`, with a throwaway probe under `.artifacts/`, into
`$ev\story-measure.log`, at 320/390/1024/1440 in `en`:
- `listingcardtrack--rail-no-overflow` and `--rail`: the edge gap, horizontal overflow, and whether the rail shows
  scroll controls or a scrollbar;
- `homepagelistinggrids--{default,loading,empty}`, `listingdetailpattern--default` and `listingcardpattern--default`:
  the edge gap and horizontal overflow;
- `listingcardpattern--default`: the number of `[data-testid="media-placeholder"]` elements and the number of `<img>`.

**Grep**, into `$ev\story-grep.log`:

```powershell
git --no-optional-locks grep -n -E "globals:|maw=|size=\{[0-9]+\}|h=\{[0-9]+\}|h-\[[0-9]|style=\{|styles=\{" -- src/stories/patterns/mantine/ListingCardTrack.stories.tsx src/stories/patterns/mantine/HomepageListingGrids.stories.tsx src/stories/patterns/mantine/ListingDetailPattern.stories.tsx src/stories/patterns/mantine/ListingCardPattern.stories.tsx src/stories/mantine/primitives/AppImage.stories.tsx
```

Expected: no code line. Report every printed line, and mark any that is a comment.

### 19.6 Acceptance criteria

`GR-4 AC AUDIT — 1 revision criterion; each states an observable property; absolutes: none.`

- **AC23 [R26–R30].**
  - `story-grep.log` holds no code line.
  - In `story-measure.log`:
    - every measured Story has an edge gap of 16/16/32/32 (±1) and no horizontal overflow;
    - `rail-no-overflow` shows no scroll control at 1024 and 1440;
    - `listingcardpattern--default` has at least one placeholder, for its no-image card.
  - The session log has one GR-3b, GR-3c and GR-3d receipt for each of the five Story files.
  - Every rev4 gate log ends `EXIT_CODE=0`, `build.log` included.
- AC1–AC22 stand as amended.

### 19.7 Completion report for Revision 4

Append `## Revision 4` to the session log. It contains:
- the Files Changed table;
- R26–R30 with their evidence paths;
- every §19.5 command with its exit code;
- a `story-measure.log` summary;
- GR-3b, GR-3c and GR-3d receipts per changed Story.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` or `BLOCKED`. Update the 886 cell of `docs/backlog.md` (concise
state). No mutating git. The owner matrix (§18.9, minus the accepted save button) goes to the owner after review 6.

### 19.8 Review 6, 2026-09-30 — `PARTIALLY VERIFIED`, awaiting O83-1 and O83-5

Revision 4 is verified on the final tree.
- **Hashes and I0.** All 41 `rev4/hash-object.log` hashes equal the tree, and `rev4/i0.log` holds the five §19.5
  hashes.
- **Gates.** Every rev4 gate log ends `EXIT_CODE=0`. `storybook-static` (18:43) and `.next/BUILD_ID` (18:45) are newer
  than the last Story write (18:42). The §19.5 grep, re-run by the reviewer, prints nothing.
- **Reviewer's native probe** (`win32`, Node v22.22.3), at 320/390/768/1024/1440:
  - every measured Story has an edge gap of 16/16/24/32/32 and no overflow;
  - `rail-no-overflow` shows 0 scroll controls from 768 and 1 at 320/390;
  - `listingcardpattern--default` shows 2 placeholders that fill their frames, 10 `<img>` and 0 broken;
  - the headings follow §4.1, for example `h4` 18/18/24/24/24.
- **R29 deviation, accepted.** The list card uses `listing-thumb`, as production `ListingCard.tsx`'s horizontal
  `thumbImage` does. §19.3's plain `listing` was a kickoff imprecision.

**Next.** The owner runs O83-1, which is §18.9 without the already accepted save button, and decides O83-5 (§19.4).
- If every tuple is accepted and O83-5 is decided, the next review approves and closes 886.
- If the owner returns a tuple, the next review writes Revision 5.

---

## 20. Revision 5 — review 7, 2026-09-30 (`NEEDS REVISION`, owner returned O83-1)

This section overrides every earlier section it names. Revisions 1–4 are **kept**. Review 6 verified them (§19.8).

### 20.1 Owner result for O83-1 (§18.9 matrix, 2026-09-30, verbatim)

| §18.9 row | Owner verdict |
|---|---|
| 1 `ListingDetailPattern` | *"неприймаю. Колір кнопки чату треба зробити іншого кольору, бо наразі вона зливається з кнопкою Call. Все інше ок."* |
| 2 `ListingDetailView` → `Public Listing` | *"не приймаю, заблоковані Storybook breakpoints."* |
| 3 `ListingContactPattern` | *"все ок, але кнопка чату має бути всюди однакового кольору. Та сама проблема як і в Patterns/Mantine/ListingDetailPattern."* |
| 4 `SaveToCollectionButton` → `Closed` | **accepted** earlier (§19.1) |
| 5 `AppImage` → `Default`, `Placeholder` | *"не приймаю, там якийсь глюк з фоном на першій картинці. Перевірив у двох браузерах - проблема в коді."* (screenshot at 378px) |
| 6 gutter re-look | `ListingCardPattern`: *"не приймаю. Тут не потрібен функціонал додавання оголошення у свою папку. Прибрати його. Цей функціонал доступний лише на стоірнці деталей оголошення. Необхідно це виконати у цій задачі!"* The other six rows are **accepted**: `ListingCardTrack`, `ListingGalleryPattern`, `AgentStatisticsView`, `ListingsShellView`, `HomepageListingGrids`, `PopularLocationsView`. |

**O83-5 — DECIDED 2026-09-30, owner verbatim: *"Я обираю варіант (а)."*** The reviewer applied the rule text to
`docs/golden-rules.md` (GR-3d page-level View exemption, condition 1): a View root that renders the canonical
`.container-wide` page container now qualifies. `PopularLocationsView`'s receipt, `n/a: View carries the page gutter
(MantineHomeSection.tsx:51)`, therefore stands. No code changes.

### 20.2 Findings (review 7, reviewer-reproduced on the rev4 `storybook-static`, native Playwright, `win32`)

| # | Severity | Evidence | Req |
|---|---|---|---|
| F15 | **P1** owner return | `AppImage.stories.tsx` `Placeholder`, the standalone section: `<AspectRatio ratio={16 / 9}><MediaPlaceholder …/></AspectRatio>`. `MediaPlaceholder` is `pos="absolute" inset={0}` ("fills its positioned parent"). Mantine's `AspectRatio` is not positioned, so the placeholder escapes to the page's top edge. At 378px it paints a full-width 16:9 grey field with the 48px glyph over the first `listing` frame (the owner's screenshot; reproduced in `.artifacts/ai886-378.png`). Every placeholder inside `AppImage` is correct, because `.frame` is `position: relative` (reviewer's measure: each placeholder's box equals its frame's box). Review 5's probe sampled only the first three placeholders, which is how it missed this. | R31 |
| F16 | **P1** owner return | The send-message ("chat") trigger has the same filled `brand` colour as Call: production `ListingContact.tsx:202` `<Button type="button" fullWidth leftSection=…>` has no variant, and so does `ListingDetailPattern.stories.tsx:104` `DemoInquiryTrigger`. `ListingContactPattern.stories.tsx:47`'s stand-in is `variant="outline"`, which the owner accepted as a look but which diverges from production. | R32 |
| F17 | **P1** owner return, GR-3b | `ListingDetailView.stories.tsx:178/190/202/217`: four `globals: { viewport: { value: 'desktop1280' … } }` pins lock the toolbar. The Story is unchanged by 886 and reached the matrix as a blast-radius row, and earlier reviews did not open it. | R33 |
| F18 | **P1** owner return (instruction: *"Необхідно це виконати у цій задачі!"*) | Save-to-collection must not appear on listing cards; it belongs only on the listing-detail page. Card use today:<br>• production `FavoritesShell.tsx:214` `imageActions={<SaveToCollectionButton …/>}`, through `ListingCard.tsx` `imageActions` → `MantineListingCardPattern.tsx` `imageActions` slot (`:94`, `:156`, `:330-334`, CSS `.imageActions` in `MantineListingCardPattern.module.css`);<br>• Stories `ListingCardPattern.stories.tsx` (`withImageActions`, play assertion `:291-312`) and `Mantine/Primitives/ListingCard` (`:142-176`);<br>• tests `ListingCard.smoke.test.tsx:281+` and `MantineListingCardPattern.smoke.test.tsx:120+`.<br>After the removal, `SaveToCollectionButton`'s icon shape (`variant="icon"`, the default) has no consumer. The only live caller is `ListingContact.tsx:228` (`variant="default"`). | R34, R35 |

### 20.3 Canonical UI decision record (GR-0) — Revision 5

| Artifact | Disposition | Owner and token path |
|---|---|---|
| Send-message trigger | **REUSE** Mantine `Button` | `variant="outline"` with the theme's primary `brand`, and `leftSection` `theme.other.iconSize.standard` (the production icon size). This is the shape the owner accepted in `ListingContactPattern`, distinct from Call (filled `brand`) and WhatsApp (filled `green`). One shape in production and in both Story stand-ins. |
| Standalone placeholder frame (Story) | **REUSE** Mantine `AspectRatio` | Add `pos="relative"` (a Mantine style prop, not a `style` object), which gives the placeholder its positioned parent. |
| Card save control | **DELETE** | The `imageActions` slot, its CSS and its consumers are removed. `SaveToCollectionButton` keeps one shape, the owner-accepted default (§19.1). |

`new hardcoded visual values: NONE`.

### 20.4 Revision requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R31** | `AppImage.stories.tsx` `Placeholder`: the standalone `<AspectRatio ratio={16 / 9}>` gains `pos="relative"`, plus a comment: `MediaPlaceholder` fills its positioned parent, as `AppImage`'s `.frame` provides. Nothing else changes. | P1 | AC24 |
| **R32** | The send-message trigger is `variant="outline"` with `leftSection={<MessageCircle size={theme.other.iconSize.standard} />}` in:<br>• production `ListingContact.tsx:202` (the `ListingInquiryDialog` trigger);<br>• `ListingDetailPattern.stories.tsx:104` `DemoInquiryTrigger`;<br>• `ListingContactPattern.stories.tsx:47` `DemoInquiryTrigger` (icon size `standard`; the variant is already `outline`).<br>The disabled branch (`ListingContact.tsx:183-194`, `variant="light" color="gray"`) is unchanged. | P1 | AC25 |
| **R33** | `ListingDetailView.stories.tsx`: delete all four `globals` viewport pins (`:178/190/202/217`), and rewrite or delete any comment that explains them. Then check the file against GR-3b (fixed-width or max-width containers, `style`, raw px/rem) and fix anything found. It stays `n/a: default canvas` for GR-3d. | P1 | AC26 |
| **R34** | Remove save-to-collection from listing cards:<br>• `FavoritesShell.tsx`: drop the `imageActions` prop at `:214`, and the `SaveToCollectionButton` import if it becomes unused;<br>• `ListingCard.tsx`: delete the `imageActions` prop, its JSDoc and its pass-through;<br>• `MantineListingCardPattern.tsx`: delete the `imageActions` prop, its JSDoc and its render block;<br>• `MantineListingCardPattern.module.css`: delete the `.imageActions` rules (`.imageActions`, `.cardGrid:hover .imageActions`, `.cardGrid:focus-within .imageActions`) and their comment block;<br>• Stories: `ListingCardPattern.stories.tsx` (delete `withImageActions`, the `SaveToCollectionButton` import and the play-function block that measures the badge/save intersection, keeping the rest of `play`) and `Mantine/Primitives/ListingCard` (delete the `imageActions` usage and its comments; if an export exists only for that slot, delete the export);<br>• tests: delete the `imageActions` suites in `ListingCard.smoke.test.tsx` (`:281+`) and `MantineListingCardPattern.smoke.test.tsx` (`:120+`), plus any mocks and imports that become unused;<br>• **regression (critical flow, `docs/critical-flow-registry.md` "Listing card rendering"):** add one `ListingCard.smoke.test.tsx` test asserting that a vertical grid card renders **no** "Save to collection" control (`queryByRole('button', { name: 'Save to collection' })` is null). Prove it two-armed: temporarily render `<SaveToCollectionButton listingId=…/>` inside `ListingCard.tsx`'s vertical `image` node → the test **fails**; restore → it **passes**. Record a `git hash-object` before and after, and read and write through Node;<br>• `git grep -n "imageActions" -- src` prints nothing afterwards. | P1 | AC27 |
| **R35** | `SaveToCollectionButton.tsx` keeps one shape, the owner-accepted default:<br>• delete the icon branch (`ActionIcon`, its `radius` marker), the `variant` prop and the `className` prop if nothing passes it any more;<br>• delete every `SaveToCollectionButton.module.css` rule only the icon shape uses. If the file is then empty, delete it and its import;<br>• drop `variant="default"` from its callers `ListingContact.tsx:228` and `ListingDetailPattern.stories.tsx:186`;<br>• `SaveToCollectionButton.stories.tsx` keeps its three exports, now rendering the default shape; fix any `play` selector that relied on the icon's `aria-label`;<br>• remove any `collections.*` message key that becomes unreferenced from all four `messages/*.json` files, and report the result of the grep. | P1 | AC27 |

**Owner clarification, 2026-09-30, verbatim:** *"Прибрати треба кнопку "Зберегти у колекцію", а не Favorites!"*
R34/R35 remove **only** the "Save to collection" button from cards. These stay exactly as they are:
- `FavoriteButton` (the heart) on every card, in every Story, and its `favorite` slot;
- the `/favorites` page (`FavoritesShell`, its list of saved listings);
- `CollectionsSection`.

The only `FavoritesShell.tsx` edit is dropping `imageActions` at `:214`. A diff that touches `FavoriteButton`, the
`favorite` slot or any favorites behaviour is out of scope, and the executor stops.

**Out of scope:** no other production file.

### 20.5 Verification plan — re-entry `remediation`

Order: I0-R5 → R31 → R32 → R33 → R35 → R34 (with its plant) → gate block → measurement → grep. Evidence goes to
`docs/sessions/evidence/task886/rev5/`. Do not overwrite earlier folders. Append `## Revision 5` to the session log.

**I0-R5**, before any write:

```powershell
$ev = "docs\sessions\evidence\task886\rev5"
New-Item -ItemType Directory -Force $ev
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\i0.log"
git --no-optional-locks hash-object src/stories/mantine/primitives/AppImage.stories.tsx src/modules/listings/components/ListingContact.tsx src/stories/patterns/mantine/ListingDetailPattern.stories.tsx src/stories/patterns/mantine/ListingContactPattern.stories.tsx src/stories/patterns/mantine/ListingDetailView.stories.tsx src/modules/listings/components/FavoritesShell.tsx src/modules/listings/components/ListingCard.tsx src/design-system/mantine/patterns/MantineListingCardPattern.tsx src/design-system/mantine/patterns/MantineListingCardPattern.module.css src/modules/listings/components/SaveToCollectionButton.tsx src/modules/listings/components/SaveToCollectionButton.module.css src/stories/patterns/mantine/ListingCardPattern.stories.tsx | Tee-Object -Append "$ev\i0.log"
```

Expected: `win32`, then, in order:
1. `78bfca2413e53c82266d310f2e03d9f0c51fa414` AppImage.stories
2. `d92df5557fb9030917732e108e0f1db1722a2b59` ListingContact
3. `571e69c91788c25d5fa4c47d2f0200d039d6100b` ListingDetailPattern.stories
4. `f2b18336042bd8accf58e5429789cb5ca320828d` ListingContactPattern.stories
5. `ab65ebb33ef184dbcb23245489f7176b3b1a2564` ListingDetailView.stories
6. `087c45c5886c2d46645aef11f9ece4fe14a4a3f0` FavoritesShell
7. `41f5d338a00570e9a6233c77057afc39ed033d57` ListingCard
8. `6e4dc7a25497a079ca5242127986165d5077bef1` MantineListingCardPattern
9. `898bf775a1e4525cce4a82f7e5c5b1d47b299bc0` its module.css
10. `e7490d42fd2695265c5cab8a145859adf1f86d73` SaveToCollectionButton
11. `7cc488fe30485f0e9d67a07a3c95fbf05a6eea35` its module.css
12. `69350507f85a27b1df776592a31784b50c50127b` ListingCardPattern.stories

A different hash is `TASK SPECIFICATION CONTRADICTION`: stop.

**Gate block:** §18.5's final gate block, with `$ev = "docs\sessions\evidence\task886\rev5"`.
- **`$files`:** add `FavoritesShell.tsx`, `MantineListingCardPattern.tsx` and `.module.css`,
  `SaveToCollectionButton.module.css` (if it still exists), `ListingDetailView.stories.tsx`,
  `SaveToCollectionButton.stories.tsx`, `src/stories/mantine/primitives/ListingCard.stories.tsx`,
  `MantineListingCardPattern.smoke.test.tsx`, and every `messages/*.json` that R35 changes.
- **Smoke-test step:** add `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx`.
- **Census:** also run `node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\FavoritesShell.tsx` into `$ev\census-favorites.log`.

If `check:rendered-scope` or `check:surface-census:changed` reports a **stale** baseline entry because an edge was
removed, update that baseline through the gate's own documented update path. Record the command and the before and
after lines. A **new** block is a stop.

**Measurement**, against the rebuilt `storybook-static`, with a throwaway probe under `.artifacts/`, into
`$ev\story-measure.log`, at 320/378/390/1024/1440 in `en`:
1. `mantine-primitives-appimage--placeholder`, for **every** `[data-testid="media-placeholder"]`: its box, its
   `offsetParent`'s box and whether they are equal (±1), and the count of placeholders whose top is above the first
   frame's top.
2. `listingdetailpattern--default`, `listingcontactpattern--default` and `listingdetailview--public-listing`
   (`en`, `uk`):
   - the send-message button's computed `background-color`, `color` and `border-color`, against Call's and
     WhatsApp's;
   - every CTA's line count;
   - edge gap and overflow.
3. `listingdetailview--public-listing`, `--staff-preview-unpublished`, `--staff-preview-published` and
   `--archived-listing`: the rendered width equals the requested viewport (proving the pin is gone), edge gap
   16/16/32/48, and no overflow.
4. `listingcardpattern--default`, `mantine-primitives-listingcard--*` and `mantine-primitives-favoritesshell--*`: the
   count of "Save to collection" buttons (**0**), edge gap and overflow.
5. `mantine-primitives-savetocollectionbutton--{closed,dialog-open,saving}`: renders, with no console error.

**Grep**, into `$ev\story-grep.log`:

```powershell
git --no-optional-locks grep -n -E "imageActions|variant=.icon.|globals: \{ viewport" -- src
```

Expected: no line.

### 20.6 Type scale (GR-3c)

No production text changes size. The send-message label keeps the theme `Button` size. Every changed Story gets a
GR-3c receipt at 320/390/768/1440.

### 20.7 Acceptance criteria

`GR-4 AC AUDIT — 4 revision criteria; each states an observable property; absolutes: none.`

- **AC24 [R31].** In `story-measure.log`, every placeholder in `appimage--placeholder` equals its `offsetParent`'s box
  (±1) at every width, and no placeholder sits above the first frame.
- **AC25 [R32].** In the three detail/contact Stories, in `en` and `uk`, at every width:
  - the send-message button's `background-color` differs from Call's;
  - it equals the same button's value in the other two Stories;
  - its label is 1 line wherever the card is in the sidebar.
- **AC26 [R33].** `story-grep.log` has no `globals: { viewport` line. In all four `ListingDetailView` exports the
  rendered width equals each requested width, with no overflow.
- **AC27 [R34, R35].**
  - `story-grep.log` has no `imageActions` or `variant="icon"` line.
  - Every card Story renders 0 "Save to collection" buttons.
  - The new regression test's plant log shows **fail → pass**, with the hash witness.
  - The smoke tests, the census logs and every rev5 gate log end `EXIT_CODE=0`, `build.log` included.
  - The session log has GR-0, GR-1 (`FavoritesShell` surface), GR-3, GR-3b, GR-3c and GR-3d receipts for every
    changed Story.
- AC1–AC23 stand as amended.

### 20.8 OWNER VISUAL QA REQUIRED — O83-1, Revision 5

The owner reviews these, and records **accepted** or **returned** with a concrete defect for each:
1. `Patterns/Mantine/ListingDetailPattern` × `en`/`uk` × 320/1024/1440: the send-message colour against Call and
   WhatsApp.
2. `Patterns/Mantine/ListingDetailView` → all four exports × `en`/`uk` × 320/1024/1440, with the toolbar now free: the
   photo placeholder, the contact card and the balance.
3. `Patterns/Mantine/ListingContactPattern` × `en` × 320/1440: the same send-message colour.
4. `Mantine/Primitives/AppImage` → `Default`, `Placeholder` × `en` × 320/378/1440.
5. `Patterns/Mantine/ListingCardPattern`, `Mantine/Primitives/ListingCard` and `Mantine/Primitives/FavoritesShell`
   × `en` × 320/1440: no save-to-collection control on any card.

### 20.9 Completion report for Revision 5

Append `## Revision 5` to the session log. It contains:
- the Files Changed table;
- R31–R35 with their evidence paths;
- every §20.5 command with its exit code, including the plant log;
- a `story-measure.log` summary;
- the receipts listed in AC27.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Update the 886 cells of
`docs/backlog.md`. No mutating git.

### 20.10 Mid-execution rulings — review 7b, 2026-09-30 (overrides §20.3–§20.7 where they differ)

The executor paused during the rev5 gate re-run and asked for rulings. The reviewer inspected the working tree.
1. **R31 deviation — ACCEPTED.** Mantine 8.3's `AspectRatio` sizes its child, not its root, so `pos="relative"` on the
   root leaves it 0px tall and AC24 could not pass. The Story now nests `<Box pos="relative">` as the `AspectRatio`'s
   child and puts `MediaPlaceholder` inside it. The file has no `style` object, and a comment explains the nesting.
   R31 is amended to that shape. AC24 is unchanged.
2. **R32 colour — clarified, no code change.** In this theme, `variant="outline"` without a `color` renders the neutral
   §6l secondary style: white, a grey border and grey text (`theme.ts:912-926`, the `vars` branch at `:943`). That is
   identical to `default`. §20.3's words "the theme's primary `brand`" were wrong. The neutral outline is what the
   owner accepted in `ListingContactPattern`, and it is distinct from Call (filled `brand`) and WhatsApp (filled
   `green`). AC25 is unchanged, and the owner re-checks it in §20.8.
3. **Grep scope — kickoff defect, corrected.** §20.5 ran the `globals: \{ viewport` pattern over all of `src`. Its 46
   hits are outside 886: 16 in `PlantedVisualViolations.stories.tsx` (a deliberate planted fixture), 27 in legacy admin
   Stories under `src/components/admin/` and in the legacy `Listings/*` and `Cabinet/*` titles (their migrations replace
   them, and they are never enrolled), and 2 in `Mantine/Primitives/LightboxView` (R36 below). The corrected grep, into
   `$ev\story-grep.log`:

   ```powershell
   git --no-optional-locks grep -n -E "imageActions|variant=.icon." -- src
   git --no-optional-locks grep -n -E "globals: \{ viewport" -- src/stories/patterns/mantine src/stories/mantine
   ```

   Expected: no line from either.
4. **`MantineListingCardTrack.module.css` comment-only edit — ACCEPTED.** It was the only other file that named the
   removed `.imageActions`. Add it to `$files`.
5. **R36, new.** `src/stories/mantine/primitives/LightboxView.stories.tsx`: delete both `globals` viewport pins and
   rewrite any comment that explains them. This Story renders `AppImage` `lightbox`, a placeholder variant since R21,
   and it was a §18.6 blast-radius row. It stays `n/a: MantineStoryShell primitive` for GR-3d. Add it to `$files` and
   to the measurement at 320/1440 (rendered width equals viewport, no overflow), and add it to the owner matrix §20.8
   as row 6: `Mantine/Primitives/LightboxView` × `en` × 320/1440.

**Re-entry (executed; see §20.11):** apply item 5, then run the §20.5 gate block **once more** on the final tree. The run in progress becomes
superseded; mark it so in the session log. Then run the measurement and the corrected grep. AC26 now also covers the
`LightboxView` exports.

### 20.11 Review 8, 2026-09-30 — `PARTIALLY VERIFIED`, awaiting O83-1 (§20.8) and O83-6

Revision 5 (R31–R36) is verified on the final tree.
- **Hashes.**
  - `rev5/i0.log` holds all 12 §20.5 hashes.
  - All 17 `rev5/hash-object.log` hashes equal the tree, and `SaveToCollectionButton.module.css` is recorded as
    deleted.
  - Every other 886 file is byte-identical to its `rev4/hash-object.log` hash. The union of the two witnesses
    therefore covers the tree.
  - P3, record only: the rev5 `$files` list was narrower than §18.5's; no drift.
- **Gates.** Every rev5 gate log ends `EXIT_CODE=0`, `build.log` included, and both census logs pass.
  `storybook-static` (19:45) and `.next/BUILD_ID` (19:46) are newer than the last source write.
- **Plant (R34).** Arm 1 fails 1/14 on the planted button, and the hash differs. Arm 2 passes 14/14, and
  `hash_after` equals `hash_before` (`d2954729…`).
- **Grep.** `story-grep-corrected.log` is empty.
  - P3: `story-grep.log` is the superseded pre-R36 `-- src` run, not final evidence.
  - `git grep "globals: { viewport"` finds nothing in `LightboxView.stories.tsx` on the tree.
- **`story-measure.log`.**
  - AC24: every placeholder equals its `offsetParent` at 320/378/390/768/1024/1440, and 0 sit above the first frame.
  - AC25: send-message is `rgb(255,255,255)` with a `rgb(228,231,236)` border in all three Stories; Call is
    `rgb(236,84,71)` and WhatsApp is `rgb(2,122,72)`. The label is 1 line everywhere except
    `listingdetailview--public-listing` `uk` 320. There the card is stacked, not in the sidebar, which is outside
    AC20's scope.
- **Reviewer's native probe** (`win32`, Node v22.22.3, 18 Stories × 320/1440):
  - no overflow, and each Story's rendered width equals the viewport;
  - edge gaps: `ListingDetailView` 16/48 on `.container-wide`, `ListingCardPattern` 16/32, primitives 16/24;
  - 0 "Save to collection" buttons on every card Story; the hearts are present (`ListingCardPattern` 12,
    `FavoritesShell--populated` 8, `ListingCard` 2 and 1);
  - `SaveToCollectionButton` renders its single shape in all three exports;
  - the only console errors are the expected 404s of `/__missing-photo__.jpg`, plus two pre-existing
    `MISSING_MESSAGE` errors (→ **903**).
- **Favourites untouched.** `FavoriteButton.tsx` is not in `git status`, and `FavoritesShell.tsx`'s diff only drops
  the save button and its import.

**Filed:** **903** (P2, no sprint yet). `presentationEngine.ts:171` pushes `labelKey: key`, so every
`ListingDetailView` export logs `MISSING_MESSAGE: listing.condition` / `listing.heating` (the keys that exist are
`*_label`). It predates 886: `messages/` is unchanged.

**STOP - OWNER DECISION REQUIRED — O83-6** (the owner asked why `ListingDetailView` has no "add to favourites" button).
Production `src/app/[locale]/listings/[slug]/page.tsx:269` passes `listingId={authUser ? listing.id : undefined}`, and
`ListingDetailView.tsx:248` renders the heart only when `listingId` is set. So a **guest** sees no heart on the detail
page, while every card shows one to guests, where `FavoriteButton.tsx:76-83` opens the login sheet. The
`PublicListing` and staff-preview exports are guest or staff views, so they show no heart. `ArchivedListing` shows a
disabled one. The options:
- **(a) Recommended:** the detail page shows the heart to guests too, as cards do. `favoriteSlot` gets `listing.id`
  whenever the view is not a staff preview. `listingId` keeps gating save-to-collection and report, so those stay
  signed-in only. The `PublicListing` Story then shows the heart. This is a production change, with a
  `ListingDetailView` test (guest → heart present; staff preview → absent).
- **(b)** Production stays as it is. Add a signed-in `ListingDetailView` Story export (`isGuest: false`, a `listingId`,
  and the `AuthContext` mock), which shows the heart and the save button.

The next review writes the chosen option as Revision 6, together with any O83-1 returns. If every §20.8 tuple is
accepted and the owner chooses (b), the next review writes (b)'s Story export as Revision 6 and closes 886 after it.

---

## 21. Revision 6 — review 9, 2026-09-30 (`NEEDS REVISION`, owner returned O83-1 and decided O83-6)

This section overrides every earlier section it names. Revisions 1–5 are **kept**. Review 8 verified them (§20.11).

### 21.1 Owner results (2026-09-30, verbatim)

**O83-6 — DECIDED:** *"Обираю варіант (а)."* A guest sees the favourite heart on the listing-detail page, as on cards.

| §20.8 row | Owner verdict |
|---|---|
| 1 `ListingDetailPattern` | *"колір «Надіслати повідомлення». - треба зробити #478dec (заведи токен для цього кольору). Кнопка чату(Написати повідомлення) має бути однакова всюди."* |
| 2 `ListingDetailView` ×4 | *"все ок, але відсутня кнопка "Додати в обране"."* → O83-6 (a). |
| 3 `ListingContactPattern` | *"все ок, лише треба замінити колір кнопки "Написати повідомлення"."* |
| 4 `AppImage` `Default`, `Placeholder` | *"поведінка не однакова у Default і Placeholder. Placeholder веде себе адаптивно, Default не веде себе адаптивно."* |
| 5 `ListingCardPattern`, `ListingCard`, `FavoritesShell` | *"не приймаю. Бейджи продано та орендовано чомусь різні у примітиві і у інших сторісах. Необхідно привести до одного виду - кольорового!"* |
| 6 `LightboxView` | *"все ок."* — **accepted** |
| added | *"ListingDetailView Story має баг, коли відкритий Lightbox. Необхідно перевірити всі сторі на цей баг усередині цієї задачі."* (screenshot: Docs view, lightbox open, black thumbnails, page text showing through at the bottom) |

### 21.2 Findings (review 9, reviewer-reproduced on the rev5 `storybook-static`, native Playwright, `win32`)

| # | Severity | Evidence | Req |
|---|---|---|---|
| F19 | **P1** owner | The send-message trigger must be `#478dec` everywhere, through a new theme token. The palette pattern is `theme.ts` `MantineColorsTuple` with `primaryShade: 7` (`:367`), so `Button color=…` renders index 7 and hovers on index 8. **Contrast:** white on `#478dec` is 3.34:1, below WCAG AA's 4.5:1 for a 14–16px label. **Owner accepted the value as is, 2026-09-30, verbatim: *"залиш #478dec як є"*.** Implement it unchanged; the contrast is not a finding in later reviews. | R37 |
| F20 | **P1** owner, O83-6 | `src/app/[locale]/listings/[slug]/page.tsx:269` passes `listingId` only for a signed-in user, and `ListingDetailView.tsx:248` renders `favoriteSlot` only when `effectiveListingId` is set. So a guest sees no heart. `FavoriteButton.tsx:76-83` already opens the login sheet for a guest. | R38 |
| F21 | **P1** owner | `AppImage.stories.tsx` `Default` puts **one** cell in each `SimpleGrid cols={{ base: 1, sm: 2 }}`. From 640px the photo takes half the width and the right column is empty. `Placeholder` has two cells per row and fills the width. | R39 |
| F22 | **P1** owner | The sold/rented **overlay** colour exists only in the consumer: `ListingCard.tsx:60-61` `CLOSED_OVERLAY_STYLE` → `ListingCard.module.css:88-106` (`--status-info` / `--status-rented`). The pattern carries no status colour (Task 741's `overlay.className` contract), so `ListingCardPattern.stories.tsx:161-162` shows a neutral overlay while `Mantine/Primitives/ListingCard` and `FavoritesShell` show the colour. The pattern Story has no rented card. | R40 |
| F23 | **P1** owner | Lightbox. Opened in `listingdetailview--public-listing` (1440, story mode): the three thumbnails are broken `<img>` (the browser glyph), not placeholders. `GalleryThumbnailButton.tsx:37` renders Mantine `Image`, not `AppImage`, so a failed photo never reaches `MediaPlaceholder`. In Docs view they paint black. The dialog surface is `color-mix(in oklab, var(--overlay) 95%, transparent)` (`LightboxView.tsx:88`), so page text shows through at 5%: the faint text under the strip in the owner's screenshot. `MantineListingGalleryPattern.tsx:90/107` also renders Mantine `Image` with `className="h-full w-full"`. `GalleryThumbnailButton` is shared by `LightboxView` and `MantineListingGalleryPattern`. | R41, R42 |

### 21.3 Canonical UI decision record (GR-0) — Revision 6

| Artifact | Disposition | Owner and token path |
|---|---|---|
| Send-message colour | **CREATE** token `chat` | `theme.ts`: a `MantineColorsTuple` named `chat`, registered in `colors` (and in the `MantineThemeColors` type if the file declares one). Index 7 = `'#478dec'`, the owner's value, verbatim, with a comment citing O83-1 2026-09-30. Indices 8 and 9 = `darken('#478dec', 0.1)` / `darken('#478dec', 0.2)`; indices 0–6 = `lighten('#478dec', …)` in even steps. These are Mantine's own `@mantine/core` colour functions, so no second hex is invented. Consumers use `color="chat"`, never the hex. |
| Send-message trigger | **REUSE** Mantine `Button` | `variant="filled" color="chat" fullWidth leftSection={<MessageCircle size={theme.other.iconSize.standard} />}`, identical in production and in both Story stand-ins. |
| Lightbox / gallery thumbnails | **REUSE** `AppImage` `gallery-strip` | `GalleryThumbnailButton` renders `<AppImage variant="gallery-strip" src alt />`, and inherits the canonical placeholder. |
| Pattern gallery photos | **REUSE** `AppImage` `gallery-main` / `gallery-side` | Replaces Mantine `Image` + `className`. |
| Lightbox surface | **EXTEND** `LightboxView` | Opaque `var(--overlay)`, set with a Mantine `bg` prop, not a `style` object. |
| Closed-listing overlay colour | **EXTEND** `MantineListingCardPattern` | The pattern owns it: `overlay.tone: 'sold' \| 'rented'` → pattern-module classes carrying the moved `ListingCard.module.css:88-106` declarations (same tokens). This supersedes Task 741's "the pattern carries no status colour" by owner instruction (§21.1 row 5); `overlay.className` stays as a pass-through. |

`new hardcoded visual values: NONE` (the one hex is the owner's token value, in `theme.ts`).

### 21.4 Revision requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R37** | Create the `chat` token (§21.3). The send-message trigger becomes `variant="filled" color="chat"` in:<br>• `ListingContact.tsx:202`;<br>• `ListingDetailPattern.stories.tsx` `DemoInquiryTrigger`;<br>• `ListingContactPattern.stories.tsx` `DemoInquiryTrigger`.<br>The disabled branch (`ListingContact.tsx:183-194`) is unchanged. `check:design-tokens` stays at exit 0. | P1 | AC28 |
| **R38** | O83-6 (a), `ListingDetailView.tsx`: `favoriteSlot` renders `FavoriteButton` with `listingId={listing.id}` whenever `!isStaffPreview`, whatever `listingId` holds. `effectiveListingId` keeps gating save-to-collection and report, so a guest still sees neither. `page.tsx` is unchanged. Add a vitest test (new file `src/modules/listings/components/__tests__/ListingDetailView.favorite.test.tsx`, or extend an existing one) with three cases:<br>• guest (`listingId` undefined, not staff preview) → an "Add to favourites" button is present;<br>• staff preview → it is absent;<br>• guest → "Save to collection" is absent.<br>Prove the first case two-armed: plant `favoriteSlot` gated on `effectiveListingId` again → the test fails; restore → it passes; record a hash witness. | P1 | AC29 |
| **R39** | `AppImage.stories.tsx`: one shared frame helper, extracted from `PlaceholderCases`, renders every variant frame in **both** exports, so `Default` and `Placeholder` have the same grid and cell count:<br>• `Default` passes two real sources per variant (`DEMO_SRC` twice is fine);<br>• `Placeholder` keeps `[null, MISSING_SRC]`.<br>`Default` keeps its `avatar` row; its `NoSrcSquare` is deleted, because `Placeholder` covers no-src. At every width ≥640, both exports have 2 cells per variant row. | P1 | AC30 |
| **R40** | `MantineListingCardOverlay` gains `tone?: 'sold' \| 'rented'`, and the pattern applies its own module classes for it. Move the `ListingCard.module.css:88-106` rules into `MantineListingCardPattern.module.css`, with the same tokens and the `@supports` tier. `ListingCard.tsx` passes `tone: listing.status` and deletes `CLOSED_OVERLAY_STYLE` and the moved CSS.<br>`ListingCardPattern.stories.tsx`:<br>• the sold card passes `tone: 'sold'` (and keeps `className: 'consumer-overlay-hook'` for the Task 741 play assertion);<br>• add one **rented** grid card (`tone: 'rented'`, badge `color: 'purple'`, as production's `ListingCard.tsx:87-88`).<br>Extend `ListingCard.smoke.test.tsx`: a sold card's overlay carries the pattern's sold class, and a rented card's the rented class. | P1 | AC31 |
| **R41** | `GalleryThumbnailButton.tsx`: `<Image src={src} alt={alt} fit="cover" />` becomes `<AppImage variant="gallery-strip" src={src} alt={alt} />`. Remove the `Image` import. Its own Story `Mantine/Primitives/GalleryThumbnailButton` gains a failed-load example (`src="/__missing-photo__.jpg"`) in an existing or one new export, per GR-3a (EXTEND).<br>`MantineListingGalleryPattern.tsx:90/107`: Mantine `Image` + `className` become `AppImage` (`gallery-main` for the main photo, `gallery-side` for the side cells) filling the same containers. | P1 | AC32 |
| **R42** | `LightboxView.tsx:88`: the dialog surface becomes opaque `var(--overlay)`, set as a Mantine `bg` prop on the same element with the `style` object deleted. If `Modal.Content` does not accept `bg`, keep one `style` with `backgroundColor: 'var(--overlay)'`, and say so in the log. Update the comment above it. | P1 | AC32 |

**Out of scope:** `page.tsx`, **903**, the favourites page.

### 21.5 Verification plan — re-entry `remediation`

Order: I0-R6 → R37 → R38 (with its plant) → R39 → R40 → R41 → R42 → gate block → measurement → grep. Evidence goes to
`docs/sessions/evidence/task886/rev6/`. Append `## Revision 6` to the session log. **`hash-object.log` lists every
file in §18.5's `$files` plus every file this revision changes.** Review 8 recorded the rev5 narrowing as P3.

**I0-R6**, before any write: `win32`, then `git --no-optional-locks hash-object` of these files, into `$ev\i0.log`.
Expected, in order:
1. `ffef038dbbd8b0ef63b3105cf959dfeda2907f81` `src/modules/listings/components/ListingDetailView.tsx`
2. `b51c16d4f6532ff9eb752ffd0338b61a8a8baf65` `src/modules/listings/components/ListingContact.tsx`
3. `cb602a9c0acac105ee91979501a182352f139642` `src/design-system/mantine/theme.ts`
4. `a3bd82e4994813546da5d5412ba30582d58302de` `src/design-system/mantine/patterns/GalleryThumbnailButton.tsx`
5. `08251c2af7d630afd6cb27da9697635ff304d8a3` `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx`
6. `90e5c0329d032a7ad134176295563d0470dad70c` `src/modules/listings/components/LightboxView.tsx`
7. `05e8a231a7d257a0512d506a3f2f00633c90a62f` `src/design-system/mantine/patterns/MantineListingCardPattern.tsx`
8. `2306c025520804167bee13cd61687463ada812c4` `src/design-system/mantine/patterns/MantineListingCardPattern.module.css`
9. `d2954729089fda9293b4f8070ab1d155caef8a39` `src/modules/listings/components/ListingCard.tsx`
10. `3e8fd287191518ace5e9cc0c5e689655fcb563c9` `src/modules/listings/components/ListingCard.module.css`
11. `eeac23f804c8ab467da3c48b372f7b7b5a3bb73f` `src/stories/mantine/primitives/AppImage.stories.tsx`
12. `14df9633e2bd5727f6f5bc16c6cd95095c41fbdb` `src/stories/patterns/mantine/ListingCardPattern.stories.tsx`
13. `97ccc3c0bf85561878a00df902fe5983db689937` `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx`
14. `6b586ce389bb9e51acfc339ec852091260d4acee` `src/stories/patterns/mantine/ListingContactPattern.stories.tsx`

A different hash is `TASK SPECIFICATION CONTRADICTION`: stop.

**Gate block:** §18.5's block with `$ev = "docs\sessions\evidence\task886\rev6"`, plus these smoke-test paths:
- `src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx`;
- the R38 test file;
- `MantineListingCardPattern.smoke.test.tsx`.

A stale-baseline report follows the §20.5 rule.

**Measurement**, native Playwright on the rebuilt `storybook-static`, into `$ev\story-measure.log`:
1. **Lightbox sweep, in story mode and Docs view.**
   - Scope: every Story whose file renders `LightboxView`, `ListingGallery`, `GalleryThumbnailButton` or
     `MantineListingGalleryPattern`. Build the list with `git grep -l` and print it. At minimum it holds
     `listingdetailview--*` (4 exports, plus `--docs`), `lightboxview--*`, `listinggallerypattern--default`,
     `listingdetailpattern--default` and `gallerythumbnailbutton--*`.
   - Method: at 390 and 1440, open the lightbox where the Story has a trigger.
   - Record:
     - the count of broken `<img>` (`complete && naturalWidth === 0`), which must be **0**;
     - the placeholders inside the thumbnail buttons;
     - the dialog's computed `background-color` alpha, which must be **1**.
2. **Send-message**, in `listingdetailpattern--default`, `listingcontactpattern--default` and
   `listingdetailview--public-listing` (`en`, `uk`, 320/1024/1440): `background-color` = `rgb(71, 141, 236)` in all
   three; label line count.
3. **Favourite**, in `listingdetailview--public-listing` and `--archived-listing`: a heart is present.
   `--staff-preview-*`: absent. "Save to collection" is absent in `--public-listing`.
4. **`appimage--default` and `--placeholder`**, at 320/640/1024/1440: cells per variant row, equal in both exports.
5. **Overlay colour**, in `listingcardpattern--default` and `mantine-primitives-listingcard--*`: the sold overlay's
   `background-color` is equal across the Stories, and so is the rented one's. Both are non-neutral.

**Grep**, into `$ev\story-grep.log`:

```powershell
git --no-optional-locks grep -n -E "#478dec" -- src
git --no-optional-locks grep -n -E "<Image |closedOverlay|CLOSED_OVERLAY_STYLE|95%, transparent" -- src/design-system/mantine/patterns/GalleryThumbnailButton.tsx src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingCard.module.css src/modules/listings/components/LightboxView.tsx
```

Expected: the first grep prints only `theme.ts` lines; the second prints nothing.

### 21.6 Type scale (GR-3c)

No text changes size. Every changed Story gets a GR-3c receipt.

### 21.7 Acceptance criteria

`GR-4 AC AUDIT — 5 revision criteria; each states an observable property; absolutes: none.`

- **AC28 [R37].** Send-message is `rgb(71, 141, 236)` in all three Stories, in both locales, at every measured width.
  The only `#478dec` in `src` is in `theme.ts`, and `check:design-tokens` exits 0.
- **AC29 [R38].**
  - The heart is present for a guest and absent in staff preview.
  - "Save to collection" stays absent for a guest.
  - The R38 test passes, and its plant log shows **fail → pass** with the hash witness.
- **AC30 [R39].** `Default` and `Placeholder` have equal cells per variant row at every measured width, 2 from 640.
- **AC31 [R40].**
  - The sold overlays have equal colour across the Stories, and so do the rented overlays.
  - The pattern Story has a rented card.
  - The grep prints no `closedOverlay` or `CLOSED_OVERLAY_STYLE` line, and the smoke tests pass.
- **AC32 [R41, R42].** In the lightbox sweep, in both modes, there are 0 broken `<img>`, the thumbnails show
  placeholders, and the dialog background alpha is 1.
- Every rev6 gate log ends `EXIT_CODE=0`, `build.log` included, and the GR-0/1/3/3a/3b/3c/3d receipts are in the
  session log. AC1–AC27 stand as amended.

### 21.8 OWNER VISUAL QA REQUIRED — O83-1, Revision 6

1. `ListingDetailPattern`, `ListingContactPattern` × `en`/`uk` × 320/1440: send-message is `#478dec`.
2. `ListingDetailView` → all four exports × `en` × 320/1440: the heart for a guest; open the lightbox, in the Story
   and in Docs view.
3. `AppImage` → `Default`, `Placeholder` × `en` × 320/1024/1440: identical behaviour.
4. `ListingCardPattern`, `Mantine/Primitives/ListingCard`, `FavoritesShell` × `en` × 320/1440: coloured sold/rented.
5. `ListingGalleryPattern`, `GalleryThumbnailButton` × `en` × 320/1440, with the lightbox open where it applies.

### 21.9 Completion report for Revision 6

Append `## Revision 6` to the session log. It contains the Files Changed table, R37–R42 with their evidence paths,
every command with its exit code, the plant logs, a `story-measure.log` summary, and the receipts. Status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Update the 886 cells of
`docs/backlog.md`. No mutating git.

### 21.10 Review 10, 2026-09-30 — `PARTIALLY VERIFIED`, awaiting O83-1 (§21.8)

Revision 6 (R37–R42) is verified on the final tree.
- **I0 and hashes.** `rev6/i0.log` holds all 14 §21.5 hashes. All 32 `rev6/hash-object.log` hashes equal the tree,
  and every other changed file equals its rev4 or rev5 witness.
  - P3, record only: §21.5 asked for the full `$files` list and the log is narrower again. There is no drift.
- **Gates.** Every rev6 gate log ends `EXIT_CODE=0`. The log mtimes are all 20:57:28, from the BOM pass, so they do
  not date the runs. `.next/BUILD_ID` (20:56) and `storybook-static` (20:53) are newer than the last source write
  (20:52:15, `ListingDetailPattern.stories.tsx`), and `next build` type-checks.
- **Reviewer's re-runs** (`win32`, Node v22.22.3):
  - `eslint` on the two last-changed Stories: 0;
  - `vitest`, the R38 test plus `ListingCard.smoke`: 19/19.
- **Reviewer's native probe:**
  - **AC28:** send-message is `rgb(71, 141, 236)` in all three Stories.
  - **AC29:** `--public-listing` has 1 active heart and 0 save buttons; `--archived-listing` has 1 disabled heart;
    `--staff-preview-*` has none.
  - **AC30:** `appimage--default` and `--placeholder` have identical grids at 320/640/1440: 2 cells, 2 rows at 320
    and 1 row from 640.
  - **AC31:** in `listingcardpattern--default` and `mantine-primitives-listingcard--default`:
    - the sold badge is `rgb(0,134,201)` and the sold overlay `oklab(0.577 -0.087 -0.151 / 0.8)`;
    - the rented badge is `rgb(101,71,214)` and the rented overlay `oklab(0.577 0.074 -0.158 / 0.8)`.
  - **AC32:** the lightbox sweep covers `listingdetailview` ×4 plus Docs view, `lightboxview` ×3,
    `listinggallerypattern` and `listingdetailpattern` at 390/1440:
    - every opened dialog has an opaque `oklch(0 0 0)` surface and 0 broken `<img>`;
    - `listingdetailview` thumbnails are 3/3 placeholders, in story mode and in Docs view.
  - Edge gaps: `listingdetailpattern` and `listingcontactpattern` 16/32; `listingdetailview` 16/48 on
    `.container-wide`.
- **Not established by a probe, and not a defect:** `listingdetailpattern--default` at 390 exposes no lightbox trigger
  on the mobile swipe gallery. `gallerythumbnailbutton--default` is not a lightbox Story. Both are covered by the owner
  matrix (§21.8 row 5).
- **Note:** `ListingGallery.tsx`'s "All photos" trigger is a legacy shadcn `button` (`data-slot="button"`). It is known
  debt of the listing-detail surface (§18.4) and unchanged.

**Next.** The owner runs §21.8. If every tuple is accepted, the next review approves and closes 886. If the owner
returns a tuple, the next review writes Revision 7.

---

## 22. Revision 7 — review 11, 2026-09-30 (`NEEDS REVISION`, owner returned §21.8 row 5)

This section overrides every earlier section it names. Revisions 1–6 are **kept**. Review 10 verified them (§21.10).

### 22.1 Owner result for §21.8 (2026-09-30, verbatim)

| Row | Owner verdict |
|---|---|
| 1 send-message `#478dec` | *"приймаю."* |
| 2 `ListingDetailView` heart + lightbox | *"приймаю."* |
| 3 `AppImage` `Default`/`Placeholder` | *"приймаю."* |
| 4 coloured sold/rented | *"приймаю."* |
| 5 `ListingGalleryPattern`, `GalleryThumbnailButton` + lightbox | *"не приймаю. Фото ніколи не має перекривати текст над фото, який показує нумерацію фото. Дивись скріншот. Відступ має бути канонічний, не хардкод!"* The screenshot shows `listinggallerypattern--default`'s lightbox at 1234×812: the photo's top edge runs through the "2 / 9" counter. |

### 22.2 Finding (review 11, read in source)

| # | Severity | Evidence | Req |
|---|---|---|---|
| F24 | **P1** owner | `LightboxView.tsx:96-104`: the counter is `Box pos="absolute" top={resolveGalleryOffset(theme, 'md')} left="50%"`, an overlay on the media region.<br>• Desktop: the media column (`Stack pos="relative" h="100%"`, `:139-147`) starts at the modal body's top edge, and the media box (`.fill`, `flex: 1`) takes all the height the strip leaves. A photo that fills that height starts under the counter.<br>• Mobile: the swipe track is `h="100%"`, so a full-bleed slide sits under the counter too.<br>The thumbnail strip already follows the right rule: *"reserved space in normal flow, never an overlay"* (`:153-160`, Task 824 R25). The counter is the one text element that does not.<br>`LightboxView` serves every lightbox: `ListingGallery` (production and `ListingDetailView`), `MantineListingGalleryPattern` and the `LightboxView` primitive. | R43 |

### 22.3 Canonical UI decision record (GR-0)

| Artifact | Disposition | Owner and token path |
|---|---|---|
| Lightbox counter | **EXTEND** `LightboxView` | The counter becomes an in-flow row **above** the media region, in both the desktop and the mobile branch. It uses Mantine spacing props from the theme scale (`py="md"`, the same `md` step the old `top` offset used), keeps `fz="sm"`, `lh={theme.other.lineHeight.lightboxCounter}` and `.counter`'s colour, and is centred with `ta="center"`. It has no `pos="absolute"`, no `left: 50%` and no `.centerX` transform. No px/rem, and no new CSS rule except deleting `.centerX` if nothing else uses it. |

### 22.4 Revision requirement

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R43** | `LightboxView.tsx`:<br>• the `Center pos="relative" w="100%" h="100%"` body child becomes a column: counter row, media region (`flex: 1`, `min-height: 0` — the existing `.fill`/`.minZero` mechanics), and on desktop the thumbnail strip;<br>• the counter `Box` loses `pos`/`top`/`left`/`.centerX`, and renders in flow with `py="md"` and `ta="center"`;<br>• the mobile branch gets the same counter row above its swipe container, and the swipe container fills the remaining height, not `h="100%"` of the body;<br>• close and prev/next (`GalleryNavActionIcon`, `GalleryDesktopNavigation`) stay as they are; they are controls, not text over the photo;<br>• the mobile pagination rail stays as it is;<br>• rewrite the comments that describe the counter's position;<br>• the `LightboxView` Story needs no change unless a `play` assertion reads the counter's position. Update it if one does.<br>Add a regression test to `ListingGallery.portal.smoke.test.tsx` (or a new `LightboxView` test): the counter element is not `position: absolute`, and it precedes the media region in DOM order. Prove it two-armed: restore `pos="absolute"` → the test fails; revert → it passes; record a hash witness. | P1 | AC33 |

**Out of scope:** everything else. Rows 1–4 are accepted.

### 22.5 Verification plan — re-entry `remediation`

Order: I0-R7 → R43 (with its plant) → gate block → measurement. Evidence goes to `docs/sessions/evidence/task886/rev7/`.
Append `## Revision 7` to the session log.

**I0-R7:** `win32`, then `git --no-optional-locks hash-object` into `$ev\i0.log`. Expected:
1. `97ec3e230a00fa7881516be10a2f68b78a6e6104` `src/modules/listings/components/LightboxView.tsx`
2. `fae9abba107d2effd2aa24f54556bf5da3d6b5ad` `src/modules/listings/components/LightboxView.module.css`
3. `a406af4149488c08ddc128071f1d8a814586f2cc` `src/stories/mantine/primitives/LightboxView.stories.tsx`
4. `358cbd0243cf5b513890d7edad0f30c513c85f81` `src/design-system/media/appImageConfig.ts` (added by §22.8a)

A different hash is `TASK SPECIFICATION CONTRADICTION`: stop.

**Gate block:** §18.5's block with `$ev = "docs\sessions\evidence\task886\rev7"`, the smoke tests of §21.5, and the
R43 test. `hash-object.log` lists **every** path in `git status --short` that 886 owns, not only this revision's.
Reviews 8 and 10 recorded the narrowing twice.

**Measurement**, native Playwright on the rebuilt `storybook-static`, into `$ev\story-measure.log`:
- Stories: `mantine-primitives-lightboxview--*` (3), `patterns-mantine-listinggallerypattern--default` and
  `patterns-mantine-listingdetailview--public-listing`, each with the lightbox open.
- Viewports: 320×640, 390×844, 768×1024, 1024×768, 1234×812, 1440×900 and 1920×1080.
- Photo index: 1 and 2 (the owner's screenshot shows photo 2).
- Record:
  - the counter's box, and the visible media frame's box (the `AppImage` `lightbox` frame's rendered `<img>` or
    `MediaPlaceholder`);
  - the vertical gap = media top − counter bottom, which must be **≥ 0** in every cell;
  - whether the counter is `position: absolute`, which must be **no**;
  - that the thumbnail strip does not intersect the media;
  - horizontal overflow.

### 22.6 Acceptance criteria

`GR-4 AC AUDIT — 1 revision criterion; each states an observable property; absolutes: none.`

- **AC33 [R43].**
  - In `story-measure.log`, in every cell, the counter does not intersect the media frame (gap ≥ 0), the counter is
    not `position: absolute`, the strip does not intersect the media, and there is no overflow.
  - The R43 test's plant log shows **fail → pass**, with the hash witness.
  - Every rev7 gate log ends `EXIT_CODE=0`, `build.log` included.
  - The session log has GR-0, GR-1 and GR-3b/3c/3d receipts for the lightbox Stories.
- AC1–AC32 stand.

### 22.7 OWNER VISUAL QA REQUIRED — O83-1, Revision 7

1. `ListingGalleryPattern`, `GalleryThumbnailButton` and `LightboxView` × `en` × 320/1234/1440, with the lightbox open
   on photos 1 and 2: the counter sits above the photo and never over it.
2. `ListingDetailView` → `Public Listing` × `en` × 320/1440, with the lightbox open: the same.

### 22.8a Amendment — owner clarification, 2026-09-30 (overrides §22.2–§22.6 where they differ)

**Owner, verbatim:** *"проблема в тому, що контейнер не обрізає фото і воно може взагалі вилазити за межі екрану.
Тому тут проблема в тому, що має бути контейнер фото, який буде обрізати по своїх межах фото, яке всередині."*

**Reviewer's measurement** (native Playwright on the rev6 `storybook-static`, `mantine-primitives-lightboxview--default`):
- The desktop photo frame is `overflow: visible`, and its box starts at the viewport's top edge (`top: 0`), under the
  counter (16–36px).
- The painted photo starts at y=0 at 1440×600 and at y=24 at 1920×700, so it runs under the counter.
- At 1234×812 it is letterboxed from y=80.
- The photo stays inside its `<img>` box only because of `object-fit: contain`. Nothing clips it.

**Source:**
- `appImageConfig.ts` `lightbox.containerClass` = `cn(styles.frame, styles.frameFill)`. It is the **only**
  photo-filling variant without `styles.frameClip`.
- On desktop, the media holder (`LightboxView.tsx`, the `Box pos="relative" w="100%" className={styles.fill}`) clips
  nothing.
- The mobile swipe container already clips (`.clip`, `LightboxView.module.css:41`).

**R43 is extended.** The photo gets one bounded, clipping container:
1. **Bounds.** The photo container is the region between the in-flow counter row (above) and the thumbnail strip
   (below, desktop) or the bottom edge (mobile). Horizontally it is the existing
   `maw={theme.other.boxSize.lightboxMediaMaxWidth}` column. Its size comes only from the flex column
   (`flex: 1; min-height: 0`), with no fixed height.
2. **Clipping.**
   - `appImageConfig.ts`: the `lightbox` variant's `containerClass` gains the canonical `styles.frameClip`, so the frame
     clips whatever it holds.
   - The desktop media holder also clips, through the existing canonical `.clip` rule of `LightboxView.module.css`
     (the one the mobile container uses). No new CSS rule, and no `style`.
   - The mobile branch keeps `.clip`, and its swipe container now fills the region under the counter row, not the
     full body.
3. **Test.** In the R43 test file, add a case: `VARIANTS.lightbox.containerClass` contains the `frameClip` class, and
   the rendered desktop media holder carries `.clip`. Plant it two-armed: remove `frameClip` → the test fails;
   restore → it passes; record a hash witness.

**Measurement additions** (the §22.5 cells), recorded per cell:
- the frame's and the holder's computed `overflow`: **hidden**;
- the painted photo rect (computed from `naturalWidth`/`naturalHeight` and `object-fit`) lies inside the frame rect;
- the frame rect lies inside the viewport;
- frame top ≥ counter bottom.

Add one synthetic arm per viewport, run in the page and restored in `finally`: set the `<img>`'s `object-fit` to
`none` and confirm that the frame still clips it (`overflow: hidden`, and the frame rect is unchanged).

**AC33 is extended:** every cell shows `overflow: hidden` on the frame and the holder, the painted photo inside the
frame, the frame inside the viewport, and a counter gap ≥ 0. The new plant logs show **fail → pass**. §22.7 is
unchanged, and the owner also checks the clipping.

### 22.8 Completion report for Revision 7

Append `## Revision 7` to the session log. It contains the Files Changed table, R43 with its evidence, every command
with its exit code, the plant logs, the `story-measure.log` summary and the receipts. Status: `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW` or `BLOCKED`. Update the 886 cells of `docs/backlog.md`. No mutating git.
