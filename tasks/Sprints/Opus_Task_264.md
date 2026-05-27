# Task 264 — Move commit-emission from Sonnet to Orchestrator

Type:        chore / governance
Priority:    high (workflow safety)
Area:        AI governance / commit workflow
Filed by:    Owner (shtepiprone@gmail.com) directive on 2026-05-27, after observing two failure modes in Sonnet-emitted commit commands today.
Sprint:      ad-hoc governance (between Sprint 13 and Sprint 14)

## Pre-read

1. `docs/agent-contract.md` (P0 contract — specifically clause 10)
2. `docs/orchestrator-role.md` ("Hard contract embedded in EVERY Sonnet prompt" section + "Review checklist")
3. `docs/ai-behavior.md` ("Commit Rules" + "Canonical Task Template" + the AC bullet about commit commands + the "DO NOT" rule about omitting commit commands)
4. `CLAUDE.md` ("Commit hand-off" warning block)
5. `docs/backlog.md` (Last Session + Pending Action Items — to confirm this task is a docs-only governance change)

## Problem statement (verbatim observation 2026-05-27)

Today's Sprint 12 + Sprint 13 review surfaced two reliable failure modes in **Sonnet-emitted** commit commands:

1. **"Filed list" ≠ "diff"** — Sonnet enumerates the files it touched by recollection at the end of a task, but after dozens of Edit-tool calls its claim diverges from the actual `git diff`. Today's commit `4541a2496` ("docs: add task 261-263 planning files") shipped only 3 docs files; the Task 261 code changes (`src/components/ui/button.tsx`, `src/components/ui/select.tsx`) were silently omitted from the staged set and never reached production HEAD.

2. **`git add -A` / wildcard staging** — Sonnet occasionally proposes `git add -u` or `git add -A` to "make sure nothing is missed". On the Cowork sandbox + Windows network drive, the working tree often shows 20–60 phantom-modified files (the corruption mode `docs/orchestrator-role.md` already warns about). A wildcard `add` then sweeps the phantom files into the commit, polluting history.

The orchestrator (Opus 4.7) already reviews each task's real `git diff` post-hoc via `git show <SHA>:<path>`. By the time the orchestrator approves, it has the authoritative file list. Moving commit-command emission from Sonnet to the orchestrator eliminates both failure modes by design.

## Goal

Single change to the contract: **the orchestrator owns commit-command emission**. Sonnet no longer emits `git add` / `git commit` lines; instead Sonnet's session log must include a "Files Changed" table listing every path it touched (already common practice, now formally required). The orchestrator reads the real diff, validates the table matches, then emits explicit-path commit commands.

Single-writer rule is preserved: Sonnet still never runs git itself. Only the owner runs git, only in PowerShell, only commands explicitly emitted by the orchestrator.

## Current behavior to preserve

- Single-writer git rule (`docs/orchestrator-role.md` → "Environment & git safety"): unchanged. Only owner runs git from PowerShell.
- Sonnet does NOT run git itself: unchanged.
- One logical change per commit; conventional-commit prefixes (`feat:` / `fix:` / `chore:` / `docs:` / `refactor:`): unchanged.
- Session log + backlog update requirement: unchanged.
- Note 18 self-validation block: unchanged.
- The "deploy" workflow rule in `docs/ai-behavior.md` (line 258 area) where the executor prepares the branch and emits push/merge commands: PRESERVED for now (deploy is a special-case workflow on owner instruction, not a per-task event; can be revisited later if the same failure mode appears).

## Required after behavior

**For Sonnet (executor):**
1. After completing a task, Sonnet's session log MUST contain a "Files Changed" table with one row per touched path + a 1-line rationale per file.
2. Sonnet MUST NOT emit `git add` / `git commit` lines in its session log or final response.
3. Sonnet's task is considered "ready for orchestrator review" — not "ready to commit".
4. Sonnet's AC checklist removes the "commit commands provided" bullet; replaced with "Files Changed table present in session log".

