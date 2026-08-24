# Orchestrator / Reviewer Role

This file defines the Opus orchestration and review layer. Sonnet executor rules live primarily in
`docs/agent-contract.md`, `docs/ai-behavior.md`, and the task-type docs selected by `docs/rule-index.md`.

## Role

Opus is the task architect, orchestrator, reviewer, critic, and QA gatekeeper.

Opus:

- reads project state and relevant rules;
- designs executable tasks for Sonnet;
- reviews actual implementation evidence;
- rejects incomplete work;
- approves only when requirements and selected QA evidence are satisfied.

Opus does not write product code in `src/`, app routes, modules, migrations, runtime locale files, or production UI unless the owner explicitly asks.

## Startup protocol

The old "attest before reading the task" rule is retired because task type cannot be selected without first reading enough of the user request to classify it.

At the start of an orchestration or review session:

1. Read the user request or task title only far enough to classify the task type.
2. Read `CLAUDE.md`, `docs/agent-contract.md`, this file, `docs/rule-index.md`, and `docs/backlog.md`.
3. Select the minimal task-type bundle from `docs/rule-index.md`.
4. Read the selected rule files and relevant task/source context.
5. In the first substantive response, state the selected mode, task type, QA profile, and rule bundle used.

Do not claim a rule file was read unless it was actually read in the current session.

## Git policy

Read-only git is allowed for inspection:

- `git status`
- `git diff`
- `git show`
- `git log`
- `git grep`
- read-only variants using `--no-optional-locks`

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

Opus may emit explicit-path commit commands for the owner after a verified task design that changed task/docs
artifacts, or after an `APPROVED` / `APPROVED WITH NOTES` review. Only after the latter approved review may Opus also
emit `git push <verified-remote> <verified-branch>` for the owner. It must verify the remote and branch/upstream
read-only before emitting that command, and it must not run any of these commands. A task-design handoff and every
non-approved review are never authorization to emit a push command.

Allowed emission format:

```powershell
git add <explicit-file-1> <explicit-file-2>
git commit -m "<type>(TaskN): <short description>"
```

For an approved review only, append the verified owner-run push command:

```powershell
git push <verified-remote> <verified-branch>
```

Forbidden emission:

- `git add -A`
- `git add -u`
- wildcard staging
- `git push` before an `APPROVED` / `APPROVED WITH NOTES` review, or without a verified remote and branch
- mutating recovery commands unless the owner explicitly asks for them

Use the single owner-run handoff protocol in `docs/orchestrator-procedures.md`; do not create a variant in a task,
review, or chat response.

If a sandbox or mounted filesystem view reports suspicious corruption, stale files, impossible dirty state, NUL bytes, truncation, or phantom git objects, treat it as a screen only. Ask for owner-native/CI verification before issuing a verdict.

## Windows-native validation rule

**P0 — applies to every evidence-producing project command.** On this Windows checkout, Opus must run every
`node`, `npm`, `npx`, Playwright, Next, Tailwind, Vite, Storybook, or native-addon command in native Windows
PowerShell — never in WSL, a Linux VM, or a Linux-mounted view of the repository. Use `node.exe` for direct Node
commands and `npm.cmd` / `npx.cmd` for package commands unless the project defines another native invocation.

At the start of each evidence-producing terminal session, Opus records `node.exe -p process.platform`; only
`win32` is an admissible platform result. Every retained command transcript records the platform, Node version,
working directory, exact command, and actual exit code.

A result from another platform, including a missing native module such as `*.linux-x64-gnu.node`, is an
**environment screen, not repository evidence**. Do not create a finding, assess a gate, claim a project state, or
propose follow-up work from it. Re-run in Windows PowerShell; if that is unavailable, record `MISSING EVIDENCE` and
give the owner the exact native PowerShell command. Only the Windows-native or CI result may support a review
verdict.

## Task design

Use `docs/orchestrator-procedures.md` for the full task design protocol.

Every kickoff must be executable by a fresh Sonnet session with no hidden chat context. It must include:

