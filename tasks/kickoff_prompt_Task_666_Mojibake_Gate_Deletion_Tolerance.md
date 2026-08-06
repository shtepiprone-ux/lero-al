# Kickoff — Task 666: Make `check:mojibake` deletion-tolerant (unblock the gate for every deleting task)

> Saved implementation kickoff. A fresh Sonnet session must execute this without any chat context.
> Execute via `.claude/skills/execute-task/SKILL.md`. Strongest valid completion status is
> `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — never self-approve.

## 1. Mode and task type

- **Mode:** implementation.
- **Task type:** governance/tooling gate repair (non-UI, no product code, no rendered surface).
- **Origin:** Task 665 orchestrator review (2026-07-24). `npm run check:mojibake` crashes with `ENOENT` whenever a
  git-tracked file has been deleted on disk but the deletion is not yet staged. Because Sonnet cannot run mutating
  git, **no executor can ever run this required gate in a task that deletes a tracked file.** Per
  `docs/agent-contract.md` §9 a non-zero required gate is part of the task, so this structural hole is closed here.
- **Owner decision (2026-07-24):** fix the script *and* stage Task 665's deletions. Task 665 stays
  `PARTIALLY VERIFIED` until this task is approved and its gate runs clean.

## 2. Objective

`npm run check:mojibake` must complete and report a real verdict when the index contains paths that no longer exist
on disk, **without weakening what it detects**. A deleted-but-still-tracked path is not a file with an encoding
problem — it has nothing to scan. It must be skipped **visibly** (reported, not silently swallowed), and every path
that does exist must be scanned exactly as before.

## 3. Verified context (inspected 2026-07-24 — all line numbers confirmed by reading the file)

### 3.1 The defect

`scripts/check-mojibake.mjs`:

- **`gitTrackedFiles()` (lines 135–143)** returns
  `git ls-files --cached --others --exclude-standard`. `--cached` reads the **index**, not the working tree, so a
  deleted-but-unstaged path is still returned.
- **`run()` (lines 201–232)**: `const files = gitTrackedFiles().filter(shouldScan)` (line 203), then the scan loop at
  lines 212–214 calls `scanFile(abs)` for every path.
- **`scanFile()` (lines 155–157)** opens the path with `readFileSync(absPath)` and has **no existence guard**. The
  first missing path throws an uncaught `ENOENT` and the process dies before any verdict is printed.

Reproduced by the orchestrator in-sandbox and by the owner natively on Windows (identical stack, `errno -4058`):

```
Error: ENOENT: no such file or directory, open '…\src\design-system\mantine\patterns\MantineCardGrid.tsx'
    at scanFile (…/scripts/check-mojibake.mjs:156:15)
    at run (…/scripts/check-mojibake.mjs:214:30)
```

Current tracked-but-absent set (verified by iterating `git ls-files` against the working tree) — exactly the four
Task 665 deletions, no others:

```
src/design-system/mantine/patterns/MantineCardGrid.tsx
src/stories/ListingGrid.stories.tsx
src/stories/StoryListingCard.tsx
src/stories/patterns/mantine/CardGrid.stories.tsx
```

### 3.2 The canonical in-repo precedent (reuse this, do not invent a mechanism)

`scripts/check-file-integrity.mjs` already solves exactly this problem and is why that gate passed clean (41 files)
in the same working tree where `check:mojibake` crashed:

- line 29: `import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';`
- **line 185: `if (!existsSync(filePath)) return errors;`** — per-file existence guard before any read.

`check-mojibake.mjs` already imports `existsSync` at **line 26** (`import { readFileSync, existsSync } from 'node:fs';`),
used at line 100 for the allowlist. **No new import is required.**

### 3.3 What must not change

- `SIGNATURES` detection, `scanFile()`'s decode/hit logic (lines 159–197), the allowlist mechanism
  (`loadAllowlist` 100–105, `globToRegExp` 110–128, `isAllowlisted` 130–132, `scripts/mojibake-allowlist.json`),
  `shouldScan()` (145–152), `SCAN_DIR_PREFIXES` (line 35), the exit codes (0 at line 238, 1 at line 250), and the
  failure report text (241–249) all stay byte-identical.
- `gitTrackedFiles()`'s git invocation stays `--cached --others --exclude-standard`. Do **not** switch to a
  working-tree enumeration: untracked-but-not-ignored files must still be scanned (that is why `--others` is there).

### 3.4 Visual/UI scope

