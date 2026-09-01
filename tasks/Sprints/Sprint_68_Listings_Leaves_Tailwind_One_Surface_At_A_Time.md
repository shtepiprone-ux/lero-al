# Sprint 68 — `/listings` leaves Tailwind, one surface at a time

**Opened:** 2026-08-30 · **Status:** 🟠 **OPEN** · **Landed tasks:** 3 (775 · 776 APPROVED WITH NOTES 2026-08-31 · 777 COMPLETE 2026-09-01)

> **Opened by owner instruction, 2026-08-30** — the owner supplied a route-level migration plan for `/listings`
> (working note, untracked: `Codex-tasks/listings-mantine-migration-plan.md`) and asked for a sprint plus its first
> task. The 2026-08-01 owner rule forbids a kickoff without a sprint and no open sprint fits (table below). This
> file, the kickoff, and `docs/backlog.md`'s Sprints section + registry row were written in the **same edit**, per
> the 2026-08-10 fourth-occurrence corollary: a number is allocated in the registry in the same edit as the kickoff,
> or it is not allocated at all.

## Why not an existing sprint — checked before opening this one

| Sprint | Its goal | Fits 775? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | **No.** Different surface, and **D28** binds it to mechanism-only changes at zero visual delta. It is also down to three retained follow-ups (743/744/745), not new migration slices. |
| **55** | ARIA semantics no gate sees | **No.** Semantics, not layout ownership. |
| **56** | Raw enum leaks and the blind detector | **No.** Localization/detector subject. |
| **57** | Delete what no longer earns its place | **No.** Pure removal; 775 creates a component and preserves every control. |
| **61** | The projection layer no gate reads | **No.** Markdown/ledger projection, not UI. |
| **62** | Tailwind runtime tokens outlive Tailwind | **No.** Token-emission mechanism on the Homepage set; 775 moves route chrome, it does not change a token's runtime declaration. |
| **65** | Homepage finishes the Tailwind exit | **No.** Homepage surface, and closed to new work that is not the global-retirement decision. |
| **66** | `/listings` mobile overflow | **No — and this is the one worth stating.** Same route, opposite intent. Sprint 66's Task 772 is a bounded **legacy** responsive fix whose R4 reads *"No unrelated de-Tailwind and no component migration"*. Putting a migration slice in 66 would contradict its own exit criterion 5. |
| **67** | Nested floating layers | **No.** Closed 2026-08-27. |

No open sprint fits. Opened 68 rather than attaching 775 to the nearest number.

## Goal

`/listings` stops being a Tailwind/shadcn page. Each slice moves **one** surface to Mantine behind its own canonical
`Patterns/Mantine/*` story, with its own pre-edit census, and leaves the route's data loading, filter URL contract and
listing state untouched.

The narrower point this sprint exists to prove: **a migration slice is bounded by a measured census, not by a plan
paragraph.** Sprint 65 established that shape for the Homepage (Task 770 blocks on any total other than `42 / 79`).
`/listings` gets the same discipline — the owner's plan currently carries no counts at all.

## What this sprint deliberately does not inherit from the owner's plan

The supplied plan was audited against the working tree on 2026-08-30. Three of its instructions are not carried into
this sprint as written:

1. **`ListingsSortBar` is not available.** The plan's step 7 migrates it; **Task 772** (Sprint 66, P1,
   `KICKOFF FILED`) owns that file right now and forbids migration on it. Any slice touching `ListingsSortBar`,
   or the sort-bar row that also holds `SaveSearchButton` (`ListingsShell.tsx:193-206`), waits for 772 to land and
   re-measures afterwards. **Open sprint decision D68-1.**
