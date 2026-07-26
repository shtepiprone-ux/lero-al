# Session Log — Task 666: Make `check:mojibake` deletion-tolerant

**Task path:** `tasks/kickoff_prompt_Task_666_Mojibake_Gate_Deletion_Tolerance.md`
**QA profile:** `Q1 Targeted` + mandatory `Q4` planted-violation clause (kickoff §13).
**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

No self-approval. No mutating git was run, emitted, or suggested. The four Task 665 deletions remain unstaged
(owner-only, out of scope for this task) — confirmed unchanged at the end of this session (§7).

## 1. Precondition (A1)

`git status --short` before any edit confirmed all four kickoff §3.1 paths as ` D ` (deleted in worktree, not
staged):

```
 D src/design-system/mantine/patterns/MantineCardGrid.tsx
 D src/stories/ListingGrid.stories.tsx
 D src/stories/StoryListingCard.tsx
 D src/stories/patterns/mantine/CardGrid.stories.tsx
```

Precondition met — proceeded.

## 2. Requirement ledger — evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1 | Gate completes with a real verdict, never `ENOENT`, when the index has absent paths | §3 before/after transcripts — before crashes, after exits 0 |
| R2 | Absent paths partitioned out **in `run()`** before the scan loop; banner/summary counts equal the number actually scanned | Diff (§6) — `candidates`/`files`/`missing` split before the banner `console.log`; banner + `0 artifacts in ${files.length} files` both read 1886 |
| R3 | Skipped paths are printed visibly (count + every path) | §3 after-transcript shows the skip block naming all 4 paths |
| R4 | Detection not weakened — planted artifact still fails, same report format | §4 planted-violation transcripts |
| R5 | Non-weakening set proof — scanned set after = scanned set before minus exactly the absent paths | §5 diff — exactly the 4 absent paths, nothing else |
| R6 | Reuses `existsSync` precedent (`check-file-integrity.mjs:185`); no new import/dependency/config/allowlist entry | Diff (§6) — only `existsSync`/`resolve`, both already imported at line 26/27; no new `import` line |
| R7 | `gitTrackedFiles()` keeps `--cached --others --exclude-standard`; untracked-but-not-ignored files still scanned | Diff (§6) — `gitTrackedFiles()` untouched; §4's scratch plant was an **untracked** file and was scanned (proves `--others` still active) |
| R8 | `tsc --noEmit` clean; `npm run build` exit 0 | §8 — both exit 0 |
| R9 | `check:file-integrity` clean | §8 — 42 files, PASSED |
| R10 | `docs/backlog.md` + session log updated | This file + `docs/backlog.md` Last Session entry |

## 3. Before / after transcripts (R1–R3, AC1, AC2)

**Before (defect record) — `npm run check:mojibake`:**

```
> lero-al@0.1.0 check:mojibake
> node scripts/check-mojibake.mjs

check:mojibake — scanning 1890 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

node:fs:560
  return binding.open(
                 ^

Error: ENOENT: no such file or directory, open 'C:\Claude_Code_Projects\lero-al\src\design-system\mantine\patterns\MantineCardGrid.tsx'
    at Object.openSync (node:fs:560:18)
    at readFileSync (node:fs:444:35)
    at scanFile (file:///C:/Claude_Code_Projects/lero-al/scripts/check-mojibake.mjs:156:15)
    at run (file:///C:/Claude_Code_Projects/lero-al/scripts/check-mojibake.mjs:214:30)
    ...
  errno: -4058,
  code: 'ENOENT',
  syscall: 'open',
  path: 'C:\\Claude_Code_Projects\\lero-al\\src\\design-system\\mantine\\patterns\\MantineCardGrid.tsx'
}

Node.js v22.22.3
```

No verdict, no exit 0/1 — process crash, matching kickoff §3.1 exactly.

**After (fix applied) — `npm run check:mojibake`:**

```
> lero-al@0.1.0 check:mojibake
> node scripts/check-mojibake.mjs

check:mojibake — scanning 1886 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake — skipping 4 tracked-but-deleted path(s) (staged deletion pending, nothing to scan):
  src/design-system/mantine/patterns/MantineCardGrid.tsx
  src/stories/ListingGrid.stories.tsx
  src/stories/StoryListingCard.tsx
  src/stories/patterns/mantine/CardGrid.stories.tsx

check:mojibake: 0 artifacts in 1886 files
```

Exit code: 0. 1890 candidates − 4 skipped = 1886 scanned, matching both the banner and the summary line (R2). All
four Task 665 paths named (R3, AC2).

## 4. Planted-violation proof (R4, AC3)

Per kickoff §13.4, planted a known `SIGNATURES` match (the CP1252-of-UTF-8 en-dash sequence, `SIGNATURES` entry
name `CP1252-of-UTF-8 for "–" (en dash)`; literal bytes elided here — see the note at the end of this section —
so this log itself stays clean under the same gate) into an **untracked scratch file** under a
`SCAN_DIR_PREFIXES` directory: `docs/_scratch-task666-plant.md`.