**None.** No visible artifact, no story, no rendered surface, no locale string. A visual source map and a canonical
UI decision record are therefore `N/A` for this task — recorded explicitly, not omitted by oversight.

### 3.5 Critical-flow scan

`docs/critical-flow-registry.md` is not touched. No auth, RLS, moderation, reporting, or payment path is involved.

## 4. Requirements (ledger)

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner / agent-contract §9 | `check:mojibake` completes and prints a verdict when the index contains paths absent from disk; it never throws `ENOENT`. | P0 | Live run against the 4 unstaged deletions → exit 0 | Confirmed |
| R2 | Orchestrator | Absent paths are **partitioned out before the scan loop** (in `run()`), not silently swallowed inside `scanFile()`, so the "scanning N tracked text file(s)" count (line 205) and the "0 artifacts in N files" line (237) both report the number actually scanned. | P0 | Source diff + run output | Confirmed |
| R3 | Orchestrator (anti-silent-weakening) | The run prints an explicit informational line naming every skipped absent path and its count. A deletion must remain **visible** in the gate output; a silently shrinking scan set is the failure mode this task must not create. | P0 | Run transcript shows all 4 paths | Confirmed |
| R4 | §3.3 | Detection is not weakened: a planted mojibake artifact in a scanned file still fails the gate with exit 1 and the same report format. | P0 | Planted-violation proof (§13.4) | Confirmed |
| R5 | §3.3 | Non-weakening set proof: the set of paths actually scanned after the fix equals the set before the fix **minus exactly the absent paths** — no other path is dropped. | P0 | Before/after scanned-path set diff (§13.5) | Confirmed |
| R6 | §3.2 | The guard reuses the `existsSync` precedent from `check-file-integrity.mjs:185`; no new dependency, no new import, no new config file, no allowlist entry. | P1 | Source diff | Confirmed |
| R7 | §3.3 | `gitTrackedFiles()` keeps `--cached --others --exclude-standard`; untracked-but-not-ignored files are still scanned. | P0 | Source diff + a scanned untracked file appears in the count | Confirmed |
| R8 | agent-contract §9 | `npx tsc --noEmit` clean; `npm run build` exit 0. | P0 | transcripts | Confirmed |
| R9 | qa-rules | `npm run check:file-integrity` clean on the touched file. | P1 | transcript | Confirmed |
| R10 | agent-contract §10 | `docs/backlog.md` updated with concise current state; session log added under `docs/sessions/` with a Files Changed table matching the real diff. | P0 | Files exist and match diff | Confirmed |

## 5. Assumptions and open questions

- **A1 (P0 sequencing precondition):** this task must execute **while the four Task 665 deletions are still
  unstaged**, because that is the live reproduction of the defect. Verify first with read-only
  `git status --short` — the four paths must show as ` D ` (deleted in worktree, not in index). **If they are already
  staged, STOP and return `BLOCKED` with that finding**; do not fabricate a repro, and do not create, initialise, or
  mutate any git repository (including a throwaway one) to manufacture one. The owner will decide how to restore the
  condition.
- **A2:** the fix is behaviour-preserving for every existing path, so no `mojibake-allowlist.json` entry is needed and
  none may be added. Adding an allowlist entry instead of the guard would be the wrong fix — it suppresses findings.
- **A3:** the informational skip line (R3) goes to `stdout` and does not affect the exit code. Absent paths are not
  failures.
- **OQ1 (non-blocking, do not action here):** the same `git ls-files`-without-guard pattern may exist in other
  `scripts/*.mjs` gates. Report any you notice in the session log as a finding; **do not fix them in this task**
  (P0 scope rule).

## 6. Pre-read rule bundle (exact — do not read more)

1. `docs/agent-contract.md` — §1 (scope), §9 (validation evidence, build gate, deletion audit), §14 (file integrity).
2. `docs/qa-rules.md` → "Encoding hygiene".
3. `docs/qa-profiles.md` → `Q1 Targeted` and the `Q4` planted-violation clause (why it is borrowed here — §13).
4. `scripts/check-mojibake.mjs` (whole file, ~254 lines).
5. `scripts/check-file-integrity.mjs` lines 29 and 180–190 (the precedent guard).
6. This kickoff.

## 7. Scope

- `scripts/check-mojibake.mjs` only: partition absent paths out in `run()`, report them, scan the rest unchanged.
- `docs/backlog.md` + a new session log under `docs/sessions/`.

## 8. Out of scope

- Any other gate script, including ones with the same latent pattern (OQ1).
- Any change to `SIGNATURES`, allowlist data/mechanism, `shouldScan`, `SCAN_DIR_PREFIXES`, exit codes, or the failure
  report text.