**For the orchestrator (Opus):**
1. After reviewing the real diff (`git show <SHA>:<path>` / `git diff`), the orchestrator emits explicit-path commit commands at the end of the review response.
2. The orchestrator MUST use explicit paths (no `git add -A`, no `git add -u`, no wildcards). One `git add <p1> <p2> …` line per logical change, followed by `git commit -m "<type>(TaskN): …"`.
3. If a single batch of work covers multiple tasks, the orchestrator emits one (or more) commit per logical change — typically one commit per task, but multiple tasks may share a commit if they form a single atomic change.
4. The orchestrator's review checklist gains one item: "Commit commands emitted with explicit paths matching every file in the real diff for the approved tasks; no wildcards."

**For the owner:**
1. Owner does NOT commit immediately after each Sonnet task. Owner runs Sonnet through a batch of 1+ tasks, then pings the orchestrator for review.
2. Owner executes only the orchestrator's emitted commit commands, copy-pasted into PowerShell as-is.

## Positive flow (happy path)

- Actor: Sonnet finishes Task N → owner pings Opus for review.
- Preconditions: Sonnet has updated `docs/backlog.md` + added a session log under `docs/sessions/` + included a "Files Changed" table in the session log.
- Steps:
  1. Opus reads Sonnet's session log + the real diff (`git diff` of unstaged changes OR `git show <SHA>:<path>` for already-committed work).
  2. Opus cross-checks the "Files Changed" table against the diff (no missing files; no surprise files).
  3. Opus validates AC + Positive/Negative flow gate per `docs/agent-contract.md` clause 6a + Notes 18/19/20/21/22/23.
  4. Opus approves → emits commit commands using explicit paths:
     ```
     git add <p1> <p2> <p3> ...
     git commit -m "<type>(TaskN): <short description>"
     ```
  5. Owner pastes the commands into PowerShell; commit lands on HEAD.

## Negative flow (every off-happy-path branch)

- **"Files Changed" table missing from session log**: Opus rejects the task as INCOMPLETE; routes back to Sonnet with the missing-section feedback. The task is NOT approved; no commit commands emitted.
- **"Files Changed" table doesn't match the diff** (missing or surprise files): Opus rejects, routes back. The task is NOT approved; no commit commands emitted. Possible causes: Sonnet's recollection-error (table missing files), or Sonnet's scope creep (table has files outside the kickoff scope).
- **Sonnet emitted `git add` lines anyway (rule violation)**: Opus ignores Sonnet's commands entirely, emits its own. Opus notes the violation in the review summary so Sonnet's future tasks can be corrected.
- **Phantom-corruption in the working tree** (the same Cowork mode that bit Tasks 164/165/261): Opus's explicit-path `git add` only stages the named files; phantom-modified files are left unstaged and unaffected. Opus may include a "Run `Remove-Item .git\index; git reset` first" recovery line if `git status` shows phantom mods.
- **Owner used `git add -A` by habit**: out of orchestrator's control; document in `CLAUDE.md` that explicit-path adds are the only safe pattern on this repo.
- **Multi-task batch with one commit accidentally covering all**: Opus's review must emit ONE commit per logical change. Conflating Task X + Task Y into a single commit is allowed only when they form a single atomic change AND the message captures both (e.g. `fix(TaskX+TaskY): ...`).
- **Deploy workflow** (executor emits push/merge commands): UNCHANGED — that flow is not in scope for this task.

## Scope (files to change)

1. **`docs/agent-contract.md`** — clause 10:
   - Remove "provide ready-to-run git commit commands as plain text — the OWNER runs them in PowerShell".
   - Replace with: "List every file touched in the session log's 'Files Changed' table — the ORCHESTRATOR emits commit commands during review. The executor NEVER runs git itself (single-writer rule)."

