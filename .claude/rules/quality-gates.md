# Quality gates

Owner decisions 2026-11-06 (Task 945, governance reset): the gates are rewritten on the OWASP basis, and "quality must
cover all files in the project, without exceptions". Four layers check the same rules: the agent loop while files are
written, the pre-commit hook, CI before anything reaches `main`, and the daily CI run on `main`. Basis: OWASP Secure Code
Review (tools before people), Secure Coding with AI, AI Agent Security, MCP Security, Secrets Management, CI/CD Security,
GitHub Actions Security, NPM Security, Vulnerable Dependency Management, Software Supply Chain Security, SBOM,
Authorization Regression Testing, JavaScript and TypeScript Security.

## 1. Every file — `scripts/quality/check-files.mjs`

Every tracked and untracked-not-ignored file gets the universal checks, then the check of its type. Nothing is skipped
by path; a file that cannot meet a rule is fixed, moved out of the repository, or (mojibake only, for files that quote
mojibake on purpose) listed in `scripts/mojibake-allowlist.json` with a reason in the PR.

| Files | Check |
|---|---|
| all | no log/backup/scratch file (`.log .bak .nul .orig .rej .tmp .swp`), no build output or tool scratch folder, no environment file other than `.env.example`; ≤ 20 MB; binary types match their signature; text is valid UTF-8 without NUL; BOM only at the start of `.ps1`; no invisible, bidi, tag or control character (Trojan Source, hidden prompt text); no merge-conflict marker; no secret (private key, GitHub, AWS, Stripe live, JWT, Supabase secret, Slack, Google API, npm, Vercel tokens); no mojibake |
| `.ts .tsx .mts .cts .js .jsx .mjs .cjs` | parses (TypeScript parser); plus ESLint (§2) and `tsc`; product code under `src/` also gets the client-sink rules K1-K8 of `client-sinks.mjs` and the translation-bypass rule M6 of `locale-safety.mjs` on its own text (`client-sink`, `locale`) |
| `.json` | parses; in `package.json` every script runs a file that is in the repository and calls only scripts that exist; `messages/<locale>.json` gets `locale-safety.mjs` M1-M5 on every value (markup, dangerous schemes, plain http, ICU validity, placeholder parity with `sq`) at every write, commit and CI run (`locale`) |
| `.yml .yaml` | parses (all documents) |
| `.css` | parses (PostCSS) |
| `.sql` | strings, quoted identifiers, dollar quotes, comments and parentheses balanced |
| `.svg` | no script, event handler or `javascript:` URL |
| `.md` | every relative link resolves; outside records of the past (`docs/sessions/`, `docs/reviews/`, `docs/governance-reports/`, `docs/chat-gpt-reports/`, `docs/backlog-archive.md`, `tasks/`) every inline-code repository path is in the repository and every `npm run <script>` exists, unless the same line says the file was removed, is gitignored or will be created (`stale-path`); kickoffs from Sprint 93 on follow `kickoff-template.md` (first line, sections in order, ≤ 200 lines without the OWASP checklist, every `- AC<n>` names an automated test — §8 — and the OWASP gate: "## OWASP" names every sheet the kickoff triggers with a quote verified against the sheet text and existing AC references, and a reviewed kickoff has its record `docs/security/owasp/reviews/Task_<n>.json`, every verdict, quote and finding number checked — `scripts/quality/owasp.mjs`) |
| `.ps1` | PowerShell parser, no error (fails closed when no PowerShell is installed) |
| audit ledgers `docs/security/**/findings*.md` | the golden rule (`flow.md`): every finding row ends `fixed` with the existing test or tool that proves it, `not a gap` with the existing test, `accepted` only with an owner decision `D<n>` and its test, or `Task N` of an open task whose kickoff cites the finding (its backlog row while it has no kickoff) (`finding-status`) |
| `.sh` and files with a sh/bash shebang (`.githooks/*`) | `bash -n` (fails closed when no bash is installed) |

"In the repository" means tracked or untracked-not-ignored, so a check gives the same answer on the agent's machine and
in CI. Modes: `--all`, `--worktree`, `--staged`, `--changed <base>`, named paths, `--stdin-list`. Tests:
`scripts/quality/check-files.test.mjs`.

## 2. ESLint — every authored JavaScript/TypeScript file

