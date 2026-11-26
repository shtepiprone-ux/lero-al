# Quality gates — what the tools check

Reference, not a checklist: the steps a model takes are in `checklists/`. This file says what each gate checks, for
reading a red job or writing an acceptance criterion.

Owner decisions 2026-11-06 (Task 945, governance reset): the gates are rewritten on the OWASP basis, and "quality must
cover all files in the project, without exceptions". Three layers check the same rules: the pre-commit hook, CI before
anything reaches `main`, and the daily CI run on `main` (owner, 2026-11-14: the local agent-loop hooks were removed; the
gates follow the GitHub workflow and the OWASP workflow). Basis: OWASP Secure Code
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
| `.json` | parses; in `package.json` every script runs a file that is in the repository and calls only scripts that exist; `messages/<locale>.json` gets `locale-safety.mjs` M1-M5 on every value (markup, dangerous schemes, plain http, ICU validity, placeholder parity with `sq`) at every commit and CI run (`locale`) |
| `.yml .yaml` | parses (all documents) |
| `.css` | parses (PostCSS) |
| `.sql` | strings, quoted identifiers, dollar quotes, comments and parentheses balanced |
| `.svg` | no script, event handler or `javascript:` URL |
| `.md` | every relative link resolves; outside records of the past (`docs/sessions/`, `docs/reviews/`, `docs/governance-reports/`, `docs/chat-gpt-reports/`, `docs/backlog-archive.md`, `tasks/`) every inline-code repository path is in the repository and every `npm run <script>` exists, unless the same line says the file was removed, is gitignored or will be created (`stale-path`); kickoffs from Sprint 93 on follow `kickoff-template.md` (first line, sections in order, ≤ 200 lines without the OWASP checklist, every `- AC<n>` names an automated test — §8 — and the OWASP gate: "## OWASP" names every sheet the kickoff triggers with a quote verified against the sheet text and existing AC references, and a reviewed kickoff has its record `docs/security/owasp/reviews/Task_<n>.json`, every verdict, quote and finding number checked — `scripts/quality/owasp.mjs`); a kickoff's "## Review" holds only links to its review files `docs/reviews/Task_<n>_Review_<k>.md`, in order, and each such file opens with `# Task <n> — Review <k>`, has a verdict line and is linked from its kickoff (`review`) |
| `.ps1` | PowerShell parser, no error (fails closed when no PowerShell is installed) |
| audit ledgers `docs/security/**/findings*.md` | the golden rule (`checklists/common.md` A4): every finding row ends `fixed` with the existing test or tool that proves it, `not a gap` with the existing test, `accepted` only with an owner decision `D<n>` and its test, or `Task N` of an open task whose kickoff cites the finding (its backlog row while it has no kickoff) (`finding-status`) |
| `.sh` and files with a sh/bash shebang (`.githooks/*`) | `bash -n` (fails closed when no bash is installed) |

"In the repository" means tracked or untracked-not-ignored, so a check gives the same answer on the agent's machine and
in CI. Modes: `--all`, `--worktree`, `--staged`, `--changed <base>`, named paths, `--stdin-list`. Tests:
`scripts/quality/check-files.test.mjs`.

## 2. ESLint — every authored JavaScript/TypeScript file

`eslint.config.mjs` lints `src/`, `scripts/`, `.storybook/` and the root configuration. Ignored only: build output,
Git-ignored local folders, recorded evidence under `docs/sessions/` (evidence is still parsed and scanned by §1), and
byte copies of third-party files under `public/vendor/`, each held by a test of its sha256 against the installed package
and of the version in `package-lock.json` (Task 1038, owner decision O1038-6, 2026-11-25).
Security rules on every file: `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url`, `react/no-danger`,
`no-irregular-whitespace` (strings, comments, regular expressions and templates included), `no-misleading-character-class`,
`no-control-regex`, `no-unsafe-finally`, `no-unsafe-negation`, `no-unsafe-optional-chaining`, `no-prototype-builtins`,
`no-new-wrappers`. An unused `eslint-disable` comment is an error. A disable comment names its reason after `--`. No warning is allowed
(`npm run lint` is `eslint --max-warnings 0`); `no-explicit-any` and `no-unused-vars` are errors, a binding a signature
needs but the body does not use starts with `_`.

## 3. Agent settings — `.claude/settings.json`

One hook only:

| Event | What runs | On failure |
|---|---|---|
| `SessionStart` | `owasp.mjs session`: re-reads the OWASP Cheat Sheet Series when the last read is a day old (`owasp.mjs sync --verify`, the registry is never rewritten here) and puts the reference's state, its findings first, and the `plan` / `review` commands into the session context (§6) | — (a failure to read upstream is reported in the context; the session still starts) |