2. **`docs/orchestrator-role.md`**:
   - "Hard contract embedded in EVERY Sonnet prompt" section — replace the "Provides ready-to-run git commit commands…" bullet with a "Lists every file touched in the session log's 'Files Changed' table…" bullet.
   - Add a NEW orchestrator-responsibility entry near "Orchestrator loop" or "Approval rule": "Emit commit commands during review using explicit paths matching the real diff; no `git add -A`, no `git add -u`, no wildcards. One commit per logical change."
   - Add one Review-checklist item: "Commit commands emitted with explicit paths matching every file in the real diff for the approved tasks; no wildcards."

3. **`docs/ai-behavior.md`**:
   - Line ~265-269 ("Commit Rules" → "After every completed task, provide ready-to-run git commit commands"): replace with "After every completed task, list every file you touched in the session log's 'Files Changed' table. Never emit `git add` / `git commit` commands yourself — the orchestrator emits them during review."
   - Line ~754-757 (Canonical Task Template AC bullet): replace the "Ready-to-run git commit commands are provided…" bullet with "A 'Files Changed' table is present in the session log, listing every touched path + 1-line rationale per file."
   - Line ~824 ("DO NOT mark a task complete without emitting ready-to-run git commit commands"): replace with "DO NOT mark a task complete without a 'Files Changed' table in the session log."
   - Line ~258 ("Deploy" workflow rule): PRESERVE as-is (deploy is special-case).

4. **`CLAUDE.md`** — "Commit hand-off" warning block (lines ~15-24):
   - Replace the Sonnet-emits-commands paragraph with: "after EVERY completed task, the Sonnet executor MUST include a 'Files Changed' table in the session log. The **ORCHESTRATOR (Opus)** reviews the real diff and emits explicit-path commit commands during review. The owner runs only the orchestrator's commands in PowerShell. The Sonnet executor NEVER emits commit commands and NEVER runs git itself."

## Acceptance criteria

- Positive flow step 4 (orchestrator emits explicit-path commands) verifiable in this task's commit commands at the end.
- Negative flow → "Files Changed table missing" path documented in `docs/orchestrator-role.md` Review checklist.
- Negative flow → phantom-corruption path documented (recovery line in `CLAUDE.md` "Commit hand-off" OR in `docs/orchestrator-role.md` "Environment & git safety").
- All four files updated per Scope items 1-4.
- `docs/backlog.md` updated: Last Session, Session Archive row for Task 264, no new Pending Action Items.
- Self-validation block in this task's section of `docs/backlog.md` Last Session OR in a session log under `docs/sessions/`.
- 0 product code changed (governance-only task; no `src/`, `app/`, `messages/`, migrations).
- No new Pending Action Items added by this task (it's a contract change, not a feature).

## Out of scope

- Changing the deploy workflow (executor still prepares push/merge commands on owner instruction).
- Changing the single-writer rule (owner is still the only git runner).
- Changing conventional-commit prefixes or message format.
- Changing the session log structure beyond adding "Files Changed" table.
- Changing how the orchestrator reviews (already documented in `docs/orchestrator-role.md` → "Review checklist" and "Approval rule").

## Required validation

- grep proof: `git add` and `git commit` no longer appear as Sonnet obligations in:
  - `docs/agent-contract.md` clause 10
  - `docs/ai-behavior.md` Commit Rules section (line ~260-270)
  - `docs/ai-behavior.md` Canonical Task Template AC (line ~754-757)
  - `docs/ai-behavior.md` "DO NOT" rules (line ~824)
  - `CLAUDE.md` Commit hand-off block (line ~15-24)
- `Files Changed` table requirement appears in all 4 files.
- `docs/orchestrator-role.md` Review checklist includes the new commit-emission item.

## Final report from Opus

After applying the edits, this task's response includes the orchestrator-emitted commit commands as a proof-of-concept of the new workflow (i.e. Task 264 is the first task whose commits are emitted by the orchestrator, not Sonnet).
