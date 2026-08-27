# Task 771 — Global Tailwind retirement readiness: the decision record, not the deletion

**Sprint 65** — Homepage finishes the Tailwind exit · **Level 4** · Filed 2026-08-27
Predecessors: 766 (L1) · 767 (L2) · 768 (D65-D) · 769 (scanner) · 770 (L3) — all approved.
Kickoff path: `tasks/Sprints/Sprint_65_kickoff_prompt_Task_771_Global_Tailwind_Retirement_Readiness_Decision.md`

> ⚠️ **AMENDMENT 1 — 2026-08-27, owner decision pass.** This kickoff was filed hours before the owner **retired
> Task 667**, closed **Sprint 59** as *mechanism rejected*, and **accepted the absence of route-composition
> certification as a known limitation** (`docs/maintenance-playbook.md` §14.3). This file has been amended in place:
> **B5 is no longer a blocker class.** It is recorded as an accepted limitation. Task 667 has been removed from the
> blocker classes, the acceptance criteria, the checkpoint matrix, the facts/unknowns and the verdict formula.
> **The verdict `NOT_READY` now rests on B1–B4 alone**, which §3.3 already showed to be each independently
> sufficient. Nothing else about the task changed: still read-only, still `Q0`, still no removal authority.
>
> **This task is dispatchable as amended.**

> ⚠️ **AMENDMENT 2 — 2026-08-27, execution-environment correction.** `npx.cmd rg` resolves to the unrelated
> npm package `rg@0.0.2` in this environment, not Ripgrep. The B2/B4 commands in §10 now invoke the available
> native `rg.exe` directly. This changes neither their patterns, roots, globs, expected values, nor the verdict
> formula. Checkpoint 0–6 transcripts are staged outside the repository, then copied byte-for-byte to the stated
> evidence paths only after every clean-tree measurement completes; this preserves the required empty porcelain at
> the true start and after the B3 probe.

> **This task deletes nothing.** No `@import`, no `@apply`, no `@source`, no `@custom-variant`, no dependency,
> no PostCSS plugin, no token, no component. It has no `READY` verdict available to it. Its single product is a
> written, re-measured decision record at one citable SHA.

---

## 1. Mode and task type

| Field | Value |
|---|---|
| Mode | Read-only investigation + decision record (governance) |
| Task type | Q0 Docs/Governance — `docs/qa-profiles.md` |
| Sprint | 65, Level 4 (`tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md` §2, §6) |
| Executor | Sonnet, via `.claude/skills/execute-task/SKILL.md` |
| Strongest permitted status | `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` |
| Rendered-code change | **None.** No screenshot command is part of completion. |
| New detector / script / gate | **None.** See §8. |

This is not a migration, not a removal, not a scanner build, and not a route certification. It is the written
answer Sprint 65 exit criterion 3 demands: *"Level 4 ends in a written decision: either app-wide Tailwind removal
is ready, or the external route blockers are named."*

## 2. Objective

Produce, at one clean citable SHA, the Level-4 readiness decision for retiring the global Tailwind compiler, as a
new **§17** in `docs/tailwind-governance.md`, containing:

1. the verdict — **`NOT_READY`**;
2. the residual global dependency surface, enumerated as **four named blocker classes (B1–B4)**, each with its own
   re-measured number and the exact command that produced it;
3. the **bound of every gate cited** — what each existing check can and cannot prove;
4. the conditions a future `READY` audit would have to satisfy, named as conditions and explicitly **not**
   authorized, scheduled, or numbered by this task;
5. the explicit statement that no removal occurred and that this record grants no removal authority;
6. the **accepted limitation** (§3.2, Amendment 1): no global route-composition CI certification exists and none
   will be built. It is recorded as a standing property of this repository, **not** as a blocker class and not as
   an input to the verdict. Route-critical changes carry **task-scoped real-route evidence** instead.

## 3. Verified context

Every number in this section was measured by the task architect on **2026-08-27** against the working tree at
`b73860fc5` + the pending Task-770 landing, using the exact commands named beside it. They are **author-verified
facts with a mandatory I0 re-measure** (§10.0): state can drift, and the record must cite the executor's own run at
the audited SHA, not this document.

> **Measurement disclosure — read this before quoting §3.** The architect's runs were executed as
> `node scripts/<name>.mjs` from a **non-Windows shell** over a mounted copy of the worktree. Exit codes and
> counts are reported below as measured there. The executor re-runs every one of them **natively in PowerShell**
> via the `npm.cmd` / `node.exe` spellings in §10 and records **its own** transcripts. Where the two disagree, the
> executor's native run is authoritative and the difference is a finding, not a correction to be made silently.

### 3.1 The Homepage levels are closed and green

`FACT` (architect, 2026-08-27, working tree):

| Command | Exit | Reported |
|---|---:|---|
| `node scripts/check-homepage-literal-utilities.mjs` | 0 | `0 static class literals across its 3 guarded files` |
| `node scripts/check-tailwind-runtime-tokens.mjs` | 0 | `0 new debt, 0 stale baseline entries, 0 dynamic-name violations`; 25 module.css + 2 runtime TSX scanned |
| `node scripts/check-homepage-theme-runtime-deps.mjs` | 0 | `0 blocking pairs, 0 expected-zero findings, migration signature OK`; 12 migration inputs + 1 expected-zero input; TOTAL CLASSIFIED 94 pairs / 170 uses; MIGRATED_TARGETS 42 / 79 |

`INFERENCE`: Levels 1–3 hold at the audited tree. That is the **precondition** of this task, not its subject. A
green Homepage does not bear on any of B1–B4 below.

### 3.2 The four blocker classes — measured, plus one accepted limitation

#### B1 — Build wiring (Tailwind is compiled into the app)

`FACT`, `src/app/globals.css`:

| Line | Directive |
|---:|---|
| 1 | `@import "tailwindcss";` |
| 2 | `@import "tw-animate-css";` |
| 3 | `@import "shadcn/tailwind.css";` |
| 11 | `@source not "../../docs";` |
| 12 | `@source not "../../tasks";` |
| 25 | `@source not "../../scripts";` |
| 27 | `@custom-variant dark (&:is(.dark *));` |

`FACT`, `postcss.config.mjs` — the entire plugin set is `{"@tailwindcss/postcss": {}}`. Tailwind is not an
optional stylesheet; it is the app's only PostCSS plugin.

`FACT`, `package.json` — `tailwindcss ^4`, `@tailwindcss/postcss ^4` (devDependencies), `tw-animate-css ^1.4.0`,
`shadcn ^4.3.0`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `tailwind-merge ^3.5.0`.

#### B2 — Compile-time consumers inside `globals.css`

`FACT`: **10** live `@apply` rules, at lines **612, 616, 629, 635, 640, 641, 642, 651, 655, 660**. They style
`*`, `body`, `::selection`/focus, the scrollbar pseudo-elements, headings, `p`, and media. Each one requires the
Tailwind compiler to resolve at build time.

`FACT`: `rg -n '@apply' src --glob '!src/app/globals.css'` returns **6** occurrences, and all six are inside
comments (`NotificationItem.tsx:214`, `NotificationCenter.tsx:57`, `PasswordRequirementsHint.tsx:53`,
`MobileNavDrawer.tsx:52`, `FooterView.module.css:23`, `CaptchaWidget.tsx:32`) — they document the `globals.css`
base rule, they do not add one. The live `@apply` surface is exactly the ten lines above.

#### B3 — The `@theme inline` alias layer and who still reads it

