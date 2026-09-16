# Task 743 — `check:css-vars` goes silent when a token is deleted from `globals.css`: an ownership snapshot closes it

Sprint 75 · P2 · QA profile **Q4** (was `Q2` in the reservation — a new gate arm needs planted proof)

**Status: `NEEDS REVISION`** — Revision 1, review 2026-09-16. **A fresh session starts at §16**, not §10. Filed
2026-09-16. Independent of 822/823/797/825. **Correction:** "no shared file" with 815 was false — `package.json` and
`docs/backlog.md` also carry uncommitted Task 815 hunks (§16.5).

## 1. Mode and task type

`IMPLEMENTATION` — governance gate. Adds a committed ownership snapshot to `scripts/check-css-var-resolvability.mjs`
so a deleted-but-still-referenced token fails, without reopening the Mantine runtime false positives.

## 2. Objective

`check:css-vars` computes "owned" names live from `globals.css`. Deleting a declaration therefore un-owns the name
**and** every reference to it, and the gate reports `0 violations`. Make the gate remember what was owned, so that a
name leaving `globals.css` while something still reads it is a named failure, and so that the remembered set can only
move by a deliberate command that refuses to forget a name still in use.

## 3. Verified context — measured 2026-09-16

### 3.1 The blind spot, reproduced this session

`FACT` — real tree after a fresh `npm run build` (exit 0, `docs/sessions/evidence/task743/design/01_build.txt`):
`owned … 297`, `0 violations`, exit 0 (`02_check-css-vars_real.txt`).

`FACT` — same build, `--globals-path` pointed at a scratch copy of `globals.css` with only line 336
`--motion-duration-slow: 300ms;` removed (mtime set equal to the real file so the freshness guard passes):
`owned … 296`, `0 violations`, **exit 0** (`03_check-css-vars_planted-deletion.txt`), although
`src/design-system/media/AppImage.module.css` still reads `var(--motion-duration-slow)` twice and `globals.css:269`
aliases it. This is the reservation's second reproduction (Task 765), still live. The first reproduction's token,
`--color-overlay-foreground`, no longer exists in `globals.css` or `src/`.

`FACT` — that plant run reported `Arm B … referenced: 127` against 68 on the real run. Cause, from the script's own
comment (`check-css-var-resolvability.mjs:636-645`): a `--globals-path` outside `src/` leaves the real
`src/app/globals.css` inside Arm B's scan. The `--verify-gate` harness avoids it by copying `src/` and pointing at the
copy inside it; this task's plants must do the same.

### 3.2 Why the naive fix is wrong

`FACT` — reservation (`docs/backlog-reserved.md:33`) and the script header (`:5-11`): checking every `var(--x)` against
shipped declarations false-positives on ~112 Mantine runtime properties set only through inline styles. "Owned" is
the scoping that makes the gate usable; the fix must keep it.

### 3.3 Consumers of both kinds exist

`FACT` — `04_tsx-only-owned-names.txt`: 19 of the 297 owned names are referenced only from TS/TSX, never from CSS —
e.g. `--width-page-max` (`globals.css:299`), read by `src/modules/listings/components/ListingsPageFrame.tsx:53,90` as
`maw="var(--width-page-max)"`. `--motion-duration-slow` is referenced from a CSS Module. The fix must fail on both.

### 3.4 The gate's structure