**Run with plant — exit 1:**

```
check:mojibake — scanning 1887 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake — skipping 4 tracked-but-deleted path(s) (staged deletion pending, nothing to scan):
  src/design-system/mantine/patterns/MantineCardGrid.tsx
  src/stories/ListingGrid.stories.tsx
  src/stories/StoryListingCard.tsx
  src/stories/patterns/mantine/CardGrid.stories.tsx

check:mojibake FAILED — 1 artifact(s), 0 invalid-UTF-8 file(s):

  docs/_scratch-task666-plant.md
    docs/_scratch-task666-plant.md:1:52  CP1252-of-UTF-8 for "–" (en dash)  "...ion proof [ELIDED-3-CHAR-MOJIBAKE-SEQUENCE] delete be..."
      -> Re-encode as UTF-8 (intended: – U+2013).

  Remediation: re-save the offending file as UTF-8 (no BOM). If the artifact is
  intentional documentation, add the path to scripts/mojibake-allowlist.json.
  Rule: docs/agent-contract.md clause 14, docs/qa-rules.md -> "Encoding hygiene"
```

`EXIT_CODE=1` — same pre-existing report format (file path, line:col, signature name, snippet, hint, remediation
block). The scratch file was picked up via `--others` while untracked, additionally reconfirming R7.

**Note on elision:** the transcript's matched snippet substring was replaced with the literal placeholder
`[ELIDED-3-CHAR-MOJIBAKE-SEQUENCE]` in this log (self-referentially, this tracked session-log file is itself
subject to `check:mojibake` — quoting the actual 3-character CP1252-of-UTF-8 sequence verbatim would make this
file a permanent, real gate failure). The signature name, line/column, hint, and pass/fail semantics are otherwise
reproduced verbatim.

**Plant reverted (`rm docs/_scratch-task666-plant.md`), run again — exit 0:**

```
check:mojibake — scanning 1886 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake — skipping 4 tracked-but-deleted path(s) ...

check:mojibake: 0 artifacts in 1886 files
```

`EXIT_CODE=0`. `git status --short | grep -i scratch` → no output — the plant does not appear in the final tree.

## 5. Non-weakening scanned-set proof (R5, AC4)

Captured the scanned-path set from the pre-fix selection logic (`gitTrackedFiles().filter(shouldScan)`, no existence
guard) and the post-fix selection logic (`...filter(shouldScan)` further filtered by `existsSync`), both via
throwaway `node -e` snippets (no gate file was modified for this capture; both scratch outputs were deleted after
diffing):

- Before-set count: 1890
- After-set count: 1886
- `diff before-scanset.txt after-scanset.txt`:

```
938d937
< src/design-system/mantine/patterns/MantineCardGrid.tsx
1242d1240
< src/stories/ListingGrid.stories.tsx
1246d1243
< src/stories/StoryListingCard.tsx
1305d1301
< src/stories/patterns/mantine/CardGrid.stories.tsx
```

Exactly the four absent paths, nothing else — no present path (tracked or untracked) was lost.

## 6. Diff (R2, R6, AC5)

Only `run()` in `scripts/check-mojibake.mjs` changed. No new import (`existsSync`/`resolve` were already imported at
line 26–27), no new dependency, no config/allowlist change, `scanFile`/`shouldScan`/`gitTrackedFiles`/exit
codes/failure-report text untouched:

```diff
 function run() {
   const allowlist = loadAllowlist();
-  const files = gitTrackedFiles().filter(shouldScan);
+  const candidates = gitTrackedFiles().filter(shouldScan);
+  const files = [];
+  const missing = [];
+  for (const rel of candidates) {
+    if (existsSync(resolve(ROOT, rel))) {
+      files.push(rel);
+    } else {
+      missing.push(rel);
+    }
+  }

   console.log(`check:mojibake — scanning ${files.length} tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md`);
   console.log('');

+  if (missing.length > 0) {
+    console.log(`check:mojibake — skipping ${missing.length} tracked-but-deleted path(s) (staged deletion pending, nothing to scan):`);
+    for (const rel of missing) console.log(`  ${rel}`);
+    console.log('');
+  }
+
   let artifactCount = 0;
   let invalidCount = 0;
   const reports = [];
```

`git diff --stat scripts/check-mojibake.mjs` → `1 file changed, 16 insertions(+), 1 deletion(-)`.

## 7. Scope guard

`git status --short` after the fix still shows the four Task 665 deletions as ` D ` — unstaged, untouched, out of
scope per kickoff §8. No mutating git was run.

## 8. Validation gates (R8, R9, AC6)

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Exit 0, no output (re-run after §8a fix, still 0) |
| File integrity | `npm run check:file-integrity` | `check:file-integrity PASSED — all 43 file(s) clean`, exit 0 (re-run after §8a fix; count moved 42→43 because the redacted session-log edit added no new file, the increase is the untracked session log itself joining the changed-file set between runs) |
| Production build (mandatory) | `npm run build` | Compiled successfully in 55s; 40/40 static pages generated; exit 0 |
| `check:mojibake` (final self-check) | `npm run check:mojibake` | Exit 0, `0 artifacts in 1887 files` — see §8a |