`FACT` (probe in §10.3, reusing the repository's own exported extractors — no new script committed):

- `@theme inline` declares **185** custom-property names.
- Plain `:root` declares **111** names, and **none of the 185 is also declared in plain `:root`**. The alias layer
  has no shadow copy: if Tailwind stops compiling, all 185 names cease to exist.
- **8 files** still hold **18 (file, name) pairs / 27 uses** of theme-inline-only names — **4 of those uses are in
  one Storybook story**, the rest are production:

| File | Pairs / uses | Names |
|---|---:|---|
| `src/app/[locale]/listings/[slug]/loading.tsx` | 3 / 3 | `--listing-gallery-h-{mobile,tablet,desktop}` |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` | 3 / 6 | same three |
| `src/modules/listings/components/GalleryStaticFrame.tsx` | 3 / 3 | same three |
| `src/modules/listings/components/ListingGallery.tsx` | 3 / 3 | same three |
| `src/components/shared/PerfDevOverlay.tsx` | 2 / 3 | `--color-status-success`, `--color-status-warning` |
| `src/components/ui/button.tsx` | 1 / 4 | `--radius-md` |
| `src/design-system/mantine/input-chrome.css` | 1 / 1 | `--color-input` |
| `src/stories/mantine/primitives/HeroSearch.stories.tsx` | 2 / 4 | `--space-16`, `--space-24` |
| **Total** | **18 / 27** | |

This reproduces, independently and at the post-770 tree, the table the Task-770 kickoff recorded at §3.6. Two of
its rows are already-known standing items and must be carried into the record **as such**, not re-litigated:
`PerfDevOverlay.tsx` is **D65-A-pending** and out of scope for every Sprint 65 task; `HeroSearch.stories.tsx` is
the deliberate divergence Task 770 §3.6 named and left alone — *"the day `@theme inline` is retired, that story
breaks while production does not"*, recorded there explicitly as an input to this task.

#### B4 — The utility-class consumer surface (census, not certification)

`FACT` (architect, `rg` over `src`, `.tsx`, stories excluded via `-g '!*.stories.tsx'`):

| Measure | Value |
|---|---:|
| Files containing a literal `className="` | **152** |
| Occurrences of literal `className="` | **2350** |
| Files referencing `@/components/ui/` (stories excluded) | **102** |
| Files referencing `@/components/ui/` (stories included) | **110** |
| Files in `src/components/ui/` | **49** (45 `.tsx`, 3 `.ts`, 1 `.css`) |

Distribution of the 152 files by top-level area: `modules/listings` 48 · `components/admin` 33 · `app/admin` 17 ·
`components/ui` 14 · `components/shared` 12 · `app/[locale]` 11 · `modules/cabinet` 5 · `design-system/mantine` 4 ·
`components/layout` 4 · `modules/auth` 2 · `modules/contacts` 1 · `components/listing` 1.

**The bound, stated in the record verbatim:** this is an order-of-magnitude census of literal `className` strings.
It does **not** classify each string as a Tailwind utility, does not distinguish a live route from dead code, and
is **not** a route certification. Its only claim is that the utility-class consumer surface outside the Homepage
is large and unmeasured — which is sufficient to refuse `READY`, and insufficient to schedule the work.

Note the honest asymmetry: `app/[locale]` still shows **11** files with literal `className` strings, while
`check:homepage-literal-utilities` reports `0` — because that gate guards **3 files**, not the route. The two
numbers do not conflict; they measure different things. Say so in the record.

#### Accepted limitation — no route-composition certification (**not** a blocker class)

> **Amended 2026-08-27.** This subsection was `B5` when the kickoff was filed. It is no longer a blocker class, it
> is not measured, and it does not enter the verdict.

`FACT`, owner decision 2026-08-27 (`docs/backlog-archive.md`, that date; `docs/maintenance-playbook.md` §14.3):
**no CI gate asserts the Mantine composition of a route, and none will be built** on an unsupported React
DOM→component mapping. Task 751 measured every candidate mechanism as FAIL, the owner rejected the direction,
Sprint 59 is closed as *mechanism rejected* and its route-inventory task is retired. This is a **deliberate,
accepted limitation of the repository**, not an outstanding item and not something a future task will close.

`FACT`, `docs/backlog.md`: `--mantine-only` scopes by Storybook title prefix, and `check:story-coverage` treats
anything absent from `mantine-migration-scope.json` as out of scope. A `15/15` figure proves coverage of fifteen
enrolled components, never a route.

**The replacement control, which §17.7 must state:** a route-critical change carries **task-scoped real-route
evidence** — the kickoff names the route, locales, viewports and the measured property, and the executor produces
that evidence for that change. **Never cite a permanent global CI claim for route composition**, and never present
a component-scoped gate result as route certification.

### 3.3 The correction this kickoff makes to the candidate brief

The candidate brief (`Codex-tasks/Task_771_Tailwind_Global_Retirement_Decision.md`, local-only, gitignored) made
the verdict a **function of the route-inventory task's disposition alone** (Task 667 — *retired by the owner on 2026-08-27; the sentences below are the historical record of a rejected rule, not live state*): `NOT_READY` if 667 is blocked, `BLOCKED FOR REDESIGN`
if 667 is closed. That decision rule is rejected, on measured grounds:

1. `CONFLICT` — B1, B2, B3 and B4 are each independently sufficient to make global removal unsafe **today**, and
   **none of them depends on 667**. Three `@import` lines, ten `@apply` rules, 185 alias-only names with 18 live
   reads, and 2350 literal `className` strings do not become safe because a route inventory gets unblocked.
2. `INFERENCE` — under the brief's rule, both arms end without a verdict (`NOT_READY … and stop`, or
   `BLOCKED FOR REDESIGN`). A task whose every branch declines to decide cannot satisfy Sprint 65 exit
   criterion 3, which requires a written decision.
3. The corrected rule (§9): the verdict is `NOT_READY` **on the measured surface** — B1–B4 — and nothing else.
   The `BLOCKED FOR REDESIGN` arm is deleted. **Amended 2026-08-27:** the earlier phrasing kept a route-inventory
   task as the standing "certification blocker". The owner has since retired that task and accepted the absence of
   route certification as a permanent limitation, so it is recorded as a limitation (§3.2) and is **absent from the
   verdict formula entirely**. This strengthens rather than weakens the correction: the verdict was already
   independent of it.

The brief is otherwise adopted: read-only, no deletion, no generic detector, Q0, no screenshot command, stop at
the known blocker rather than inventing a compiler-removal project.

### 3.4 What the cited gates can and cannot prove — and one that must not be cited

`FACT`, from the scanners' own headers and configured inputs:

| Gate | Its actual scope | What it cannot say |
|---|---|---|
| `check:homepage-literal-utilities` | 3 guarded files | Nothing about the other 149 files in B4 |
| `check:tailwind-runtime-tokens` | 25 `src/**/*.module.css` + **2** fixed runtime TSX files (fail-closed since 769) | Nothing about unlisted TSX; it makes no route-coverage claim |
| `check:homepage-theme-runtime-deps` | 12 migration inputs + 1 expected-zero input | Nothing about the 8 files in B3, which are outside its inputs |

**`governance:tailwind` must not be cited as retirement evidence.** `FACT`: it exits 0 (`PASS`, baseline
`C0/H10/M0`) and its 10 HIGH findings are `theme.ts` ×9 (lines 282, 296, 400, 607, 632, 633, 828, 843, 844) and
`MantineDataTableToCards.tsx:250` — the architect read all ten sites and **every one is inside a comment**
documenting a TailAdmin reference class. The scan counts comment text, so its number is neither a live-usage
census nor a retirement signal. Record this as a named limitation; do not run it as evidence.

### 3.5 Start state and the dirty-worktree rule

`FACT` (architect, 2026-08-27): `git --no-optional-locks status --porcelain` returned **33** entries — the Task-770
implementation (`src/…`, `docs/design-system.md`, `package.json`), its review ledger, its session log and its
evidence directory, plus the backlog consolidation, all uncommitted. `HEAD` = `b73860fc5` (the Task-770 **kickoff**
docs commit); branch `main`, upstream `origin/main`.

**This is a stop condition, exactly as Task 770 §3.12/§14.1 handled it.** The product of this task is a decision
record that cites a SHA. A SHA that does not contain Task 770's implementation cannot carry the evidence the record
claims. The executor therefore does not start until the tree is clean (§10.0). It never stashes, commits, reverts
or works around a dirty tree — mutating Git is owner-only (`CLAUDE.md` → Git policy).

### 3.6 Where the record lives

