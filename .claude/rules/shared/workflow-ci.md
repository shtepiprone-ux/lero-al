# Workflow CI and authority

Read with `workflow-gates.md`; publication sequencing is owned by `git-publication.md`.

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

Before any Git handoff read `git-publication.md`. Dependency publication is a supporting source check,
never a substitute for the required PR checks or exact-SHA GitHub CI.

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

Owner decision 2026-11-01 supersedes the direct-push policy of 2026-10-07/2026-10-17: changes reach main only
through a pull request; no additional human reviewer is required. `scripts/workflow-gates/main.ruleset.json` is the
ruleset payload (PR, both stable summaries from Actions on an up-to-date branch, no deletion/force push, no bypass);
`git-publication.md` owns the sequence and the live-activation check. Configure Vercel production Deployment Checks
to require `Release Security Required` on the same commit; until verified, no production block is claimed.
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
