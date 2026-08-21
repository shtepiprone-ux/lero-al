# Task 762 — Revision 1: Category C, and the two bypasses in the delivered gate

**Filed:** 2026-08-21 by the orchestrator, after reviewing the `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
submission. **Review verdict on that submission: `NEEDS REVISION`.** An earlier `APPROVED WITH NOTES` verdict was
issued in chat and is **withdrawn**; no commit/push handoff accompanied it and none was valid.

This brief supersedes exactly the sections of
`tasks/Sprints/Sprint_62_kickoff_prompt_Task_762_tailwind_runtime_tokens.md` named in §7 and changes nothing else.
No review ledger accompanies this verdict: `docs/reviews/*.review-ledger.json` is the approval instrument
(`docs/agent-contract.md` §9a), and all 8 existing ledgers are `APPROVED`/`APPROVED WITH NOTES`. A rejection is
recorded here and in `docs/backlog.md`.

**Mode and task type:** `TASK DESIGN` — governance gate correction + UI mechanism (D28). **Sprint:** 62.
**QA profile:** `Q4 Release/Critical Flow` (unchanged — `docs/critical-flow-registry.md:57` and `:70` are both in
scope again).

---

## 1. Accepted as implemented — do not re-work, do not re-touch

Verified independently by the reviewer against the real diff, not from the executor's report. These stay exactly as
they are on disk:

- **R2 / Category A.** All 9 `var(--default-transition-*)` declarations in the 5 named files, replaced with
  `150ms` / `cubic-bezier(0.4, 0, 0.2, 1)`. `grep -rn -- "var(--default-transition" src/` → empty (exit 1),
  re-run by the reviewer. `computed-styles-before.json` and `-after.json` are byte-identical.
- **The `design-tokens-allow` marker placement.** Present on every `150ms` line, absent from every `cubic-bezier`
  line, per Task 757R's empirical per-line rule. `npm run check:design-tokens -- --strict` → 0 violations,
  0 stale markers, re-run by the reviewer.
- **The gate's failure semantics in all three directions.** Reproduced independently in an isolated copy: planted
  reference → exit 1; baseline row deleted while the reference lives → exit 1; baseline row whose reference is gone
  → exit 1.
- **The executor's correction of this kickoff's own Arm B label.** Upheld. The original plant table said Arm B
  exercises "the stale-baseline rule"; it exercises the not-in-baseline rule. The executor was right, proved it,
  and ran a supplementary test for the real stale-baseline direction. That was the correct handling of a defective
  kickoff, and it is the standard for this revision too.
- **`docs/design-system.md` §23.7, `docs/backlog.md` line discipline (79 → 79), the session log, and the retained
  evidence set.** §23.7 needs the additions in R7 but is not rewritten.

Re-running the verification for any of the above is **not** required. Re-run only what §11 names.

---

## 2. Three defects. Two are mine.

### O-1 (orchestrator) — the original scope split ranked the categories without measuring them

The original kickoff put Category C (`--tw-*`) out of the fix on this stated ground: *"category C couples to
Tailwind's `@property` registrations rather than to theme values — a different remediation."* That sentence is
true and was used to imply Category C is **less** urgent than Category A. **It is more urgent, and the kickoff
never measured it.**

Measured now, in Chromium, on the exact declaration shape `MobileBottomNavView.module.css:57,61` ships
(probe retained at `docs/sessions/evidence/task762-r1/property-dependency-probe/`):

| | `box-shadow` | `border-top-style` | `border-top-width` |
|---|---|---|---|
| **With** Tailwind's `@property` registrations | `rgba(0,0,0,0.08) 0 -2px 16px` (+4 transparent layers) | `solid` | `1px` |
| **Without** them | **`none`** | **`none`** | **`0px`** |

Category A degraded a value (`transition-duration` → `0s`) while the declaration survived. Category C **removes the
declaration**: `var()` substitution fails, the declaration becomes invalid at computed-value time, and the shadow
and the border disappear. `border-style: none` additionally forces the used width to `0`, so the nav's top border
collapses rather than merely losing colour.

The repository already knew this and wrote it down. `src/modules/listings/components/ListingCard.module.css:24-29`
states that its `box-shadow` composition deliberately relies on *"Tailwind's own globally-registered `@property`
initial value (`0 0 #0000`)"*. A prior task consciously took a dependency on Tailwind's compiler output; the
762 kickoff read that file, listed it under Category C, and deferred it.

This is the ninth instance of the `docs/backlog.md` corollary — *a kickoff's own measured facts are not exempt* —
and this time the defect was **ordering two risks by their remediation cost instead of by their measured effect.**

### O-2 (orchestrator) — R1 named the wrong ownership source, and that produced both delivered bypasses

R1 required ownership to be *"derived from a source the gate reads, not from a hardcoded list you author"* and then
named exactly one source: `src/app/globals.css`'s `@theme`/`:root` blocks. `globals.css` is **author-writable**, and
its `@theme inline` block **mirrors Tailwind's own defaults by design** (the file's own comment: *"mirrors Tailwind
v4 default sizes (visually inert)"*). Both delivered bypasses follow directly from that instruction, so neither is
an executor defect:

**B-1 — one line in `globals.css` silences the gate.** Reproduced by the reviewer: adding
`--default-transition-duration: .15s;` inside `@theme inline` while leaving `var(--default-transition-duration)` in
a CSS Module gives **exit 0**. R1's own justification for a baseline file over a comment was
`docs/backlog.md` corollary 724 ② — *an exemption the author writes is not a condition the gate evaluates.* The
delivered gate moves the author-written exemption from a CSS comment into `globals.css`. It does not remove it.
Worse: a name declared only in `@theme inline` and read only from a CSS Module is emitted into no stylesheet at
all (§22.3's `--z-sticky` mode), so the bypass silences the gate **and** creates the breakage.

**B-2 — the gate does not block new Category-B debt.** Reproduced: a brand-new `var(--text-sm)`,
`var(--text-sm--line-height)`, `var(--font-weight-bold)` and `var(--radius-4xl)` planted into a CSS Module gives
**exit 0**. The executor disclosed `--text-*` as a named limitation and that disclosure is accurate and honest —
but a control's primary job is refusing *new* debt, and for this family it does not. The family is also wider than
`--text-*`: `--font-weight-bold` and `--radius-4xl` are **emitted nowhere in the current build**, so a module
referencing them resolves to nothing **today**, not after Tailwind is removed.

### E-1 (executor, minor) — the scan sees `var()` reads only

`findVarReferenceNames` matches `var(`. Therefore `--tw-*` **declarations** (`--tw-shadow:`, `--tw-ring-color:`,
`--tw-duration:`, `--tw-scale-x:`, `--tw-font-weight:`, `--tw-leading:`) and the `--tw-gradient-from|via|to` names
inside `transition-property:` lists are in neither the scan nor the baseline. This matches R1's literal wording
("any `var(--…)`") so it is not a spec violation, but it means Category C is **not frozen even where it is not
fixed** — a new `--tw-*` declaration lands green.

---

## 3. Owner decision, 2026-08-21

> **D762-1.** `--tw-*` and the other Tailwind-referencing custom properties must be removed, not only baselined.
> Recorded from the owner's rejection of the `APPROVED WITH NOTES` verdict.
> **D762-2.** The work is a **revision of Task 762**, not a new task number. 763 stays `NEXT FREE`.

**Decision still open — D762-3, stated here so it is reviewable rather than silently assumed.** This revision draws
the fix line at **Category C + D** (`--tw-*`, bare `--spacing`, `--leading-tight`) and leaves **Category B**
(`--text-*` typography) to Task 763, while requiring the gate to *see* Category B from now on. Reason: a `--text-*`
replacement is a typography value change and `docs/agent-contract.md` §16 requires TailAdmin provenance for it,
which is a different evidence contract from reproducing a compiled shadow. **If the owner wants Category B in this
revision too, say so and R5 extends; nothing else in this brief changes.**

---

## 4. Verified context — measured 2026-08-21 by the reviewer

`FACT` unless labelled otherwise. Every command was run and its output read.

1. `@property --tw-*` registrations exist in the built CSS (`.next/static/css/bc88661d53d0076e.css`) and in
   **no** Tailwind source stylesheet — `grep -c "@property --tw-" node_modules/tailwindcss/*.css` → `0` in all four
   files. They are compiler-generated, so no shipped file enumerates them.
2. Registered initial values in the built CSS: `--tw-shadow`, `--tw-inset-shadow`, `--tw-inset-ring-shadow`,
   `--tw-ring-shadow`, `--tw-ring-offset-shadow` → `0 0 #0000`; `--tw-border-style` → `solid`;
   `--tw-duration`, `--tw-ease`, `--tw-shadow-color` → registered with no initial value.
3. The dependency probe in §2/O-1. **`EXECUTED`** — Chromium, `getComputedStyle`, two documents identical except
   for the presence of the `@property` rules.
4. Category C + D inventory in `src/**/*.module.css`, by file (read line by line, not counted by regex):

   | File | Reads | Declarations | In `transition-property` list |
   |---|---|---|---|
   | `components/layout/MobileBottomNavView.module.css` | `--tw-border-style`:57 · `--tw-inset-shadow`/`--tw-inset-ring-shadow`/`--tw-ring-offset-shadow`/`--tw-ring-shadow`/`--tw-shadow`:61,89 · `--tw-shadow-color`:60,87 · `--tw-ring-inset`/`--tw-ring-offset-width`/`--tw-ring-color`:88 · `--tw-ease`:92 · `--tw-scale-x`/`--tw-scale-y`:101 · `--spacing`:74,138 | `--tw-shadow`:60,87 · `--tw-ring-shadow`:88 · `--tw-ring-color`:90,105,110 · `--tw-duration`:94 · `--tw-scale-x/y/z`:98-100 · `--tw-font-weight`:124,165 · `--tw-leading`:127,167 | :139 |
   | `design-system/mantine/patterns/MantineListingCardPattern.module.css` | `--tw-leading`:183,201,282,288,307,352 · `--tw-border-style`:290,357 · `--tw-ease`:220 · `--tw-duration`:226 · `--spacing`:145,154,185,203,354 · `--leading-tight` (baseline row) | — | :219 |
   | `modules/listings/components/ListingCard.module.css` | `--tw-inset-shadow`/`--tw-inset-ring-shadow`/`--tw-ring-offset-shadow`/`--tw-ring-shadow`/`--tw-shadow`:83 · `--tw-shadow-color`:82 · `--spacing`:64,65,74 | `--tw-shadow`:82 | — |
   | `components/shared/HeroSearchView.module.css` | `--spacing`:87 | `--tw-font-weight`:121 | — |
   | `design-system/mantine/patterns/MantineCopyIdButton.module.css` | — | — | :27 |
   | `components/layout/MobileNavDrawer.module.css` | — | — | :8 |
   | `modules/notifications/components/NotificationItem.module.css` | — | — | :4 |
   | `design-system/mantine/patterns/MantineHomeSection.module.css` | — | — | comments only (:13,:15,:27) |
   | `modules/locations/components/PopularLocationsView.module.css` | — | — | comments only (:14,:15) |

5. Every name B-2 misses is declared in `node_modules/tailwindcss/theme.css` — spot-checked 7/7: `--text-sm`,
   `--text-sm--line-height`, `--font-weight-bold`, `--radius-4xl`, `--spacing`, `--leading-tight`, `--text-3xl`.
6. In the built CSS, `--text-sm`, `--spacing`, `--leading-tight` and `--default-transition-duration` are emitted
   inside `@layer theme{:host,:root{…}}` — the layer Tailwind's compiler generates. `--font-weight-bold`,
   `--radius-4xl`, `--ease-standard`, `--icon-md`, `--z-sticky` are emitted **nowhere**.
7. `globals.css` has **no bare `@theme {`** block. `@theme inline {` (:35) declares **185** names; `:root {` (:327)
   declares **72**; the two sets do not overlap; 185 + 72 = the 257 the delivered gate reports as project-owned.
8. `src/app/[locale]/page.tsx:31,34` passes `'var(--text-3xl)'`, `'var(--text-4xl)'`, `'var(--text-5xl)'`,
   `'var(--text-xl)'`, `'var(--text-2xl)'` as Mantine `fz` props — the same risk class, in a shipped route, outside
   any CSS-Module scan.
9. The 7 non-module stylesheets under `src/design-system/mantine/*-chrome.css` contain no `--tw-`, `--text-`,
   `--default-` or bare `--spacing` reference today.
10. `docs/sessions/evidence/task762-r1/` is not gitignored (`git check-ignore -v` → no match). `.screenshots/` **is**
    (`.gitignore:55`) — do not put retained evidence there.
11. Stories exist for every file R5 touches: `MobileBottomNavView.stories.tsx`, `ListingCard.stories.tsx`,
    `patterns/mantine/ListingCardPattern.stories.tsx`, `HeroSearch.stories.tsx`, `CopyIdButton.stories.tsx`,
    `MobileNavDrawer.stories.tsx`. **`NotificationItem` has no story** and is not enrolled in the `--mantine-only`
    matrix — the 762 session log established this; its proof path stays the computed-style probe plus
    `ListingCard.smoke.test.tsx`.

**`INFERENCE`, for the executor to verify rather than assume:** facts 6 and 7 together suggest that *every* name in
`@theme inline` is emitted only by Tailwind's generated theme layer and therefore dies with Tailwind — which would
make the delivered gate's bucket 1 inverted for all 185 names, not merely for `--text-*`. The reviewer did **not**
establish this: a layer-attribution reading of the minified bundle gave an unreliable result for `--background` and
`--primary`. **R4's checkpoint C-1 must measure it. Do not carry this paragraph forward as a fact.**

---

## 5. Requirement ledger

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R4 | O-2, B-1, B-2 | Ownership is decided from a source a CSS-Module author cannot edit to silence the gate; both bypasses fail | P0 | Two plants, §11 | Confirmed |
| R5 | D762-1, O-1 | Zero `--tw-*`, bare `var(--spacing)`, `var(--leading-tight)` remain in `src/**/*.module.css` — reads **and** declarations | P0 | Empty grep + rendered zero-delta | Confirmed |
| R6 | E-1 | Declarations and `transition-property` name-lists are inside the scan and the baseline | P1 | Plant, §11 | Confirmed |
| R7 | O-1, O-2 | §23.7 records the measured Category-C failure mode and the corrected ownership rule | P1 | Read-after-write | Confirmed |
| R8 | Fact 8 | The `page.tsx` TSX references are recorded as named, in-scope-for-763 debt | P2 | Backlog row | Confirmed |

---

## 6. Implementation requirements

### R4 — close both bypasses (build this first; it is the control)

Rewrite the ownership decision in `scripts/check-tailwind-runtime-tokens.mjs`. **This brief does not mandate the
mechanism** — it mandates the observables in AC-R1 and AC-R2 and requires the executor to state which source it
used and why. Two candidate sources were measured by the reviewer and are offered as evidence, not as instructions:

- **Candidate 1 — `node_modules/tailwindcss/theme.css`.** Every name B-2 misses is declared there (fact 5). Pin the
  resolved `tailwindcss` version from `package-lock.json` so the source is deterministic, as
  `check-review-ledger.mjs` already does for imported package styles.
- **Candidate 2 — the emitted layer.** Facts 6 and 7 suggest the property's *emitting layer* is the real signal.
  Stronger if it holds, but it rests on the `INFERENCE` in §4 and on build output that lives in gitignored `.next/`.

`--tw-*` cannot come from either source (fact 1): the registrations are compiler-generated. The `--tw-` prefix is
therefore the only available signal, and using it is the **same mechanism class** as the existing `--mantine-`
exclusion the delivered gate already justifies by precedent — a prefix that names an external system, not a list of
individual names an author chose. State this in the gate header so the next reader does not mistake it for the
hardcoded list R1 forbade.

**Checkpoint C-1, run and reported before any gate edit:** for each of the 257 names in `globals.css`'s
`@theme inline` and `:root` blocks, record whether it is emitted as a custom property in the current build and by
which layer. Persist the table. This measures the §4 `INFERENCE` instead of inheriting it, and its result is what
justifies whichever ownership source R4 lands on. **If the measurement cannot be produced, return `BLOCKED` with
the attempted commands — do not fall back to an unmeasured rule.**

Fail-closed behaviour, the fatal-on-zero-owned-names guard, and the "no inline suppression comment" property all
carry over unchanged.

### R5 — remove Category C + D from the five files that carry them

Per fact 4. For each site, reproduce the value it **resolves to today**, verified against the built CSS, never
assumed from Tailwind's documented defaults — the same rule Task 757R and R2 already followed:

- **The two `box-shadow` compositions** (`MobileBottomNavView:61,89`, `ListingCard:83`) flatten to a literal
  `box-shadow` list. Capture the live computed value first; the four transparent `0 0 #0000` layers are the
  registered initial values and contribute nothing visible, but the **captured computed string is the target**, not
  a hand-derived one.
- **`border-top-style: var(--tw-border-style)`** (`MobileBottomNavView:57`, `MantineListingCardPattern:290,357`) →
  `solid`, per the registered initial value in fact 2.
- **`--tw-leading` reads** (`MantineListingCardPattern`, 6 sites) already carry literal fallbacks; collapse each to
  its fallback, exactly as R2 collapsed `--tw-duration`.
- **`--tw-ease` / `--tw-duration` reads** (`MobileBottomNavView:92`, `MantineListingCardPattern:220,226`) —
  R2 deliberately kept these outer hooks. They now go: keep the literal, drop the hook.
- **`scale: var(--tw-scale-x) var(--tw-scale-y)`** (`MobileBottomNavView:101`) → the literal `scale` value, with the
  three `--tw-scale-*` declarations removed.
- **Bookkeeping declarations that nothing in the file reads** (`--tw-font-weight`, `--tw-leading` where declared,
  `--tw-duration:.15s`) are deleted, not literalised — but **prove the "nothing reads it" claim per name and per
  file** before deleting, per `docs/agent-contract.md`'s absence-claim rule. A grep is discovery, not proof.
- **`--tw-gradient-from|via|to` inside `transition-property` lists** (5 files, fact 4). Removing a name from
  `transition-property` changes what transitions. Measure the computed `transition-property` before and after per
  file; if any of the three is actually set anywhere on that element's cascade, keep it and report why.
- **`MantineHomeSection` and `PopularLocationsView`** carry `--tw-*` only in **comments**. Update the comment text
  where it now describes something the file no longer does; change no declaration.

**Do not touch `src/app/globals.css`.** Do not fix any file outside fact 4's table.

### R6 — widen the scan to declarations and property-name lists

The scan must find a Tailwind-owned name that appears as a declaration (`--tw-shadow: …`) and as a bare name inside
a `transition-property`/`will-change` value list, not only inside `var()`. Baseline rows keep the
`{ file, property }` shape; a name found in more than one role in one file stays one row.

### R7 — document what was measured

Extend `docs/design-system.md` §23.7, do not rewrite it:

- The Category-C failure mode, with the §2/O-1 measured table. A Tailwind-owned property read through `var()`
  without the `@property` registration does not fall back — **the whole declaration is dropped.**
- The corrected ownership rule and why `globals.css` alone cannot be the ownership source (B-1, one sentence, with
  the corollary 724 ② reference §23.7 already carries).
- Delete or correct the sentence stating that `@theme inline` *is the reason* a name is not emitted. Fact 6 shows
  emission tracks whether the compiled output references the name; the executor's own session log already concedes
  the mechanism was not fully established. The same wrong causal claim is baked into the R2 comments in all five
  Category-A files — **correct it there too; those comments are what the next executor will read.**

### R8 — record, do not fix

Add one `docs/backlog.md` line for fact 8 (`page.tsx` TSX `var(--text-*)` references) and fact 9 (the chrome
stylesheets are clean today but unscanned) as Task 763 scope. No code change.

---

## 7. Sections of the original kickoff this brief supersedes

| Original section | Status |
|---|---|
| "Categories B, C, D — out of scope" | **Superseded** — C and D move into the fix (D762-1). B stays out (D762-3). |
| "Out of scope" item 1 | **Superseded** for C and D. |
| R1, "What it must detect" | **Superseded** by R4. |
| R1, plant table | **Superseded** by AC-R1/AC-R2; the Arm B label defect stands corrected by the executor. |
| R2, R3 | **Unchanged and satisfied.** R3 is extended by R7, not replaced. |
| Everything else, including "Do not touch `src/app/globals.css`" | **Unchanged and binding.** |

---

## 8. Current and required behavior

**Current, to preserve:** every surface in fact 4's table renders exactly as it does today. The nav's upward
shadow, its 2px focus ring, its `scale(0.95)` active state and its top border; `ListingCard`'s `.overlayFavorite`
`shadow-sm`; every `--tw-leading` line-height; `MantineListingCardPattern`'s hover and its `prefers-reduced-motion`
suppression; `HeroSearchView`'s `font-semibold`. **Required after:** identical rendered output, with no `--tw-*`,
bare `--spacing` or `--leading-tight` remaining in any CSS Module, and a gate that fails on both bypasses.

## 9. Positive and negative flows

**Positive flow:** a CSS Module reads a Tailwind-owned custom property → the gate fails with that exact
`{file, property}` named → replacing it with the literal it resolves to makes the gate pass and changes no rendered
value.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No validation path touched | Unchanged | N/A |
| Authorization/RLS | No | No action or route touched | Unchanged | N/A |
| Offline/network | No | No network layer touched | Unchanged | N/A |
| Concurrent writer | No | No data model touched | Unchanged | N/A |
| `prefers-reduced-motion` | **Yes** | `MantineListingCardPattern.module.css` | Hover suppression still fires; the registry row's assertion still holds | Computed-style probe under the emulated media feature, before and after |
| Gate bypass — author-writable source | **Yes** | R4 / B-1 | The `globals.css` silencer fails the gate | AC-R1 |
| Gate fail-open — Category B | **Yes** | R4 / B-2 | A new `var(--text-sm)` in a module fails the gate | AC-R2 |
| Gate fail-open — declaration role | **Yes** | R6 / E-1 | A new `--tw-shadow:` declaration fails the gate | AC-R3 |
| Registration loss | **Yes** | R5 / O-1 | No declaration in the 5 files depends on a Tailwind `@property` registration | AC-R5 |

## 10. Acceptance criteria

- **AC-R1 [R4]** — *Given* `--default-transition-duration: .15s` added to `globals.css`'s `@theme inline` and
  `var(--default-transition-duration)` restored in one CSS Module, *when* the gate runs, *then* it exits ≠ 0 and
  names that file and property. Revert; re-verify green. **This plant is the one the delivered gate passes.**
- **AC-R2 [R4]** — *Given* a new `var(--text-sm)` in a CSS Module, *when* the gate runs, *then* it exits ≠ 0.
  Revert; re-verify green.
- **AC-R3 [R6]** — *Given* a new `--tw-shadow: 0 0 red;` declaration and, separately, a new `--tw-gradient-from`
  entry in a `transition-property` list, *when* the gate runs, *then* each exits ≠ 0. Revert both; re-verify green.
- **AC-R4 [R4]** — the C-1 emission table exists, covers all 257 names, and the report states which ownership
  source was chosen and why, citing C-1's result.
- **AC-R5 [R5]** — `grep -rnE -- "var\(--tw-|--tw-[a-z-]+\s*:|var\(--spacing\)|var\(--leading-tight\)" src --include="*.module.css"`
  returns only comment lines. Quote the output in full; a non-empty non-comment line fails this AC.
- **AC-R6 [R5]** — a live computed-style probe, one element per changed file, before and after, records **zero
  delta** for `box-shadow`, `border-top-style`/`border-top-width`, `line-height`, `scale`, `font-weight`,
  `transition-property`, `transition-duration`, `transition-timing-function` — whichever apply to that element.
  Capture the *whole* computed string, not a substring match.
- **AC-R7 [R5]** — `docs/critical-flow-registry.md:57` (listing-card rendering) and `:70` (notifications panel)
  re-run and pass; name the row and the command. `MantineListingCardPattern`'s hover and `prefers-reduced-motion`
  assertions re-probed live.
- **AC-R8 [R4/R6]** — the baseline file matches the live scan exactly, the report states its count and derivation,
  and every row it gained relative to the delivered 28 is explained by R4's or R6's widening, not by a new
  reference.
- **AC-R9 [R7]** — §23.7 carries the measured Category-C table and the corrected ownership sentence; the five
  Category-A files' comments no longer state that `@theme inline` is the cause of non-emission.
- **AC-R10** — `npx tsc --noEmit`, `check:design-tokens --strict`, `check:css-vars`, `check:i18n`,
  `check:story-coverage`, `check:stories`, `build-storybook`, `npm run build` and the new gate all exit 0.
  `check:locale-leak` executed and attributed per D757-4a with its literal exit code.
- **AC-R11** — rendered evidence: `npm run screenshots:assert -- --mantine-only`, with the per-story verdicts for
  every story in fact 11 quoted from the manifest. Expected **zero delta**. Pre-existing failures must be
  identified by story name, not aggregated — the reviewer will check the FAIL and AMBIGUOUS listings separately.
- **AC-R12** — no file outside fact 4's table, the gate, the baseline, §23.7, the backlog and the session log is
  modified. Prove it from a pre-write `git status --porcelain` snapshot and the final one. The worktree starts
  **dirty** (10 `M`, 4 `??`, all belonging to Task 762's accepted work plus 3 pre-existing unrelated untracked
  paths — `src/hooks/useIsMobile.ts`, `docs/sessions/2026-05-31-task-306-fix*.md`); complete
  `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry.

## 11. QA profile and verification plan

`Q4 Release/Critical Flow` — two rows of `docs/critical-flow-registry.md` are in scope and a gate is claimed, so
the planted-violation failure proof is mandatory.

```
# C-1 first, before any edit
node <emission-census>                          # AC-R4, persisted table

# the four plants, each: plant -> gate -> revert -> gate
npm run check:tailwind-runtime-tokens           # AC-R1, AC-R2, AC-R3

# per-file capture, before and after, hash-verified byte restoration
#   AC-R6 computed-style probes; AC-R7 reduced-motion + hover

npx tsc --noEmit
npm run check:design-tokens -- --strict
npm run check:css-vars
npm run check:i18n
npm run check:story-coverage
npm run check:stories
npm run build-storybook
npm run build                                   # hard gate, exit 0 required
node scripts/check-locale-leak.mjs
npm run screenshots:assert -- --mantine-only    # AC-R11
npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx   # AC-R7
grep -rnE -- "var\(--tw-|--tw-[a-z-]+\s*:|var\(--spacing\)|var\(--leading-tight\)" src --include="*.module.css"
```

**Pre-plant census, per plant:** `tsc`, `check:design-tokens --strict`, `check:stories`, `npm run build` all green
under the planted state, proving no existing gate would have caught it. Quote the failing output verbatim for each
arm; revert and re-verify green, with the pre-plant `git hash-object` value recorded and the path absent from the
final `git status --porcelain`.

Retain everything under `docs/sessions/evidence/task762-r1/` — **not** `.screenshots/`, which is gitignored
(fact 10).

## 12. Completion report contract

Changed files · requirement IDs · every command with its actual output and exit code · the C-1 emission table and
the ownership source it justifies · all four plants with their failing output and pre-plant census · the fact-4
table re-measured after the fix · before/after computed-style values per file, whole strings · AC-R11 stated as a
diff outcome with per-story verdicts, not an aggregate count · the dirty-worktree manifest · evidence locations ·
assumptions · deviations · known limitations · anything not finished.

Take the `docs/backlog.md` line-count baseline from `git show HEAD:docs/backlog.md | wc -l` **before** editing.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.

## 13. Pre-read

`docs/agent-contract.md` · `docs/qa-profiles.md` · `docs/critical-flow-registry.md` rows :57 and :70 ·
`docs/design-system.md` §22.3, §23.6.b, §23.7 · `scripts/check-tailwind-runtime-tokens.mjs` and
`scripts/check-css-var-resolvability.mjs` · `docs/sessions/2026-08-21-task762-tailwind-runtime-tokens.md` ·
`tasks/Sprints/Sprint_62_kickoff_prompt_Task_762_tailwind_runtime_tokens.md` · this brief. Nothing else.

---

## FACTS

The 11 numbered items in §4, each with the command that produced it. The §2/O-1 probe is `EXECUTED`.

## INFERENCES

That all 185 `@theme inline` names die with Tailwind (§4, flagged). That flattening the two `box-shadow`
compositions is visually inert because the four extra layers are transparent — **AC-R6 must measure it, not assume
it.**

## UNKNOWNS

Which ownership source R4 will land on; C-1 decides it. Whether any `--tw-gradient-*` name in a
`transition-property` list is actually set on its element's cascade (R5 requires the per-file measurement).
Whether removing the `--tw-ease`/`--tw-duration` hooks changes any cascade contract — R2 kept them on the argument
that deleting a hook changes the contract; that argument was never measured and AC-R6 now must.

## CONFLICTS

**One, open: D762-3** — the Category B line. Recommendation: keep B out of this revision, in the gate but not in
the fix. Owner decides; nothing else in this brief depends on the answer.

---

**Task path:** `tasks/Sprints/Sprint_62_Task_762_revision_1_Category_C_And_Gate_Bypass.md`
**QA profile:** `Q4 Release/Critical Flow`
**Ambiguous or conflicting requirements:** D762-3 only.
**Owner decision still needed:** D762-3.