`eslint.config.mjs` lints `src/`, `scripts/`, `.storybook/` and the root configuration. Ignored only: build output,
Git-ignored local folders and recorded evidence under `docs/sessions/` (evidence is still parsed and scanned by §1).
Security rules on every file: `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url`, `react/no-danger`,
`no-irregular-whitespace` (strings, comments, regular expressions and templates included), `no-misleading-character-class`,
`no-control-regex`, `no-unsafe-finally`, `no-unsafe-negation`, `no-unsafe-optional-chaining`, `no-prototype-builtins`,
`no-new-wrappers`. An unused `eslint-disable` comment is an error. A disable comment names its reason after `--`. No warning is allowed
(`npm run lint` is `eslint --max-warnings 0`); `no-explicit-any` and `no-unused-vars` are errors, a binding a signature
needs but the body does not use starts with `_`.

## 3. Agent loop — `scripts/quality/agent-check.mjs` (Claude Code hooks, `.claude/settings.json`)

It reads the hook payload, Git's list of changed files and the files; it parses no shell command. A crash of the check is
a blocking finding, never a pass.

| Event | What runs | On failure |
|---|---|---|
| `SessionStart` | records the files already changed, so the session answers for what it changes; re-reads the OWASP Cheat Sheet Series when the last read is a day old (`owasp.mjs sync --verify`, the registry is never rewritten here) and puts the reference's state, its findings first, and the `plan` / `review` commands into the session context (§6) | — (a failure to read upstream is reported in the context; the session still starts) |
| `PostToolUse` Edit / Write / MultiEdit / NotebookEdit | §1 on the written file (any type); ESLint when it is code | the findings go back to the agent at once (exit 2) |
| `Stop` / `SubagentStop` | every file changed since the session start or the last clean stop, by any tool (Bash included): §1, ESLint for code, `tsc --noEmit` on the whole project when TypeScript changed, `vitest related --run` for changed `src/` code, product code under `src/` changed with no test file added or changed (§8), and a started task (the session added a test its kickoff names) with a named test still missing (`ac-tests.mjs`; tests on Opus-owned paths are left to the review) | the stop is blocked, up to 3 times; after that the agent must report the work as **not done** |