- Switching `gitTrackedFiles()` to a filesystem walk.
- Any mutating git, including staging the Task 665 deletions (owner-only, native PowerShell).
- Any Task 665 artifact — code, stories, docs, or its session log.

## 9. Current and required behavior

**Current:** with ≥1 tracked-but-absent path, `check:mojibake` prints its banner (line 205) and then throws an
uncaught `ENOENT` from `scanFile` (line 156) via the loop at line 214. No verdict, no exit code 0/1 — a crash. Every
task that deletes a tracked file is blocked on the owner staging the deletion before the gate can run at all.

**Required (after):** the same run partitions absent paths out before the loop, prints how many were skipped and
which, scans every remaining path with byte-identical logic, and exits 0 (or 1 on a real artifact). With no absent
paths, output and behaviour are unchanged from today.

## 10. Implementation requirements

1. In `run()` (currently line 203), replace the single `.filter(shouldScan)` with a partition of the
   `shouldScan`-passing paths into `present` (`existsSync(resolve(ROOT, rel))`) and `missing`. Scan `present` only.
2. Keep the banner at line 205 counting `present`, and the success line at 237 counting `present`.
3. When `missing.length > 0`, print an informational block before the scan — the count plus every path, one per line
   — stating these are tracked-but-deleted paths with nothing to scan (e.g. staged deletion pending). No `process.exit`
   change, no `console.error`.
4. Leave `scanFile` untouched. The guard belongs in `run()` so the reported counts stay truthful (R2); a guard inside
   `scanFile` would return an empty result and inflate the "scanned" count.
5. Do not reorder, rename, or reformat anything else in the file. The diff should be small and reviewable.

## 11. Positive and negative flows

**Positive flow:** owner or executor runs `npm run check:mojibake` in a worktree with unstaged deletions; the gate
reports the skipped paths, scans the rest, and exits 0.

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| Tracked path absent from disk | **Yes** (the defect) | R1–R3 | Skipped, named in output, exit unaffected | Live run, §13.2 |
| Real mojibake artifact in a present file | **Yes** (non-weakening) | R4 | Still exit 1, same report format | Planted-violation proof, §13.4 |
| Invalid-UTF-8 file present on disk | **Yes** | R4 | Unchanged `invalidCount` path (lines 216–221) | Source diff; covered by the same planted run |
| Untracked-but-not-ignored file present | **Yes** | R7 | Still scanned (`--others` preserved) | Scanned-set diff, §13.5 |
| Allowlisted path that is also absent | **Yes** | R2/A2 | Skipped as absent before allowlist logic is reached; no allowlist change | Source diff |
| Zero absent paths (normal worktree) | **Yes** | R2 | Output byte-identical to today | §13.5 comparison |
| Validation / RLS / auth / offline / concurrent writer | No | No data path, no request path, no user input — this is a local CLI file scanner | N/A | — |
| Locale / i18n | No | No user-facing string; script output is developer-only English, consistent with every other gate | N/A | — |
| Rendered UI / responsive | No | No component, story, or DOM (§3.4) | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1,R2]** *Given* a worktree whose index lists ≥1 path absent from disk, *when* `npm run check:mojibake` runs,
  *then* it exits **0** with no `ENOENT`, and its banner/summary counts equal the number of present scanned files.
- **AC2 [R3]** *Given* the same run, *when* the output is read, *then* it names **all four** currently-absent Task 665
  paths and states how many were skipped.
- **AC3 [R4]** *Given* a deliberately planted mojibake artifact in one scanned file, *when* the gate runs, *then* it
  exits **1** and reports that file with the pre-existing report format; *and when* the plant is reverted, *then* it
  exits **0** again. The planted file must be reverted before completion and must not appear in the final diff.
- **AC4 [R5,R7]** *Given* the scanned-path set captured before and after the change, *when* they are diffed, *then*
  the only difference is the absent paths — no present path, tracked or untracked, is lost.
- **AC5 [R6]** *Given* the diff, *when* reviewed, *then* it touches only `run()` in `scripts/check-mojibake.mjs`,
  adds no import/dependency/config/allowlist entry, and leaves `scanFile`/`shouldScan`/`gitTrackedFiles`'s git
  invocation/exit codes/report text unchanged.
- **AC6 [R8,R9]** *Given* the final tree, *when* validated, *then* `npx tsc --noEmit` is clean, `npm run build` exits
  **0**, and `npm run check:file-integrity` is clean.
