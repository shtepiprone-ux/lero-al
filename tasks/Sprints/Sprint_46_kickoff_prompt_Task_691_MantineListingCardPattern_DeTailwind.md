# Task 691 — De-Tailwind `MantineListingCardPattern` (Sprint 46.4)

**Kickoff path:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md`
**Sprint:** 46 — ListingCard de-Tailwind + overlay exit, order **46.4**
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`
**Supersedes:** `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md` (draft 1, 2026-08-01)
**Filed:** 2026-08-11, after D36 unblocked the task

---

## 0. Draft 1 is superseded — what changed and why

Draft 1 was written **2026-08-01**, before 702 landed and before six binding decisions existed. It was re-measured
against the tree at `HEAD` on 2026-08-11. **Do not execute draft 1**; it contains three unsatisfiable acceptance
criteria and describes a contract that does not exist.

| # | Draft-1 claim | Measured 2026-08-11 |
|---:|---|---|
| **A1** | §3.4 contract 1: *"Card root class · producer `ListingCard.tsx:201/:297` · consumer pattern `className` prop → `cn(...)` at `:162`/`:290`"* | **Wrong in both directions.** `ListingCard.tsx` renders the pattern at `:208`/`:304` and passes **no** `className`; the marker string is on the wrapping `<Link>`, now `:203`/`:299` (702 moved it). And the pattern's `className?: string` at `:40` is **never read** — `cn()` at `:162`/`:290` does not receive it, no consumer passes it, and the only other `className` hits in the file are comments plus `:315 overlay.className` (which is 741's `CLOSED_OVERLAY_STYLE`). **It is dead API surface.** 702's §3.10 flagged half of this; the full measurement is here. |
| **A2** | §3.4 contract 2: `shrink-0 -mt-0.5 -mr-1` at `ListingCard.tsx:166` must survive byte-identical | **That string no longer exists.** 702 replaced it with `className={styles.inlineFavorite}` at `:168`. The pattern's JSDoc at `:73` still quotes it as a contract — a stale comment, not a live coupling. |
| **A3** | *"Changing any of them belongs to Task 702"* | 702 **landed** (`0dac78755`). Contract 3 (`CLOSED_OVERLAY_STYLE`) is **741**'s, and 741 is blocked on this task. |
| **A4** | *"25 className sites (28 minus the 3 contracts)"* | **27 code sites.** `grep -c "className="` returns 28, but `:73` is inside a JSDoc block — the same grep artifact 702 §3.2 hit. Re-derive the dispositions against 27. |
| **A5** | AC3: *"the rendered run shows **0 FAIL**"* | Unsatisfiable. `--mantine-only` yields **18 FAIL** on this tree (the standing comparator). The correct criterion is a **set** identity, `0 added / 0 removed` — the 739/740 lesson, restated by D37. |
| **A6** | AC5: *"`npm run build` exit 0 with the full **54-row** route table"* | The current build emits **53** route rows and `40/40` static pages. |
| **A7** | AC6: *"`docs/backlog.md` at **exactly 80 lines**"* | It is 80 today, after a consolidation this task did not do. Pinning an exact number makes an unrelated edit fail this task; the rule is **≤80, and do not absorb someone else's breach**. |
| **A8** | Zero mentions of **D28 · D33 · D34 · D35 · D36 · D37** | All six post-date draft 1 and all six bind this task. §3.7 and §10 carry them now. **D34 poses a genuine open question draft 1 could not have asked** (§3.6). |
| **A9** | No `check:css-vars` | Task 700's gate is now **CI-blocking**, and **691 is the first task that can break it** (§3.8). |

---

## 1. Mode and task type

Implementation task. Type: **UI / Component — current Mantine path**, D28 de-hybrid migration.

**D28 binds: mechanism-only, zero visual delta.** No restyle, no token change, no spacing or typography change.
**D35 binds** the overlay chips (§3.5). **D36 binds** the perf condition (§3.9). **D34's applicability is the one
open question** and §3.6 tells you how to settle it.

---

## 2. Objective

Move the Tailwind out of `MantineListingCardPattern.tsx`'s **27** `className=` code sites into the **existing**
`MantineListingCardPattern.module.css`, so the last Tailwind in the homepage grids' card layer is gone and both
card variants render byte-identically.

The three marker tokens on the wrapping `<Link>` are **not this file's** — they live in `ListingCard.tsx` and 702
already closed that file. This task must leave `ListingCard.tsx` untouched.

---

## 3. Verified context

