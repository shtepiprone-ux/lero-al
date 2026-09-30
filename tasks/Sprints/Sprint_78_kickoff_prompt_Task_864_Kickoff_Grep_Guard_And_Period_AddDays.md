# Task 864 — no kickoff can ship a `git grep` that is blind to the files its task creates; `period.ts` exports `addDays`

**Sprint 78** (hosted by discovery, not goal fit) · **P2** · **Q1** · Track B (non-UI) · filed 2026-09-20 by Task 848's
review; partly applied 2026-09-25 (the 852–856 kickoffs) · kickoff written 2026-09-29 · **Status: 📝 `KICKOFF FILED` —
revision 1 (2026-09-30, §16): waits for 886's commit; policy edits moved to Opus. §16 overrides every section it names.**

Executor: run this file through the `execute-task` workflow. Strongest permitted status: `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`. No mutating Git command, ever.

## 1. Mode and task type

- Mode: `TASK DESIGN` → implementation handoff.
- Task type: **Governance / tooling** (a kickoff guard wired into the Opus `Stop` hook, one procedure paragraph, one
  skill line) + **a small library export** (`src/lib/dashboard/period.ts`) and its one consumer. No UI, no database.
- Execution state: `from-scratch`.
- GR-1 / GR-3 / GR-3a–d: **not applicable** (no visible surface).

## 2. Objective

1. State once, in the procedures, that a kickoff's `git grep` is written `git --no-optional-locks grep --untracked`,
   and why.
2. Build `check:kickoff-git-grep`: it fails when a live kickoff in `tasks/Sprints/` carries a `git grep` command without
   `--untracked`, except the files baselined at execution time. Wire it into the Opus `Stop` hook next to
   `check:backlog-active`, so the orchestrator cannot publish a new plain-form kickoff.
3. Export `addDays` from `src/lib/dashboard/period.ts` and move Task 848's `expiringWindowUtc` onto it, with its
   existing test unchanged and green.

## 3. Verified context (measured 2026-09-29, win32, Node v22.22.3)

### 3.1 Why the plain form is vacuous

`git grep` without `--untracked` reads tracked files only, so it returns nothing for a file the task **creates**,
whatever that file contains. Two-armed proof on record (reserved row, Appendix D): against Task 848's untracked
`src/modules/cabinet/statistics/`, the plain form exited 1 with no output, and the `--untracked` form printed the 3 real
hits. `--untracked` also reads tracked files, so it is safe for every path. It still respects `.gitignore`: an ignored
path (`.next/`, `storybook-static/`) needs `rg` or `Select-String`. FACT (reserved row) + the `git grep` manual.

### 3.2 Census of live kickoffs — `tasks/Sprints/*kickoff_prompt*.md`, 2026-09-29

Lines carrying `git grep` / `git --no-optional-locks grep`, and how many of them lack `--untracked` (shell loop, FACT):

| Kickoff | plain / total |
|---|---|
| `Sprint_30_…Task_353…` | 1/1 |
| `Sprint_34_…Task_397…` | 1/1 |
| `Sprint_46_…Task_741…` | 7/7 |
| `Sprint_57_…Task_897…` | 8/8 |
| `Sprint_78_…Task_855…` | 3/8 |
| `Sprint_78_…Task_856…` | 1/4 |
| `Sprint_78_…Task_863…` | 4/4 |
| `Sprint_78_…Task_865…` | 2/2 |
| `Sprint_78_…Task_868…` | 3/3 |
| `Sprint_78_…Task_890…` | 2/6 |
| `Sprint_83_…Task_886…` | 0/1 |
| `Sprint_84_…Task_885…` | 3/3 |
| `Sprint_84_…Task_893…` | 4/4 |

Many of these grep **tracked** paths, where the plain form is correct. 893 is in execution now. This task therefore does
**not** rewrite existing kickoffs: it baselines them (R3) and blocks new ones. The census is a loose line count; the
guard's own detector (R2) decides the real baseline at I0.

### 3.3 The enforcement point

