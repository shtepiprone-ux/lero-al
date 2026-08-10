# Task 700 — CSS custom-property resolvability gate (Sprint 46.3)

**Kickoff path:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_700_CssVarResolvabilityGate.md`
**Sprint:** 46 — ListingCard de-Tailwind + overlay exit, order **46.3**
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`
**Filed:** 2026-08-10, after 702 landed as the sprint's second task

---

## 0. This task was re-scoped before it was written — read this first

`docs/backlog.md` reserved 700 as: *"General `@theme`-dependency gate: fail when a `.module.css` consumes an
`@theme` var whose last Tailwind-utility consumer disappears."*

**That hazard does not exist in this repository.** It was measured on 2026-08-10 against the real production bundle
and falsified. Writing the reserved gate would have shipped a gate that cannot fail — the exact defect Sprint 54
rejected three tasks for. The owner authorized this re-scope on 2026-08-10 after seeing §3.1's measurements.

The retention rule Tailwind v4.3.0 actually applies is in §3.1. The hazard that **is** real, and what this task
gates, is in §3.2.

---

## 1. Mode and task type

Implementation task. Type: **Governance / CI gate** — authors a new blocking check. No product code, no UI.

D28/D34 do not bind this task; it changes no styles. **M1/M2/M4/M5 binds it hard:** a gate is not delivered until
it has been shown failing on a planted violation and passing on controls.

---

## 2. Objective

Add `scripts/check-css-var-resolvability.mjs` and wire it into CI: **every `var(--x)` in the shipped CSS that names a
custom property this project owns must resolve to a declaration that also ships.** Baseline is **0** violations, and
the gate must be proven able to fail.