`docs/tailwind-governance.md` is the most specific existing owner of this subject (`CLAUDE.md` → Documentation
update rule). It currently runs §1–§16 (utility composition rules, ending with §16 Allowlist policy, 333 lines).
The record is appended as a new **§17**. No existing section is edited.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Sprint 65 §2 exit criterion 3 | A written Level-4 decision exists at `docs/tailwind-governance.md` §17 with the verdict `NOT_READY` stated in those exact characters. | P0 | AC1 | Confirmed |
| R2 | §3.2 | §17 enumerates blocker classes **B1–B4**, each with its re-measured value and the exact command that produced it. | P0 | AC2 | Confirmed |
| R3 | §10.0 | Every Homepage predecessor gate is re-run natively at the audited SHA and its **actual** exit code is recorded. | P0 | AC3 | Confirmed |
| R4 | §3.4 | §17 states the scope bound of every gate it cites, and names `governance:tailwind` as not-citable with the comment-site reason. | P0 | AC4 | Confirmed |
| R5 | §3.5, `CLAUDE.md` Git policy | Execution begins only from an empty `git status --porcelain`; the audited SHA contains Task 770's implementation. | P0 | AC5 | Confirmed |
| R6 | Sprint 65 §8, brief | **No removal, no deletion, no dependency/config/source/token/story change.** The final `git status --porcelain` contains only this task's own documentation paths. | P0 | AC6 | Confirmed |
| R7 | Brief, README | **No new detector, script, gate, npm script, baseline, allowlist or marker** is committed. The §10.3 probe lives outside the repository and leaves no tracked path. | P0 | AC7 | Confirmed |
| R8 | §3.2 (accepted limitation), owner decision 2026-08-27 | §17.7 records the accepted limitation — no route-composition CI certification exists or will be built — cites `docs/maintenance-playbook.md` §14.3, and states the replacement control: task-scoped real-route evidence. It records **no** blocker and **no** task state. | P0 | AC8 | Confirmed |
| R9 | §3.3 | §17 states the conditions a future `READY` audit must satisfy, marked explicitly as **not authorized and not scheduled**, with no task number reserved. | P1 | AC9 | Confirmed |
| R10 | `CLAUDE.md` operating model | Session log written; `docs/backlog.md` carries concise state only; status is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. | P0 | AC10 | Confirmed |
| R11 | `docs/qa-profiles.md` Q0 | Read-after-write verification, markdown/reference validation, contradiction scan; `check:mojibake` and `check:file-integrity` exit 0. | P1 | AC11 | Confirmed |
| R12 | §3.2 B3 | The B3 census is reproduced by the executor's own run and the eight-row table is recorded file by file. | P0 | AC12 | Confirmed |

`npm run build` is **not** required: `docs/qa-profiles.md` makes the final build a hard gate for **non-Q0** work,
and this task changes no product code, no package script and no referenced command.

## 5. Assumptions and open questions

### Assumptions (labelled, each cheap to reverse)

- `A1` — The owner lands Task 770 (implementation + review artifacts) and this filing before execution starts.
  If not, §10.0 stops the task; nothing is lost.
- `A2` — `docs/tailwind-governance.md` remains the correct home for the record. If the owner prefers a standalone
  document, that is a one-line redirection of §10.6, not a redesign.
- `A3` — The verdict is known in advance to be `NOT_READY`, and this kickoff says so up front. The work is
  producing the enumerated, re-measured, citable evidence — not discovering the answer. This is stated so that no
  reviewer mistakes a pre-stated verdict for a pre-written record.

### Open questions (do not block execution; record them, do not answer them)

- `Q1` — **D65-A** (`PerfDevOverlay.tsx`) is still owner-pending. Its two B3 reads are recorded as a standing
  item. This task does not decide D65-A and does not touch that file.
- `Q2` — `HeroSearch.stories.tsx`'s deliberate divergence (Task 770 §3.6) is recorded as a known future breakage.
  This task does not fix it — Sprint 65 §3 rule 6 and §8 both forbid it.
- `Q3` — Sprint 65 closure and the D63-B bookkeeping retirement are owner actions. This task records sprint-exit
  status; it does not close the sprint.

### Not folded in, deliberately

Task 766 F1 (CI wiring for `check:homepage-literal-utilities`), legacy-story retirement, the Epic MM tracker
refresh, and owner cleanup step 3 are all live items elsewhere in `docs/backlog.md`. None is this task's subject,
and none may be started from it.

## 6. Pre-read rule bundle

Read exactly these, in this order. Do not read all docs.

1. `docs/agent-contract.md` — P0 invariants, clauses 1–15.
2. `.claude/skills/execute-task/SKILL.md` — auto-loaded executor protocol.
3. `docs/qa-profiles.md` — the `Q0` row and the "Approval impact" section.
4. `docs/backlog.md` — Open rows, the **Sprints** section (Sprint 59 and Sprint 65 lines), the task registry.
5. `tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md` — §2 goal and exit criteria, §3 binding rules,
   §5 decisions D65-A…D65-F, §6 tasks, §8 what the sprint does not authorize.
6. `docs/maintenance-playbook.md` §14.3 — the accepted limitation on route-composition certification and the
   task-scoped route-evidence rule that replaces it. (Amendment 1: this replaces the former pre-read of Sprint 59's
   Tasks table, which is closed history and is **not** required reading for this task.)
7. `docs/tailwind-governance.md` — headings only, plus §16 in full (the section §17 will follow).
8. `docs/ai-behavior.md` → "Backlog & Session Log Rules".
9. `tasks/Sprints/Sprint_65_kickoff_prompt_Task_770_Homepage_Theme_Inline_Runtime_Exit.md` §3.6 — the eight-file
   `@theme inline` residual table this task re-measures.

`Codex-tasks/` is **local-only and gitignored**; it is not a pre-read and nothing in it is citable evidence.

## 7. Scope

The complete write set. Nothing outside it may be created or modified.

| Path | Change |
|---|---|
| `docs/tailwind-governance.md` | **Append** a new `## §17 — GLOBAL RETIREMENT READINESS (Task 771)`. No existing line edited. |
| `docs/sessions/2026-08-XX-task771-global-tailwind-retirement-readiness.md` | New session log (date = the actual execution date). |
| `docs/sessions/evidence/task771/` | New evidence directory: one transcript file per command in §10, plus the verbatim probe source. |
| `docs/backlog.md` | Concise state only: the Sprint 65 line's `771` state and the registry row. Two-to-four lines of "Last Session". No restatement of §17. |

Read-only inspection is unrestricted. Writing is restricted to the four rows above.

## 8. Out of scope

Each item below is forbidden **even if execution makes it look obvious or trivial**. Any of them turns the task
into `BLOCKED`, not a wider task.

1. Deleting or editing **any** line of `src/app/globals.css` — the three `@import`s, the three `@source`s, the
   `@custom-variant`, the ten `@apply` rules, `@theme inline`, `:root`, or anything else.
2. Editing `postcss.config.mjs`, `next.config.ts`, `components.json`, `package.json`, `package-lock.json`,
   `tsconfig.json`, or any CI/workflow file.
3. Removing or adding a dependency — including `tailwindcss`, `@tailwindcss/postcss`, `tw-animate-css`, `shadcn`,
   `class-variance-authority`, `clsx`, `tailwind-merge`.
4. Any change under `src/` — component, module CSS, token, story, or test. This includes `PerfDevOverlay.tsx`
   (D65-A pending) and `HeroSearch.stories.tsx` (the deliberate divergence).
5. Creating a new detector, scanner, npm script, baseline, allowlist, exemption marker, or CI gate; or modifying
   `scripts/check-tailwind-runtime-tokens.mjs`, `scripts/check-homepage-theme-runtime-deps.mjs`,
   `scripts/check-homepage-literal-utilities.mjs`, or anything under `scripts/governance/`.
6. Committing the §10.3 probe, or any file, into the repository. The probe is written **outside** the repo tree.
7. Running any screenshot profile — `screenshots:assert`, `--mantine-only`, `:full`, `:full:fast` — or a Storybook
   capture. This task changes no rendered code; a screenshot here is manufactured evidence.
