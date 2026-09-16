# Task 743 — `check:css-vars` ownership snapshot (dropped-name + drift detection)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** (Revision 1). Sonnet executor session. No mutating git
command was run, suggested, or emitted by the executor. This handoff is not an approval; only Opus may issue one
after independently inspecting the diff and evidence below.

Kickoff: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_743_CSS_Var_Ownership_Snapshot.md`.

This session ran in two revisions. Revision 0 (below, unchanged) implemented R1-R9 and reached
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Opus reviewed it `NEEDS REVISION` (four findings, F1-F4) and committed
that verdict plus the kickoff's §16 amendment (`21e41fe80`). **Revision 1** (new section below, at the end of this
file) fixes all four findings and re-closes the task.

## Revision 0 (original implementation — retained verbatim below)

## Summary

`check:css-vars` computed "owned" live from `globals.css`, so deleting a declaration un-owned the name **and** every
reference to it in the same motion, and the gate reported "0 violations" (700 F1, reproduced twice: Task 700's own
review and Task 765's `--motion-duration-slow`). This task adds a committed ownership snapshot
(`scripts/css-var-ownership-snapshot.json`), two new blocking checks (drift — R3; dropped-name — R2), and a
refusing `--update-snapshot` writer (R4), without reopening the ~112 Mantine runtime false positives the live-owned
scoping exists to avoid.

## Files changed

| Path | Change |
|---|---|
| `scripts/check-css-var-resolvability.mjs` | New snapshot module (`parseSnapshotContent`, `loadSnapshot`, `serializeSnapshot`, `writeSnapshotFile`, `computeDrift`, `findDroppedNameRefs`, `performUpdateSnapshot`); `scanArmA`/`scanArmB` now also return `allRefs` (unowned/dropped names included); `runScan` computes drift + dropped-name violations every run; `printReport` prints snapshot version/size + R6 blind-spot lines + dropped-name/drift sections; new `--update-snapshot`/`--snapshot-path` CLI flags and `updateSnapshot()` entrypoint; `setupTempTree` copies the real snapshot into the temp tree; 3 new plants (P5, P6, P7) + 2 new controls (C5, C6); P2 and P3's pre-existing targets re-derived (see Deviations) and C3's hardcoded owned-count corrected. |
| `scripts/__tests__/css-var-resolvability.test.ts` | New suites for `parseSnapshotContent`, `loadSnapshot`, `serializeSnapshot`, `computeDrift`, `findDroppedNameRefs`, `performUpdateSnapshot` (R7); existing owned-count assertion corrected 257 → 297 (pre-existing drift, see Deviations). |
| `scripts/css-var-ownership-snapshot.json` | **New.** First snapshot, written by `--update-snapshot` on the real tree, never by hand. 297 names. |
| `package.json` | +`check:css-vars:update-snapshot` script. |
| `docs/design-system.md` | +§23.9 (full contract: snapshot, the two checks, the refusal rule, the update workflow, R6 blind spots, R8 census result). |
| `docs/backlog.md` | Task 743 row updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. |

## R1-R9 requirement ledger

| Req | Evidence |
|---|---|
| R1 | Snapshot file exists, `{version:1, names:[...]}`, UTF-8 no BOM/LF/2-space/trailing newline/sorted — verified directly (`node -e` byte check, `22_update-snapshot_first-write.txt`). Missing/malformed → fatal, unit-tested (`loadSnapshot`/`parseSnapshotContent` suites, 8 tests). |
| R2 | `findDroppedNameRefs` + P5 (CSS Module consumer)/P6 (TSX consumer) prove both consumer shapes fail; fallback-bearing dropped refs fold into the non-blocking report (unit-tested). |
| R3 | `computeDrift` + P7 (added-only) + C6 (dropped-only, unreferenced) prove both drift directions independent of reference state (unit-tested + verify-gate). |
| R4 | `performUpdateSnapshot` — refuses with byte-unchanged file (C5, `git hash-object` before/after equal) when a dropped name is referenced; writes + exits 0 otherwise (C6); honours `--css-dir`/`--globals-path`/`--src-dir`/`--snapshot-path`. |
| R5 | `check:css-vars:verify` — 13/13 (`24_check-css-vars_verify.txt`, `34_final_check-css-vars-verify.txt`). |
| R6 | Every run prints snapshot version+size and the three blind-spot lines (`23_check-css-vars_after-snapshot.txt`, `33_final_check-css-vars.txt`). |
| R7 | 21 new tests, red against the pre-Task-743 script (`20_vitest_red.txt`, 21 failed/27 passed), green against the implementation (`21_vitest_green.txt`/`31_final_vitest.txt`, 48/48). |
| R8 | Census run against the real tree before the first snapshot write: 0 orphan names found (`18_r8_census.txt`) — no `BLOCKED`. |
| R9 | `docs/design-system.md` §23.9 added, quoted below. |

## Baseline (§13.1) — deviations from the kickoff's stated expectation

The kickoff's §13.1 expected "verify exit 0 with 8/8" at baseline. Measured baseline was **not** clean:

- `npm run check:css-vars:verify` (pre-Task-743 script): **3/8 assertions failed** — P3's target `--text-3xl` no
  longer has any shipped declaration (Tailwind now inlines the literal value instead of emitting the custom
  property), and C3's hardcoded `owned=256` expectation was stale (real count is 297 — the set grew by 41 names
  across unrelated tasks landed since Task 749). Transcript: `16_check-css-vars_verify_baseline.txt`.
- `npx vitest run scripts/__tests__/css-var-resolvability.test.ts` (pre-existing suite): 1 failure, same 257→297
  drift. Transcript: `17_vitest_baseline.txt`.

Both are pre-existing drift in files already inside this task's edit scope (`check-css-var-resolvability.mjs`,
`css-var-resolvability.test.ts`), unrelated to anything Task 743 changes, and blocking to `check:css-vars:verify`
exiting 0 as required by AC4/§13.2. Fixed in place:

- P3 re-targeted to `--homepage-runtime-search-max-width` (1 shipped decl, 0 shipped refs, live TSX consumer
  `HeroSearchView.tsx:51`) — same required shape as the retired `--text-3xl`.
- P2 re-targeted **twice**: first to `--badge-premium` (looked clean by presence, but its declaration file contains
  the literal text twice — a duplicate emission `countDeclarationSites`/`extractCssDeclaredNames` cannot see, since
  both check Set membership, not occurrence count — so the plant silently failed to reproduce), then to
  `--color-input` (verified exactly 1 literal occurrence). Added a literal-occurrence guard to P2's own pre-plant
  census so a future duplicate-emission drift fails loudly instead of silently.
- C3 and the unit test's hardcoded owned-count corrected 256/257 → 297 (measured this session, design evidence
  `docs/sessions/evidence/task743/design/02_check-css-vars_real.txt`).

None of this is Task 743's own feature logic; it is `git`-diffable in the same two files and called out here per
clause 9/agent-contract.

## R8 census (§3.4/R8 — one-time bootstrap orphan check)

Every fallback-less `var(--x)` in `src/**/*.{css,tsx,ts}` (excl. `globals.css`) whose name is not owned, not
`--mantine-*`/`--tw-*`, and not declared in any shipped CSS file:

```
owned=297 declared(shipped)=1207 propertyRegistered(shipped)=80
files scanned=684
orphan names found=0
```

Zero — no `BLOCKED` condition. Transcript: `docs/sessions/evidence/task743/18_r8_census.txt`.

## Red → green (R7)

Red (new tests run against the unmodified, pre-Task-743 `check-css-var-resolvability.mjs`, restored from `git show
HEAD:...` and swapped back in before any implementation edit was made):

```
Test Files  1 failed (1)
     Tests  21 failed | 27 passed (48)
