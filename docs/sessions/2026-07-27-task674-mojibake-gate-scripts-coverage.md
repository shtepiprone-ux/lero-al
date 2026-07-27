# Session Archive: Task 674 — check:mojibake scripts/ coverage — 2026-07-27

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.**
All code, documentation and gate-behaviour evidence is complete and verified. The two gates that could not run
in the agent sandbox, `npx tsc --noEmit` and `npm run build`, were **run natively by the owner on 2026-07-27
and both exited 0** — transcript in §5. No self-approval.

> **Encoding note.** `docs/sessions/` is inside the `check:mojibake` scanned set and this file is **not**
> allowlisted. Every mojibake artifact below is therefore named by **codepoint**, never reproduced.

## 1. Objective

`npm run check:mojibake` never scanned `scripts/`. `shouldScan()` filtered against `SCAN_DIR_PREFIXES`, which
omitted it, so every governance and QA harness in the repo — 72 text files, dense with non-ASCII — was outside
a gate that `agent-contract.md` clause 14 relies on. Surfaced during the Task 668 revision-7 review, where an
executor cited a green `check:mojibake` as file-integrity evidence for two new harness scripts under
`scripts/`; the gate had never looked at them.

## 2. Files Changed

| # | Path | Change |
|---|---|---|
| 1 | `scripts/check-mojibake.mjs` | L35: `'scripts/'` appended to `SCAN_DIR_PREFIXES`. L214: banner now derived from that constant and states the collection truthfully |
| 2 | `scripts/mojibake-allowlist.json` | one entry appended: `scripts/check-mojibake.mjs` |
| 3 | `docs/qa-rules.md` | `### Encoding hygiene` section only: scope, collection wording, allowlist reason and its breadth |
| 4 | `docs/backlog-archive.md` | one ledger row at the top |
| 5 | `docs/sessions/2026-07-27-task674-mojibake-gate-scripts-coverage.md` | this file (new) |

`docs/backlog.md` is **deliberately untouched**, per the owner decision of 2026-07-27: *"Для Task 674
docs/backlog.md має лишитися byte-identical … BACKLOG LIMIT BREACH усвідомлено відкладається для окремої
майбутньої роботи."* No entry, no "Last Session" update, no consolidation. `git status` confirms it is not
modified.

### 2.1 Diffs

`scripts/check-mojibake.mjs`:

```diff
-const SCAN_DIR_PREFIXES = ['docs/', 'src/', 'app/', 'components/', 'modules/', 'messages/', 'tasks/'];
+const SCAN_DIR_PREFIXES = ['docs/', 'src/', 'app/', 'components/', 'modules/', 'messages/', 'tasks/', 'scripts/'];
```

```diff
-  console.log(`check:mojibake — scanning ${files.length} tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md`);
+  console.log(`check:mojibake — scanning ${files.length} text file(s), tracked and untracked-not-ignored, under ${SCAN_DIR_PREFIXES.join(' ')} + root *.md`);
```

Two inaccuracies are fixed here. The directory list was a hardcoded second copy of L35 and could drift from
it; it is now derived, so the two cannot disagree. The word "tracked" was wrong: L138 collects with
`git ls-files --cached --others --exclude-standard`, i.e. tracked **and** untracked-not-ignored.

`scripts/mojibake-allowlist.json`:

```diff
-  "docs/sessions/task467-owner-final-rerun.log"
+  "docs/sessions/task467-owner-final-rerun.log",
+  "scripts/check-mojibake.mjs"
 ]
```

The existing 10 entries are unchanged and in their original order; the new entry is appended last.

`docs/qa-rules.md` — **diff not quoted verbatim.** That file is allowlisted precisely because its "What it
catches" paragraph contains artifact literals; this session log is not allowlisted, so pasting the diff would
plant those literals in a scanned file and turn the gate red. Described instead: the scope sentence now lists
`scripts/` alongside the existing seven directories and root `*.md`; the collection is described as tracked
and untracked-not-ignored with the exact `git ls-files` invocation; and a new paragraph records why the
detector is allowlisted (its `SIGNATURES` table necessarily holds every artifact string as a literal) together
with the breadth of that exemption — `isAllowlisted()` is consulted in the invalid-UTF-8 branch (L232) as well
as the signature branch (L240), so the detector is exempt from encoding-validity checking too, with no
compensating control today.