8. Certifying a route, claiming Homepage or app-wide Mantine composition, or deciding D65-A or D762-3. Also out of
   scope: reopening Sprint 59, reviving its retired route-inventory task, or proposing a route-composition gate —
   the limitation is accepted (§3.2) and this task records it without arguing with it.
9. Closing Sprint 65, Sprint 59, or any archive/ledger consolidation. Recording exit status is not closing.
10. Any mutating Git command (`add`, `commit`, `push`, `reset`, `restore`, `checkout`, `stash`, `merge`, `rebase`,
    `rm`, `apply`, `clean`, `config`) or any suggestion of one. Read-only Git only.
11. Reserving a task number, filing a successor kickoff, or writing a removal plan with steps and owners. §17 names
    **conditions**, not a project.

## 9. Current and required behavior

### Current behavior to preserve

- The application builds and renders exactly as it does today. Tailwind compiles; `@theme inline` supplies its 185
  names; the 18 residual reads in B3 resolve; all three Homepage gates exit 0.
- `docs/tailwind-governance.md` §1–§16 remain byte-identical.
- Sprint 65's four levels and their approved evidence remain as recorded.

### Required after behavior

- `docs/tailwind-governance.md` gains **§17** and nothing else changes in the repository except the session log,
  the evidence directory and the concise backlog state.
- **The decision rule, in full** (this replaces the candidate brief's rule — see §3.3):

  > The verdict is `NOT_READY` if **any** of B1–B4 is non-empty at the audited SHA.
  > All four are measured. **No task state and no route-certification question enters this formula** (Amendment 1).
  > `READY` is **not available to this task under any measurement**, and no removal is authorized by it.
  > If a measured class comes back **empty** — no `@import`, zero `@apply`, zero theme-inline-only names, or a
  > zero `className` census — that contradicts §3.2 and is a **stop condition** (`BLOCKED — BASELINE MOVED`), not
  > a step toward `READY`.

- **Drift rule.** Any §3.2 number that re-measures differently is recorded **beside** the kickoff's number in both
  §17 and the session log, with the actual command output retained. Drift that leaves the class non-empty does not
  block: record it and continue. Drift that empties a class stops the task (above). Never silently adopt a new
  number and never edit §3.2 of this kickoff.

## 10. Implementation requirements

All commands are native Windows PowerShell, run from the project root, read-only. For checkpoints 0–6, capture
**every** transcript first under `$env:TEMP\task771-evidence\` with the filename given in each subsection, and
record the **actual** `$LASTEXITCODE` next to each command — never a remembered or expected one. Do not create
`docs/sessions/evidence/task771/` or any other repository path before the clean-tree and post-probe checks have
passed. At checkpoint 7, copy the staged transcripts byte-for-byte to `docs/sessions/evidence/task771/`; the
evidence paths below name those final persisted copies.

### 10.0 Mandatory first action — prove the tree before writing anything

```powershell
node.exe -p process.platform
git --no-optional-locks status --porcelain
git --no-optional-locks status --short --branch
git --no-optional-locks log -1 --oneline
git --no-optional-locks ls-files --error-unmatch scripts/check-homepage-theme-runtime-deps.mjs; "exit=$LASTEXITCODE"
Select-String -Path src/app/globals.css -Pattern '--homepage-runtime-space-0' | Select-Object LineNumber, Line
npm.cmd run check:homepage-literal-utilities;      "exit=$LASTEXITCODE"
npm.cmd run check:tailwind-runtime-tokens;         "exit=$LASTEXITCODE"
npm.cmd run check:tailwind-runtime-tokens:verify-gate; "exit=$LASTEXITCODE"
npm.cmd run check:homepage-theme-runtime-deps;     "exit=$LASTEXITCODE"
npm.cmd run check:homepage-theme-runtime-deps:verify-gate; "exit=$LASTEXITCODE"
```

Evidence: `preflight-git.txt`, `preflight-gates.txt`.

**Required results — all five are stop conditions if unmet:**

| # | Required | If not |
|---:|---|---|
| 1 | `process.platform` = `win32` | Report the actual platform in the log; continue only if every command below still runs natively. |
| 2 | `git status --porcelain` is **empty** | `BLOCKED — DIRTY WORKTREE`. Report verbatim, list every entry, stop. Do not stash, commit, revert or work around it (§3.5). |
| 3 | `git log -1` names a commit that **contains Task 770's implementation** (`src/app/globals.css`'s `--homepage-runtime-*` block and `scripts/check-homepage-theme-runtime-deps.mjs` both present and tracked) | `BLOCKED — PREDECESSOR NOT LANDED`. Return to Task 770's owner handoff. |
| 4 | All five gate commands exit **0** | `BLOCKED — PREDECESSOR RED`. Name the gate and its output; do not audit global retirement on an unproved Homepage baseline. |
| 5 | The audited SHA is recorded verbatim and used unchanged in §17 and the session log | — |

Record the SHA from step 3 as **the audited SHA**. Every number in §17 belongs to it.

### 10.1 B1 — build wiring

```powershell
Select-String -Path src/app/globals.css -Pattern '^@(import|source|custom-variant|plugin|config)' | Select-Object LineNumber, Line
Get-Content postcss.config.mjs
Select-String -Path package.json -Pattern 'tailwindcss|@tailwindcss/postcss|tw-animate-css|"shadcn"|class-variance-authority|clsx|tailwind-merge'
```

Evidence: `b1-build-wiring.txt`. Record every matched line with its line number and the installed version range.

### 10.2 B2 — `@apply`

```powershell
(Select-String -Path src/app/globals.css -Pattern '@apply').Count
Select-String -Path src/app/globals.css -Pattern '@apply' | Select-Object LineNumber, Line
rg.exe -n '@apply' src --glob '!src/app/globals.css'
```

Evidence: `b2-apply.txt`. For the third command, **open each hit** and classify it `live rule` or `comment`. §3.2
expects 10 live rules in `globals.css` and 6 comment-only hits elsewhere; record the actual classification, file by
file. A live `@apply` outside `globals.css` is drift — record it, it does not empty the class.

### 10.3 B3 — the `@theme inline` census (probe outside the repository)

Write **exactly** this file to `$env:TEMP\task771-theme-inline-census.mjs`. It creates no repository path and
imports the repository's own exported extractors — it is not a new detector, and nothing about it is committed.

```javascript
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.argv[2];
const dep = await import(pathToFileURL(join(ROOT, 'scripts/check-homepage-theme-runtime-deps.mjs')).href);
const csv = await import(pathToFileURL(join(ROOT, 'scripts/check-css-var-resolvability.mjs')).href);

const globals = readFileSync(join(ROOT, 'src/app/globals.css'), 'utf8');
const { plainRoot, themeInline } = dep.extractPlainRootAndThemeInline(globals);
const root = new Set(plainRoot);
const only = new Set([...themeInline].filter((n) => !root.has(n)));

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.(tsx|ts|css)$/.test(e.name)) files.push(full);
  }
})(join(ROOT, 'src'));

const byFile = new Map();
const pairs = new Set();
let uses = 0;
let storyUses = 0;
for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  if (rel === 'src/app/globals.css') continue;
  const stripped = csv.stripComments(readFileSync(f, 'utf8'), extname(f) === '.css');
  const refs = csv.findVarReferences(stripped).filter((r) => only.has(r.name));
  if (!refs.length) continue;
  byFile.set(rel, refs);
  uses += refs.length;
  refs.forEach((r) => pairs.add(rel + '|' + r.name));
  if (rel.includes('/stories/') || rel.includes('.stories.')) storyUses += refs.length;
}