This is a build-output invariant, not a source heuristic. It therefore catches the whole class — Tailwind's
`@theme` retention changing under an upgrade, a `@source not` exclusion hiding the last consumer, a token moved out
of `@theme` (Task 690's exact move), a rename applied in one place only — without encoding any single mechanism.

---

## 3. Verified context

Every figure below was measured on **2026-08-10** against `.next/static/css/*.css` from the build at `0dac78755`
(6 files, `e55fe1d775976885.css` = Tailwind's own output, `fa22169bb7793d5f.css` = the CSS-Modules chunk) and against
`src/app/globals.css`. **Re-derive all of it before writing code** — §14.9 is not optional, and this kickoff's own
numbers are not exempt.

### 3.1 The reserved premise, falsified — Tailwind v4 keeps a `@theme` var alive for ANY `var()` reference

`globals.css` declares **191** custom properties inside theme blocks: **190** in `@theme inline` (`:41`) and **1** in
the plain `@theme` at `:31` (`--breakpoint-notification-compact`). In the shipped bundle's `@layer theme`:

| | count |
|---|---:|
| declared in `@theme` / `@theme inline` | **191** |
| emitted in the shipped `@layer theme` | **50** |
| **dropped** (tree-shaken away) | **141** |
| dropped **that have any `var()` reference in `src/`** | **0** |

Tree-shaking is real and aggressive — 141 of 191 are gone. But **not one** dropped variable is referenced by
anything in `src/`. Conversely, **19** emitted variables have *no Tailwind-utility consumer at all* and are kept
alive **solely by a `var()` reference inside a `.module.css`** — verified per-file, e.g. `var(--color-muted-foreground)`,
`var(--space-2-5)`, `var(--text-2xs)`, `var(--color-badge-premium)` and `var(--shadow-listing-card-elevation-lg)` occur
**zero** times in `e55fe1d775976885.css` and only in `fa22169bb7793d5f.css`.

**Two natural experiments already in the repo settle this without a test build:**

| Tokens | `var()` references in `src/` | Shipped? |
|---|---|---|
| `--space-0-5` · `--space-1-5` · `--space-3-5` | none | ❌ dropped |
| `--space-2-5` | exactly one, `FooterView.module.css` | ✅ emitted |
| `--text-2xl` · `--text-3xl` · `--text-4xl` · `--text-5xl` | `page.tsx` | ✅ emitted |
| `--text-2xl--line-height` and its three companions | none | ❌ dropped |

Four identically-shaped spacing tokens differing only in whether a `.module.css` names one. **A `.module.css`
reference is itself a consumer.** The reserved hazard — module survives, its var disappears — cannot occur.

**Control, confirming the `inline` semantics rather than assuming them:** `--color-status-info` is dropped, yet
`bg-status-info/80` works, because `@theme inline` substitutes the value instead of emitting the alias —
`.bg-status-info\/80{background-color:var(--status-info)}`, the `:root` token, not the `--color-*` one. This also
corrects **Task 702 §3.6**, which listed `--color-status-info`/`--color-status-rented` as "safe, 9 consumers": they
are safe, but because no one needs them, not because consumers keep them. Note it in the report; 741 inherits it.

### 3.2 The hazard that IS real — and why it needs an output-side gate

Retention depends entirely on Tailwind's scanner seeing the literal text `var(--x)` in a scanned file. Everything
that hides that text breaks the chain silently, with no build error and no type error:

- **`@source not` exclusions.** `globals.css:11-25` excludes `docs/`, `tasks/` and `scripts/`. The `scripts/`
  exclusion (Task 696) was added *because* `scripts/__tests__/` naming a utility literally could keep it alive after
  its last real consumer was gone — the comment at `:20-24` says so and names this task.
- **Task 690's measured regression**, recorded in `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` and
  summarized at `globals.css:70-81`: non-Tailwind `var(--color-overlay*)` consumers went stale when no
  `bg-overlay*` utility survived the scan. D19 fixed it by *duplicating* the pair into `:root` — a manual belt-and-
  braces that nothing currently verifies stays in place.
- **Dynamic construction.** Measured today: **zero** occurrences of `var(--${…})`-style construction in `src/`. That
  is the current state, not a guarantee; the gate must keep it true.

None of these is detectable from the source side without re-implementing Tailwind's scanner. All are trivially
detectable from the output side: the reference is in the shipped CSS and its declaration is not.

### 3.3 Why the naive gate is unusable — measured, not guessed

Across all six shipped CSS files: **698** `var()` references without a fallback, **232** with one, **1178** declared
properties, **80** `@property` registrations. A naive "every `var()` must resolve" gate reports **112 violations on a
clean tree** — and every one is a Mantine runtime variable set through inline styles, never present in static CSS:
`--app-shell-navbar-width`, `--slider-thumb-size`, `--table-max-height`, `--tabs-color`, `--mantine-color-brand-0…9`,
and 100 more.

**The gate must therefore be scoped by ownership**, and ownership must be a property the gate computes, not a list an
author maintains — the 724 F1 / 740 rule. The computable definition: **a name is owned iff `src/app/globals.css`
declares it.** That yields **260** owned names, of which **78** are referenced somewhere in the shipped CSS and
**56** are referenced from `src/`.

**Scoped baseline, both directions: 0 unresolved.** That is the number the gate must reproduce.

### 3.4 Two parser requirements, both found by measurement

1. **Comments must be stripped before scanning.** Five names look like unresolved references but exist only inside
   prose comments describing Mantine's internals: `--ai-bg` (`LightboxView.tsx:33`), `--sc-label-color`
   (`input-chrome.css:311`), `--tabs-color` (`input-chrome.css:349`), `--mb-z-index`
   (`ListingGallery.portal.smoke.test.tsx:107`), `--button-hover`. A regex over raw text reports all five. A gate
   that fires on a comment will be silenced by the next author, which is how a gate dies.
2. **`@property`-registered names are resolvable even with no declaration.** 80 of them, including the whole
   `--tw-shadow`/`--tw-ring-*` family that `ListingCard.module.css` and `MobileBottomNavView.module.css` depend on
   (Task 702 C1). Treat an `@property` registration as a declaration or the gate false-positives on landed D28 work.

### 3.5 Where it runs in CI — measured, no new build

`.github/workflows/governance-pr.yml` has four jobs. Three (`rendered-proof`, `homepage-grid`, `locale-leak`) run
`build-storybook`; the `governance` job runs no build at all. **`click-shield` is the only job that runs
`npm run build`** (`:306`), so it is the only one whose workspace contains `.next/static/css`. Add the step there,
after the build and before the server start. **No new job, no second build** — the constraint Task 701 was held to.

### 3.6 Precedent to copy

- `scripts/check-homepage-grid.mjs` — the `--verify-gate` self-test convention, and its header's ported-invariant
  provenance style.
- `scripts/check-design-tokens.mjs` — strict/report mode split and the violation-report format.
- `scripts/__tests__/` — the gate-unit-test location the `governance` job already runs (`:39`).

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.2 | `scripts/check-css-var-resolvability.mjs` exists; reports every shipped `var(--owned)` with no shipped declaration and no `@property` registration | P0 | AC1 | Confirmed |
| R2 | §3.3 | Ownership is computed from `globals.css` at run time — **no hardcoded name list, no allowlist file** | P0 | AC2, code inspection | Confirmed |
| R3 | §3.3 | On the current tree the gate reports **0** violations and exits 0 | P0 | AC3 | Confirmed |
| R4 | §3.4 | Comments are stripped before scanning; `@property` names count as declared | P0 | AC4 | Confirmed |
| R5 | M1/M2/M4/M5 | `--verify-gate` self-test with **two** planted violations shown FAILING and **two** controls shown PASSING | P0 | AC5 | Confirmed |
| R6 | §3.4 | Fallback-bearing references (`var(--x, y)`) are reported separately and are **not** blocking | P1 | AC6 | Confirmed |
| R7 | §3.5 | Wired into the `click-shield` job after `npm run build`; `package.json` gains the two scripts | P0 | AC7 | Confirmed |
| R8 | Standing | `npm run build` exit 0; no product file changed | P0 | AC8 | Confirmed |
| R9 | Backlog rules | Concise `docs/backlog.md` update + session log | P1 | AC9 | Confirmed |
| R10 | §3.1 | Report states whether §3.1's four measurements reproduced, and flags the 702 §3.6 correction for 741 | P1 | AC10 | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** The gate reads the build output, so it is only as current as the last `npm run build`. It must **fail loudly
  if `.next/static/css` is absent or older than `src/app/globals.css`**, never pass silently. This is R1's zero/empty
  case and the most likely way for this gate to become a lifeline.
- **A2.** `:root` blocks outside `@theme` are part of ownership — `--overlay`/`--overlay-foreground` are declared in
  both (D19) and must resolve either way.
- **OQ1 — none open.** The scope decision was the re-scope itself, settled in §0 by owner decision 2026-08-10.

---

## 6. Pre-read rule bundle

Always Required: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (scan only — confirm explicitly that **no** row is affected).

Governance/gate path: `docs/qa-rules.md` · `docs/orchestrator-procedures.md` → "Detector-aware requirements and
migrations".

Task-specific, required:

- `src/app/globals.css` `:1-100` and every `:root` block — the ownership source.
- `scripts/check-homepage-grid.mjs` `:1-60` (header + `--verify-gate` convention) and its self-test section.
- `scripts/check-design-tokens.mjs` — report format and strict-mode exit behavior.
- `.github/workflows/governance-pr.yml` `:260-330` — the `click-shield` job.
- `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` §F1 — the regression this gate would have caught.

Do **not** read the legacy `docs/design-system.md` bundle, the UI rule bundle, or any Storybook document. **No story
is touched by this task** — the permanent-story creation gate is `N/A`, not satisfied-by-argument.

---

## 7. Scope

| Path | Action |
|---|---|
| `scripts/check-css-var-resolvability.mjs` | **create** — the gate + `--verify-gate` self-test |
| `scripts/__tests__/css-var-resolvability.test.ts` | **create** — unit tests for the parser (comment stripping, fallback split, `@property`) |
| `package.json` | **modify** — add `check:css-vars` and `check:css-vars:verify` only |
| `.github/workflows/governance-pr.yml` | **modify** — one step in the `click-shield` job |
| `docs/backlog.md` | **modify** — concise state |
| `docs/sessions/2026-08-10-task700-css-var-resolvability-gate.md` | **create** — session log |

---

## 8. Out of scope

- **Every file under `src/`.** This task changes no product code, no CSS, no token. If the gate finds a real
  violation, **report it and stop** — fixing it is a new number, not this task.
- Changing `@source not` directives, `@theme`, `@theme inline`, or the D19 `:root` duplication.
- The overlay exit condition (**695**) and 692's sync gate — 695 owns those; do not update or delete either.
- `CLOSED_OVERLAY_STYLE` (**741**) and the pattern files (**691**).
- Any Storybook story, viewport, or rendered matrix. This gate needs none.
- Deleting the 3 consolidated probes — that is owner cleanup step 3.

---

## 9. Current and required behavior

**Current.** Nothing verifies that a shipped `var()` resolves. Task 690 shipped exactly this defect and it was found
by eye. D19's duplicate `:root` copy is held in place by a comment asking future authors to keep two blocks in sync.
`globals.css:20-24` names this task as the intended detector.

**Required.** `npm run check:css-vars` exits 0 on the current tree with `0 violations` over 260 owned names, exits 1
with a precise per-reference report when any owned `var()` loses its declaration, and `--verify-gate` demonstrates
both outcomes without leaving a modified file behind.

---

## 10. Implementation requirements

1. **Re-derive §3.1 and §3.3 first.** Run `npm run build`, then reproduce the 191/50/141/0 split, the 260/78/56
   ownership counts, and the 0 baseline. **If any disagrees with this document, the build wins** — record the
   discrepancy in the report and proceed from the measured value.
2. **Ownership is computed, never listed** (R2). Parse `globals.css` for every `--x:` declaration in `@theme`,
   `@theme inline` and every `:root` block. A hardcoded array or a JSON allowlist fails R2 outright.
3. **Strip CSS comments before scanning** (§3.4.1), and split `var(--x)` from `var(--x, fallback)` — the second is
   R6's report-only tier.
4. **Treat `@property --x` as a declaration** (§3.4.2).
5. **Fail closed on missing input** (A1): absent `.next/static/css`, or a bundle older than `globals.css`, is a
   non-zero exit with an explicit message — never a silent pass.
6. **`--verify-gate` (R5) plants into a temp copy of the inputs, never into the real tree.** Two planted violations,
   each shown FAILING: **P1** rename an owned token's declaration in the globals copy while leaving its consumer
   (mirrors a half-applied rename); **P2** delete an owned token's declaration entirely (mirrors Task 690's move out
   of `@theme`). Two controls, each shown PASSING: **C1** a fallback-bearing reference must not block (R6);
   **C2** an unowned Mantine runtime name such as `--app-shell-navbar-width` must not be reported at all (R2/§3.3).
   **Before planting, prove no further lifeline** — confirm the chosen token has no other declaration in the bundle,
   or the plant proves nothing.
7. Do not add an allowlist, a baseline file, or a `continue-on-error` to the CI step. This gate starts at 0 and stays
   blocking.

---

## 11. Positive and negative flows

**Positive.** A developer moves a token out of `@theme`, or renames it in `globals.css` only; CI fails on the
`click-shield` job naming the exact unresolved reference and the file it ships in.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | No form, action or schema | N/A | — |
| Authorization/RLS | **No** | No route or table | N/A | — |
| Offline/network | **No** | Build-time script | N/A | — |
| Concurrent writer | **No** | No data model | N/A | — |
| **Missing/stale build output** | **Yes** | A1, R1 | Non-zero exit, explicit message; never a silent pass | AC1 + the self-test's empty-input case |
| **Zero owned tokens parsed** | **Yes** | R2 — a `globals.css` parse failure would yield an empty set and a vacuous pass | Non-zero exit when the owned set is empty | AC2 |
| **Reference inside a comment** | **Yes** | §3.4.1, 5 measured cases | Not reported | AC4 + unit test |
| **Fallback-bearing reference** | **Yes** | §3.4, 232 measured | Reported in the non-blocking tier only | AC6 + control C1 |
| **Unowned Mantine runtime var** | **Yes** | §3.3, 112 measured | Not reported at all | AC2 + control C2 |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the current tree after `npm run build`, *when* `npm run check:css-vars` runs, *then* it
  exits 0 and prints the owned-token count, the reference count and `0 violations`. *When* `.next/static/css` is
  absent or older than `globals.css`, *then* it exits non-zero with an explicit message.
- **AC2 [R2]** — *Given* the script source, *then* no hardcoded token-name array and no allowlist file exists; the
  owned set is parsed from `globals.css` at run time, and an empty owned set exits non-zero. `--app-shell-navbar-width`
  appears in no report.
- **AC3 [R3]** — *Given* the current tree, *then* the owned count is **260**, references-in-shipped-CSS **78**, and
  violations **0**. *(Re-measure per §10.1; if the tree has moved, quote the new numbers and say so.)*
- **AC4 [R4]** — *Given* the five §3.4.1 comment-only names, *then* none is reported; *given* an `@property`-only name
  such as `--tw-shadow`, *then* it is treated as declared. Both covered by `scripts/__tests__/`.
- **AC5 [R5]** — *Given* `npm run check:css-vars:verify`, *then* P1 and P2 each produce a **FAIL** with the planted
  name quoted, C1 and C2 each **PASS**, the run exits 0 overall, and `git status --porcelain` is unchanged
  afterwards — quote it.
- **AC6 [R6]** — *Given* the 232 fallback-bearing references, *then* they appear in a separate non-blocking section
  and do not affect the exit code.
- **AC7 [R7]** — *Given* `governance-pr.yml`, *then* the new step sits in the `click-shield` job after
  `npm run build`, with no `continue-on-error`, and `package.json` gained exactly the two named scripts.
- **AC8 [R8]** — `npm run build` exits 0; `git status --porcelain` lists only the six §7 paths.
- **AC9 [R9]** — `docs/backlog.md` updated concisely; session log at the §7 path holds every transcript.
- **AC10 [R10]** — the report states whether §3.1's four measurements reproduced, and restates the 702 §3.6
  correction (`--color-status-info` is dropped, and is safe for the opposite reason 702 recorded).

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`**, per `docs/qa-profiles.md`: *"planted-violation failure proof when a gate is
claimed."* This task's entire deliverable is a gate, and its baseline is 0 — so nothing but a planted violation can
show it works. Not `Q3`: no visual surface, no story, no rendered matrix. Not `Q2`: a gate that cannot fail is the
Sprint 54 defect class.

`docs/critical-flow-registry.md`: scan and confirm **no** row is affected — this task adds a check and changes no
governed behavior.

### 13.2 Commands — record the actual result of each

1. `git --no-optional-locks status --porcelain` at I0; backlog baseline from
   `git show HEAD:docs/backlog.md | wc -l` **before** any edit.
2. `npm run build` — **before** writing code, to produce the bundle §10.1 re-derives from; and after, exit 0.
3. The §3.1/§3.3 re-derivation: owned count, emitted/dropped split, references, violations. Persist the transcript.
4. `npm run check:css-vars` — exit 0, `0 violations`.
5. `npm run check:css-vars:verify` — P1/P2 FAIL, C1/C2 PASS, overall exit 0, then `git status --porcelain` to prove
   the tree is unchanged.
6. Negative-input runs: with `.next` renamed away, and with a `globals.css` copy whose theme blocks are emptied —
   both must exit non-zero. **Restore both and prove restoration** with `git hash-object` before continuing.
7. `npx vitest run scripts/__tests__/css-var-resolvability.test.ts`, then the full `npx vitest run`.
   **Known, not a regression:** the full-run-only timeout class — Task 702 observed
   `RangeDatePickerLocalization` · `saveSavedSearch.dedup` · `filtersRangeDatePicker.smoke` ·
   `filtersPanelShell.smoke`, all 4 passing in isolation (**that set is wider than the trio Task 692 recorded — 702
   N1**). If one appears, re-run it in isolation and report both results. Report the run you observed.
8. `npm run typecheck` — exit 0.
9. `npm run check:design-tokens` · `check:stories` · `check:mojibake` · `check:file-integrity` — each unchanged.
   **Not required:** any Storybook or rendered command. This task ships no CSS; `screenshots:assert` would prove
   nothing here, and running it is not evidence of diligence.

Any of these that cannot run in your environment is a **`PARTIALLY IMPLEMENTED`**, not a pass.

---

## 14. Completion report contract

Report as `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approve.

1. Changed files and why, reconciled against the **actual final** `git status --porcelain` — quote the final one.
2. Requirement IDs completed; any not completed, with why.
3. Every §13.2 command with its **actual** result.
4. The complete new gate file and the CI diff.
5. The `--verify-gate` transcript showing **P1 FAIL, P2 FAIL, C1 PASS, C2 PASS**, plus the post-run
   `git status --porcelain` and the `git hash-object` restoration witnesses from §13.2.6.
6. The §10.1 re-derivation table against §3.1/§3.3, stating explicitly which numbers matched and which moved.
7. The no-further-lifeline proof for each planted token (§10.6).
8. Confirmation that **no** file under `src/` was changed.
9. Assumptions, deviations, limitations. **This kickoff's own measured facts are not exempt** — §3.1, §3.3, §3.4 and
   §3.5 were all measured on 2026-08-10 and every one is yours to re-check. **Seven consecutive kickoffs have shipped
   a factual defect; 702's three are recorded as C1–C3 in its own kickoff, and the pattern in every case was a
   *derived* claim about what another file or flag does, not a bad measurement.** §3.5's claim that `click-shield` is
   the only building job, and §3.4's claim that five names are comment-only, are exactly that shape. Open the file.
10. Confirmation that no `docs/critical-flow-registry.md` entry is affected.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every count, path, line number and CI job is in §3 |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1–R10 → AC1–AC10 |
| Scope names what must not change | **Yes** — §8, and R8's "no product file" is an AC, not a hope |
| Comparator shown able to fail | **Yes** — R5/AC5 is two planted failures plus two passing controls; the gate's baseline is 0, so this is the only possible proof |
| Pre-plant census / no further lifeline | **Yes** — §10.6, required before each plant and reported at §14.7 |
| No claimed command, file, value or behavior went uninspected | **Partial, and stated rather than asserted.** Every §3 number was produced by running the measurement today. Three claims are *derived* and are flagged for re-check in §14.9: `click-shield` being the only building job, the five comment-only names, and `@property` coverage of the `--tw-*` family. 702's C1–C3 were all of this shape, so they are named rather than trusted |
| Owner-only exceptions traceable | **Yes** — the §0 re-scope is an owner decision taken 2026-08-10 on the §3.1 evidence; no other exception is claimed |
| Sprint assignment | **Yes** — Sprint 46, order 46.3, filed inside `tasks/Sprints/` |
| Permanent Storybook creation gate | **N/A** — no story is added, extended or probed; §6 forbids reading the Storybook bundle and §13.2.9 forbids running rendered commands as filler |
| No number duplicated | **Yes** — 700 keeps its number under the §0 re-scope; the §13.2/AC pairing defect 702 exposed (C3) is **742**, not folded in here |
| Dirty-worktree manifest | **Conditional** — the tree was clean at `0dac78755`. If `git status` is not clean at I0, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry before editing |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`. Take the §13.2 step-1 baseline and run
`npm run build` **before** writing any code, re-derive §3.1/§3.3 from that build, and treat §8 as a fence: if the
gate finds a real violation on the current tree, that is a finding to report, not a file to fix.
