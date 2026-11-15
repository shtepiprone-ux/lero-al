# Task 974 — Checks follow the GitHub and OWASP workflows only; the click-shield recheck reaches a carousel's edge card

Sprint 93 (governance reset). Priority P1. Owner decision D974-1 (2026-11-14, translated): "all the tasks that verify
your code went into deep over-engineering, because they must follow the GitHub workflow and the OWASP workflow; your
code must follow these workflows, and you started writing tests for everything. Check these tasks and delete the tasks,
the code and the tests that do not follow these workflows and pipelines"; the deletion list confirmed the same day.
Earlier decisions of this task (2026-11-12 browser jobs only on GitHub, 2026-11-13 the self-review hook R1-3 to R4-1)
are withdrawn by D974-1: with no local replica of the workflow, every job runs only on GitHub. Implementer: Opus (rules, hooks and CI, at the owner's request). Reviewer: a separate Opus session. Owner: the owner.

## Goal

Local agent machinery re-checked the agent instead of the code: `pipeline.mjs` (phase ledgers and a Stop hook),
`self-review.mjs` (a `PreToolUse` command-line classifier of 940 lines), `claims.mjs` and `provenance.mjs` (the wording of
replies), `ci-local.mjs`, `load-watch.mjs` and `stage-watch.mjs` (a local copy of `ci.yml`), `push-safety.mjs`,
`agent-check.mjs` and `test-fixtures.mjs` (hooks that rerun what pre-commit and CI run), `ac-tests.mjs`, `audit-coverage.mjs`
and `codeql-alerts.mjs`, with their tests, and `ci-workflow.test.mjs` and `entry-point-guards.test.mjs`. None of them is
called by `.github/workflows/ci.yml`, `.github/workflows/repository-settings.yml` or `.githooks/pre-commit`
(`grep -n "scripts/quality/"` over the three, 2026-11-14). After the task they are gone, the only agent hook is the OWASP
session brief, and the rules name the GitHub workflow, the pre-commit hook and the OWASP workflow as the gates.

The `main` run of `a49b308df` (run 43307123420) failed click-shield on a carousel card whose centre lies on the last
half-pixel column of a 320 px viewport: the targeted recheck scrolls only vertically. After the task it also scrolls the
card's own containers horizontally and back, and CI runs the gate's self-test before the gate.

## Scope

- Deleted (owner, D974-1): `scripts/quality/{pipeline,self-review,claims,provenance,ci-local,load-watch,stage-watch,`
  `push-safety,agent-check,test-fixtures,audit-coverage,codeql-alerts,ac-tests}.mjs` and each one's `.test.mjs`,
  `scripts/quality/pipeline-steps.json`, `scripts/quality/ci-workflow.test.mjs`,
  `scripts/quality/entry-point-guards.test.mjs`, `tasks/self-review/`.
- Kept, because CI, pre-commit or a ruleset run them, or an open task's criterion needs them: `owasp.mjs`,
  `check-files.mjs`, `client-sinks.mjs`, `locale-safety.mjs`, `product-gates.mjs`, `changed-lines-coverage.mjs`,
  `ci-target.mjs`, `change-report.mjs`, `check-ruleset.mjs`, `main-ruleset.json`, `db-catalog-audit.mjs` (Task 956 AC1),
  `cloudinary-config.mjs` (Task 957), and the tests of real configuration.
- `scripts/quality/ci-secrets.test.mjs` (owner, 2026-11-14, option a): the one workflow check with security value is kept
  from the deleted workflow test: audit finding CI-01, a secret bound only on the step that reads it.
- `scripts/quality/owasp.mjs`: a `session` command prints the SessionStart context (moved from `agent-check.mjs start`).
- `.claude/settings.json`: one hook, `SessionStart` → `owasp.mjs session`; permissions unchanged.
- `scripts/quality/agent-settings.test.mjs`: the permission cases stay; the hook cases pin the one hook.
- `scripts/quality/change-report.mjs`: the `ac-tests.mjs` rule removed; the untested-code and dependency rules stay.
- `docs/security/owasp/controls.json`: the two OS-command controls point at `owasp.mjs`; the `audit-coverage.mjs`
  control of Attack Surface Analysis removed (the threat-model rule stays its control).
- `scripts/__tests__/check-locale-leak.test.ts`: the `load-watch.mjs` assertion removed.
- Rules: `CLAUDE.md`, `.claude/rules/flow.md`, `quality-gates.md`, `secure-code-review.md`, `security-testing.md`,
  `README.md`, the three skills, both agents: CI is read with `gh pr checks <n>`; the self-review rule stays without a hook.
- `scripts/check-click-shield.mjs` (targeted recheck): `scrollIntoView({ inline: 'center' })` on the candidate, the page
  put back at the chosen vertical offset, every scrolled container restored after the judgement; three `--verify-gate`
  fixtures: an edge card passes, the same card covered fails with its interceptor, a second card of the scrolled
  carousel still clears.
- `.github/workflows/ci.yml`, job `click-shield`: the step `npm run check:click-shield:verify` before the build.
- Backlog (`git diff main`): the registry (975, 976; 966 withdrawn with 963 AC9); 965 merged; 974 added and rewritten;
  864's guard withdrawn; 963's AC9, AC16 and AC18 as D974-1 left them; the 961 and 969 rows unchanged.
- Out of scope: every other job and step of `ci.yml`; product code under `src/`.
- Dependencies: none.
- Revision 1 (Review 5, 2026-11-14), findings F1 to F6 only:
  - R5-1 (F1): every AC and Scope line of the open kickoffs 954 (AC9), 958 (Scope, OWASP, AC1, AC2), 963 (Scope, AC2),
    972 (header, Scope, AC5) and 973 (header, Scope, AC5) that names `scripts/quality/ci-workflow.test.mjs` names a test
    that exists after D974-1 (a case of `ci-secrets.test.mjs`, the CI step's own command, or `gh pr checks <n>`); the
    Scope's backlog line says what the backlog holds (the 961 and 969 rows are unchanged; narrowing 961 needs an owner
    decision and a new owner for the MCP_Security "rug pull" requirement that `controls.json` hands to 961).
  - R5-2 (F2, owner 2026-11-14: "add the 3 cases to ci-secrets"): `ci-secrets.test.mjs` pins that `CI Required` needs
    every other job of `ci.yml`; that the `secrets` job scans base..head with the pinned, sha256-verified gitleaks and no
    `gitleaks/gitleaks-action`; that `.gitleaksignore` holds exactly the six fingerprints of Task 970; and (owner
    2026-11-14, "add a case") that every job runs on `ubuntu-24.04` (Task 963 AC13); a planted case each.
  - R5-3 (F3): `secretScopeProblems` finds a secret in every expression form (`secrets.X`, `secrets['X']`,
    `toJSON(secrets)`) and a job-level `secrets:` given to a reusable workflow (`inherit` included).
  - R5-4 (F4): `flow.md` §1 step 6 again says what `quality-gates.md` §8 enforces: every AC names its automated test, and
    a revision that changes or adds an AC changes or adds its test; §1 step 5 again says that a requirement the mapping hands to the task is cited.
  - R5-5 (F5): no statement says a deleted tool runs, a test pins what it does not, or code is where it is not:
    `findings.md:200`, `:201` and `:215`, `coverage.md:30`, `scripts/check-locale-leak.mjs:495-497`, Task 963 AC18,
    `scripts/check-click-shield.mjs:661` (phase 2 is at `:807-855`), the checks "at every write" of the removed agent
    loop (`quality-gates.md:21`, `scripts/quality/check-files.mjs:14`, `:297`, `:312`, `check-files.test.mjs:250-251`,
    Task 963 `:110`, `:112`, `:157`), Task 963's stop hook (`:109`, `:120`), AC13's "zizmor … keep the pin" (`:181-182`; no zizmor audit reads `runs-on`), its deleted AC9 (Route `:208-210`, `backlog.md:44`, `:46`) and withdrawn AC16 (`backlog.md:52`); Task
    864's title, status line and §17 name what Revision 2 withdraws, and no section of it (§1, §2, §5, §6, §7 items 1-2, §9, §10 to §15, Appendices B and C) still allows, pre-reads, builds, runs or waits for the withdrawn guard, the deleted hook or Task 886.
  - R5-6 (F6): a test runs `owasp.mjs session` and asserts its hook output (`hookSpecificOutput.hookEventName`
    `SessionStart`, `additionalContext` starting `OWASP reference: ` and naming `plan` and `review`), as `main:scripts/quality/agent-check.test.mjs:57-63`
    did; the command list at the top of `owasp.mjs` names `session`; `agent-settings.test.mjs` refuses a second `SessionStart` entry or command.

## Attack surface

Changed: what checks an agent's work before a push. Threats: an agent change reaches `main` unchecked — mitigated: the
merge needs a green `CI Required`, which runs every job, and the `main` ruleset requires it; a secret pushed to the public
repository — mitigated: the pre-commit hook scans every staged file for secrets, GitHub push protection is on, and CI
runs gitleaks; a mutating Git command or a deploy by an agent — eliminated as before: the permission denials stay and
the settings test pins them (AC3); a false click-shield failure that teaches people to rerun until green — eliminated
for the carousel edge, while a covered card still fails (AC1). No product code, data or role changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-14).