`FACT` — `check-css-var-resolvability.mjs`: ownership from `globals.css` `@theme`/`@theme inline`/top-level `:root`
(`:53-57`); Arm A shipped CSS, Arm B `src/**/*.{css,tsx,ts}` minus `globals.css` (`:13-22`); fallback references
reported non-blocking (`:45-46`); freshness guard (`:48-52`, `:420`); `--css-dir`/`--globals-path`/`--src-dir` seam and a
`--verify-gate` of 4 plants + 4 controls on `mkdtempSync` copies (`:59-61`, `:619-962`); unit tests in
`scripts/__tests__/css-var-resolvability.test.ts`. CI runs `npm run check:css-vars` after `npm run build` in the
`click-shield` job (`.github/workflows/governance-pr.yml:321`).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.1 | A committed `scripts/css-var-ownership-snapshot.json` holds `{ "version": 1, "names": [<sorted owned names>] }`, written only by `node scripts/check-css-var-resolvability.mjs --update-snapshot`. Missing or unparsable snapshot → exit 1 naming the file (never "0 violations"). | **P0** | AC1 | Confirmed |
| **R2** | §3.1, §3.3 | New blocking check **dropped-name**: for each snapshot name that is no longer owned, every fallback-less `var(--name)` in Arm A or Arm B is a violation naming the name, file and line. Both the CSS consumer case (`--motion-duration-slow` → `AppImage.module.css`) and the TSX-only case (`--width-page-max` → `ListingsPageFrame.tsx`) fail. A fallback-bearing reference to a dropped name is reported in the existing non-blocking section. | **P0** | AC2 | Confirmed |
| **R3** | snapshot integrity | New blocking check **drift**: owned set ≠ snapshot → exit 1 listing added and dropped names and the `--update-snapshot` remedy. | **P0** | AC2 | Confirmed |
| **R4** | objective | `--update-snapshot` **refuses** (exit 1, file byte-unchanged) while any dropped name still has a fallback-less reference in Arm A or Arm B, listing them. Otherwise it writes the current owned set and exits 0. It honours the same `--css-dir`/`--globals-path`/`--src-dir` seam. | **P0** | AC3 | Confirmed |
| **R5** | Q4 | `--verify-gate` keeps its 8 existing assertions and adds, on temp copies only: **P5** delete `--motion-duration-slow` → dropped-name failure naming `AppImage.module.css`; **P6** delete `--width-page-max` → dropped-name failure naming `ListingsPageFrame.tsx`; **P7** add a new name `--task743-plant: 1px` → drift failure; **C5** P5's tree + `--update-snapshot` → refused, snapshot byte-unchanged; **C6** delete a name with **no** reference (chosen at runtime from the owned set, printed) → drift failure, then `--update-snapshot` succeeds, then the scan exits 0. The summary line counts all assertions. | **P0** | AC4 | Confirmed |
| **R6** | GR-2 | Every run prints the snapshot version and size, and the blind spots: a name deleted before the snapshot's first commit; a dynamically built name (already handled by the prefix rule, unchanged); references outside Arm B's glob. | **P0** | AC5 | Confirmed |
| **R7** | §3.4 | Unit tests in `scripts/__tests__/css-var-resolvability.test.ts` for the snapshot parser (valid, missing, malformed), drift computation, dropped-name detection and writer refusal, each written before the implementation and failing first. | **P0** | AC1 | Confirmed |
| **R8** | one-time census | Before writing the first snapshot, record in evidence every fallback-less `var(--x)` in `src/**/*.{css,tsx,ts}` whose name is not owned, not `--mantine-*`/`--tw-*`, and not declared in any shipped CSS file. If any such name looks project-owned (not a Mantine component variable), stop — `BLOCKED` with the list; an orphan that predates the snapshot would otherwise stay invisible forever. | **P0** | AC6 | Confirmed |
| **R9** | docs | `docs/design-system.md` gains **§23.9 — Owned custom-property resolvability: `check:css-vars`** (no section documents this gate today; `§23.8` is the last §23 subsection), recording the snapshot, the two checks, the refusal rule, the update workflow for adding a token, and R6's blind spots. | P1 | AC5 | Confirmed |

## 5. Assumptions and open questions

- **Decision taken in design, not by the owner, and why.** The reservation asked the task to choose between
  "was-owned-at-`HEAD`" (git base), an explicit third-party prefix set, "or something better". Git-base only fires on
  a diff the CI actually sees; the governance workflow triggers only on `pull_request` (`governance-pr.yml:3-5`), and
  `git log` shows 103 commits on `main` since 2026-09-01 and no merge commit after 2026-08-26 (`UNKNOWN` whether any arrived by squash-merged PR),
  so a rule that only fires on a PR diff has no measured guarantee of running, so a base-diff rule would rarely run. A third-party prefix set
  re-derives the 112-name problem by enumeration. A committed snapshot fires on every run, wherever it runs. This is a
  reversible tooling choice within the task's own brief, so no owner decision is requested.
- **Workflow cost, stated:** adding a token to `globals.css` now requires running `--update-snapshot` in the same
  change, or `check:css-vars` fails with the remedy printed. Same shape as Tasks 818/819's baselines.
- Stop: R8's census finding a project-looking orphan → `BLOCKED` (R8). A P5/P6 plant that does not fail → the
  implementation is wrong; never adjust the plant to pass.

## 6. Pre-read rule bundle

`scripts/check-css-var-resolvability.mjs` in full · `scripts/__tests__/css-var-resolvability.test.ts` ·
`docs/backlog-reserved.md:33` · `docs/design-system.md` §23.6-§23.8 · `docs/golden-rules.md` GR-2 · `docs/agent-contract.md`
clauses 9, 13, 14 · `docs/qa-profiles.md` (Q4) · `docs/sessions/evidence/task743/design/*` · this kickoff.

## 7. Scope

