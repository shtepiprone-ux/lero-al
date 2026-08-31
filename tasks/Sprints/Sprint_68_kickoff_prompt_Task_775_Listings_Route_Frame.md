# Task 775 — `/listings` route chrome: `ListingsPageFrame` (Mantine) with its canonical story

**Sprint:** 68 · **Priority:** P2 · **QA profile:** **Q3 Full Visual Matrix** · **Filed:** 2026-08-30
**State:** 🔁 **REVISION 2 — RETURNED TO EXECUTOR (Phase A)** — Revision 1 implemented, reviewed, **not approved**; status ladder and phase order in §0a
**Revised:** 2026-08-31 (**Revision 2.1**) · supersedes the 2026-08-30 filing · see §0

> **D775-A = A2**, **D775-B = B2** and **D775-C = C1** are decided, closed and binding (§5), quoted verbatim from the
> owner on **2026-08-30**. None of the three is re-litigated anywhere in this kickoff, and each is bound to exactly
> one implementation route with a binary acceptance criterion.
>
> The frame therefore consumes **only Mantine tokens** — gutter `md → xl → 2xl → 3xl`, breadcrumb `gray.4/5/8` and
> `size="sm"` — with no raw value and no Tailwind-owned variable in the **implementation-source set** (§10.3a), and
> exactly **one** `design-tokens-allow:` marker, quoted verbatim in §10.3c. The two new spacing keys are declared
> **natively in the Mantine types** (§3.3c), not accepted through the `(string & {})` escape hatch.

---

## 0. Revision record — 2026-08-31 (Revision 2, amended by **Revision 2.1** the same day)

Revision 1 (2026-08-30) was implemented and **rejected at orchestrator review**. The implementation is materially
correct — `page.tsx` is 98 lines / 0 `className`; the gutter ladder measures `16 → 24 → 32 → 48px` at
`640 / 1024 / 1440` with `max-width: 1408px` in all 28 probed cells; the breadcrumb measures 14px, `#667085`,
`#1d2939`, 6px; the story passes 16/16; `npm run build` exits 0 — but four criteria failed **as written**, and two of
those failures were caused by this kickoff's own text rather than by the executor.

| # | Failure | Cause | Fixed by |
|---|---|---|---|
| 1 | `1536` and `.container-wide` present in `ListingsPageFrame.tsx:20` and in the `theme.ts` provenance comment | **executor defect** — §10.8 asks for a *line-number* citation, which never requires those strings | §10.3a, §10.3b |
| 2 | a `design-tokens-allow:` marker in `ListingsPageFrame.module.css:10` | **kickoff contradiction** — §10.4 mandates the CSS-module route for token-less lengths, the token gate then demands a marker, and §10.3 banned it | §10.3c — one verbatim exception |
| 3 | AC4 read literally forbids the `theme.ts` change that AC12 / D775-C **mandate** | **kickoff contradiction** | §10.4, AC4 |
| 4 | separator `color`, `--mantine-spacing-*` and the interaction pass were never measured; no baseline exists at all | probe under-specified (§10.10) and §9 Step 1 skipped | §10.10a–d, §9, §13a |

**Binding on Revision 2.** D775-A = A2, D775-B = B2 and D775-C = C1 are **not re-opened**, and nothing in this
revision changes a single rendered value. Every change below is to *checkable wording* and to the *evidence
contract*. The already-implemented component's rendered output satisfies the corrected contract; what is outstanding
is (a) removing the banned strings from three comments, (b) four new probe recordings plus a real interaction pass
plus the `probeHash` field, and (c) an owner-supplied baseline that only the owner can produce.

**Revision 2.1 amends Revision 2 on six points, none of which touches a rendered value or the implementation:**
the string-ban is scoped to Task 775's *added/changed* lines via the single §10.3b-1 contract (a whole-file scan
would have failed AC3 unconditionally on the pre-existing `.container-wide` at `messages/*.json:2383`); the
"Phase C ran without a bundle" state is deleted everywhere; §0a assigns `pre-edit` to the owner and `post-edit` to
Sonnet with no overlap; `probeHash` becomes a required top-level JSON field (§10.10e) instead of an unlocated
"same hash" requirement; the `BLOCKED` row no longer places fingerprint mismatch in Phase A; and no line count is
asserted anywhere. **Phase A remains not started.**

## 0a. Execution order and status ladder — the single authority (Revision 2)

Revision 1 is already implemented in the working tree. Revision 2 therefore does **not** restart the migration; it
completes it in four phases. **Where §7, §9 or §13a appear to state an order, this section governs.**

| Phase | Owner of the phase | Work | Baseline needed? |
|---|---|---|---|
| **A** | Sonnet | Remove the §10.3b strings from the three comments; extend `scripts/task775-listings-frame-route-probe.mjs` with §10.10a–d. **Tooling and comments only — no rendered value changes.** | **No** |
| **B** | Owner | Produce the baseline bundle per §13a, using the Phase-A probe against a clean `c864431d0` server | — |
| **C** | Sonnet | Re-run all thirteen §13 gates on the final tree, and the **`post-edit` probe run only** | Yes — the bundle must already exist |
| **D** | Opus | Compare the owner's `pre-edit` artefact against Sonnet's `post-edit` artefact, rule on the AC9 / AC10 waivers, decide | Yes |

**Phase A does not wait for the bundle.** The absent bundle blocks Phase C, never Phase A — the probe must exist
*before* the owner can run it, so requiring the bundle first would deadlock the task.

**Who runs which probe run — one assignment, no overlap.** Phase B (owner) produces **`pre-edit` only**, against a
clean `c864431d0` server. Phase C (Sonnet) produces **`post-edit` only**, on the final tree. Phase D (Opus) compares
the two. Sonnet never produces a `pre-edit` run; the owner never produces a `post-edit` run.

**Phase C cannot start without a valid bundle.** There is no "Phase C ran without a bundle" state anywhere in this
task: if the bundle is absent or invalid, Phase C does not begin.

**Status ladder — the only vocabulary this task uses:**

| Status | Meaning |
|---|---|
| `REVISION 2 — RETURNED TO EXECUTOR (Phase A)` | current state; Revision 1 reviewed and not approved |
| `AWAITING OWNER BASELINE (Phase B)` | Phase A landed; the bundle is the only blocker |
| `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (Phase D)` | Phase C complete with the bundle in hand — the executor's strongest status |
| `PARTIALLY IMPLEMENTED` | Phase A is complete, but the owner bundle is absent or invalid, so Phase C never started and AC3 / AC7 / AC9 / AC10 are **NOT MET** and unwaivable |
| `BLOCKED` | `npm run build` red; or a **Phase-A** rule broken — a banned string in the §10.3b-1 corpus, a second or altered `design-tokens-allow:` marker, a missing `probeHash`; or, in **Phase C/D**, a probe-hash or failure-fingerprint mismatch |

`docs/backlog.md` must carry the phase name from this ladder and nothing else.

## 1. Mode and task type

Implementation task. Type: **UI migration, current Mantine path** — one route-chrome surface, plus the canonical
Storybook artifact that proves it. Not a filter, toolbar, shell, pagination, drawer or save-search change; not a
repository-wide de-Tailwind; not a detector or governance task.

## 2. Objective

`src/app/[locale]/listings/page.tsx` stops owning page chrome. The breadcrumb bar, page background and page gutter
move into one new Mantine component, `ListingsPageFrame`, which is rendered by the route and proven by one canonical
`Patterns/Mantine/ListingsPageFrame` story that statically imports the real component. The route's metadata, Supabase
queries, filter parsing, sorting, pagination arithmetic, favorites and `ListingsShell` are byte-unchanged in behavior.

The deliverable is the migration **plus** the evidence that the rendered page did not move: the Q3 visual matrix for
the new story and a task-owned route probe proving identical gutter geometry before and after.

## 3. Verified context

Every line reference below was read in this repository on **2026-08-30**. Labels follow `create-task`'s evidence rules.

### 3.1 The surface — `src/app/[locale]/listings/page.tsx`

- **FACT** — the file is **108 lines** and contains **7** `className` literals, all inside the JSX returned at
  `:80`-`:107`. There is no other markup in the file.
- **FACT `:81`** — `<div className="min-h-screen bg-background">` wraps the page.
- **FACT `:82`-`:93`** — the breadcrumb bar: `<div className="bg-muted/40 border-b">` →
  `<div className="container-wide py-2.5">` →
  `<nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label={tc('aria_breadcrumb')}>` →
  a `next/link` `Link` to `/${locale}` with `className="hover:text-foreground transition-colors"` rendering
  `{tNav('home')}` → a literal `<span>/</span>` → `<span className="text-foreground">{t('listings_page_title')}</span>`.
- **FACT `:95`** — `<div className="container-wide py-6">` wraps `<ListingsShell …/>` (`:96`-`:104`), which receives
  `listings`, `total`, `page`, `locations`, `activeFiltersCount`, `tab`, `favoriteIds`.
- **FACT** — the three i18n reads are `common.aria_breadcrumb` (`messages/en.json:475`), `nav.home` and
  `listing.listings_page_title`, all resolved by `getTranslations` in this **server** component (`:27`-`:29`).
- **FACT `:74`-`:78`** — a failed Supabase query is logged and the page still renders with `listings ?? []`. The
  chrome therefore renders on the error path too.

### 3.2 Server/client boundary

- **FACT** — `page.tsx` is a server component; `ListingsShell` (`'use client'`) is the route's only client island.
- **FACT** — `@mantine/core` ships `'use client'` per component
  (`node_modules/@mantine/core/esm/components/Breadcrumbs/Breadcrumbs.mjs:1`).
- **FACT** — `src/app/[locale]/page.tsx:2` already imports `Title, Text, Box, Stack, Group` from `@mantine/core`
  directly inside a server component, and `src/design-system/mantine/patterns/MantineHomeSection.tsx` has no
  `'use client'` directive.