Least privilege (AI Agent Security, MCP Security): `permissions.deny` refuses every mutating `git` command and every
Vercel MCP tool that creates, changes, deletes, deploys, promotes, rolls back or buys; the owner does those.
`permissions.ask` makes every edit of policy files (`.claude/**`, `CLAUDE.md`, `AGENTS.md`, `.github/**`, `.githooks/**`,
`scripts/quality/**`, `eslint.config.mjs`, `package.json`, `package-lock.json`, `.npmrc`) and every `npm install` wait for
the owner's approval. `scripts/quality/agent-settings.test.mjs` pins these denials, asks and the one hook, so a change that
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
| Dependency audit | `npm ci --ignore-scripts` (lockfile enforced), `audit-gate.mjs --omit-dev --level high` and `audit-gate.mjs --level high` (`npm audit` at that level; an advisory is let through only by an owner decision in `scripts/quality/audit-exceptions.json`, which stops matching when its range or the package's latest version changes or on its expiry date) | a high or critical advisory in any dependency that no owner decision accepts |
| Change report | `change-report.mjs`: product code changed with no test changed (§8), sensitive paths (rules, agents, CI, dependencies, lint/type/test config, runtime security config including `src/proxy.ts`, migrations and schema, security tests), deleted tests, fewer cases or assertions, new skip/only/todo, added dependencies with their age | product code changed with no test changed; an added package that does not exist on npm or is younger than 30 days; a lockfile entry outside `registry.npmjs.org` or without integrity. The rest is listed for the owner |
| OWASP task gate | `owasp.mjs cache`, then `owasp.mjs gate --base <base>` on every pull request and push (a schedule run changes nothing and passes): a change of anything but documentation carries a task whose last verdict is `APPROVED`, each approved review passes its record, and those records together judge every sheet the diff triggers; a version-only dependency update (manifest versions, lockfile, full-SHA action pins) is held by the dependency gates instead | code or configuration without an approved task; a review without its OWASP record; a sheet the diff triggers that no approved review judged |
| SBOM | CycloneDX of the production dependencies, validated, kept 90 days | generation or validation fails |
| CodeQL | `security-extended` for TypeScript/JavaScript and for the workflows | the analysis fails; alerts are triaged (high/critical fixed before merge) |
| Secret scan | the pinned, sha256-verified gitleaks binary over every commit of a pull request or push (base..head), the whole history on the daily run; `.gitleaksignore` holds only the fingerprints reviewed in Task 970 (both pinned by `scripts/quality/ci-secrets.test.mjs`) | any secret |
| Workflow security | zizmor over `.github/workflows` | any finding |
| Storybook build, Homepage grid, Locale leak ×6, Click-shield | product end-to-end checks; Click-shield first runs its own self-test (`npm run check:click-shield:verify`) | any failure |
| **CI Required** | all of the above | any job not `success` — the one check the `main` ruleset requires |

Also on GitHub: `scorecard.yml` (OpenSSF Scorecard, weekly and on `main`, results in code scanning);
`repository-settings.yml` (daily and on every ruleset change: `check-ruleset.mjs` compares the live `main` ruleset with
`scripts/quality/main-ruleset.json`, so a setting changed by hand shows as a failed run; not a merge gate, because the
ruleset is repository configuration that no PR can change); `.github/dependabot.yml` (npm and actions, weekly, 14-day cooldown, 30 days for a major;
security updates immediate). A Dependabot pull request is a signal, never merged (owner decision O972-4, 2026-11-17,
translated: "Dependabot PRs are not merged; updates go through tasks, as 972 does; secrets do not reach dependency code
no review has read"): the `SECURITY_CI_*` secrets stay out of the Dependabot secret store, so its pull requests fail the
jobs that need them, and the update it proposes is taken by a task branch. The reviewer also runs `node scripts/quality/check-ruleset.mjs` at the start of every
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

## 6. Where the gates run

Every job of §5 runs only on GitHub and is read with `gh pr checks <n>` and `gh run view <id> --log-failed`
(checklist A5). The commands a model runs locally are the ones its checklist names (`checklists/design.md`,
`execute.md`, `review.md`). The pre-commit hook (§4) runs on the owner's commit. `db-catalog-audit.mjs` and
`cloudinary-config.mjs` read the live database catalog and upload presets with `.env.local` credentials (the second
runs as `node --env-file=.env.local scripts/quality/cloudinary-config.mjs` and takes them from the environment only,
owner decision O963-1), so they are checklist steps, not CI jobs; their invariants are tested on fixtures in CI. `owasp.mjs` (tests:
`scripts/quality/owasp.test.mjs`): `sync` re-reads the OWASP Cheat Sheet Series into the registry, `check` fails on an
unmapped or changed sheet, a quote not in its sheet or a control file without its evidence text, `plan` and `review`
list the sheets a kickoff and a diff trigger, `session` puts the state into every session at its start (§3).

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
| Implementation | every test an AC names exists | the reviewer compares the kickoff's criteria with the diff (`checklists/review.md` V8) |
| Implementation | the test is written first and fails on the current code, then passes with the change; the report gives both runs | the reviewer reproduces the failure by undoing the product change in the working tree, rerunning, restoring |
| Every PR | the same rule over the whole PR; deleted tests, fewer cases or assertions, new `skip`/`only`/`todo` are listed | `change-report.mjs` (§5), hard failure |
| Every PR | every changed product file has at least one changed executable line run by a test, and at least 80 % of all changed executable lines run | `changed-lines-coverage.mjs` after `npm test -- --coverage` (§5) |
| Every PR, push and day | the whole suite passes | Unit and component tests (§5) |

A test is deleted together with the behaviour it pins; a test that only watches a legacy component is not written —
the component is migrated instead. Changed-line coverage is measured on `src/` (`vitest.config.ts` `coverage`);
`scripts/quality/` is tested by `node --test` in the quality job.

### 8.1 The tests a change reaches (D10, I8, V3)

Owner, 2026-11-26 (translated): "extend the rules according to the workflow, the pipelines, OWASP security and the
other best practices of 2026". Cause (Task 1053 Review 1, N1): the text search of D10, I8 and V3 matched a module's
alias path and its exported names, never a relative import from another folder or a test that reaches the module through
another one. Measured on the ten product files of Task 1053 at `aacf6ebce`: the Route's text search missed
`src/modules/cabinet/lib/__tests__/emailChangeErrors.security.test.ts` (`import … from '../../actions'`) and three tests
that reach `Header.tsx` through other modules; the import graph alone missed two tests that read source files as text
(`serverEntryGuards.test.ts`, `publicListingsTag.test.ts`) and five that import only types (`import type` is erased).
Practice: test impact analysis by the test runner's own module graph (Vitest `related`, the counterpart of Jest
`--findRelatedTests`), a text search for what a graph cannot see, and the whole suite in CI (§5) as the backstop; OWASP
basis as §8.

The tests a change reaches are the union of two searches; neither alone is enough.

1. **The import graph.** `npx vitest related --run --reporter=verbose <every changed or new file of the change>`
   (source files, configuration such as `eslint.config.mjs` or `vitest.config.ts`, fixtures). Vitest resolves the
   `@/` alias, relative paths, re-exports and transitive importers through the module graph its run uses
   (https://vitest.dev/guide/cli#vitest-related), and runs the tests it finds; the test files are the paths of its
   `✓` and `×` lines, its exit code is the run's. The integration collection (`*.integration.test.ts`, excluded from
   the default one): the same command with `--config vitest.integration.config.ts` and the environment of
   `project-facts.md` ("Supabase and test data"); it runs nothing when no integration test reaches the change. The
   graph cannot see a dynamic import whose path is computed, a type-only import, a file read as text, or a module
   named only in a `vi.mock` call.
2. **The text search, for what the graph cannot see.** `grep -rlE "<pattern>" src scripts --include=*.test.ts
   --include=*.test.tsx --include=*.test.mjs`, where the pattern joins, for each changed or new file: its path
   without `src/` and without the extension (`modules/cabinet/actions/index` and, for an `index` file, its folder
   `modules/cabinet/actions`), which matches the `@/` alias, a `src/…` path, a `vi.mock` path and a test that reads the
   file as text; a root file by its name (`eslint\.config`); and each exported name the change adds, moves, renames or
   removes (a type-only import of it). A match that is only a comment is named as such, never silently dropped. A
   relative import needs no pattern of its own: the graph sees it, and a type-only relative import of an unchanged
   name is held by `npm run typecheck` (`tsconfig.json` includes every test file), not by a test run.

Then: a test of the default collection found only by the text search runs with `npm test -- <files>`; a
`*.integration.test.ts` with `npm run test:security-integration -- <files>`; a `scripts/quality/*.test.mjs` with
`node --test <files>`. This is not the full run that A5 forbids: it runs only what the change reaches, and CI still runs
everything.