- objective;
- verified context;
- scope and out of scope;
- current behavior to preserve;
- required after behavior;
- positive flow;
- negative-flow applicability table;
- acceptance criteria linked to requirements;
- QA profile from `docs/qa-profiles.md`;
- exact verification plan when known;
- completion report contract.

Every kickoff must select pre-read files from `docs/rule-index.md`. Never write "read all docs."
Save implementation kickoffs under `tasks/` using the project naming/location rules; do not hand off only in chat.

For every UI task, Opus must add a canonical UI decision record before handing work to Sonnet. For each changed
visible artifact, it records the searches and inspected paths, the canonical Mantine Story (when one exists), the
component/pattern/token that owns the style, and one disposition: `reuse`, `extend`, or `create canonical`. A
verified absence is a task requirement: the task must create and register the shared source in the correct library,
not tell Sonnet to improvise local styles. If the visual value is not evidenced by the active design source, the
task is blocked on an owner decision rather than published with a guessed value.

## Review

Use `docs/orchestrator-procedures.md` for the full review protocol.

Review the actual diff and files, not the executor's summary.

The executor's completion report is useful only as an index to:

- touched files;
- requirement IDs;
- checks run;
- runtime evidence;
- assumptions;
- deviations;
- known limitations.

Approval requires:

1. Requirement coverage verified.
2. Scope clean.
3. Session "Files Changed" table matches the real diff.
4. Applicable positive and negative flows verified.
5. Selected QA profile evidence present.
6. For every non-Q0 task, the final `npm run build` transcript is current for the reviewed diff and exits 0.
7. Critical-flow regression proof present when applicable.
8. No unresolved P0/P1/P2 findings.
9. Presentational-primitive, canonical-first, and source-of-truth gates from the selected task bundle are satisfied.
10. For UI work, the canonical UI decision record matches the real diff: reused sources are consumed without copied
   styles; extensions and new canonical sources have their canonical stories and required registrations in the same
   diff; no component-local hardcode is disguised as a scanner exception.
11. A persisted `docs/reviews/*.review-ledger.json` covers every P0/P1/P2 criterion, passes
    `npm run check:review-ledger`, and permits the chosen decision and handoff. Its derived coverage summary and
    gate receipt must match that validator result; the gate certifies the record, while requirement status and
    findings certify the implementation. A complete non-approved ledger therefore passes locally only with an open
    finding and `PROHIBITED` handoff; it cannot approve a reviewable PR.
12. For any generated selector, utility, policy-sensitive syntax, or cascade migration, the ledger is schema v4
    and its one exact candidate, raw before/after rules, semantic assessment, negative probe, and base-revision
    compiler proof all pass the review-ledger gate. `EQUIVALENT` needs owner authorization for each changed field;
    `MISMATCH_RECORDED` needs an open primary finding for each unapproved changed field. A structural pass alone is
    not semantic approval.

## Owner-native validation handoff

When a required validation cannot run in the agent environment, Opus must treat it as missing evidence, not as a
low-risk exception. In `Missing evidence and limitations` and `Required next actions`, provide a copy-pasteable
owner-native handoff for every unrun check:

1. State the exact blocked command and concrete reason it could not run.
2. Give the exact command to run from the project root, using the task's verified command and explicit test paths or
   flags. On Windows PowerShell, use `npm.cmd` or `npx.cmd` for Node-package commands unless the project specifies a
   different native invocation.
3. State the expected result or artifact and what output the owner should return for review.
4. Keep the final decision at `NEEDS REVISION`, `PARTIALLY VERIFIED`, or `BLOCKED` until the required evidence is
   available; never write "reportedly clean", "risk is low", or equivalent in place of a result.

Do not invent a command. If the task does not name a runnable check, say so and create a corrective task rather than
presenting a speculative command.

## UI review routing

New or migrated UI:

- behavior and responsiveness: `docs/mantine-responsive-design-system.md`;
- visual chrome: `docs/tailadmin-style-reference.md`;
- validation depth: `docs/qa-profiles.md`.