- **INFERENCE** (from the two facts above) — `ListingsPageFrame` can be a server component that renders Mantine
  client components, provided it declares no `'use client'` and accepts no function props. Established precedent,
  not a new pattern.

### 3.3 The width contract

- **FACT `src/app/globals.css:705`-`:715`** — `.container-wide` is `width:100%; max-width:88rem; margin-inline:auto;`
  with padding `1rem → 1.5rem @640 → 2rem @1024 → 3rem @1536`.
- **FACT `docs/design-system.md:92`, `:100`, `:155`, `:401`** — `.container-wide` is the public page-container source
  of truth and `/listings` is listed on it.
- **FACT `docs/mantine-responsive-design-system.md:250`** — "New Mantine pattern components must NOT depend on
  `.container-wide` for responsive layout".
- **FACT `docs/mantine-responsive-design-system.md:684`** — removing `.container-wide` from `globals.css` is Phase 6,
  not this task.
- **FACT** — this repository's largest Mantine breakpoint is `xxl = 1440`, not 1536; Task 668 moved the homepage grid
  step from Tailwind `2xl` (1536) to Mantine `xxl` (1440) as an explicitly owner-approved adaptive change, recorded in
  `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx`.
- **INFERENCE** — Mantine responsive props therefore **cannot** reproduce the current gutter above 1536px; the top
  step lands at 1440 instead. Under **D775-A = A2** that is the chosen and accepted outcome, bounded and measured in
  §3.3b — not an accident to be worked around.
- **FACT** — `src/design-system/mantine/patterns/MantineHomeSection.tsx:51` itself renders
  `<Box className="container-wide">`, so the `:250` rule already has a live exception in the pattern library. Reported
  here, not fixed here.
- **FACT `src/app/globals.css:667`** — `@layer utilities {` opens the block that contains `.container-wide` at
  `:705`. Recorded for completeness only: **A2 reproduces no CSS rule**, so there is no cascade layer to match and
  **D34** has no application in this task.
- **FACT `src/app/globals.css:299`** — `--width-page-max: 88rem;` with the comment *"1408px — access via
  `var(--width-page-max)` or `.container-wide`"*. The max-width already has a registered token.
- **FACT `src/design-system/mantine/theme.ts:190`-`:196`** — Mantine `spacing` is `xs .5 / sm .75 / md 1 / lg 1.25 /
  xl 1.5` rem. `base` (1rem) maps to `md` and the 640 step (1.5rem) maps to `xl`, but the scale contains **no `2rem`
  and no `3rem`** step. This is the whole of **D775-C**: A2's mechanism is settled, its two upper values have no
  token to come from.
- **FACT `src/design-system/mantine/theme.ts:163`-`:170`** — breakpoints are `xs 320 / sm 640 / md 768 / lg 1024 /
  xl 1280 / xxl 1440`. There is no 1536 breakpoint, and under **D775-A = A2** none is introduced: the top step moves
  to `xxl = 1440`.

### 3.3b Measured consequences of D775-A = A2

- **FACT** — the two ladders differ in exactly one band. `.container-wide` gives `2rem` from 1024 and `3rem` from
  1536; the Mantine ladder gives `2rem` from `lg = 1024` and `3rem` from `xxl = 1440`. Below 1440, and at 1536 and
  above, they are identical. **Between 1440 and 1535 inclusive the new component pads `3rem` where the old markup
  padded `2rem`** — 1rem more per side, so the content column is 2rem narrower in that band. This is the change the
  owner accepted as a migration result; the probe measures it rather than assuming it.
- **FACT** — of the Q3 canonical widths exactly **one** falls in that band: **1440**. `1920` and `2560` are at or
  above 1536 and must come back identical.
- **CONFLICT — surfaced, not decided here.** `docs/design-system.md:155`: *"Header and footer inner rows also use
  `.container-wide` **so chrome aligns with content**."* `HeaderView.tsx:114` and `FooterView.tsx:69` both still
  carry `className={cn('container-wide', …)}`. **INFERENCE** — between 1440 and 1535 the migrated page content sits
  on a 3rem gutter while the site header and footer stay on 2rem, so the content column visibly stops aligning with
  the chrome above and below it until those two surfaces migrate. The owner accepted "зміна gutter від 1440px"; this
  kickoff records the *alignment* consequence separately because it was not part of that sentence, and requires it to
  be **measured and reported** (§10.9, AC3). It does not block this task.
