# Task 318 — Validation Addendum (pre-commit hygiene, NOT a rework)

> **Status:** Task 318 audit is **substantively APPROVED** by the orchestrator. This addendum closes
> two governance tails before the commit is emitted. It is a small validation pass — **no product code,
> no change to the audit's findings, no change to the report's substance.**
>
> Parent kickoff: `tasks/Epics/Epic_II_kickoff_prompt_Task_318.md`
> Session log to amend: `docs/sessions/2026-06-13-task318-notification-locale-audit.md`

## Why this addendum exists

On review the orchestrator found:

1. **Clause 14 transcript is incomplete.** The session log §5 pastes the file-integrity transcript for
   only **2** of the **5** touched files (`governance-reports/2026-06-13-notification-locale-audit.md`,
   `i18n-rules.md`). The "Files Changed" table lists **5** touched files. Clause 14 requires the green
   integrity transcript for **every** touched file.
2. **`docs/backlog-archive.md` is outside the parent kickoff's explicit file allowlist** (which named
   `docs/governance-reports/**`, `docs/i18n-rules.md`, `docs/backlog.md`, `docs/sessions/**`). It was
   touched for the Task 423 backlog-tidy. This is almost certainly the **owner backlog-tidy P0
   (2026-06-12)** at work — that standing rule *requires* moving the prior session row into the archive —
   so it is a sanctioned change, but it must be **logged explicitly** as the backlog-tidy exception rather
   than left implicit.

> ⚠️ **Sandbox screen note (for context, not a defect claim):** the orchestrator's Cowork sandbox read of
> `docs/backlog.md` returned **1245 NUL bytes + an empty tail**, and `git status` failed with a phantom
> object (`1c6fbabc00…`) over a 25-file over-dirty tree. The Read tool returned the *same* `backlog.md`
> fully intact. Per agent-contract clause 14 + orchestrator-role "Sandbox-corruption screen", this is a
> **mount artifact, not a verdict** — the authoritative Clause-14 run is the **owner's native PowerShell**
> pass below, not Sonnet's sandbox run. Sonnet should still paste its sandbox transcript, but if Sonnet's
> sandbox shows NUL/truncation on `backlog.md`, that is expected mount noise — **do not "fix" the file**;
> flag it and let the owner's native run be ground truth.

## Scope — do ONLY this

1. **Complete the Clause 14 file-integrity transcript** in session-log §5 for the **three** currently
   un-transcripted touched files:
   - `docs/backlog.md`
   - `docs/backlog-archive.md`
   - `docs/sessions/2026-06-13-task318-notification-locale-audit.md`
   For each: `tr -cd '\000' < <file> | wc -c` (expect `0`), BOM check (`head -c3 | od -An -tx1` ≠ `ef bb bf`),
   `wc -l`, and a `tail -c` excerpt proving the intended final line is present. Paste the full green
   transcript. (The 2 existing entries stay as-is.)
2. **Log the `backlog-archive.md` exception explicitly:** add one line to the session log stating that
   `docs/backlog-archive.md` was changed under the **owner backlog-tidy P0 (2026-06-12)** to archive the
   Task 423 row, and is therefore an authorized addition to the parent kickoff's file allowlist (not scope
   creep).
3. **Reconfirm `git diff --stat src` is EMPTY** and paste the (empty, exit-0) result.

## Hard constraints

- **ZERO production code.** No `src/`, `messages/`, `package.json`, no migrations. `git diff --stat src`
  stays empty.
- **Do not alter the audit's findings or the report body** (`governance-reports/2026-06-13-notification-locale-audit.md`).
  This addendum only *amends the session log* with the missing transcript + the one exception line.
- **No git commands from Sonnet** (single-writer). Update the "Files Changed" rationale only if the session
  log itself changed (it will — note it as an in-place amendment, same file already listed).
- Do **not** touch `docs/backlog.md` content again unless the owner's native Clause-14 run reports real
  (native, reproduced) corruption — in which case STOP and ASK.

## Acceptance criteria

- Session-log §5 contains a green Clause-14 transcript for **all 5** touched files (NUL=0, no BOM, intact tail).
- Session log contains the explicit `backlog-archive.md` backlog-tidy-exception line.
- `git diff --stat src` re-confirmed empty (pasted).
- Clauses 11/12/13 remain N/A (no UI). Clause 14 now complete for every touched file.
- No new files, no product code, audit substance unchanged.

## Owner native verification (ground truth — run in PowerShell, NOT in the sandbox)

```powershell
cd C:\Claude_Code_Projects\lero-al
git rev-parse HEAD
git status
git diff --stat -- src
$files = @(
  'docs/governance-reports/2026-06-13-notification-locale-audit.md',
  'docs/i18n-rules.md',
  'docs/backlog.md',
  'docs/backlog-archive.md',
  'docs/sessions/2026-06-13-task318-notification-locale-audit.md'
)
foreach ($f in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($f)
  $nul = ($bytes | Where-Object { $_ -eq 0 }).Count
  $bom = if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {'BOM'} else {'no-BOM'}
  "{0,-70} NUL={1} {2} bytes={3}" -f $f, $nul, $bom, $bytes.Length
}
```

Expected: `git status` clean apart from the Task-318 docs; `git diff --stat -- src` empty; every file `NUL=0`,
`no-BOM`. If native confirms clean → the sandbox NUL/phantom-git reads were mount artifacts and the
orchestrator emits the commit. If native reproduces corruption on any file → that file is a real Clause-14
defect → Sonnet re-writes it (and, for a phantom `.git/index`: `Remove-Item .git\index -ErrorAction
SilentlyContinue; git reset`).