```

Green (same tests, implemented script restored):

```
Test Files  1 passed (1)
     Tests  48 passed (48)
```

Transcripts: `20_vitest_red.txt`, `21_vitest_green.txt` (also re-confirmed in the final block, `31_final_vitest.txt`).

## First snapshot (writer transcript)

```
✅  check:css-vars:update-snapshot — wrote 297 name(s) to scripts\css-var-ownership-snapshot.json (version 1).
    added: --accent, --accent-foreground, ... [297 names]
    dropped: (none)
```

`git hash-object scripts/css-var-ownership-snapshot.json` = `c854ac0bd9c9237203623d5617397a8571045023`. File verified
UTF-8, no BOM, no CRLF, trailing newline, 7374 bytes. Full transcript: `22_update-snapshot_first-write.txt`.

## Verify-gate — 13/13 (R5)

```
🔬 check:css-vars self-test (--verify-gate) — 7 plants FAIL, 6 controls PASS

✅  baseline (unmodified temp copy): 0 violations, 0 in-class dynamic sites, 0 dropped-name violations, 0 snapshot drift (owned=297, snapshot=297, Arm A refs=93, Arm B refs=68)

✅  P1 (FAIL) — Arm A correctly reported unresolved --radius-md ... after its declaration was renamed
✅  P2 (FAIL) — Arm A correctly reported unresolved --color-input ... after its declaration was deleted
✅  P3 (FAIL) — Arm A silent (0 refs to check) + Arm B correctly reported unresolved --homepage-runtime-search-max-width
✅  P4 (FAIL) — in-class dynamic site correctly reported ... prefix "--space-"
✅  P5 (FAIL) — dropped-name violation correctly reported: Arm B ...AppImage.module.css:159 var(--motion-duration-slow) — CSS Module consumer
✅  P6 (FAIL) — dropped-name violation correctly reported: Arm B ...ListingsPageFrame.tsx:53 var(--width-page-max) — TSX consumer
✅  P7 (FAIL) — drift correctly reported --task743-plant as added, with no other blocking finding
✅  C1 (PASS) — var(--color-badge-reduced, red) reported only in the non-blocking fallback list, never as a violation
✅  C2 (PASS) — --app-shell-navbar-width is not owned and appears in no report
✅  C3 (PASS) — block: owned=297 (expect 297), --spacing-N excluded=true | line: theme.ts:556 correctly stripped
✅  C4 (PASS) — 8 "--mantine-color-" dynamic site(s) found, all out-of-class=true
✅  C5 (PASS) — refused=true naming --motion-duration-slow=true; git hash-object before=c854ac0b... after=c854ac0b... unchanged=true
✅  C6 (PASS) — chosen name=--bp-2xl; drift-blocked=true (dropped=["--bp-2xl"]); writer succeeded=true; post-update scan clean=true

