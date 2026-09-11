# Task 818 — The advisory gate becomes blocking: a versioned fail-on-new baseline, and a self-test that proves it can fail

Sprint 75 · P0 · QA profile Q4. Executor: Sonnet.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 1. Requirement and acceptance-criteria evidence

| Req | AC | Evidence | Result |
|---|---|---|---|
| R1 (versioned baseline) | AC1 | `scripts/rendered-scope-baseline.json` — `version: 1`, `edges` object keyed `"<from> -> <to>"`, 29 entries, sorted. First 3 keys quoted in §3. | Confirmed |
| R1 (missing/bad version = hard error) | AC2 | `AC2_version-mismatch_probe.txt` — version forced to 999, gate fails naming "version 999 does not match the expected version 1", exit 1, no PASS line; restored, `git hash-object` identical before/after. | Confirmed |
| R2 (baseline comparison replaces unconditional fail) | AC3 | `R3_gate_clean-tree.txt` — clean tree: 0 new, 0 stale, exit 0. | Confirmed |
| R2 (new edge fails, named) | AC4 | `AC4_new-tier1-edge_probe.txt` — planted `RecentlyViewedSection.tsx` as a manifest root; gate names 2 new tier1-unenrolled edges (`-> ClearRecentlyViewedButton.tsx`, `-> RecentlyViewedGrid.tsx`), exit 1; manifest restored, hash identical. | Confirmed |
| R3 (stale entry fails; two failure shapes) | AC5 | `AC5_two-arms_probe.txt` — arm 1: baseline entry deleted (edge still exists) → reported **new**; arm 2: baseline entry pointed at a non-existent edge → reported **stale**. Both restored, hashes identical, one transcript. | Confirmed |
| R4 (`--update-baseline` refuses new tier-2) | AC6 | `AC6_new-tier2-edge_probe.txt` — a real tier-2 edge (`ListingCard.tsx -> AppImage.tsx`) deleted from the baseline (= "new" tier-2 edge); gate names it and fails; `--update-baseline` refuses it (prints 16d tier-2 correction, exit 1), writes 28 entries (not 29) both times it is run against the same prior state — byte-identical (empty diff); baseline restored, hash identical. | Confirmed |
| R5 (`package.json` script entries) | AC7 | `AC7_package-json_diff.txt` — `check:rendered-scope:update-baseline` and `check:rendered-scope:verify` added beside the existing two. | Confirmed |
| R6 (CI-safe self-test, 4 arms) | AC8 | `G4_check-rendered-scope-verify.txt` — 4/4 PASS, exit 0, `git status --porcelain` unchanged before/after (`R4_verify-gate_status.txt`); `R6_ac8_broken-arm_restore_witness.txt` — arm 4 deliberately broken (planted stale entry) → 3/4 pass, exit 1; restored, hash identical. | Confirmed |
| R7 (workflow: blocking + verify step) | AC9 | `AC9_workflow_diff.txt` — `continue-on-error` and the advisory name removed; `check:rendered-scope:verify` step added immediately after, no wrapper on either step. | Confirmed |
| R8 (scope-block counts + sentences) | AC10 | `R3_gate_clean-tree.txt` — baselined/new/stale counts printed, the tier-2-debt sentence, the pre-existing cannot-see sentence. | Confirmed |
| R9 (golden-rules.md rows + paragraph, nothing else) | AC11, AC12 | `git diff -- docs/golden-rules.md` shows only the GR-1/GR-3 table rows and the closing paragraph changed; grep for `census.*(enforced|CI-checked|blocking)` finds only the negation sentence itself. | Confirmed |
| R10 (storybook-governance.md §15.5) | AC13 | New "Blocking, baselined (Task 818" paragraph states blocking, baseline shape/ratchet, `--update-baseline` tier-2 refusal, and the unchanged dynamic-import/`React.lazy()` blind spot. | Confirmed |
| R11 (story-coverage/surface-census/manifest/allowlist unchanged) | AC14 | `check:story-coverage` identical to §13.1 baseline (38/0, exit 0); `check-surface-census.mjs --surface FavoritesShell.tsx --report` byte-identical to the §13.1 capture (`Compare-Object` empty); `git diff --stat` empty for all four named files. | Confirmed |