`.claude/hooks/orchestrator-response-gate.ps1` (123 lines, `git hash-object` =
`a88e1f35591ff3233ae76afc5ad6375bdf92d932`) runs `node scripts/check-backlog-active.mjs` on every Opus response
(`:52-68`), blocks on exit **1** only, and fails open on anything else. `.github/workflows/governance-pr.yml` runs on
`pull_request` only (`:3-4`); commits pushed straight to `main` never reach it. FACT. So the hook is the effective
enforcement; CI is not added here.

### 3.4 `period.ts`

`src/lib/dashboard/period.ts` (249 lines, hash `c28caa806c3868950ccb88fbffcf8595c55682c1`) defines a private
`addDays(date, delta)` at `:71-73` (used by `tiraneYesterday`, `resolvePeriod`, `previousPeriod`, `listDates`,
`tiraneDayUtcBounds`). `src/modules/cabinet/statistics/data.ts` (hash `e43f72c30cfdb0a0d396a893818f7cdeb66e5c11`)
`:115-120` builds the AGT-01 expiring window with a deliberately inconsistent `Period` (`to: today`, `days: 8`) because
no forward day-add was exported. Its behaviour is pinned by `src/modules/cabinet/statistics/__tests__/data.test.ts:269`
(*"the expiring window runs from the start of today to the start of today+8 in Tirane"*). FACT.

**Constraint from Task 863** (`KICKOFF FILED`): 863 fingerprints `data.ts:354`'s text
`.gte('expires_at', window.startUtc)`. Keep the local variable name `window` and do not edit line 354.

### 3.5 Worktree at design time

Task 893 holds four modified paths and one untracked evidence folder — `EXCLUDED AS UNRELATED`.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| R1 | reserved row | `docs/orchestrator-procedures.md` → "Detector-aware requirements and migrations" gains one paragraph: *a `git grep` in a kickoff is written `git --no-optional-locks grep --untracked`; the plain form reads only tracked files and is vacuous over paths the task creates (two-armed proof: Task 848, reserved row 864); `--untracked` still skips ignored paths, which need `rg`/`Select-String`; enforced by `check:kickoff-git-grep` in the Opus Stop hook.* `.claude/skills/create-task/SKILL.md` → "Quality gate before publication" gains one bullet pointing at that paragraph. | P1 | AC1 | Confirmed |
| R2 | reserved row | `scripts/check-kickoff-git-grep.mjs` (Node, UTF-8 I/O) scans `tasks/Sprints/*kickoff_prompt*.md`. A **finding** is: (a) a line inside a fenced code block whose trimmed text starts with `git` and matches `\bgit(\.exe)?\s+(--no-optional-locks\s+)?grep\s+\S`; or (b) an inline code span whose content starts with `git` and matches the same pattern (so the bare noun `` `git grep` `` with no argument is not a command). A finding without `--untracked` is **plain**. A line containing the literal marker `kickoff-git-grep:quoted` (written as an HTML comment) is skipped: it is how a kickoff quotes a historical command verbatim. Prose outside backticks is ignored. Every run prints one scope line stating (a), (b), the marker, the prose exclusion and that `tasks/Archive/` is not scanned. | P1 | AC2 | Confirmed |
| R3 | §3.2 | `scripts/kickoff-git-grep-baseline.json` `{ "<path>": <plain count> }`, written by `--update-baseline` at I0. Exit 1 when a file outside the baseline has ≥ 1 plain finding, or a baselined file's plain count grew; the message names file, line and text. A baselined file that is gone or whose count fell prints `stale baseline entry` and does **not** fail (kickoffs move to `tasks/Archive/` on every approval). Exit 2 on unreadable input. `package.json` gains `check:kickoff-git-grep`, `check:kickoff-git-grep:update-baseline`, `check:kickoff-git-grep:verify`. | P1 | AC3 | Confirmed |
| R4 | two-armed rule | `--verify-gate` runs built-in fixtures: plain fenced line → finding; `--untracked` fenced line → clean; plain inline span with arguments → finding; inline noun span with no argument → clean; prose without backticks → clean; a plain line carrying the `kickoff-git-grep:quoted` marker → clean; an `--untracked` inline span with `-n x -- src` → clean; baselined count unchanged → clean; count +1 → fail. 9/9 expected, 0 failed. | P1 | AC4 | Confirmed |
| R5 | §3.3 | The Stop hook runs `node scripts/check-kickoff-git-grep.mjs` exactly as it runs `check-backlog-active.mjs` (same `Continue` wrapper, blocks on exit 1 only, fails open otherwise), and appends the output under the heading `GR-6/864 VIOLATED — a kickoff carries a git grep without --untracked`. Nothing else in the hook changes. | P1 | AC5 | Confirmed |
| R6 | reserved row fold-in | `period.ts` exports `addDays` (the existing function, unchanged body) with a doc comment. `period.test.ts` gains a `describe('addDays')`: +1 over the DST start (`2026-03-28` → `2026-03-29`), −1 over a year boundary (`2026-01-01` → `2025-12-31`), +8 from `2026-09-29` → `2026-10-07`. | P2 | AC6 | Confirmed |
| R7 | reserved row fold-in; §3.4 | `data.ts` `expiringWindowUtc` becomes `const today = tiraneDateOf(now); return periodUtcBounds(resolvePeriod({ kind: 'custom', from: today, to: addDays(today, EXPIRING_DAYS_AHEAD) }, now))`; the `listDates` import goes if unused. `data.test.ts:269` passes **unchanged**; line 354 is byte-identical. | P1 | AC7 | Confirmed |
| R8 | agent-contract 10 | Session log; `docs/backlog.md` 864 cell; ≤ 80 lines. | P2 | AC8 | Confirmed |

