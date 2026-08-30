# Task 775 — `/listings` route chrome: `ListingsPageFrame` (Mantine) with its canonical story

**Sprint:** 68 · **Priority:** P2 · **QA profile:** **Q3 Full Visual Matrix** · **Filed:** 2026-08-30
**State:** ⛔ **BLOCKED — OWNER DECISION REQUIRED (D775-A, D775-B)**

> Every other section of this kickoff is complete and executable. Two visual contracts cannot be chosen by the task
> author or by the executor (`docs/agent-contract.md` clauses 2, 16, 16b; `docs/orchestrator-ui-task-design.md`
> "BLOCKED — CANONICAL STYLE DECISION REQUIRED"). They are stated in §5. When both are answered, change the state
> line to `READY` and dispatch — no other edit is required.

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
- **INFERENCE** — Mantine `Container` or responsive `px` props therefore **cannot** reproduce the current gutter above
  1536px. Any Mantine-prop implementation changes the rendered padding on wide desktops relative to every other public
  route. This is why D775-A exists.
- **FACT** — `src/design-system/mantine/patterns/MantineHomeSection.tsx:51` itself renders
  `<Box className="container-wide">`, so the `:250` rule already has a live exception in the pattern library. Reported
  here, not fixed here.

### 3.4 Visual source map (`docs/orchestrator-ui-task-design.md`)

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Page background | `page.tsx:81` `<div>` | `min-h-screen bg-background` | `bg-background` → `--background` root token (`globals.css`) | **changed** — moves to `Box bg="var(--background)"` inside the frame, same computed value | Route probe computed `background-color`, pre/post |
| Breadcrumb bar band | `page.tsx:83` `<div>` | `bg-muted/40 border-b` | `--muted` at 40% alpha + `--border` bottom rule | **changed** — moves into the frame; computed colour and 1px bottom border must be identical | Route probe computed `background-color` + `border-bottom`, pre/post |
| Breadcrumb row | `page.tsx:85` `<nav>` | `flex items-center gap-1.5 text-xs text-muted-foreground` | gap 6px; `text-xs` = 12px; `--muted-foreground` | **changed — see D775-B** | Q3 story matrix + route probe computed `font-size`, `gap` |
| Home link | `page.tsx:86` `Link` | `hover:text-foreground transition-colors` | `--foreground` on hover | **changed** — Mantine `Anchor component={Link}`; hover must still resolve to `--foreground` | Story hover cell + route probe |
| Separator | `page.tsx:89` | literal `<span>/</span>` | none | **changed** — becomes `Breadcrumbs separator="/"`; rendered glyph identical | Story matrix |
| Current page label | `page.tsx:90` `<span>` | `text-foreground` | `--foreground` | **changed** — Mantine `Text` | Story matrix |
| Breadcrumb gutter | `page.tsx:84` `<div>` | `container-wide py-2.5` | max-width 88rem + padding ladder; `py-2.5` = 10px | **changed — see D775-A** | Route probe computed `max-width`/`padding-*`, pre/post |
| Content gutter | `page.tsx:95` `<div>` | `container-wide py-6` | same ladder; `py-6` = 24px | **changed — see D775-A** | Route probe, pre/post |
| Listings content | `ListingsShell` | — | — | **out of scope — preserved** | Positive evidence: `ListingsShell`'s props and call site are unchanged in the diff; it is passed as `children` |
| Sort bar / save search | `ListingsShell.tsx:193`-`:206` | — | — | **out of scope — owned by Task 772** | Diff inspection at review |

