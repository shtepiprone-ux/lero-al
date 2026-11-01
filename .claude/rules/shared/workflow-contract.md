# Workflow task contract

Read with `workflow-gates.md`; evidence format is in `workflow-evidence.md`.

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

