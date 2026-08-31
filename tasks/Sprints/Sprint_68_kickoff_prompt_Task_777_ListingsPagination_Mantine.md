# Task 777 — `/listings` pagination → `MantinePagination` (real migration, Storybook-only proof)

**Sprint:** 68 — `/listings` leaves Tailwind, one surface at a time
**Priority:** P2 · **QA profile:** `Q3 Full Visual Matrix` · **Executor:** Sonnet (`@executor`)
**Filed:** 2026-08-31 · **Status on delivery:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (never self-approved)

---

## 1. Mode and task type

`TASK DESIGN` → implementation task. Task type: **UI / Layout / Component — mixed migration** (legacy
shadcn/Tailwind source surface → current Mantine path) **plus Storybook / Visual Proof**. The boundary is stated in
§4: exactly one production file leaves the legacy side; one shared Mantine pattern is extended by one attribute;
everything else in `src/modules/listings/` stays legacy and untouched.

## 2. Objective

Replace the hand-rolled pagination control in `src/modules/listings/components/ListingsPagination.tsx` with the
existing canonical `MantinePagination` pattern, delete the component's own range/ellipsis algorithm and its legacy
UI imports, and preserve the URL-navigation contract byte-for-byte. Prove it with one canonical
`Patterns/Mantine/ListingsPagination` story that statically imports the real production component, landing in the
same PR as the `scripts/mantine-migration-scope.json` enrolment.

## 3. Verified context

All facts below were measured on **2026-08-31** against a clean worktree (`git --no-optional-locks status --short`
empty, branch `main`, upstream `origin/main`). Every line reference was opened. `FACT` = inspected;
`INFERENCE` = derived from named facts; `UNKNOWN` = not established.

### 3.1 The premise is correct — this is a real migration, not a re-wire

`FACT` — `src/modules/listings/components/ListingsPagination.tsx` is **87 lines** and does **not** consume
`MantinePagination`. Its four import lines are:

```
3: import { useTranslations } from 'next-intl'
4: import { useRouter, usePathname, useSearchParams } from 'next/navigation'
5: import { ChevronLeft, ChevronRight } from 'lucide-react'
6: import { Button } from '@/components/ui/button'
```

`FACT` — it renders `<nav className="listings-pagination flex items-center justify-center gap-1 py-8">` containing
**3 `<Button`** elements (prev, per-page, next), `2× ChevronLeft` + `2× ChevronRight` occurrences, **7 `className=`**
attributes, and **3 `tc(` calls**. It owns a private `getPages()` range/ellipsis algorithm (lines 31-42) that is
independent of Mantine's.

`FACT` — `src/design-system/mantine/patterns/MantinePagination.tsx` exists and exports
`MantinePaginationProps` with `total` (page **count**, not item count), `value`, `defaultValue`, `onChange`,
`color`, `size`, `disabled`, `previousLabel`, `nextLabel`, `getPageAriaLabel`. It returns `null` when `total <= 0`
and implements the Task 535 shed-to-fit ladder (`SHED_LEVELS`, `computeShedRange`), Rule 1 `flex-nowrap` +
`overflow:hidden`, and Rule 4 SSR-safe floor-on-first-render.

### 3.2 There are TWO production consumers, not one

`FACT` — `ListingsPagination` is rendered by:

| Consumer | Import | Call site | Route |
|---|---|---|---|
| `src/modules/listings/components/ListingsShellView.tsx` | line 9 | line 158 | `/[locale]/listings` |
| `src/modules/listings/components/FavoritesShell.tsx` | line 10 | line 221 | `/[locale]/favorites` |

Both pass the identical `{ total, page, perPage }` prop triple, so **neither consumer needs editing** — but both
routes inherit every rendered delta in §3.5. `/favorites` is an in-scope *blast radius*, not an in-scope *edit*.
Any diff line inside either consumer file is a rejected diff.

### 3.3 Storybook is a valid proof surface — verified, not assumed

`FACT` — `.storybook/preview.tsx:228-230` sets `nextjs: { appDirectory: true }` globally, so `useRouter`,
`usePathname` and `useSearchParams` resolve inside stories instead of throwing.
`FACT` — `.storybook/preview.tsx:14` imports `../src/design-system/mantine/pagination-chrome.css`, the same Task 533
stylesheet `src/app/layout.tsx:9` imports for production. The story therefore renders the **real** chrome and the
real `@media (max-width: 639.98px)` 44px floor, not an approximation.
`FACT` — `.storybook/preview.tsx:105-111` wraps every story in `NextIntlClientProvider` with
`locale = context.globals.locale`, so the component's own `useTranslations('common')` calls resolve
toolbar-reactively in all four locales with **no new production i18n keys**.

`FACT` — the route is *not* a valid proof surface, and this is already binding sprint text. The Sprint 68
Preconditions record: the product has two listings in total, `/listings` renders **no pagination control at all**,
Task 775 deleted its pagination interaction for exactly this reason (`95c3ba570`, 21 lines removed), and
*"Pagination's only proof surface in this sprint is Storybook."* **No route probe and no pagination route test may
be added by this task.** Reading an absent control on a live route as a pass is the specific failure that text
forbids.

### 3.4 The two accessibility gaps — measured in the library, not inferred

