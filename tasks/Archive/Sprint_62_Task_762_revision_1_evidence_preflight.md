# Task 762 Revision 1 — completed evidence-first preflight

Completed **before** publication of `Sprint_62_Task_762_revision_1_Category_C_And_Gate_Bypass.md`.

## 0. The reviewer defect this preflight exists to prevent repeating

The first review of Task 762 issued `APPROVED WITH NOTES` while its own notes recorded (a) that the owner's stated
acceptance bar — `--tw-*` removed — was not met, and (b) two reproduced gate bypasses. Both were written down and
then waived to a follow-up task.

`docs/agent-contract.md` §9a is explicit: *"An unmet, changed, or unverified primary acceptance criterion blocks
`APPROVED` and `APPROVED WITH NOTES`. A planned follow-up is not evidence and does not repair the reviewed task's
status."* The verdict was invalid on the reviewer's own evidence, not on new information.

**Rule binding on every review I issue here:** a reproduced bypass of the control a task exists to build is a
blocking finding, never a note — regardless of whether the task's own kickoff scoped it out, because the kickoff is
the reviewer's own artifact and cannot authorise the reviewer to accept less than the rule requires.

Second, narrower: the withdrawn verdict carried no owner-run commit/push handoff, which `CLAUDE.md`'s ALWAYS-DO
rule requires after an approval. The omission was a signal the verdict was not held with confidence, and it was
not acted on. A verdict that cannot carry its mandatory handoff is not the verdict that should have been written.

## 1. Scope and execution state

| Field | Value |
|---|---|
| Task / review | 762 Revision 1 |
| Mode | `TASK DESIGN` |
| Execution state | **`dirty with manifest`** — 10 `M`, 4 `??` at filing time |
| Reused artifacts | Task 762's accepted R2 diff, `docs/sessions/evidence/task762/*`, the delivered gate and baseline. **Read-only for this brief.** |
| Must not be overwritten | `docs/sessions/evidence/task762/` (the accepted Category-A evidence), the five files' R2 changes |
| Owner decision required? | **One open: D762-3** (Category B in or out). Recommendation recorded; the brief does not branch on it. |

## 2. Requirement-to-evidence map

| Requirement | Observable claim | Source inspected | Producing command | Status |
|---|---|---|---|---|
| O-1 | Category C's failure removes the declaration, not just the value | two Chromium documents differing only in `@property` rules | `getComputedStyle` via Playwright/Chromium | **`EXECUTED`** — reviewer-run, output quoted in the brief |
| O-1 | The repo already documented the `@property` dependency | `ListingCard.module.css:24-29` | file read | **`VERIFIED`** |
| O-2 / B-1 | One `globals.css` line silences the gate | isolated copy of `src` + `scripts` | `node scripts/check-tailwind-runtime-tokens.mjs` → exit 0 | **`EXECUTED`** |
| O-2 / B-2 | New `var(--text-sm)` in a module passes | same | same → exit 0 | **`EXECUTED`** |
| E-1 | Declarations and property-name lists are outside the scan | `findVarReferenceNames` source + baseline contents | read + `grep` cross-check | **`VERIFIED`** |
| §4 fact 1 | `@property --tw-*` is compiler-generated | `node_modules/tailwindcss/*.css` | `grep -c "@property --tw-"` → 0/0/0/0 | **`VERIFIED`** |
| §4 fact 4 | Per-file Category C/D inventory | 9 `.module.css` files | line-by-line read, not a regex count | **`VERIFIED`** |
| §4 fact 5 | Missed names are in Tailwind's `theme.css` | `node_modules/tailwindcss/theme.css` | per-name `grep -c` | **`VERIFIED`** — 7/7 spot-checked, **not** exhaustive |
| §4 fact 7 | 185 + 72 = 257, no overlap | `globals.css` | brace-balanced block parse | **`VERIFIED`** |
| §4 `INFERENCE` | All 185 `@theme inline` names die with Tailwind | built CSS | layer attribution on the minified bundle | **`UNKNOWN`** — unreliable for `--background`/`--primary`; delegated to checkpoint C-1 as a *measurement*, and labelled as such in the brief |
| R5 | Flattened `box-shadow` is visually inert | — | — | **`ASSUMED`** — AC-R6 must measure; the brief says so explicitly |