- **New:** `scripts/css-var-ownership-snapshot.json`.
- **Edited:** `scripts/check-css-var-resolvability.mjs` · `scripts/__tests__/css-var-resolvability.test.ts` ·
  `package.json` (+`check:css-vars:update-snapshot`) · `docs/design-system.md` · `docs/backlog.md`.
- **Written:** `docs/sessions/evidence/task743/*` (not `design/`) · session log.

## 8. Out of scope

`src/app/globals.css` and any token · the fallback/dynamic-prefix rules (unchanged) · the CI workflow (the existing
step already runs the command) · Mantine runtime properties.

## 9. Current and required behavior

**Before.** Deleting a referenced token from `globals.css` passes `check:css-vars`.
**After.** It fails naming every orphaned reference; the snapshot cannot be updated past it; adding a token needs one
deliberate `--update-snapshot`.

## 10. Implementation requirements

1. Order: §13.1 → R8 census → R7 tests red → snapshot load/drift/dropped-name → writer → tests green → first snapshot
   written by the writer → R5 arms → R6 printing → R9 → §13.2.
2. The first snapshot is produced by `--update-snapshot` on the real tree, never by hand; retain its transcript and
   `git hash-object`.
3. Plants use the existing `setupTempTree` (globals copy inside the copied `src/`, §3.1); no plant writes the real tree.
4. Snapshot JSON: UTF-8 without BOM, LF, 2-space indent, trailing newline, names sorted with `localeCompare`.
5. Transcripts unpiped with exit codes; final block records hashes.

## 11. Positive and negative flows

**Positive.** A contributor deletes `--width-page-max` from `globals.css`; CI fails naming `ListingsPageFrame.tsx:53`
and `:90`.

| Negative flow | Applicable | Expected |
|---|---:|---|
| Snapshot missing/malformed | Yes | exit 1 naming file — R1 |
| Token added, snapshot not updated | Yes | drift failure with remedy — R3, P7 |
| Token deleted, unreferenced | Yes | drift failure, writer succeeds — C6 |
| Token deleted, still referenced (CSS / TSX) | Yes | dropped-name failure; writer refuses — P5, P6, C5 |
| Reference with a fallback | Yes | non-blocking report — R2 |
| Stale build | Yes | existing freshness guard, unchanged |
| Mantine runtime properties | Yes | never checked (not in snapshot) |

## 12. Acceptance criteria

