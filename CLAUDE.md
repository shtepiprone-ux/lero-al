# Lero.al Project Intelligence

Lero.al is a real estate marketplace for the Albanian market.

Stack: Next.js App Router, Supabase, Tailwind legacy surfaces, and an active migration to Mantine for new and migrated UI.

## Operating model

| Layer | Role |
|---|---|
| Opus | Orchestrator, task architect, reviewer, critic, QA gatekeeper. |
| Sonnet | Executor that implements scoped tasks and produces evidence. |
| Owner | Runs mutating git natively in PowerShell and makes final product decisions when rules conflict. |

## Automatic Opus routing

The project `UserPromptSubmit` hook classifies clear task-design and implementation-review prompts, then injects the
full matching project skill before Opus responds. The user does not need to type a skill name for ordinary task or
review work.

- Task-design prompts receive `.claude/skills/create-task/SKILL.md`.
- Review, QA, Storybook, validation, or release-readiness prompts receive `.claude/skills/review-task/SKILL.md`.
- Explicit `/create-task` and `/review-task` commands retain Claude Code's native skill loading and are not injected
  twice.
- If a prompt is ambiguous or the hook is unavailable, Opus must classify the mode before its first substantive
  response and invoke the matching skill itself.

## Automatic Sonnet execution

On every Sonnet session start, the project `SessionStart` hook injects `.claude/skills/execute-task/SKILL.md` before
the first user prompt. It applies the executor evidence protocol to normal Sonnet sessions; the dedicated
`.claude/agents/executor.md` agent preloads the same skill without duplicate hook context.

- Use `@executor` for an explicit Sonnet implementation handoff from a saved task under `tasks/`.
- Sonnet implements, updates concise task state in `docs/backlog.md`, and writes the session log; Opus checks those
  records against the real diff, corrects or consolidates the backlog when needed, and approves or rejects.