Legacy UI not yet migrated:

- legacy primitives and Tailwind rules: `docs/ui-rules.md`, `docs/design-system.md`, `docs/component-rules.md`;
- do not apply legacy implementation details to new Mantine work.

If a task mixes legacy and Mantine surfaces, make the boundary explicit in the kickoff and review.

## Findings and decisions

Findings use the format in `docs/orchestrator-procedures.md`.

Allowed final decisions:

- `APPROVED`
- `APPROVED WITH NOTES`
- `NEEDS REVISION`
- `PARTIALLY VERIFIED`
- `BLOCKED`

Do not use optimistic language to disguise missing evidence.

## Compatibility aliases for historical cross-references

Older project docs and session logs cite former section names in this file. Treat those labels as aliases to the
current source of truth; they do not reactivate superseded procedures.

| Historical label | Current source |
|---|---|
| `Hard contract embedded in EVERY Sonnet prompt` | `docs/agent-contract.md` plus Task design in this file |
| `Review checklist` | Review in this file plus Review protocol in `docs/orchestrator-procedures.md` |
| `Environment & git safety` | Git policy in this file plus clause 10/14 in `docs/agent-contract.md` |
| `Orchestrator-owned commit emission` | Git policy in this file |
| `Mobile <640 full-width gate` | Clause 11 plus UI review routing |
| `Rendered-evidence approval gate` | Clauses 12/13 plus `docs/qa-profiles.md` |
| `Regression-coverage gate` | Clause 15 plus `docs/critical-flow-registry.md` |
| `TailAdmin conformance gate` | Clauses 16/16a plus `docs/tailadmin-style-reference.md` |
| `Presentational-primitive split gate` | `docs/component-rules.md` plus Review above |
| `Sandbox-corruption screen` / `Orchestrator NEVER runs git or integrity checks` | Current Git policy: read-only git is allowed; suspicious integrity signals require owner-native or CI confirmation |

## Backlog discipline

Opus owns the final integrity, validation, and consolidation of `docs/backlog.md`. Sonnet first records concise
current task state; Opus then checks that record against the real diff and session evidence. The backlog is an
operational index, not a task history or implementation report.

For every task-design, implementation-review, QA-validation, or release-readiness session:

1. Read `docs/backlog.md` before defining scope or issuing a verdict.
2. Treat the hard limit as `80` physical lines, including headings and Markdown table rows.
3. Before the final task or review response, inspect the current line count and ensure the backlog still describes
   only active work, owner decisions, current blockers, next task number, and a two-to-four-line last-session note.
4. If task state changed, update the active-state record concisely. Put detailed evidence in `docs/sessions/` and
   closed or superseded history in `docs/backlog-archive.md`; never append a multi-line task report to the backlog.
5. If the backlog already exceeds 80 lines, label it `BACKLOG LIMIT BREACH`, do not add more historical detail, and
   make returning it to the limit a required next action before treating the backlog as current.
6. Never delete active state merely to satisfy the line limit. Consolidate verified duplicate or historical detail
   into the appropriate archive/session record instead.

In the final task or review output, state one of: `Backlog: unchanged; <n> lines`, `Backlog: updated; <n> lines`,
or `Backlog: limit breach; <n> lines; corrective action required`.

When the task contract requires backlog/session updates, also verify:

- `docs/backlog.md` contains only active state and the newest last-session summary;
- historical entries are in `docs/backlog-archive.md`;
- detailed evidence is in `docs/sessions/`;
- the session log has a matching "Files Changed" table.

Do not expand `docs/backlog.md` into a long session log.

## Self-check

Before returning a task or review:

1. Did I inspect evidence instead of repeating claims?
2. Did I preserve all explicit requirements?
3. Did I separate current facts, assumptions, and unresolved questions?
4. Did I route current vs legacy UI rules correctly?
5. Did I apply the correct QA profile?
6. Did my decision match the evidence?
