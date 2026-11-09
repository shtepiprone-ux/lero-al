# Task 958 — CI jobs reach only listed hosts, and one Node version is declared, tested and deployed

Sprint 93. Priority P2. Owner decisions: D1 2026-11-06 (rules on the OWASP reference); the owner 2026-11-06 "all holes
found must be fixed". Filed by the whole-project audit (`docs/security/audit-2026-11-06/findings.md`: CI-02, B-01).
Implementer: Sonnet, after Task 952 (it owns `package.json`). Reviewer: Opus. The owner reads the Vercel project setting.

## Goal

Today:
- Every job of `.github/workflows/ci.yml` (16 jobs), `repository-settings.yml` and `scorecard.yml` runs
  `step-security/harden-runner` with `egress-policy: audit` (`grep -n "egress-policy" .github/workflows/*.yml`,
  2026-11-07): outbound traffic is recorded, never blocked, so a compromised dependency in a job that holds a secret can
  send it anywhere (CI-02).
- `.nvmrc` says `20` and `package.json` has no `engines`, while every CI job installs Node `22.22.3`
  (`ci.yml:40,75,114,…`): what CI proves is not what the repository declares (B-01). Node 20 left upstream support on
  2026-04-30, and Vercel deprecated it on 2026-10-01. Vercel takes the major version from `engines.node` when present;
  the project setting could not be read by the agent (403 on the team scope).

After the task: every job uses `egress-policy: block` with its own `allowed-endpoints`; `.nvmrc`, `engines.node` and the
CI `node-version` are one version, and a test fails when they diverge.

## Scope

- `.github/workflows/ci.yml`, `repository-settings.yml`, `scorecard.yml`: `egress-policy: block` and an
  `allowed-endpoints` list per job (hosts and ports only, no wildcard broader than one service's own domain). Start
  list: `github.com:443`, `api.github.com:443`, `objects.githubusercontent.com:443`, `codeload.github.com:443`,
  `registry.npmjs.org:443`; each job adds what its steps need (CodeQL and SARIF upload, gitleaks, zizmor, the Playwright
  browser download, the Supabase project of the `authz` job). The list is built from the job logs: in block mode the
  runner annotates each refused host, and every addition names the step that needs it.
- `.nvmrc` → `22.22.3`; `package.json` `"engines": { "node": "22.x" }`; `@types/node` stays on the 22 line (`^22`).
- `scripts/quality/ci-workflow.test.mjs` (extended): every job has harden-runner first with `block` and a non-empty
  `allowed-endpoints`; every `node-version` equals `.nvmrc`; `engines.node` admits that version and no other major.
- Owner: confirm in the Vercel project settings (Settings → Build and Deployment → Node.js Version) that it reads 22.x;
  Opus gives the exact screen path and reads the next deployment's build log for the Node version.
- Dependencies: none.
- Out of scope: moving to Node 24 (a later decision: 22 is supported upstream until 2027-04-30).

## Attack surface

Changed: the network reach of CI jobs; the runtime declared for builds.
- T1 Information disclosure: a secret sent out by a compromised step. Mitigation: blocked egress, listed hosts only.
- T2 Tampering: a build on an unsupported or different runtime than CI tested. Mitigation: one declared version.

Authorization matrix: unchanged.


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC2, AC3.
- Authorization: not applicable — no product access decision changes; CI network policy only.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision changes in a CI network task.
- Authorization_Patterns: not applicable — no access check moves in a CI network task.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — the authorization job keeps running with egress blocked — AC3.
- Authorization_Testing_Automation: not applicable — the matrix is Task 950; this task lists the hosts the job needs.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the change reaches main only through the pull request with CI Required green, merged by the owner — AC3.
- Denial_of_Service: not applicable — the upload mentioned is the artifact upload of CI, not a product endpoint.
- Dependency_Graph_SBOM: not applicable — the SBOM job only gains its egress list; its content is unchanged.
- File_Upload: not applicable — only CI artifact uploads are named; no product upload changes.
- GitHub_Actions_Security: "it must be treated as a critical asset, potentially even more critical than the source code it processes" — every job blocks egress to its listed hosts — AC1, AC3.
- Injection_Prevention: "the values for commands and the relevant arguments should be both validated" — ci-workflow.test.mjs pass file names and arguments as array items; no value is joined into a command line — AC4.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC4.
- Key_Management: not applicable — no key is added; the jobs keep their existing secrets.
- Nodejs_Security: "Starting with Node.js v20, a Permission Model is available to restrict application privileges." — one Node 22 line in .nvmrc, engines and every job, so the supported runtime is the tested one — AC2.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — npm reaches only the registry host the jobs list — AC1.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — ci-workflow.test.mjs start git and node with argument arrays, never a shell string — AC4.
- REST_Security: not applicable — the endpoints named are hosts CI calls; no product endpoint changes.
- Secrets_Management: "detect unauthorized access to or attempted exfiltration of secrets, such as anomalous secret retrieval, unexpected outbound network requests" — the egress block keeps job secrets from reaching unlisted hosts — AC1.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC4.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC2, AC3.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — CI installs with npm ci from the committed lockfile — AC3.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC2, AC3.
- User_Privacy_Protection: not applicable — CI artifacts hold no personal data; the task changes network policy only.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC4.
- Vulnerable_Dependency_Management: not applicable — the audit job only gains its egress list; the audit is unchanged.
- Web_Service_Security: not applicable — no service contract changes; CI host lists only.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 Every job blocks egress with its own list — test: `scripts/quality/ci-workflow.test.mjs` (extended: a job with
  `audit`, with no list, or with harden-runner not first fails; deliberate break on one job, restored).
- AC2 One Node version — test: `scripts/quality/ci-workflow.test.mjs` (extended: `.nvmrc`, every `node-version` and
  `engines.node` compared; a changed `.nvmrc` fails).
- AC3 The pipeline passes with egress blocked — test: `gh pr checks <pr>` shows `CI Required` green on the PR of this
  task (Opus runs it; a refused host is either listed with its step or the step is removed).
- AC4 `npm run lint`, `node --test "scripts/quality/*.test.mjs"`, `node scripts/quality/check-files.mjs --worktree` and
  `node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_958_CI_Egress_And_Node_Runtime.md`
  exit 0.

## Route

1. Confirm Task 952 is merged. Branch from `main`.
2. Tests first (AC1, AC2); save the failing output.
3. Version files; the workflow lists; run the self-tests.
4. The owner pushes the branch (Opus gives the commands); read each refused-host annotation with
   `gh run view <run> --log-failed`; add the host with its step, or report it if no step should need it.
5. Report: each command, exit code and relevant output; the final list per job with the step behind each host.

## Review