Least privilege (AI Agent Security, MCP Security): `permissions.deny` refuses every mutating `git` command and every
Vercel MCP tool that creates, changes, deletes, deploys, promotes, rolls back or buys; the owner does those.
`permissions.ask` makes every edit of policy files (`.claude/**`, `CLAUDE.md`, `AGENTS.md`, `.github/**`, `.githooks/**`,
`scripts/quality/**`, `eslint.config.mjs`, `package.json`, `package-lock.json`, `.npmrc`) and every `npm install` wait for
the owner's approval. `scripts/quality/agent-settings.test.mjs` pins these denials, asks and hooks, so a change that
loosens them fails CI unless the test changes too (AI Agent Security: "Block releases when high-risk tool policies …
change without updated tests"). Rules files are security-critical configuration (Secure Coding with AI): they change only at the
owner's request and every change is listed in the PR's change report.

## 4. Pre-commit — `.githooks/pre-commit`

The staged version of every staged file gets §1; staged code gets ESLint. Enabled once per clone by the owner
(`git config core.hooksPath .githooks`). CI repeats every check, so a skipped hook never lets a defect reach `main`.

## 5. CI — `.github/workflows/ci.yml`

Every PR to `main`, every push to `main`, and **daily** (new advisories and new CodeQL and secret rules reach unchanged
code). `permissions: {}` at workflow level, read-only per job; every action pinned to a full commit SHA at least two
weeks old; `persist-credentials: false`; Harden-Runner (audit) first in every job; no `pull_request_target`; secrets
only in the `security-ci` environment and only in the jobs that need them.

| Job | Checks | Blocks merge when |
|---|---|---|
| Lint, types and product checks | `owasp.mjs sync --verify` (the OWASP Cheat Sheet Series upstream equals `docs/security/owasp/sheets.json`; the sheet texts are cached for the quote checks), `owasp.mjs check` (every sheet mapped at its current version, every quote in its sheet, every control's evidence in its file), ESLint (§2), `tsc --noEmit`, every `scripts/quality/*.test.mjs`, `check-files.mjs --all` (§1), `product-gates.mjs` (i18n, design system, UI contract, Stories, hydration, DB grants, listing visibility, active-only backlog — GR-5) | any error or finding |
| Unit and component tests | `npm run build`, then `npm test -- --coverage` with no focused tests and no retries, then `changed-lines-coverage.mjs` (§8) | any failing test; a changed product line set below the coverage rule |
| Authorization regression | `ci-target.mjs` (only the approved development Supabase project), then `npm run test:security-integration` against real Auth and RLS | any failing case |
| Dependency audit | `npm ci --ignore-scripts` (lockfile enforced), `npm audit --omit=dev --audit-level=high` | a high or critical advisory in a production dependency |
| Change report | `change-report.mjs`: product code changed with no test changed (§8), an AC's named test missing or not changed with its AC (§8), sensitive paths (rules, agents, CI, dependencies, lint/type/test config, runtime security config including `src/proxy.ts`, migrations and schema, security tests), deleted tests, fewer cases or assertions, new skip/only/todo, added dependencies with their age | product code changed with no test changed; an AC test finding; an added package that does not exist on npm or is younger than 30 days; a lockfile entry outside `registry.npmjs.org` or without integrity. The rest is listed for the owner |
| OWASP task gate | `owasp.mjs cache`, then `owasp.mjs gate --base <base>` on every pull request and push (a schedule run changes nothing and passes): a change of anything but documentation carries a task whose last verdict is `APPROVED`, each approved review passes its record, and those records together judge every sheet the diff triggers; a version-only dependency update (manifest versions, lockfile, full-SHA action pins) is held by the dependency gates instead | code or configuration without an approved task; a review without its OWASP record; a sheet the diff triggers that no approved review judged |
| SBOM | CycloneDX of the production dependencies, validated, kept 90 days | generation or validation fails |
| CodeQL | `security-extended` for TypeScript/JavaScript and for the workflows | the analysis fails; alerts are triaged (high/critical fixed before merge) |
| Secret scan | gitleaks over the history | any secret |
| Workflow security | zizmor over `.github/workflows` | any finding |
| Storybook build, Homepage grid, Locale leak ×6, Click-shield | product end-to-end checks | any failure |
| **CI Required** | all of the above | any job not `success` — the one check the `main` ruleset requires |

Also on GitHub: `scorecard.yml` (OpenSSF Scorecard, weekly and on `main`, results in code scanning);
`repository-settings.yml` (daily and on every ruleset change: `check-ruleset.mjs` compares the live `main` ruleset with
`scripts/quality/main-ruleset.json`, so a setting changed by hand shows as a failed run; not a merge gate, because the
ruleset is repository configuration that no PR can change); `.github/dependabot.yml` (npm and actions, weekly, 14-day cooldown, 30 days for a major;
security updates immediate). The reviewer also runs `node scripts/quality/check-ruleset.mjs` at the start of every
review.

GitHub settings (owner): secret scanning and push protection on; Dependabot alerts and security updates on; the `main`
ruleset (`scripts/quality/main-ruleset.json`) requires a PR, squash merge, linear history, signed commits and the
`CI Required` check, and refuses deletion and force push. Applied by the owner with
`gh api -X PUT repos/shtepiprone-ux/lero-al/rulesets/26303244 --input scripts/quality/main-ruleset.json`.
Constraint, not a choice: GitHub does not let an author approve their own PR, so a required approving review or
CODEOWNERS approval is impossible with one maintainer. Compensating controls (Threat Modeling: mitigate): the Opus review
of every PR (`secure-code-review.md`), the change report's list of sensitive paths the owner reads line by line, the
hard failures of §5, and the ruleset drift check. When a second maintainer joins, the ruleset adds one required approval
and CODEOWNERS for the sensitive paths.

## 6. Running the gates locally

```
npm run lint
npm run typecheck
npm test
node scripts/quality/owasp.mjs sync
node scripts/quality/owasp.mjs check
node scripts/quality/owasp.mjs plan <kickoff>
node scripts/quality/owasp.mjs review <kickoff> --base main
node scripts/quality/check-files.mjs --all
node --test "scripts/quality/*.test.mjs"
npm test -- --coverage
node scripts/quality/changed-lines-coverage.mjs --base main
node scripts/quality/product-gates.mjs
node scripts/quality/check-ruleset.mjs
node scripts/quality/change-report.mjs main HEAD
node scripts/quality/ac-tests.mjs --base main <kickoff>
npm audit --omit=dev --audit-level=high
node scripts/quality/client-sinks.mjs
node scripts/quality/locale-safety.mjs
node scripts/quality/audit-coverage.mjs
node scripts/quality/db-catalog-audit.mjs
node scripts/quality/cloudinary-config.mjs
```

`owasp.mjs` keeps the project synchronised with the OWASP Cheat Sheet Series (owner request 2026-11-07): `sync` reads
the upstream repository the site is built from (`GITHUB_TOKEN` or `GH_TOKEN` raises the API limit), writes the registry
and caches the sheet texts in `.cache/owasp/` (ignored); `check` fails on an unmapped, renamed or changed sheet, a quote
not in its sheet, a control file without its evidence text, a task number that is not open, or a requirement handed to a
task whose kickoff does not cite it; the registry older than 7 days fails too, so the daily CI run and every design
step re-read upstream. The agent loop puts the state into every session at its start (§3). Tests:
`scripts/quality/owasp.test.mjs`, `scripts/quality/agent-check.test.mjs`.

`client-sinks.mjs` (every line of product code: postMessage to `*`, message listeners without an origin check,
`outerHTML` / `insertAdjacentHTML`, credential-like storage, stored URLs as `href`, DOM HTML / code / URL APIs, computed
navigation, each `dangerouslySetInnerHTML`; `src/__tests__/security/clientSinks.test.ts`
covers the other client sinks), `locale-safety.mjs` (every value of `messages/*.json`: markup, dangerous schemes, plain
http, ICU validity, placeholder parity between locales, bypassing translation calls) and `audit-coverage.mjs` (every
tracked file in a lane) run in CI through their self-tests. `db-catalog-audit.mjs` and `cloudinary-config.mjs` read the live database catalog and the live upload presets
with `.env.local` credentials (the database CA in `prod-ca-2021.crt` or `SUPABASE_CA_FILE`); they are not CI jobs because
CI holds no production credential. They are steps of `create-task`, `execute-task`, `review-task` and
`secure-code-review.md` §1.5, and their invariants are tested on fixtures in CI.

## 7. Changing a gate

A gate is changed only to make it more accurate (it reported something that is not a defect, or missed one), never to
make a failing change pass. The change states which case was wrong and adds a test for it. A dependency advisory is
fixed by updating the dependency and running the tests (Vulnerable Dependency Management, case 1); silencing the scanner
or bumping a version string is not a fix.

## 8. Every change is covered by a test

Owner, 2026-11-06: "a task done → create a test for it; a task changed → update the test after execution; all changes
must automatically be covered by tests". OWASP basis: Secure Code Review (verify behaviour with tests, not reading
alone), Authorization Regression Testing (each access rule is a test case), Verifying Third Party Agent Execution
Evidence (the evidence is a test the reviewer reruns, not the agent's report).

| When | Rule | Enforced by |
|---|---|---|
| Task design | every `- AC<n>` names an automated test: a test file (`.test.`/`.spec.`), a Story with a `play` function, or a command in backticks that exits non-zero on failure (`npm …`, `npx …`, `node …`, `gh …`). A visual criterion names the Story and the check that pins it | `check-files.mjs` kickoff rule (§1): the kickoff fails its checks |
| Task revision | a changed or added AC changes or adds its test in the same revision | the same rule; the reviewer checks each changed AC against its test |
| Implementation | every test an AC names exists, and every AC that is new or changed against the base has its named test added or changed in the same change. An AC that only reruns an existing check names a command, not the test file | `agent-check.mjs` `Stop` blocks the executor's finish while a started task's named test is missing (§3); `ac-tests.mjs --base main <kickoff>` (the executor before reporting, the reviewer before the verdict); `change-report.mjs` on every PR for each implemented kickoff — a verdict, or a named test the PR adds, even when the kickoff itself is not edited (§5), hard failure |
| Implementation | the test is written first and fails on the current code, then passes with the change; the report gives both runs | the reviewer reproduces the failure by undoing the product change in the working tree, rerunning, restoring |
| Every agent session | product code under `src/` changed while no test file was added or changed | `agent-check.mjs` `Stop` (§3) blocks the finish |
| Every PR | the same rule over the whole PR; deleted tests, fewer cases or assertions, new `skip`/`only`/`todo` are listed | `change-report.mjs` (§5), hard failure |
| Every PR | every changed product file has at least one changed executable line run by a test, and at least 80 % of all changed executable lines run | `changed-lines-coverage.mjs` after `npm test -- --coverage` (§5) |
| Every PR, push and day | the whole suite passes | Unit and component tests (§5) |

A test is deleted together with the behaviour it pins; a test that only watches a legacy component is not written —
the component is migrated instead. Changed-line coverage is measured on `src/` (`vitest.config.ts` `coverage`);
`scripts/quality/` is tested by `node --test` in the quality job.
