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

## Contract format and commands

`scripts/workflow-gates/contract.mjs` owns validation. The adjacent JSON contains:

- `version:1`, `stage:planned|implemented|reviewed`, `kind:product|docs`, and the selected `qaProfile`.
- New/revised sidecars: `executionStatus:draft|blocked|ready`, separate from stage. Only `ready` validates;
  absence remains compatible for unmodified legacy contracts. Opus alone promotes or removes the flag.
  Follow `shared/orchestration-state.md` for disabled draft validation, promotion and candidate rechecks.
- `task`: saved kickoff; `taskSha256`: output of the `hash --task` command below.
- `scope`: unique exact product/source/test paths, including deletions. Keep the sidecar/report outside this hash
  set to avoid a self-reference. No globs, secret paths,
  traversal or symlinks escaping the repository. Every changed product file must be covered.
  Product work includes the recognized non-policy executable helper formats under `scripts/`, even before enrollment;
  pre-write and diff/CI use the same `isProductPath`. Other declared paths are also checked by executor pre-write.
  Product scope is executor work: `plan` rejects policy paths using the same `isPolicyPath` as the write hook.
  Opus resolves policy prerequisites separately before execution; unchanged policy may remain a rule/input.
- `inputs`: unchanged production consumers, guards and test-support modules relied on by the cases. A test-only
  diff must still name real production source inputs. Inspect callers/imports when constructing this manifest.
- `rules`: selected inspected rule paths, including `shared/security-testing.md` and its mandatory companions.
- `cases`: stable `SEC-...` IDs. Each has `layer` (frontend/server/database/http/provider), `outcome`
  (allow/deny/error), concrete `invariant`, `actor`, `resource`, `input`, `response`, `forbiddenEffects`, boolean
  `critical`, `boundary` (unit/integration/browser), `testFile`, and exact collected `testName` including `[SEC-...]`.
  Frontend and server each need allow/deny/error cases and a local unit/component case. SQL changes also require
  real database integration. Every critical invariant also needs real-boundary allow and deny controls with the
  same invariant text. Describe prefixes are part of the full test name; a test cannot count as two cases.
- `report`: retained JSON evidence path, required for product verification.
- At `reviewed`: `review:{role:Opus,decision:APPROVED|APPROVED WITH NOTES,evidence,evidenceSha256,scopeSha256,reportSha256}`.
  Hash the independent review artifact and current report with `digest(root,[path])`; use `scopeDigest(root,contract)` for scope.
- Q0 `kind:docs` only: documentation/rules/task-record scope, empty cases and concrete `notApplicable` reason.
  Executable gates, runtime tests, dependencies and deployment configuration are not Q0.

```powershell
node scripts/workflow-gates/cli.mjs hash --task tasks/<kickoff>.md
node scripts/workflow-gates/cli.mjs plan --contract tasks/<kickoff>.security.json
node scripts/workflow-gates/cli.mjs receipt --contract tasks/<kickoff>.security.json
node scripts/workflow-gates/cli.mjs verify --contract tasks/<kickoff>.security.json
node scripts/workflow-gates/cli.mjs diff --base <full-base-sha> --head <full-head-sha>
node scripts/workflow-gates/cli.mjs diff --base <full-task-base-sha> --working-tree
```

Before product edits, emit on its own line:

`SECURITY TASK PREFLIGHT COMPLETE - contract: tasks/<kickoff>.security.json.`

Use the Read tool to read the complete task and selected rule files in the current session. Successful numbered
Read output must contain every current line; the requested limit alone does not prove coverage. Files over 2000
lines need contiguous chunks. Re-read changed text. A receipt without those reads does not authorize a write.
Run the `receipt` command through the PowerShell tool for durable registration. A successful result counts even
when prose beside a tool call was not retained. Unknown role metadata cannot authorize guarded writes.
Sonnet may record implementation stage in an existing sidecar, but cannot change its planned expectations or review.
The hook validates the actual path, reads, contract and kickoff hash. This includes executable helpers and registered
scope paths outside the built-in product-path set, such as task-owned docs/data; it does not infer other scope.
The newest declared security-task receipt selects one contract in transcript order, whether visible text or a
successful durable result. A missing, malformed, blocked or wrong-scope current selection cannot fall back to an
older receipt or combine scopes. A later corrected receipt recovers in the same session. Other phase/UI receipts
remain cumulative. A plain terminal `BLOCKED` may report
incomplete work; it never authorizes approval or release. Completion/approval ends with one plain status line.