2. **"Story first, production code second" is not carried as a cross-PR rule.** `scripts/lib/mantine-story-scope.mjs`
   makes a `Patterns/Mantine/*` title an assertion that the component **is** canonical Mantine — the Task 678
   comment in that same file rejects a prefix that would assert canonical status for unmigrated components. A story
   landing one PR ahead of its migration enrols a still-shadcn component into `screenshots:assert --mantine-only`,
   `check:locale-leak --mantine-only` and `check:story-coverage`. This sprint keeps the plan's intent — the story
   imports the **real** production component, never a demo analogue — but story and migration land in the **same
   PR**, which is also what `docs/agent-contract.md` clause 16c already permits ("create it first *or in the same
   task before consumer migration*").
3. **`ListingsShell` is not a single slice.** It is 270 lines of `'use client'` container
   (`useSearchParams`, `useAuth`, `useExchangeRate`, `next/dynamic`, sequential load-more, `listings_restore`,
   local `favoriteIds`). The repository's own pattern is container/presentational
   (`FeaturedListings`/`FeaturedListingsView`, `RecentlyViewedGrid`/`RecentlyViewedGridView`,
   `SimilarListings`/`SimilarListingsView`), and `Patterns/Mantine/HomepageListingGrids` imports the **Views**.
   Extracting `ListingsShellView` is its own slice, before any Mantine rewrite of the shell.

## Tasks

> **This table is the single state source for the sprint.** The execution-order section below is order and gating
> only; it carries no state.

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **775** | `/listings` route chrome — `ListingsPageFrame`, Mantine, with its canonical story | **P2** | **Q3** | ✅ **APPROVED WITH NOTES** (Opus) 2026-08-31 — archived. Ledger: `docs/reviews/2026-08-31-task775-listings-route-frame.review-ledger.json` (gate PASSED on win32). 11/11 section-8 gates `EXIT_CODE=0`; probe `-03` hash-matched, 28 cells, 0 `failReason`. NOTE-1 missing platform header · NOTE-2 `-01`/`-02` superseded. **A2 + B2 + C1** closed by the owner 2026-08-30. |
| **776** | `/listings`: extract `ListingsShellView` as the pre-migration seam | **P2** | **Q1** | ✅ **APPROVED WITH NOTES** (Opus) 2026-08-31 — archived. Ledger: `docs/reviews/2026-08-31-task776-listings-shell-view-seam.review-ledger.json` (gate PASSED on win32). JSX equivalence reproduced by the reviewer: zero residual diff, 13/13 `className`. Kickoff `Sprint_68_kickoff_prompt_Task_776_Listings_Shell_View_Seam.md` — `Sprint_68_kickoff_prompt_Task_776_Listings_Shell_View_Seam.md`. Session: `docs/sessions/2026-08-31-task776-listings-shell-view-seam.md`. |
| **777** | `/listings` pagination → `MantinePagination`, with its canonical story | **P2** | **Q3** | ✅ **COMPLETE** 2026-09-01 (owner decision). Closed under **D68-2** differential baseline, which replaced the unattainable global-green precondition: **B** `1241/1348 PASS, 80 FAIL, 27 AMBIGUOUS` → **P** `1257/1364 PASS, 80 FAIL, 27 AMBIGUOUS`, so `P \ B = ∅` and all **16** new `Patterns/Mantine/ListingsPagination` cells passed. Control size: Mantine default **32×32** accepted by the visual owner — supersedes AC6's 40×40, no `size` prop, no raw-pixel CSS. Owner visually accepted story + live server. Final test-only edit: smoke test **23/23**, ESLint exit 0 (one pre-existing warning at `MantinePagination.tsx:238`, deliberately not silenced). No route probe — Storybook remained the only proof surface. Session: `docs/sessions/2026-08-31-task777-listings-pagination-mantine.md` §14. |
| **778** | `/listings`: `ListingsFilters` → Mantine, hosted by the canonical `MantineDrawer` | **P2** | **Q3** | 🟠 **KICKOFF FILED** 2026-09-01. `Sprint_68_kickoff_prompt_Task_778_ListingsFilters_Mantine_Drawer.md`. Migrates the 367-line filters panel off shadcn `Button`/`Input`/`cn` (measured pre-edit: 27 `className`, 4 `cn(`, 8 `<Button`, 1 `<Input`) and swaps `ListingsShellView.tsx:82-86`'s `Sheet` for `MantineDrawer` (`side="left"`, `size="xs"` = 20rem = the legacy 320px, token-clean). New canonical story `Patterns/Mantine/ListingsFilters` (+16 cells), manifest 20 → 21. **`ListingsShellView` is deliberately NOT enrolled** — it stays a mixed legacy composite until its own final slice. First slice bound by **D68-2**. Records five accepted canonical changes rather than claiming visual neutrality — chief among them that the desktop drawer **gains** a close affordance the legacy `Sheet` explicitly hid (`showCloseButton={false}`). |

## Execution order

Order and gating only — read state from the Tasks table above.

1. **775** — route chrome. Chosen first because it is the only surface on the route with no URL contract, no client
   state and no overlap with Task 772. It also fixes the conventions every later slice reuses: story path and title,
   `storybook.mantine.*` keys in four locales, the migration-scope enrolment, and the page-width contract.
2. **776** — `ListingsShellView` extraction (no Mantine, no visual delta), filed 2026-08-31. It is the seam the
   later slices edit behind, so it precedes them. Still **not filed and not numbered**, and re-check
   `docs/backlog.md` before filing any of them: `ListingsPagination` — 87 lines, and ⚠️ **measured 2026-08-31: it is
   NOT a thin adapter over `MantinePagination`.** It is a hand-rolled control importing the shadcn `Button` with lucide
   `ChevronLeft`/`ChevronRight` over `useRouter`/`usePathname`/`useSearchParams`; `MantinePagination.tsx` exists in the
   pattern library but this file does not consume it. The slice is therefore a real migration, not a re-wire, and per the
   corrected precondition above its proof is a story, not a route probe. **Filed 2026-08-31 as 777**; then `ListingsFilters` together with the `Sheet` → `MantineDrawer` swap that lives inside
   `ListingsShell.tsx:181-188`; then `ListingsFilterBar`.
3. Toolbar (`ListingsStatusTabs`, `ActiveFilterChips`, `ListingsSortBar`) and `SaveSearchButton` — **after Task 772
   lands**, with a fresh census.
4. `ListingsShellView` → Mantine last, when its children are already migrated. 776 creates that view; it
   does not migrate it.

If the owner prefers a slice carrying **no** open decision, item 2's `ListingsShellView` extraction is that entry
point — filed 2026-08-31 as **776**, and dispatchable independently of 775's review.

## Preconditions

- A routable server (`next start` against a production build, or `next dev`). ⚠️ **Corrected 2026-08-31 by Task 775's
  closure — the original text required "a seeded database with at least two pages of listings", and that precondition is
  NOT satisfiable against the current data set: the product has two listings in total.** The consequence is concrete and
  binds every later slice: `/listings` renders **no pagination control at all**, so no route probe can assert pagination.
  Task 775 deleted its pagination interaction for exactly this reason (`95c3ba570`, 21 lines removed from the probe) and
  its AC7 now records the state as *neither a pass nor a defect finding*. **Pagination's only proof surface in this sprint
  is Storybook.** A slice needing pagination evidence must either seed the database first and say so, or prove it in a
  story — never silently probe the route and read an absent control as a pass. A zero-result page remains an insufficient
  measurement surface for a chrome change: the page gutter must contain content.
- The four locales `sq` · `en` · `uk` · `it` all resolve on `/listings`.
- Storybook builds (`npm run build-storybook`). ⚠️ **Corrected 2026-09-01 by owner decision D68-2 (below) — the
  original text also required `npm run screenshots:assert -- --mantine-only` to be "green **before** the first slice
  edits anything. A gate already red at baseline blocks the slice; it is not repaired inside it." That precondition
  was unsatisfiable and is superseded.** Task 777 measured the identical `1241/1348 PASS, 80 FAIL, 27 AMBIGUOUS`
  already sitting in Task 775's own receipts, with all 107 failing cells traced to harness causes and **zero product
  defects**. Rendered acceptance for every remaining slice is therefore **differential**, per D68-2:
  1. capture a **clean pre-edit baseline B** before the slice's first edit, and never overwrite it;
  2. after the change, `P \ B = ∅` — no failure cell in P that is not already in B, compared as a set of normalized
     cell identities, not as a count;
  3. **every** new cell the slice adds must PASS;
  4. pre-existing global FAIL/AMBIGUOUS cells are **not** an automatic blocker and are **not** repaired inside the
     slice.
  A slice must still reconcile its arithmetic explicitly (`total(P) = total(B) + n`, `pass(P) = pass(B) + n`).

## Exit criteria

1. Every slice landed in this sprint carries its own pre-edit census, and a census that drifts is recorded as a
   design blocker rather than absorbed into scope.
2. Every production component this sprint migrates is imported by a canonical `Patterns/Mantine/*` story that renders
   the real component, and is enrolled in `scripts/mantine-migration-scope.json` in the same PR.
3. No slice in this sprint changes the filter URL contract, the SSR query, `listings_restore`, the favorites set, or
   the currency behavior. Any of those changing is a rejected diff, not a note.
4. No slice touches `ListingsSortBar` or `SaveSearchButton` while Task 772 is open.
5. Every later slice inherits **D775-A**, **D775-B** and whatever **D775-C** settles, rather than re-litigating
   them: layout in Mantine responsive props on this theme's breakpoints, visual values from TailAdmin through
   registered tokens. A slice that needs to depart from any of them states why and stops for an owner decision.

## Decisions

### Closed — binding on this sprint

| ID | Decision | Decided |
|---|---|---|
| **D775-C = C1** | The Mantine spacing scale gains two semantic keys, `2xl: '2rem'` and `3xl: '3rem'`, declared natively in the Mantine types through `MantineThemeSizesOverride`. A migrated surface then expresses its gutter as `md → xl → 2xl → 3xl` — Mantine tokens only, no raw values, no `design-tokens-allow:` markers, no Tailwind vars. C2 was rejected as a permanent exception inside a new Mantine surface, C3 as a return to the Tailwind token layer. | Owner, 2026-08-30 |
| **D775-A = A2** | The gutter uses **Mantine responsive props only**, with the top step at `xxl = 1440`. **1536 is not used anywhere** — neither a Mantine breakpoint nor a CSS-module media query. A1 and A3 were rejected because both carry a legacy Tailwind container or breakpoint into a new Mantine component. The resulting padding change across **1440–1535px** (`2rem → 3rem`) is an accepted migration outcome, not a regression. | Owner, 2026-08-30 (revised the same day, superseding A1) |
| **D775-B = B2** | Migrated breadcrumb chrome takes the measured TailAdmin contract: 14px, link gray-500, current gray-800, gap 6px, separator gray-400 — the only route that gives migrated chrome TailAdmin provenance. B1 was rejected because it preserves a legacy deviation inside a new Mantine component. | Owner, 2026-08-30 |
| **D68-2** | Rendered acceptance in this sprint is **differential**, never a global green exit code. Capture a clean pre-edit baseline **B**; after the change require `P \ B = ∅` and a PASS on every new cell; existing global FAIL/AMBIGUOUS cells are not an automatic blocker. Supersedes the Preconditions paragraph's global-green demand, corrected above in the same edit. Established while closing Task **777**, whose executor correctly refused to proceed against an unsatisfiable precondition. | Owner, 2026-09-01 |

Both bind every later slice in this sprint: a migrated `/listings` surface expresses layout in Mantine responsive
props on this theme's breakpoints — never a reproduced Tailwind container and never 1536 — and takes its visual
values from TailAdmin through registered theme tokens (**D27** — token, not hex).

They also give the sprint its token rule: a migrated surface consumes **Mantine tokens only**. A raw value, an
allowlist marker or a `--space-*` reference in a migrated file is a rejected diff, not a note.

Two accepted, temporary divergences follow and are **not** defects to fix inside this sprint. `/favorites` and the
listing detail page keep the legacy breadcrumb until their own migration. And because `HeaderView.tsx:114` and
`FooterView.tsx:69` still carry `.container-wide`, a migrated page's content column stops aligning with the site
chrome across **1440–1535px**, against `docs/design-system.md:155`. The owner accepted this explicitly and forbade
widening Task 775 to those files: *"лише виміряти й зафіксувати це в evidence."* It resolves when the header and
footer migrate — a candidate slice for this sprint, not a defect.

### Open

| ID | Decision | Owner | Blocks |
|---|---|---|---|
| **D68-1** | Task 772 lands first and the toolbar slices re-measure after it, **or** 772 is explicitly folded into this sprint. | Owner | sprint order, not 775 |