- **FACT `src/app/globals.css:132`-`:140`** — `--space-4: 1rem`, `--space-6: 1.5rem`, `--space-8: 2rem`,
  `--space-12: 3rem`, all inside the `@theme inline {` block opened at `:35`. **INFERENCE** — these are the
  Tailwind-owned runtime names Sprint 62/65 is retiring (Task 770's manifest is built from exactly this family), so
  consuming them from a new Mantine component would add to the debt those tasks exist to remove. This is why the
  owner rejected route C3.

### 3.3c C1 mechanics — verified in the installed Mantine, not assumed

Everything below was read in `node_modules/@mantine/core` on 2026-08-30. It is recorded because C1 adds keys to a
scale the framework owns, and a wrong assumption there fails silently as an unresolved `var()` rather than loudly.

- **FACT** `core/Box/style-props/resolvers/spacing-resolver/spacing-resolver.mjs` — a string style-prop value that is
  a key of `theme.spacing` resolves to `var(--mantine-spacing-<key>)`; a string that is **not** a key is passed
  through `rem()` as a raw length. So a mistyped key degrades to a raw value instead of erroring.
- **FACT** `core/MantineProvider/MantineCssVariables/default-css-variables-resolver.mjs:85` —
  `assignSizeVariables(result.variables, theme.spacing, 'spacing')` iterates the **whole** `theme.spacing` object.
  Custom keys are therefore emitted as real CSS variables; `--mantine-spacing-2xl` and `--mantine-spacing-3xl` will
  exist once the keys are added.
- **FACT** `lib/core/MantineProvider/theme.types.d.ts:123` — `MantineThemeSizesOverride` is an empty exported
  interface, re-exported through `MantineProvider/index.d.ts`; `:138`-`:140` infers `_MantineSpacing` from its
  `spacing` member when it is augmented. This is the supported native-typing path the owner asked for.
- **CAVEAT, recorded rather than glossed** — `_MantineSpacing` is `(… ? CustomSpacing : MantineSize) | (string & {})`.
  The `(string & {})` member is **unconditional**, so augmenting the interface gives autocomplete and one declared
  source of truth for the scale, but it does **not** make a mistyped key a compile error. Combined with the resolver
  fact above, a typo would compile, render a raw length and pass `tsc`. AC12's rendered assertion is the actual
  guard; do not rely on the type alone.
- **FACT** — a custom breakpoint key in a responsive prop is already proven in production: `xxl` is used in
  `FeaturedListingsView.tsx:64`, `LatestListingsView.tsx:44` and `MantineHomeSection.tsx:47`. The breakpoint side of
  A2 needs no new mechanism. (`theme.breakpoints` itself is **not** augmented in this task; `xxl` continues to type
  through `(string & {})` exactly as those three consumers already do. Widening the augmentation to breakpoints is a
  reasonable follow-up, and is **out of scope** here — report it, do not do it.)
- **FACT `scripts/check-design-tokens.mjs:471`** — `EXTERNAL_VAR_PREFIXES = ['--tw-', '--mantine-']`, so a
  `var(--mantine-spacing-2xl)` reference in a CSS module is not reported as an undefined custom property.

### 3.3a The breadcrumb token contract (after D775-B = B2)

- **FACT `src/design-system/mantine/theme.ts:5`-`:16`** — the TailAdmin gray tuple is registered in the theme:
  index 4 `#98a2b3` (gray-400), index 5 `#667085` (gray-500), index 8 `#1d2939` (gray-800). The three hexes the
  owner named are **already registered tokens**, reachable as `gray.4` / `gray.5` / `gray.8` and
  `var(--mantine-color-gray-4|5|8)`.
- **FACT `docs/binding-decisions.md` → D27** — "Skeleton `::after` fill = gray-3 `#d0d5dd`, **token not hex**".
  **INFERENCE** — D775-B's values must therefore be consumed as the registered tokens, never as the literal hexes
  quoted in the decision. A raw `#667085` in the diff is a D27 violation and is also caught by
  `scripts/check-design-tokens.mjs` (colour literals are detected in `.tsx` and `.css` alike).
- **FACT `src/design-system/mantine/theme.ts:220`-`:226`** — `fontSizes.sm = 0.875rem` = **14px**, which is exactly
  what `docs/tailadmin-style-reference.md` §6d prescribes ("Mantine: `Breadcrumbs` size sm").
- **FACT** — `theme.ts` contains no `Breadcrumbs` or `Anchor` component override. This route is the first consumer,
  so the breadcrumb styling is component-local: **the only permitted `theme.ts` change in this task is the D775-C = C1
  spacing addition of §3.3c** — no component override, no colour, no font size.
- **UNKNOWN → executor decides under the gates** — whether the 6px separator gap is best set through Mantine
  `classNames` against the component's CSS module or through `styles`. §10.4 binds the *contract* and the
  *prohibited mechanisms*; the gates arbitrate the rest.
- **INFERENCE, flagged for the owner** — `docs/tailadmin-style-reference.md` §6d states no **hover** value for the
  breadcrumb link, while the current markup hovers to `--foreground` (`page.tsx:86`). Rather than invent a value
  (`agent-contract.md` 16a), the implementation preserves the existing semantic — the link darkens to the
  current-page colour — which under B2 is the already-selected `gray.8`. No new colour enters the system. If the
  owner wants a different hover, it is a one-line change to §10.4.

### 3.4 Visual source map (`docs/orchestrator-ui-task-design.md`)

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Page background | `page.tsx:81` `<div>` | `min-h-screen bg-background` | `bg-background` → `--background` root token (`globals.css`) | **changed** — moves to `Box bg="var(--background)"` inside the frame, same computed value | Route probe computed `background-color`, pre/post |
| Breadcrumb bar band | `page.tsx:83` `<div>` | `bg-muted/40 border-b` | `--muted` at 40% alpha + `--border` bottom rule | **changed** — moves into the frame; computed colour and 1px bottom border must be identical | Route probe computed `background-color` + `border-bottom`, pre/post |
| Breadcrumb row | `page.tsx:85` `<nav>` | `flex items-center gap-1.5 text-xs text-muted-foreground` | gap 6px; `text-xs` = 12px; `--muted-foreground` | **changed — D775-B = B2**: `Breadcrumbs size="sm"` (14px), links `gray.5`, current `gray.8`, separator `gray.4`, gap 6px | Q3 story matrix + route probe computed `font-size`, `gap` |
| Home link | `page.tsx:86` `Link` | `hover:text-foreground transition-colors` | `--foreground` on hover | **changed** — Mantine `Anchor component={Link}`; hover must still resolve to `--foreground` | Story hover cell + route probe |
| Separator | `page.tsx:89` | literal `<span>/</span>` | none | **changed** — becomes `Breadcrumbs separator="/"`; rendered glyph identical | Story matrix |
| Current page label | `page.tsx:90` `<span>` | `text-foreground` | `--foreground` | **changed** — Mantine `Text` | Story matrix |
| Breadcrumb gutter | `page.tsx:84` `<div>` | `container-wide py-2.5` | max-width 88rem + padding ladder; `py-2.5` = 10px | **changed — D775-A = A2**: Mantine responsive props, ladder stepping at `sm`/`lg`/`xxl`; identical below 1440, `2rem → 3rem` across 1440–1535 | Route probe computed `max-width`/`padding-*`, pre/post, at every Q3 width |
| Content gutter | `page.tsx:95` `<div>` | `container-wide py-6` | same ladder; `py-6` = 24px | **changed — D775-A = A2**: same Mantine props | Route probe, pre/post |
| Header / footer gutter | `HeaderView.tsx:114`, `FooterView.tsx:69` | `container-wide` | stays 2rem at 1440–1535 | **out of scope — preserved**, and therefore **misaligned with the content column in that band** (§3.3b) | Probe records both gutters at 1440; reported, not fixed |
| Listings content | `ListingsShell` | — | — | **out of scope — preserved** | Positive evidence: `ListingsShell`'s props and call site are unchanged in the diff; it is passed as `children` |
| Sort bar / save search | `ListingsShell.tsx:193`-`:206` | — | — | **out of scope — owned by Task 772** | Diff inspection at review |

### 3.5 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Route breadcrumb | `grep -rn "Breadcrumb\|breadcrumb" src --include=*.tsx`; opened `src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx`, `src/modules/listings/components/ListingDetailView.tsx`, `src/app/[locale]/favorites/page.tsx`, `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx`; listed `src/stories/mantine/primitives/` and `src/stories/patterns/mantine/` in full | **None exists.** `MantinePageHeaderWithActions.tsx:15` takes `breadcrumb?: string` — a single plain string with no link, no separator and no trail, on an admin page-header surface; it cannot render a two-item linked trail. No `Breadcrumbs` primitive story exists in either canonical directory. | **create canonical** | TailAdmin provenance exists: `docs/tailadmin-style-reference.md` §6d (`:154`-`:156`) — "Mantine: `Breadcrumbs` size sm, gray-500 links / gray-800 current" — and the measured row at `:453` — gap 6px, links gray-500 `#667085` / 14px, current page gray-800 `#1d2939` / 14px, separator gray-400. Registration required in the same PR: the story under `src/stories/patterns/mantine/`, and `src/modules/listings/components/ListingsPageFrame.tsx` in `scripts/mantine-migration-scope.json`. |
| Page gutter | `grep -rn "container-wide" src` (42 `.tsx` consumers), `globals.css:694`-`:716`, `docs/design-system.md:90`-`:101`, `docs/mantine-responsive-design-system.md:250`, `:684` | No Mantine page-container pattern exists in `src/design-system/mantine/patterns/`. | **create canonical** — **D775-A = A2** | Owner decision 2026-08-30, revised the same day: **Mantine responsive props only**, stepping at `sm`/`lg`/`xxl`, no 1536 anywhere and no CSS-module reproduction of the container. `max-width` comes from the registered root token `var(--width-page-max)` (`globals.css:299`) through `maw`. The padding ladder needs a 2rem and a 3rem step the Mantine spacing scale does not have — **D775-C**. |

**Permanent story-creation gate (`create-task` → "Permanent Storybook story creation gate").** Inspected candidates
and why each is insufficient are recorded in the row above. The new story is **not** a gate probe: it documents an
in-scope production consumer — the real `ListingsPageFrame` rendered by `/listings` — and `docs/agent-contract.md`
clause 16c requires the canonical story for a migrated visible artifact to exist in the same task before consumer
migration. Disposition: `create canonical`.

### 3.6 Storybook and gate constraints the implementation is measured against

- **FACT `scripts/lib/mantine-story-scope.mjs:15`** — `MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/', 'Patterns/Mantine/']`.
  The title decides enrolment in `check-stories-rendered.mjs`, `check-locale-leak.mjs` and `check-story-coverage.mjs`.
- **FACT `scripts/check-story-coverage.mjs`** — a component listed in `scripts/mantine-migration-scope.json` with no
  canonical Mantine story importing it **fails**; the reverse is not checked. Both must land together.
- **FACT `scripts/check-stories-rendered.mjs`** header, assertions (b), (d), (e) — below 640px: select triggers,
  `TabsList` and form inputs full-width; every visible non-icon `[data-slot="button"]` text button full-width; open
  overlay content edge-to-edge and bottom-anchored. **INFERENCE** — the frame introduces no select, input, button or
  overlay, so none of the three applies to it; if the implementation adds one, it has left this task's scope.
- **FACT `scripts/check-stories.mjs`** header — rule 6 enforces `storybook.*` key parity across sq/en/uk/it; rule 8
  rejects Latin-only values in `messages/uk.json`; rule 10 rejects English JSX string props and text children in story
  files; rule 12 rejects viewport-named exports.
- **FACT `docs/mantine-responsive-design-system.md`** §8 — one exported story named `Default`; `skipCanvas: true`;
  `layout: 'fullscreen'`; text via `storyT(locale, 'storybook.mantine.*')`; the listed viewport/locale-named exports
  are forbidden. §8.1 — `Patterns/Mantine/*` uses the bare `<Box px={{ base: 'md', sm: 'xl' }} py="md">` gutter, **not**
  `MantineStoryShell` (that is the `Mantine/Primitives/*` wrapper). §8.2 (P0) — sections represent **states**, never
  viewports.
- **FACT `src/stories/_storyI18n.ts:40`** — `export function storyT(locale: string, key: string): string`.
- **FACT `docs/qa-profiles.md`** — "Per-story viewport sets are not uniform": the `--mantine-only` matrix assigns
  viewports per story, so coverage must be read out of the manifest **for this story**, not inferred from the run.

### 3.7 Critical-flow scan

- **FACT `docs/critical-flow-registry.md`** — the registry has no route-chrome or breadcrumb flow. The two nearest
  rows are "Listings display — price + date formatting (SSR/CSR parity)" and "Listings filter controls — leaf
  sub-components + shell (Mantine)".
- **INFERENCE** — this task does not touch either: it changes no formatting path and no filter control. Clause 15
  therefore requires no new automated regression, **but** AC7 requires positive evidence that `ListingsShell`'s props
  and render path are unchanged, because "shell" appears in a registered flow.

### 3.8 Evidence tooling precedent

- **FACT** — `scripts/task766-route-shell-probe.mjs` is a task-owned Playwright route probe: `BASE_URL` from the
  environment, per-label JSON under `docs/sessions/evidence/task766/`, **no** `package.json` entry, no CI dependency.
  Task 772 follows the same shape. 775 follows it too. Nothing in `scripts/` renders a real route as a shared gate.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1, objective | `page.tsx` contains zero `className` literals and renders `<ListingsPageFrame …><ListingsShell …/></ListingsPageFrame>` | P0 | AC1, diff inspection | Confirmed |
| R2 | §3.2 | `ListingsPageFrame.tsx` declares no `'use client'`, takes only string/`ReactNode` props, and imports only `@mantine/core`, `next/link`, React types and its own CSS module | P0 | AC2, diff inspection, `npm run build` | Confirmed |
| R3 | §3.3, §3.3b, **D775-A = A2** | The gutter is expressed in **Mantine responsive props only**, stepping at `sm`/`lg`/`xxl`, with `maw` from `var(--width-page-max)`. No `.container-wide` reference, no 1536 breakpoint, no CSS module for the container, no new global rule. Geometry identical at every width below 1440 and at 1536+; across **1440–1535** the padding is `3rem` where it was `2rem` | P0 | AC3, owner baseline run (§13a) vs final-tree run at every Q3 width | Confirmed (owner, 2026-08-30); token supply blocked on **D775-C** |
| R4 | §3.4, §3.3a, **D775-B = B2** | The breadcrumb renders at 14px with links `gray.5`, current page `gray.8`, separator `gray.4`, gap 6px — consumed as registered tokens, never as raw hex (**D27**) | P0 | AC4, Q3 story matrix, TailAdmin side-by-side | Confirmed (owner, 2026-08-30) |
| R5 | `agent-contract.md` 16c, §3.5, §3.6 | One canonical `Patterns/Mantine/ListingsPageFrame` story exists, statically imports the real component, and the component is enrolled in `scripts/mantine-migration-scope.json` in the same PR | P0 | AC5, `check:story-coverage` | Confirmed |
| R6 | `agent-contract.md` 7, §3.6 | Every new story-only string exists in `storybook.mantine.*` in `sq`, `en`, `uk`, `it`, with real Ukrainian text | P0 | AC6, `check:i18n`, `check:stories` | Confirmed |
| R7 | §3.7, `agent-contract.md` 3/5 | `ListingsShell` receives the same props and renders inside the same content gutter; every route capability (filters, sort, tabs, chips, pagination, favorites, save search) still reaches the user | P0 | AC7, real interaction pass (§10.10c) on baseline and final tree — not a diff read | Confirmed |
| R8 | Sprint 68, Task 772 | The diff touches no file owned by Task 772 | P0 | AC8, diff inspection | Confirmed |
| R9 | `agent-contract.md` 11, `qa-profiles.md` Q3 | No horizontal overflow on `/listings` at the Q3 widths in all four locales; the breadcrumb wraps rather than overflowing | P0 | AC9, route probe + story matrix; route cells <640px waivable to Task 772 only under the AC9 waiver | Confirmed |
| R10 | `qa-profiles.md` Q1 floor | `npm run build` exits 0; typecheck, mojibake, file-integrity, design-tokens, governance:tailwind, locale-leak, story gates and the existing test suite pass | P0 | AC10, transcripts post-dating the last source edit; three commands narrowable only under the AC10 waiver | Confirmed |
| R12 | §3.3c, **D775-C = C1** | `theme.ts` gains exactly two additive `spacing` keys (`2xl` 2rem, `3xl` 3rem) with a provenance comment and the seven-key `MantineThemeSizesOverride` augmentation; the emitted `--mantine-spacing-2xl` / `--mantine-spacing-3xl` variables actually resolve at runtime | P0 | AC12 | Confirmed (owner, 2026-08-30) |
| R11 | `agent-contract.md` 9 | The breadcrumb still renders on the Supabase-error path (`page.tsx:74`-`:78`) and on an empty result set | P1 | AC11, negative flow N1 | Confirmed |

## 5. Assumptions and open questions

### Closed owner decisions — binding, quoted verbatim

Both were decided by the owner on **2026-08-30**. They are closed: quote them, do not re-litigate them, and do not
switch route because a gate is inconvenient.

**D775-A = A2 — page-width contract.** Owner, superseding the same day's earlier A1 answer:

> *"Використовуємо лише Mantine responsive props і `xxl = 1440px`. 1536px не застосовуємо — ні в Mantine, ні в CSS
> module. A1 і A3 відхилені: вони тягнуть legacy Tailwind container/breakpoint у новий Mantine-компонент. Зміна
> gutter від 1440px — усвідомлений результат міграції на Mantine, не регресія."*

Binding consequences, all measured in §3.3b: the top step is `xxl = 1440`, **no 1536 media query may appear anywhere
in the diff**, no CSS module may reproduce the container ladder, and `.container-wide` is neither referenced nor
imitated. The 1440–1535 padding delta is an accepted migration outcome and must be *measured and reported*, never
silently asserted. The header/footer alignment consequence in that band is recorded in §3.3b as a finding; it does
not block this task.

**D775-B = B2 — breadcrumb contract.** Owner:

> *"B2: breadcrumb переходить на виміряний TailAdmin контракт: 14px, link gray-500 `#667085`, current gray-800
> `#1d2939`, gap 6px, separator gray-400. Це єдиний варіант, що відповідає правилу для migrated chrome мати TailAdmin
> provenance."* *"B1 консервує legacy-відхилення у новому Mantine-компоненті."*

Two consequences the executor must not miss, both evidenced in §3.3a: the three hexes are **already registered
theme tokens** and must be consumed as `gray.4` / `gray.5` / `gray.8` (**D27** — token, not hex), and 14px is
exactly `fontSizes.sm`, i.e. `Breadcrumbs size="sm"`, not a raw value.

**D775-C = C1 — the two missing gutter steps.** Owner:

> *"Додати до Mantine spacing два семантичні ключі: `2xl: '2rem'` і `3xl: '3rem'`. Тоді frame використовує лише
> Mantine tokens: `md → xl → 2xl → 3xl`, без raw values, allowlist-маркерів або Tailwind vars."*
> *"C2 створює постійний виняток у новому Mantine surface, C3 повертає залежність від Tailwind-token layer — обидва
> варіанти гірші."*

Follow-up instruction, same message, on typing:

> *"Краще використовувати рідні Mantine ключі spacing у типах."*

So the two keys are declared through Mantine's own `MantineThemeSizesOverride` augmentation rather than left to the
`(string & {})` escape hatch — see §3.3c for the verified mechanics and for the one thing the augmentation does
**not** buy (it is not typo-proof; AC12 is).

**Accepted temporary delta, owner, same message:**

> *"Прийняти як тимчасову задокументовану дельту: на `1440–1535px` listings матиме gutter `3rem`, а legacy
> header/footer — `2rem`. Не розширювати Task 775 на Header/Footer; лише виміряти й зафіксувати це в evidence."*

This closes the §3.3b conflict as *accepted and bounded*: Task 775 measures both gutters at 1440 and records the
difference (§10.9, AC3). Widening this task to `HeaderView.tsx` or `FooterView.tsx` is prohibited.

Owner scope note, binding on §8: *"`/favorites` і listing detail лишаються без змін до окремої міграції."* The same
legacy breadcrumb markup at `favorites/page.tsx:72` and `ListingDetailView.tsx:190` is therefore reported, never
touched — and after this task the two routes will visibly differ from `/listings` until they migrate. That is the
owner's accepted, temporary state, not a defect to fix here.

### Assumptions

- **Assumption** — a seeded database with at least two pages of listings and a routable server are available for the
  route probe. If not, publish `BLOCKED`; do not measure an empty page.
- **Assumption** — `npm run screenshots:assert -- --mantine-only` and `npm run build-storybook` are green at the base
  commit. §7's step 1 verifies this; a red baseline is `BLOCKED`, not a repair job.
- **UNKNOWN** — which canonical cells `--mantine-only` will assign to the new story. Read them out of the generated
  manifest for `Patterns/Mantine/ListingsPageFrame`; do not infer them from the run's other stories
  (`docs/qa-profiles.md`, "Per-story viewport sets are not uniform").
- **UNKNOWN** — whether the breadcrumb wraps at 320px in `uk` and `it` today. The "before" route probe establishes it;
  this kickoff asserts no number.

## 6. Pre-read rule bundle

Read exactly these, in this order. Do not read all docs.

1. `docs/agent-contract.md` — P0 invariants, especially 3, 5, 7, 9, 11, 12, 13, 16, 16b, 16c.
2. `docs/rule-index.md` — confirm the **Current Mantine path** bundle plus **Storybook / Visual Proof**.
3. `docs/qa-profiles.md` — Q3 definition, viewport policy, the per-story viewport note, negative-flow applicability.
4. `docs/mantine-responsive-design-system.md` — §8, §8.1, §8.2, and `:250`.
5. `docs/tailadmin-style-reference.md` — §6d breadcrumb row (`:154`-`:156`) and the measured row (`:453`).
6. `docs/component-rules.md` — container/presentational split, i18n, no-duplicate rules.
7. `docs/qa-rules.md` — validation, encoding, manual QA rules.
8. `docs/storybook-governance.md` — §14.9 and §15 only.
9. This kickoff and `tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md`.

`docs/ui-rules.md` and `docs/design-system.md` are consulted **only** for the `.container-wide` boundary in §3.3;
this is a Mantine-path task and legacy implementation details do not apply to the new component.

## 7. Scope

Exactly these paths may appear in the diff:

| Path | Action |
|---|---|
| `src/app/[locale]/listings/page.tsx` | edit — replace the chrome JSX at `:81`-`:95` and `:105`-`:107` with the frame |
| `src/modules/listings/components/ListingsPageFrame.tsx` | **new** — server component |
| `src/modules/listings/components/ListingsPageFrame.module.css` | **new, breadcrumb only** — the gutter is Mantine props (A2); this file may hold only a breadcrumb length that has no Mantine token, and must contain no container, `max-width`, or breakpoint rule |
| `src/design-system/mantine/theme.ts` | **required (D775-C = C1)** — two additive `spacing` keys plus the `MantineThemeSizesOverride` augmentation, and nothing else |
| `src/stories/patterns/mantine/ListingsPageFrame.stories.tsx` | **new** — canonical story |
| `scripts/mantine-migration-scope.json` | add exactly one entry |
| `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json` | add the new `storybook.mantine.*` keys |
| `scripts/task775-listings-frame-route-probe.mjs` | **new** — task-owned probe, no `package.json` entry |
| `docs/sessions/evidence/task775/**` | evidence |
| `docs/sessions/<date>-task-775-*.md` | session log |
| `docs/backlog.md` | concise state only (executor rule, `agent-contract.md` 10) |

Execution order is **§0a**, not this section. Revision 1 already wrote the component, the story, the four message
files, the manifest entry and `page.tsx`; those stay. What remains is Phase A (comment strings + probe fields), then
the owner's Phase B, then Phase C's gate and probe re-runs. This table stays the closed list of paths that may
appear in the diff.

## 8. Out of scope

- `ListingsShell.tsx`, `ListingsFilters.tsx`, `ListingsFilterBar.tsx`, `ListingsStatusTabs.tsx`,
  `ListingsSortBar.tsx`, `ActiveFilterChips.tsx`, `ListingsPagination.tsx`, `SaveSearchButton.tsx`.
  **`ListingsSortBar.tsx` and the sort-bar row holding `SaveSearchButton` are owned by Task 772** (Sprint 66, P1,
  `KICKOFF FILED`), whose R4 forbids migration there. A diff touching them is rejected on sight.
- `src/app/globals.css`, `.container-wide` itself, and its other 41 `.tsx` consumers.
- `/favorites` and the listing detail page, which carry the same legacy breadcrumb markup
  (`favorites/page.tsx:72`, `ListingDetailView.tsx:190`). Report, do not migrate.
- `MantineHomeSection.tsx:51`'s `container-wide` dependency. Report, do not fix.
- **`HeaderView.tsx` and `FooterView.tsx`.** They keep `.container-wide` and therefore keep a 2rem gutter across
  1440–1535 while this route moves to 3rem. The owner accepted that delta explicitly and forbade widening this task
  to those two files (§5): *"Не розширювати Task 775 на Header/Footer; лише виміряти й зафіксувати це в evidence."*
- Every `theme.ts` field except the two additive `spacing` keys and the `MantineThemeSizesOverride` augmentation.
- Supabase queries, `generateMetadata`, `parseSearchParams`, `applyListingFilters`, `LISTING_SELECT`,
  `applyPublicVisibility`, sort order, pagination arithmetic, `favoriteIds`.
- Any baseline, allowlist, marker, exemption or `scripts/governance/baseline.json` update.
- Existing stories, including `Mantine/Primitives/ListingCard` and every other `Patterns/Mantine/*`.

## 9. Current and required behavior

**Current.** `/listings` renders a full-height page on `--background`; a top band on `--muted` at 40% alpha with a
1px bottom border, containing a 12px muted breadcrumb row `Home / Listings` inside a `.container-wide` gutter with
10px vertical padding; then a `.container-wide` gutter with 24px vertical padding containing `ListingsShell`. All
chrome markup lives in the route file. The chrome renders identically for anonymous and authenticated users, and it
renders on the Supabase-error path.

**Required after.** The page gutter is expressed in Mantine responsive props stepping at `sm`/`lg`/`xxl`
(D775-A = A2): identical to today below 1440 and at 1536+, and `3rem` instead of `2rem` across 1440–1535, which is
the accepted migration outcome. The breadcrumb moves to the measured TailAdmin contract — 14px, links `gray.5`,
current `gray.8`, separator `gray.4`, gap 6px (D775-B = B2). Produced by
`<ListingsPageFrame homeHref={...} homeLabel={...} currentLabel={...} breadcrumbAriaLabel={...}>` wrapping
`<ListingsShell …/>` as `children`. `page.tsx` keeps every `getTranslations` call and passes resolved strings down;
no new product translation key is introduced. The breadcrumb is Mantine `Breadcrumbs` with `separator="/"`, the home
item is `Anchor component={Link}`, and the current page is `Text`. The `<nav>`'s accessible name remains
`common.aria_breadcrumb`.

Required interface — data-free, no function props, so the server/client boundary of §3.2 holds:

```tsx
export interface ListingsPageFrameProps {
  homeHref: string
  homeLabel: string
  currentLabel: string
  breadcrumbAriaLabel: string
  children: React.ReactNode
}
```

**Step 1 — the baseline is owner-supplied, and the executor may not reconstruct it (Revision 2).** The baseline is
the tree at the pre-edit commit **`c864431d0`** (`docs(Task775): close D775-C=C1, Task 775 is READY`). Sonnet must
**not** derive, infer, or "cite from source" any before-value out of a dirty working tree: Revision 1's AC3
before-values were source-derived and are **rejected as evidence**. Reconstructing that tree needs mutating git,
which the executor is forbidden to run, emit, suggest or delegate (§14). The executor's only permitted baseline
action is to **read** the bundle the owner provides (§13a) and compare the final tree against it.

The executor still runs and retains, before its first edit: `git --no-optional-locks status --short --branch`,
`git --no-optional-locks log -1 --oneline`, and the census (`page.tsx` = 108 lines, 7 `className` literals —
**re-measure; a different number is a design blocker, not permission to widen scope**). If the owner's baseline
bundle is absent or incomplete, **Phase C** cannot start and the task cannot rise above `PARTIALLY IMPLEMENTED`
(§0a); **Phase A proceeds regardless**, since the owner cannot run a probe that has not been written yet. The
blanket rule
"a gate already red at the base commit is `BLOCKED`" is superseded, for exactly three commands, by the AC10 waiver.

## 10. Implementation requirements

1. `ListingsPageFrame.tsx` contains no `'use client'`, no Tailwind utility string, no shadcn import, no `cn()` call.
2. The page background and the breadcrumb band are expressed with the same CSS custom properties the current markup
   resolves to (`--background`, `--muted` at 40%, `--border`), not with re-picked hex values.
3. **Gutter (D775-A = A2).** Mantine responsive props on the frame's outer `Box` only:
   `maw="var(--width-page-max)"` (the registered token at `globals.css:299`, never the literal `88rem`),
   `mx="auto"`, `w="100%"`, and `px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }}` — **Mantine spacing tokens
   only**, exactly the `md → xl → 2xl → 3xl` ladder the owner named. No `@apply`, and no new rule in `globals.css`.

   **§10.3a — the implementation-source set.** Every string ban in this task is evaluated over exactly these paths
   and over nothing else:

   - `src/app/[locale]/listings/page.tsx`
   - `src/modules/listings/components/ListingsPageFrame.tsx`
   - `src/modules/listings/components/ListingsPageFrame.module.css`
   - `src/design-system/mantine/theme.ts` — added lines only
   - `src/stories/patterns/mantine/ListingsPageFrame.stories.tsx`
   - `scripts/mantine-migration-scope.json`
   - `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`

   Explicitly **outside** the set, and never a violation: this kickoff, `docs/sessions/**` (session log and
   evidence), `docs/backlog.md`, and `scripts/task775-listings-frame-route-probe.mjs`. The probe is excluded because
   §10.9 **requires** it to select `header .container-wide` and `footer .container-wide` to measure the chrome
   gutters — that selector and its doc-comment are mandatory, not a leak.

   **§10.3b-1 — the string-ban scan, the one authoritative contract.** The ban applies **only to lines Task 775
   adds or changes relative to `c864431d0`** — never to the pre-existing contents of a file in the set. This is not a
   softening: `messages/en|sq|uk|it.json` already carry `.container-wide` at `:2383` (and `en` again at `:1966`,
   `:1968`) from Task 662, in **zero** lines this task adds, so a whole-file scan would fail AC3 unconditionally and
   unfixably. §10.3b, AC3 and §14 all use exactly this corpus and nothing else:

   **PowerShell is the shell of record** for this task, consistent with §13's `npm.cmd`. Run it verbatim:

   ```powershell
   # UTF-8 guard — messages/uk.json is Cyrillic; without this PS 5.1 mangles the corpus
   $OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
   $corpus = Join-Path $env:TEMP 'task775-added.txt'

   # (A) paths that exist at c864431d0 — added/changed lines only
   git --no-optional-locks diff c864431d0 -- `
     ":(literal)src/app/[locale]/listings/page.tsx" `
     src/design-system/mantine/theme.ts `
     scripts/mantine-migration-scope.json `
     messages/en.json messages/sq.json messages/uk.json messages/it.json |
     Where-Object { $_ -like '+*' -and $_ -notlike '+++*' } |
     Set-Content -Encoding utf8 $corpus

   # (B) paths that do NOT exist at c864431d0 — wholly new, so the whole file is "added"
   #     (verify with: git cat-file -e c864431d0:<path> — exit 128 means new)
   Get-Content src/modules/listings/components/ListingsPageFrame.tsx,
               src/modules/listings/components/ListingsPageFrame.module.css,
               src/stories/patterns/mantine/ListingsPageFrame.stories.tsx |
     Add-Content -Encoding utf8 $corpus
   ```

   `$corpus` is **the corpus**. Two assertions run against it, and nothing else counts as the check:

   ```powershell
   # assertion 1 — must print NOTHING
   Select-String -Path $corpus -Pattern '1536|container-wide|--space-'

   # assertion 2 — must print exactly 1
   @(Select-String -Path $corpus -Pattern 'design-tokens-allow:').Count
   ```

   If the executor's shell is bash rather than PowerShell, the equivalent is
   `git … | grep '^+' | grep -v '^+++' > "$TMPDIR/task775-added.txt"`, then
   `cat <the three new files> >> …`, then `grep -nE '1536|container-wide|--space-'` and
   `grep -c 'design-tokens-allow:'` — same corpus, same two assertions. **The corpus definition is normative; the
   shell is not.**

   Note the pattern is `container-wide`, **without** a leading `\.`: a bare mention in prose is still naming the
   class, and the dotted form misses real violations — at the time of writing it misses
   ``'2xl': '2rem',   // 32px — container-wide's ≥1024px step`` in `theme.ts` and the `container-wide` prose inside
   the current `design-tokens-allow:` marker itself. Run against the Revision 1 tree this scan prints **9** lines;
   Phase A is done when it prints none.

   The single matched marker line must equal the §10.3c string byte for byte — note that the §10.3c wording
   deliberately contains no `container-wide`, so the marker currently in the tree fails both assertions at once. Split (A)/(B) exists because the three
   new files are untracked, and `git diff` cannot show an untracked file without `git add -N`, which is a mutating
   git command the executor may not run (§14).

   **§10.3b — what is banned in that corpus, comments included.**
   any `1536` — media query, breakpoint entry, literal **or comment prose**; any `.container-wide` reference,
   **including a comment that merely names it, even in order to disclaim it**; any CSS-module rule declaring a
   container width, `max-width` or breakpoint; any raw px/rem gutter value; any bare-number gutter value; any
   `--space-*` or other Tailwind-owned variable. `2rem` and `3rem` are permitted **only** as the two exact D775-C
   spacing key values in `theme.ts` (§10.8), and nowhere else in the set. The §10.8 provenance comment cites
   **`globals.css:705`-`:715` by line number only** and must not spell out `.container-wide` or `1536`. A comment
   asserting compliance is not an exemption from it — Revision 1 failed this exact rule with the line
   ``never `.container-wide`, never a 1536px step``.

   **§10.3c — the one permitted marker, verbatim.** Exactly one `design-tokens-allow:` marker may exist in the whole
   set. It lives only in `ListingsPageFrame.module.css`, covers only `padding-block`, and reads exactly:

   ```css
   /* design-tokens-allow: padding-block: 0.625rem — preserved 10px breadcrumb-band block padding; no Mantine token matches */
   ```

   No second marker, no allowlist entry, no baseline entry, no exemption, no `scripts/governance/baseline.json`
   edit. A marker anywhere else, or any deviation from this string, is `BLOCKED`. This exception exists because
   §10.4 mandates the CSS-module route for token-less lengths and `check:design-tokens:strict` then requires the
   marker — without it the two sections contradict each other, which is what Revision 1 hit.
4. **Breadcrumb (D775-B = B2).** Rendered contract: font-size **14px** via `size="sm"` (`fontSizes.sm`, §3.3a);
   link colour `gray.5`; current-page colour `gray.8`; separator `gray.4` (computed `rgb(152, 162, 179)`); separator
   gap **6px**; separator glyph `/`, unchanged. Prohibited mechanisms, each of which the gates catch: a raw hex
   anywhere in the implementation-source set (**D27**, `check:design-tokens:strict`); a raw px/rem in a
   `style`/`styles` prop **used to style the breadcrumb**; and any `theme.ts` change **other than the exact D775-C
   spacing keys and the seven-key augmentation of §10.8**. Lengths that have no token live in the component's CSS
   module (§10.3c). The mechanism for the 6px separator gap remains the **executor's choice under §3.3a** —
   `separatorMargin`, `classNames` or `styles` are all acceptable, none of them being a prohibited mechanism, and the
   contract is judged on the measured 6px, not on the route taken to it.

   **§10.4a — carve-out.** The band's `borderBottom: '1px solid var(--border)'` is required by **§10.2** (preserve
   the existing 1px rule through the existing custom property). It is page chrome, not breadcrumb typography, and is
   therefore **not** a breach of the raw-px/rem prohibition above. Without this carve-out §10.2 and §10.4 contradict
   each other. The session log cites
   `docs/tailadmin-style-reference.md` §6d (`:154`-`:156`) and the measured row (`:453`). Hover preserves the
   existing semantic — the link darkens to `gray.8`, the artifact's own current-page token — and introduces no new
   colour (§3.3a).
