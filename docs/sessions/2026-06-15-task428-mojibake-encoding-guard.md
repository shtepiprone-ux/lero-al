# Task 428 — Mojibake / UTF-8 encoding guard (governance + tooling)

**Type:** governance/tooling (CI gate + docs). Not product code.
**Priority:** medium (data-integrity guard; prevents corrupted text landing in the repo).
**Origin:** 2026-06-15 owner report of mojibake (`Ô£à`→✅, `ÔåÆ`→→, `ÔÇö`→—) in a PowerShell paste.
Investigation: the files were clean UTF-8 — the artifact was the owner's PowerShell console
rendering UTF-8 bytes under a non-UTF-8 code page. This task adds a durable detection/prevention
guard so such artifacts can never be committed unnoticed.

## What changed

1. **New scanner `scripts/check-mojibake.mjs`** (Node, zero new deps). Scans git-tracked +
   untracked-but-not-ignored files under `docs/`, `src/`, `app/`, `components/`, `modules/`,
   `messages/`, `tasks/`, plus root-level `*.md`. Skips binary extensions. For each file:
   - Decodes as UTF-8 with `TextDecoder({ fatal: true })` — a decode failure is reported as
     "Not valid UTF-8" (distinct message from a mojibake hit).
   - Scans line-by-line for an ordered signature list (most-specific-first, with overlap-masking
     to avoid double-counting): `�` (U+FFFD), `Ô£à`, `ÔåÆ`, `ÔÇö`, `ÔÇô`, `ÔÇª`, `â€"`, `â€“`, `â€™`,
     `â€œ`, `â€` (generic), `Ã©`, `Ã¨`, `Ã¼`, `Ã¶`, `Ã¤` — each reported as `path:line:col` +
     10-char-context snippet + a one-line remediation hint.
   - Path-scoped allowlist (`scripts/mojibake-allowlist.json`) skips hits in files that
     intentionally quote these artifacts as documentation.
   - Exit 0 when clean (`check:mojibake: 0 artifacts in N files`); exit 1 + summary on any
     non-allowlisted hit or invalid-UTF-8 file.

2. **`scripts/mojibake-allowlist.json`** — new JSON array of path globs, seeded with:
   - `tasks/kickoff_prompt_Task_428_mojibake_encoding_guard.md` (the kickoff itself quotes the
     artifacts as examples — confirmed present in that file).
   - `docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md` (per kickoff instruction; a
     new "Appendix: encoding-artifact reference (Task 428)" section was added to that file with
     literal examples, so the allowlist entry is load-bearing — see AC 3 below).
   - `docs/qa-rules.md` (the new "Encoding hygiene" docs note below quotes the artifacts).
   - `docs/backlog.md` (the Task 428 backlog entry already quoted the artifact list from this
     kickoff's origin description — discovered as a real hit on the first clean-tree run, added
     to keep the baseline run green).
   - `docs/sessions/2026-06-15-task428-mojibake-encoding-guard.md` (this log itself — it quotes
     the signature list and the AC2/AC3 transcripts verbatim, which trip the scanner; discovered
     on the run after writing this file, added for the same reason as `backlog.md` above).

3. **`package.json`** — added `"check:mojibake": "node scripts/check-mojibake.mjs"` alongside the
   other `check:*` scripts.

4. **`.github/workflows/governance-pr.yml`** — added a blocking step "Mojibake / encoding artifact
   gate (UTF-8 double-encoding, U+FFFD)" running `npm run check:mojibake`, placed directly after
   the existing "File integrity gate" step in the `governance` job (same job pattern as
   `check:i18n-dynamic`, Task 323).

5. **Native pre-commit:** no pre-commit hook exists in this repo (`.git/hooks/` contains only
   `.sample` files — confirmed before writing). Per the kickoff's fallback instruction, documented
   the manual invocation in `docs/qa-rules.md` instead of wiring a hook that doesn't exist.

6. **`docs/qa-rules.md`** — new "### Encoding hygiene (UTF-8, mojibake gate — Task 428)" section
   (inserted after "Before Every Commit"): states repo text is UTF-8 no-BOM, documents
   `check:mojibake`'s scope and CI-blocking status, the "no native pre-commit hook" fact + manual
   invocation, what the gate catches (with literal examples), the allowlist mechanism, and the
   prevention guidance (PowerShell `chcp 65001` / `[Console]::OutputEncoding`, never redirect
   console output into a repo file, editors save UTF-8 no-BOM).

7. **`docs/agent-contract.md` clause 14** — added one cross-ref bullet at the end of the clause:
   "Companion gate — mojibake/double-encoding (Task 428, 2026-06-15)" pointing to
   `scripts/check-mojibake.mjs` / `docs/qa-rules.md` → "Encoding hygiene", noting it is a distinct
   corruption mode from clause 14's NUL/BOM/truncation checks.