## 3. Unwaivable rule-compliance ledger

| Rule source and clause | Applicability | Mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `agent-contract.md` §9a | A verdict is being issued | Unmet primary AC blocks `APPROVED`/`APPROVED WITH NOTES`; a follow-up is not evidence | The brief issues `NEEDS REVISION`; prior verdict withdrawn in §0 and in the brief's header | `COMPLIANT` |
| `agent-contract.md` §9a (ledger) | Verdict is a rejection | The retained JSON ledger is the approval instrument | No ledger filed; all 8 in `docs/reviews/` are approvals. Stated in the brief's header rather than silently omitted | `COMPLIANT` |
| `agent-contract.md` §1 | Fix scope grows to Category C | Change only what the task requires | R5 is bounded to fact 4's table; `globals.css` stays excluded; B stays out pending D762-3 | `COMPLIANT` |
| `agent-contract.md` §9 | Non-Q0 task | Final `npm run build`, exit 0 | AC-R10 + §11 | `COMPLIANT` |
| `agent-contract.md` §15 | `critical-flow-registry.md:57`, `:70` in scope | Baseline + automated regression evidence | AC-R7, named row + named command | `COMPLIANT` |
| `agent-contract.md` §16 | Visual chrome (shadow, border, scale) in scope | TailAdmin provenance for styling | **Not required for R5**: every value is *reproduced from the element's own current computed style*, not chosen. This is the same basis §23.7 and Task 757R already use. Category B, where a value would be *chosen*, is held out by D762-3 for exactly this reason | `COMPLIANT` |
| `agent-contract.md` §16c | Canonical Mantine Stories exist for the changed artifacts | Story preserved/updated, not bypassed | Fact 11 names the existing story per file; **no story is created or extended** — every probe is reversible, with `git hash-object` restoration required by §11 | `COMPLIANT` |
| `create-task` permanent-story gate | No permanent story added | Reversible probe + restoration evidence | §11 requires the pre-probe hash and absence from final `git status --porcelain` | `COMPLIANT` |
| `qa-profiles.md` | Two critical-flow rows touched | `Q4` | Selected; planted-violation proof mandatory, 4 arms specified | `COMPLIANT` |
| `CLAUDE.md` git policy | Task/doc artifacts created | Explicit-path owner-run commit handoff | Emitted with the brief; **push withheld** — no approved review exists | `COMPLIANT` |
| `CLAUDE.md` sprint rule | Revision of an existing task | Lives under its sprint, never `tasks/` root | Saved under `tasks/Sprints/`, Sprint 62 table updated | `COMPLIANT` |
| `backlog` corollary 724 ② | A gate is being specified | The exemption is a condition the gate evaluates, not one the author writes | R4 + AC-R1 make the author-written exemption fail | `COMPLIANT` |

No row is `BLOCKED`. D762-3 is an open *scope* decision, not an unresolved rule.

## 4. Executable task contract

### 4.1 One active execution route

| Field | Value |
|---|---|
| Task | 762 Revision 1 |
| Active route | Control first (R4/R6), then fix (R5), then docs (R7/R8) — the sprint's binding order, unchanged |
| Decision source | D762-1, D762-2, owner, 2026-08-21 |
| Starting worktree | dirty with manifest (AC-R12) |
| Allowed final write set | `scripts/check-tailwind-runtime-tokens.mjs` · `scripts/tailwind-runtime-token-baseline.json` · the files in §4 fact 4's table · `docs/design-system.md` §23.7 · the five Category-A files' comments (R7) · `docs/backlog.md` · `docs/sessions/2026-08-21-task762-r1-*.md` · `docs/sessions/evidence/task762-r1/**` |
| Blocked decision | None. D762-3 widens R5 if answered "in"; it does not branch the route |