5. The story: title `Patterns/Mantine/ListingsPageFrame`; one export named `Default`; `parameters: { skipCanvas: true,
   layout: 'fullscreen' }`; wrapper `<Box px={{ base: 'md', sm: 'xl' }} py="md">`; locale from
   `context.globals.locale`; every visible string via `storyT(locale, 'storybook.mantine.listings_page_frame_*')`;
   imports `@/modules/listings/components/ListingsPageFrame` **by direct path**, never a barrel, never a copy.
6. Story sections are **states**: (a) short labels, (b) the longest localized label set. No per-viewport section and
   no viewport-named export. Children are a static fixture block, never `ListingsShell`.
7. `scripts/mantine-migration-scope.json` gains exactly one entry,
   `src/modules/listings/components/ListingsPageFrame.tsx`, in the same commit as the story.
8. **Theme change (D775-C = C1), the only one permitted.** In `src/design-system/mantine/theme.ts`, add exactly two
   keys to `spacing` — `'2xl': '2rem'` and `'3xl': '3rem'` — leaving the existing five byte-unchanged, with a
   provenance comment citing `globals.css:705`-`:715` (the ladder these two steps come from) so the addition is not
   read later as an invented value. In the same file, declare the native typing:

   ```ts
   declare module '@mantine/core' {
     export interface MantineThemeSizesOverride {
       spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl', string>
     }
   }
   ```

   The augmentation **must** list all seven keys: omitting a default would retype `theme.spacing` for every existing
   consumer in `src/`. Keeping it in `theme.ts` beside the scale is deliberate — the scale and its type cannot drift
   apart. Do not augment `breakpoints`, `radius`, `fontSizes`, `shadows` or `lineHeights` here (§3.3c).