## 3. Verification evidence

All commands run from the repository root. Counts include the two untracked Task 674 task artifacts under
`tasks/`, which the collector picks up as untracked-not-ignored.

### 3.1 Gate passes after widening

```
$ node scripts/check-mojibake.mjs
check:mojibake — scanning 1973 text file(s), tracked and untracked-not-ignored, under docs/ src/ app/ components/ modules/ messages/ tasks/ scripts/ + root *.md

check:mojibake — skipping 4 tracked-but-deleted path(s) (staged deletion pending, nothing to scan):
  ...
check:mojibake: 0 artifacts in 1973 files
exit=0
```

`npm run check:mojibake` produces the same result at exit 0. The banner names `scripts/`, every other prefix,
and no longer claims the collection is tracked-only.

### 3.2 Planted signature probe under `scripts/` — the gate rejects it

Probe built from codepoints **U+00D4 U+00A3 U+00E0** (UTF-8 bytes `C3 94 C2 A3 C3 A0`); the literal was never
copied out of the `SIGNATURES` table.

```
$ printf '\xc3\x94\xc2\xa3\xc3\xa0' > scripts/__mojibake_probe_sig.tmp.mjs
$ git ls-files --others --exclude-standard -- scripts/ | grep -c __mojibake_probe_sig
1                                     # the collector does see it; not ignored
$ node scripts/check-mojibake.mjs
check:mojibake FAILED — 1 artifact(s), 0 invalid-UTF-8 file(s):
  scripts/__mojibake_probe_sig.tmp.mjs
    scripts/__mojibake_probe_sig.tmp.mjs:1:1  CP1252-of-UTF-8 for "<U+2705>"  "...<artifact redacted>..."
exit=1
```

Recovery:

```
$ rm -f scripts/__mojibake_probe_sig.tmp.mjs
$ node scripts/check-mojibake.mjs
check:mojibake: 0 artifacts in 1973 files
exit=0
```

The failing report names the probe with `file:line:col`, so the exit 1 is attributable to it and not to some
unrelated condition.

### 3.3 Planted invalid-UTF-8 probe under `scripts/` — the gate rejects it

```
$ printf '\x80' > scripts/__mojibake_probe_utf8.tmp.mjs
$ git ls-files --others --exclude-standard -- scripts/ | grep -c __mojibake_probe_utf8
1
$ node scripts/check-mojibake.mjs
check:mojibake FAILED — 0 artifact(s), 1 invalid-UTF-8 file(s):
  scripts/__mojibake_probe_utf8.tmp.mjs
    -> Not valid UTF-8 — file must be re-saved as UTF-8 (no BOM)
exit=1

$ rm -f scripts/__mojibake_probe_utf8.tmp.mjs
$ node scripts/check-mojibake.mjs
check:mojibake: 0 artifacts in 1973 files
exit=0
```

Both branches of the detector are now proven to fire on a file under `scripts/`, and both recover cleanly.
Neither probe remains: `git status` shows no `scripts/__mojibake_probe_*` path.

### 3.4 Why the detector needed the allowlist

Before the allowlist entry, widening the scan turns the gate red on its own source: `scripts/check-mojibake.mjs`
matches **all 38** `SIGNATURES` patterns, because the table contains every artifact string as a literal. It is
the only offender under `scripts/` — the other 71 text files have no signature hit, no invalid UTF-8, no BOM
and no NUL byte. The exemption follows established in-repo precedent: `docs/qa-rules.md` and the Task 428/429
kickoffs and session logs are allowlisted for exactly the same reason.

## 4. Final `git status`

The repository was already dirty when this task started, carrying **49** uncommitted entries from Tasks 665,
666 and 668 — including the two Task 674 task artifacts under `tasks/`, which predate this session. Those are
untouched by this task. After it, the status holds **54** entries: the same 49 plus exactly five task-owned
paths.

```
 M docs/backlog-archive.md
 M docs/qa-rules.md
 M scripts/check-mojibake.mjs
 M scripts/mojibake-allowlist.json
?? docs/sessions/2026-07-27-task674-mojibake-gate-scripts-coverage.md
```

No probe file appears. No path outside this list changed.

