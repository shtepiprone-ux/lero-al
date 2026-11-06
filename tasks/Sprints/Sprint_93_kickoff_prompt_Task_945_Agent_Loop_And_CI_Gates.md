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

## UI

No visible change.

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