9. **The probe records the alignment finding of §3.3b.** At 1440 it reads the computed `padding-left`/`padding-right`
   of the frame's gutter **and** of the header row (`HeaderView.tsx:114`) and footer row (`FooterView.tsx:69`), and
   writes all three side by side. The expected result under A2 is content 3rem against chrome 2rem. It is reported as
   a finding with its numbers, never fixed here.
10. `scripts/task775-listings-frame-route-probe.mjs` follows `scripts/task766-route-shell-probe.mjs`: `BASE_URL` from
   the environment, JSON + PNG per label under `docs/sessions/evidence/task775/`, no `package.json` entry, fails on a
   non-OK response or an absent selector. It records, for `/en/listings` and `/uk/listings` at every Q3 width:
   `documentElement.scrollWidth` vs `clientWidth`; the computed `max-width`, `padding-left`, `padding-right` of both
   gutters; the computed `background-color` of the page and of the breadcrumb band; the band's `border-bottom`; the
   breadcrumb row's computed `font-size`, `color` and `gap`; and the `<nav>` accessible name plus its item texts.

   **§10.10a — `separatorColor` (new, AC4).** Every cell also records `separatorColor`: the computed `color` of the
   breadcrumb separator element — the non-`<a>`, non-current child of `nav.mantine-Breadcrumbs-root`. Expected
   `rgb(152, 162, 179)` = `gray.4`. Revision 1 recorded `linkColor` and `currentColor` but no separator colour, so
   AC4's separator arm had no evidence at all while the session log claimed it was probe-confirmed.

   **§10.10b — spacing variables (new, AC12).** At the `1200` and `1440` cells the probe additionally records
   `getComputedStyle(document.documentElement).getPropertyValue('--mantine-spacing-2xl')` and the same for
   `'--mantine-spacing-3xl'`, as `mantineSpacing2xl` / `mantineSpacing3xl`, written **beside** that cell's frame
   `padding-left`. An empty string is the silent failure mode of a mistyped key (§3.3c) and fails AC12. Revision 1
   inferred these from the consumed padding; AC12 asks for the variables themselves.

   **§10.10c — the interaction pass (new, AC7).** Revision 1's probe only called `page.goto`; a static diff read is
   **not** an acceptable substitute. At the `1440` / `en` cell the probe performs four real interactions against the
   running production server and records, for each, the URL before, the URL after and a boolean `changed`, under an
   `interactions` key in the same JSON:

   | Interaction | Control | Asserted result |
   |---|---|---|
   | filters | the filters trigger | panel becomes visible; URL unchanged |
   | sort | select a non-default sort | `sort` param set **and** `page` reset |
   | status tab | activate a non-active tab | `tab` param set |
   | pagination | follow the page-2 link | `page=2` |

   The pass runs on the baseline and on the final tree. A control whose URL change does not reproduce the baseline's
   is a regression and is `BLOCKED`.

   **§10.10e — `probeHash`, a required top-level field (new, Phase A).** Every JSON the probe writes — both
   `route-probe.pre-edit.json` and `route-probe.post-edit.json` — carries a top-level `probeHash` string, beside
   `label` / `baseUrl` / `capturedAt`. Its value is the output of

   ```text
   git hash-object scripts/task775-listings-frame-route-probe.mjs
   ```

   The probe invokes this itself via `child_process`, so it is shell-agnostic — do not wrap it in a shell.

   computed **by the probe itself at start-up, inside the Git worktree the probe is being run from** (the instrument
   worktree of §13a). If the probe cannot compute it — not a Git worktree, or the command fails — it writes nothing
   and exits non-zero, rather than emitting a JSON without the field. A JSON missing `probeHash` is `BLOCKED`, and
   the two JSONs must carry the **identical** value (§13a, §14).

   **§10.10d — the overflow root cause (new, AC9).** In every cell where
   `documentElement.scrollWidth > clientWidth + 2`, the probe records `overflowCulprit`: the `tagName`, `className`
   and `getBoundingClientRect().right` of the widest node whose right edge exceeds `clientWidth`, walking the
   subtree of `<main>`. This is what makes the AC9 waiver checkable instead of argued.

