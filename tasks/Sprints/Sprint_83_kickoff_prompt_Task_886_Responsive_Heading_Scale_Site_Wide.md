# Task 886 — every Mantine heading steps down on a phone, through one scale, and a gate keeps it that way

Sprint 83 · P1 · QA profile **Q3** (site-wide responsive typography + a new blocking governance gate) · **after 869 is
approved** · **after 853 is approved** (added 2026-09-26 by 853 review 1, §3.1a) · owner actions **O83-1**, **O83-2**,
**O83-3** · **Status: `NEEDS REVISION` — review 2, 2026-09-30. Start at §17 (Revision 2), including its addendum
§17.6 (R17); it overrides every earlier section it names. §16 (Revision 1) is implemented and kept, except R10, which
§17.6 withdraws.**

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
- `ResetPasswordView.stories.tsx` = `cae86b5a71acfdc943c30ed43d27ead61482f888` (this equals `HEAD`, so the file is not in `status`);
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
