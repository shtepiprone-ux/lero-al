# Task 709-R — Restore site 8's cascade-layer standing: wrap `HeroSearchView.module.css` in `@layer utilities`

**Sprint:** 49 (`tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md`). **Epic:** MM Phase-2.
**Depends on:** Task 709 (`NEEDS REVISION`, reviewed 2026-08-05, **uncommitted** — its working tree is your starting
point). **Authorized by:** **D34** (2026-08-05, Sprint 49 §3).

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **UI migration — D28 mechanism-only de-Tailwind, defect correction** (`docs/rule-index.md` → Mixed migration).
- **Secondary type:** none. No behavior, no logic, no props-API change. The **required** visual outcome is a return to
  the pre-709 rendering.

> **Read this first.** Task 709 migrated all 9 sites correctly and its module reproduces every compiled declaration
> faithfully. Exactly one thing is wrong: the module is **unlayered**, so `.searchControl`'s `padding-inline` now beats
> a Mantine `Button` rule that the original Tailwind `px-6` **lost** to. This task changes **one thing** — it wraps the
> module's rules in `@layer utilities` — and then proves the 20 regressed cells return to their pre-709 md5.
> **Do not re-migrate anything. Do not touch `HeroSearchView.tsx`.**

---

## 2. Objective

1. Wrap every rule in `src/components/shared/HeroSearchView.module.css` in `@layer utilities`, restoring the cascade
   standing the replaced Tailwind utilities had.
2. Prove site 8's computed padding returns to **12px / 18px** at 375/700/1024.
3. Prove **all 40** herosearch cells return to their Task 709 **pre-edit baseline** md5 at
   `.screenshots/rendered-assert/2026-08-05T06-34/`.