## 11. Positive and negative flows

**Positive flow.** Anonymous user opens `/en/listings?type=apartment&sort=price_asc&page=2`. The page renders the
breadcrumb band with `Home / Listings`, `Home` links to `/en`, and the listings grid renders below inside the content
gutter with its filters, tabs, sort, chips and pagination unchanged. Changing sort still rewrites the URL and resets
`page`; the frame is not involved in that and must not intercept it.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | The frame has no input | N/A | — |
| Authorization/RLS | **No** | The frame renders identically for anon and authenticated; `SaveSearchButton` visibility is `ListingsShell`'s (`:205`) and is out of scope | N/A | — |
| Offline/network | **No** | No client fetch in the frame | Existing global behavior | — |
| Concurrent writer | **No** | No write path | N/A | — |
| **N1 — Supabase query error** | **Yes** | `page.tsx:74`-`:78` — the page renders with `listings ?? []` | Chrome renders unchanged; the empty state comes from `ListingsShell` | AC11: route probe against a filter combination returning zero rows |
| **N2 — longest localized labels at 320px** | **Yes** | `agent-contract.md` 11; `uk`/`it` breadcrumb labels | The breadcrumb wraps; `scrollWidth <= clientWidth + 2` | AC9: `uk@320` and `it@320` probe cells + the story's long-label section |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the merged diff, when `src/app/[locale]/listings/page.tsx` is read, then it contains zero
  `className` literals, renders `ListingsPageFrame` wrapping `ListingsShell`, and its `getTranslations` calls,
  metadata and Supabase code are unchanged.