✅  13/13 verify-gate assertions behaved as expected (7 plants FAILED, 6 controls PASSED).
```

Full transcript: `24_check-css-vars_verify.txt` (re-confirmed post-rebuild in `34_final_check-css-vars-verify.txt`).

## §23.9 docs (R9) — quote

See `docs/design-system.md` §23.9 in full (inserted between the end of §23.8's content and the pre-existing §24
BINDING notice). Opening paragraph:

> **`scripts/check-css-var-resolvability.mjs`** (`npm run check:css-vars`) asserts that every reference to a
> project-OWNED custom property resolves to a declaration that actually ships in the production bundle, or to an
> `@property` registration. ... **The blind spot this section closes (Task 743, Sprint 75, filed by Task 700's own
> review — 700 F1).** Because ownership is computed live, **deleting** a declaration from `globals.css` un-owns the
> name and every reference to it in the same motion — the gate then reports "0 violations" even though a live
> consumer is left dangling.

## §13.2 final gate block — every command, exit code

| Command | Exit | Transcript |
|---|---|---|
| `node -p process.platform` | 0 (`win32`) | `30_final_platform.txt` |
| `npx vitest run scripts/__tests__/css-var-resolvability.test.ts` | 0 (48/48) | `31_final_vitest.txt` |
| `npm run build` | 0 | `32_final_build.txt` |
| `npm run check:css-vars` | 0 (0 violations, 0 drift, 0 dropped) | `33_final_check-css-vars.txt` |
| `npm run check:css-vars:verify` | 0 (13/13) | `34_final_check-css-vars-verify.txt` |
| `npm run typecheck` | 0 | `35_final_typecheck.txt` (see Deviations — 9 pre-existing errors in the new test file fixed with non-null assertions after TS correctly flagged discriminated-union narrowing) |
| `npm run lint` | 0 (72 pre-existing warnings, 0 errors; none in Task 743's files) | `36_final_lint.txt` |
| `npm run check:file-integrity` | **1** (see Deviations) | `37_final_file-integrity.txt` |
| `npm run check:mojibake` | 0 (0 artifacts / 4981 files) | `38_final_mojibake.txt` |
| `git diff --stat` | 0 | `42_final_diff-stat_v2.txt` (re-captured via Bash after `docs/backlog.md`/session log were written; PowerShell `*>` redirects add a stray BOM to evidence transcripts — stripped where it occurred, see below) |
| `git hash-object <6 paths, incl. docs/backlog.md>` | 0 | `44_final_hash-object_v2.txt` |

`docs/backlog.md` hash `60808f698b904dc50d53de5e0ceb3cd48918cb15` (post Task-743-row edit); the other five hashes are
unchanged from the first capture (`check-css-var-resolvability.mjs` `f414e9f8...`, test file `f29cae4a...`, snapshot
`c854ac0b...`, `package.json` `e71a464f...`, `design-system.md` `82ef24f1...`).

### `check:file-integrity` — non-zero, scoped to evidence transcripts outside this task

`check:file-integrity`'s default mode scans **every** git-changed+untracked file in the repo, not just this task's
diff. All 22 of Task 743's own evidence `.txt` transcripts initially carried a stray UTF-8 BOM (PowerShell's `*>`
redirect under `[Console]::OutputEncoding = UTF8` writes one) — stripped in place, verified with a second run showing
only the capture-time artifact of that same run's own output file, which was stripped afterward too. The
**remaining 11 flagged files all belong to `docs/sessions/evidence/task815/`** — a different, independent,
already-uncommitted task's evidence (present in `git status` before this session started; this kickoff's own header
states "Independent of 815/822/823/797/825 (no shared file)"). Fixing another task's files is out of this task's
scope (agent-contract P0 invariant 1) and was not attempted. No file this task owns or touched carries a BOM,
NUL byte, parse failure, or truncation — confirmed by inspection of the same command's own listing.

## Assumptions / deviations / limitations

- **Deviation:** P2 and P3's plant targets were re-pointed (see Baseline section) because their original real-tree
  targets drifted since Task 700/765 authored them — unrelated to this task's feature work but necessary to reach
  the AC4-required 13/13 `--verify-gate` result. C3's and the unit test's hardcoded owned-count (256/257) were
  corrected to the current measured 297 for the same reason.
- **Assumption:** a present-but-malformed snapshot is a hard refusal for `--update-snapshot` (never silently
  overwritten), distinct from a missing snapshot (which bootstraps as empty). Not explicitly required by any AC;
  chosen because silently overwriting corrupt committed state defeats the point of a reviewable file. Unit-tested.
- **Limitation:** `check:file-integrity`'s non-zero exit in the final block is caused entirely by another task's
  (815) pre-existing, out-of-scope evidence files — see above. No remedy applied within this task.
- No owner decision was required; R8's census found zero orphans, so the kickoff's only stop condition did not fire.

## Verification plan / QA profile

`Q4` — new blocking gate arms with planted failure proof (R5), no UI. All planted-violation assertions (P1-P7)
verified FAILING as expected before restoration in the same run; all controls (C1-C6) verified PASSING. No git
mutating command run, suggested, or emitted by this session.

## Revision 1 — `NEEDS REVISION` fixes (kickoff §16), 2026-09-16

Re-entered at kickoff §16.3 per the `remediation` mode: R1-R5/R7/R8 and the Revision 0 P2/P3 retargets/literal-
occurrence guard were **not** redone; R8, the red-test step, and the first snapshot write were **not** rerun; the
snapshot was **not** hand-edited. New transcripts under `docs/sessions/evidence/task743/rev1/`.

### Files changed (Revision 1, in addition to Revision 0's table)

| Path | Change |
|---|---|
| `scripts/check-css-var-resolvability.mjs` | **F1**: `runControlC3` no longer hardcodes `=== 297` — compares the temp tree's live owned set to its temp snapshot copy (size + membership, both directions), prints `owned=<n> snapshot=<m> added=[...] dropped=[...]`. **F2**: `printSnapshotScope` now also called from `updateSnapshot()`'s success path (prints the just-written set), refusal path (prints the prior/unwritten snapshot), and fatal-after-load path (malformed snapshot — prints with an "unavailable" size), and once in `verifyGate()` right after the baseline line; `performUpdateSnapshot` now returns `snapshotPath`/`snapshotNames` on the relevant branches so the caller can print them; the R6 header comment above `printSnapshotScope` rewritten to name the exact call sites. **F3**: P5, P6, C5, C6 each gained an over-match guard (capture `extractOwnedNames` before `removeDeclarationLine`, assert exactly `[name]` left the owned set after) — same shape as P3's pre-existing guard, applied to the owned set rather than a shipped-CSS declared set. |
| `scripts/__tests__/css-var-resolvability.test.ts` | **F1**: the `toBe(297)` test replaced with one that loads `scripts/css-var-ownership-snapshot.json` via `loadSnapshot` and asserts the live `extractOwnedNames(globals.css)` matches it exactly (added/dropped both empty), instead of a hardcoded literal. |
| `docs/design-system.md` | **F1**: §23.9's "Workflow cost" paragraph corrected — `--update-snapshot` is stated as the *only* step needed to add a token; no second hand-maintained count exists anywhere in code after this revision. |
| `docs/backlog.md` | Task 743 row set back to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 1) — only `docs/backlog.md`'s own Task 743 row touched; every Task 815 hunk in this file and in `package.json` left untouched, per §16.3 item 6 / §16.5. |

### F1 — no hardcoded owned-count literal

`git --no-optional-locks grep -n "297" -- scripts/check-css-var-resolvability.mjs scripts/__tests__/css-var-resolvability.test.ts`
returns exactly 2 lines, both explanatory prose about Revision 0's history (`docs/sessions/evidence/task743/rev1/08_ac7_grep-297.txt`):

```
scripts/__tests__/css-var-resolvability.test.ts:212:    // hardcoded it (259 -> 257 -> 256 -> 297 across Tasks 695/749/743) and it
scripts/check-css-var-resolvability.mjs:1218:  // `=== 297` already went stale twice (256/257 -> 297) and broke this exact
```

Neither is `toBe(297)` or `=== 297` — no line asserts the owned count as a literal.

**AC7 two-armed proof** (scratch `mkdtempSync` copy only, real snapshot hash `c854ac0bd9c9237203623d5617397a8571045023`
verified unchanged before and after — `rev1/06_ac7_ac8_scratch-proof.txt`):

```
=== AC7(a) — append an unsnapshotted token, comparison must fail (added) ===
owned=298 snapshot=297 added=["--task743-rev1"] dropped=[]
PASS — comparison correctly fails, naming --task743-rev1 as added

