# Task 945 — Agent quality loop, every-file checks and CI gates on the OWASP basis (implemented 2026-11-06)

Sprint 93 (governance reset). Priority P0. Owner decisions 2026-11-06: D1 "Study the reference, rewrite the rules of
the flow and the gates, this task must be done with quality. All tasks after 923 are complete trash; investigate them,
delete those that do not match the reference, deep-audit and rewrite those that are needed." D2 "Review the reference
again and check compliance in the project. Quality must cover all files in the project, without exceptions."
Implementer: Opus (rules, hooks, CI — `CLAUDE.md` roles). Reviewer: the owner, by reading the PR diff and the change
report, and the first CI run. Human owner of the change: the owner. Replaces Task 945 revisions 0–2 (Sprint 92).

## Goal

Before the reset the project had ~20 PowerShell hooks, a 4 500-line `scripts/workflow-gates/` contract with phase
receipts, two governance workflows and eleven open tasks (935–946) that guarded the guards. None of it checked code
the way the OWASP Cheat Sheet Series asks: tools first, then a diff-based human review, dependency audit, SAST, secret
scanning and authorization tests against the real boundary. Only `src/` was linted; scripts, documents, configuration,
SQL, PowerShell and evidence files were checked by nothing. The first all-files run (2026-11-06) found 1 526 junk files,
364 BOMs, invisible characters in product code, 5.9 million terminal escape sequences in recorded output, mojibake,
86 broken links, files over 20 MB and an unparsable CSS file.

After the task every file in the repository is checked by type, at write time, at commit time and in CI; an agent cannot
finish with a failing check in anything it changed; every PR to `main` passes one aggregate check, **CI Required**; the
rules are short files in `.claude/rules/` built on the cheat sheets read (`docs/governance-reset-2026-11-06.md`).

## Scope

- Files changed: `scripts/quality/` (`check-files.mjs`, `agent-check.mjs`, `change-report.mjs`, their tests,
  `main-ruleset.json`), `scripts/check-mojibake.mjs`, `scripts/mojibake-allowlist.json`, `scripts/check-click-shield.mjs`
  (no Function constructor), `scripts/import-locations.mjs` (ESM), `eslint.config.mjs`, `.claude/settings.json`,
  `.claude/rules/*.md`, `.claude/skills/*/SKILL.md`, `.claude/agents/*.md`, `CLAUDE.md`, `AGENTS.md`,
  `.github/workflows/ci.yml`, `.github/workflows/scorecard.yml`, `.github/dependabot.yml`, `.githooks/pre-commit`,
  `.gitignore`; invisible characters and irregular spaces in 15 product and test files written as escapes; stale
  `eslint-disable` comments removed; repository hygiene (below).
