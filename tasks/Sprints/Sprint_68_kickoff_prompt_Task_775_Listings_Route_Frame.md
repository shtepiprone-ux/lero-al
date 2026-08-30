# Task 775 — `/listings` route chrome: `ListingsPageFrame` (Mantine) with its canonical story

**Sprint:** 68 · **Priority:** P2 · **QA profile:** **Q3 Full Visual Matrix** · **Filed:** 2026-08-30
**State:** ✅ **READY — DISPATCHABLE**

> **D775-A = A2**, **D775-B = B2** and **D775-C = C1** are decided, closed and binding (§5), quoted verbatim from the
> owner on **2026-08-30**. None of the three is re-litigated anywhere in this kickoff, and each is bound to exactly
> one implementation route with a binary acceptance criterion.
>
> The frame therefore consumes **only Mantine tokens** — gutter `md → xl → 2xl → 3xl`, breadcrumb `gray.4/5/8` and
> `size="sm"` — with no raw value, no `design-tokens-allow:` marker and no Tailwind-owned variable anywhere in the
> diff. The two new spacing keys are declared **natively in the Mantine types** (§3.3c), not accepted through the
> `(string & {})` escape hatch.

---

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
| R3 | §3.3, §3.3b, **D775-A = A2** | The gutter is expressed in **Mantine responsive props only**, stepping at `sm`/`lg`/`xxl`, with `maw` from `var(--width-page-max)`. No `.container-wide` reference, no 1536 breakpoint, no CSS module for the container, no new global rule. Geometry identical at every width below 1440 and at 1536+; across **1440–1535** the padding is `3rem` where it was `2rem` | P0 | AC3, route probe pre/post at every Q3 width | Confirmed (owner, 2026-08-30); token supply blocked on **D775-C** |
| R4 | §3.4, §3.3a, **D775-B = B2** | The breadcrumb renders at 14px with links `gray.5`, current page `gray.8`, separator `gray.4`, gap 6px — consumed as registered tokens, never as raw hex (**D27**) | P0 | AC4, Q3 story matrix, TailAdmin side-by-side | Confirmed (owner, 2026-08-30) |
| R5 | `agent-contract.md` 16c, §3.5, §3.6 | One canonical `Patterns/Mantine/ListingsPageFrame` story exists, statically imports the real component, and the component is enrolled in `scripts/mantine-migration-scope.json` in the same PR | P0 | AC5, `check:story-coverage` | Confirmed |
| R6 | `agent-contract.md` 7, §3.6 | Every new story-only string exists in `storybook.mantine.*` in `sq`, `en`, `uk`, `it`, with real Ukrainian text | P0 | AC6, `check:i18n`, `check:stories` | Confirmed |
| R7 | §3.7, `agent-contract.md` 3/5 | `ListingsShell` receives the same props and renders inside the same content gutter; every route capability (filters, sort, tabs, chips, pagination, favorites, save search) still reaches the user | P0 | AC7, diff + route probe interaction | Confirmed |
| R8 | Sprint 68, Task 772 | The diff touches no file owned by Task 772 | P0 | AC8, diff inspection | Confirmed |
| R9 | `agent-contract.md` 11, `qa-profiles.md` Q3 | No horizontal overflow on `/listings` at the Q3 widths in all four locales; the breadcrumb wraps rather than overflowing | P0 | AC9, route probe + story matrix | Confirmed |
| R10 | `qa-profiles.md` Q1 floor | `npm run build` exits 0; typecheck, mojibake, file-integrity, design-tokens, governance:tailwind, locale-leak, story gates and the existing test suite pass | P0 | AC10, retained transcripts | Confirmed |
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

Execution order: verify the baseline (§9 step 1) → write the component → write the story and the four message files
→ enrol in the manifest → switch `page.tsx` → run the gates → run the probe.

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

**Step 1 of implementation, before any edit — the baseline.** Run and retain: `git --no-optional-locks status
--short --branch`, `git --no-optional-locks log -1 --oneline`, the census
(`page.tsx` = 108 lines, 7 `className` literals — **re-measure; a different number is a design blocker, not
permission to widen scope**), then `npm run typecheck`, `npm run check:stories`, `npm run check:story-coverage`,
`npm run check:i18n`, `npm run build-storybook`, `npm run screenshots:assert -- --mantine-only`, and the "before" run
of the route probe. A gate already red at the base commit is `BLOCKED`.

## 10. Implementation requirements

1. `ListingsPageFrame.tsx` contains no `'use client'`, no Tailwind utility string, no shadcn import, no `cn()` call.
2. The page background and the breadcrumb band are expressed with the same CSS custom properties the current markup
   resolves to (`--background`, `--muted` at 40%, `--border`), not with re-picked hex values.
3. **Gutter (D775-A = A2).** Mantine responsive props on the frame's outer `Box` only:
   `maw="var(--width-page-max)"` (the registered token at `globals.css:299`, never the literal `88rem`),
   `mx="auto"`, `w="100%"`, and `px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }}` — **Mantine spacing tokens
   only**, exactly the `md → xl → 2xl → 3xl` ladder the owner named. Forbidden in the diff, each checkable by
   inspection: any `1536` (media query, breakpoint entry or literal); any `.container-wide` reference; any CSS-module
   rule declaring a container width, `max-width` or breakpoint; any raw px/rem gutter value; any bare-number gutter
   value; any `design-tokens-allow:` marker; any `--space-*` or other Tailwind-owned variable. No `@apply`, and no
   new rule in `globals.css`.