No product/runtime code, locale, or other gate changed. `→`, `✅`, `—`, `🔴` etc. remain valid UTF-8
in existing docs and are untouched.

## Positive flow (happy path)

`npm run check:mojibake` on the current tree → scans 1186 tracked text files under the scanned
roots → 0 non-allowlisted artifacts → prints `check:mojibake: 0 artifacts in 1186 files` → exit 0.
See "Final clean" transcript below.

## Negative flow (every off-happy-path branch)

- **Planted artifact** (`Ô£à` in a throwaway `docs/_mojibake_planted_test.md`): scanner printed
  `docs/_mojibake_planted_test.md:1:25  CP1252-of-UTF-8 for "✅" ...` + remediation hint, exit 1.
  File removed immediately after the test (not part of the diff). See "AC2" transcript below.
- **Replacement char `�`**: covered by the same signature list (first entry); demonstrated via the
  AC3 transcript (line 117 of the Task 426 log appendix).
- **Non-UTF-8 file**: `TextDecoder({fatal:true})` throws → reported as
  `Not valid UTF-8 — file must be re-saved as UTF-8 (no BOM)`, a message distinct from a mojibake
  hit (not separately demonstrated — no such file exists in the clean tree to plant against
  without risking a real corrupted commit; the code path is straightforward and covered by the
  `catch` branch in `scanFile`).
- **Allowlisted doc** (Task 426 log): with the allowlist entry present, 0 hits reported for that
  file (part of "Final clean"). Removing the entry makes the gate FAIL on exactly that file with 5
  hits (the appendix added in this task) — see "AC3" transcript below. Proves the allowlist is
  real, not a no-op.
- **No matching files / empty set**: not applicable here (the scanned roots are never empty in
  this repo), but the loop body is a no-op for an empty `files` array and `total === 0` still
  triggers exit 0 — covered by code inspection.
- **Binary file**: `BINARY_EXTS` (png/jpg/svg/woff/pdf/zip/mp4/.../`.map`/`.lock`) are skipped by
  `shouldScan` before any read — e.g. `messages/` and `docs/` contain no binaries in this repo, but
  any future asset under the scanned roots with these extensions is skipped.

## Acceptance criteria — self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `scripts/check-mojibake.mjs` exists, runs via node, valid (`node --check` passes, 0 NUL, no BOM) | ✅ | `node --check scripts/check-mojibake.mjs` → OK; `node -e` byte scan → NUL=0, BOM=false |
| 2 | `npm run check:mojibake` exits 0 on clean tree; exits 1 on planted `Ô£à` (green + failing transcripts) | ✅ | "Final clean" (exit 0, `0 artifacts in 1186 files`) + "AC2" (exit 1, `docs/_mojibake_planted_test.md:1:25 ... CP1252-of-UTF-8 for "✅"`) below |
| 3 | Allowlist present; removing Task 426-log entry makes the gate FAIL on that file; with entry present, tree is clean | ✅ | "AC3" transcript (exit 1, 5 hits on `docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:113-117`) + "Final clean" after restore (exit 0) |
| 4 | Blocking CI step added (YAML diff shown); pre-commit wired or documented | ✅ | `.github/workflows/governance-pr.yml` diff below; no pre-commit hook exists (`.git/hooks/` = `.sample` only) → documented manual invocation in `docs/qa-rules.md` "Encoding hygiene" |
| 5 | Docs note in `docs/qa-rules.md` + clause-14 cross-ref; i18n = N/A, responsive = N/A (stated) | ✅ | `docs/qa-rules.md` "Encoding hygiene (UTF-8, mojibake gate — Task 428)"; `docs/agent-contract.md` clause 14 companion-gate bullet. **i18n: N/A** — no user-facing UI string added. **Responsive matrix: N/A** — no rendered surface touched. |
| 6 | File-integrity green on every touched file; backlog + session log + Files Changed table; no git emitted | ✅ | integrity transcript below; this log + `docs/backlog.md` updated; no `git add`/`git commit` run |

## Transcripts

### Final clean (positive flow)

```
check:mojibake — scanning 1187 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake: 0 artifacts in 1187 files
```
Exit code: 0 (1187 = 1186 + this session log itself, added to the allowlist after it was written —
see "What changed" item 2 above)

### AC2 — planted artifact (negative flow)