Measured **2026-08-11** against `HEAD`. `MantineListingCardPattern.tsx` is **397** lines;
`MantineListingCardPattern.module.css` is **82**. **Re-derive every figure before writing code** (§10.1) — draft 1's
numbers were right when written and four of them are now wrong, which is the point.

### 3.1 The 27 sites — and why the grep says 28

`grep -c "className=" ` → **28**. One is prose: `:73`, inside the JSDoc block at `:71-74`, quoting
`className="shrink-0 -mt-0.5 -mr-1"` as a contract that **702 already dissolved** (A2). **27 code sites**, at
`:162 · 172 · 178 · 188 · 189 · 195 · 205 · 210 · 229 · 235 · 268 · 270 · 271 · 272 · 290 · 298 · 302 · 312 · 313 ·
323 · 324 · 338 · 342 · 343 · 348 · 372 · 375`.

Re-derive the A–F disposition groups from draft 1 §3.5 against **these 27**, and state any site whose group changed.

### 3.2 The `className` prop is dead — measured, and it is 741's decision, not this task's

`className?: string` is declared at `:40` and read **nowhere**. No consumer passes it: `ListingCard.tsx:208/:304`
(no prop), `ListingCardPattern.stories.tsx:124` (no prop), `MantineListingCardPattern.smoke.test.tsx:56`
(`{...props}`, and the test does not set it).

**Do not remove it.** Deleting public API is an interface change outside a mechanism-only migration, and **741** was
split out precisely to decide whether the pattern keeps accepting arbitrary class strings. **Record the measurement
in the completion report so 741 inherits it** — 741's premise ("whether the pattern keeps accepting arbitrary class
strings") is now answerable: nothing passes one today.

### 3.3 What must not change — the real cross-file couplings

| Coupling | Where | Why it survives |
|---|---|---|
| `.listing-card` marker tokens | `ListingCard.tsx:203`/`:299` — **not this file** | 4 anchor rows in `check-stories-rendered.mjs:173-175,181` + the `check-homepage-grid.mjs:204` locator. `ListingCard.tsx` is out of scope; md5 it. |
| `.grayscale.opacity-60` | this file, `:294` (`isArchived &&`) | `ListingCard.smoke.test.tsx:169`/`:253` assert it through the pattern. **If you move it into the module, those two assertions break** — they query `.grayscale.opacity-60` by class. D33 says re-anchor onto a de-Tailwind-stable hook; doing so means editing a test 702 left untouched. **Decide explicitly and report it.** |
| `overlay.className` | `:315` | 741's `CLOSED_OVERLAY_STYLE`. Pass-through only — do not touch. |

### 3.4 Story coverage and the comparator — measured from the last run

Two stories render this component in the `--mantine-only` matrix, **32 cells total**:
`patterns-mantine-listingcardpattern--default` (**16**) and `mantine-primitives-listingcard--default` (**16**),
counted from `.screenshots/rendered-assert/2026-08-11T08-46/manifest.json`. `ListingDetailPattern` (20 cells) does
**not** render this component.

**The comparator is `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS` with a fixed fail set** — Task 733's standing baseline,
re-confirmed twice on 2026-08-10 and 2026-08-11. Compare as a **set**, never as a total.

Note: `scripts/mantine-migration-scope.json` enrols `ListingCard.tsx` and **not** this pattern file, so
`check:story-coverage` does not cover it directly. Do **not** add an enrolment — that is a governance change, not
part of a mechanism migration.

### 3.5 The six overlay utilities — D35 territory, handle with care

`:188` (`bg-overlay/60` + `text-overlay-foreground`), `:312` (`bg-overlay/30`), `:314`
(`text-overlay-foreground`), `:323` (`bg-overlay/60` + `text-overlay-foreground`) — **6 utilities, matching 695's
census exactly.**

`bg-overlay/60` and `/30` are **opacity-modifier utilities**, the family **D35** (2026-08-10, owner) was written
about: a `@theme inline` value feeding an opacity-modifier static fallback may not be aliased to a runtime `var()`,
because Tailwind composites the fallback statically and the alias collapses it. **Read each one's compiled output
out of `.next/static/css` and reproduce that**, exactly as 702 did — do not hand-write a `color-mix()` you assume is
equivalent. If the compiled form cannot be reproduced without changing the rendered value, **stop and report**;
695 owns the overlay exit condition and can absorb it.

### 3.6 D34 — the open question, and how to settle it