## Evidence and limits

Import `digest`/`planDigest`/`scopeDigest`/`validateReport` from the canonical module in a scoped harness. Never copy their algorithms or
invent successful results. Digests normalize CRLF, bind file paths, record deleted files as absent, and sort object keys
by UTF-16 code unit (RFC 8785), never by the runtime locale; they are not plain file hashes.

The report has `version:1`, `status:passed`, `contractSha256` (`planDigest(root,contract)`, excluding mutable stage/review), `scopeSha256`
(`scopeDigest(root,contract)`: scope, declared inputs, every mapped test and present runtime/config lockfiles), explicit empty `errors`/`vulnerabilities`, and
`cleanup:{verified:true,remaining:0,errors:[]}`. A failed cleanup query is not zero remaining. `cases` contains
exactly the contract IDs, `status:passed`, and positive `assertionCount`. Each critical result additionally has
`sensitivity:{baseline:passed,mutant:failed,failureKind:assertion,restored:passed,testName,artifact,artifactSha256}`;
hash the retained artifact with `digest(root,[artifact])` and inspect its raw mutation/failed-assertion evidence.
Nonempty vulnerabilities/errors, skipped/missing cases, stale hashes, uncertain cleanup and runtime/timeout failure
offered as sensitivity must fail. The old Task 923 DB harness is not release evidence until adapted and reviewed.

`verify` reruns exact mapped files with focused tests, empty success and retry disabled, checks collection and
exact full names, then validates the retained report. Unit children receive only a basic OS/CI environment and
NODE_ENV=test; automatic env-file loading is disabled. Integration/browser/provider cases run separately against
the approved development target through `vitest.integration.config.ts`; local cases use `vitest.config.ts`.
A missing project or zero collected mapped tests fails; never fall back to the other collection.
`vitest.integration.config.ts` is not in the committed tree or the gate publication set (it is a product path).
Until a reviewed product task commits it, every integration/browser/provider case fails closed. Both project
configurations are bound into evidence hashes. Raw JSON results remain in `test-results/workflow-gates/security-runs/`.
Mapped suites use installed Vitest's `expect.requireAssertions:true`; a collected case without a Vitest `expect`
assertion fails. This does not establish assertion quality. Use local expect for concurrent tests. The full unit job
also validates its actual nonempty JSON result: totals must agree with every collected passed status, with zero
failed or pending tests, rather than trusting only the npm command's exit code.
Real boundary cases still need their actual adapters and independently inspected results. JSON shape cannot prove that a guard was not mocked or a
mutation failed for the intended assertion. The reviewer establishes those facts; a scanner never proves RLS.
CI uses `diff --phase release`: an implementation product diff needs reviewed stage and fresh independent evidence.

## CI, authority and remote activation

`scripts/workflow-gates/pipeline.json` is the command/job registry. The workflow uses JSON-form YAML (valid YAML)
for strict parsing without a new dependency. Static commands all run and retain individual results despite an
earlier failure. Full unit tests run separately.
The registry allows 30 minutes per homepage command (the observed sensitivity suite took 17m55s), within the
45-minute homepage job; static commands retain ten minutes each. A command timeout remains a failed result.
Six locale shards partition the full canonical matrix without dropping widths/locales; render errors and incomplete coverage fail. The owner migration exception dated 2026-07-19
remains in force: locale leaks are retained with `leaksBlocking:false` via `--report-only-leaks`, without suppressing
render/runtime failures. Security tests and other required checks have no such exception. The scheduled report also preserves failures.
CI uses the inspected/tested Node 22.22.3 LTS runtime, separately from the legacy `.nvmrc` value 20 (EOL).
Refreshing that legacy application/deployment runtime needs its own compatibility evidence; never claim CI changed Vercel settings.
Actions are pinned to verified official repository commits in `scripts/workflow-gates/actions.json`; every pin runs
on `node24` (GitHub removed Node 20 from Actions runners on 2026-09-23).
Push concurrency is per commit SHA and never cancels: the diff base is `github.event.before`, so a cancelled or
replaced push run would leave that commit's range unchecked. Only superseded PR runs are cancelled. Each push run
checks only its own `before..sha` range; a later green run does not verify an earlier commit whose run failed. Before
promoting, every main commit since the last promoted one needs a green `Release Security Required`.