### 3.5 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Route breadcrumb | `grep -rn "Breadcrumb\|breadcrumb" src --include=*.tsx`; opened `src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx`, `src/modules/listings/components/ListingDetailView.tsx`, `src/app/[locale]/favorites/page.tsx`, `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx`; listed `src/stories/mantine/primitives/` and `src/stories/patterns/mantine/` in full | **None exists.** `MantinePageHeaderWithActions.tsx:15` takes `breadcrumb?: string` — a single plain string with no link, no separator and no trail, on an admin page-header surface; it cannot render a two-item linked trail. No `Breadcrumbs` primitive story exists in either canonical directory. | **create canonical** | TailAdmin provenance exists: `docs/tailadmin-style-reference.md` §6d (`:154`-`:156`) — "Mantine: `Breadcrumbs` size sm, gray-500 links / gray-800 current" — and the measured row at `:453` — gap 6px, links gray-500 `#667085` / 14px, current page gray-800 `#1d2939` / 14px, separator gray-400. Registration required in the same PR: the story under `src/stories/patterns/mantine/`, and `src/modules/listings/components/ListingsPageFrame.tsx` in `scripts/mantine-migration-scope.json`. |
| Page gutter | `grep -rn "container-wide" src` (42 `.tsx` consumers), `globals.css:694`-`:716`, `docs/design-system.md:90`-`:101`, `docs/mantine-responsive-design-system.md:250`, `:684` | No Mantine page-container pattern exists in `src/design-system/mantine/patterns/`. | **create canonical**, pending **D775-A** | The width values have design-system provenance (`globals.css:705`-`:715`); what has no provenance is the *mechanism* a Mantine component may use to reproduce them. That is the decision. |

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
| R3 | §3.3, **D775-A** | The rendered page gutter keeps `max-width` and all four padding steps of `.container-wide`, or the owner-approved alternative | P0 | AC3, route probe pre/post | **Conflicting — D775-A** |
| R4 | §3.4, **D775-B** | Breadcrumb type scale and colours are either preserved (12px / `--muted-foreground`) or set to the measured TailAdmin values (14px, gray-500/gray-800) | P0 | AC4, Q3 story matrix, TailAdmin side-by-side | **Conflicting — D775-B** |
| R5 | `agent-contract.md` 16c, §3.5, §3.6 | One canonical `Patterns/Mantine/ListingsPageFrame` story exists, statically imports the real component, and the component is enrolled in `scripts/mantine-migration-scope.json` in the same PR | P0 | AC5, `check:story-coverage` | Confirmed |
| R6 | `agent-contract.md` 7, §3.6 | Every new story-only string exists in `storybook.mantine.*` in `sq`, `en`, `uk`, `it`, with real Ukrainian text | P0 | AC6, `check:i18n`, `check:stories` | Confirmed |
| R7 | §3.7, `agent-contract.md` 3/5 | `ListingsShell` receives the same props and renders inside the same content gutter; every route capability (filters, sort, tabs, chips, pagination, favorites, save search) still reaches the user | P0 | AC7, diff + route probe interaction | Confirmed |
| R8 | Sprint 68, Task 772 | The diff touches no file owned by Task 772 | P0 | AC8, diff inspection | Confirmed |
| R9 | `agent-contract.md` 11, `qa-profiles.md` Q3 | No horizontal overflow on `/listings` at the Q3 widths in all four locales; the breadcrumb wraps rather than overflowing | P0 | AC9, route probe + story matrix | Confirmed |
| R10 | `qa-profiles.md` Q1 floor | `npm run build` exits 0; typecheck, mojibake, file-integrity, design-tokens, governance:tailwind, locale-leak, story gates and the existing test suite pass | P0 | AC10, retained transcripts | Confirmed |
| R11 | `agent-contract.md` 9 | The breadcrumb still renders on the Supabase-error path (`page.tsx:74`-`:78`) and on an empty result set | P1 | AC11, negative flow N1 | Confirmed |

## 5. Assumptions and open questions

### Blocking owner decisions

**D775-A — page-width contract.** `docs/mantine-responsive-design-system.md:250` forbids a new Mantine pattern from
depending on `.container-wide`; `.container-wide` is simultaneously the documented public page-container
(`docs/design-system.md:92`) and its removal is Phase 6 (`:684`); and Mantine props cannot express the 1536px step
because this repository's top breakpoint is 1440. Three routes are available and the task may not pick one:

- **A1** — component-scoped CSS module reproducing `max-width:88rem` and the `1rem / 1.5rem@640 / 2rem@1024 / 3rem@1536`
  ladder byte-identically. Zero rendered delta; the new component owns its geometry; `.container-wide` untouched.
- **A2** — Mantine `Box` with responsive `px` on this repository's breakpoints, accepting that the 3rem step moves from
  1536px to 1440px. Precedent exists (Task 668) but it **is** a rendered delta on wide desktops, and `/listings` would
  then differ from every other public route until they migrate.
- **A3** — keep `className="container-wide"` inside the new component, as `MantineHomeSection.tsx:51` already does,
  and treat `:250` as superseded in practice. Zero delta, but it consciously carries the Tailwind dependency forward
  and contradicts a written rule.