=== AC7(b) — same append, then run the writer (performUpdateSnapshot), comparison must pass ===
writer: refused=false written=true added=["--task743-rev1"]
post-write: owned=298 snapshot=298 added=[] dropped=[]
PASS — comparison passes after --update-snapshot
```

### F2 — R6 scope printed in every mode

**AC8, all four required transcripts**, quoted lines:

1. `npm run check:css-vars` (`rev1/03_check-css-vars.txt`):
   ```
       Ownership snapshot: version 1, 297 name(s) (scripts\css-var-ownership-snapshot.json)
       Blind spots (R6): a name deleted from globals.css BEFORE the snapshot's first commit is invisible to drift — …
   ```
2. `npm run check:css-vars:verify` (`rev1/04_check-css-vars-verify.txt`), now printed once after the baseline line:
   ```
       Ownership snapshot: version 1, 297 name(s) (..\..\Users\Nox\...\css-var-ownership-snapshot.json)
       Blind spots (R6): a name deleted from globals.css BEFORE the snapshot's first commit is invisible to drift — …
   ```
3. A **successful** `npm run check:css-vars:update-snapshot` on the real tree, zero changes (`rev1/05_update-snapshot_noop.txt`):
   ```
       Ownership snapshot: version 1, 297 name(s) (scripts\css-var-ownership-snapshot.json)
       Blind spots (R6): …
   ✅  check:css-vars:update-snapshot — wrote 297 name(s) to scripts\css-var-ownership-snapshot.json (version 1).
       added: (none)
       dropped: (none)
   ```
   Real snapshot `git hash-object` unchanged: `c854ac0bd9c9237203623d5617397a8571045023` before and after this run.
4. **C5's refusal**, reproduced as a real CLI subprocess (not the in-process `performUpdateSnapshot` call the
   verify-gate control itself uses, so the print statements — which live only in the CLI wrapper `updateSnapshot()`
   — actually fire) against a scratch copy (`rev1/07_ac8_writer-refusal-cli.txt`):
   ```
       Ownership snapshot: version 1, 297 name(s) (..\..\Users\Nox\...\css-var-ownership-snapshot.json)
       Blind spots (R6): …
   ❌  check:css-vars:update-snapshot — refused: 2 dropped name(s) still referenced without a fallback:
       Arm A  …\css\3294fd458d254b37.css:1  var(--motion-duration-slow)
       Arm B  …\AppImage.module.css:159  var(--motion-duration-slow)
   ```
   exit 1; real snapshot hash confirmed unchanged before/after this reproduction too.

### F3 — over-match guard in P5, P6, C5, C6

`npm run check:css-vars:verify` exits 0, 13/13 (`rev1/04_check-css-vars-verify.txt`). Guard sites, quoted with line
numbers (`git --no-optional-locks grep -n "OVER-MATCH GUARD (Task 743 Rev 1" scripts/check-css-var-resolvability.mjs`):

```
1296:  // OVER-MATCH GUARD (Task 743 Rev 1, F3 — same shape as P3's, applied to the   [P5]
1334:  // OVER-MATCH GUARD (Task 743 Rev 1, F3) — see P5's comment for the reasoning.  [P6]
1389:  // OVER-MATCH GUARD (Task 743 Rev 1, F3) — see P5's comment for the reasoning.  [C5]
1426:  // OVER-MATCH GUARD (Task 743 Rev 1, F3) — see P5's comment for the             [C6]
```

Each guard captures `extractOwnedNames` on the globals.css copy before `removeDeclarationLine`, and after it asserts
the set of names that left ownership is exactly `[name]` — the same shape P3 already used, generalized from a
shipped-CSS declared-name set to the owned-name set (P5/P6/C5/C6 all mutate `tree.globalsPath`, not a shipped CSS
file).

### F4 — `check:file-integrity` now uses `--files`, and every Rev1 transcript is captured without a BOM

Rev1 transcripts were captured via Bash's own `>`/`2>&1` redirection (not PowerShell's `*>`), which does not write a
BOM — functionally equivalent to the kickoff's `cmd.exe /c "... > file 2>&1"` prescription and confirmed byte-clean
by the scoped `check:file-integrity` run below, with no post-hoc stripping needed this time.

```
npm run check:file-integrity -- --files scripts/check-css-var-resolvability.mjs scripts/__tests__/css-var-resolvability.test.ts scripts/css-var-ownership-snapshot.json package.json docs/design-system.md docs/backlog.md docs/sessions/2026-09-16-task743-css-var-ownership-snapshot.md
```
```
🔍  check:file-integrity — 7 explicit file(s) (--files)
    Checking 7 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 7 file(s) clean