**Correction, recorded rather than silently fixed.** An earlier draft of this section claimed
`docs/backlog.md` does not appear in `git status`. That was wrong: it **does** appear as ` M`, and it did so
**before this task started** — it carries uncommitted Tasks 665/666/668 work. What the owner exception
requires is that *this task* not change it, and that holds:

- it was already ` M` in the first `git status --short` of the session, before any edit here;
- its mtime is `2026-07-27 10:52:41`, hours before this task's first write at `19:10:02`;
- no write tool was ever pointed at it, and the status delta between session start and now is exactly the
  five paths listed above.

A `git diff --quiet -- docs/backlog.md` therefore reports "modified" in this worktree and always would, for
reasons that have nothing to do with Task 674. In a clean worktree the same command would report unmodified.
This is the one place where working in the dirty main worktree, rather than an isolated one, weakens the
evidence: the untouched-ness rests on the status delta and the timestamp above, not on a clean-tree diff.

## 5. Typecheck and build — run natively by the owner, both exit 0

These two gates could not complete inside the agent sandbox: each shell invocation runs in its own PID
namespace with a hard 45-second limit, and both commands exceed it, so the process was killed before
finishing. Rather than claim or infer a result, they were handed to the owner and **run natively in PowerShell
on 2026-07-27, 19:33-19:34**. Both passed.

```powershell
PS C:\Claude_Code_Projects\lero-al> npx tsc --noEmit
PS C:\Claude_Code_Projects\lero-al> npm run build

> lero-al@0.1.0 build
> next build

   Next.js 15.5.18
   - Environments: .env.local
   - Experiments (use with caution): clientTraceMetadata

   Creating an optimized production build ...
   Compiled successfully in 53s
   Skipping linting
   Checking validity of types
   Collecting page data
   Generating static pages (40/40)
   Collecting build traces
   Finalizing page optimization
```

- `npx tsc --noEmit` produced **no output** and returned to the prompt: 0 errors.
- `npm run build` **compiled successfully in 53s**, passed "Checking validity of types", and generated
  **40/40** static pages, then finished page optimization. Full route table in the owner's transcript.

No warning, error, or route regression appeared. This closes the last outstanding evidence for the task.

## 6. Requirement coverage

| Req | Evidence |
|---|---|
| Add `scripts/` to `SCAN_DIR_PREFIXES` | §2.1 diff; §3.1 banner and count |
| Banner truthful about tracked + untracked-not-ignored | §2.1 diff; §3.1 banner text; derived from the constant, no second copy |
| Allowlist the detector | §2.1 diff; §3.4 reason; §3.1 exit 0 |
| Update only the Encoding hygiene documentation | §2 row 3; no other section of `docs/qa-rules.md` touched |
| Archive row + session log; `docs/backlog.md` untouched | §2 rows 4 and 5; §4 status |
| `check:mojibake` exit 0 | §3.1 |
| Signature probe: exit 1 naming it, then 0 | §3.2 |
| Invalid-UTF-8 probe: exit 1 naming it, then 0 | §3.3 |
| `npx tsc --noEmit` | **PASS** — owner-run natively 2026-07-27, no output, 0 errors (§5) |
| `npm run build` | **PASS** — owner-run natively 2026-07-27, compiled in 53s, types valid, 40/40 static pages (§5) |
| `git status` shows only task-owned paths | §4 |

## 7. Notes and limitations

- The scanned-file count rose from 1893 tracked files at `HEAD` to 1973 in this working tree. The difference
  is the 72 newly-covered `scripts/` files plus the untracked-not-ignored files present in the dirty tree
  (this session log, the two Task 674 artifacts under `tasks/`, and the untracked work from Tasks 665/666/668),
  less the 4 tracked-but-deleted paths that Task 666's `missing[]` branch skips.
- Work was done in the **main worktree**, which holds uncommitted Tasks 665/666/668 changes. Nothing outside
  the five task-owned paths was read for modification or written.
- Still outside the scanned set after this change: root-level non-`.md` files, `.storybook/`, `.github/`, and
  anything git-ignored such as `.claude/`. Not measured for artifacts; a separate decision.
- The allowlist entry exempts the detector from the invalid-UTF-8 check as well as the signature check (§2
  diff commentary). Documented in `docs/qa-rules.md`, not mitigated. Rebuilding `SIGNATURES` from `\uXXXX`
  escapes would remove the need for the exemption; that is a larger change to a governance table and was not
  made here.