- **AC7 [R10]** *Given* completion, *when* records are checked, *then* `docs/backlog.md` carries concise current state
  and a session log exists whose Files Changed table matches the real diff.

## 13. QA profile and verification plan

**Profile: `Q1 Targeted`** — non-UI internal tooling, no rendered surface, no user-facing behaviour
(`docs/qa-profiles.md`). **Borrowed `Q4` clause, mandatory here:** this task modifies an enforcement gate in the
*more tolerant* direction, and `qa-profiles.md` requires **planted-violation failure proof when a gate is claimed**.
Q1 evidence alone would let a silently-weakened gate ship green. Steps 4 and 5 are therefore non-negotiable.

1. **Precondition (A1):** read-only `git status --short`; confirm the four §3.1 paths show ` D `. If staged → `BLOCKED`.
2. **Before:** `npm run check:mojibake` → capture the `ENOENT` crash transcript verbatim (this is the defect record).
3. **After:** `npm run check:mojibake` → exit 0; transcript must show the skip block with all four paths and the
   scanned count.
4. **Planted-violation proof (R4/AC3):** insert a known mojibake signature into one scanned file (pick a signature
   already in `SIGNATURES`; a scratch file under a `SCAN_DIR_PREFIXES` directory is acceptable since `--others`
   makes it scanned). Run → **exit 1**, file reported. Revert/delete the plant. Run → **exit 0**. Record both
   transcripts. Confirm the plant is absent from the final `git status --short`.
5. **Non-weakening set proof (R5/AC4):** capture the scanned-path list from the pre-change script and from the
   post-change script and diff the two sets. Suggested capture that does not modify the gate — run the old and new
   `run()` file-selection logic via a throwaway `node -e` snippet, or temporarily print the list behind a local
   scratch edit that is reverted before completion. Record the diff: it must be exactly the four absent paths.
6. `npx tsc --noEmit` → 0.
7. `npm run build` → exit 0 (mandatory non-Q0 hard gate; include the transcript).
8. `npm run check:file-integrity` → clean.

If any required gate cannot run because of the sandbox, record the exact native command and expected evidence and
return `PARTIALLY IMPLEMENTED`/`BLOCKED` — never a confidence claim.

## 14. Completion report contract (Sonnet)

Session log `docs/sessions/2026-07-<dd>-task666-mojibake-deletion-tolerance.md` + `docs/backlog.md`:

- Files Changed table equal to the real diff.
- R1–R10 each with concrete evidence.
- Verbatim **before** (crash) and **after** (exit 0 + skip block) transcripts.
- Both planted-violation transcripts (fail then pass) and proof the plant was reverted.
- The scanned-path set diff (step 5) showing exactly the four absent paths and nothing else.
- `tsc`, `build`, `check:file-integrity` results with actual exit codes.
- Assumptions, deviations, limitations, any OQ1 sightings (reported, not fixed).
- AC1–AC7 self-audit.
- Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. No self-approval, no
  mutating git, no `git push` in any form.

## 15. Task quality gate (orchestrator self-check — all pass)

- Fresh Sonnet can execute without chat context — yes: the defect, its exact lines, the canonical precedent, the
  reproduction set, the fix location, and the proof steps are all inlined and were read before writing.
- Every primary requirement has a binary AC + verification — yes (R1–R10 → AC1–AC7 + §13).
- Scope protects existing behavior and names what must not change — yes (§3.3, §8, R7).
- No uninspected claim — every line number, the import at line 26, the precedent at
  `check-file-integrity.mjs:185`, and the four absent paths were verified by reading/executing, not inferred.
- Gate change proves observable behavior, not implementation detail — yes: the planted-violation proof (step 4) and
  the scanned-set diff (step 5) exist precisely because this task makes a gate more permissive.
- Negative flows selected by applicability, not copied — yes (§11; UI/i18n/RLS marked `No` with concrete reasons).
- UI/visual obligations — explicitly `N/A` with reason (§3.4), not silently skipped.
- Assumptions and the sequencing precondition are visible — yes (A1 is a P0 `BLOCKED` condition).

---

**Task path:** `tasks/kickoff_prompt_Task_666_Mojibake_Gate_Deletion_Tolerance.md`
**QA profile:** `Q1 Targeted` + mandatory `Q4` planted-violation clause (§13).
**Ambiguous/conflicting requirements:** none.
**Owner decision still needed:** none for execution. Sequencing only — run this task **before** staging the Task 665
deletions (A1), then stage them.
