# Kickoff prompt — Task 169 (Sprint 6 — drop two redundant git stashes)

> Two stashes linger from the 2026-05-22 git-index-corruption incident. The orchestrator inspected
> both read-only and found them redundant — but the executor must **re-verify before dropping**,
> because `git stash drop` is irreversible.
>
> - `stash@{0}` ("WIP on main: b94dcc312") — **no tracked changes** at all; its only untracked
>   content is `docs/sessions/2026-05-22-post-deploy-verification.md`, which already exists in the
>   working tree (and should be committed). → redundant.
> - `stash@{1}` ("Future kickoff prompts Tasks 160-162") — only untracked content is
>   `tasks/Epics/Epic_C_kickoff_prompt_Task_160.md`, `Epic_D_kickoff_prompt_Task_161.md`,
>   `Epic_E_kickoff_prompt_Task_162.md`, all of which are **already committed** in the repo (those
>   tasks are DONE). → obsolete.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract:
- Do NOT change scope; introduce NO new architecture. If verification does NOT match the
  expectation below, STOP and report — do NOT drop anything.
- Execute the acceptance criteria LITERALLY.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-169-stash-triage.md.
- Commit + push (the session-log + backlog update). Stage with a SINGLE `git add -A`
  (no `^`/backtick continuations — they silently no-op in PowerShell). After committing run
  `git log -1` and paste the real output.
- Git-safety context (docs/orchestrator-role.md → "Environment & git safety"): you run git from the
  single Windows side. Ensure no other git process (Cowork sandbox, second terminal) is active
  while you operate on stashes.

Pre-read / re-verify (READ-ONLY first — do NOT drop until all checks pass):
1. `git stash list` → confirm exactly two: stash@{0} (WIP) and stash@{1} (Future kickoff prompts).
2. stash@{0} holds nothing unique:
   - `git diff --stat stash@{0}^1 stash@{0}` → MUST be empty (no tracked changes).
   - `git show --stat stash@{0}^3` → MUST list only docs/sessions/2026-05-22-post-deploy-verification.md.
   - Confirm that file currently exists in the working tree OR at HEAD
     (`git cat-file -e HEAD:docs/sessions/2026-05-22-post-deploy-verification.md` OR it is present
     on disk). If it is NOT present anywhere, STOP — it would be lost.
3. stash@{1} holds nothing unique:
   - `git diff --stat stash@{1}^1 stash@{1}` → MUST be empty (no tracked changes).
   - `git show --stat stash@{1}^3` → MUST list only the three Task_160/161/162 kickoff files.
   - Confirm all three exist at HEAD:
     `git cat-file -e HEAD:tasks/Epics/Epic_C_kickoff_prompt_Task_160.md` (and 161/162). All must exist.

Scope:
If — and only if — every check above passes, drop both stashes:
  git stash drop stash@{0}
  git stash drop stash@{1}
Then confirm `git stash list` is empty.
If any check fails (a stash contains tracked changes, or a file that is NOT already in tree/HEAD),
STOP, drop nothing, and report exactly what differs.

Acceptance criteria:
- After the task, `git stash list` is empty (both dropped) — OR, if a check failed, nothing was
  dropped and the discrepancy is reported.
- No file unique to a stash was lost (every stashed file verified present in tree/HEAD first).
- backlog + session log updated; commit pushed; `git log -1` pasted.

Out of scope:
- Epic I.3 (status-helper API evolution) — deferred, separate decision.
- Any code or content change beyond the backlog + session log.
```