Before an owner Git handoff, run `node scripts/workflow-gates/publication.mjs --base HEAD`. It validates the
committed tree plus exactly `publication.json`'s owned/dependency files, not unrelated dirty package scripts.
Its existing gate dependencies are retained under their original authorship. The workflow calls the badge/dialog Node
entry points directly, so the handoff does not stage unrelated dependency changes from package.json. Publication
dependency validation is a supporting source check; the isolated candidate still needs runtime validation.

Shared rules, hooks, role parents and settings are versioned by a narrow `.gitignore` allowlist. Local settings,
credentials, state and worktrees remain ignored. Detailed phase/shared rules are excluded from automatic startup
loading to avoid injecting mutually exclusive workflows; required explicit reads still work and remain mandatory.
Keep CLAUDE.md and the rules README loaded. Change one policy owner and all affected phase links/checks together.
Sonnet cannot edit policy, hooks, workflows, baselines or release blockers to make an implementation pass.

Local hooks are workflow controls. They cannot sandbox arbitrary shell programs or authenticate a model's claimed
role, and can be disabled by someone controlling the filesystem. `onFailure:block` is supported for pre-write
hooks, but has no effect on Stop startup/timeout failures; the Stop script catches its own runtime errors, and CI
remains an independent check. Do not claim a broken client or unavailable Stop executable is a reliable barrier.
Both transcript-reading hooks fail closed as a transcript grows: `security-hook.mjs` reads it as one string (V8 limit
536,870,888 characters), and the UI phase gate streams it under a 5-second timeout (319 MB measured at 1.3 s). Start a
fresh session well before 500 MB; never raise a limit or bypass a hook to continue an oversized one.

Owner policy (2026-10-07, reaffirmed 2026-10-17): changes reach main by direct owner push. Do not require a new branch,
PR or an additional human reviewer. `Governance Required` runs after the accepted push; it cannot reject that push
retroactively. Configure Vercel production Deployment Checks to require `Release Security Required` on the same
commit (and optionally `Governance Required`). Until that remote configuration is verified, no production block is claimed.
`scripts/workflow-gates/main.ruleset.json` is an optional prepared safety payload for deletion/force-push protection;
it contains no PR or required-status rule that would prevent the approved direct-main flow. It is not remotely active.
Configure `security-ci` with approved development credentials. If untrusted PR execution is later enabled, protect
privileged credentials before allowing that code to run. Never supply production credentials (the pre-launch exception of
`security-test-environment.md` covers the one project) or use `pull_request_target`.
Private credentials are supplied only to the necessary execution/server step, never checkout, dependency installation,
builds or artifact upload. Unit child processes strip them even when invoked from a trusted boundary-test step.
The Opus handoff hook attributes successful current-session Write/Edit calls, intersects them with real dirty
paths using NUL-delimited Git status, and leaves unrelated pre-existing work to its owner. Opaque shell writers
still need explicit task manifests and independent diff/CI review; a local hook cannot prove their authorship.

In that environment set variables `SECURITY_TEST_TARGET=development` and `SECURITY_TEST_PROJECT_REF` to the approved
Supabase project ref. Set environment secrets `SECURITY_CI_SUPABASE_URL`, `SECURITY_CI_SUPABASE_ANON_KEY`, and
`SECURITY_CI_SUPABASE_SERVICE_ROLE_KEY`; SQL tests additionally need `SECURITY_CI_DATABASE_URL` and, where needed,
`SECURITY_CI_SUPABASE_CA_CERT`. These may identify the existing development project. Separate names avoid falling
back to old repository-level privileged keys. Boundary tests must validate their own SQL/provider destinations and
synthetic ownership too; a matching Supabase URL alone cannot prove a provider/SQL target is safe.

Keep known critical/high findings in `release-blockers.json` open until fixes, fresh regression evidence and
independent review exist. Removing a finding is not resolution. A green governance check alone is not release readiness.
Resolution names the reviewed contract and `caseIds` covering critical server denial and real-boundary denial.
Resolved critical contracts are rerun on subsequent CI events, including documentation changes, to catch live-policy drift.
