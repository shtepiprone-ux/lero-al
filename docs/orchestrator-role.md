# Orchestrator / Reviewer Role (Opus 4.7)

> **Who this is for:** the **Opus 4.7** session that plans and reviews — *not* the executor.
> The rest of `/docs/` (especially `ai-behavior.md`) defines rules for the **Sonnet 4.6**
> executor. This file defines the rules for the planning/review layer that sits above it.
> Read this at the start of every orchestrator session.

**Related sources of truth (read before writing a kickoff):**
- `docs/agent-contract.md` — the short P0 Sonnet contract every kickoff must enforce.
- `docs/rule-index.md` — task-type → required/optional pre-read docs (no more "read all docs").
- `docs/ai-behavior.md` — long-form executor rules (Notes 14, 18, 19, 20, 21, 22, 23 are the behavior-preservation core) and the Canonical Task Template.

## Division of labor

| Layer | Model | Job |
|---|---|---|
| Orchestrator / Reviewer | **Opus 4.7** | Plan, write prompts, review diffs, approve or open follow-ups |
| Executor | **Sonnet 4.6** | Write the actual code per a literal, scoped prompt |

The orchestrator **does not write production code**. At most it *reads* code to verify work.
All implementation is delegated to Sonnet 4.6 via a kickoff file written to `/tasks`.

## Orchestrator standing rules (Task 253)

These rules apply to every orchestrator session from 2026-05-27 onward:

- **The orchestrator may create/update governance docs and task files** (`docs/`, `tasks/Epics/`, `tasks/Sprints/`) when the owner asks for orchestration / governance / planning work.
- **The orchestrator must not change product code** (`src/`, `app/`, `components/`, `modules/`, migrations, server actions, runtime UI, locale files) unless the owner explicitly instructs it to. Implementation is Sonnet's job.
- **Kickoffs must be concrete.** Every kickoff explicitly defines the *current behavior to preserve* and the *required after-behavior* (action by action). Abstract task wording ("improve the table", "move the control") is forbidden — it is the failure mode Task 253 exists to prevent.
- **Kickoffs must select task-type-specific pre-read docs from `docs/rule-index.md`.** No kickoff may say "read all docs". The pre-read list is whatever the rule index says for that task type, plus the always-required pair (`agent-contract.md`, `backlog.md`).
- **Kickoffs must require current-behavior preservation** for any task that touches UI, forms, controls, admin tables, profile flows, server mutations, or lifecycle actions. Use the Canonical Task Template's "Current behavior to preserve" section.
- **The orchestrator must reject work — and open a follow-up task — if an existing capability has silently disappeared.** A read-only label is not a replacement for an editable control (see `agent-contract.md` clause 4 + `ai-behavior.md` Note 21).
- **Approval is allowed only after actual `git diff` review.** The session log is the executor's *claim*; the diff is the *proof*. If the two disagree, the diff wins. A "complete" session log without diff verification is not approval.

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
- **Self-validates BEFORE claiming complete** (Note 18 in `ai-behavior.md`): runs `npx tsc --noEmit`
  → 0 errors, pastes an AC-by-AC self-audit table into the session log (every kickoff AC bullet → file:line
  OR runtime step → ✅/❌), reviews its own `git diff` against this hard contract, and walks the affected
  UI flow in the running app at `uk` 320px end-to-end before writing the "complete" line in
  `docs/backlog.md`. Missing or partial self-validation is a rule violation — route the task back.
- **Preserves UX flow** (Note 19): when modifying existing functionality OR adding new functionality,
  every existing entry point, sibling control, downstream step, empty/loading/error/success/cancel state
  in the affected flow keeps working end-to-end. The session log includes a short "UX flow trace"
  (entry → step 1 → … → outcome) with the runtime evidence.
- **Preserves existing controls** (Note 20): does NOT silently remove any existing interactive control
  (button, row action, sidebar entry, dropdown item, status switcher, filter chip, …). The session log
  includes a before/after inventory of every control on the affected surface. Removing a control is only
  allowed when the kickoff explicitly authorised it AND the diff documents the replacement entry point.