## 5. Assumptions and open questions

- A1: the baseline freezes today's plain forms instead of rewriting them. Rewriting live kickoffs (one of them in
  execution) would change executor instructions mid-task. A kickoff revised later drops out of the baseline naturally
  when its count falls (stale warning, then `--update-baseline`).
- A2 (INFERENCE): a `git grep` inside a PowerShell block that also pipes through `Tee-Object` still starts with `git`
  on its trimmed line, so R2(a) sees it.
- Open owner questions: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (GR-5, GR-6 and the enforcement table) · `docs/agent-contract.md` (9, 10, 14) ·
`docs/rule-index.md` → governance/tooling · `docs/qa-profiles.md` (Q1) · `docs/orchestrator-procedures.md` →
"Detector-aware requirements and migrations" and the 818/819 corollary · `.claude/hooks/orchestrator-response-gate.ps1`
in full · `scripts/check-backlog-active.mjs` (shape to copy) · this kickoff.

## 7. Scope — the exact allowed write set

1. new `scripts/check-kickoff-git-grep.mjs`, new `scripts/kickoff-git-grep-baseline.json`
2. `package.json` — three script lines only
3. ~~`.claude/hooks/orchestrator-response-gate.ps1` — R5 block only~~ **Opus, not the executor (§16.2)**
4. ~~`docs/orchestrator-procedures.md` — one paragraph (R1); `.claude/skills/create-task/SKILL.md` — one bullet (R1)~~
   **Opus, not the executor (§16.2)**
5. ~~`docs/golden-rules.md` — the GR-6 enforcement-table row gains `+ check:kickoff-git-grep (Task 864)`~~ **Opus,
   not the executor (§16.2)**
6. `src/lib/dashboard/period.ts` (`export` + comment), `src/lib/dashboard/__tests__/period.test.ts` (R6)
7. `src/modules/cabinet/statistics/data.ts` — `expiringWindowUtc` and its import line only (R7)
8. `docs/sessions/2026-MM-DD-task864-kickoff-grep-guard.md`, `docs/sessions/evidence/task864/`
9. `docs/backlog.md` — the 864 text only

## 8. Out of scope