`FACT` — `node_modules/@mantine/core/esm/components/Pagination/PaginationItems/PaginationItems.mjs:17` sets
`"aria-current": page === ctx.active ? "page" : void 0` on the active control. That is Mantine's **own stock
behavior**.
`FACT` — `MantinePagination` does not use `PaginationItems`; it hand-composes `Pagination.Control` (Rule 3, so it
can express the asymmetric shed) and **omits `aria-current`**. `PaginationControl.mjs` sets only
`mod={{active}}` → `data-active`.
`FACT` — `grep -rln 'aria-current' src --include=*.tsx` returns exactly two files: `src/components/ui/pagination.tsx`
(legacy) and `src/modules/listings/components/ListingsPagination.tsx`. The Mantine path has never carried it.
`INFERENCE` — migrating onto `MantinePagination` as it stands would **silently drop `aria-current="page"` from two
production routes**. §10.4 fixes that by restoring the library's own behavior; it is not a new invention and
needs no owner decision (see §5, D777-1).

`FACT` — `Pagination.Root` renders a `Box` (`PaginationRoot.mjs:109`), i.e. a `div`, with no `<nav>` and no
landmark label. The current component's `<nav aria-label={tc('aria_pagination')}>` therefore cannot come from
`MantinePagination` and must be supplied by `ListingsPagination` itself (§10.3).

### 3.5 Visual source map — every changed and preserved artifact

| Visible artifact / state | Component / markup | Class / selector | Utility, cascade and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Control box, desktop ≥640 | `<Button size="icon" className="h-10 w-10">` | `.h-10.w-10` | Tailwind `2.5rem` = **40×40** | **preserve** — TailAdmin §6l measures *"active page number 40×40"* (`docs/tailadmin-style-reference.md:446-448`); current legacy already matches | AC6 measures it in the story |
| Control box, <640 | same 40×40 at every width | — | — | **accepted delta 40 → 44px** | `pagination-chrome.css` `@media (max-width:639.98px) { min-width/min-height: 2.75rem }` (Task 535 Rule 5). Tap-target floor; the sprint's intent, recorded here so review does not read it as a regression |
| Item gap | `gap-1` on the `nav` | `.gap-1` | Tailwind `0.25rem` = **4px** | **accepted delta 4 → 8px** | `MantinePagination` hardcodes `gap: var(--mantine-spacing-xs)`; `theme.ts:202` `xs: '0.5rem'` = 8px = TailAdmin §6l *"item gap 8px"*. Moves toward provenance |
| Control radius | `rounded-xl` | `.rounded-xl` | `globals.css:101` `--radius-xl = calc(var(--radius) * 1.5)`, `:507 --radius: 0.75rem` → **18px** | **accepted delta 18 → 8px** | `MantinePagination` passes `radius="lg"` on `Pagination.Root`; `theme.ts` `radius.lg = 8px` = TailAdmin §6l *"radius 8px"*. Moves toward provenance |
| Inactive number / hover / edge chrome | shadcn `variant="outline"` / `"default"` | — | Tailwind button variants | **change to canonical** | `pagination-chrome.css` already owns transparent inactive + gray-50 hover + white/gray-300 edge, all cited to §6l. No new CSS is authored by this task |
| Vertical rhythm around the row | `py-8` on the `nav` | `.py-8` | Tailwind `2rem` = **32px** | **preserve, re-expressed as a Mantine token** | `theme.ts:211` `'2xl': '2rem'` = 32px (D775-C). Exact, not approximate |
| Ellipsis marker | `<span>…</span>`, own algorithm | `.text-muted-foreground` | Tailwind | **delete** — replaced by `Pagination.Dots` + `computeShedRange` | §10.1 |
| Landmark + prev/next labels | `<nav aria-label>`, `aria-label` on 2 `Button`s | — | `common.aria_pagination` / `aria_prev_page` / `aria_next_page` | **preserve** | AC5 |
| Active-page semantics | `aria-current={p === page ? 'page' : undefined}` | — | — | **preserve, via §10.4** | §3.4 |

No visual value in this task lacks provenance: every changed value is either TailAdmin §6l measured, or a registered
Mantine theme token, or unchanged. **`orchestrator-ui-task-design.md`'s `BLOCKED — CANONICAL STYLE DECISION REQUIRED`
condition is not met.**