**D775-B — breadcrumb type scale.** The current production breadcrumb is `text-xs` (12px) on `--muted-foreground`
(`page.tsx:85`). `docs/tailadmin-style-reference.md` §6d (`:154`-`:156`) and the measured row at `:453` specify 14px,
links gray-500 `#667085`, current page gray-800 `#1d2939`, gap 6px. `docs/agent-contract.md` clause 16 requires
migrated UI to trace visual values to TailAdmin; clause 3/5 requires preserving existing UX. Two routes:

- **B1** — preserve 12px / `--muted-foreground`; record a TailAdmin deviation row with the owner's authorization.
- **B2** — adopt the measured TailAdmin 14px / gray-500 / gray-800; this is a visible change to the route and, by
  precedent, to `/favorites` (`page.tsx:72`) and the listing detail page (`ListingDetailView.tsx:190`) later.

Until both are answered this kickoff stays `BLOCKED`. The executor must not choose, must not implement "the safe one
meanwhile", and must not treat this kickoff as the authorization (`create-task`: the task is never the owner decision).

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
| `src/modules/listings/components/ListingsPageFrame.module.css` | **new** — only if D775-A resolves to A1 |
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

**Required after.** Identical rendered result — subject to D775-A and D775-B — produced by
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
3. The gutter follows the answer to **D775-A** exactly. If A1: one component-scoped class in
   `ListingsPageFrame.module.css` with a semantic name (not utility-shaped), no `@apply`, no new global rule.
4. The breadcrumb follows the answer to **D775-B** exactly, with the TailAdmin row cited in the session log.
5. The story: title `Patterns/Mantine/ListingsPageFrame`; one export named `Default`; `parameters: { skipCanvas: true,
   layout: 'fullscreen' }`; wrapper `<Box px={{ base: 'md', sm: 'xl' }} py="md">`; locale from
   `context.globals.locale`; every visible string via `storyT(locale, 'storybook.mantine.listings_page_frame_*')`;
   imports `@/modules/listings/components/ListingsPageFrame` **by direct path**, never a barrel, never a copy.
6. Story sections are **states**: (a) short labels, (b) the longest localized label set. No per-viewport section and
   no viewport-named export. Children are a static fixture block, never `ListingsShell`.
7. `scripts/mantine-migration-scope.json` gains exactly one entry,
   `src/modules/listings/components/ListingsPageFrame.tsx`, in the same commit as the story.
8. `scripts/task775-listings-frame-route-probe.mjs` follows `scripts/task766-route-shell-probe.mjs`: `BASE_URL` from
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
- **AC3 [R3, D775-A]** — Given the route probe's before and after runs, when the gutter's computed `max-width`,
  `padding-left` and `padding-right` are compared at every Q3 width in both probed locales, then they are identical
  (route A1/A3) or differ only at the widths the owner approved (route A2). Any other difference is `BLOCKED`.
- **AC4 [R4, D775-B]** — Given the Q3 story matrix and the probe, when the breadcrumb's computed `font-size`, `color`
  and `gap` are read, then they equal the values the owner selected in D775-B, and the session log cites the
  `docs/tailadmin-style-reference.md` row used.
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
2. **Which owner routes you executed** — the D775-A and D775-B answers you were given, quoted.
3. **Changed files** — a table matching the real diff exactly.
4. **Requirement IDs completed** — R1-R11, each `MET` / `NOT MET` / `BLOCKED`, with its AC.
5. **Commands run and actual results** — command, exit code, and where the transcript is retained. Report real exit
   statuses; do not call the work validated while any required check is unrun or failing.
6. **Evidence locations** — story manifest paths and the cell IDs used, probe JSON/PNG paths, TailAdmin comparison.
7. **Census** — the measured line count and `className` count at the base commit, versus the numbers in §3.1.
8. **Assumptions, deviations, limitations, unresolved issues.**
9. **Findings you were told to report, not fix** — `MantineHomeSection.tsx:51`; the same legacy breadcrumb markup on
   `/favorites` and the listing detail page; anything you observed in the eight out-of-scope listings components.
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
- Two owner decisions are unresolved and are published as a blocked decision note with exactly the routes available —
  **not** as a multi-route task for Sonnet to choose from. The kickoff state is `BLOCKED` accordingly. ✅