- **AC2 [R2]** — Given `ListingsPageFrame.tsx`, when it is read and `npm run build` is run, then the file has no
  `'use client'`, no Tailwind utility string and no shadcn import, and the build exits 0 with `/[locale]/listings`
  still emitted as a dynamic server route.
- **AC3 [R3, D775-A = A2]** — Given the **owner-supplied baseline probe run** (§13a) and the final-tree run, when the
  gutter's computed `max-width`, `padding-left` and `padding-right` are compared at every Q3 width in both probed
  locales, then every value is **identical except at 1440**, where `padding-left` and `padding-right` are exactly
  `3rem` after versus `2rem` before and `max-width` is unchanged. A delta at any width other than 1440, or a delta at
  1440 that is not exactly this one, is `BLOCKED`. **A before-value derived from source rather than from the baseline
  run does not satisfy this criterion** — that substitution is what failed Revision 1.

  And when the **§10.3b-1 corpus** is built and its two assertions are run — that corpus being the lines Task 775
  adds or changes relative to `c864431d0`, never a whole-file scan — then it contains no `1536` and no
  `.container-wide` **in any form, comments included** (§10.3b); no CSS-module container / `max-width` / breakpoint
  rule; no raw px/rem or bare-number gutter value; no `--space-*` reference; and **exactly one**
  `design-tokens-allow:` marker, matching §10.3c byte for byte. Pre-existing occurrences in a file of the set — such
  as `.container-wide` at `messages/*.json:2383` — are **outside the corpus and are not violations**. Files outside
  §10.3a are not scanned at all.

  The 1440 cell also records the header and footer gutters beside the content gutter (§10.9); that comparison is
  reported, and its mismatch is expected.
- **AC4 [R4, D775-B = B2]** — Given the Q3 story matrix and the probe, when the breadcrumb's computed `font-size`,
  link `color`, current-page `color`, **separator `color` (§10.10a)** and gap are read, then they are `14px`,
  `rgb(102, 112, 133)` (`gray.5`), `rgb(29, 41, 57)` (`gray.8`), `rgb(152, 162, 179)` (`gray.4`) and `6px`
  respectively — **each present as a recorded field in the probe JSON, not asserted in prose**; and when the
  implementation-source set is searched, it contains **no** colour hex literal and no `theme.ts` change **other than
  the exact D775-C spacing keys and the seven-key augmentation** of §10.8. The band's `1px solid var(--border)` is
  §10.2 chrome and is not a breach (§10.4a). The session log cites `docs/tailadmin-style-reference.md` §6d
  and `:453`.
- **AC5 [R5]** — Given the merged diff, when `npm run check:story-coverage` runs, then it exits 0, the manifest
  contains `src/modules/listings/components/ListingsPageFrame.tsx`, and `Patterns/Mantine/ListingsPageFrame` resolves
  to that exact path by static import.
- **AC6 [R6]** — Given the four message files, when `npm run check:i18n` and `npm run check:stories` run, then both
  exit 0, every new `storybook.mantine.*` key exists in all four locales, and the `uk` values contain Cyrillic.
- **AC7 [R7]** — Given the probe's interaction pass (§10.10c) on the baseline **and** on the final tree, when the
  filters trigger, a sort selection, a status tab and a pagination link are exercised on the real route, then every
  control performs the same URL change on both runs, and `ListingsShell`'s call site is identical in the diff. A
  `page.goto`-only probe, or call-site identity offered on its own, does **not** satisfy this criterion — Revision 1
  offered exactly that.
- **AC8 [R8]** — Given `git status --short` and the final diff, when the changed paths are listed, then none is a
  file named in §8, and in particular none is `ListingsSortBar.tsx` or `SaveSearchButton.tsx`.
- **AC9 [R9, N2]** — Given the probe at the Q3 widths in `en` and `uk` and the story matrix in all four locales, when
  `documentElement.scrollWidth <= clientWidth + 2` is evaluated, then it holds in every cell, and the long-label story
  section shows the breadcrumb wrapping rather than clipping.

  **AC9 waiver (Revision 2 — the only permitted relief).** The 4 locale × 4 viewport **story** cells must pass
  unconditionally; the wrap fix already lands there. The **route** cells below 640px may be waived to Task 772 if and
  only if the owner's baseline run (§13a) shows, at the same widths and locales, **both**: (a) the same overflow
  within ±2px of the final-tree figure — Revision 1 measured a constant `scrollWidth` overrun of **132px** at
  320/375/390/480/560 in both locales — and (b) the same `overflowCulprit` (§10.10d), resolving to
  `ListingsSortBar`'s `min-w-35` sort wrapper. Both halves must be present in the baseline JSON. Absent that bundle
  AC9 is simply **NOT MET** and no waiver exists: "pre-existing" argued from source reading is not evidence.
- **AC10 [R10]** — Given the retained transcripts, when `npm run typecheck`, `check:stories`, `check:story-coverage`,
  `check:i18n`, `check:mojibake`, `check:file-integrity`, `check:design-tokens:strict`, `governance:tailwind`,
  `check:locale-leak:mantine-only`, `npm test`, `build-storybook`, `screenshots:assert -- --mantine-only` and
  `npm run build` are run **on the final tree**, then every one exits 0 and every transcript is from that tree.
  **Each transcript must post-date the last edit to any file in the implementation-source set** — Revision 1 ran nine
  of the thirteen *before* its final component edit and re-ran only three.

  **AC10 waiver (Revision 2 — the only permitted relief).** Exactly three commands may be narrowed to a
  non-regression comparison — `check:locale-leak:mantine-only`, `npm test` and `screenshots:assert -- --mantine-only`
  — if and only if the owner's baseline bundle (§13a) contains the same command at `c864431d0` with the **same
  failure fingerprint**: identical failing test names / story IDs **and** identical counts. Revision 1's final tree
  showed `check:locale-leak` = 22 leaks (`Admin/AdminUsersTable`, `Mantine/Primitives/FilterControls`,
  `Patterns/Mantine/AuthSheet`); `npm test` = 4 failures of 1414 (`css-var-resolvability`, `task763-*`,
  `ListingCard.smoke` ×2); `screenshots:assert` = 1241/1348 PASS, 80 FAIL — all `Patterns/Mantine/AuthSheet/*`
  (`Register Agent Add Company` 16, `Register Agent` 16, `Register` 16, `Forgot Password` 16, `Login Validation
  Error` 8, `Login` 8) — and **27 AMBIGUOUS spread across four stories, not one**:
  `Mantine/Primitives/PopularLocationsView/Long City Name` **16**, `Mantine/Primitives/Tabs/Default` **4**,
  `Mantine/Primitives/Combobox/Default` **4**, `Admin/AdminUsersTable/Default` **3**
  (`docs/sessions/evidence/task775/screenshots-assert.after2.log:377`ff). Revision 2 originally recorded this as
  "all `Mantine/Primitives/Tabs`", which was wrong and would have misclassified a correct baseline as a regression.
  A fingerprint differing in even one name or one count is a regression,
  not a pre-existing failure, and is `BLOCKED`. The other ten commands must exit 0 outright.
- **AC12 [R12, D775-C = C1]** — Given the running route, when the probe's recorded `mantineSpacing2xl` and
  `mantineSpacing3xl` (§10.10b) are read from the `1200` and `1440` cells and compared with the frame's computed
  `padding-left` in those same cells, then the two variables resolve to `2rem` and `3rem` respectively and the
  paddings match them (`32px`, `48px`); and when `theme.ts` is read, `spacing` has exactly seven keys with the
  original five byte-unchanged, the augmentation lists all seven, and no other theme field changed. A variable
  recorded as an empty string — the silent failure mode of a mistyped key (§3.3c) — is `BLOCKED`. **Inferring the
  variables from the consumed padding, as Revision 1 did, does not satisfy this criterion**; the recorded field is
  the evidence.
- **AC11 [R11, N1]** — Given a filter combination returning zero rows, when `/uk/listings` is probed, then the
  breadcrumb band and both gutters render with the same computed values as the populated case.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** It applies because this task creates a Mantine **page shell** component and a
new permanent canonical Storybook artifact, and changes rendered chrome — three of the Q3 triggers in
`docs/qa-profiles.md`. It is not promoted from Q2 for caution: the chrome values themselves are in scope, which also
makes TailAdmin side-by-side evidence mandatory.

Commands. The **owner** runs them at the baseline commit and supplies the transcripts (§13a); **Sonnet** runs them
on the final tree, after its last edit to any file in the implementation-source set:

    npm.cmd run typecheck
    npm.cmd run check:stories
    npm.cmd run check:story-coverage
    npm.cmd run check:i18n
    npm.cmd run check:mojibake
    npm.cmd run check:file-integrity
    npm.cmd run check:design-tokens:strict
    npm.cmd run governance:tailwind
    npm.cmd run check:locale-leak:mantine-only
    npm.cmd test
    npm.cmd run build-storybook
    npm.cmd run screenshots:assert -- --mantine-only
    npm.cmd run build

Visual evidence:

1. **Story matrix** — the canonical cells `--mantine-only` assigns to `Patterns/Mantine/ListingsPageFrame`, read out
   of the generated manifest for that story and recorded by ID resolved from `storybook-static/index.json`. All four
   locales, including the mobile stress cells. Never run `screenshots:assert:full` or `:full:fast` as evidence.