console.log('plain :root names: ' + root.size);
console.log('@theme inline names: ' + [...themeInline].length);
console.log('theme-inline-ONLY names: ' + only.size);
console.log('files: ' + byFile.size + ' | pairs: ' + pairs.size + ' | uses: ' + uses + ' | story uses: ' + storyUses);
for (const [rel, refs] of [...byFile.entries()].sort()) {
  const names = [...new Set(refs.map((r) => r.name))];
  console.log('  ' + rel + '  ' + names.length + '/' + refs.length + '  ' + names.join(','));
}
```

```powershell
node.exe $env:TEMP\task771-theme-inline-census.mjs (Get-Location).Path
git --no-optional-locks status --porcelain   # must still be empty
```

Evidence: `b3-theme-inline-census.txt` (the run) and `b3-probe-source.mjs.txt` (the probe source, byte-for-byte, so
a reviewer can re-run it without this kickoff).

**Required:** `theme-inline-ONLY names: 185` · `files: 8 | pairs: 18 | uses: 27 | story uses: 4`, and the eight rows
of §3.2 B3. Record the actual output either way; apply §9's drift rule. `pairs: 0` is a stop condition.

Neither imported module self-executes: both guard their entry point on `process.argv[1]`, which is the probe.
Confirm that no scanner banner appears in the transcript.

### 10.4 B4 — the utility-class census

```powershell
rg.exe -l 'className="' src -g '*.tsx' -g '!*.stories.tsx' | Measure-Object -Line
rg.exe 'className="' src -g '*.tsx' -g '!*.stories.tsx' | Measure-Object -Line
rg.exe -l '@/components/ui/' src -g '!*.stories.*' | Measure-Object -Line
rg.exe -l '@/components/ui/' src | Measure-Object -Line
(Get-ChildItem src/components/ui -File | Measure-Object).Count
rg.exe -l 'className="' src -g '*.tsx' -g '!*.stories.tsx'
```

Evidence: `b4-utility-census.txt`. The last command's output supplies the per-area distribution; group it by the
first two path segments as §3.2 B4 does.

**§17 must carry the bound verbatim**: an order-of-magnitude census of literal `className` strings — not a
per-string Tailwind classification, not a live/dead-code split, not a route certification. And it must state the
`app/[locale]` 11-vs-0 asymmetry against `check:homepage-literal-utilities`' three guarded files, with the reason.

### 10.5 The accepted limitation — recorded, not measured

**Amended 2026-08-27. There is nothing to measure here and no command to run.** This subsection previously
collected a task's state string from two sources; that task is retired and the question it tracked is now an
accepted limitation of the repository.

Write §17.7 from `docs/maintenance-playbook.md` §14.3 and the 2026-08-27 owner row in `docs/backlog-archive.md`:
state that no route-composition CI certification exists or will be built, that this is accepted rather than
outstanding, and that the replacement control is **task-scoped real-route evidence**. Cite both paths. Produce **no**
evidence file for this subsection — an absent measurement is correct here, not a gap.

### 10.6 The record — `docs/tailwind-governance.md` §17

Append one section, `## §17 — GLOBAL RETIREMENT READINESS (Task 771)`, with exactly these subsections:

| § | Content |
|---|---|
| 17.1 Verdict | `NOT_READY`, in those characters, with the audited SHA, the execution date, and the one-line reason (**B1–B4 measured non-empty**). No other input to the verdict. |
| 17.2 Predecessor baseline | The five §10.0 gate commands with their actual exit codes. |
| 17.3 B1 build wiring | The §10.1 table: seven `globals.css` directive lines, the PostCSS plugin, the seven package entries. |
| 17.4 B2 `@apply` | The ten live line numbers; the six comment-only hits named as such. |
| 17.5 B3 alias layer | 185 / 111 / zero overlap; the eight-row reader table; the D65-A and `HeroSearch.stories.tsx` standing items, each labelled as already-owned, not new debt. |
| 17.6 B4 consumer surface | The five counts, the per-area distribution, **and the bound paragraph verbatim** (§10.4). |
| 17.7 Accepted limitation | No route-composition CI certification exists or will be built (owner, 2026-08-27; `docs/maintenance-playbook.md` §14.3). Stated as an accepted limitation, **not** a blocker and **not** a task state. Names the replacement control: task-scoped real-route evidence for route-critical changes. |
| 17.8 Gate bounds | The §3.4 table, plus the `governance:tailwind` non-citability paragraph with the ten comment sites named. |
| 17.9 Conditions for a future READY audit | Named conditions only — see below. |
| 17.10 What this record does not authorize | Verbatim: no `@import`, `@apply`, `@source`, `@custom-variant`, dependency, PostCSS-plugin, token or story change is authorized by this record; nothing here certifies a route; a future audit is re-designed against its own baseline, not against these numbers. |

**§17.9 is conditions, not a plan.** Each condition is one sentence naming a state that must hold, with no steps,
no owner, no sequence, no estimate and **no task number**. At minimum it names: a disposition for all 185
theme-inline-only names; the removal or re-homing of the ten `@apply` rules; a decided answer for the 18 residual
reads including D65-A; and an evidenced classification of the B4 surface. It does **not** name route certification
as a condition — that is an accepted limitation, not a gap awaiting an owner. End it with: *"None of these is authorized, scheduled or numbered by Task 771."*

### 10.7 Session log and backlog

Session log `docs/sessions/2026-08-XX-task771-global-tailwind-retirement-readiness.md` — same shape as
`docs/sessions/2026-08-26-task770-…md`: task path and status, the §10.0 start-state note, a command/exit/evidence
table for every command in §10, the measured-vs-kickoff comparison for each §3.2 number, deviations, limitations,
and the confirmation that no removal occurred.

`docs/backlog.md` — concise state **only**: the Sprint 65 line's `771` state, the registry row, and a two-to-four
line "Last Session". Do not restate §17, the blocker classes or the evidence there. Do not close a sprint, retire a
decision, or move an archive row.

## 11. Positive and negative flows

**Positive flow.** Clean tree at the landed Task-770 SHA → §10.0 preflight, five gates exit 0 → B1–B4 measured,
every transcript retained → §17 appended to `docs/tailwind-governance.md` with the `NOT_READY` verdict, the four
blocker classes and the accepted limitation → session log + concise backlog state → final `git status --porcelain` shows only this task's
four documentation paths → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

**Negative-flow applicability.** Selected by relevance; irrelevant branches are marked `No` with the reason.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation (user input) | **No** | No form, action or schema is touched | N/A | — |
| Authorization / RLS | **No** | No route, action or data path is touched | N/A | — |
| Offline / network | **No** | Every command is local and read-only | N/A | — |
| Concurrent writer | **No** | No data model involved | N/A | — |
| **Dirty worktree at start** | **Yes** | §3.5, `CLAUDE.md` Git policy | `BLOCKED — DIRTY WORKTREE`, verbatim entry list, no stash/commit/revert | `preflight-git.txt` |
| **Predecessor not landed** | **Yes** | §10.0 step 3 | `BLOCKED — PREDECESSOR NOT LANDED`; return to Task 770's handoff | `preflight-git.txt` |
| **Predecessor gate red** | **Yes** | §10.0 step 4 | `BLOCKED — PREDECESSOR RED`, naming the gate and its output | `preflight-gates.txt` |
| **Measured baseline moved** | **Yes** | §9 drift rule | Non-empty drift: record beside the kickoff number and continue. Empty class: `BLOCKED — BASELINE MOVED` | the class's own evidence file |
| **Probe leaves a repo path** | **Yes** | R7 | `BLOCKED`; the probe is written outside the repo and the post-probe porcelain must still be empty | `b3-theme-inline-census.txt` |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the completed task, when `docs/tailwind-governance.md` is read, then a section
  `## §17 — GLOBAL RETIREMENT READINESS (Task 771)` exists, its §17.1 contains the literal string `NOT_READY`, the
  audited SHA and the execution date, and §1–§16 are byte-identical to their pre-task content.
- **AC2 [R2]** — Given §17, when subsections 17.3–17.6 are read, then each of B1, B2, B3 and B4 carries its own
  measured value **and** the exact command that produced it, and every number is traceable to a named file in
  `docs/sessions/evidence/task771/`.
- **AC3 [R3]** — Given §17.2, when it is compared with `preflight-gates.txt`, then all five predecessor commands
  appear with their actual exit codes and all five are `0`.
- **AC4 [R4]** — Given §17.8, when it is read, then it contains the three-row gate-bound table **and** the
  paragraph naming `governance:tailwind` as not citable, listing the ten comment sites; and no transcript in the
  evidence directory shows `governance:tailwind` being run as evidence.