```
check:mojibake FAILED — 1 artifact(s), 0 invalid-UTF-8 file(s):

  docs/_mojibake_planted_test.md
    docs/_mojibake_planted_test.md:1:25  CP1252-of-UTF-8 for "✅"  "... artifact Ô£à here..."
      -> Re-encode as UTF-8 (intended: ✅ U+2705).

  Remediation: re-save the offending file as UTF-8 (no BOM). If the artifact is
  intentional documentation, add the path to scripts/mojibake-allowlist.json.
  Rule: docs/agent-contract.md clause 14, docs/qa-rules.md -> "Encoding hygiene"
```
Exit code: 1. The throwaway file was removed immediately after; not part of the diff.

### AC3 — allowlist removal (negative flow)

```
check:mojibake — scanning 1186 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake FAILED — 5 artifact(s), 0 invalid-UTF-8 file(s):

  docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:113:4  CP1252-of-UTF-8 for "✅"  "...- `Ô£à` is UTF-8..."
      -> Re-encode as UTF-8 (intended: ✅ U+2705).
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:114:4  CP1252-of-UTF-8 for "→"  "...- `ÔåÆ` is UTF-8..."
      -> Re-encode as UTF-8 (intended: → U+2192).
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:115:4  CP1252-of-UTF-8 for "—"  "...- `ÔÇö` is UTF-8..."
      -> Re-encode as UTF-8 (intended: — U+2014 em dash).
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:116:4  CP1252-of-UTF-8 for "–" (en dash)  "...- `â€“` is UTF-8..."
      -> Re-encode as UTF-8 (intended: – U+2013).
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:117:4  U+FFFD replacement character  "...- `�` is the U..."
      -> Lossy decode — re-save the file as UTF-8 from the original source.
```
Exit code: 1. The allowlist entry was restored immediately after; `scripts/mojibake-allowlist.json`
in the diff contains the entry (verified by the "Final clean" re-run afterward, exit 0).

### File-integrity transcript (all touched files)

```
🔍  check:file-integrity — 7 explicit file(s) (--files)
    Checking 7 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation

✅  check:file-integrity PASSED — all 7 file(s) clean
```
Files checked: `scripts/check-mojibake.mjs`, `scripts/mojibake-allowlist.json`, `package.json`,
`.github/workflows/governance-pr.yml`, `docs/qa-rules.md`, `docs/agent-contract.md`,
`docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md`.

### CI workflow diff (`.github/workflows/governance-pr.yml`)

```diff
       - name: File integrity gate (NUL bytes, BOM, parse errors, truncation)
         run: npm run check:file-integrity:all

+      - name: Mojibake / encoding artifact gate (UTF-8 double-encoding, U+FFFD)
+        run: npm run check:mojibake
+
       - name: Story coverage gate (fail-on-new; exemption allowlist)
```

## Self-validation

`tsc --noEmit` / `npm run build` / `screenshots:assert`: **N/A** — no `.ts`/`.tsx`/source-component
file changed (only `.mjs`, `.json`, `.yml`, `.md`). `node --check` on the new `.mjs` passes;
`JSON.parse` on the new `.json` and `package.json` passes (verified above).

**Self-validation: tsc=N/A (no ts/tsx changed) · check:mojibake=0 artifacts (clean) /
exit 1 on planted artifact + exit 1 on allowlist-removal (both demonstrated and reverted) ·
file-integrity=all 7 touched files clean · AC table = all green · i18n=N/A (no UI string) ·
responsive=N/A (no rendered surface) · scope=clean (7 files)**

## Files Changed

| Path | Rationale |
|------|-----------|
| `scripts/check-mojibake.mjs` | New mojibake/double-encoding scanner (Task 428 core deliverable). |
| `scripts/mojibake-allowlist.json` | New path-scoped allowlist for docs that legitimately quote mojibake examples. |
| `package.json` | Added `"check:mojibake"` script. |
| `.github/workflows/governance-pr.yml` | Added blocking `check:mojibake` CI step after the file-integrity gate. |
| `docs/qa-rules.md` | New "Encoding hygiene (UTF-8, mojibake gate — Task 428)" section: gate scope, no-pre-commit-hook note + manual invocation, prevention guidance. |
| `docs/agent-contract.md` | Clause 14: added a one-line "Companion gate — mojibake/double-encoding (Task 428)" cross-ref. |
| `docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md` | Added "Appendix: encoding-artifact reference (Task 428)" with literal mojibake examples, making its `mojibake-allowlist.json` entry load-bearing (AC 3 demo). |
| `docs/sessions/2026-06-15-task428-mojibake-encoding-guard.md` | This session log. |
| `docs/backlog.md` | Task 428 entry updated to done/pending-review. |

Executor does not emit `git add`/`git commit` — orchestrator reviews the diff and emits
explicit-path commit commands at review (single-writer rule).