2. **Route probe** — `scripts/task775-listings-frame-route-probe.mjs`, before and after, `/en/listings` and
   `/uk/listings`, at the Q3 canonical widths `320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 /
   1440 / 1920 / 2560`, plus the zero-row case of AC11. Retained JSON + PNG under `docs/sessions/evidence/task775/`.
   Both runs carry `separatorColor` (§10.10a), the spacing variables (§10.10b), the interaction pass (§10.10c) and
   `overflowCulprit` (§10.10d). The **before** run is the owner's (§13a); the executor never produces it.
3. **TailAdmin side-by-side** — the breadcrumb rendered at 1440 next to the `docs/tailadmin-style-reference.md` §6d
   values, with the measured `font-size`, `color` and `gap` written out beside the reference numbers.

`npm run build` exit 0 is the hard gate; a failed or unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

### 13a. The owner-supplied baseline bundle (Revision 2 — prerequisite to any AC3 / AC7 / AC9 / AC10 verdict)

Sonnet cannot produce this. Reconstructing the pre-edit tree requires mutating git, which the executor is forbidden
to run, emit, suggest or delegate (§14), and reading "before" values out of source instead is exactly the
substitution that failed Revision 1. The owner produces the bundle natively from the pre-edit commit and places it
under `docs/sessions/evidence/task775/baseline/` before the executor resumes:

1. **The commit it was taken at** — expected **`c864431d0`** — with `git log -1 --oneline` and a clean
   `git status --short` proving that tree carried no Task 775 edits.

   **How, mechanically (Revision 2 — this is the part that does not work naively).** The probe script does not exist
   at `c864431d0`: `git cat-file -e c864431d0:scripts/task775-listings-frame-route-probe.mjs` returns **exit 128**.
   A single clean worktree therefore cannot both be pre-edit *and* contain the Revision 2 probe. Separate the two:

   - The **subject under test** is a clean detached worktree at `c864431d0`, built and served from there
     (`npm run build && npm run start`). Nothing is added to it — it stays byte-clean, which is what
     `git status --short` proves.
   - The **instrument** is the Phase-A probe, run from a *different* **Git worktree** — normally the main working
     tree — with `BASE_URL` pointed at that server. It must be a Git worktree, not a loose copy, because the probe
     computes `probeHash` with `git hash-object` at start-up (§10.10e) and fails closed outside one. The probe is a
     black-box HTTP client — it never reads the tree it measures — so running it from elsewhere does not contaminate
     the baseline.
   - Both identities are recorded **in artefacts, not in prose**: the subject's commit SHA in the bundle, and the
     instrument's hash as the top-level **`probeHash`** field inside `route-probe.pre-edit.json` (§10.10e).
     `route-probe.post-edit.json` must carry the **identical** `probeHash`; two runs taken with different probe
     versions are not comparable, and the comparison is `BLOCKED`. This is checkable in one line:
     ```powershell
     $a = (Get-Content docs/sessions/evidence/task775/baseline/route-probe.pre-edit.json -Raw | ConvertFrom-Json).probeHash
     $b = (Get-Content docs/sessions/evidence/task775/route-probe.post-edit.json      -Raw | ConvertFrom-Json).probeHash
     "$a`n$b`nmatch=$($a -eq $b)"
     ```
   - The two runs must also agree on port and label. Use label `pre-edit` for the baseline and `post-edit` for the
     final tree, exactly as the script's per-label output naming expects.
2. **All thirteen §13 gate transcripts** from that commit, named `*.before.log`, each with its exit code.
3. **`route-probe.pre-edit.json` and its PNGs** — the full **28 cells** (`en`/`uk` × the 14 Q3 widths), produced by
   the same probe script the final run uses, and therefore including `separatorColor`, the §10.10b spacing
   variables and the §10.10d `overflowCulprit`.
4. **The baseline interaction results** (§10.10c) — the four controls with their before/after URLs.

Until this bundle exists, **AC3, AC7, AC9 and AC10 are NOT MET and cannot be waived**, and the strongest status the
task can reach is `PARTIALLY IMPLEMENTED` (§0a). With it, AC3 / AC7 / AC12 are decided on the comparison, and
AC9 / AC10 may take their respective waivers on the conditions written into each. The phase sequence that makes this
producible — Phase A writes the probe, Phase B runs it against a clean `c864431d0` server, Phase C re-runs it on the
final tree — is **§0a**, which governs wherever another section implies a different order. Accepting the comparison
is the reviewer's act, never the executor's.

## 14. Completion report contract

Report, in this order:

1. **Status** — one value from the **§0a status ladder**, and no other wording: after Phase A,
   `AWAITING OWNER BASELINE (Phase B)`; after Phase C with the bundle,
   `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (Phase D)`; if the bundle is absent or invalid so that Phase C never
   started, `PARTIALLY IMPLEMENTED`; on a red build, a broken Phase-A rule, or a probe-hash / fingerprint mismatch in
   Phase C/D, `BLOCKED`. Never self-approve; you hold no approval authority.
2. **Decided routes** — confirm you implemented **D775-A = A2**, **D775-B = B2** and **D775-C = C1** as written in §10.3, §10.4 and §10.8. Build the **§10.3b-1 corpus** exactly as written there and paste **both assertion commands with their real output and exit codes** — not a prose claim. The corpus must contain no colour hex, no `1536`, no `.container-wide` in any form including comments, no raw or bare-number gutter value, no `--space-*` reference, and exactly one `design-tokens-allow:` marker matching §10.3c byte for byte. State that the only `theme.ts` change is the two additive spacing keys plus the seven-key augmentation. Do **not** report a whole-file grep: pre-existing hits such as `messages/*.json:2383` are outside the corpus. Revision 1's log asserted zero hits from a grep whose pattern did not cover the claim and whose result was wrong — the pasted output is what replaces that assertion. Quote the measured `--mantine-spacing-2xl` / `--mantine-spacing-3xl` values. Quote the top-level `probeHash` from **both** `route-probe.pre-edit.json` and `route-probe.post-edit.json` and state that they are identical; a missing field, or two different values, is `BLOCKED` and no AC3 / AC7 / AC9 / AC12 claim may be made on that comparison.
3. **Changed files** — a table matching the real diff exactly.
4. **Requirement IDs completed** — R1-R11, each `MET` / `NOT MET` / `BLOCKED`, with its AC.
5. **Commands run and actual results** — command, exit code, and where the transcript is retained. Report real exit
   statuses; do not call the work validated while any required check is unrun or failing.
6. **Evidence locations** — story manifest paths and the cell IDs used, probe JSON/PNG paths, TailAdmin comparison.
7. **Census** — the measured line count and `className` count at the base commit, versus the numbers in §3.1.
8. **Assumptions, deviations, limitations, unresolved issues.**
9. **Findings you were told to report, not fix** — `MantineHomeSection.tsx:51`; the same legacy breadcrumb markup on
   `/favorites` and the listing detail page; the measured 1440 content-vs-chrome gutter difference with its three
   numbers; whether augmenting `MantineThemeSizesOverride.breakpoints` for `xxl` is worth a follow-up (§3.3c);
   anything you observed in the eight out-of-scope listings components.
10. **Backlog** — update `docs/backlog.md` with concise current state only, and write the session log under
    `docs/sessions/` with a "Files Changed" table matching the real diff. Flag `BACKLOG LIMIT BREACH` if you cannot
    keep that file at or below 80 lines.

You may use read-only git (`status`, `diff`, `show`, `log`, `grep`). You must not run, emit, suggest or delegate any
mutating git command, including any form of `git push`.

## 15. Task quality gate

- A fresh Sonnet session can execute this without chat context — the census, the file list, the component interface,
  the story rules and the probe contract are all in the file. ✅
- Every primary requirement has a binary AC and a verification method. ✅
- Scope names what must not change, including the two files owned by Task 772. ✅
- UI publication checks: current/legacy boundary stated (§6), QA profile selected with reasons (§13), visual source
  map (§3.4) and canonical UI decision record (§3.5) present, preservation classifications explicit. ✅
- Permanent-story creation gate: candidates inspected and named, reuse shown insufficient, the in-scope production
  consumer named, and the artifact shown not to be a gate probe (§3.5). ✅
- Negative flows selected by applicability, not copied (§11). ✅
- No command, path, story or behavior is claimed without inspection; every material claim carries `FACT`,
  `INFERENCE` or `UNKNOWN` (§3). ✅
- D775-A = A2 and D775-B = B2 are closed, quoted verbatim, and converted into single bound implementation
  requirements (§10.3, §10.4) with binary ACs (AC3, AC4). ✅
- All three owner decisions (A2, B2, C1) are closed and quoted verbatim, each bound to one implementation route with
  a binary AC (AC3, AC4, AC12). Nothing is left for Sonnet to choose, and the kickoff carries no deferred value. ✅
- C1's mechanics were verified in the installed framework before being written as a requirement (§3.3c): the spacing
  resolver, the CSS-variable emission loop, the augmentable interface, the existing production use of a custom
  breakpoint key, and the token gate's `--mantine-` prefix allowance. The one thing the native typing does **not**
  give — rejection of a mistyped key — is stated rather than glossed, and AC12 covers it with a rendered assertion. ✅
- The decided values were re-checked against the repository after the revision: the gutter token exists
  (`globals.css:299`), the Mantine scale ends at `xl = 1.5rem` (`theme.ts:190`-`:196`) and has no 1536 breakpoint
  (`:163`-`:170`), the three greys are registered theme tokens (`theme.ts:5`-`:16`) so **D27** applies, and 14px is
  `fontSizes.sm` (`:222`). No decided value is a raw literal smuggled into a new Mantine component. ✅
- The rendered consequence of A2 is measured, bounded to one band and one canonical width, and given a binary AC
  rather than being described as "a gutter change". Its second-order effect on header/footer alignment is the
  owner's accepted, documented delta: measured and recorded in evidence (§10.9, AC3), with widening to
  `HeaderView`/`FooterView` explicitly prohibited (§5, §8). ✅