- **AC5 [R5]** — Given `preflight-git.txt`, when it is read, then `git status --porcelain` was empty at start, the
  audited SHA is recorded, and that commit contains `scripts/check-homepage-theme-runtime-deps.mjs` as a tracked
  file.
- **AC6 [R6]** — Given the final `git --no-optional-locks status --porcelain`, when it is read, then it lists
  **only** `docs/tailwind-governance.md`, the session log, `docs/sessions/evidence/task771/…` and
  `docs/backlog.md`, and **no** path under `src/`, `scripts/`, `.storybook/`, `package.json`, `package-lock.json`,
  `postcss.config.mjs`, `next.config.ts` or `components.json`.
- **AC7 [R7]** — Given the completed task, when the repository is searched, then no new script, npm script,
  baseline, allowlist or marker exists; the §10.3 probe is present only as
  `docs/sessions/evidence/task771/b3-probe-source.mjs.txt` (a transcript, not an executable repo path); and
  `git status --porcelain` taken immediately after the probe run was empty.
- **AC8 [R8]** — Given §17.7, when it is read, then it states that no route-composition CI certification exists or
  will be built, cites `docs/maintenance-playbook.md` §14.3 and the 2026-08-27 owner decision, names the
  replacement control (task-scoped real-route evidence), and contains **no** task number presented as an
  outstanding blocker. Given §17.1, when it is read, then its stated reason names **only** B1–B4.
- **AC9 [R9]** — Given §17.9, when it is read, then every condition is one sentence naming a required state, no
  condition contains a step list, owner, sequence or task number, and the section ends with the literal sentence
  *"None of these is authorized, scheduled or numbered by Task 771."*
- **AC10 [R10]** — Given the session log, when it is read, then it carries the task path, the status
  `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, a command/exit/evidence table for every §10 command, and a
  measured-vs-kickoff row for each §3.2 number; and `docs/backlog.md`'s change is concise state only.
- **AC11 [R11]** — Given `npm.cmd run check:mojibake` and `npm.cmd run check:file-integrity` at the end, then both
  exit `0` with transcripts retained; and every markdown link added in §17 resolves to a path that exists.
- **AC12 [R12]** — Given `b3-theme-inline-census.txt`, when it is read, then it reports the theme-inline-only name
  count, the file/pair/use/story-use counts and one row per reader file; and §17.5 reproduces that table file by
  file.

## 13. QA profile and verification plan

**Profile: `Q0 Docs/Governance`** — `docs/qa-profiles.md`: *"The task changes only rules, docs, prompts, reports,
or task files."* This task changes four documentation paths and nothing else. It changes no referenced command, so
no product validation is triggered, and `npm run build` is not a gate for `Q0`.

**No screenshot command is part of completion.** No rendered code changes. Running `screenshots:assert` (in any
profile), a Storybook capture, or `governance:tailwind` "for extra evidence" is manufactured evidence and a §14
stop condition.

Verification, in order:

```powershell
# 1. the four Q0 checks
npm.cmd run check:mojibake;        "exit=$LASTEXITCODE"
npm.cmd run check:file-integrity;  "exit=$LASTEXITCODE"

# 2. read-after-write on every written path
git --no-optional-locks diff -- docs/tailwind-governance.md docs/backlog.md
git --no-optional-locks status --porcelain

# 3. the predecessor gates, unchanged, at the end as at the start
npm.cmd run check:homepage-literal-utilities;      "exit=$LASTEXITCODE"
npm.cmd run check:tailwind-runtime-tokens;         "exit=$LASTEXITCODE"
npm.cmd run check:homepage-theme-runtime-deps;     "exit=$LASTEXITCODE"
```

Evidence: `final-checks.txt`, `final-status.txt`, `final-gates.txt`.

Plus, as `Q0` requires:

- **Read-after-write** — re-read §17 from disk after writing and confirm the rendered structure (17.1–17.10 all
  present, tables well-formed, no truncated row).
- **Reference validation** — every path, section number and decision ID cited in §17 exists: `D65-A`, `D65-C`,
  `docs/maintenance-playbook.md` §14.3, the 2026-08-27 row in `docs/backlog-archive.md`, `docs/backlog.md`'s
  registry, the eight B3 files.
- **Contradiction scan** — §17 against `docs/tailwind-governance.md` §1–§16, Sprint 65 §2/§8, and `docs/backlog.md`.
  §17 must not claim the sprint is closed, that a route is certified, that D65-A is decided, or that any removal is
  approved. Record the scan and its result in the session log.

## 14. Stop conditions

Stop, report the status verbatim with the actual evidence, and **do not** work around any of these:

1. `git status --porcelain` non-empty at §10.0 → `BLOCKED — DIRTY WORKTREE`.
2. Task 770's implementation absent from the audited commit → `BLOCKED — PREDECESSOR NOT LANDED`.
3. Any of the five §10.0 gates non-zero → `BLOCKED — PREDECESSOR RED`.
4. Any measured blocker class comes back **empty** → `BLOCKED — BASELINE MOVED` (§9). An empty class is never a
   step toward `READY`.
5. The §10.3 probe leaves any tracked or untracked path inside the repository → `BLOCKED`.
6. Execution appears to require editing `src/`, `scripts/`, a config file, a dependency or a story → `BLOCKED`.
   Return the evidence and request a scope decision; do not make the edit.
7. A reviewer-visible temptation to "fix it while you are there" — `HeroSearch.stories.tsx`, `PerfDevOverlay.tsx`,
   the six `@apply` comments, the `governance:tailwind` comment findings → **all forbidden** (§8). Record them.
8. Anything that would need a mutating Git command → stop and hand back to the owner.

## 15. Completion report contract

The final report must contain, in this order:

1. **Task path** and status — `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.
   Never self-approval.
2. **Audited SHA** and the §10.0 start-state note (porcelain empty; the five gate exit codes).
3. **Changed files** — exact paths, with the final `git status --porcelain` quoted.
4. **Completed requirement IDs** — R1–R12, each `met` / `partial` / `not met` with its AC.
5. **Commands run and actual results** — one row per command in §10 and §13: command, exit code, evidence file.
6. **Measured vs kickoff** — one row per §3.2 number: kickoff value, measured value, drift verdict.
7. **The verdict as written into §17.1**, quoted.
8. **Evidence locations** — `docs/sessions/evidence/task771/…`, file by file.
9. **Assumptions, deviations, limitations** — including the `Q0` no-build/no-screenshot decision and the B4 bound.
10. **Explicit confirmation that no removal occurred**: no `@import`, `@apply`, `@source`, `@custom-variant`,
    dependency, PostCSS plugin, token, component, story or script was deleted or modified.
11. **Unresolved issues** — D65-A, the `HeroSearch.stories.tsx` divergence, and any `CONFLICT` found. The route-certification limitation is **not** an unresolved issue; it is accepted (§3.2).

## Task quality gate — checked before publication

| Check | Result |
|---|---|
| A fresh Sonnet session can execute it without hidden chat context | Yes — every command, expected value, path and stop condition is inline; `Codex-tasks/` is explicitly excluded as a pre-read. |
| Every primary requirement has a binary AC and a verification method | Yes — R1–R12 ↔ AC1–AC12, each with a named evidence file. |
| Scope protects existing behavior and names what must not change | Yes — §7 write set (4 paths), §8 eleven prohibitions, §9 preserved behavior. |
| UI publication checks | N/A — no UI artifact, no story, no rendered change (§1, §13). |
| Permanent-story creation gate | N/A — no story is added, extended or probed (§8.4). |
| Negative flows selected by applicability | Yes — four branches marked `No` with reasons; six execution branches marked `Yes`. |
| No uninspected command, file, test, story or behavior is claimed | Yes — every §3 number was measured by the architect at the paths named; the disclosure in §3 states the shell used and mandates a native re-measure. |
| Absence/API claims carry a trace | Yes — the two absence claims (no `@apply` outside `globals.css`; no theme-inline name shadowed in `:root`) were each measured, and the six comment sites are named individually. |
| Gates prove changed behavior, not procedure | Yes — the record's numbers are re-derived by the executor's own runs; §10.0 refuses an unproved baseline. |
| Owner-only exceptions have traceable authorization | Yes — D65-A, D65-C, D65-D/E/F are cited by ID and date; none is created here. |
| Exactly one active execution route | Yes — Appendix A.1. The candidate brief's second arm is deleted (§3.3). |
| Checkpoints name producer, output, comparator, failure behavior | Yes — Appendix A.2. |
| Dirty-worktree handling | Yes — the task refuses to start dirty (§10.0/§14.1); no status assertion is made against an assumed clean tree. |
| Baseline/manifest results account for task-created artifacts | Yes — the probe is written outside the repository and the census excludes `globals.css` itself; the post-probe porcelain check is an AC. |
| No fact marked `Confirmed` whose first verification is deferred to the executor | Yes — every §3 fact was measured at design time; §10.0 is a freshness re-measure with a drift rule, not first contact. |
| Assumptions and unresolved decisions visible | Yes — §5, and §15.11. |