- **AC1 [R1, R7]** — vitest red before implementation, green after; the snapshot file exists, written by the writer,
  with 297 names (or §13.1's re-measured count). Quote both summaries, the writer transcript and the first lines of
  the file.
- **AC2 [R2, R3]** — the real-tree run exits 0 with 0 dropped and 0 drift; P5/P6/P7 outputs show the named failures.
  Quote.
- **AC3 [R4]** — C5 output shows the refusal and the before/after `git hash-object` of the temp snapshot equal.
  Quote.
- **AC4 [R5]** — `npm run check:css-vars:verify` exits 0 and its summary counts 13 assertions (8 existing + 5 new).
  Quote the full output.
- **AC5 [R6, R9]** — the printed scope/blind-spot lines and the §23.9 text. Quote both.
- **AC6 [R8]** — the census list (possibly empty) with a classification per name. Quote.

**GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: AC3's hash equality is R4's no-write
requirement; AC4's count is this task's defined arm set.**

## 13. QA profile and verification plan

**`Q4`** — new blocking gate arms with planted failure proof (R5). No UI.

### 13.1 Baseline

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
npm.cmd run build
npm.cmd run check:css-vars
npm.cmd run check:css-vars:verify
```

Expected: `win32`; build exit 0; the gate exit 0 with `owned … 297` (or explain the difference); verify exit 0 with
8/8.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npx.cmd vitest run scripts/__tests__/css-var-resolvability.test.ts
npm.cmd run build
npm.cmd run check:css-vars
npm.cmd run check:css-vars:verify
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:file-integrity -- --files scripts/check-css-var-resolvability.mjs scripts/__tests__/css-var-resolvability.test.ts scripts/css-var-ownership-snapshot.json package.json docs/design-system.md docs/backlog.md docs/sessions/2026-09-16-task743-css-var-ownership-snapshot.md
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks hash-object scripts/check-css-var-resolvability.mjs scripts/__tests__/css-var-resolvability.test.ts scripts/css-var-ownership-snapshot.json package.json docs/design-system.md docs/backlog.md
```

Expected: every command exit 0.

## 14. Completion report contract

Files and hashes · R1-R9 · baseline · R8 census · red/green tests · writer transcript · all plant/control outputs ·
docs quote · commands with exit codes and paths · assumptions · deviations · limitations. Status per execute-task. No
self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Does it reopen the 112 Mantine false positives? | No — only snapshot names are checked, and the snapshot is the owned set. |
| Can the snapshot be edited around a failure? | Hand edits are possible in git, but the writer refuses, and review of a snapshot diff that drops a referenced name is the remaining control — stated in §23.9. |
| Does the 765 reproduction fail now? | P5 is exactly it. |
| Why both P5 and P6? | CSS and TSX consumers take different arms (A/B paths); §3.3. |
| GR-1 / 16d? | Not applicable — no rendered surface. |

## Appendix — execution contract

| Checkpoint | Producer | Comparator / failure |
|---|---|---|
| 0 baseline | §13.1 transcripts | gate not clean on real tree → `BLOCKED` |
| 1 census | R8 evidence | project-looking orphan → `BLOCKED` |
| 2 red tests | vitest | passes before code → tests wrong |
| 3 implementation | vitest | failure → not done |
| 4 first snapshot | writer transcript + hash | hand-written → reject |
| 5 arms | `:verify` | any arm wrong → exit 1 |
| 6 final | §13.2 | any non-zero → not `IMPLEMENTED` |

## 16. Revision 1 — `NEEDS REVISION` (Opus review, 2026-09-16)

### 16.1 Re-entry mode

**`remediation`.** Start at §16.3. Keep every Revision 0 artifact: `docs/sessions/evidence/task743/10_*`–`44_*`,
`scripts/css-var-ownership-snapshot.json` (hash `c854ac0bd9c9237203623d5617397a8571045023`) and the R8 census. Do
**not** rerun R8, the red-test step, or the first snapshot write. Do **not** hand-edit the snapshot. Write new
transcripts as `docs/sessions/evidence/task743/rev1/NN_*.txt`.

**Accepted from Revision 0; do not redo:** R1–R5, R7, R8; the P2/P3 retargets and the P2 literal-occurrence guard.
§13.1 expected verify at 8/8 on the baseline, and that was the kickoff's own error: it was measured 5/8.

### 16.2 Findings this revision fixes

| ID | Sev | Req | Location | Observed | Required |
|---|---|---|---|---|---|
| **F1** | P2 | R9, R5 | `scripts/__tests__/css-var-resolvability.test.ts:210-223` (`expect(owned.size).toBe(297)`); `scripts/check-css-var-resolvability.mjs:1203,1230` (C3 `ownedSet.size === 297`) | §23.9 says adding a token needs only `npm run check:css-vars:update-snapshot`. Following that, the unit test fails the next time a token is added (CI `npm test` = `vitest run` picks up `scripts/__tests__`), and so does verify-gate C3. This hardcoded count already went stale twice (256/257 → 297), and Revision 0 had to repair it. The snapshot now records the owned set, so a second hand-maintained copy of the count only adds another place for it to go stale. | Remove both literal counts. Compare the owned set to the committed snapshot. |
| **F2** | P2 | R6 | `check-css-var-resolvability.mjs:707-715` (comment), `updateSnapshot()` `:836-854`, `verifyGate()` `:1388-1433` | R6 requires the snapshot version/size and blind spots on **every run**. The comment at `:707-708` says they print on "default, --update-snapshot, and inside the --verify-gate harness". Only `run()` calls `printSnapshotScope`. `22_update-snapshot_first-write.txt` shows a green `✅ … wrote 297 name(s)` line with no blind-spot line. The verify output has none either. | Print the scope from every mode, and make the comment match the code. |
| **F3** | P3 | R5 | P5 `:1264`, P6 `:1290`, C5 `:1337`, C6 `:1366` | These plants call `removeDeclarationLine`, whose regex has no left anchor (`:919`). Unlike P3 (`:1109-1117`), they never assert that exactly the target name left the owned set. A declaration for a longer name ending in the target (for example `--x--width-page-max:`) would be removed instead of the target, and nothing would report it. | Add P3's over-match guard, applied to the owned set. |
| **F4** | P3 | §13.2 | `37_final_file-integrity.txt`, `41_final_file-integrity_v2.txt` exit 1 | The repo-wide mode cannot pass while another task's evidence has BOMs. The retained final transcript also flags three of this task's own files (`39_`, `40_`, `41_`), captured before they were stripped. The reviewer's scoped rerun of 36 Task 743 paths exits 0. | §13.2 now uses `--files`. Capture transcripts with byte-exact redirection (§16.5). |

### 16.3 Required changes

1. **F1 — `scripts/__tests__/css-var-resolvability.test.ts`.** Replace the `toBe(297)` test with one that reads
   `scripts/css-var-ownership-snapshot.json` through the exported `loadSnapshot` and asserts
   `extractOwnedNames(readFileSync('src/app/globals.css','utf8'))` equals the snapshot's `names` as sets, in both
   directions. Keep the `--spacing-N`-excluded assertion. Replace the 259→257→256→297 history comment with one line
   saying the count now lives in the snapshot (Task 743 Rev 1).
2. **F1 — C3 (`runControlC3`).** Replace `ownedSet.size === 297` with a size-and-membership equality against
   `loadSnapshot(tree.snapshotPath).names`. Print `owned=<n> snapshot=<m>` in the detail. If the snapshot does not
   load, C3 fails and names the reason.
3. **F1 — `docs/design-system.md` §23.9, "Workflow cost" paragraph.** State that `--update-snapshot` is the **only**
   step needed when a token is added. The unit test and C3 compare against the snapshot, and no count is kept in
   code.
4. **F2 — `printSnapshotScope`.** Call it:
   - in `updateSnapshot()` before exit, on the success, refusal and fatal-after-load paths (print the size of the set just written on success, and the prior snapshot's size on refusal);
   - once in `verifyGate()`, immediately after the baseline line.
   
   Rewrite the comment at `:707-711` to name exactly the call sites that exist. Update the header comment
   (`:75-79`) if it lists modes.
5. **F3 — P5, P6, C5, C6.** Before each `removeDeclarationLine(tree.globalsPath, name)`, record
   `extractOwnedNames(before)`. After it, compute the names that left the owned set. If that set is not exactly
   `[name]`, `record(<id>, <expectation>, false, 'plant removed … — must remove exactly one, <name>')` and restore in
   `finally`. Same shape as P3 `:1112-1117`.
6. Do not change anything else. That includes `src/app/globals.css`, the snapshot file, the CI workflow, and every
   Task 815 hunk in `package.json` / `docs/backlog.md`.

### 16.4 Acceptance criteria (Revision 1, in addition to AC1–AC6)

- **AC7 [F1, R9]** — `git --no-optional-locks grep -n "297" -- scripts/check-css-var-resolvability.mjs
  scripts/__tests__/css-var-resolvability.test.ts` returns no line that asserts the owned count. **Two-armed
  proof:** on a scratch copy only (never the real tree), run the new unit-test logic through a
  node script that copies `src/app/globals.css` and the snapshot to `mkdtempSync`:
  - **(a)** Append `:root{--task743-rev1:1px}`. The comparison must fail, naming `--task743-rev1` as added.
  - **(b)** Then apply the writer through `performUpdateSnapshot` against that scratch copy. The comparison must pass.

  Retain the transcript and `git hash-object` of the real snapshot before and after. They must be equal.
- **AC8 [F2, R6]** — the `Blind spots (R6)` line and the `Ownership snapshot: version 1, <n> name(s)` line appear in
  all four transcripts:
  - `check:css-vars`
  - `check:css-vars:verify`
  - a **successful** `check:css-vars:update-snapshot` on the real tree, which must write zero changes: `added: (none)`, `dropped: (none)`, and snapshot hash unchanged
  - C5's refusal. Quote the lines from each transcript.
- **AC9 [F3]** — `check:css-vars:verify` exits 0 with 13/13. The source shows the over-match guard in P5, P6, C5 and
  C6. Quote the four guard sites with line numbers.

**GR-4 AC AUDIT — 3 new criteria; each states an observable property; absolutes: AC7's unchanged hash is the
no-write requirement on the real snapshot; AC9's count is this task's defined arm set.**

### 16.5 Verification and handoff notes

- Run §13.2 as amended: `check:file-integrity` now uses `--files`. Add `docs/sessions/evidence/task743/rev1/*` to
  that `--files` list by explicit name.
- **Transcript capture:** do not use PowerShell `*>`, because it writes a BOM. Use
  `cmd.exe /c "npm.cmd run <script> > docs\sessions\evidence\task743\rev1\NN_name.txt 2>&1"` and record
  `echo EXIT=%ERRORLEVEL%` in the same `cmd.exe /c` call.
- Final block includes `git hash-object` of the three script/data files plus `docs/design-system.md`.
- **Shared paths.** `package.json` (Task 815 adds `check:card-track-monotonicity[:verify]`) and `docs/backlog.md`
  (815's row) are co-modified with Task 815. Do not touch 815's hunks. The approval commit will be sequenced with
  815's review by Opus; not the executor's concern.
- Update the session log with a `## Revision 1` section and a Files Changed table for this revision. Set the 743 row
  in `docs/backlog.md` back to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when §13.2 exits 0 throughout.
