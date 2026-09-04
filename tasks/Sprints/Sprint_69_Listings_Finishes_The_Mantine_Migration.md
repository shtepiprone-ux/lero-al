# Sprint 69 — `/listings` finishes the Mantine migration

**Opened:** 2026-09-03 · **Status:** 🟠 **OPEN** · **Landed tasks:** 1 · **Active tasks:** 3

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

Task 783 is a deliberately narrow post-migration correction within the existing Mantine `ListingsFilterBar`: its
Advanced filters count must use the already-canonical inline count pattern, not an overhanging `Indicator`. It does
not reopen the migration or add a sixth surface.

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
| **781** | `/listings` Mantine surface completion — status tabs, filter chips, action row and shell presentation, in four gated phases | **P2** | **Q3** | 🗄️ **ARCHIVED** (2026-09-03). Its committed migration remains historically `PARTIALLY VERIFIED` under D69-11; its session log records the evidence and the owner override. |
| **782** | Canonical Mantine dimension tokens, repo-wide raw-size sweep, and Task 781 review closure — five gated phases + revision round 1 | **P2** | **Q3** | 🟡 **IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW** for **F13 only**. The canonical mobile Filters counter revision is complete; owner visual review remains required. |
| **783** | Canonical inline counter for `ListingsFilterBar` Advanced filters | **P2** | **Q2** | 🟢 **APPROVED WITH NOTES — RE-ARCHIVED (2026-09-04).** F6 closed: the three boundary-block icons use `theme.other.iconSize.compact` (14px) via `FilterTriggerBoundaryStates` + `useMantineTheme()`, verified at source; zero Tailwind dimension utilities remain and the scoped detector independently reports 0. Owner's repeat visual pass satisfied by his acceptance of `Mantine/Primitives/CountButton` in Task 784's matrix (post-F6 state). All 8 gates exit 0 at F6; the two integrity gates are stale-but-statically-cleared (no BOM/NUL/mojibake in any changed file). P3 notes carried: T7 tautology, AC7 jsdom-unassertable. |
| **784** | Zero raw design dimensions in the current Mantine scope — canonical tokens/styles for manifest paths, `src/design-system/mantine/**`, and canonical Mantine stories | **P1** | **Q3** | 🟢 **APPROVED WITH NOTES** (2026-09-04). R1-R24 verified; owner accepted all six visual tuples. Final owner-native run post-D69-27 all exit 0 (scoped detector 0, typecheck, lint, check:stories, build-storybook, browser 35/35, `build`). Notes: P3 **D69-26** record pass (§18) + consumerless `favoriteAriaAdd`. D69-27 was reviewer-authored (§19). Archive on owner commit; `CountButton.stories.tsx` rides with 783. |

## Execution order

Order and gating only — read state from the Tasks table above.

1. **781** alone, executed in its own four internal phases (kickoff §7). The phases are ordered by blast
   radius, not by size: `ListingsStatusTabs` (§7.1) → `ActiveFilterChips` (§7.2) → the shared action row
   (§7.3, `ListingsSortBar` + `SaveSearchButton` + their row wrapper) → `ListingsShellView` presentation
   (§7.4). Phase 3 is one phase and not three because the two controls are siblings in one flex row whose
   collapse/occlusion interaction is exactly what a per-component proof cannot see — see the kickoff's §3.6
   measurement of Task 772's authenticated matrix.
2. **782** after 781 is committed. It establishes the token scale the sweep needs, sweeps all 129 raw
   `size={N}` sites repo-wide, adds the detector that keeps them converted, and closes every open finding from
   781's review. Owner decision **D69-7** made it one task rather than a `/listings`-scoped slice.
3. **783** starts only after the current Task 782 F13 diff is committed. It is a frontend-only corrective slice:
   use the existing canonical `MantineCountButton` in `ListingsFilterBar`, retain its URL contract, and visually
   inspect the real stories. It neither reopens 781 nor performs another migration inventory.
4. **784** starts only after the expanded detector and all prerequisite Sprint 69 changes are committed. It
   resolves only the manifest/design-system/canonical-story Mantine scope with existing canonical contracts,
   through an additive `--scope=mantine` detector mode. The global scan remains unchanged; legacy sources,
   including header/footer container migration, stay separate.

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
   **Recorded exception (D69-F8, owner-directed, Task 782, 2026-09-03):** `market_type` does **not** deselect
   on re-click (`ListingsFilters.tsx` `FilterChoiceGroup mode="single"` without `allowDeselect`), matching
   `type`'s existing contract; `property_type` keeps `allowDeselect` (its original contract already toggled
   off). This is an intentional owner decision (Task 781R, 2026-09-03), not a regression — see
   `ListingsFilters.tsx:25-39` for the full rationale. RTL coverage: `filterLeafComponents.smoke.test.tsx`.
