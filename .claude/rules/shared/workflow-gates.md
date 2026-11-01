# Workflow gates

Read with the current numbered phase. This contract adds executable checks to the existing security, evidence and
UI rules. Claude Code 2.1.295+ is required for `onFailure:block` (inspected installation: 2.1.302).
Role capture uses SessionStart/PostModelSwitch metadata and named agents; UserPromptSubmit/Stop do not provide a
model field. Only a role is saved under ignored `.claude/state/session-roles/`, never prompts or credentials.
For deterministic startup use the configured `orchestrator` (Opus) or `executor` (Sonnet) agent. Missing role metadata
is not permission to guess an Opus role from a user request. Use `/hooks` to inspect active registrations.
`/clear` starts a new session id whose SessionStart carries no model (observed 2026-10-18). No model restart is needed
(owner, 2026-10-19): `session-role.mjs` gives the cleared session the role its own Claude Code process last resolved
(`CLAUDE_PID`; a new process never inherits), and an unknown saved role falls back to the `message.model` that
Claude Code records on the session's latest main-thread assistant entry. A switch to an unrecognized model stays
unknown. The PowerShell hooks use the same resolver (`--resolve`). `ROLE UNKNOWN` now means a model outside
Opus/Sonnet, or a session with neither process role nor reply yet; it never means "switch models and back".
Stop checks prefer the API's `last_assistant_message`; the on-disk transcript can lag behind the current response.

| Phase | Required gate | Failure |
|---|---|---|
| Opus design/revision | Ordered C1-C7 or review correction, `shared/task-readiness.md`, current kickoff/sidecar, `plan` | No ready-task publication |
| Sonnet pre-write | Read task/rules, valid current plan, exact receipt and write scope | Write denied |
| Sonnet handoff | Stage `implemented`, current mapped tests/report, `verify` | PARTIALLY IMPLEMENTED or BLOCKED |
| Opus review | Independent source/assertion/boundary/mutation inspection and rerun, stage `reviewed` | No approval with missing evidence |
| Open-task review transition | Next assigned route saved and verified; plain `NEXT EXECUTOR CONTRACT` reference | Node Stop rejects a missing/draft/stale/frozen route; no state-only commit while design is pending |
| Main push; optional PR/merge queue | `Governance Required`: every registered job succeeds under its recorded policy | Missing/skipped/cancelled/failed job fails |
| Release | `Release Security Required`: green governance plus resolved security blockers | No production promotion |

A planned task may name future tests. A product diff cannot pass as planned. Sonnet updates stage/report metadata,
not the expected invariant, scope, readiness or applicability; changes to those return to Opus. Retrofit an old task before
revising or executing it. Both frontend and server tests remain mandatory for every product task. A missing real
consumer/boundary is a design gap, never permission to invent a fake endpoint or drop a layer.
An intermediate stage acceptance does not close the assigned review cycle. Follow `shared/role-boundaries.md` and
`shared/orchestration-state.md`; only whole-task approval takes the release path, or a concrete external dependency
permits plain `BLOCKED` without a handoff. Route validation is structural; shared readiness still establishes semantics.
All active task Markdown records are checked, including names without `kickoff`; epics/templates/indexes cannot
authorize product execution. On GR-5 closure move the adjacent sidecar with the task, update its task path/digests
and bound report/review metadata, and emit the new receipt. For an archived contract, `receipt` validates reviewed
stage, release bindings and the current product report; it performs no implementation write or test rerun.
`plan` and executor pre-write still reject archived execution. Reviewed archived contracts remain verifiable evidence;
they cannot authorize a new product edit. Preserve raw evidence rather than rewriting its history.
Executor pre-write also rejects active `reviewed` contracts; Opus must reopen the affected route under
`shared/orchestration-state.md`. Read-only verification/receipt remains available.

## Required companions

Read `workflow-contract.md` and `workflow-evidence.md` for task planning, writes, verification and review.
Read `workflow-ci.md` for CI, runtime and remote authority. Before any commit or push handoff, read
`git-publication.md`; its PR-only route takes precedence over any older automatic Git-handoff wording.
These files preserve the former sections of this contract; the split does not relax their requirements.
