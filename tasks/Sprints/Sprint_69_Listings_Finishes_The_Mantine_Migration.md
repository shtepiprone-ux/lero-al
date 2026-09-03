# Sprint 69 — `/listings` finishes the Mantine migration

**Opened:** 2026-09-03 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0

> **Opened by owner instruction, 2026-09-03.** The owner asked for the remaining `/listings` Mantine
> migration to be filed as **one** task. The first placement instruction named **Sprint 66**; the same
> session then revised it to *"давай створюй окремий Sprint, а Sprint 66 закривай та архівуй"*. Sprint 66
> is therefore closed and archived in the same edit as this file, and this sprint carries the work.
> The 2026-08-01 owner rule forbids a kickoff without a sprint; this file, the kickoff, the Sprint 66
> closure, the archive rows and `docs/backlog.md`'s Sprints section + registry row were written in the
> **same edit**, per the 2026-08-10 fourth-occurrence corollary — a number is allocated in the registry in
> the same edit as its kickoff, or it is not allocated at all.

## Why not an existing sprint — checked before opening this one

| Sprint | Its goal | Fits 781? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | **No.** Different surface, and **D28** binds it to mechanism-only changes at zero visual delta. 781 changes rendered chrome on four components by design. Down to three retained follow-ups (743/744/745). |
| **55** | ARIA semantics no gate sees | **No.** Semantics, not primitive ownership. |
| **56** | Raw enum leaks and the blind detector | **No.** Localization/detector subject. (781 inherits 679's known Storybook `usePropertyTypes` fallback as a *recorded limitation*, not as scope.) |
| **57** | Delete what no longer earns its place | **No.** Pure removal. 781 must preserve every control it touches. |
| **61** | The projection layer no gate reads | **No.** Markdown/ledger projection, not UI. |
| **62** | Tailwind runtime tokens outlive Tailwind | **No.** Token-emission mechanism on the Homepage set. |
| **66** | `/listings` mobile overflow | **No — and it is closed.** Its Task 772 is `APPROVED` and archived, and its exit criterion 5 read *"No unrelated de-Tailwind, no component migration, and no change to `SaveSearchButton`…"* — the exact opposite of this sprint's goal. Closed and archived 2026-09-03 by the same owner instruction that opened this sprint. |
| **68** | `/listings` leaves Tailwind, one surface at a time | **No — by owner instruction, not by goal-fit.** Its goal does fit; the owner directed a separate sprint on 2026-09-03. 68's landed slices (775 · 776 · 777 · 778 · 779 · 780/780R) are complete and are **regression dependencies** of this sprint, not re-work. Its binding decisions **D775-A**, **D775-B**, **D775-C** and **D68-2** are inherited verbatim below. |

No open sprint fits under the owner's placement instruction. Opened 69.

## Goal

`/[locale]/listings` stops rendering any shadcn/Tailwind surface. The five remaining legacy surfaces —
`ListingsStatusTabs`, `ActiveFilterChips`, `ListingsSortBar`, `SaveSearchButton` and the presentation layer of
`ListingsShellView` — move to Mantine behind canonical `Patterns/Mantine/*` stories, with **zero** change to
the route's URL contract, data loading, restore, favorites or currency behavior.

The narrower point this sprint exists to prove: **a migration that changes the DOM also changes what the
route's own evidence tooling can see.** Sprint 66's Task 772 and Sprint 68's Task 775 both left retained route
probes whose locators are Tailwind- and shadcn-derived (`button.md\:hidden`, `[data-testid="combobox"]`,
`[data-slot="tabs-trigger"]`). Those locators are load-bearing evidence today and are **structurally dead**
after this migration. A slice that silently lets them go stale — or lets a `page.locator()` that now matches
zero nodes read as a pass — repeats the failure mode `docs/orchestrator-procedures.md` records under
"Detector-aware requirements and migrations". This sprint's transferable output is the probe-retargeting
discipline, not the component diff.

## Tasks

> **This table is the single state source for the sprint.** The execution-order section below is order and
> gating only; it carries no state.

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **781** | `/listings` Mantine surface completion — status tabs, filter chips, action row and shell presentation, in four gated phases | **P2** | **Q3** | 🟠 **KICKOFF FILED** 2026-09-03 — `Sprint_69_kickoff_prompt_Task_781_Listings_Mantine_Surface_Completion.md`. Not yet dispatched. |

## Execution order

Order and gating only — read state from the Tasks table above.

1. **781** alone, executed in its own four internal phases (kickoff §7). The phases are ordered by blast
   radius, not by size: `ListingsStatusTabs` (§7.1) → `ActiveFilterChips` (§7.2) → the shared action row
   (§7.3, `ListingsSortBar` + `SaveSearchButton` + their row wrapper) → `ListingsShellView` presentation
   (§7.4). Phase 3 is one phase and not three because the two controls are siblings in one flex row whose
   collapse/occlusion interaction is exactly what a per-component proof cannot see — see the kickoff's §3.6
   measurement of Task 772's authenticated matrix.
2. Nothing else is in this sprint. The route-level cutover inventory the owner's plan lists as step 5 is
   folded into 781's AC10, because after Phase 4 there is nothing left on the route for a separate task to
   inventory.

## Preconditions

- A routable server (`next start` against a production build, or `next dev`) and a database whose default,
  unfiltered `/listings` returns **`total > 0`**.
  ⚠️ **Inherited from Sprint 68, measured and corrected there — the product has two listings in total, so
  `/listings` renders no pagination control at all.** Pagination's only proof surface remains Storybook. A
  zero-result page is an insufficient measurement surface for anything in this sprint except the empty-state
  cell, which is reached by filtering, never by an unseeded database.
- The four locales `sq` · `en` · `uk` · `it` all resolve on `/listings`.
- Storybook builds (`npm run build-storybook`).
- **For the authenticated cells only:** `SaveSearchButton` is `dynamic(..., { ssr: false })` and renders only
  when `ListingsShell.tsx:186`'s `user` is truthy. Phase 3's action-row evidence therefore requires a valid
  Playwright storage state, exactly as Task 772's authenticated matrix did. Absent or invalid session →
  record `AUTH_STATE_UNAVAILABLE` and finish `BLOCKED` for AC7; the anonymous cells are measured regardless.
  **Confirm before dispatch, not at runtime.**
- Rendered acceptance is **differential** per the inherited **D68-2**, never a global green exit code.

## Exit criteria

1. No file in the `/[locale]/listings` client component graph imports `@/components/ui/*` (except the
   non-shadcn `@/components/ui/AppImage`, which is a project image component, not a legacy primitive) or
   `@/components/shared/Combobox`, and none carries a Tailwind utility string.
2. Every production component this sprint migrates is imported by a canonical `Patterns/Mantine/*` story that
   renders the **real** component, and is enrolled in `scripts/mantine-migration-scope.json` in the same PR.
   No demo analogue, no story landing ahead of its migration.
3. No slice changes the filter/sort/tab/page URL contract, the SSR query, `listings_restore`, the favorites
   set, the currency behavior, or `saveSavedSearch`'s server action, canonicalization, pending or toast
   branches. Any of those changing is a rejected diff, not a note.
4. Every retained route probe whose locator this migration invalidates is either **retargeted and re-run**, or
   **explicitly retired with the reason recorded**. A probe left in the tree with a locator that can no longer
   match is a rejected diff — a `locator()` matching zero nodes must fail closed, never read as a pass.
5. Every slice carries its own pre-edit census, and a census that drifts is recorded as a design blocker rather
   than absorbed into scope.
6. `D775-A`, `D775-B`, `D775-C` and `D68-2` bind this sprint verbatim. A slice that needs to depart from any of
   them states why and stops for an owner decision.
7. `/listings` may be called "Mantine migrated" only when all five surfaces are done — not when one overflow,
   one control or one story is green.

## Decisions

### Closed — binding on this sprint

| ID | Decision | Decided |
|---|---|---|
| **D69-1** | This work is **one task with four internal phases**, not four tasks. Owner instruction, 2026-09-03, when offered the four-task and two-task alternatives: *"Одна задача, 4 фази всередині"*. Each phase still carries its own census, its own canonical story and its own acceptance criteria; the phases share one number, one PR and one review. | Owner, 2026-09-03 |
| **D69-2** | The work lives in a **new sprint**, and **Sprint 66 is closed and archived**. Owner instruction, 2026-09-03: *"хоча, давай створюй окремий Sprint, а Sprint 66 закривай та архівуй"*. This supersedes the same session's earlier "Sprint 66" placement answer. | Owner, 2026-09-03 |
| **D69-3** | **No review ledger** for this task. Owner instruction, 2026-09-03: *"Ledger для цієї задачі не створюй, він не потрібен тут, бо це проста front-end задача"*, which matches the standing frontend exception already recorded in `docs/agent-contract.md` clause 9a and `docs/orchestrator-role.md` → Review. Evidence is the session log, the component diff, the required gate transcripts and the rendered QA. `docs/reviews/*.review-ledger.json` **must not** be created for 781. | Owner, 2026-09-03 |
| **D69-4** | `ActiveFilterChips` migrates onto **themed Mantine `Button` composition**, not Mantine `Pill`. The owner's plan authorizes either (*"Mantine `Pill` або Mantine button composition"*); a multi-route task is forbidden, so one is chosen here. Measured basis: `theme.ts:274` already carries a TailAdmin-traced `Button` entry, while `theme.ts` has **no** `Pill` and **no** `Chip` entry, `src/` contains no `Pill`/`Chip` consumer, and no `Mantine/Primitives/Pill` story exists — `Pill` would require creating a canonical primitive, a theme entry and a story for one consumer. The chip is also a real `<button>` today; `Button` preserves its focus, keyboard and `aria-label` semantics, which `Pill`'s remove affordance does not. | Orchestrator under the owner's plan, 2026-09-03 |
| **D775-A** *(inherited)* | Layout uses **Mantine responsive props only**, top step at `xxl = 1440`. **1536 is used nowhere** — not a Mantine breakpoint, not a CSS-module media query. | Owner, 2026-08-30 |
| **D775-B** *(inherited)* | Migrated chrome takes the measured **TailAdmin** contract rather than preserving a legacy deviation inside a new Mantine component. A resulting visual delta is an accepted migration outcome to be **recorded**, not a regression — and not a licence to invent a value. | Owner, 2026-08-30 |
| **D775-C** *(inherited)* | A migrated surface consumes **Mantine tokens only**. A raw value, a `design-tokens-allow:` marker or a `--space-*` reference in a migrated file is a rejected diff, not a note. The spacing scale's `2xl: '2rem'` / `3xl: '3rem'` keys are native Mantine types. | Owner, 2026-08-30 |
| **D68-2** *(inherited)* | Rendered acceptance is **differential**: capture a clean pre-edit baseline **B**, then require `P \ B = ∅` compared as a set of normalized cell identities (not counts) and a PASS on every new cell. Pre-existing global FAIL/AMBIGUOUS cells are not an automatic blocker and are not repaired inside the slice. Arithmetic must be reconciled explicitly. | Owner, 2026-09-01 |

### Open

| ID | Decision | Owner | Blocks |
|---|---|---|---|
| **D69-5** | `ActiveFilterChips` and `SaveSearchButton` both take TailAdmin/Mantine-theme values in place of their current legacy deviations (D775-B). The two known deltas are enumerated in the kickoff §11 and are **acceptance items, not defects** — but they are *visual* and need the owner's eye at review, exactly as Task 777's 32×32 pagination control did. | Owner, at review | nothing; 781 is dispatchable now |
