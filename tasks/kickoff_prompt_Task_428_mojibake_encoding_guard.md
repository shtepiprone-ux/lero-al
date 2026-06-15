# Task 428 — Mojibake / UTF-8 encoding guard (governance + tooling)

**Type:** governance/tooling (CI gate + native pre-commit + docs). NOT product code.
**Priority:** medium (data-integrity guard; prevents corrupted text landing in the repo).
**Executor:** Sonnet 4.6. **Single-writer git:** do NOT emit `git add`/`git commit`; the orchestrator emits commit commands at review.

## Pre-read (rule-index: docs-only/governance + tooling)

- `docs/agent-contract.md` (P0 clauses, esp. clause 14 file-integrity).
- `docs/backlog.md`.
- `docs/orchestrator-role.md` (review checklist).
- `docs/ai-behavior.md` → "Pre-Completion Self-Validation (Note 18)".
- `docs/qa-rules.md` (where the gate is documented).
- `scripts/check-file-integrity.mjs` if it exists (Task 400) — for style/wiring consistency; do NOT rewrite it.
- `.github/workflows/governance-pr.yml` (or the repo's governance CI workflow) — for where to add the blocking step.

## Origin

2026-06-15: the owner saw mojibake (`Ô£à`→✅, `ÔåÆ`→→, `ÔÇö`→—) in a PowerShell paste. Investigation: the **files were clean UTF-8** (the Read tool decoded them correctly); the artifacts were the owner's PowerShell **console** rendering UTF-8 bytes under a non-UTF-8 code page. Risk is real, though: if console output is ever redirected/pasted into a repo file (`git show > file`, copy-paste), or an editor saves as CP1252, the mojibake gets baked in. This task adds a durable guard so such artifacts can never be committed unnoticed, plus prevention guidance.

## Current behavior to preserve

- All existing governance gates (`check:stories`, `check:i18n`, `check:i18n-dynamic`, file-integrity) keep working unchanged.
- Existing CI workflow steps and the native pre-commit hook keep running; the new step is ADDED, none removed or reordered destructively.
- Repo docs legitimately contain example mojibake strings for documentation (this kickoff, `docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md`, and the new docs note). These MUST NOT trip the gate (allowlist).

## Required after behavior

1. **New scanner `scripts/check-mojibake.mjs`** (Node, zero new deps):
   - Recursively scans tracked text files under: `docs/**`, `src/**`, `app/**`, `components/**`, `modules/**`, `messages/**`, `tasks/**`, and root `*.md`. Skips `node_modules`, `.git`, `.next`, build output, and binary files (detect by null-byte / non-text extension).
   - Flags, with `path:line:col` + the offending snippet + a one-line remediation hint, any of these double-encoding / corruption signatures:
     - U+FFFD replacement char `�`.
     - CP1252-of-UTF-8 sequences beginning `Ã`, `Â`, `â€`, `Ô`, `Ð`, `Ñ` that decode to known artifacts — at minimum: `Ô£à`, `ÔåÆ`, `ÔÇö`, `ÔÇô`, `ÔÇª`, `â€"`, `â€“`, `â€™`, `â€œ`, `â€`, `Ã©`, `Ã¨`, `Ã¼`, `Ã¶`, `Ã¤`, `Ã©`. Implement as a maintainable signature list, not a single unreadable regex.
   - Reads every file as UTF-8; a file that is not valid UTF-8 is itself a failure (report it).
   - **Allowlist:** a small JSON/array (e.g. `scripts/mojibake-allowlist.json`) of path globs whose mojibake is intentional documentation. Seed it with this kickoff, the Task 426 session log, and the new docs note. The allowlist is path-scoped, not a blanket disable.
   - Exit 0 when clean, exit 1 (non-zero) on any non-allowlisted hit; print a summary count.
2. **`package.json`:** add `"check:mojibake": "node scripts/check-mojibake.mjs"`.
3. **CI:** add `npm run check:mojibake` as a **blocking** step in the governance workflow (same job pattern as `check:i18n-dynamic`, Task 323).
4. **Native pre-commit:** wire `check:mojibake` into the existing native pre-commit hook alongside `check-file-integrity` if such a hook exists; if not, document the manual invocation in `docs/qa-rules.md`.
5. **Docs note** (in `docs/qa-rules.md`, cross-referenced from `agent-contract.md` clause 14): repo text is UTF-8 (no BOM); the owner's PowerShell MUST run UTF-8 (`chcp 65001` and/or `$OutputEncoding`/`[Console]::OutputEncoding` = UTF-8, or PowerShell 7); **never redirect console output into a repo file** (`git show`/`Get-Content` piped to `>` adopts the console code page and corrupts non-ASCII); editors save UTF-8 no-BOM.

## Positive flow (happy path)

Actor: CI / dev / owner pre-commit. Steps: run `npm run check:mojibake` → scanner walks the tracked text set → no non-allowlisted artifact found → prints `check:mojibake: 0 artifacts in N files` → exits 0 → CI step green / commit proceeds. Post-condition: no repo state change; gate recorded green in the transcript.

## Negative flow (every off-happy-path branch)

- **Planted artifact** (a file contains `Ô£à`): scanner prints `path:line:col` + snippet + hint, exits 1 → CI fails / pre-commit blocks the commit. Recovery: dev re-saves the file as UTF-8 / removes the artifact, re-runs.
- **Replacement char `�`** present: flagged identically.
- **Non-UTF-8 file** encountered: reported as an encoding failure (exit 1), distinct message from a mojibake hit.
- **Allowlisted doc** that legitimately quotes mojibake (this kickoff / Task 426 log / docs note): NOT flagged — proves the allowlist works. Add a negative-flow transcript showing the gate FAILS when the allowlist entry is removed (proves the gate is real, not a no-op).
- **No matching files / empty set:** exit 0, count 0 (no false failure).
- **Binary file** in a scanned dir: skipped, not parsed as text.

## Acceptance criteria

1. `scripts/check-mojibake.mjs` exists, runs via `node`, valid (`node --check` passes, 0 NUL, no BOM). → file:line.
2. `npm run check:mojibake` exits 0 on the current clean tree; exits 1 on a planted `Ô£à` (paste the green AND the failing transcript — Positive flow + Negative "planted artifact" branch).
3. Allowlist mechanism present; removing the Task 426-log allowlist entry makes the gate FAIL on that file (Negative "allowlisted doc" branch transcript). With the entry present, the tree is clean.
4. Blocking CI step added to the governance workflow (show the YAML diff). Pre-commit wired or documented.
5. Docs note added to `docs/qa-rules.md` (+ clause-14 cross-ref): UTF-8 console requirement + no-redirect-into-repo rule + editor UTF-8 no-BOM. No user-facing UI strings → **i18n: N/A**; no rendered surface → **responsive matrix: N/A** (state both explicitly with reasoning).
6. File-integrity green on every touched file (clause 14 transcript). `docs/backlog.md` + a `docs/sessions/` log added with a Files Changed table. No `git add`/`git commit` emitted by the executor.

## Out of scope

Do NOT mass-rewrite existing docs to strip legitimate UTF-8 (→, ✅, —, 🔴 are valid and stay). Do NOT change any product/runtime code, locales, or other gates. This is detection + prevention only.