### 3.6 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story / source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| The pagination control row itself | `find src -iname '*Pagination*'` → 6 hits, all opened: `src/components/ui/pagination.tsx` (legacy shadcn, **not** consumed here), `src/design-system/mantine/pagination-chrome.css`, `src/design-system/mantine/patterns/MantinePagination.tsx`, its `__tests__/MantinePagination.smoke.test.tsx`, `src/modules/listings/components/ListingsPagination.tsx`, `src/stories/mantine/primitives/Pagination.stories.tsx`. Also inspected `MantineAdminSurfacePattern.tsx:112-122` as the one existing production consumer of the pattern. | `MantinePagination` (`src/design-system/mantine/patterns/MantinePagination.tsx`), rendered by `Mantine/Primitives/Pagination` | **reuse** | Consume the pattern; author **no** local styles, **no** new CSS rule, and **no** edit to `pagination-chrome.css` or `theme.ts`. Chrome and the 44px floor already come from the imported stylesheet |
| Active-page assistive semantics | §3.4: read `PaginationItems.mjs`, `PaginationControl.mjs`, and every `aria-current` occurrence in `src/` | Same pattern owns it for all consumers | **extend** | One attribute added inside `MantinePagination`, restoring Mantine's own stock behavior for **both** its consumers. Bounded by §10.4 and AC7 |
| A story proving the **migrated `ListingsPagination`** | `src/stories/patterns/mantine/` listed — **20** story files, none for this component; `src/stories/mantine/primitives/Pagination.stories.tsx` opened in full | **None exists.** The nearest candidate, `Mantine/Primitives/Pagination`, statically imports `MantinePagination` from `@/design-system/mantine/patterns` — the *pattern*, never `ListingsPagination`. It therefore cannot prove the production node, cannot satisfy `check:story-coverage` for this path (§3.7), and extending it would assert pattern coverage for a consumer it does not import | **create canonical** | New `src/stories/patterns/mantine/ListingsPagination.stories.tsx`, title `Patterns/Mantine/ListingsPagination`, plus `scripts/mantine-migration-scope.json` enrolment **in the same PR** |