The module is **unlayered**, deliberately: its header (`:7`, `:34`) explains that Mantine's own CSS is unlayered and
always beats `@layer utilities`, so a Tailwind utility could never win — the cascade-trap case. Both `@layer`
occurrences in the file are **comments**, not rules.

**D34 distinguishes by intent: a migration reproduces the utility's cascade standing (layer it); a cascade-trap fix
overrides a dead utility (leave it unlayered).** This task is a migration into a file that exists because of a
cascade-trap fix — draft 1 could not ask this because D34 postdates it.

**Settle it per site, not per file, and by measurement:** for each declaration you move, determine whether the
Tailwind utility it replaces was *actually winning* today. If it was winning, reproducing it in an unlayered rule
changes nothing. If it was losing to Mantine, the utility was already dead and moving it into an unlayered rule
would **make it win** — a visual change, forbidden by D28. **A site in the second category must be reported, not
"fixed".** Precedents to read: `HeroSearchView.module.css:40-60` (709-R, layered) and this file's own header
(602, unlayered).

### 3.7 What now protects this change

`check:homepage-grid` (701) · the D26 rendered matrix (§14.11) · `check:design-tokens` strict ·
**`check:css-vars` (700, new and CI-blocking)** · `check:stories` · `ListingCard.smoke.test.tsx` ·
`MantineListingCardPattern.smoke.test.tsx`.

### 3.8 691 is the first task that can break `check:css-vars`

Measured: `--color-badge-premium` and `--shadow-listing-card-elevation-lg` appear **zero** times in Tailwind's own
bundle and **once each** in the CSS-Modules chunk — they are kept alive **solely** by `var()` references inside
**this module**. Their only source reference is `MantineListingCardPattern.module.css`.

If a rewrite drops or renames either reference, the token leaves the shipped bundle. `check:css-vars` will catch a
reference that outlives its declaration; it will **not** catch a token that quietly stops shipping because its last
consumer vanished — that gap is **743**. So: **run `check:css-vars` before and after, and additionally report
whether those two tokens are still referenced.**

### 3.9 D36 — the perf condition is binding

**Owner decision 2026-08-10:** 691 runs under a **no-increase** condition on `/[locale]` First Load JS. Record it at
I0 and at the end; **stop the task on any increase**. **Re-measure at I0 — do not copy a number from any document.**
For orientation only: the build at `0dac78755` measured route **619 kB** and shared **184 kB**. The long-quoted
"618 vs 185 kB baseline" is wrong twice, and route First Load JS is **not** comparable to shared JS at all (D36).
The unattributed **435 kB** remainder is **744**'s subject, not a target for this task.

### 3.10 Start state

Tree clean at `HEAD`; `docs/backlog.md` is **80** lines after the 2026-08-11 consolidation.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D28 | All **27** code sites carry no Tailwind utility except those explicitly justified by group; new styling lands in the **existing** module | P0 | AC1 | Confirmed |
| R2 | D28 | Zero visual delta — every migrated declaration reproduces its utility's compiled output | P0 | AC2 | Confirmed |
| R3 | §3.3 | `ListingCard.tsx` **unchanged** (md5); `.grayscale.opacity-60` assertions still pass or their re-anchor is reported; `overlay.className` untouched | P0 | AC3 | Confirmed |
| R4 | §3.5, D35 | The 6 overlay utilities reproduce their **compiled** output; any irreproducible one is reported, not approximated | P0 | AC4 | Confirmed |
| R5 | §3.6, D34 | Each moved declaration's layer disposition is decided **by measurement**; any utility that was losing today is reported, never silently promoted | P0 | AC5 | Confirmed |
| R6 | §3.4 | Rendered matrix: fail set **byte-identical** to the standing comparator — `0 added, 0 removed` | P0 | AC6 | Confirmed |
| R7 | §3.7 | `check:homepage-grid`, `check:css-vars`, `check:design-tokens`, `check:stories`, both smoke tests unchanged | P0 | AC7 | Confirmed |
| R8 | §3.8 | `--color-badge-premium` and `--shadow-listing-card-elevation-lg` still referenced from this module, or their loss is reported | P0 | AC8 | Confirmed |
| R9 | §3.9, D36 | `/[locale]` First Load JS recorded at I0 and final; **any increase stops the task** | P0 | AC9 | Confirmed |
| R10 | §3.2 | The dead `className` prop is **left in place**, and the measurement is reported for 741 | P1 | AC10 | Confirmed |
| R11 | Standing | `npm run build` exit 0; `typecheck` exit 0 | P0 | AC11 | Confirmed |
| R12 | Backlog rules | Concise `docs/backlog.md` update (**≤80 lines**) + session log | P1 | AC12 | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** `ListingDetailPattern` shares no code with this file — its 20 cells are not a comparator for this task.
- **A2.** D37 governs any single-cell fail-set drift: a re-run that returns the comparator closes the criterion on
  **that** run's result, and the anomalous artifact is preserved as `UNATTRIBUTED`. **Budget for the possibility**;
  the capture-validity gap behind it is **745** and is not this task's to fix. Measured incidence: 0 · 2 · 0
  fallback-font captures per 1204 across the three runs of 2026-08-10/11.