### FACTS

1. Three Homepage gates exit 0 at the audited tree, with the outputs quoted in §3.1.
2. `globals.css` holds three `@import`s (1–3), three `@source`s (11, 12, 25), one `@custom-variant` (27) and ten
   live `@apply` rules (612, 616, 629, 635, 640, 641, 642, 651, 655, 660).
3. All six `@apply` occurrences elsewhere in `src/` are comments; the six sites are named in §3.2 B2.
4. `postcss.config.mjs`'s only plugin is `@tailwindcss/postcss`.
5. `@theme inline` declares 185 names; plain `:root` declares 111; the intersection is empty.
6. Eight files hold 18 theme-inline-only pairs / 27 uses, four of the uses in `HeroSearch.stories.tsx`.
7. 152 non-story `.tsx` files contain 2350 literal `className="` occurrences; 110 files reference
   `@/components/ui/` (102 excluding stories); `src/components/ui/` holds 49 files.
8. `governance:tailwind` exits 0 and all ten of its HIGH findings are comment sites (nine in `theme.ts`, one in
   `MantineDataTableToCards.tsx:250`).
9. **Owner decision 2026-08-27:** no route-composition CI certification exists or will be built; the limitation is
   accepted, Sprint 59 is closed as *mechanism rejected*, and route-critical changes carry task-scoped real-route
   evidence (`docs/maintenance-playbook.md` §14.3; `docs/backlog-archive.md`, 2026-08-27).
10. At design time the worktree held 33 uncommitted entries, including Task 770's implementation; `HEAD` was
    `b73860fc5` on `main` → `origin/main`.

### INFERENCES

1. Removing `@import "tailwindcss"` removes the definitions of all 185 `@theme inline` names, so the 18 residual
   reads in §3.2 B3 would resolve to nothing — from named facts 5 and 6.
2. The ten `@apply` rules cannot survive compiler removal without being rewritten, so B2 is a removal blocker
   independent of any consumer count — from fact 2.
3. The verdict rests on B1–B4 alone, each independently sufficient for `NOT_READY` — from facts 2, 4, 5, 6 and 7.
   This is the correction in §3.3, and Amendment 1 removed the last non-measured input from the formula.
4. `governance:tailwind` cannot serve as a live-usage census because its findings are comment text — from fact 8.
5. The `app/[locale]` 11-vs-0 asymmetry is a scope difference, not a contradiction: the gate guards three files,
   the census counts a directory — from facts 1 and 7.

### UNKNOWNS

1. How many of the 2350 literal `className` strings are Tailwind utilities rather than CSS-module or semantic
   class names. Not measured, deliberately (§10.4 bound); a per-string classification is a different task.
2. Which of the 185 theme-inline-only names are consumed **as Tailwind utilities** (`text-sm`, `rounded-lg`, …)
   rather than as `var()` reads. The B3 census measures `var()` reads only.
4. Whether the D65-A disposition would add or remove a B3 row.

### CONFLICTS

1. The candidate brief's decision rule versus the measured surface — resolved in §3.3 by replacing the rule; the
   brief's rejected arm is recorded, not silently dropped.
2. `docs/backlog.md` records Task 770 as reviewed and archived while its implementation is uncommitted
   ("commit-qualified"). Not resolved here: §10.0 refuses to start until the SHA carries it.

---

## Appendix A — Executable task contract (`docs/orchestrator-execution-contract-template.md`, completed)

### A.1 One active execution route

| Field | Value |
|---|---|
| Task | 771 — Global Tailwind retirement readiness: the decision record |
| Active route / owner decision | **One route:** read-only audit → `NOT_READY` record at `docs/tailwind-governance.md` §17. Bound by Sprint 65 §2 exit criterion 3 and §8, and by **D65-C** (route certification is not duplicated here — and, per the 2026-08-27 owner decision, is an accepted limitation rather than another task's scope). |
| Decision source, date, scope | Sprint 65 (opened 2026-08-24) §2/§3/§8; D65-C decided 2026-08-24; D65-A pending 2026-08-24 (keeps `PerfDevOverlay` out of scope); Task 770 §3.6 (2026-08-26) names `HeroSearch.stories.tsx` as an input to this task. |
| Starting worktree mode | **clean isolated** — enforced by §10.0 step 2; a dirty tree is `BLOCKED`, never a manifest path here. |
| Exact allowed final write set | `docs/tailwind-governance.md` (append §17) · `docs/sessions/2026-08-XX-task771-….md` (new) · `docs/sessions/evidence/task771/**` (new) · `docs/backlog.md` (concise state). Nothing else. |
| Blocked rule or decision, if any | None blocks execution. D65-A stays pending and is recorded, not decided. Route certification is an accepted limitation and is recorded as such, not as a blocked item. |

The candidate brief's second arm (`BLOCKED FOR REDESIGN`, keyed on the route-inventory task's disposition — a task since retired) is **removed**, not deferred: §3.3 shows
it produces no verdict on either branch. This contract has one route and one write set.

### A.2 Checkpoint matrix

| # | Preconditions and preserved inputs | Writes allowed | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---:|---|---|---|---|---|
| 0 | Repository at `main`; nothing written yet | none | `git status --porcelain` empty; `HEAD` recorded | `git --no-optional-locks status --porcelain` / `log -1 --oneline` → `preflight-git.txt` | Any line of output → `BLOCKED — DIRTY WORKTREE`, execution ends. Empty output is a **valid** result, not a missing artifact. |
| 1 | Checkpoint 0 clean | none | Audited commit contains Task 770's implementation | `git --no-optional-locks show --stat <SHA>` + `git ls-files scripts/check-homepage-theme-runtime-deps.mjs` → `preflight-git.txt` | Path absent/untracked → `BLOCKED — PREDECESSOR NOT LANDED`. |
| 2 | Checkpoint 1 | none | Five predecessor gates exit 0 | the five `npm.cmd run check:*` commands → `preflight-gates.txt` | Any non-zero `$LASTEXITCODE` → `BLOCKED — PREDECESSOR RED`, naming the gate. |
| 3 | Checkpoint 2 | none | B1 = 7 directive lines + 1 PostCSS plugin + 7 package entries | `Select-String` / `Get-Content` (§10.1) → `b1-build-wiring.txt` | Zero `@import "tailwindcss"` matches → `BLOCKED — BASELINE MOVED`. A different line number is drift: record both. |
| 4 | Checkpoint 3 | none | B2 = 10 live `@apply` lines; 6 comment-only hits elsewhere | `Select-String` count + per-hit read (§10.2) → `b2-apply.txt` | Count `0` → `BLOCKED — BASELINE MOVED`. A live `@apply` outside `globals.css` → record as drift, continue. |
| 5 | Checkpoint 4; probe written to `$env:TEMP`, **outside** the repo | none (repo) | 185 theme-inline-only names; 8 files / 18 pairs / 27 uses / 4 story uses | `node.exe $env:TEMP\task771-theme-inline-census.mjs` (§10.3) → `b3-theme-inline-census.txt`, `b3-probe-source.mjs.txt` | `pairs: 0` → `BLOCKED — BASELINE MOVED`. `git status --porcelain` non-empty immediately after the run → `BLOCKED` (probe leaked a path). A scanner banner in the transcript means a module self-executed → re-run with the probe path as `argv[1]`. |
| 6 | Checkpoint 5 | none | B4 counts + per-area distribution | six `rg` commands (§10.4) → `b4-utility-census.txt` | `0` files → `BLOCKED — BASELINE MOVED`. Any other value is drift: record beside the kickoff number. |
| 7 | Checkpoints 3–6 complete | `docs/tailwind-governance.md` | §17.1–§17.10 present; §1–§16 unchanged | manual append + `git --no-optional-locks diff -- docs/tailwind-governance.md` → `final-status.txt` | Diff touches any line above the appended section → revert the file and re-append; a `Q0` read-after-write mismatch → `PARTIALLY IMPLEMENTED`. |
| 8 | Checkpoint 7 | session log, evidence dir, `docs/backlog.md` | Records complete and concise | manual write → the paths themselves | Backlog entry restating §17 → rewrite to concise state before reporting. |
| 9 | Checkpoints 0–8 | none | Final state clean of forbidden paths; `check:mojibake` and `check:file-integrity` exit 0; three gates still 0 | §13 commands → `final-checks.txt`, `final-status.txt`, `final-gates.txt` | Any `src/`, `scripts/`, config or lockfile path in the final porcelain → `BLOCKED`, and the report says so. Any non-zero exit → `PARTIALLY IMPLEMENTED`. |