**Permanent-story creation gate — satisfied, recorded here as required.** This is not a probe. The named in-scope
production consumers are `ListingsShellView.tsx:158` and `FavoritesShell.tsx:221` (§3.2); the story documents them,
it does not exist to exercise a selector. Sprint 68 exit criterion 2 independently requires it
(*"Every production component this sprint migrates is imported by a canonical `Patterns/Mantine/*` story that renders
the real component, and is enrolled in `scripts/mantine-migration-scope.json` in the same PR"*), and the owner
authorized it in this task's request. No reversible-probe path applies, so **no `git hash-object` restoration
evidence is required** — this markup is permanent by design.

### 3.7 Gate mechanics — read, not assumed

`FACT` — `scripts/lib/mantine-story-scope.mjs:15` — `MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/',
'Patterns/Mantine/']`. The required title `Patterns/Mantine/ListingsPagination` therefore auto-enrols the story into
`check-stories-rendered.mjs`, `check-locale-leak.mjs` and `check-story-coverage.mjs` with **no** entry in
`MANTINE_STORY_ENROLLED_TITLES`. Do not add one.

`FACT` — `scripts/check-story-coverage.mjs` (header, lines 14-27) resolves each canonical story's **static** `import`
specifiers through the TypeScript AST and fails when a manifest-enrolled component is imported by no canonical story.
Consequence: a dynamic import, a re-export barrel hop, or a demo analogue will **not** satisfy the gate. The story
must contain a literal
`import { ListingsPagination } from '@/modules/listings/components/ListingsPagination'`.

`FACT` — `scripts/mantine-migration-scope.json` currently holds **19** entries and ends with
`"src/modules/listings/components/ListingsPageFrame.tsx"` (Task 775). It is a flat JSON array of repo-relative paths.

`FACT` — `scripts/check-stories-rendered.mjs:395-400` — `MANTINE_VIEWPORTS` = `mobile-320`, `mobile-375`,
`mobile-390`, `desktop-1024`; `:115` `LOCALES = ['sq','en','uk','it']`. A new canonical story with one export
therefore adds exactly **4 × 4 = 16** cells and needs **no** `MANTINE_STORY_EXTRA_VIEWPORTS` entry — `mobile-320`,
the narrow-width proof, is already in the default set. **`desktop-1024` is the widest cell this story will ever
have**, so no acceptance criterion in this task may depend on a width above 1024.

`FACT` — `scripts/check-stories.mjs`: `layout:'centered'` and `layout:'padded'` are forbidden (§14.1, lines
183/188); per-locale export families are forbidden (line 264) — locale must come from `context.globals.locale`
(line 310); fixture strings must resolve through `storyT` (§14.2/§14.7); and lines 508-522 fail any
`messages/uk.json` `storybook.*` value that contains Latin letters but no Cyrillic. The `uk` strings added by this
task must be genuinely Ukrainian, not transliterated English.

`FACT` — `scripts/check-design-tokens.mjs:105` — `SKIP_SUFFIXES = ['.stories.tsx', '.test.tsx', '.test.ts']`. A fixed
pixel width used as a story fixture is therefore **not** a design-token violation. The exemption does **not** extend
to `ListingsPagination.tsx`, which the gate does scan.

### 3.8 A detector blind spot this task deliberately does not chase

`FACT` — `scripts/governance/component-catalog.mjs:98` computes
`usesButton = /from ['"]@\/components\/ui\/button['"]/.test(src) || /Button/.test(src)` and line 164 pushes a
`PRIMITIVE_CHECK` risk for any `isClient && !usesButton` component. After this migration the file contains neither
form, so a regenerated catalog would add a **false** `PRIMITIVE_CHECK` to the `ListingsPagination` row
(`docs/component-catalog.md:209`, currently `| APPROVED | — | 🌐 | LOCALIZATION |`).

`FACT` — `scripts/governance/component-catalog.mjs:225-241` — the `--check` mode behind `npm run governance:components`
only asserts that required **files exist**. It performs no drift comparison, so it can neither fail on the stale row
nor validate a regenerated one.

`FACT` — the catalog's own header reads *"Last generated: 2026-07-24 … full regeneration deferred to avoid sweeping
in unreviewed Task 669/675 drift"*, `ListingsPageFrame` (Task 775, landed 2026-08-31) is **absent** from it, and
`LatestListingsView` — an already-migrated component — already carries the same false `PRIMITIVE_CHECK`
(`docs/component-catalog.md:190`; the file holds **57** occurrences).

`INFERENCE` + **binding instruction**: regenerating the catalog inside this task would import ~5 weeks of unreviewed
drift and add a misleading risk flag. **Do not touch `docs/component-catalog.md`,
`scripts/governance/reports/component-catalog.latest.json`, `docs/component-coverage-matrix.md` or
`docs/component-risk-register.md`.** Report the stale row as a known, measured limitation. This is a coverage
decrease that no gate observes, stated plainly per `orchestrator-procedures.md` → "Detector-aware requirements and
migrations"; it is not repaired here.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Owner request; Sprint 68 goal | `ListingsPagination` renders its control row through `MantinePagination`; the file imports neither `@/components/ui/button` nor `lucide-react`, and contains no private range/ellipsis function | P0 | AC1 · grep of the changed file | Confirmed |
| **R2** | Owner request; current source lines 22-28 | The URL-navigation contract is unchanged: every existing query parameter survives, `page` is **deleted** for page 1 and **set** for every other page, navigation uses ``router.push(`${pathname}?${params.toString()}`)``, and a smooth scroll-to-top follows every navigation | P0 | AC2 · AC3 · diff inspection | Confirmed |
| **R3** | Current source lines 20-21 | `totalPages = Math.ceil(total / perPage)`; the component renders nothing when `totalPages <= 1` | P0 | AC4 | Confirmed |
| **R4** | `docs/component-rules.md`; §3.4 | Accessible semantics are preserved: the `<nav>` landmark with `common.aria_pagination`, prev/next `aria-label`s from `common.aria_prev_page` / `common.aria_next_page`, and `aria-current="page"` on the active control | P1 | AC5 · AC7 | Confirmed |
| **R5** | Owner request; Sprint 68 exit criterion 2 | A canonical story exists at `src/stories/patterns/mantine/ListingsPagination.stories.tsx`, title `Patterns/Mantine/ListingsPagination`, exactly one export `Default`, statically importing the real `ListingsPagination`, with fixed fixtures for first / middle / last / ellipsis and one narrow-width container | P1 | AC8 · AC9 | Confirmed |
| **R6** | Sprint 68 exit criterion 2; §3.7 | `scripts/mantine-migration-scope.json` gains `src/modules/listings/components/ListingsPagination.tsx` in the same PR | P1 | AC10 | Confirmed |
| **R7** | Owner request; §3.7 | Every new story-only string is a `storybook.mantine.*` key present in all four of `en`, `sq`, `uk`, `it`, with genuinely Cyrillic `uk` values. No new production i18n key is added | P1 | AC11 | Confirmed |
| **R8** | Owner request | The pre-edit census in §3 reproduces exactly. Any drift is reported as `BLOCKED`, never absorbed as widened scope | P0 | AC12 | Confirmed |
| **R9** | §3.4 | The `MantinePagination` edit is bounded to restoring `aria-current` parity plus one regression assertion; no other behavior of the shared pattern changes | P2 | AC7 · diff line count | Confirmed |
| **R10** | Sprint 68 Preconditions | No route probe, pagination route test, or live-`/listings` pagination assertion is added | P0 | AC13 | Confirmed |

## 5. Assumptions and open questions

**D777-1 — `aria-current` is restored, not deferred, and this is not an owner decision.** `docs/orchestrator-procedures.md`
→ Ambiguity policy requires all three conditions before asking the owner. Condition 2 fails: the answer **is** derivable
from repository context — Mantine's own `PaginationItems.mjs:17` is the provenance, so the change restores upstream
behavior rather than inventing a convention. Condition 3 fails: the assumption is a single additive attribute and is
trivially reversible. Route selected: **extend** (§10.4). Recorded so the reviewer sees the reasoning rather than
re-litigating it.

**Not a blocker for this task — D68-1.** The open sprint decision on Task 772 ordering does not gate 777: this task
touches neither `ListingsSortBar` nor `SaveSearchButton`, nor the sort-bar row that holds them.

**UNKNOWN, and it is a fail-closed path, not a licence to improvise.** Whether a `size` value exists that makes
`MantinePagination` render a 40×40 control at ≥640px through the existing prop **has not been verified by this task
design** — `MantinePaginationProps.size` is typed `MantineSize | (string & {})`, but the rendered result of a
non-preset value was not measured. See AC6: if no `size` value reaches 40×40 without editing `theme.ts`,
`pagination-chrome.css`, or adding local CSS, report **`BLOCKED — CANONICAL SIZE DECISION REQUIRED`** with the
measured values that were tried. Do **not** author a local style rule to force it, and do **not** silently accept a
different size.

**Nothing else is ambiguous or conflicting.**

## 6. Pre-read rule bundle

Selected from `docs/rule-index.md` → **UI / Layout / Component → mixed migration**, plus **Storybook / Visual Proof**.
Read exactly these; do not read the full doc set.

*Always required:* `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (scan only — see §13.4).
*Current Mantine path:* `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6l ·
`docs/component-rules.md` · `docs/ui-rules.md` (routing and legacy-boundary notes only) · `docs/qa-rules.md`.
*Storybook proof path:* `docs/storybook-governance.md` (§14.1, §14.2, §14.6, §14.7, §14.9.17, §15) ·
`docs/storybook-visual-snapshots.md`.
*Task context:* this file · `tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md` ·
`.claude/skills/execute-task/SKILL.md`.
*Do not read:* the legacy Tailwind governance bundle, `docs/design-system.md` beyond a token lookup, the component
catalog bundle (§3.8 puts it out of scope), or any `docs/*audit*.md`.

## 7. Scope — the diff may touch only these paths

| # | Path | Change |
|---|---|---|
| 1 | `src/modules/listings/components/ListingsPagination.tsx` | Migrated (§10.1-10.3) |
| 2 | `src/design-system/mantine/patterns/MantinePagination.tsx` | **One** added `aria-current` expression (§10.4) |
| 3 | `src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx` | **One** added `it(...)` block asserting §10.4 |
| 4 | `src/stories/patterns/mantine/ListingsPagination.stories.tsx` | **New** (§10.5) |
| 5 | `scripts/mantine-migration-scope.json` | **One** added array entry (§10.6) |
| 6 | `messages/en.json` · `messages/sq.json` · `messages/uk.json` · `messages/it.json` | New `storybook.mantine.*` keys only (§10.7) |
| 7 | `docs/backlog.md` | Concise state update only (§14) |
| 8 | `docs/sessions/2026-08-31-task777-listings-pagination-mantine.md` | **New** session log |
| 9 | `tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md` | Tasks-table state row only |
| 10 | `docs/sessions/evidence/task777/**` | **New** — the retained command transcripts §13.2 requires. Tracked files, not scratch: `docs/sessions/evidence/task775/` holds **46** committed transcripts, and Sprint 68's own closing lesson from 776 is that *a kickoff naming commands but no retained evidence path loses its proof to prose*. Transcripts only — no script, no probe, no fixture (R10) |

A status path outside this table is a rejected diff, not a note.

## 8. Out of scope — hard

- **`src/modules/listings/components/ListingsShellView.tsx` and `src/modules/listings/components/FavoritesShell.tsx`.**
  Zero diff lines. The prop contract does not change, so neither call site needs editing. `/favorites` inherits the
  §3.5 deltas; that is an observation for the report, not a reason to edit it.
- **`ListingsSortBar`, `SaveSearchButton`, the sort-bar row, and every filter surface** — Sprint 68 exit criterion 4
  and Task 772's R4.
- **`src/components/ui/pagination.tsx`** — the legacy shadcn primitive. Unrelated to this component; not deleted here.
- **`pagination-chrome.css`, `src/design-system/mantine/theme.ts`, `src/app/globals.css`** — the chrome, the 44px
  floor and the token scale are already correct. Editing any of them to chase a visual value is a rejected diff; see
  the `BLOCKED` path in §5.
- **`docs/component-catalog.md` and the component-catalog/coverage/risk bundle** — §3.8.
- **Any route probe, pagination route test, or live-`/listings` pagination assertion** — §3.3, R10.
- **`MANTINE_STORY_ENROLLED_TITLES`, `scripts/story-coverage-exempt.json`, `story-realmode-allowlist.json`, and any
  `GEOMETRY_ALLOWLIST` row** — §3.7 makes all of them unnecessary. Adding one to quiet a gate is a rejected diff
  (`docs/backlog.md`, reserved **750**, N1: an allowlist row is strictly more permissive than a structural predicate).
- **Data loading, the filter URL contract beyond `page`, the SSR query, `listings_restore`, the favorites set, and
  currency behavior** — Sprint 68 exit criterion 3.

## 9. Current and required behavior

**Current, to preserve exactly.** Clicking a page control rebuilds `URLSearchParams` from the live `searchParams`,
removes `page` when the target is page 1 and sets it otherwise, pushes `${pathname}?${params.toString()}`, then calls
`window.scrollTo({ top: 0, behavior: 'smooth' })`. Prev is disabled on page 1, Next on the last page. The component
renders nothing when `totalPages <= 1`. The row is centered, with 32px of vertical padding, and is labelled as a
navigation landmark.

**Required after.** Identical navigation, identical guard, identical landmark and labels — with the visible row
produced by `MantinePagination`, its shed-to-fit range algorithm, and the Task 533 chrome. The deltas listed in §3.5
(4→8px gap, 18→8px radius, 40→44px control below 640px) are accepted migration outcomes.

## 10. Implementation requirements

**10.1 — delete, do not adapt.** Remove `getPages()` in full, both `lucide-react` icon imports, the
`@/components/ui/button` import, and all three `<Button>` elements. The migrated file must contain **zero**
`className` attributes carrying a Tailwind utility and **no** `Button` identifier — §3.8 depends on the latter being
true and honestly reported, not worked around.

**10.2 — pass `MantinePagination` a page count.** `MantinePaginationProps.total` is the **number of pages**; the
component's own `total` prop is the **number of items**. Pass `total={totalPages}` and `value={page}`, with
`onChange={goTo}`. Keep `goTo` byte-identical in behavior to lines 22-28 of the current file.

**10.3 — the wrapper.** Preserve the `<nav>` landmark with `aria-label={tc('aria_pagination')}` and re-express its
layout in Mantine only: centered row, vertical padding from `theme.spacing['2xl']` (= 32px = the current `py-8`).
`MantineAdminSurfacePattern.tsx:113` is the proven wrapper precedent (`<Group justify={…}>`), and the
`MantinePagination` docblock names the consumer's `Group justify=…` wrapper explicitly.
**Measurement caveat, stated because it is easy to get wrong:** `MantinePagination`'s `ResizeObserver` reads
`row.parentElement.clientWidth` as its width budget (Rule 2). Whatever wrapper is chosen must leave that budget equal
to the real available width; a wrapper that shrinks the pagination root to content width starves the shed estimate.
AC9 is the observable check on this, not the wrapper's source shape.

**10.4 — the bounded `MantinePagination` extension.** On the `Pagination.Control` rendered for a page item, add
`aria-current={item === activePage ? 'page' : undefined}`, mirroring `PaginationItems.mjs:17`. Nothing else in that
file changes: not `computeShedRange`, not `SHED_LEVELS`, not the probe, not the effect, not the props interface. Add
exactly one `it(...)` block to `MantinePagination.smoke.test.tsx` asserting that the active control carries
`aria-current="page"` and that a non-active control does not.

**10.5 — the story.** `src/stories/patterns/mantine/ListingsPagination.stories.tsx`, title
`Patterns/Mantine/ListingsPagination`, `parameters: { skipCanvas: true, layout: 'fullscreen' }`, **one** export named
`Default` that resolves `const l = (context?.globals?.locale as string) ?? 'en'` and renders the real component.
`src/stories/patterns/mantine/ListingsPageFrame.stories.tsx` (Task 775) is the shape to follow. Fixed fixtures,
all with `perPage={10}` so `totalPages` is exact:

| Fixture | Props | Proves |
|---|---|---|
| first | `total={50} page={1}` | Prev disabled; page 1 active |
| middle | `total={50} page={3}` | both edges enabled |
| last | `total={50} page={5}` | Next disabled; last page active |
| ellipsis | `total={200} page={10}` | `Pagination.Dots` renders at `desktop-1024` |
| narrow | the `ellipsis` fixture inside a fixed narrow container | the shed ladder engages instead of overflowing |

Fixture values are frozen literals — no `Date`, no `Math.random`, no width derived from the viewport
(`check-stories.mjs` Check 16). Every visible label is `storyT(l, 'storybook.mantine.…')`.

**10.6 — enrolment.** Append `"src/modules/listings/components/ListingsPagination.tsx"` to
`scripts/mantine-migration-scope.json`, keeping the file valid JSON. Do not reorder or remove the existing 19 entries.

**10.7 — i18n.** Add only the section/caption labels the story renders, under `storybook.mantine.*`, to all four
message files with identical key sets. Reuse the existing `storybook.mantine.pagination_aria_prev`,
`pagination_aria_next` and `pagination_aria_page` where a label is needed; do **not** duplicate them. Add **no**
`common.*` key — §3.3 establishes the component's own `useTranslations('common')` resolves in Storybook.

## 11. Positive and negative flows

**Positive flow.** On `/uk/listings?type=apartment&city=tirana&page=3` with 50 results and `perPage=10`, the user
clicks control `4`. `page` is set to `4`, `type` and `city` survive unchanged, the router pushes
`/uk/listings?type=apartment&city=tirana&page=4`, the window scrolls smoothly to the top, control `4` becomes active
with `aria-current="page"`, and the row remains on one line.

**Negative-flow applicability.**

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | No form input, no schema; the control only re-serializes existing params | N/A | — |
| Authorization / RLS | **No** | Client-side URL navigation only; no data access, action or query changes | N/A | Sprint 68 exit criterion 3 |
| Offline / network | **No** | `router.push` inherits the existing global App Router behavior; unchanged by this diff | N/A | — |
| Concurrent writer | **No** | No write path | N/A | — |
| **Single page (`totalPages <= 1`)** | **Yes** | Current source line 21 — the guard lives in the consumer, not in `MantinePagination` (which only returns `null` at `total <= 0`) | Nothing renders | AC4 |
| **Boundary controls** | **Yes** | Current `disabled={page === 1}` / `disabled={page === totalPages}` | Prev disabled on page 1, Next on the last page | AC3, and the existing smoke test at `MantinePagination.smoke.test.tsx:137-148` already covers the pattern's half |
| **Page 1 target** | **Yes** | Current line 24 `params.delete('page')` | `page` absent from the resulting URL | AC2 |
| **Narrow viewport, long range** | **Yes** | Task 535 Rules 1-3 | The row sheds; it never wraps, never h-scrolls, never clips a control | AC9 |

## 12. Acceptance criteria

- **AC1 [R1]** *Given* the migrated file, *when* it is grepped, *then* `@/components/ui/button`, `lucide-react`,
  `getPages`, `<Button` and `ChevronLeft`/`ChevronRight` each return **zero** matches, and
  `MantinePagination` returns at least one.
- **AC2 [R2]** *Given* `goTo(1)` and `goTo(n>1)` in the migrated file, *when* the diff is read, *then* the
  `URLSearchParams` construction, the `params.delete('page')` / `params.set('page', String(p))` split and the
  ``router.push(`${pathname}?${params.toString()}`)`` call are behaviorally identical to current lines 22-27, with no
  parameter added, dropped or reordered.
- **AC3 [R2]** *Given* any navigation, *when* it completes, *then* `window.scrollTo({ top: 0, behavior: 'smooth' })`
  has run; and the Prev/Next controls are disabled at the first/last page respectively.
- **AC4 [R3]** *Given* `total=5, perPage=10`, *when* the component renders, *then* it produces no DOM output.
- **AC5 [R4]** *Given* the rendered story, *when* the DOM is inspected, *then* a `<nav>` carries
  `aria-label` = `common.aria_pagination` for the active locale, and the prev/next controls carry
  `common.aria_prev_page` / `common.aria_next_page`.
- **AC6 [R4, §5]** *Given* the `desktop-1024` cell, *when* a non-edge control's box is measured, *then* it is
  **40 × 40 CSS px (±0.5px)**, achieved through `MantinePagination`'s `size` prop alone. *If no `size` value achieves
  this without editing shared chrome*, the task status is `BLOCKED — CANONICAL SIZE DECISION REQUIRED` with the
  measured candidates recorded — never a local CSS rule and never a silent different size.
- **AC7 [R4, R9]** *Given* `MantinePagination` at any shed level, *when* the active control is inspected, *then* it
  carries `aria-current="page"` and no inactive control does; the new `it(...)` block asserts both arms and passes;
  and the `MantinePagination.tsx` diff adds **no** line other than that attribute expression.
- **AC8 [R5]** *Given* `npm run check:story-coverage`, *when* it runs after the enrolment, *then* it exits **0** and
  its output names `src/modules/listings/components/ListingsPagination.tsx` as covered **via**
  `src/stories/patterns/mantine/ListingsPagination.stories.tsx`. A pass without that path named does not satisfy this
  criterion.
- **AC9 [R5]** *Given* `npm run screenshots:assert -- --mantine-only`, *when* it runs, *then* the run reports exactly
  **16** new cells for `ListingsPagination` (4 viewports × 4 locales, §3.7) with **zero** `failReason`; at
  `desktop-1024` the ellipsis fixture renders at least one `.mantine-Pagination-dots`; at `mobile-320` no fixture
  overflows horizontally, no row wraps, and every control's measured box is ≥ 44 × 44. **Any `failReason` on a new
  cell is a finding and `PARTIALLY IMPLEMENTED`** — never an allowlist entry, never a waiver.
- **AC10 [R6]** *Given* `scripts/mantine-migration-scope.json`, *when* it is parsed, *then* it holds **20** entries,
  the 19 pre-existing ones unchanged, and it lands in this same PR.
- **AC11 [R7]** *Given* `npm run check:i18n` and `npm run check:stories`, *when* they run, *then* both exit **0**;
  every new key exists in all four message files; and no `uk` value trips the Cyrillic rule
  (`check-stories.mjs:508-522`).
- **AC12 [R8]** *Given* the §3 census re-measured **before** the first edit, *when* any figure differs — the 87 lines,
  the 4 import lines, the 3 `<Button`, the 7 `className=`, the two consumers at `ListingsShellView.tsx:158` and
  `FavoritesShell.tsx:221`, the 19 manifest entries, the 20 files in `src/stories/patterns/mantine/`, or
  `MANTINE_VIEWPORTS` being those exact four — *then* the task stops at **`BLOCKED`** naming the drifted figure. Scope
  is never widened to absorb drift.
- **AC13 [R10]** *Given* the final diff, *when* it is read, *then* it contains no route probe script, no
  `/listings` pagination assertion, and no new file under `scripts/` other than the manifest edit.
- **AC14 [all]** *Given* the final tree, *when* `npm run build` runs, *then* it exits **0**. A failed or unrun build
  permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 13. QA profile and verification plan

**`Q3 Full Visual Matrix`**, per `docs/qa-profiles.md`: *"New or migrated Mantine primitive … or any task the owner
marks visual-critical."* This migrates a control onto the Mantine path, creates a canonical story, and changes
rendered geometry on two routes. Q3 *"cannot be approved without full visual proof for the affected stories/surfaces"*
— and §3.3 fixes that proof path as **Storybook only**.

### 13.1 Baseline first — before any edit

Sprint 68's Preconditions require the gates to be green **before** the slice edits anything; a gate already red at
baseline blocks the slice rather than being repaired inside it. On the clean pre-edit tree, run and retain:

```powershell
npm.cmd run build-storybook
npm.cmd run screenshots:assert -- --mantine-only
```

Record the pre-edit Mantine cell total. AC9's "+16" is measured against **that** number, not against a figure quoted
from any document.

### 13.2 Required checks — native Windows PowerShell

Per `docs/orchestrator-role.md` → Windows-native validation rule, run every command below in native Windows
PowerShell from the project root. Record `node.exe -p process.platform` → must be `win32`, plus the Node version,
cwd, exact command and **actual** exit code for each. Retain transcripts under
`docs/sessions/evidence/task777/`.

```powershell
node.exe -p process.platform
npx.cmd eslint src/modules/listings/components/ListingsPagination.tsx src/design-system/mantine/patterns/MantinePagination.tsx src/stories/patterns/mantine/ListingsPagination.stories.tsx
npm.cmd run typecheck
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:i18n
npm.cmd run check:mojibake
npm.cmd run check:file-integrity
npm.cmd run check:design-tokens:strict
npm.cmd run governance:tailwind
npm.cmd test -- src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx
npm.cmd run build-storybook
npm.cmd run screenshots:assert -- --mantine-only
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
git --no-optional-locks diff --check
```

Every one of these is an **acceptance condition**. Note the deliberate departure from Task 775, which listed
`screenshots:assert -- --mantine-only` and `check:locale-leak:mantine-only` as optional diagnostics: 775 carried a
live route probe as its primary rendered evidence, and this task has none (§3.3). The canonical Mantine
screenshot/assert gate **is** this task's rendered proof, so it is required and its per-cell result is AC9.

`npm.cmd run build` exit 0 is the hard gate for every non-Q0 task.

### 13.3 How to read the rendered comparison

The new story **adds** cells; the run is therefore not manifest-identical to the baseline by design. The two claims
to evidence separately are: (a) no previously-passing cell regresses, and (b) all 16 new cells pass with zero
`failReason`. Per `docs/qa-profiles.md` → "Per-story viewport sets are not uniform", read the new story's actual
viewport list **out of the manifest** rather than inferring it from the run's union; §3.7 predicts the default four,
and a manifest that disagrees is drift under AC12. Any md5 movement on pre-existing cells is governed by
`docs/storybook-governance.md` §14.11 (D26) — do not invent a per-task pixel tolerance.

### 13.4 Critical flow — owner-native, not executor-blocking

`docs/critical-flow-registry.md:105` registers `/en/listings` under *"Hydration / console errors — live public
routes"*, whose evidence is `check:hydration` against a running server and whose Coverage records that as
**owner-run**. No registry row covers pagination itself, and none covers `/favorites`. Record it as
`MISSING EVIDENCE — owner-native` and hand the owner the exact command:

```powershell
$env:BASE_URL="http://localhost:3000"; npm.cmd run check:hydration
```

Expected: PASS on the Listings-en cell, 0 hydration violations. **Do not boot a server and probe `/listings` inside
this task** — §3.3 and R10.

## 14. Completion report contract

Write `docs/sessions/2026-08-31-task777-listings-pagination-mantine.md` and update `docs/backlog.md` concisely
(active state only; take the line baseline from `git show HEAD:docs/backlog.md | wc -l` **before** editing, never
after your own edit). Report:

1. **Files Changed** table — must match the real diff exactly, and must be a subset of §7.
2. The **pre-edit census re-measurement**, figure by figure against §3, with the AC12 verdict.
3. Requirement IDs R1-R10 completed, each AC's evidence and its artifact path.
4. Every §13.2 command with its actual output, exit code and transcript path, plus the `win32` platform receipt.
5. The §13.1 baseline cell total, the post-edit total, and the per-cell result for all 16 new cells.
6. The AC6 measurement: the `size` value used and the measured control box, or the `BLOCKED` path with candidates tried.
7. That the §3.5 accepted deltas reach **both** unedited consumers through the shared `ListingsPagination`, evidenced **structurally, never by visiting a route** (§3.3, R10): the import chain `ListingsShellView.tsx:9` and `FavoritesShell.tsx:10` → `ListingsPagination` → `MantinePagination`, both call sites shown to be zero-diff and to pass the identical `{ total, page, perPage }` triple, and the rendered delta itself demonstrated once in the canonical story. State plainly that `/favorites` has **no** rendered evidence in this task and that this is the sprint-mandated proof boundary, not an omission.
8. Known limitations — including the §3.8 stale `docs/component-catalog.md` row and the §13.4 owner-native handoff.
9. Assumptions, deviations, unresolved issues.
10. Final status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never
    `APPROVED`. Emit no `git add`, `git commit` or `git push` — mutating git is owner-only.

## 15. Task quality gate

- A fresh Sonnet session can execute this with no hidden chat context: every path, line reference, command, gate
  mechanism and expected count in §3 was opened and measured on 2026-08-31, not quoted from a document.
- Each of R1-R10 has at least one binary acceptance criterion and one verification method.
- §8 and §9 name what must not change; the two untouched consumers are named with their line numbers.
- The negative-flow table is selected by applicability — four branches are marked `No` with the reason, and four
  applicable branches were added because this control actually has them.
- The canonical UI decision record (§3.6) names the inspected candidates, why `Mantine/Primitives/Pagination` cannot
  supply the proof, the in-scope production consumers, and the sprint text authorizing the permanent story. Every
  visual value in §3.5 traces to TailAdmin §6l or a registered theme token; none is guessed.
- The requested gates prove the changed behavior: AC8 requires the coverage gate to **name the path**, not merely
  exit 0; AC9 requires per-cell results, not a count; AC7 bounds the shared-pattern edit to one attribute.
- The one genuinely unverified fact (§5, the `size` → 40×40 mapping) is labelled `UNKNOWN` and carries a fail-closed
  `BLOCKED` route instead of being asserted as `Confirmed`.
- The detector blind spot in §3.8 is stated rather than chased, with the 775 precedent and the catalog's own
  deferral note as evidence; no green gate is claimed to cover it.
- No owner-only exception is claimed. D777-1 is justified against the ambiguity policy, not against convenience.
