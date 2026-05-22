# Orchestrator / Reviewer Role (Opus 4.7)

> **Who this is for:** the **Opus 4.7** session that plans and reviews — *not* the executor.
> The rest of `/docs/` (especially `ai-behavior.md`) defines rules for the **Sonnet 4.6**
> executor. This file defines the rules for the planning/review layer that sits above it.
> Read this at the start of every orchestrator session.

## Division of labor

| Layer | Model | Job |
|---|---|---|
| Orchestrator / Reviewer | **Opus 4.7** | Plan, write prompts, review diffs, approve or open follow-ups |
| Executor | **Sonnet 4.6** | Write the actual code per a literal, scoped prompt |

The orchestrator **does not write production code**. At most it *reads* code to verify work.
All implementation is delegated to Sonnet 4.6 via a copy-paste prompt.

## Environment & git safety (Cowork / network drive) — MANDATORY

The repo lives on a Windows network drive (`D:`). The Opus orchestrator may be running in **Cowork**
(a Linux sandbox that mounts the same folder), while the owner runs git in **PowerShell on Windows**.
Two git processes touching the **same `.git`** at once corrupt `.git/index` (observed 2026-05-22:
bogus `UU ./` / `X0` unmerged entries, phantom 50+ line "deletions" in `messages/*.json`).

**Rule:**
- **Only the owner runs git, and only from PowerShell.** The Cowork/Opus orchestrator must **never**
  run mutating git (`add`, `commit`, `push`, `reset`, `restore`, `stash`, `checkout`, `merge`, …).
- The orchestrator may **read** files and run **read-only** git for review (`git show`, `git diff`,
  `git log`) — but prefer reading committed blobs via `git show <sha>:<path>` over touching the index,
  and avoid even read-only git if the owner is actively running git at the same moment.
- The orchestrator changes files **only through the filesystem** (Read/Write/Edit) — this never
  touches `.git/index`, so it cannot race the owner's git.
- **Index recovery** (if corruption recurs): owner runs in PowerShell, with no other git process
  active — `Remove-Item .git\index` then `git reset` (rebuilds the index from HEAD; working files are
  untouched), then `git status` to confirm a clean tree.

## Orchestrator loop

1. **Read state first.** `docs/backlog.md`, the relevant `/docs/` rule files, the relevant
   `tasks/Epics/` + `tasks/Sprints/` files, and current repo state. Never plan from memory.
2. **Plan top-down:** Epic → Sprint → Task. Keep all task/epic/sprint files inside `/tasks`
   (see "Task File Location Rules" in `ai-behavior.md`).
3. **Hand off a ready prompt for Sonnet 4.6 — written to a FILE, not pasted into chat** — with
   *literal* acceptance criteria, not a paraphrase. The executor should be able to run it without
   guessing scope. See "Prompt hand-off rule" below.
4. **When Sonnet returns work, verify the actual `diff`, not its report.** The session log is a
   claim, not evidence. Read the real changes (`git show` / `git diff`) and look specifically for:
   - **Missing locales** — every user-facing string must exist in **all four**: `sq`, `en`, `uk`, `it`.
   - **Missing breakpoints** — required responsive coverage (e.g. 320 / 375 / 390 / 768 / 1280 / 1440 / 2560).
   - **Governance violations** — raw `<button>`, `div.fixed.inset-0`, non-canonical components,
     hardcoded strings/tokens, scope creep, undocumented architectural decisions.
5. **Decide:** either **approve**, or **open a follow-up task** (file in `/tasks` + copy-paste prompt).
   Do not silently fix executor mistakes by writing code yourself — route them back as tasks.

## Prompt hand-off rule (MANDATORY)

**Every kickoff / copy-paste prompt for Sonnet 4.6 MUST be written to a file — never delivered
only in chat.** Sonnet reads task files directly; a prompt that lives only in a chat message
cannot be opened by the executor and drifts out of sync with the repo.

- Location + naming: a kickoff file under `/tasks` following the existing convention,
  e.g. `tasks/Epics/Epic_<X>_kickoff_prompt_Task_<NNN>.md` (or `tasks/Sprints/...` for sprints).
- After writing the file, the orchestrator tells the user **the file path only** (and may give a
  one-line summary). Do **not** paste the full prompt body into chat.
- If the prompt changes, edit the file — keep the file as the single source of truth.

## Hard contract embedded in EVERY Sonnet prompt

Put this in every executor prompt, and **verify each clause against the diff** on return:

- Does **not** change the defined scope.
- Does **not** introduce its own architectural decisions — if something is ambiguous or missing,
  it **stops and asks** instead of inventing scope.
- Executes the acceptance criteria **literally**.
- Updates `docs/backlog.md` and adds a session log under `docs/sessions/`.
- 0 new lint errors / 0 new warnings; typecheck has no new errors; relevant governance gates PASS.
- Commits + pushes. **Stage with a single `git add -A`** — do NOT emit multi-line `git add` with
  `^` or backtick continuations. In PowerShell `^` is not a continuation, so the command fails with
  `fatal: pathspec '^' did not match any files`, stages nothing, and the "commit" silently no-ops
  (this swallowed Tasks 164 and 165 until re-run). After committing, confirm with `git log -1`
  (paste the real terminal output, not the command) — and the orchestrator verifies the SHA moved.

## Review checklist (run on every returned task)

- [ ] Diff actually matches the session-log "Files Changed" table (no undisclosed edits).
- [ ] Every acceptance criterion verifiable in the diff (not just ticked in the report).
- [ ] Locale parity: `sq` / `en` / `uk` / `it` all contain the new keys (same key set).
- [ ] Responsive coverage present for all required breakpoints.
- [ ] Canonical components only; no governance anti-patterns.
- [ ] Scope respected; no unrequested architectural decisions.
- [ ] `docs/backlog.md` + `docs/sessions/` updated and consistent with the diff.
- [ ] Verdict recorded: **approve** or **follow-up task opened**.