- AI_Agent_Security: "Block releases when high-risk tool policies, approval logic, or credential scopes change without updated tests" — the agent permissions and the one remaining hook are pinned by the settings test, so loosening them fails CI — AC3.
- Cryptographic_Storage: not applicable — sha256 only verifies the pinned gitleaks download (R5-2); nothing is stored or encrypted.
- Denial_of_Service: not applicable — no request handler, queue or resource limit of the product changes here.
- File_Upload: not applicable — no upload path changes; the Cloudinary configuration check is kept unchanged.
- Injection_Prevention: not applicable — no query, command or markup is built from input by the changed code.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the patterns R5-2 and R5-3 add to `ci-secrets.test.mjs` have no nested quantifier and no alternation over the same characters, and read only the repository's own workflow files; the deleted classifier's patterns leave with it — AC7, AC10.
- Key_Management: not applicable — no key is created, stored or rotated; secrets stay in the `security-ci` environment.
- LLM_Prompt_Injection_Prevention: not applicable — no model input or tool boundary of the product changes; agent permissions are unchanged.
- MCP_Security: not applicable — no MCP server, tool definition or permission is added or changed by this task.
- Software_Supply_Chain_Security: not applicable — no dependency, action pin or install step changes in this task.
- Subdomain_Takeover_Prevention: not applicable — no DNS record or domain changes; Task 961 keeps the DNS watch.
- User_Privacy_Protection: not applicable — no personal data is read, stored or shown by the changed code.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the change to what is checked before a push is named in Attack surface with its threats and tests — AC3, AC4.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — `ci.yml` keeps every job, gains the click-shield self-test, and the merge still needs a green `CI Required` — AC2, AC4.
- GitHub_Actions_Security: "it must be treated as a critical asset, potentially even more critical than the source code it processes" — the one added step runs a repository script with no env, no secret and no `if`, after the pinned Playwright install; every secret stays on the step that reads it — AC2, AC8.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — the control moved to `owasp.mjs`, which starts Node with an argv array and no shell — AC5.
- Secrets_Management: "Consider enabling secrets detection at the developer level to avoid checking secrets into code before commit/PR" — the pre-commit hook's secret scan is unchanged; gitleaks runs in CI — AC6.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the reviewing session reads the diff and reruns AC1 to AC6 — AC1, AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — a PR's CI result is read from GitHub's own checks with `gh pr checks`, never from an agent's report — AC2.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threats of Attack surface became AC1 and AC3 — AC1, AC3.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — Attack surface states what changes, what can go wrong and what is done about each — AC3, AC4.
- Verifying_Third_Party_Agent_Execution_Evidence: "Reconcile supplier reports with observations you control when possible" — the result of every job is read from GitHub's check results on the PR, which the agent does not produce — AC2.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A carousel card whose centre is on the last half-pixel column passes the click-shield recheck, the same card
  covered fails and names its interceptor, and another card of the scrolled carousel still clears — test:
  `npm run check:click-shield:verify`.