### 4.2 Checkpoint matrix

| # | Preconditions | Writes allowed | Observable result | Producer / artifact | Comparator and failure behaviour |
|---|---|---|---|---|---|
| C-1 | none | evidence only | emission + layer per name, all 257 | census script → `evidence/task762-r1/emission-census.json` | count ≠ 257 → `BLOCKED`; unproducible → `BLOCKED`, no fallback |
| C-2 | C-1 reported | gate + baseline | gate exits 0 on the unmodified tree | `check:tailwind-runtime-tokens` | exit ≠ 0 → fix before proceeding |
| C-3 | C-2 green | plant, then revert | 4 plants each exit ≠ 0; 4 reverts each exit 0 | gate stdout per arm | any arm exit 0 → AC fails, `PARTIALLY IMPLEMENTED` |
| C-4 | C-3 | evidence only | per-file computed styles, BEFORE | Storybook + Playwright → `computed-before.json` | missing element for a changed file → `BLOCKED`, not skipped |
| C-5 | C-4 captured | the 5 CSS files | R5 applied | the diff | — |
| C-6 | C-5 | evidence only | per-file computed styles, AFTER | same harness → `computed-after.json` | any non-empty delta → report as a finding, do not narrate it away |
| C-7 | C-6 zero-delta | baseline | baseline == live scan | gate | mismatch → exit 1 |
| C-8 | C-7 | docs, backlog, session log | AC-R9 text present | read-after-write | — |
| C-9 | C-8 | none | full gate suite green, build exit 0 | §11 command list | any non-zero → `PARTIALLY IMPLEMENTED`, never a confidence claim |

Empty-state check: an empty baseline is valid only if the live scan is also empty; C-7's comparator is set
equality in both directions, so a valid zero state passes and a vacuous parse (0 owned names) is already fatal in
the delivered gate and stays fatal.

Creation-order check: `evidence/task762-r1/**` and the new session log are **not** under `src/**/*.module.css` and
cannot enter the gate's own scan. `docs/backlog.md` is written after C-7, so it cannot perturb the baseline count.

### 4.3 Counterexample trace

| Claim | Counterexample | Evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route / write set | Executor also edits `globals.css` to satisfy R4 | brief forbids it; AC-R12 status comparator | rejected | `ANALYTICAL` |
| Stateful baseline | baseline missing entirely | delivered gate treats missing file as `[]` → every reference becomes new debt → exit 1 | fail-closed | **`EXECUTED`** (reviewer-read code path) |
| Status assertion | pre-existing `??` paths mistaken for this task's | 3 named in AC-R12, mtimes 2026-08-20 19:27, before the 762 session | comparator excludes them | **`EXECUTED`** |
| New gate | the exact plant the delivered gate passes | AC-R1's `globals.css` silencer | must now fail | `ANALYTICAL` — the executor must run it; the reviewer has proven only that it currently **passes** |
| Task-created artifact in a baseline | evidence file counted as a module | evidence lives outside `src/` | no count change | `ANALYTICAL` |

### 4.4 Publication gate

This contract was rebuilt from the final brief text, not from drafting notes. Every checkpoint names a producer,
an artifact and a failing comparator. The one `ASSUMED` row (flattened `box-shadow` inertness) and the one
`UNKNOWN` (C-1's subject) are both surfaced in the brief's own `INFERENCES`/`UNKNOWNS` sections and are assigned to
measurements, not to the executor's judgement.

The task author may not approve the resulting work. The reviewer of 762 Revision 1 must rebuild this matrix
independently before any verdict — and, per §0, must treat a reproduced bypass as blocking.