- **OQ1 — D34 per-site disposition (§3.6)** is genuinely open and is resolved **by measurement during execution**,
  not by an owner decision. If a site's measurement is ambiguous, report it and leave that site alone.

---

## 6. Pre-read rule bundle

Always Required: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` — **scan and confirm explicitly**; unlike 700/742 this task touches a listing
surface, so check the "Listing card rendering — Mantine pattern is the COMPLETE single source of truth" row.

UI / Current Mantine path: `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/ui-rules.md` (routing/boundary only) · `docs/qa-rules.md` ·
`docs/storybook-governance.md` §14.9.2 (**what `--mantine-only` does not run**) and §14.11 (D26).

Task-specific, required:

- `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` — all 397 lines.
- `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` — all 82, **including the header**.
- `src/modules/listings/components/ListingCard.tsx` `:203`, `:299`, `:208`, `:304` — to confirm §3.2/§3.3 yourself.
- `tasks/Sprints/Sprint_46_kickoff_prompt_Task_702_ListingCard_DeTailwind.md` §0.2 and §3.4/§3.5 — the compiled-output
  discipline and the three defects that document trail cost.
- `src/components/shared/HeroSearchView.module.css:40-60` — D34's layered precedent.
- The superseded `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md` §3.5 — the A–F group
  dispositions, **as input to re-derive, not as fact**.

---

## 7. Scope

| Path | Action |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | **modify** — the 27 sites |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | **modify** — extend the existing module |
| `docs/backlog.md` | **modify** — concise state, ≤80 lines |
| `docs/sessions/2026-08-11-task691-mantinelistingcardpattern-detailwind.md` | **create** — session log |

Any other path is out of scope. If the `.grayscale.opacity-60` decision (§3.3) requires touching
`ListingCard.smoke.test.tsx`, **stop and report** — that is a scope extension the reviewer must authorize.

---

## 8. Out of scope

- **`ListingCard.tsx`** — 702 closed it. md5 it at I0 and at the end.
- **`CLOSED_OVERLAY_STYLE` / `overlay.className`** — 741.
- **Removing the dead `className` prop** — 741 (§3.2).
- The `@theme inline` overlay copy and the `--color-overlay*` namespace — **695**.
- `mantine-migration-scope.json`, any story, any viewport, any `MANTINE_STORY_EXTRA_VIEWPORTS` entry.
- The 435 kB attribution (**744**) and the capture-validity guard (**745**).
- Backlog consolidation — it is at 80; **do not absorb an unrelated breach if one appears**.

---

## 9. Current and required behavior

**Current.** The pattern mixes Mantine props with 27 Tailwind `className` sites, six of them opacity-modifier
overlay utilities. Its module exists as a cascade-trap fix and is unlayered by design. It is the last Tailwind in
the homepage grids' card layer now that 702 has landed.

**Required.** The 27 sites carry no unjustified Tailwind; declarations reproduce their utilities' compiled output;
the rendered matrix and `check:homepage-grid` are unchanged; both smoke tests pass; `/[locale]` First Load JS has
not increased.

---

## 10. Implementation requirements

1. **Re-derive §3.1–§3.5 and §3.8 first**, from the file and from `.next/static/css` after a build. **If anything
   disagrees with this document, the tree wins** — record the discrepancy. Draft 1's numbers were correct on
   2026-08-01 and four are wrong today.
2. **Capture the comparators before editing:** I0 md5 of `ListingCard.tsx` and both smoke tests; the I0
   `/[locale]` First Load JS (R9); a `--mantine-only` baseline is **not** needed — §3.4's standing comparator is the
   baseline, and a second full run is the expensive way to learn what is already known.
3. **Per-site disposition table before any edit** — all 27, each with its group, its compiled output, and its D34
   layer decision (§3.6). This is the artifact the review will read first.
4. **Reproduce compiled output, never intent.** Especially the six overlay utilities (§3.5).
5. **Do not** add `!important`, raise specificity to win, touch `cn()`, or alter the `className` prop.
6. **Stop conditions — report, do not route around:** an overlay utility whose compiled form you cannot reproduce;
   a site that was losing to Mantine (§3.6); a First Load JS increase (§3.9); a `.grayscale.opacity-60` re-anchor
   that needs a test edit (§3.3).

---

## 11. Positive and negative flows

**Positive.** A listing renders vertically in the homepage grid and horizontally in the list view; both compute
identically to the pre-task capture; the grid gates and both smoke tests stay green.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation · Authorization/RLS · Offline · Concurrent writer | **No** | Presentation-only; no form, route, table or data model | N/A | — |
| **Premium card** | **Yes** | `isPremium && styles.premium`, `:164`/`:292` | Border/shadow unchanged | Rendered matrix |
| **Archived listing** | **Yes** | `isArchived && 'grayscale opacity-60'`, `:294` | Class still present **or** re-anchor reported | `ListingCard.smoke.test.tsx:169,253` |
| **Closed listing overlay** | **Yes** | `:312-315` | Renders exactly as today; `overlay.className` untouched | Rendered matrix + md5 |
| **No cover image** | **Yes** | image section `:172`/`:298` | Fallback unchanged | Rendered matrix |
| **List vs card layout** | **Yes** | `layout='list'` branch `:162-280` vs card `:290-380` | Both variants byte-identical | 32 cells, both stories |
| **Cascade collision** | **Yes** | §3.6, D34 | No utility that was losing today starts winning | Per-site disposition table |
| **Token loses its last consumer** | **Yes** | §3.8 | Both tokens still referenced, or the loss reported | AC8 |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final file, *then* the 27 code sites carry no Tailwind utility beyond those the
  disposition table justifies by group, and every new declaration is in the existing module.
- **AC2 [R2]** — *Given* the disposition table, *then* every migrated declaration quotes the compiled output it
  reproduces, read from `.next/static/css`.
- **AC3 [R3]** — *Given* the final `git status --porcelain` and md5 witnesses, *then* `ListingCard.tsx` and
  `MantineListingCardPattern.smoke.test.tsx` are unchanged; `ListingCard.smoke.test.tsx` is unchanged **or** its
  re-anchor was reported and authorized; `overlay.className` at `:315` is untouched.
- **AC4 [R4]** — *Given* the six overlay utilities, *then* each reproduces its compiled output, or is reported
  irreproducible and left in place.
- **AC5 [R5]** — *Given* the disposition table, *then* every moved declaration carries a layer decision with the
  measurement behind it, and any "was losing today" site is listed and untouched.
- **AC6 [R6]** — *Given* one `--mantine-only` run, *then* the fail set is byte-identical to the standing comparator
  — **0 added, 0 removed**, shown as a set. A single-cell drift is adjudicated under **D37**: one authorized re-run,
  judged on that run's result, first artifact kept `UNATTRIBUTED`.
- **AC7 [R7]** — `check:homepage-grid` matches its pre-task result; `check:css-vars` exits 0; `check:design-tokens`
  per-file before/after quoted; `check:stories` 0/127; both smoke tests pass.
- **AC8 [R8]** — *Given* the final module, *then* `--color-badge-premium` and `--shadow-listing-card-elevation-lg`
  are still referenced, or their removal is reported with the consequence stated.
- **AC9 [R9]** — `/[locale]` First Load JS quoted at I0 and final. **Any increase ends the task as
  `PARTIALLY IMPLEMENTED`**, not as a note.
- **AC10 [R10]** — the report states that `className?: string` at `:40` is dead, names the four consumers checked,
  and flags it for 741.
- **AC11 [R11]** — `npm run build` exit 0 (**53** route rows, `40/40` static pages — re-measure and quote what you
  see); `typecheck` exit 0.
- **AC12 [R12]** — `docs/backlog.md` updated concisely and **≤80 lines**; session log at the §7 path.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`.** Card chrome and typography are in scope on a surface rendered by two enrolled
stories and both homepage grids. The comparator is the `--mantine-only` matrix under **D26** plus
`check:homepage-grid` as an independent structural check. TailAdmin side-by-side evidence is required for any
chrome value written (agent-contract clause 16).