GR-4 AC audit: 14 criteria, each an observable property (counts, exit codes, named edges, printed sentences, diff emptiness); no absolute assertion of the AC10/AC12-mistake shape.

## 2. Current versus required behavior

**Before.** `check:rendered-scope` exited 1 unconditionally on 27 tier1 + 3 tier2 findings; the CI step swallowed the result with `continue-on-error: true` (advisory).

**After.** The gate compares the measured frontier (deduped by edge) against a versioned baseline. A baselined edge is recorded debt (does not fail); a new edge fails, named with its tier and correction; a stale baseline entry fails, naming the `--update-baseline` fix. A new tier-2 edge can never be silently baselined away. The CI step is blocking, immediately followed by a 4-arm self-test step.

Negative flows (from the kickoff's applicability table) all exercised: missing baseline file (`R1_gate_before_baseline_missing.txt`), bad version (AC2), unparseable JSON (`AC2` probe hit this once by accident via a PowerShell-BOM artifact and confirmed the parse-error branch fires — see §5), resolved-but-still-baselined = stale (AC5 arm 2), new tier-1 (AC4), new tier-2 refused by `--update-baseline` (AC6), tier-3/allowlist path unaffected (R11/AC14 — allowlist file untouched, its own validation checks left in place verbatim), `--report` unchanged (not touched by this diff — still exits 0, still ignores the baseline).

## 3. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-rendered-scope.mjs` | Baseline load/compare/update/write functions; `walkEnrolledSubgraph` extracted to a parameterised function; `--update-baseline` and `--verify-gate` CLI modes; unconditional tier1/tier2 failure replaced by baseline-diff failure; tier classification, allowlist logic and `--report` mode left unchanged. |
| `scripts/rendered-scope-baseline.json` (new) | Generated by `--update-baseline` (bootstrap mode) from a live run — 29 distinct edges, version 1. Never hand-edited. |
| `package.json` | Added `check:rendered-scope:update-baseline` and `check:rendered-scope:verify` script entries. |
| `.github/workflows/governance-pr.yml` | `check:rendered-scope` step loses `continue-on-error` and its advisory name; new `check:rendered-scope:verify` step added immediately after. |
| `docs/golden-rules.md` | GR-1 and GR-3 `Enforcement status` table rows, and the closing paragraph below the table, updated to state enrolled-subgraph enforcement plus the unclosed pre-enrolment gap. Nothing else in the file touched. |
| `docs/storybook-governance.md` | §15.5 gained a "Blocking, baselined (Task 818)" paragraph describing the baseline mechanism, the tier-2 refusal, the self-test, and the workflow change. |
| `docs/backlog.md` | Sprint 75 row and the 809/811/813-818 registry row updated: Task 818 status → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. File stays at 80 lines (the stated budget). |
| `docs/sessions/evidence/task818/*` (new) | All command transcripts and probe witnesses for this task. |

## 4. Validation evidence

§13.1 baseline (captured before any code was written): `R0_rendered-scope-report.txt` (252 edges resolved, 27 tier1 + 3 tier2 printed, exit 0), `R0_story-coverage.txt` (38/0, exit 0), `R0_surface-census.txt` (15-node `FavoritesShell.tsx` table, exit 0).

Distinct-edge count: 30 raw findings (27 tier1 + 3 tier2) collapse into **29** distinct edges — the printed 27 tier1 findings contain one duplicate binding (`ListingDetailView.tsx -> RecentlyViewedSection.tsx`, printed twice at lines 35-36 of the raw report), matching the kickoff's own stated defect to avoid.

§13.2 final gates, all native `win32` PowerShell, `node v22.22.3`:

| Command | Exit | Transcript |
|---|---|---|
| `node --check scripts/check-rendered-scope.mjs` | 0 | (inline, re-run after refactor) |
| `npm run typecheck` | 0 | `G1_typecheck.txt` |
| `npx eslint scripts/check-rendered-scope.mjs` | 0 (0 errors, 1 unrelated ignore-pattern warning) | `G2_eslint.txt` |
| `npm run check:rendered-scope` | 0 | `G3_check-rendered-scope.txt` |
| `npm run check:rendered-scope:verify` | 0 (4/4 PASS) | `G4_check-rendered-scope-verify.txt` |
| `npm run check:story-coverage` | 0 (38/0, identical to §13.1) | `G5_check-story-coverage.txt` |
| `npm run check:stories` | 0 (144 files, 0 violations) | `G6_check-stories.txt` |
| `node scripts/check-surface-census.mjs --surface FavoritesShell.tsx --report` | 0 (byte-identical to §13.1) | `G7_surface-census.txt` |
| `npm run build` | 0 | `G10_build.txt` |
| `npm run check:file-integrity` | 0 (39, then 41 after evidence-BOM cleanup, files clean) | `G8_file-integrity.txt`, `G11_file-integrity_final.txt` |
| `npm run check:mojibake` | 0 (0 artifacts / 4337 files) | `G9_mojibake.txt`, `G9_mojibake_recheck.txt` |

Bootstrap generation: `npm run check:rendered-scope:update-baseline` on the pristine tree (no baseline file existed) → wrote 29 entries, exit 0 (`R2_update-baseline_bootstrap.txt`). Preceding hard-fail proof that a missing baseline is never silently empty: `R1_gate_before_baseline_missing.txt` (exit 1, names the `--update-baseline` fix command).

Planted-arm evidence: §12 above cross-references every AC's probe transcript in `docs/sessions/evidence/task818/`.

## 5. Deviation — evidence-transcript BOM

Every `*>`/`Out-File -Encoding utf8`-redirected transcript in this session picked up a UTF-8 BOM, exactly the pitfall the kickoff's §10.7 named. All evidence `.txt` files were swept and rewritten BOM-free via `[IO.File]::WriteAllText(..., New-Object Text.UTF8Encoding($false))` after the fact, and `check:file-integrity` re-run clean (`G11_file-integrity_final.txt`, 41/41 files, exit 0). One incidental consequence: the first AC2 attempt (`Set-Content -Encoding utf8`, which also emits a BOM) hit the JSON-parse-error branch instead of the version-mismatch branch — this actually exercised and confirmed the parse-error path works, then the probe was redone BOM-free to hit the intended version-mismatch branch, which is the transcript quoted in §1.

## 6. Visual source trace / Canonical UI decision record

Not applicable — this task changes `scripts/`, `package.json`, one workflow file and two `.md` files. No rendered UI, no visible component, no Storybook artifact is touched (confirmed by R11/AC14's zero-diff on the story-coverage/surface-census/manifest/allowlist files).

## 7. Assumptions, deviations, limitations

- **`ASSUMPTION` (bootstrap tier-2 write).** `--update-baseline` against a *missing* baseline file (no prior state) writes every measured edge unconditionally, including the 3 pre-existing tier-2 edges — the tier-2 refusal (R4) applies only once a baseline file already exists and a tier-2 edge is absent from *that* prior file. Without this, the three tier-2 edges could never enter the baseline at all (R4 would refuse them on the very first write, since nothing is "already baselined" against an empty file), contradicting §10.1's mandate that the baseline's first content come from a live run. This is necessary to satisfy R1+R4+§10.1 together; not tested by name in any AC, but exercised implicitly by AC1's bootstrap generation (`R2_update-baseline_bootstrap.txt`, 29 entries including the 3 tier-2 edges, exit 0).
- **§5's `STOP — OWNER DECISION REQUIRED` does not block execution** (per the kickoff). Recorded here, not in the sprint file (Sonnet does not own sprint-file edits): after this task, `docs/golden-rules.md`'s enforcement statement is true for the **enrolled subgraph** and false for an **unenrolled surface's** pre-enrolment census — the exact case GR-1 was written for after Task 809. The owner decides (a) exit criterion 2 is met as qualified, (b) a further task closes the pre-enrolment half, or (c) the criterion is reworded. The wording written into `docs/golden-rules.md` is precise about this gap (R9/AC11/AC12) and never claims full enforcement.
- Deviation: the AC2 probe's first attempt used a BOM-producing PowerShell write and hit the wrong (but still correct-shaped) failure branch; redone cleanly — see §5.
- No limitation found in R1-R11's actual implementation; `scripts/check-story-coverage.mjs`, `scripts/check-surface-census.mjs`, `scripts/mantine-migration-scope.json`, `scripts/rendered-scope-allowlist.json` are byte-unchanged (R11/AC14).

## 8. Opus handoff

- Evidence root: `docs/sessions/evidence/task818/`.
- Verify independently: the bootstrap tier-2 assumption in §7 (does the reviewer agree it is the only way to satisfy R1+R4+§10.1, or does it want an explicit owner decision recorded first?).
- Verify the AC6 "empty diff" claim: it is a content/entry-count proof (28 entries written both times against the same prior state, refusal message identical) rather than a literal `git diff` (the baseline file is untracked/new, so `git diff` against HEAD shows the whole file as added either way) — confirm this reading satisfies AC6's intent.
- §5's owner decision (exit criterion 2, qualified-vs-open) is unresolved and is the reviewer's/owner's to close, not this task's.
- Recommend running `npm run check:rendered-scope:verify` and `npm run check:rendered-scope` once more natively before approval, since these are exactly the commands CI will now block on.

## 9. Backlog update

`docs/backlog.md` Sprint 75 row and task-registry row 55 updated in place — Task 818 status changed to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a one-line evidence pointer to this session log. File line count: **80** (at the stated budget, not a breach — no BACKLOG LIMIT BREACH).

---

## 10. Revision 1 — 2026-09-11 (remediation for Opus's `NEEDS REVISION`)

Re-entry mode: `remediation`, per kickoff §17.1. The comparator, baseline, CI change and self-test built in the
original pass were **not re-done**; the forbidden-re-run artifacts (`R0_*`, `R1_gate_before_baseline_missing.txt`,
`R2_update-baseline_bootstrap.txt`, `AC4_*`, `AC5_*`, `R5_verify-gate_broken-arm4.txt`,
`R6_ac8_broken-arm_restore_witness.txt`) were left untouched — confirmed by `git status --porcelain` still showing
every one of them as `??` (untracked, never `M`), and by never opening them for write this pass except the one
line-4 edit R16 explicitly authorizes on `AC6_new-tier2-edge_probe.txt`.

### 10.1 Requirement and acceptance-criteria evidence (Revision 1)

| Req | AC | Evidence | Result |
|---|---|---|---|
| R12 (platform/version/pwd/command/exit code in every retained transcript) | AC15 | `docs/sessions/evidence/task818/Rev1_01_check-syntax.txt` through `Rev1_11_check-mojibake.txt` — each opens with `=== platform ===` / `=== node version ===` / `=== working directory ===` / `=== command ===` and closes with `=== exit code ===`, all in the same file as the command output. `Rev1_09_build.txt` shows `win32`, the command, and exit `0` together. | Confirmed |
| R13 (`--update-baseline` refuses to bootstrap a missing baseline) | AC16 | `AC16_bootstrap-refusal_probe.txt` — part 1: baseline moved aside, `--update-baseline` exits 1, names the path, says "Restore the file from version control", writes nothing (file absent after the run); restored, `git hash-object` identical. Part 2: with the baseline present, the AC6-shape tier-2-deletion probe repeated — gate names the tier-2 edge (exit 1), `--update-baseline` still refuses it (exit 1, 28 entries unchanged, key stays absent); restored, hash identical. | Confirmed |
| R14 (`--report` prints the same baseline context as the gate) | AC17 | `Rev1_05_check-rendered-scope-report.txt` — the report now prints `Distinct rendered frontier edges`, `Baseline version`, `Baselined edges`, `New edges`, `Stale baseline entries` and the tier-2-debt sentence, then still lists `tier1-unenrolled (27)` / `tier2-legacy-primitive (3)` / `allowlisted (27)` in full, exit 0. | Confirmed |
| R15 (self-test proves exit wiring, not only classification; states its arm count) | AC18 | `Rev1_06_check-rendered-scope-verify.txt` — prints `running 5 arms`, all 5 PASS (arm 5 is the new exit-wiring arm calling the same `evaluateGateExitCode` function gate mode calls), `Arms run: 5`, exit 0. `AC18_broken-arm5_probe.txt` — `evaluateGateExitCode` temporarily forced to always return 0; verify re-run shows arm 5 FAIL, `4 passed, 1 failed`, exit 1; restored (see §10.2 below for the restore incident and its correction), final `git hash-object` matches pre-break, `check:rendered-scope:verify` re-run 5/5 PASS. | Confirmed |
| R16 (remove the thinking-out-loud line from `AC6_new-tier2-edge_probe.txt`) | AC19 | `git diff -- docs/sessions/evidence/task818/AC6_new-tier2-edge_probe.txt` shows exactly one changed line (line 4); every other line, including all command-output lines, byte-identical. Old line 4 quoted the self-arguing aside; new line 4 is one factual sentence stating the entry count and why the key stays absent. | Confirmed |

GR-4 AC audit (Revision 1): 5 criteria (AC15-AC19), each an observable property (transcript contents, exit codes,
file presence, line-diff scope); no absolute assertion.

### 10.2 Deviation — a PowerShell restore bug corrupted the script mid-probe, caught and fixed before continuing

While executing the AC18 broken-arm probe, the restore step used `Get-Content -Raw` (no explicit `-Encoding utf8`)
to read the pre-break content of `scripts/check-rendered-scope.mjs` into a variable, then `[IO.File]::WriteAllText`
to write it back. On this BOM-less UTF-8 source file, Windows PowerShell 5.1's `Get-Content -Raw` decoded the bytes
using the system codepage instead of UTF-8, corrupting every multi-byte character (em dashes, section signs,
box-drawing comment dividers) into CP1252-of-UTF-8 mojibake before the write-back — a real content corruption, not
a formatting artifact. The `git hash-object` witness caught it immediately (`HASH_MATCH = False`), and a follow-up
`npm run check:mojibake` independently confirmed it (7 `CP1252-of-UTF-8` artifacts, 0 invalid-UTF-8 files) on the
one evidence transcript whose console-output capture had round-tripped through the same corrupted process run.

Corrected with a small Node.js script (UTF-8-correct on both read and write): read the corrupted file as UTF-8, map
each mojibake character back to its Windows-1252 byte value, decode that byte sequence as UTF-8 to recover the
original text, write it back as UTF-8. Verified before trusting it: a `diff` against the corrupted version showed
every changed line contained one of the corrupted marker characters and nothing else — zero logic or code changes;
`node --check` passed; the resulting `git hash-object` (`5042028f014d2e5e97d2524bc7972999e975f0c2`) matched the
pre-break hash exactly; `npm run check:rendered-scope:verify` re-run printed all 5 arms PASS again; `npm run
check:mojibake` and `npm run check:file-integrity` both clean afterward (61/61 files). The same fix was applied to
`AC18_broken-arm5_probe.txt`'s own captured console output, which had inherited the identical corruption while the
script was in its broken state. Full narrative retained in `AC18_broken-arm5_probe.txt`'s `== CORRECTION ==` block.
No other file in this session was affected — every other PowerShell-driven read/write in this task used either
`[IO.File]::WriteAllText`/`ReadAllBytes` directly (safe) or operated on pure-ASCII JSON content (unaffected by the
codepage misdetection regardless of method).

### 10.3 Files Changed (Revision 1, in addition to the original pass)

| Path | Reason |
|---|---|
| `scripts/check-rendered-scope.mjs` | R13: `--update-baseline` no longer accepts a missing baseline as bootstrap — refuses and exits 1; `computeBaselineUpdate` simplified to always require a real prior-edges object. R14: baseline context (version/baselined/new/stale/tier-2 sentence) computed once and printed for both `--report` and gate mode; `--report` still exits 0 unconditionally, even if the baseline itself can't be loaded. R15: new pure `evaluateGateExitCode` function is the single source of the gate's exit-code decision, used by both `main()` and the self-test's new arm 5; self-test now runs and reports 5 arms. |
| `docs/sessions/evidence/task818/Rev1_01_*.txt` … `Rev1_11_*.txt` (new) | R12 evidence — the full §17.5 gate block re-run with platform/node/pwd/command/exit-code in every file. |
| `docs/sessions/evidence/task818/AC16_bootstrap-refusal_probe.txt` (new) | R13/AC16 evidence — both probe arms. |
| `docs/sessions/evidence/task818/AC18_broken-arm5_probe.txt` (new) | R15/AC18 evidence, including the restore-bug correction narrative (§10.2). |
| `docs/sessions/evidence/task818/AC6_new-tier2-edge_probe.txt` | R16/AC19 — line 4 replaced with one factual sentence; no other line touched. |
| `docs/backlog.md` | Sprint 75 row and task-registry row 55: Task 818 status → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 1 summary). Still 80 lines. |

### 10.4 Validation evidence (Revision 1 final gate block, §17.5)

All native `win32` PowerShell, `node v22.22.3`, working directory `C:\Claude_Code_Projects\lero-al` — recorded inside
every transcript per R12, not asserted here:

| Command | Exit | Transcript |
|---|---|---|
| `node --check scripts/check-rendered-scope.mjs` | 0 | `Rev1_01_check-syntax.txt` |
| `npm run typecheck` | 0 | `Rev1_02_typecheck.txt` |
| `npx eslint scripts/check-rendered-scope.mjs` | 0 | `Rev1_03_eslint.txt` |
| `npm run check:rendered-scope` | 0 (29 baselined / 0 new / 0 stale) | `Rev1_04_check-rendered-scope.txt` |
| `npm run check:rendered-scope:report` | 0 (now carries AC17's baseline context) | `Rev1_05_check-rendered-scope-report.txt` |
| `npm run check:rendered-scope:verify` | 0 (5/5 arms) | `Rev1_06_check-rendered-scope-verify.txt` |
| `npm run check:story-coverage` | 0 (38/0, unchanged) | `Rev1_07_check-story-coverage.txt` |
| `npm run check:stories` | 0 | `Rev1_08_check-stories.txt` |
| `npm run build` | 0 | `Rev1_09_build.txt` |
| `npm run check:file-integrity` | 0 | `Rev1_10_check-file-integrity.txt`, re-confirmed clean after §10.2's fix |
| `npm run check:mojibake` | 0 | `Rev1_11_check-mojibake.txt`, re-confirmed clean after §10.2's fix |

### 10.5 Assumptions, deviations, limitations (Revision 1)

- Deviation: §10.2's restore-bug incident, fully corrected and witnessed before this handoff — no corrupted content
  remains in any tracked or retained file (confirmed by `check:mojibake`/`check:file-integrity` re-runs).
- No escape hatch was added for regenerating a baseline from scratch (R13's "if wanted" clause). If the committed
  `scripts/rendered-scope-baseline.json` is ever lost outside of version control, the only path back is restoring
  it from a prior commit — this is deliberate (an escape hatch is exactly the reachable-bootstrap path R13 closes)
  and is stated for the reviewer to confirm or override.
- §5's owner decision (Sprint 75 exit criterion 2, qualified-vs-open) remains unresolved from the original pass;
  nothing in Revision 1 changes or closes it.

### 10.6 Opus handoff (Revision 1)

- Evidence root unchanged: `docs/sessions/evidence/task818/`. New files listed in §10.3.
- Please independently verify §10.2's correction — re-run `npm run check:mojibake` and `git diff --stat --
  scripts/check-rendered-scope.mjs` yourself rather than trusting this narrative alone, since it describes recovering
  from my own tooling mistake mid-session.
- R13's "no escape hatch" design choice (§10.5) is a judgment call within what the kickoff left optional — confirm
  it matches intent, or file a follow-up if a controlled re-bootstrap path is wanted after all.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