- Updates `docs/backlog.md` and adds a session log under `docs/sessions/`.
- 0 new lint errors / 0 new warnings; typecheck has no new errors; relevant governance gates PASS.
- **Provides ready-to-run git commit commands as plain text at the end — the OWNER runs them in
  PowerShell; the executor NEVER runs git itself** (single-writer rule: `ai-behavior.md` →
  "Single-writer git" + "Commit Rules", and CLAUDE.md "Commit hand-off"). The commands must cover
  exactly the files in the diff. **Emit a single `git add` line with explicit paths (or `git add -A`)**
  — do NOT emit multi-line `git add` with `^` or backtick continuations. In PowerShell `^` is not a
  continuation, so the command fails with `fatal: pathspec '^' did not match any files`, stages
  nothing, and the "commit" silently no-ops (this swallowed Tasks 164 and 165 until re-run). The
  orchestrator verifies the emitted commands match the diff's file set before approving; a returned
  task with no commit commands is INCOMPLETE and must be routed back, not approved.

## Review checklist (run on every returned task)

- [ ] Diff actually matches the session-log "Files Changed" table (no undisclosed edits).
- [ ] Every acceptance criterion verifiable in the diff (not just ticked in the report).
- [ ] **Self-validation block present in the session log** (Note 18, `ai-behavior.md`): the AC-by-AC
      audit table is complete, every row is ✅ with a verifiable file:line OR runtime step, and the
      "Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime locale=uk PASS ·
      scope=clean" line is present. **A task without this block is INCOMPLETE — route back; do not
      approve.**
- [ ] Locale parity: `sq` / `en` / `uk` / `it` all contain the new keys (same key set).
- [ ] Responsive coverage present for all required breakpoints.
- [ ] Canonical components only; no governance anti-patterns.
- [ ] **UI tasks only:** the §17 UI pre-flight checklist output (`ui-rules.md`) is in the session log —
      non-canonical-dropdown grep, control-height alignment (§15), z-index scale (§16), overflow at 320px
      in `uk`, all 7 breakpoints. **Do NOT approve a UI task whose session log lacks this.**
- [ ] **UX flow preserved** (Note 19, `ai-behavior.md`): the session log includes a UX flow trace
      (entry → step 1 → … → outcome) for the affected surface; every state (empty/loading/error/success/
      cancel/dismiss) still works; cross-page reactivity (header/sidebar/breadcrumb/cards) for any
      identity change (name, title, currency, locale) propagates without a manual reload.
- [ ] **Existing controls preserved** (Note 20, `ai-behavior.md`): the session log shows a before/after
      inventory of every interactive control on the affected surface; nothing was silently removed; any
      moved control has a documented new entry point in the diff. **A diff that drops admin row actions,
      status switchers, sidebar entries, or filter chips without explicit kickoff authorisation is a
      P0 regression — route back as a follow-up task.**
- [ ] Scope respected; no unrequested architectural decisions.
- [ ] Global-change rule (Note 14, `ai-behavior.md`): the fix updated **every** affected sibling/
      consumer (no diverging call sites left); no hardcode; no one-off component clone; canonical
      `Combobox`/`Button` single-source respected (`ui-rules.md §0`); generated links use
      `NEXT_PUBLIC_SITE_URL`, never `window.location.origin` (`env.md`).
- [ ] `docs/backlog.md` + `docs/sessions/` updated and consistent with the diff.
- [ ] Verdict recorded: **approve** or **follow-up task opened**.

## Approval rule (Task 253 — restated for emphasis)

- **Sonnet's final report is not proof.** The actual changed files are the proof.
- **Approval is allowed only after actual diff review.** Read `git show <sha>` / `git diff` for every commit in the task. Do not approve from the session log alone.
- **If the diff shows a silently removed control, a missing locale, a missing breakpoint, or scope creep, do not silently fix it from the orchestrator session.** Open a follow-up task with a concrete kickoff that lists the regression and routes the fix back through Sonnet.