- Rewriting any existing kickoff's `git grep` lines.
- CI wiring (§3.3), `rg`/`Select-String` detection, archived kickoffs.
- Any other `period.ts` change; any other `data.ts` line (863 owns `:354`'s fingerprint).

## 9. Current and required behavior

| | Current | Required after |
|---|---|---|
| New kickoff with a plain `git grep` | ships silently | Opus Stop hook blocks the response, naming file and line |
| Existing kickoffs | unchanged | unchanged (baselined) |
| Kickoff archived on approval | — | stale warning, no block |
| `addDays` | private | exported, same body |
| AGT-01 expiring window | today..today+8 via `listDates` | same bounds via `addDays` (test `:269` unchanged) |

## 10. Implementation requirements

### 10.1 I0

0. **Revision 1 start gate (§16.1).** `package.json` must equal `HEAD`, and `HEAD` must already carry Task 886's
   `check:type-responsive` script. Otherwise stop with `BLOCKED — 886 NOT LANDED` and write nothing.
1. `node.exe -p "process.platform + ' ' + process.version"` → `win32`.
2. `git --no-optional-locks status --porcelain` → `docs/sessions/evidence/task864/00-status.txt`; a §7 path already
   modified → `BLOCKED — WRITE PATH NOT CLEAN`.
3. `git hash-object` of every §7 existing path → `01-hash-before.txt`; compare with §3.3/§3.4 and re-read on mismatch.
4. `npx.cmd vitest run src/lib/dashboard/__tests__/period.test.ts src/modules/cabinet/statistics/__tests__/data.test.ts`
   → `02-tests-before.txt` (exit 0 expected).

### 10.2 Order

I0 → R2/R4 script + `--verify-gate` → `--update-baseline` (R3) → R6 → R7 → gates → session log. R1, R5 and the P3
hook proof are Opus's, at review (§16.2).

### 10.3 Proofs

| Proof | Steps | Expected |
|---|---|---|
| **P1** guard, failing arm | through Node, append to one baselined kickoff a fenced block holding the plain command (git, grep, then -n foo -- src, with no untracked flag); run the guard | exit 1 naming that file and line; restore → hash equal, exit 0 |
| **P2** guard, new file | create `tasks/Sprints/Sprint_78_kickoff_prompt_Task_000_Probe.md` with one plain fenced line; run; delete | exit 1; after delete exit 0; the file absent from status |
| **P3** hook — **run by Opus at review, not the executor (§16.2)** | pipe a synthetic Opus Stop event (copy the shape the backlog proof used: `transcript_path` to a JSONL whose last assistant text contains `TASK-DESIGN PREFLIGHT COMPLETE`) into `powershell -File .claude\hooks\orchestrator-response-gate.ps1` with P2's probe file present, then absent | exit 2 with the R5 heading, then exit 0; `git status --short tasks/` shows no probe |
| **P4** period | temporarily change R7's `EXPIRING_DAYS_AHEAD` argument to `EXPIRING_DAYS_AHEAD - 1` | `data.test.ts:269` fails; restore → passes, hash equal |

Node `fs` I/O for every plant; `git hash-object` before and after each.

## 11. Positive and negative flows

**Positive flow.** An orchestrator writes a kickoff whose AC greps a folder the task creates, in the plain form; the
response is blocked with the file and line; it adds `--untracked`; the response finishes.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Plain grep in a new kickoff | Yes | exit 1 / hook exit 2 | P1–P3 |
| `--untracked` form | Yes | clean | R4 |
| Prose mention | Yes | clean (boundary) | R4 |
| Kickoff archived | Yes | stale warning, exit 0 | R3 |
| Script crash / missing node | Yes | hook fails open | R5 (same wrapper) |
| Sonnet session | Yes | hook exits 0 before the check (Opus-only, `:41-46`) | code path |

## 12. Acceptance criteria

- **AC1 [R1] — Opus review closure (§16.2), not an executor criterion.** Given the two docs, then each carries the R1
  text and no other line changed.
- **AC2 [R2]** Given any run mode, then the scope line prints once before results.
- **AC3 [R3]** Given the final tree, when `check:kickoff-git-grep` runs, then it exits 0; the baseline's keys equal the
  files the I0 `--update-baseline` run found, and none of this response's new kickoffs (887, 888, 864, 892, 896, 858,
  857, 859, 894, 895) is a key.