4. Every retained route probe whose locator this migration invalidates is either **retargeted and re-run**, or
   **explicitly retired with the reason recorded**. A probe left in the tree with a locator that can no longer
   match is a rejected diff — a `locator()` matching zero nodes must fail closed, never read as a pass.
5. Every slice carries its own pre-edit census, and a census that drifts is recorded as a design blocker rather
   than absorbed into scope.
6. `D775-A`, `D775-B`, `D775-C` and `D68-2` bind this sprint verbatim. A slice that needs to depart from any of
   them states why and stops for an owner decision.
7. `/listings` may be called "Mantine migrated" only when all five surfaces are done — not when one overflow,
   one control or one story is green.
8. Sprint 69's current-Mantine design-token work is complete only when the tested `--scope=mantine` strict mode
   is green with no raw finding or suppression (Task 784). The global scan and legacy header/footer container
   migration remain separate.

## Decisions

### Closed — binding on this sprint

| ID | Decision | Decided |
|---|---|---|
| **D69-1** | This work is **one task with four internal phases**, not four tasks. Owner instruction, 2026-09-03, when offered the four-task and two-task alternatives: *"Одна задача, 4 фази всередині"*. Each phase still carries its own census, its own canonical story and its own acceptance criteria; the phases share one number, one PR and one review. | Owner, 2026-09-03 |
| **D69-2** | The work lives in a **new sprint**, and **Sprint 66 is closed and archived**. Owner instruction, 2026-09-03: *"хоча, давай створюй окремий Sprint, а Sprint 66 закривай та архівуй"*. This supersedes the same session's earlier "Sprint 66" placement answer. | Owner, 2026-09-03 |
| **D69-3** | **No review ledger** for this task. Owner instruction, 2026-09-03: *"Ledger для цієї задачі не створюй, він не потрібен тут, бо це проста front-end задача"*, which matches the standing frontend exception already recorded in `docs/agent-contract.md` clause 9a and `docs/orchestrator-role.md` → Review. Evidence is the session log, the component diff, the required gate transcripts and the rendered QA. `docs/reviews/*.review-ledger.json` **must not** be created for 781. | Owner, 2026-09-03 |
| **D69-4** | `ActiveFilterChips` migrates onto **themed Mantine `Button` composition**, not Mantine `Pill`. The owner's plan authorizes either (*"Mantine `Pill` або Mantine button composition"*); a multi-route task is forbidden, so one is chosen here. Measured basis: `theme.ts:274` already carries a TailAdmin-traced `Button` entry, while `theme.ts` has **no** `Pill` and **no** `Chip` entry, `src/` contains no `Pill`/`Chip` consumer, and no `Mantine/Primitives/Pill` story exists — `Pill` would require creating a canonical primitive, a theme entry and a story for one consumer. The chip is also a real `<button>` today; `Button` preserves its focus, keyboard and `aria-label` semantics, which `Pill`'s remove affordance does not. | Orchestrator under the owner's plan, 2026-09-03 |
| **D69-6** | **Every hardcoded design value becomes a canonical Mantine token.** Owner, 2026-09-03: *«всі хардкодні місця мають бути замінені канонічними токенами Mantine!»* Bounded by measurement, not by slogan: a `={0}`, a flex ratio and behavioral CSS with no dimension are **not** design values and stay as they are (Task 782 §3.2). | Owner, 2026-09-03 |
| **D69-7** | The raw-size sweep is **repo-wide in one task** (129 occurrences / 42 files), not a `/listings` slice. Owner, 2026-09-03: *«Увесь репозиторій в одній задачі»* — chosen over the `/listings`-only and scale-only alternatives. | Owner, 2026-09-03 |
| **D69-8** | `miw={{ sm: 192 }}` on "Показати ще" is **removed**, not tokenized: 192px has no provenance beyond the Tailwind class `min-w-48` and no scale reaches it. The content-based desktop width is an accepted recorded delta (Δ6). | Owner, 2026-09-03 |
| **D69-9** | Every Task 781 review finding closes **inside Task 782**. Owner, 2026-09-03: *«в цю задачу ти маєш внести всі проблеми з твого рев'ю, щоб їх закрити однією задачею»* | Owner, 2026-09-03 |
| **D69-10** | Task 781's rendered matrix is **owner-waived**: *«screenshot:assert я не запускав, бо вона наразі не потрібна. Я візуально все переглянув, мені підходить»* (2026-09-03), which is the D69-5 visual acceptance being exercised. **The waiver is task-scoped and does not carry into 782**, which changes theme-level contracts across admin, cabinet, auth and site chrome that the owner did not review. | Owner, 2026-09-03 |
| **D69-11** | **Owner override, 2026-09-03 — Task 781 is committed at `PARTIALLY VERIFIED`.** Owner: *«я комічу Task 781 як є»*. This overrides the fail-closed rule in `docs/orchestrator-procedures.md` → Approval-closure gate, which otherwise forbids a commit handoff for a non-approved decision. **What the override does and does not cover:** it authorizes the **commit only**. No `git push` is authorized — a push remains gated on an `APPROVED` / `APPROVED WITH NOTES` verdict, and none was issued. The twelve findings stay open and are Task **782**'s scope (D69-9); committing does not close them, and 781 is **not** archived. The reason the owner chose this over starting 782 on a dirty tree: D68-2's baseline **B** cannot be clean while 781's diff is uncommitted, and a dirty-worktree manifest for 34 entries costs more than it proves. | Owner, 2026-09-03 |
| **D69-12** | **Owner triage of Task 782's 145 FAIL visual-matrix cells (2026-09-03).** All accepted as non-defects: 64 = Cloudflare Turnstile (`CaptchaWidget`) keeping `networkidle` from settling on the 4 AuthSheet stories that render it — correlation exact 6/6 against the 2 captcha-free ones; 65 = the mobile «Filters» trigger's deliberate `flex="1 1 auto"` row (781R), owner: *«Візуально все добре»*; 16 = `AuthSheet.stories.tsx`'s own disabled decoy button, not production UI. Triage artifact: `.screenshots/rendered-assert/2026-09-03T17-44/triage-fail-ambiguous.html`. **Consequence to plan for:** the 64 Turnstile timeouts will recur on every future full run until the harness stops waiting for `networkidle` on captcha stories — unfiled, owner not yet asked. | Owner, 2026-09-03 |
| **D69-13** | **The `Badge circle` counter defect is folded into Task 782's revision rather than a separate task**, overriding 782 §8's bar on reopening 781 components. Owner, 2026-09-03: *«Counter схоже захардкоджений… Це треба виправити»* → «Додати в ревізію 782». Scope is exactly `ListingsSortBar.tsx`'s counter plus its stale doc comment and test title; no other 781 component reopens. Tracked as F13/R16/AC16. | Owner, 2026-09-03 |
| **D69-14** | **`ListingsFilterBar` has the same, distinct `Indicator` counter defect and is Task 783, not a reopening of 782.** Owner, 2026-09-03, supplied the observed `Patterns/Mantine/ListingsFilterBar` mobile story and directed a separate, narrow frontend task in Sprint 69. The solution must consume the pre-existing canonical `MantineCountButton`; no new primitive, theme contract, filter semantics or screenshot-harness work is authorized. | Owner, 2026-09-03 |
| **D69-15** | **Task 784 closes only current-Mantine findings through existing canonical Mantine tokens/styles.** Its exact scope is `mantine-migration-scope.json` + `src/design-system/mantine/**` + canonical Mantine story roots, selected by an additive tested `--scope=mantine` mode. Owner, 2026-09-04: no hardcoded consumer value in the task design or implementation; no allowlist, inline suppression, detector weakening, local numeric alias, or raw fallback is authorized. Global detector behavior and every legacy source, including header/footer container migration, remain separate. A missing canonical contract is a fail-closed owner decision, never a new literal. | Owner, 2026-09-04 |
| **D775-A** *(inherited)* | Layout uses **Mantine responsive props only**, top step at `xxl = 1440`. **1536 is used nowhere** — not a Mantine breakpoint, not a CSS-module media query. | Owner, 2026-08-30 |
| **D775-B** *(inherited)* | Migrated chrome takes the measured **TailAdmin** contract rather than preserving a legacy deviation inside a new Mantine component. A resulting visual delta is an accepted migration outcome to be **recorded**, not a regression — and not a licence to invent a value. | Owner, 2026-08-30 |
| **D775-C** *(inherited)* | A migrated surface consumes **Mantine tokens only**. A raw value, a `design-tokens-allow:` marker or a `--space-*` reference in a migrated file is a rejected diff, not a note. The spacing scale's `2xl: '2rem'` / `3xl: '3rem'` keys are native Mantine types. | Owner, 2026-08-30 |
| **D68-2** *(inherited)* | Rendered acceptance is **differential**: capture a clean pre-edit baseline **B**, then require `P \ B = ∅` compared as a set of normalized cell identities (not counts) and a PASS on every new cell. Pre-existing global FAIL/AMBIGUOUS cells are not an automatic blocker and are not repaired inside the slice. Arithmetic must be reconciled explicitly. | Owner, 2026-09-01 |

### Open

| ID | Decision | Owner | Blocks |
|---|---|---|---|
| **D69-5** | ✅ **CLOSED 2026-09-03** — exercised as D69-10: the owner reviewed the migrated surfaces visually and accepted them. Δ1–Δ3 stand as accepted; the two deltas the executor did not enumerate (Δ4 chip height, Δ5 empty-state padding) were caught at review and are Task 782 AC9. | Owner | nothing |