### 8a. Self-review catch: this log itself tripped the gate it documents

Immediately before finishing, ran `npm run check:mojibake` once more as a final sanity check (not one of the
required steps, but the obvious adversarial check given this task's subject). It **failed**: §4's transcript had
quoted the planted file's matched snippet verbatim, which meant this tracked session-log file now permanently
contained the same 3-character CP1252-of-UTF-8 sequence — a real, ordinary mojibake hit, unrelated to the
deletion-tolerance fix itself. Fixed by replacing the literal matched substring in §4 with the placeholder
`[ELIDED-3-CHAR-MOJIBAKE-SEQUENCE]` and adding an explanatory note (signature name/line/column/hint/pass-fail
semantics all still reproduced verbatim). Re-ran `check:mojibake` → exit 0, `0 artifacts in 1887 files` (1887, not
1886, because this now-untracked-but-present session log file itself joined the scanned set). Re-ran
`check:file-integrity` and `tsc --noEmit` after this edit — both still clean (§8 table). `npm run build` was not
re-run after this doc-only edit since it does not touch build-relevant source; the build result recorded above is
from immediately after the `scripts/check-mojibake.mjs` source edit.

## 9. OQ1 — non-blocking finding, not fixed here

Searched `scripts/*.mjs` for the same `git ls-files`-without-guard pattern (per kickoff OQ1, "report, do not fix"):
only two scripts call `git ls-files --cached ...` — `check-mojibake.mjs` (fixed here) and
`check-file-integrity.mjs`, which already has the `existsSync` guard at line 185 (the canonical precedent this task
reused). No other gate script uses this pattern; no further OQ1 sighting to report.

## 10. Assumptions, deviations, limitations

- No deviation from the kickoff's implementation requirements (§10) — partition happens in `run()`, `scanFile`
  untouched, banner/summary count `present` only.
- The planted-violation scratch file and both `node -e` scanned-set-capture scratch outputs were deleted before
  this report; none appear in the final diff or `git status --short`.
- Session executed while Task 665's four deletions remain unstaged (A1 precondition), matching the owner's stated
  sequencing (kickoff §1, §15 "Owner decision still needed").

## 11. Acceptance-criteria self-audit

| AC | Verdict | Evidence |
|---|---|---|
| AC1 [R1,R2] | PASS | §3 after-transcript: exit 0, no ENOENT, banner/summary both 1886 |
| AC2 [R3] | PASS | §3 after-transcript names all 4 paths + count |
| AC3 [R4] | PASS | §4 — plant → exit 1 same format; revert → exit 0; plant absent from final tree |
| AC4 [R5,R7] | PASS | §5 diff = exactly the 4 absent paths; §4 scratch untracked file was scanned (`--others` intact) |
| AC5 [R6] | PASS | §6 diff — only `run()`, no new import/dependency/config/allowlist |
| AC6 [R8,R9] | PASS | §8 — tsc 0, build 0, file-integrity clean |
| AC7 [R10] | PASS | This session log + `docs/backlog.md` Last Session entry |

## 12. Files Changed

| File | Reason |
|---|---|
| `scripts/check-mojibake.mjs` | Partition tracked-but-disk-absent paths out of the scan loop in `run()`; report them visibly; scan the rest unchanged |
| `docs/backlog.md` | Concise current-state entry for Task 666 |
| `docs/sessions/2026-07-26-task666-mojibake-deletion-tolerance.md` | This session log (new) |

## 13. Backlog note

`docs/backlog.md` was already at/over the ~80-line active-state limit before this edit (83 physical lines). The
Task 666 entry was added in place of expanding history; net line count is unchanged from before this session
(83 lines) because the existing 665 entry's now-stale "still blocked by mojibake" clause was compressed by the same
amount added. **`BACKLOG LIMIT BREACH` still applies** (file was already over 80 lines pre-existing, per the 2026-07-24
session) — flagging for orchestrator consolidation, not fixing here (out of this task's scope).

## 14. Opus handoff

- Evidence locations: this file (all sections), `scripts/check-mojibake.mjs` diff (§6), `docs/backlog.md` Last
  Session entry.
- Please verify: (1) the four Task 665 deletions are still unstaged and untouched by this task; (2) the planted
  scratch file and both `node -e` capture files left no trace in the working tree; (3) `docs/backlog.md` already
  exceeded 80 lines before this session (pre-existing breach, not introduced here) — confirm whether consolidation
  should happen now or wait for 665's closure.
- No mutating git was run. This task does not request a commit for `scripts/check-mojibake.mjs`/backlog/session-log
  changes — that is the orchestrator's owner-run handoff per `docs/orchestrator-procedures.md`.