4. Re-prove the `heroSearchWrapInBand` gate is still live on the layered code, **capturing a genuine non-zero exit
   code as a file** (Task 709's review finding F2).
5. Close Task 709's documentation defects (F3, F4, F5).

**Non-goals, stated as objectives so they are not silently attempted:** no change to `HeroSearchView.tsx`; no change
to any child component; no change to `heroSearch.smoke.test.tsx`; no change to any story or to
`check-stories-rendered.mjs`; **no change to the six other `.module.css` files** (see §3.4 — layering them would
re-break six shipped bug fixes); `check:design-tokens` must still read **23**.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` at HEAD
`3063ad5db` on **2026-08-05**, during the Task 709 review. Nothing is inferred from a filename or a prior report.

### 3.1 The defect, measured four ways

| Evidence | Result |
|---|---|
| `i2` vs `i3` computed styles | 108 shared keys, **8 diffs**: 6 are `site8_searchControl.paddingLeft/paddingRight` at 375/700/1024, 2 are `phase`/`capturedAt` metadata. Every other site and property byte-identical; `childrenCount` 4/4. |
| md5 recompute, all 40 herosearch PNGs | **20 changed** — all 20 `--default` cells (sq/en/uk/it × mobile-320/375/390, band-700, desktop-1024). All 20 `--fallback` cells identical. |
| Pixel diff, `default__en__band-700` | One region, bbox `(313,246)-(384,260)` — **71×14 px, 543 pixels**. Localized to the Search button. |
| Noise-floor control (4 runs) | `I4` vs `I6` vs owner-run `T09-04`: **0/40 changed**. The herosearch floor on this tree is **exactly zero**; the 20-cell delta is fully deterministic. |

Measured values: `paddingLeft/paddingRight` **12px/18px → 24px/24px** at all three widths.

### 3.2 Root cause — corrected from the Task 709 session log

- `@mantine/core/styles.css` is imported **unlayered** at `src/app/layout.tsx:6`.
- Tailwind utilities are wrapped in `@layer utilities`. **Verified in the built bundle:** in
  `storybook-static/assets/iframe-CF7KlFKr.css` the layer opens at byte **222445**; `.px-6` sits at byte 253947 at
  brace depth **1** (inside it), as does `.shrink-0` at 231853.
- Mantine's competing rule, read at source, `node_modules/@mantine/core/styles.css:3326-3328`:

  ```css
  .m_77c9d27d:where([data-with-left-section]) {
    padding-inline-start: calc(var(--button-padding-x) / 1.5);
  }
  ```

  with `--button-padding-x-sm: calc(1.125rem * var(--mantine-scale))` = 18px, so `padding-inline-start` = 18/1.5 =
  **12px** and `padding-inline-end` stays **18px**. That is exactly what `i2` measured pre-709: the rendered padding
  was **never governed by `px-6`**.
- **The session log's stated mechanism is wrong and you must not repeat it.** It claims the module wins because
  `.searchControl` (0,1,0) beats a `:where()`-wrapped rule at (0,0,0). `.m_77c9d27d:where([data-with-left-section])`
  is **(0,1,0)** — `:where()` zeroes only the attribute selector, not the class. At equal specificity and equal
  (unlayered) tier the module wins on **source order**.
- **Proof that "unlayered always wins" is not the mechanism:** the same `.searchControl` block declares
  `font-weight: 600`, and the computed value is **500 both before and after**. A blanket-unlayered-win model cannot
  explain that; a source-order model can.
- **Why `@layer utilities` is nonetheless the correct fix, and is robust for a better reason:** a layered rule loses
  to **every** unlayered rule regardless of specificity or source order. Layering therefore restores the original
  standing without depending on the fragile source-order argument at all.

### 3.3 Why this is safe for the other five classes

Sites 2/3/4/5/7 were Tailwind utilities **inside `@layer utilities`** before Task 709 and rendered correctly. Their
`i2`/`i3` values are identical, i.e. nothing is currently contesting them. Moving them back into `@layer utilities`
therefore restores exactly their pre-709 standing. This is faithful reproduction, not a new behavior.

`src/app/globals.css:596` already opens an `@layer utilities` block, so the layer name is registered in the project's
own stylesheet, not invented here.

### 3.4 **The opposite pattern exists in this repo — do not "fix" those files**

Six shipped tasks deliberately rely on a CSS module being **unlayered** so it *can* beat Mantine. Read the headers
before you touch anything:

- `src/design-system/mantine/patterns/MantineListingCardPattern.module.css:1-25, 31-40` — Tasks 602/606. Tailwind
  `hover:shadow-*` and `flex flex-row` could never override Mantine's `Card`; an unlayered module was the fix.
- `src/design-system/mantine/patterns/MantineCopyIdButton.module.css:1-17` — Task 656, citing the
  "Tasks 629/650/651/653/654 cascade-layer trap"; uses `[data-copy-id]` for extra specificity.

**These are correct and are out of scope.** The distinction is **intent**, and D34 encodes it:

| Intent | Cascade requirement |
|---|---|
| **D28 de-Tailwind migration** — reproduce existing rendering, zero delta | Module **must** reproduce the utility's layer → `@layer utilities` |
| **Cascade-trap fix** — a utility that never took effect is *supposed* to | Module stays **unlayered** (602/629/650/651/653/654/656) |

Layering a 602/656-family module would silently revert six bug fixes. Do not do it.

### 3.5 Gate exposure — measured 2026-08-05

| Gate / registry | Exposure | Evidence |
|---|---|---|
| `heroSearchWrapInBand` (`check-stories-rendered.mjs:1237-1263`) | **Live.** `true` at matrix indices **260/265/270/275** in runs `T06-34`, `T07-11`, `T08-16`, `T09-04`; `false` at the same four in the planted run `T07-44`. **Do not edit the script.** | 5 manifests, read 2026-08-05 |
| `docs/critical-flow-registry.md` row 50 | **Applies.** Names `HeroSearchView` and the 640–767 band invariant. | read 2026-08-04 |
| `check:design-tokens` | Reviewer-native run: **23** — `FavoriteButton.module.css` 9 · `SaveToCollectionButton.module.css` 2 · `page.tsx` 8 · `NotificationCenter.tsx` 4. Zero for `HeroSearchView.*`. | live run 2026-08-05 |
| `heroSearch.smoke.test.tsx` | 6/6 PASS owner-native 2026-08-05, 4.36s. **Expected diff: zero.** | owner run |

### 3.6 Worktree state — starts dirty with Task 709's own uncommitted work

`git status --short` at review time:

```
 M docs/backlog.md
 M src/components/shared/HeroSearchView.tsx
?? docs/sessions/2026-08-05-task709-herosearchview-de-tailwind.md
?? src/components/shared/HeroSearchView.module.css
```

These four paths **are Task 709 and are your inheritance, not foreign contamination** — 709 was never committed. The
18 owner CI paths from the 709 kickoff §3.8 were committed as `3063ad5db` and are gone from status.

> Take your own pre-write `git status --porcelain` snapshot before your first edit. If any path beyond these four is
> present, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for it and **never** touch, revert or
> stage it.

### 3.7 Known-good baseline

`.screenshots/rendered-assert/2026-08-05T06-34/` is the **pre-709 baseline** and the target this task must restore.
Its 40 herosearch PNGs are your AC2 comparator. Do not regenerate it; do not overwrite it.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D34, §3.2 | Every rule in `HeroSearchView.module.css` is inside `@layer utilities`. No rule remains at the top level. | P0 | AC1 |Confirmed|
| R2 | §3.1, D26 | All **40** herosearch cells match the **`T06-34` pre-709 baseline** md5, including the 20 that regressed. | P0 | AC2 |Confirmed|
| R3 | §3.1 | Site 8 computed `paddingLeft`/`paddingRight` = **12px**/**18px** at 375/700/1024; all other sites/properties unchanged from `i3`. | P0 | AC3 |Confirmed|
| R4 | §3.5, D32 | `heroSearchWrapInBand` returns `true` at matrix 260/265/270/275 and `null` elsewhere. | P0 | AC4 |Confirmed|
| R5 | 709 review **F2** | A planted violation flips the gate to `false`, the run FAILs, and a **natively captured non-zero exit code is persisted in a file**. | P0 | AC5 |Confirmed|
| R6 | §3.4 | The six other `.module.css` files have **zero diff**. | P0 | AC6 |Confirmed|
| R7 | 709 scope | `HeroSearchView.tsx`, all stories, `check-stories-rendered.mjs` and `heroSearch.smoke.test.tsx` have **zero diff**. | P0 | AC7 |Confirmed|
| R8 | N1, §3.2 | Layering changes **only** layer membership. Every declaration, `var()` reference and media condition is byte-identical to the Task 709 module. | P0 | AC8 |Confirmed|
| R9 | 709 review **F5** | The module's provenance header is corrected: the wrong specificity claim removed, D34 cited, the `602/656` non-application recorded. | P1 | AC9 |Confirmed|
| R10 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code captured **inside** the file. | P0 | AC10 |Confirmed|
| R11 | §3.5 | `check:design-tokens` totals **23**; `heroSearch.smoke.test.tsx` passes 6/6. | P1 | AC11 |Confirmed|
| R12 | 709 review **F3**, N6 | Counting gates run **last**, and their **actual numbers are written into the session log** under a heading that exists. | P2 | AC12 |Confirmed|
| R13 | 709 review **F4** | The Task 709 session log and kickoff receive their correction notes. | P2 | AC13 |Confirmed|

---

## 5. Assumptions and open questions

- **A1 — the one real risk.** `@layer utilities { .searchCard { … } }` inside a `.module.css` must survive Next.js's
  CSS-modules pipeline with class-name hashing intact. `@layer` is a standard at-rule and css-loader handles
  selectors nested in at-rules (it already does for `@media` in this very file), but **this has not been verified in
  this repo** — no existing `.module.css` uses `@layer`. **I2 is the checkpoint.** If the emitted CSS shows unhashed
  class names, a dropped layer block, or the rules missing entirely, **stop and report `BLOCKED`** — do not work
  around it by hand-writing `:where()` wrappers or by reverting site 8 to style props (§8 explains why that fails).
- **A2.** Layering restores 12px/18px because layered loses to unlayered unconditionally. Mechanically certain from
  the spec, **but verify on the rendered DOM at I2 — do not assume.**
- **A3.** The other five classes are uncontested and unaffected by layering (§3.3). Verified by the `i2`/`i3`
  identity, but re-confirm in the I2 capture.

### 5.1 Naming — decided, do not re-litigate

One `@layer utilities { … }` block wrapping the file's entire rule set, opened after the provenance header. Class
names, media queries and declarations are unchanged. Do not rename anything. Do not split into multiple layer blocks.

### 5.2 Nothing is left ambiguous

D34 fixes the mechanism and its scope boundary. D26 fixes the comparator. D32 fixes the proof obligation.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (**row 50 in full**).

**Because this is a UI migration:** `docs/mantine-responsive-design-system.md` (**§18**) ·
`docs/tailadmin-style-reference.md` · `docs/component-rules.md` · `docs/storybook-governance.md` §14.11 (D26).

**Task-specific sources:** this file · `tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md` (**§3 D34 in
full**) · `tasks/Sprints/Sprint_49_kickoff_prompt_Task_709_HeroSearchView_DeTailwind.md` (**§3.2 declaration table**) ·
`docs/sessions/2026-08-05-task709-herosearchview-de-tailwind.md` (**§6 — and note §3.2 above corrects it**) ·
`src/components/shared/HeroSearchView.module.css` · `src/design-system/mantine/patterns/MantineListingCardPattern.module.css`
(**header, §3.4**) · `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` (**header, §3.4**) ·
`src/app/globals.css:596` · `scripts/check-stories-rendered.mjs` `:1235-1263` (**read; do not edit**).

---

## 7. Scope

- `src/components/shared/HeroSearchView.module.css` — wrap in `@layer utilities`, correct the header (R9).
- `docs/sessions/2026-08-05-task709-herosearchview-de-tailwind.md` — correction notes (R13), see §10.6.
- `tasks/Sprints/Sprint_49_kickoff_prompt_Task_709_HeroSearchView_DeTailwind.md` — §3.3 correction note (R13).
- `docs/backlog.md` — concise state only.
- `docs/sessions/2026-08-05-task709R-herosearchview-layer-fix.md` — this task's session log. Use the real finish date.

---

## 8. Out of scope

- **`src/components/shared/HeroSearchView.tsx`** — zero diff. Task 709 migrated it correctly.
- **The six other `.module.css` files** (§3.4) — layering them would revert Tasks 602/606/629/650/651/653/654/656.
- **Every story file**, `scripts/check-stories-rendered.mjs`, `heroSearch.smoke.test.tsx` — zero diff.
- `PropertyTypeCombobox.tsx`, `LocationCombobox.tsx`, `MantineCountButton.tsx`, `theme.ts`, `globals.css`,
  `layout.tsx`.
- **Reverting site 8 to Mantine style props.** Rejected with reason: style props render as inline `style=""`, which
  beats Mantine's stylesheet outright and reproduces 24px/24px — the same regression by another route.
- **`!important`** — forbidden. If layering does not restore 12/18, that is a finding, not something to force.
- The `--mantine-radius-lg` 8px/16px discrepancy, and the repo-wide N1 debt in the other modules. Record, do not fix.
- The pre-existing hydration warning `<div> cannot be a descendant of <p>` in the FiltersPanel drawer
  (`DrawerTitle → ModalBaseTitle → Text(component="p") → Group(div)`), surfaced by the 2026-08-05 smoke run. Real, but
  predates 709 and needs its own task. **Record it; do not fix it.**

---

## 9. Current and required behavior

**Current:** `HeroSearchView.module.css` is unlayered. `.searchControl { padding-inline: var(--space-6) }` wins over
`@mantine/core`'s `:where([data-with-left-section])` rule, rendering 24px/24px where pre-709 rendered 12px/18px. 20 of
40 herosearch cells differ from the pre-709 baseline. `.searchControl`'s `font-weight: 600` is inert (computed 500),
as `font-semibold` was before it.

**Required after:** every rule sits in `@layer utilities`; site 8 renders 12px/18px again; all 40 herosearch cells
match `T06-34` byte-for-byte; the band gate still returns `true` and can still be made to fail, **with a captured
non-zero exit code**.

### Implementation sequence

- **I1 — Baseline first, before any edit.** Confirm your start state equals the reviewed 709 state: `git status
  --porcelain` (expect exactly the four paths in §3.6) and `git diff --stat`. Rebuild Storybook
  (`npm run build-storybook`) and record the bundle hash. **Persist the hash and the extraction you rely on as a
  file** — Task 709's I1 bundle was deleted and its extraction became unverifiable (review F5).
- **I2 — Layer, then verify the pipeline and the cascade in one step.** Wrap the rules. Rebuild. **First** confirm A1:
  read the emitted CSS and confirm the layer block survived **and** class names are still hashed. **Then** capture
  `getComputedStyle` for all 9 sites at 375/700/1024 using the same shape as
  `.screenshots/task709-evidence/i3-post-edit-computed-styles.json`, and diff against **both** `i2` (target: identical)
  and `i3` (expect: exactly the 6 padding properties differ). Witness the rendered DOM: module classes present on all
  6 sites including the 3 child roots, control row still exactly 4 element children.
- **I3 — Full rendered run.** `npm run screenshots:assert -- --mantine-only`. Compare all 40 herosearch md5s against
  **`T06-34`** — the pre-709 baseline, not against 709's post-edit runs.
- **I4 — Re-prove the gate, and capture the exit code properly (AC5).** Plant the band violation on the **layered**
  code, re-run, confirm `false`×4 and a genuine FAIL, and persist the exit code **unpiped**. Revert exactly, re-run
  green. Persist both transcripts as files.
- **I5 — Documentation corrections** (R9, R13) and the session log.
- **I6 — Counting gates last** (`check:file-integrity`, `check:mojibake`), after the session log and backlog row exist,
  **and write their actual numbers into the log** (review F3).

---

## 10. Implementation requirements

1. **Change layer membership and nothing else.** Every declaration, `var()`, comment and media condition stays
   byte-identical. A `git diff` on the module must show only the added `@layer utilities {` / `}` and the resulting
   re-indentation, plus the header correction.
2. **One layer block, wrapping everything**, including the two `@media` blocks. Do not nest `@layer` inside `@media`.
3. **Do not add `!important`.** If layering fails to restore 12/18, stop and report.
4. **Do not touch the other six modules** (§3.4). Their unlayered status is deliberate and load-bearing.
5. **Preserve verbatim:** every class name, both `@media` conditions, the `--tw-font-weight: 600` bookkeeping
   declaration, and every per-declaration provenance comment.
6. **Correct the header (R9):** remove the "(0,1,0) beats (0,0,0)" specificity claim, state the source-order mechanism
   from §3.2, cite **D34**, and record that the 602/656 unlayered pattern deliberately does **not** apply here.
7. **Capture the AC5 exit code unpiped.** Task 709 persisted `EXIT_CODE=0` on a genuinely failing run. Do not pipe to
   `tee`; redirect, then append `$LASTEXITCODE` on the next statement.
8. **Run `check:file-integrity` and `check:mojibake` LAST** (N6, 4th recurrence — a 5th is a P1), and **report their
   real numbers in the session log under a heading that exists** (709 review F3: its `§8` pointer led to the N3
   section).

---

## 11. Positive and negative flows

**Positive flow:** with the module layered, `npm run screenshots:assert -- --mantine-only` renders all 40 herosearch
cells byte-identical to `T06-34`; site 8 measures 12px/18px; the 8 `band-700` cells behave as at I1 (`true`×4 default,
`null`×4 fallback); the run summary is unchanged.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| CSS-modules pipeline drops or mangles `@layer` | **Yes** | A1 | layer block survives, class names hashed; otherwise `BLOCKED` | AC1, I2 |
| Healthy render, all 3 tiers | **Yes** | 375 / 700 / 1024 | site 8 back to 12/18; all others identical to `i3` | AC3 |
| Regressed cells restored | **Yes** | the 20 `--default` cells | md5 identical to `T06-34` | AC2 |
| Untouched cells stay untouched | **Yes** | the 20 `--fallback` cells | md5 identical to `T06-34` | AC2 |
| Band 640–767 preserved | **Yes** | matrix 260/265/270/275 | `heroSearchWrapInBand` stays `true` | AC4 |
| Planted violation post-layering | **Yes** | I4 | gate `false`, run FAILs, **captured exit ≠ 0**, reverts green | AC5 |
| Layering weakens an uncontested class | **Yes** | A3, sites 2/3/4/5/7 | no computed-style change vs. `i3` | AC3 |
| `className` reaching a child via `cn()` | **Yes** | sites 4/5/7 | module class still lands on the child's root `div` | AC3 |
| Locale expansion | **Yes** | sq/en/uk/it | identical verdict and md5 in all 4 | AC2 |
| Hydration | **No** | class names identical server and client; no runtime branch added | N/A | — |
| RLS / authorization | **No** | presentational; the harness reads static stories | N/A | — |
| Validation / empty input | **No** | no form logic touched; props API unchanged | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the final module, when it is read, then **every** rule sits inside a single `@layer utilities`
  block, and when the rebuilt bundle is read, then the block survived compilation **and** the class names are hashed.
  Quote the emitted selector for `.searchControl`.
- **AC2 [R2]** Given the post-change run, when its 40 herosearch PNG md5s are compared against
  `.screenshots/rendered-assert/2026-08-05T06-34/` under the §14.11 (D26) comparator, then **all 40 are identical** —
  including the 20 `--default` cells listed in §3.1. Report the actual count. A remaining mismatch is a finding with
  per-cell attribution, never absorbed into a tolerance.
- **AC3 [R3]** Given the I2 capture and the persisted `i2`/`i3` files, when diffed property by property, then site 8
  reads **12px/18px** at all three widths (identical to `i2`), and **every other site and property** is identical to
  `i3`. State the properties captured and `childrenCount`.
- **AC4 [R4]** Given the post-change `manifest.json`, when the herosearch cells are read, then
  `heroSearchWrapInBand` is `true` at matrix indices **260/265/270/275** and `null` in the other 36.
- **AC5 [R5]** Given a planted layout violation on the **layered** code, when the assert re-runs, then the four target
  cells read `false`, the run reports a genuine FAIL, **and the persisted transcript's captured exit code is non-zero**.
  Persist the transcript, its `manifest.json` path, and the captured exit code as files. Then revert exactly and re-run
  green. If the captured exit code is **0 while cells genuinely FAIL**, that is a live CI-enforcement defect: report it
  as a P0 finding and hand it to Task 710 — do not absorb it and do not claim AC5.
- **AC6 [R6]** Given `git diff` on the six other `.module.css` files, when read, then all are **empty**. List them.
- **AC7 [R7]** Given `git diff` on `HeroSearchView.tsx`, every story file, `check-stories-rendered.mjs` and
  `heroSearch.smoke.test.tsx`, when read, then all are **empty**.
- **AC8 [R8]** Given `git diff` on the module, when read, then the only changes are the `@layer utilities` wrapper,
  its re-indentation, and the §10.6 header correction. No declaration, `var()`, class name or media condition changed.
  Quote the diff.
- **AC9 [R9]** Given the final module header, when read, then the "(0,1,0) beats (0,0,0)" claim is gone, the
  source-order mechanism is stated, **D34** is cited, and the 602/656 non-application is recorded.
- **AC10 [R10]** Given the final state, when `npm run build` runs, then it exits **0**, the transcript is written to a
  real file whose path you state, **and the exit code is captured inside that file**.
- **AC11 [R11]** Given `npm run check:design-tokens`, then the total is **23** with no entry for `HeroSearchView.*`;
  and `npx vitest run … heroSearch.smoke.test.tsx` reports **6/6 PASS**.
- **AC12 [R12]** Given `npm run check:file-integrity` and `npm run check:mojibake` run **after** the session log and
  backlog row exist, then both pass, **and their actual numbers appear in the session log under a real heading**.
  Reconcile the counts against your pre-write snapshot.
- **AC13 [R13]** Given the Task 709 session log and kickoff, when read, then each carries a correction note: the
  kickoff §3.3 records that `sm:basis-full` **does** compile and that the drop rests on measured equivalence; the
  session log §6 records the corrected source-order mechanism.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** `docs/qa-profiles.md` routes to Q4 for changes touching
`docs/critical-flow-registry.md`, and row 50 names `HeroSearchView` and the 640–767 band. This task also **changes
rendered output on purpose** (restoring it), so the full 40-cell comparator is mandatory, and D32 still requires the
comparator be shown to fail on the code as shipped.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` + `git diff --stat` (I1) | exactly the four §3.6 paths |
| 2 | `npm run build-storybook` (I1); persist hash + extraction | recorded as a file, not just cited |
| 3 | Wrap in `@layer utilities`; rebuild; read emitted CSS (I2) | layer survived, class names hashed (**A1**) |
| 4 | `getComputedStyle`, 9 sites × 375/700/1024 (I2) | site 8 = 12/18; all else identical to `i3` |
| 5 | Rendered DOM witness at `band-700` (I2) | 6 module classes present incl. 3 child roots; 4 element children |
| 6 | `npm run screenshots:assert -- --mantine-only` (I3) | 40/40 md5 identical to **`T06-34`**; `true`×4 / `null`×36 |
| 7 | `git diff` on the 6 other modules + `HeroSearchView.tsx` + stories + gate + smoke test | all empty |
| 8 | **Planted violation + re-run, exit code captured unpiped** (I4) | `false`×4, genuine FAIL, **exit ≠ 0** persisted; reverted → green |
| 9 | `npm run check:design-tokens` | **23**, no entry for this task's files |
| 10 | `npx vitest run src/components/shared/__tests__/heroSearch.smoke.test.tsx` | 6/6 PASS |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate**, transcript persisted with the exit code inside it |
| 13 | `npm run check:file-integrity` · `npm run check:mojibake` — **last** | pass; **numbers written into the session log** |

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `.screenshots/task709R-evidence/` (local-only per **D6**), referenced by path from the session
log. **Name every run directory you create, including aborted ones.** Do not overwrite `T06-34`.

---

## 14. Completion report contract

Write `docs/sessions/2026-08-05-task709R-herosearchview-layer-fix.md` containing:

1. **Files changed** — a table matching the real `git diff --stat`, reconciled against your pre-write
   `git status --porcelain` snapshot (§3.6).
2. **Requirement IDs completed** — R1–R13, each with its AC verdict.
3. **The A1 pipeline result** — whether `@layer` survived the CSS-modules build, with the emitted selector quoted.
4. **The 40-cell comparison against `T06-34`**, with per-cell attribution for any remaining mismatch.
5. **The computed-style diff** against both `i2` and `i3`.
6. **Commands run and their actual results** — real exit codes and real numbers, including the AC5 plant transcript
   **with its natively captured exit code** and the step-12 build transcript with its persisted path.
7. **Evidence locations** — every run directory you created, named.
8. **A real counting-gates section** with the actual `check:file-integrity` / `check:mojibake` numbers (F3).
9. **The corrections applied** to the 709 log and kickoff (R13).
10. **Standing findings not acted on** — the repo-wide N1 debt, the `--mantine-radius-lg` discrepancy, the
    FiltersPanel `<div>`-in-`<p>` hydration warning (§8).
11. **Assumptions, deviations, limitations, unresolved issues.**
12. Concise current state appended to `docs/backlog.md` — **state only**, no history. The file is at **107** lines
    against a documented ~80-line target; do not add net lines, and flag a `BACKLOG LIMIT BREACH` if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every path, line number, matrix index, baseline directory and command is named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R13 → AC1–AC13 → §13 steps 1–13 |
| Scope protects existing behavior and names what must not change | ✅ §8, plus §10.1/§10.4/§10.5 and four zero-diff ACs (AC6, AC7, AC8) |
| No uninspected claim | ✅ the 8-key computed diff, the 20/40 md5 recompute, the 543-pixel bbox, the 4-run zero noise floor, the Mantine rule at `:3326-3328`, the layer byte offset 222445, and `check:design-tokens`=23 were all produced by the reviewer's own commands on 2026-08-05 |
| Prior-review mechanism error corrected, not inherited | ✅ §3.2 replaces the session log's specificity claim with the source-order mechanism and supplies the `font-weight` counter-example that disproves it |
| The gate proves the changed behavior, not merely procedure | ✅ AC5 re-plants on the layered code **and** treats a zero exit code beside genuine FAILs as a P0 handed to 710 |
| Critical flow named or excluded from evidence | ✅ §3.5 names registry row 50; §13 argues Q4 from it |
| Owner exceptions have traceable authorization | ✅ D34 recorded in Sprint 49 §3 with date and scope; D26/D28/D32/D6 cited with file and date |
| Canonical-source search performed before proposing a style | ✅ §3.4 — all 11 `.module.css` files enumerated; the two that already encode the opposite cascade decision were opened and read, and the intent boundary is stated rather than assumed |
| Exactly one active executable route | ✅ §5.1 fixes one layer block; §8 rejects style props and `!important` with reasons |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + A1's `BLOCKED` clause + AC2's `T06-34` comparator + AC5's P0-to-710 path |
| Zero/empty input covered | ✅ §11 — the 20 `--fallback` cells are an explicit untouched-set branch with named evidence |
| Worktree state established with a pre-write snapshot | ✅ §3.6 quotes the real four-path status and distinguishes inheritance from contamination |
| Prior-review corrections folded in | ✅ **F2** (AC5 unpiped exit capture), **F3** (AC12 real heading + numbers), **F4** (AC13 kickoff §3.3 note), **F5** (I1 persists the extraction), plus N1/N6 |
| Sprint assigned before creation | ✅ Sprint 49, D34 authorizing |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none** — D34 closes the mechanism and its scope boundary.