- AC2 CI runs the click-shield self-test before the gate and the PR's `Click-shield` check passes — test:
  `gh pr checks <n>` on this task's pull request.
- AC3 The only agent hook is `owasp.mjs session`; every mutating Git command and every Vercel write stays denied — test:
  `node --test scripts/quality/agent-settings.test.mjs`.
- AC4 No remaining file imports a deleted script, and every quality self-test passes — test:
  `node --test "scripts/quality/*.test.mjs"` and `npx vitest run scripts/__tests__/check-locale-leak.test.ts`.
- AC5 The OWASP mapping holds with the moved controls — test: `node scripts/quality/owasp.mjs check`.
- AC6 The change report still fails product code changed with no test change — test: `node --test scripts/quality/change-report.test.mjs`.
- AC7 Every file and every script passes its checks — test: `node scripts/quality/check-files.mjs --worktree` and
  `npm run lint`.
- AC8 A secret is bound only on the step that reads it in every workflow (audit CI-01) — test:
  `node --test scripts/quality/ci-secrets.test.mjs` (planted cases; red with a job-level secret added to `authz`).
- AC9 (R5-1) No open kickoff names a deleted test as the test of a criterion — test: `node scripts/quality/check-files.mjs`
  on the five kickoffs of R5-1, and the reviewer's `git grep -n "ci-workflow.test.mjs" -- tasks/Sprints` lists history
  only and `git diff main -- docs/backlog.md` matches the Scope's backlog line.