**Not Q4** — no gate is authored. **The critical-flow row "Listing card rendering — Mantine pattern is the COMPLETE
single source of truth" names this file**: confirm explicitly whether a mechanism-only CSS move affects its governed
behavior, and say so either way.

### 13.2 Commands — record the actual result of each

1. `git --no-optional-locks status --porcelain` at I0; `git show HEAD:docs/backlog.md | wc -l` before any edit.
2. `npm run build` **before** editing — for the compiled CSS (§10.1) **and** the I0 `/[locale]` First Load JS (R9).
3. md5 at I0 and final: `ListingCard.tsx`, `ListingCard.smoke.test.tsx`, `MantineListingCardPattern.smoke.test.tsx`.
4. The per-site disposition table (§10.3) — persist it.
5. `npm run build-storybook`, then **one** `npm run screenshots:assert -- --mantine-only`. Compare as a **set**
   against the standing comparator. Budget ~2.5 h.
6. `npm run check:homepage-grid` · `check:css-vars` · `check:design-tokens` · `check:stories` · `check:mojibake` ·
   `check:file-integrity` — each before and after.
7. `npx vitest run` on both smoke tests, then the full suite. **Known, not a regression:** the full-run-only timeout
   class — its membership is **not stable between runs** (702 saw four files, 700 saw two, 742 saw none). Report the
   run you observed and re-run any member in isolation.