Dynamic values tested at both ends: **empty** porcelain is the required pass state at checkpoints 0–1 and a
**forbidden** state for the write set at checkpoint 9 (four paths must appear); **zero** is the required value for
every predecessor gate's findings and a **stop condition** for every blocker-class count. The only task-created
artifacts are the four documentation paths and the out-of-repo probe; all of them are created **after** every
measurement in checkpoints 3–6, so none can enter its own census. The B3 census additionally excludes
`src/app/globals.css` by construction, so the declaration source is never counted as a consumer.

### A.3 Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | A second arm keyed on the retired route-inventory task's state (the brief's) | `ANALYTICAL` — §3.3, from the measured B1–B4 facts: both arms terminate without a verdict | Blocked or separate contract | **Removed from the task**; recorded in §3.3 and A.1 |
| Stateful baseline / manifest | Empty porcelain treated as a missing artifact | `EXECUTED` — architect ran `git --no-optional-locks status --porcelain` 2026-08-27: 33 lines, a non-empty state that the comparator must reject at checkpoint 0 | Distinct, fail-closed outcomes for empty vs non-empty | Checkpoint 0 defines empty = pass, non-empty = `BLOCKED`; both explicit |
| Status or diff assertion | An unexpected new path (the probe) inside the repo | `EXECUTED` — the probe was run by the architect from outside the repository tree (`$HOME`), and `git status --porcelain` gained no entry from it | Comparator rejects a leaked path | Checkpoint 5 + AC7 assert the post-probe porcelain |
| New gate | — | — | — | **N/A: this task creates no gate** (§8.5, R7). The probe is a one-shot measurement whose source is retained as a transcript, never as a repository path or npm script. |
| Task-created artifact | Evidence directory counted by its own census | `EXECUTED` — the architect's census walks `src/` only; `docs/sessions/evidence/task771/` cannot enter it, and the four written paths are created at checkpoints 7–8, after all measurement | Count/scope difference detected | Creation order fixed by the matrix; census root is `src/` |
| Probe self-execution | An imported scanner running its own `main` and polluting the transcript | `EXECUTED` — architect's run of the §10.3 probe verbatim printed only the probe's own six lines; both modules guard on `process.argv[1]` | No scanner banner in the transcript | Checkpoint 5 comparator |

### A.4 Publication and review gate

The kickoff was rebuilt from the final document text after the last revision: every §3 number was re-measured
against the working tree, the §10.3 probe was extracted **from this file** and executed verbatim, and its output
matched §3.2 B3 exactly. The task author does not approve execution; Opus reviews the executor's evidence against
`.claude/skills/review-task/SKILL.md`.

## Appendix B — Unwaivable rule-compliance ledger (`docs/orchestrator-rule-compliance-ledger-template.md`, completed)

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → Git policy: mutating Git is owner-only, native PowerShell | The task must start from a clean tree it cannot create itself | Executor uses read-only Git only; the owner commits | §8.10, §10.0 step 2, §14.8; `preflight-git.txt` | `COMPLIANT` |
| `CLAUDE.md` → Task and review rules: every task belongs to a sprint; kickoff at `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md` | Task 771 is Sprint 65's Level-4 item (§6 of the sprint file) | Kickoff saved at the sprint path and its row added to the sprint's Tasks table | This file's path; the sprint file's §6 row | `COMPLIANT` |
| `CLAUDE.md` → Sonnet never self-approves | Sonnet executes | Strongest status is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` | §1, §15.1 | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q0` row | Only docs/task files change | Read-after-write, markdown/reference validation, contradiction scan; no product validation | §13, AC11 | `COMPLIANT` |
| `docs/qa-profiles.md` → `npm run build` hard gate for **non-Q0** | Profile is `Q0` | Not required | §4 note, §13 | `NOT APPLICABLE` — the rule's own scope excludes `Q0`; no build claim is made anywhere in the task. |
| Sprint 65 §3 rule 1 — the control ships with the fix | No fix and no detector exists in this task | No new control required | §8.5, R7, A.3 row 4 | `NOT APPLICABLE` — there is no changed or new detector; the rule's subject is absent. |
| Sprint 65 §3 rule 2 — no author-applied exemption | Gates are run read-only, unchanged | No marker, allowlist or baseline row added | §8.5, AC7 | `COMPLIANT` |
| Sprint 65 §3 rule 6 — no new permanent story for a detector | `HeroSearch.stories.tsx` is a visible temptation (§3.2 B3) | No story added, extended or probed | §8.4, §14.7 | `COMPLIANT` |
| Sprint 65 §8 — no removal of `@import` / `@apply` / `@source` / `@custom-variant` | This task's whole subject is those directives | They are measured and left byte-identical | §8.1, AC6, R6 | `COMPLIANT` |
| Sprint 65 §5 **D65-A** (pending) | `PerfDevOverlay.tsx` holds 2 of the 18 B3 reads | Out of scope until decided; recorded, not decided | §5 `Q1`, §8.4, §17.5 | `COMPLIANT` |
| Sprint 65 §5 **D65-C** (2026-08-24) | The audit borders on route certification | Not duplicated here; recorded as an accepted limitation per the 2026-08-27 owner decision | §8.8, §17.7, AC8 | `COMPLIANT` |
| Plan default — Mantine-only screenshots for rendered changes | No rendered code changes | No screenshot command in completion criteria | §1, §13, §14.7 | `NOT APPLICABLE` — the default's scope is "tasks that change rendered Homepage code"; this task changes none. |
| `docs/agent-contract.md` P0 — evidence before claim | Every §3 number is a claim in the record | Each is measured and re-measured with a retained transcript | §3 disclosure, §10, AC2 | `COMPLIANT` |
| `docs/ai-behavior.md` → Backlog & Session Log Rules | The task writes both | Concise backlog state; detail in the session log | §10.7, AC10 | `COMPLIANT` |
| `CLAUDE.md` → Documentation update rule | The record needs a home | Most specific existing file, not `CLAUDE.md` | §3.6, §10.6 | `COMPLIANT` |
| `create-task` → permanent Storybook creation gate | No story markup is proposed | Gate not triggered | §8.4 | `NOT APPLICABLE` — no story is added, extended or probed; the gate's subject is absent. |

Every applicable row is `COMPLIANT`; each `NOT APPLICABLE` row names the concrete scope reason from the rule
itself. No row is waived, reinterpreted or replaced by an alternative mechanism.

---

## Handoff

Execute from the saved path above, under `.claude/skills/execute-task/SKILL.md`.

Start at **§10.0** and stop there if the tree is not clean or Task 770 is not in the audited commit. Report
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED` — never an approval. Update
`docs/backlog.md` with concise state and write the session log; Opus reviews the real diff and evidence against
`.claude/skills/review-task/SKILL.md`.