EXIT_CODE=0
```
Full transcript: `rev1/12_file-integrity_scoped.txt`. A second, comprehensive **repo-wide default-mode** sweep (the
same mode that exited 1 in Revision 0, entirely due to Task 815's then-uncommitted evidence) now also exits 0 —
`85/85 file(s) clean` (`rev1/16_file-integrity_all.txt`). Whatever left Task 815's evidence BOM-carrying at Revision
0 time is no longer present; either way, the amended §13.2 no longer depends on it.

### Revision 1 — amended §13.2 final gate block, every command and exit code

| Command | Exit | Transcript |
|---|---|---|
| `npx vitest run scripts/__tests__/css-var-resolvability.test.ts` | 0 (48/48) | `rev1/01_vitest.txt` |
| `npm run build` | 0 | `rev1/02_build.txt` |
| `npm run check:css-vars` | 0 | `rev1/03_check-css-vars.txt` |
| `npm run check:css-vars:verify` | 0 (13/13) | `rev1/04_check-css-vars-verify.txt` |
| `npm run typecheck` | 0 | `rev1/10_typecheck.txt` |
| `npm run lint` | 0 (72 pre-existing warnings, 0 errors, none in Task 743 files) | `rev1/11_lint.txt` |
| `npm run check:file-integrity -- --files <7 paths>` | 0 | `rev1/12_file-integrity_scoped.txt` |
| `npm run check:mojibake` | 0 | `rev1/13_mojibake.txt` |
| `npm run check:file-integrity` (repo-wide, default mode) | 0 (85/85 clean) | `rev1/16_file-integrity_all.txt` |
| `git diff --stat` (final, after the `docs/backlog.md` status edit) | 0 | `rev1/17_diff-stat_final.txt` |
| `git hash-object <script/data files + design-system.md + backlog.md>` (final) | 0 | `rev1/18_hash-object_final.txt` |

Final hashes: `check-css-var-resolvability.mjs` `81fabcd2...`, test file `2ac8cbd1...`, snapshot `c854ac0b...`
(unchanged from Revision 0 and from before this revision — the snapshot itself was never touched, per §16.1),
`design-system.md` `8de047e9...`, `backlog.md` `b90e30db...`.

### Shared-file note (§16.5)

`package.json` and `docs/backlog.md` carry uncommitted Task 815 hunks (`check:card-track-monotonicity[:verify]` in
the former; 815's own row in the latter). Neither was touched by this revision beyond `docs/backlog.md`'s own Task
743 row. The approval commit sequencing with Task 815's review is Opus's concern, not the executor's.

### Revision 1 completion

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. All four findings (F1-F4) fixed with cited evidence above; AC1-AC9 all
satisfied; §13.2 (amended) exits 0 throughout. No mutating git command run, suggested, or emitted.