4. **Breadcrumb (D775-B = B2).** Rendered contract: font-size **14px** via `size="sm"` (`fontSizes.sm`, §3.3a);
   link colour `gray.5`; current-page colour `gray.8`; separator `gray.4`; separator gap **6px**; separator glyph
   `/`, unchanged. Prohibited mechanisms, each of which the gates catch: a raw hex anywhere in the diff (**D27**,
   `check:design-tokens:strict`); a raw px/rem in a `style`/`styles` prop; and any edit to `theme.ts`. Lengths that
   have no token live in the component's CSS module, consumed through `classNames`. The session log cites
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
- **AC3 [R3, D775-A = A2]** — Given the route probe's before and after runs, when the gutter's computed
  `max-width`, `padding-left` and `padding-right` are compared at every Q3 width in both probed locales, then every
  value is **identical except at 1440**, where `padding-left` and `padding-right` are exactly `3rem` after versus
  `2rem` before and `max-width` is unchanged; and when the diff is searched it contains no `1536`, no
  `.container-wide` reference, no CSS-module container/`max-width`/breakpoint rule, no raw px/rem or bare-number
  gutter value, no `design-tokens-allow:` marker and no `--space-*` reference. A delta at any width other
  than 1440, or a delta at 1440 that is not exactly this one, is `BLOCKED`. The 1440 cell also records the header and
  footer gutters beside the content gutter (§10.9); that comparison is reported, and its mismatch is expected.
- **AC4 [R4, D775-B = B2]** — Given the Q3 story matrix and the probe, when the breadcrumb's computed `font-size`,
  link `color`, current-page `color`, separator `color` and gap are read, then they are 14px, `gray.5`, `gray.8`,
  `gray.4` and 6px respectively; and when the diff is searched, it contains **no** colour hex literal and no
  `theme.ts` change. The session log cites `docs/tailadmin-style-reference.md` §6d and `:453`.
- **AC5 [R5]** — Given the merged diff, when `npm run check:story-coverage` runs, then it exits 0, the manifest
  contains `src/modules/listings/components/ListingsPageFrame.tsx`, and `Patterns/Mantine/ListingsPageFrame` resolves
  to that exact path by static import.
- **AC6 [R6]** — Given the four message files, when `npm run check:i18n` and `npm run check:stories` run, then both
  exit 0, every new `storybook.mantine.*` key exists in all four locales, and the `uk` values contain Cyrillic.
- **AC7 [R7]** — Given the diff and the probe's interaction pass, when `ListingsShell`'s call site is compared and the
  filters trigger, a sort selection, a status tab and a pagination link are exercised on the real route, then the
  props are identical and every control still performs its previous URL change.
- **AC8 [R8]** — Given `git status --short` and the final diff, when the changed paths are listed, then none is a
  file named in §8, and in particular none is `ListingsSortBar.tsx` or `SaveSearchButton.tsx`.
- **AC9 [R9, N2]** — Given the probe at the Q3 widths in `en` and `uk` and the story matrix in all four locales, when
  `documentElement.scrollWidth <= clientWidth + 2` is evaluated, then it holds in every cell, and the long-label story
  section shows the breadcrumb wrapping rather than clipping.
- **AC10 [R10]** — Given the retained transcripts, when `npm run typecheck`, `check:stories`, `check:story-coverage`,
  `check:i18n`, `check:mojibake`, `check:file-integrity`, `check:design-tokens:strict`, `governance:tailwind`,
  `check:locale-leak:mantine-only`, `npm test`, `build-storybook`, `screenshots:assert -- --mantine-only` and
  `npm run build` are run, then every one exits 0 and the build transcript is from the final tree.
- **AC12 [R12, D775-C = C1]** — Given the running route, when the computed value of `--mantine-spacing-2xl` and
  `--mantine-spacing-3xl` is read from the document element and the frame's computed `padding-left` is read at
  1200 and at 1440, then the two variables resolve to `2rem` and `3rem` respectively and the paddings match them;
  and when `theme.ts` is read, `spacing` has exactly seven keys with the original five byte-unchanged, the
  augmentation lists all seven, and no other theme field changed. A variable that resolves empty — the silent
  failure mode of a mistyped key (§3.3c) — is `BLOCKED`.
- **AC11 [R11, N1]** — Given a filter combination returning zero rows, when `/uk/listings` is probed, then the
  breadcrumb band and both gutters render with the same computed values as the populated case.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** It applies because this task creates a Mantine **page shell** component and a
new permanent canonical Storybook artifact, and changes rendered chrome — three of the Q3 triggers in
`docs/qa-profiles.md`. It is not promoted from Q2 for caution: the chrome values themselves are in scope, which also
makes TailAdmin side-by-side evidence mandatory.

Commands, run at the base commit and again on the final tree:

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
3. **TailAdmin side-by-side** — the breadcrumb rendered at 1440 next to the `docs/tailadmin-style-reference.md` §6d
   values, with the measured `font-size`, `color` and `gap` written out beside the reference numbers.

`npm run build` exit 0 is the hard gate; a failed or unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 14. Completion report contract

Report, in this order:

1. **Status** — `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never
   self-approve; you hold no approval authority.
2. **Decided routes** — confirm you implemented **D775-A = A2**, **D775-B = B2** and **D775-C = C1** as written in §10.3, §10.4 and §10.8. State explicitly that the diff contains no colour hex, no `1536`, no `.container-wide` reference, no raw or bare-number gutter value, no `design-tokens-allow:` marker and no `--space-*` reference, and that the only `theme.ts` change is the two additive spacing keys plus the seven-key augmentation. Quote the measured `--mantine-spacing-2xl` / `--mantine-spacing-3xl` values.
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