- A Sonnet task is never self-approved. Its strongest valid completion status is
  `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## Read first

For every task:

1. Read `docs/agent-contract.md`.
2. Use `docs/rule-index.md` to select the minimal task-specific rule bundle.
3. Use `docs/qa-profiles.md` to choose validation depth.
4. Read `docs/backlog.md` for current project state when planning, creating, or closing tasks.

For Opus orchestration or review, also read:

- `docs/orchestrator-role.md`
- `docs/orchestrator-procedures.md`
- `.claude/skills/create-task/SKILL.md` when designing an implementation task.
- `.claude/skills/review-task/SKILL.md` when reviewing implementation, Storybook/UI evidence, or release readiness.

For Sonnet implementation, use the automatically loaded `.claude/skills/execute-task/SKILL.md` and the task's
pre-read bundle.

Do not read all docs by default.

## Git policy

Agents may use read-only git for inspection:

- `git status`
- `git diff`
- `git show`
- `git log`
- `git grep`

Mutating git is owner-only and native PowerShell only, including:

- `git add`
- `git commit`
- `git push`
- `git reset`
- `git restore`
- `git checkout`
- `git stash`
- `git merge`
- `git rebase`
- `git rm`
- `git apply`
- `git clean`
- `git config`

After a verified task design that changed task/docs artifacts, Opus must emit an explicit-path owner-run **commit and
push** handoff for exactly those artifacts, through the `create-task` skill's verified-branch/remote protocol and
including its stale `.git/index.lock` cleanup preflight. After Opus has completed an `APPROVED` / `APPROVED WITH
NOTES` implementation review, it must emit the corresponding owner-run **commit and push** handoff for the verified
implementation and review artifacts. Sonnet has no approval authority and must not emit, suggest, or run mutating git
commands, including any form of `git push`.

**ALWAYS-DO (owner rule):** every time Opus creates or edits a task/docs artifact, it MUST end that response with the
explicit-path owner-run `git add` + `git commit` + verified-remote `git push` handoff for exactly the file(s) touched.
Never finish a task-creation response without those Git commands. This is mandatory, not optional.

## UI rule split

New or migrated UI:

- Mantine provides behavior, component mechanism, accessibility, and responsive props.
- TailAdmin provides visual chrome, spacing, typography, radius, shadow, density, and component styling.
- Source docs: `docs/mantine-responsive-design-system.md` and `docs/tailadmin-style-reference.md`.

Existing legacy UI:

- shadcn/Tailwind/Base UI rules remain valid only for surfaces not yet migrated.
- Source docs: `docs/ui-rules.md`, `docs/design-system.md`, and `docs/component-rules.md`.

Do not apply legacy implementation details to new Mantine work unless the task is explicitly a migration bridge.

## Task and review rules

- Every implementation task must be concrete enough for a fresh Sonnet session to execute without hidden chat context.
- **Every task belongs to a sprint (owner rule, 2026-08-01).** A task may not be created without one. The kickoff is
  saved as `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md` — **never** at the root of `tasks/`. If no open
  sprint fits, open the next one with its own plan file before writing the kickoff. Binds Task **706** onward; Sprints
  **45** is not a planned sprint — it is the name given after the fact to the unsprinted 621–705 period, and those
  kickoffs stay at their original paths. Discipline restarts at 46.
  **Do not enumerate open sprints here.** This list rotted: it named **49** and **50** as open for three days after
  both were archived, and never learned about **52**, **54** or **55**. `docs/backlog.md` → "Sprints" is the single
  source — read the 🟠 OPEN lines there and pick the sprint whose **goal** the task actually fits. If none fits,
  open the next number with its own plan file first. Do not treat "the highest number" as "the current one", and
  do not infer that a sprint is open from a task in it still being reserved.
- Every implementation kickoff must be saved under `tasks/`; a chat-only handoff is not sufficient.
- Every kickoff must include current behavior to preserve, required after behavior, positive flow, applicable negative flows, acceptance criteria, QA profile, and verification plan.
- The executor's report is not proof. Approval requires inspecting the real changed files, diff, and validation evidence required by the selected QA profile.
- Critical flows listed in `docs/critical-flow-registry.md` require automated regression evidence.

## Documentation map

- `docs/agent-contract.md` - short P0 invariants.
- `docs/orchestrator-role.md` - Opus role, git policy, review expectations.
- `docs/orchestrator-procedures.md` - task design and implementation review procedures.
- `docs/rule-index.md` - task-type rule routing.
- `docs/qa-profiles.md` - risk-based validation depth.
- `docs/ai-behavior.md` - long-form Sonnet executor behavior rules and task template.
- `docs/backlog.md` - active state only.
- `docs/backlog-archive.md` - historical ledger.
- `docs/mantine-responsive-design-system.md` - current UI/responsive source of truth.
- `docs/tailadmin-style-reference.md` - visual source of truth.
- `docs/ui-rules.md` - UI routing plus legacy rules.
- `docs/component-rules.md` - component quality, i18n, no-duplicate, and container/presentational split.
- `docs/qa-rules.md` - validation, encoding, error handling, and manual QA rules.
- `docs/data-access-rules.md` - data access and Supabase patterns.
- `docs/rls-rules.md` - RLS and permission boundaries.
- `docs/domain-rules.md` - marketplace domain rules.
- `docs/env.md` - environment and deployment configuration.
- `docs/integrations.md` - external service setup.
- `docs/performance.md` - Core Web Vitals and performance rules.
- `docs/state-authority.md` - SSR/client state authority.
- `.claude/agents/orchestrator.md` - dedicated Opus task architect and review agent.
- `.claude/agents/executor.md` - dedicated Sonnet implementation agent.
- `.claude/skills/create-task/SKILL.md` - task-design quality gate.
- `.claude/skills/review-task/SKILL.md` - evidence-based review quality gate.
- `.claude/skills/execute-task/SKILL.md` - Sonnet implementation and self-validation protocol.
- `.claude/hooks/orchestrator-router.ps1` - automatic task/review skill router for normal Opus sessions.
- `.claude/hooks/sonnet-executor-bootstrap.ps1` - automatic executor skill loader for normal Sonnet sessions.

## Documentation update rule

When changing project rules, update the most specific file in `docs/` instead of expanding this file.
Use `CLAUDE.md` only as the project entry point and navigation index.