- Dependencies: none added. CI runs `@cyclonedx/cyclonedx-npm@6.0.1` (released 2026-08-11) through `npx`.
- Removed, recoverable in `C:\Claude_Code_Projects\_lero-al-removed-2026-11-06\`: `scripts/workflow-gates/`,
  `.claude/hooks/`, `governance-pr.yml`, `governance-scheduled.yml`, the receipt and phase rule files, every
  `*.security.json` sidecar, the Sprint 92 task files (935–946) and their evidence, 1 526 junk files (logs, backups, a
  generated Storybook bundle, four saved Google pages carrying API keys), ten `rows.jsonl` evidence files over 20 MB and
  one unparsable evidence CSS file.
- Out of scope: product behaviour (Tasks 926, 939, 948, 949), dependency versions and `.npmrc` (Task 947), the baseline
  review of every entry point and the authorization matrix (Task 950).

## Attack surface

Changed: CI permissions and secrets, agent permissions, the supply chain of actions and packages. Threat model:
- T1 Elevation (workflow token): a job writes to the repository → mitigate: `permissions: {}`, `contents: read` per job,
  `security-events: write` only for CodeQL and Scorecard, `id-token: write` only for Scorecard; zizmor gate.
- T2 Tampering (actions supply chain): a moved tag runs new code → mitigate: full-SHA pins at least two weeks old,
  Dependabot with a 14-day cooldown, Harden-Runner egress audit, OpenSSF Scorecard.
- T3 Information disclosure (secrets): `security-ci` secrets reach PR code → mitigate: only `authz` and `click-shield`
  use the environment; forked PRs get no environment secrets; `ci-target.mjs` refuses any project but the approved one;
  `check-files.mjs` and gitleaks refuse secrets in any file.
- T4 Tampering (agent): an agent rewrites its own rules, adds a package or deploys → mitigate: `ask` rules on policy
  files and `npm install`, `deny` on mutating Git and on every Vercel MCP write tool; the change report lists every
  sensitive path for the owner.
- T5 Tampering (dependencies): a hallucinated or brand-new package, or a lockfile pointing elsewhere → mitigate: the
  change report fails on a package missing from npm or younger than 30 days and on a non-registry lockfile entry.
- T6 Repudiation/bypass: an agent finishes with broken files, or a human merges without checks → mitigate: the Stop
  hook over every changed file, the pre-commit hook, `CI Required` in the `main` ruleset with signed commits.


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- AI_Agent_Security: "Implement per-tool permission scoping (read-only vs. write, specific resources)." — settings.json denies mutating Git and the agent loop blocks a failing write — AC1.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC6.
- Authorization: "Implement defense in depth. Do not depend on any single framework, library, technology, or control to be the sole thing enforcing proper access control." — the CI authorization regression on real RLS is one gate among lint, types and tests — AC6.
- Authorization_Decisions_And_Output_Handling: not applicable — the task builds gates; it changes no authorization decision of the product.
- Authorization_Patterns: not applicable — no product access check is moved or added by the CI and hook work.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — the CI job runs the authorization suite on every pull request — AC6.
- Authorization_Testing_Automation: not applicable — the authorization matrix itself is Task 950; this task only runs the existing suite.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the change reaches main only through the pull request with CI Required green, merged by the owner — AC6.
- Dependency_Graph_SBOM: "Validate the document against its format's schema before publication or ingestion" — the CI SBOM job generates and validates CycloneDX for the new tree — AC6.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the workflow keeps permissions: {} at the top and per-job grants (ci-workflow.test.mjs) — AC6.
- Injection_Prevention: "the values for commands and the relevant arguments should be both validated" — the quality scripts pass file names and arguments as array items; no value is joined into a command line — AC1.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC3.
- Key_Management: not applicable — no key is created; CI reads the existing repository secrets in the jobs that need them.
- LLM_Prompt_Injection_Prevention: "Enforce permissions and parameter validation at the tool boundary" — the hooks check each tool call outside the model (agent-check.mjs) — AC1.
- MCP_Security: "Grant each MCP server the minimum permissions needed for its function." — mutating Vercel MCP tools are denied in settings.json; agent-settings.test.mjs checks the list — AC1.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — install scripts stay off and every package with a script is reviewed (install-scripts.test.mjs) — AC6.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — the quality scripts start git and node with argument arrays, never a shell string — AC1.
- Secrets_Management: "Consider enabling secrets detection at the developer level to avoid checking secrets into code before commit/PR" — check-files scans every file for secrets and refuses environment files — AC2.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC2, AC3.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC1, AC2.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC6.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — the lockfile pins every version; CI installs with npm ci — AC6.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC6.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC1, AC2.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — the CI dependency audit runs npm audit on the changed tree — AC6.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 `node --test "scripts/quality/*.test.mjs"` — 44 pass: agent loop 9 (a src change without a test blocks the
  finish), file checks 17 (every AC names an automated test; stale paths and npm scripts), change report 5, changed-line
  coverage 5, ruleset 3, publication guard 5.
- AC2 `node scripts/quality/check-files.mjs --all` — 0 findings over every tracked and untracked-not-ignored file.
- AC3 `npx eslint .` and `npx tsc --noEmit` — 0 errors; `npm test -- --coverage` passes, then
  `node scripts/quality/changed-lines-coverage.mjs --base main` exits 0.
- AC4 `node scripts/check-click-shield.mjs --verify-gate` — "GATE IS FUNCTIONAL" after the Function constructor removal.
- AC5 `npx vitest run scripts/__tests__/map-changed-surfaces.test.ts scripts/__tests__/check-backlog-active.test.ts`
  — 8 pass; `npm run check:surface-census:changed:verify` — 12 of 12 arms; `npm run check:backlog-active` exits 0.
- AC6 `gh pr checks <reset PR>` shows every job green and **CI Required** green. Known red before 947, 948 and 939
  land on the branch (measured locally 2026-11-06): product checks `check:design-tokens:strict` and
  `check:enrolled-tailwind` (948), dependency audit (947), locale leak (939).
- AC7 `node scripts/quality/check-ruleset.mjs` exits 0 once the owner applies `scripts/quality/main-ruleset.json`
  (run daily by `repository-settings.yml`; tests in `check-ruleset.test.mjs`).

## Route

1. Owner: commit and push the branch, update PR #12 (commands in the handoff).
2. Owner: apply the ruleset; enable Dependabot alerts and security updates; run `git config core.hooksPath .githooks`
   in the working copy.
3. Opus: read the first CI run and the change report of PR #12; fix what is red for this task's cause.

## Review

Owner reads the diff and the change report; the first CI run is the evidence for AC6.