8. `npm run typecheck` — exit 0.
9. `npm run build` (final) — exit 0; quote the route table and the final `/[locale]` First Load JS.

Any of these that cannot run in your environment is a **`PARTIALLY IMPLEMENTED`**, not a pass.

---

## 14. Completion report contract

Report as `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approve.

1. Changed files, reconciled against the **actual final** `git status --porcelain`.
2. Requirement IDs completed; any not completed, with why.
3. Every §13.2 command with its **actual** result.
4. **The per-site disposition table for all 27 sites** — group, compiled output, layer decision, evidence.
5. The I0 vs final md5 table (§13.2.3).
6. `/[locale]` First Load JS at I0 and final, with the delta stated explicitly (R9/AC9).
7. The rendered set comparison — `0 added, 0 removed` — with the method, not just totals.
8. The §3.8 token check, and the §3.2 dead-prop measurement flagged for **741**.
9. Assumptions, deviations, limitations. **This kickoff's own facts are not exempt.** Draft 1 shipped nine wrong
   claims because it aged ten days; 700 took three drafts and 742 was downgraded post-review — in every case the
   defect was a *derived* claim about what another file does. The derived claims here are: that `:73` is the only
   comment-borne `className=`, that the `className` prop is read nowhere, that exactly six overlay utilities exist,
   that both §3.8 tokens have no other consumer, and that `ListingDetailPattern` shares no code. **Open each.**
10. Confirmation of the `docs/critical-flow-registry.md` row disposition (§13.1).

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every site, count, coupling and comparator is in §3 |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1–R12 → AC1–AC12 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, plus four explicit stop conditions in §10.6 |
| Comparator shown able to fail | **Yes** — the fail set is compared as a set with a fixed baseline re-confirmed twice; `check:homepage-grid` fails closed on a dropped marker; the per-site table makes a silent promotion visible |
| Pre-plant census / no further lifeline | **N/A** — no gate is authored. The equivalent is §3.8's last-consumer measurement, taken |
| No claimed command, file, value or behavior went uninspected | **Partial, stated.** Every §3 figure was measured today against `HEAD`. Five derived claims are named for re-check in §14.9. Draft 1 marked this "Yes" and carried nine defects |
| Owner-only exceptions traceable | **Yes** — D36 (2026-08-10) and D37 (2026-08-11) are quoted owner decisions; D28/D33/D34/D35 are cited with dates. No exception is invented here |
| Sprint assignment | **Yes** — Sprint 46, order 46.4, filed inside `tasks/Sprints/` (draft 1's root path is grandfathered and superseded) |
| Permanent Storybook creation gate | **N/A** — no story added, extended or probed; §8 forbids it |
| No number duplicated | **Yes** — 741 · 744 · 745 hold the deferred scopes; 695 owns the overlay exit |
| Dirty-worktree manifest | **Conditional** — clean at `HEAD`. If `git status` is not clean at I0, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry before editing |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`. Take the §13.2 step-1/2 baselines —
**including the I0 First Load JS, which is a stop condition, not a metric** — before touching anything. Build the
27-site disposition table before the first edit; it is what the review reads first. Treat §10.6's four stop
conditions as fences: each one ends the task with a report, not with a workaround.