- **AC4 [R4]** Given `check:kickoff-git-grep:verify`, then it reports 9 passed, 0 failed.
- **AC5 [R5] — Opus review closure (§16.2), not an executor criterion.** Given P3, then the hook exits 2 with the R5 heading while the probe exists and 0 after; the hook diff
  adds only the R5 block.
- **AC6 [R6]** Given `period.test.ts`, then the three `addDays` cases pass and every earlier case passes unchanged.
- **AC7 [R7]** Given P4 and the final tree, then `data.test.ts` passes unchanged, P4 makes `:269` fail, and
  `data.ts:354` has the same text as in `01`.
- **AC8 [R8]** Given the session log, then its Files Changed table equals the real diff of §7; backlog ≤ 80 lines.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: none.`

`GR-2 SCOPE STATED — check:kickoff-git-grep inspects fenced lines and inline code spans that start with git in tasks/Sprints/*kickoff_prompt*.md; it cannot see prose mentions, archived kickoffs, or a vacuous rg/Select-String; the criteria are closed by the P1–P4 transcripts and hashes.`

## 13. QA profile and verification plan

**Q1** — tooling and a behaviour-preserving library refactor with an existing pinning test.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task864"
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run check:kickoff-git-grep *> "$ev\20-guard.txt"; "guard exit=$LASTEXITCODE"
npm.cmd run check:kickoff-git-grep:verify *> "$ev\21-guard-verify.txt"; "verify exit=$LASTEXITCODE"
npm.cmd run check:backlog-active *> "$ev\22-backlog-active.txt"; "backlog exit=$LASTEXITCODE"
npx.cmd vitest run src/lib/dashboard/__tests__/period.test.ts src/modules/cabinet/statistics/__tests__/data.test.ts *> "$ev\23-tests.txt"; "tests exit=$LASTEXITCODE"
npm.cmd run check:listing-visibility *> "$ev\24-listing-visibility.txt"; "listing-visibility exit=$LASTEXITCODE"
npm.cmd run typecheck *> "$ev\25-typecheck.txt"; "typecheck exit=$LASTEXITCODE"
npm.cmd run lint *> "$ev\26-lint.txt"; "lint exit=$LASTEXITCODE"
npm.cmd run check:file-integrity *> "$ev\27-file-integrity.txt"; "file-integrity exit=$LASTEXITCODE"
npm.cmd run check:mojibake *> "$ev\28-mojibake.txt"; "mojibake exit=$LASTEXITCODE"
npm.cmd run build *> "$ev\29-build.txt"; "build exit=$LASTEXITCODE"
git hash-object scripts\check-kickoff-git-grep.mjs scripts\kickoff-git-grep-baseline.json .claude\hooks\orchestrator-response-gate.ps1 src\lib\dashboard\period.ts src\modules\cabinet\statistics\data.ts
git --no-optional-locks status --porcelain
```

Expected: `win32`; guard, verify, backlog, tests, typecheck, lint, integrity, mojibake and build exit 0;
`check:listing-visibility` exit as in `01`'s era (0 if 887 landed, else 1 on `contactEvents.ts:50` only — never a new
line from `data.ts`).

## 14. Completion report contract

Status per `execute-task`. Include the changed files and hashes, R1–R8/AC1–AC8 with evidence, each command's real exit
code, P1–P4 with hashes, the final baseline's keys, and limitations (prose blind spot, CI not wired). Update the 864
cell of `docs/backlog.md`; write the session log. No Git commands.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R1→AC1 … R8→AC8 |
| Guard can fail | P1, P2, P3 |
| Refactor pinned | `data.test.ts:269` + P4 |
| 863 collision avoided | §3.4, R7 (`:354` untouched) |
| Owner decision needed | none |

## 16. Revision 1 — 2026-09-30, after the executor's I0 block

The first execution stopped at I0 and wrote nothing. Both blockers were confirmed at review and both are defects in
this kickoff, not in the execution. This section overrides §7, §10, §12, §13.1 and §14 where it names them.

### 16.1 F2 — `package.json` belongs to Task 886 until 886 lands

- **Found (FACT, 2026-09-30).** `git diff package.json` shows +2 lines, `check:type-responsive` and
  `check:type-responsive:verify`. They are Task 886's, and 886 revision 1 is `IMPLEMENTED - AWAITING ORCHESTRATOR
  REVIEW`. The §3.5 worktree note (893's paths) is stale: 893 has since been approved and committed.
- **Correction.** 864 starts only after 886 is approved and its commit, `package.json` included, is on `HEAD`. The
  owner does **not** commit or stash 886's work to unblock 864. Committing it would publish an unreviewed
  implementation, and stashing it would put 886's evidence at risk.
- **I0 step 0**, which §10.1 references, is the block below. Run it before anything else:

```powershell
node.exe -p "process.platform + ' ' + process.version"
git --no-optional-locks diff --quiet HEAD -- package.json; "package.json clean exit=$LASTEXITCODE"
git --no-optional-locks show HEAD:package.json | Select-String -SimpleMatch '"check:type-responsive"'
```

Expected: `win32`; `clean exit=0`; one match line. Any other result → `BLOCKED — 886 NOT LANDED`, with no write.

### 16.2 F1 — the executor may not edit policy files; R1, R5 and the GR-6 row are Opus's

- **Found (FACT).** §7 items 3–5 gave the executor `.claude/hooks/orchestrator-response-gate.ps1`,
  `docs/orchestrator-procedures.md`, `.claude/skills/create-task/SKILL.md` and `docs/golden-rules.md`.
  `.claude/skills/execute-task/SKILL.md` → "Absolute policy-file boundary" and `.claude/agents/executor.md` →
  "Absolute policy-file boundary" make every one of them read-only for Sonnet. Both files also state that a kickoff's
  allowed-files list cannot delegate that authority. AC1 and AC5 were therefore unsatisfiable by the executor.
- **Executor scope, final:** §7 items 1, 2, 6, 7, 8 and 9. The executor proves R2/R3/R4/R6/R7/R8 with P1, P2, P4 and
  the §13.1 block, unchanged. It opens no policy file for writing. Its completion report states
  `policy files touched: NONE` and quotes the guard's exit-1 output from P1 verbatim, because Opus's R5 heading wraps
  that text.
- **Opus review closure, applied only after the executor's guard passes review:**
  1. R1: the procedures paragraph and the `create-task` bullet, worded as in §4 R1 (AC1).
  2. R5: the hook block, using the same `Test-Path` guard, the `Continue` wrapper and the exit-1-only rule as the
     `check-backlog-active.mjs` block. That way a missing script fails open (AC5).
  3. The GR-6 enforcement-table row in `docs/golden-rules.md` gains `+ check:kickoff-git-grep (Task 864)`.
  4. P3, run by Opus, with hook `git hash-object` before and after, and the transcript saved in
     `docs/sessions/evidence/task864/`.
  These four ship in the approved-review commit. The owner's commit of that handoff is the owner's sign-off on the
  policy text.
- **Why at review and not now.** The R1 text says "enforced by `check:kickoff-git-grep`". Writing it before the script
  exists would record an enforcement that is not there (GR-2).

## Appendix A — Evidence preflight

| Claim | Evidence | Status |
|---|---|---|
| Plain `git grep` blind to created files | reserved row two-armed measurement (848) | VERIFIED (recorded) |
| Live-kickoff census | shell loop 2026-09-29 | VERIFIED (loose; the guard re-measures) |
| Hook runs backlog check, fails open | hook `:52-68` | VERIFIED |
| CI is PR-only | `governance-pr.yml:3-4` | VERIFIED |
| `addDays` exists privately | `period.ts:71-73` | VERIFIED |
| Expiring window pinned by a test | `data.test.ts:269` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| agent-contract 9 | build exit 0; new script referenced from `package.json` and the hook | COMPLIANT |
| agent-contract 14 | Node I/O, hash witnesses | COMPLIANT |
| GR-2 | scope line printed every run | COMPLIANT (R2) |
| Corollary (Sprint 75) | narrowing stated in the kickoff and printed | COMPLIANT |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | I0 | `BLOCKED` |
| 1 | Verify 9/9 | fix the detector before baselining |
| 2 | Baseline written; guard exit 0 | a new kickoff in the baseline → remove it and fix the kickoff |
| 3 | P1–P2 (P3 is Opus's, §16.2) | any arm not failing → `BLOCKED` |
| 4 | R6/R7 + P4 | `:269` changed or failing → `PARTIALLY IMPLEMENTED` |
| 5 | Final gates | non-zero → `PARTIALLY IMPLEMENTED` |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **864** | reserved 2026-09-20 — **partly applied 2026-09-25: `--untracked` added to all 16 `git grep` commands in the 852–856 kickoffs (each carries a revision note). Still open: a guard so a future kickoff cannot ship the plain form, and the `period.ts` forward day-add export.** **Sprint 78** (hosted by discovery, not goal fit; the owner may move it), **P2**, filed by Task 848's review | **Every `git grep` acceptance command in this sprint's kickoffs is vacuous against the files the task creates, and this is the third time it has been found.** `git grep` reads the index, so a kickoff whose Scope is "Created: …" produces an empty result **whatever the new files contain** — an AC of the form "when run, then it prints nothing" is closed by a detector that inspected nothing (GR-2's exact failure class). Measured 2026-09-20 on win32/Node 22.22.3 against Task 848's untracked `src/modules/cabinet/statistics/`: `git --no-optional-locks grep -n -E "createAdminClient" -- src/modules/cabinet/statistics` → **exit 1, no output**; the same command with `--untracked` → the real 3 hits (`data.ts:144,145`, `data.test.ts:54`); `rg` over the working tree → byte-identical to the `--untracked` form. **History:** Task 843's review 1 found it and fixed that one kickoff (6 `--untracked` lines); Task 847's executor found it again and re-ran with `--untracked`; Task 848's kickoff shipped the plain form anyway on **8** grep lines, its executor silently ran `--untracked` without recording the deviation, and its session log cites the kickoff's command against the result of a different one. **Census of the still-open kickoffs carrying the plain form, measured at filing (re-measure at execution):** ~~850 (1)~~ · ~~851 (2)~~ · 852 (4) · 853 (2) · 854 (3) · 855 (4) · 856 (2) — zero `--untracked` in any of them, and every one creates new files. **851 closed 2026-09-20 without being affected:** its two grep lines target `src/app/api/cron`, whose four `route.ts` files are **tracked and modified**, not created, so `git grep` read the working tree and returned the real 8 export hits (`docs/sessions/evidence/task851/g10-grep-exports.log`). **850 closed 2026-09-20 for the same reason:** its single grep line targets four files that are **tracked and modified**, not created, so it read the working tree and returned the real 4 `listingOwnerId` prop hits. That is the boundary this task must state: the defect is specific to paths the same task **creates**, not to `git grep` as such. Five kickoffs remain. Deliverable: decide the canonical form once (`--untracked` vs a working-tree `rg`/`Select-String`, stating the boundary — `git grep` still respects `.gitignore` semantics, `rg` does not read the index at all), amend those seven kickoffs' §13.2 blocks and their ACs, and state in `docs/orchestrator-procedures.md` that an **empty-grep AC over paths the same task creates requires a detector that reads the working tree**, with the two-armed proof being the pair above (plain → empty on a file that provably contains the string; corrected form → the hits). **Fold in, from 848's review:** `src/lib/dashboard/period.ts` exports no forward day-add, so 848's `expiringWindowUtc` builds a `Period` whose `to` is deliberately inconsistent with its `days` and relies on `listDates` reading only `from`+`days`; export `addDays` (or a `windowOf(from, days)`) and move 848 onto it — `period.ts` is 846's approved file, which is why 848 did not touch it. <!-- kickoff-git-grep:quoted --> |