- AC10 (R5-2, R5-3) The gates' wiring and every secret form are pinned — test: `node --test scripts/quality/ci-secrets.test.mjs`
  (planted: a job left out of `needs`, the gitleaks action, an unverified binary, a scan without the base range, an
  extra `.gitleaksignore` line, a `secrets['X']`, `toJSON(secrets)`, `secrets: inherit`, an `ubuntu-latest` job; each red, the real workflows green).
- AC11 (R5-4, R5-5) The rules and records say what is enforced — test: `node scripts/quality/check-files.mjs .claude/rules/flow.md
  docs/security/audit-2026-11-06/findings.md docs/security/audit-2026-11-06/coverage.md scripts/check-locale-leak.mjs
  scripts/check-click-shield.mjs scripts/quality/check-files.mjs`, `node --test scripts/quality/check-files.test.mjs`, the reviewer's read.
- AC12 (R5-6) The one remaining hook prints the context Claude Code reads, and it stays the only one — test: `node --test scripts/quality/owasp.test.mjs`
  (red with the `session` branch's `hookEventName` changed) and `node --test scripts/quality/agent-settings.test.mjs` (red with a second SessionStart command).

## Route

1. The owner deletes the files of Scope ("Deleted") with the command Opus gives.
2. Run: `node --test "scripts/quality/*.test.mjs"` · `npx vitest run scripts/__tests__/check-locale-leak.test.ts` ·
   `node scripts/quality/owasp.mjs check` · `node scripts/quality/check-files.mjs --worktree` · `npm run lint` ·
   `npm run typecheck` · `npm run check:click-shield:verify`; deliberate break for AC1: drop the horizontal scroll (the
   edge-card fixture fails), restored.
3. Report: each command, exit code, relevant output. After the push: `gh pr checks <n>` until every check has concluded.

## Review

Review 5 of the working tree on `task/974-browser-jobs-on-github` (base a49b308df) — NEEDS REVISION (first in the D974-1 scope)
Scope: the whole diff, 66 paths; every changed and new file read in full, three clean passes before any test. Tools: check-ruleset, lint, typecheck,
`npm test -- --coverage` (6403), changed-lines coverage, check-files, the quality tests (104 pass, 3 skipped), the locale-leak test and the click-shield
self-test, each exit 0; the click-shield breaks red, restored. Findings: Medium 2, Low 4, each restated with its location in Scope, Revision 1:
F1 open kickoffs named the deleted workflow test (R5-1); F2 the wiring checks of `CI Required`, the Task 970 scan and `.gitleaksignore` were
deleted (R5-2); F3 other secret expression forms (R5-3); F4 `flow.md` AC-test wording (R5-4); F5 statements about deleted tools (R5-5); F6 the
session hook output untested and a second SessionStart hook passed (R5-6). Status of each: fixed in Revision 1, verified by Review 6.

Review 6 of the working tree on `task/974-browser-jobs-on-github` (base a49b308df) — APPROVED WITH NOTES
Scope: the whole diff against `main` (74 paths with this review's records); Revision 1 (R5-1 to R5-6) read in full: `ci-secrets.test.mjs`,
`agent-settings.test.mjs`, `owasp.mjs`, `owasp.test.mjs`, `.gitleaksignore`, `flow.md`, `quality-gates.md`, the comments of R5-5, `findings.md`,
`coverage.md`, `governance-reset-2026-11-06.md`, kickoffs 864, 954, 958, 963, 972, 973, `backlog.md`. Read before any test; the pass that found N1 ran one in-memory probe of `secretScopeProblems`.
Step 1: `owasp.mjs sync` found Denial_of_Service, Docker_Security, Multifactor_Authentication and Transport_Layer_Security changed
upstream (`check` exit 1); each diff read and remapped in `docs/security/owasp/controls.json` (ReDoS → CodeQL `security-extended`;
TOTP seed, replay and re-enrollment → Task 960; TLS early data, "safe methods have no side effects" → Task 950 AC7, added to its
kickoff); `owasp.mjs check` 0. These records land with this PR, as the HTTP Headers remap landed with PR #30.
Tools (local, uncommitted working tree): `node scripts/quality/check-ruleset.mjs` 0; `npm run lint` 0; `npm run typecheck` 0;
`npm test -- --coverage` 0 (396 files, 6403 tests); `node scripts/quality/changed-lines-coverage.mjs --base main` 0; `node scripts/quality/check-files.mjs --worktree` 0
(46 files); `node scripts/quality/change-report.mjs main HEAD` 0 (nothing committed); `node --test "scripts/quality/*.test.mjs"` 0 (116 pass, 3 skipped:
`BASE_URL`); the five suites of AC3, AC6, AC8, AC10, AC12 0 (74 pass); `npx vitest run scripts/__tests__/check-locale-leak.test.ts` 0 (19); `npm run check:click-shield:verify` 0;
`npm run check:backlog-active` 0. Breaks: in memory, a job-level secret in `authz` (AC8), `owasp-gate` dropped from `needs` and an
`ubuntu-latest` job (AC10) each refused; file break of `owasp.mjs:688` (`SessionStarted`) red in `owasp.test.mjs`, restored (`git hash-object`
d2c8711b before and after). AC9: `git grep -n "ci-workflow.test.mjs" -- tasks/Sprints` lists 945, 947, 951, 965, 970 only (merged);
`git diff main -- docs/backlog.md` matches the Scope's backlog line. CI not run (no PR yet): AC2 is `gh pr checks <n>` after the push.
Findings: Critical 0, High 0, Medium 0, Low 1 (note N1, filed as Task 977). Review 5's F1 to F6 are fixed (each reproduced above or read).
Overall risk: no product exposure; the CI-01 check misses one rare expression shape that no workflow uses today.

N1 — The CI-01 check misses a secret written after a brace inside the same expression
Severity: Low      Category: dependencies and configuration      CWE: CWE-200
Location: `scripts/quality/ci-secrets.test.mjs:21`
Description: `/\$\{\{[^}]*\bsecrets\b/` stops at the first `}`, so `${{ format('{0}', secrets.X) }}` or
`${{ fromJSON('{"a":1}').a || secrets.X }}` at workflow or job level passes. AC10's enumerated forms are refused.
Impact: a job-level secret written in that shape reaches every step with no test failing; only the owner's diff read catches it.
Reproduction: `secretScopeProblems({ jobs: { a: { env: { K: "${{ format('{0}', secrets.X) }}" }, steps: [] } } })` → `[]` (in-memory call, 2026-11-15).
Recommendation: match up to the `}}` that closes the expression. References: GitHub_Actions_Security. Status: task 977
OWASP record: `docs/security/owasp/reviews/Task_974.json` (review 6).
