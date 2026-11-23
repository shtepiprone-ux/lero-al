# Task 1013 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_1013_CI_Browser_Install_From_A_Main_Only_Cache.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1013_CI_Browser_Install_From_A_Main_Only_Cache.md) · OWASP record: [Task_1013.json](../security/owasp/reviews/Task_1013.json)

Review 1 of the branch `task/1013-ci-browser-cache-main-only`, working tree on 07d4c76db (uncommitted) — APPROVED
Scope: the diff against 07d4c76db (the commit the implementation started from): `.github/workflows/ci.yml` (four hunks: the jobs `quality`, `homepage-grid`, `locale-leak`, `click-shield`), `scripts/quality/ci-browser-cache.test.mjs` (new); entry point: the browser install steps of those four jobs and the cache they restore
Tools: local commands below with their exit codes; CI is UNKNOWN until `gh pr checks <n>` after the owner's push (V14)
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: lowered; the browser jobs no longer depend on a slow Ubuntu mirror on pull requests, and the cache they restore is written only by a push to `main`.

The implementer of both files is an Opus session (the kickoff's "Implementer: Opus"); this review is a separate Opus session. Every claim of the report was rerun here, none is taken from the report.

## Tools (local, 2026-11-23)

- V1: `node scripts/quality/owasp.mjs sync` → 139 sheets at c2a1e3e32cec, 0 changed, exit 0; `node scripts/quality/owasp.mjs check` → exit 0; `node scripts/quality/check-ruleset.mjs` → the live ruleset matches, exit 0; `gh run list --branch main --limit 3` → CI run 45078916106 on 66e50d092 (#58) `success`; the two other runs are Dependabot updates, `success`.
- V3 and V8: `node --test scripts/quality/ci-browser-cache.test.mjs` → 3 passed, exit 0. `ci.yml` set to `git show HEAD:.github/workflows/ci.yml` (the product change undone) → 3 failed, exit 1; per job "the browser install (step n) follows a restore of", "has its own timeout-minutes" and "no main-only actions/cache/save" for `quality`, `homepage-grid`, `locale-leak`, `click-shield`. Break: the `if:` of the `locale-leak` save step removed → 1 failed ("locale-leak step 10: the cache is saved only under ..."), exit 1. Each time restored from a copy; `sha256sum` before and after → identical (ab382b81…); `git diff 9de067faf -- .github/workflows/ci.yml` → empty, exit 0; final run 3 passed, exit 0. The implementer's counts and failing cases reproduce.
- V3 (action): `gh api repos/actions/cache/git/ref/tags/v6.1.0` → commit 55cc8345863c7cc4c66a329aec7e433d2d1c52a9; `gh api repos/actions/cache/releases/tags/v6.1.0` → published 2026-06-26 (also the latest release); `restore/action.yml` and `save/action.yml` at that SHA → `node24`, `dist/restore-only`, `dist/save-only`.
- V7: `node scripts/quality/check-files.mjs .github/workflows/ci.yml scripts/quality/ci-browser-cache.test.mjs` → 0 findings, exit 0.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → 5 files, exit 0; record `docs/security/owasp/reviews/Task_1013.json` (every sheet of "## OWASP" and of the diff).

## Scope (V2) and the changed lines (V4)

- `git diff --stat HEAD` → `.github/workflows/ci.yml` 126+/3−; `git status --short` → that file and the new test. `git diff --stat main HEAD` → only the owner's documentation commit 07d4c76db (Route step 1). Exactly the Scope.
- `git diff 9de067faf -- .github/workflows/ci.yml` → empty: the file equals the source commit, whose diff against `main` is the four hunks `@@ -57`, `@@ -389`, `@@ -420`, `@@ -465` the kickoff names; the synthetic sweep hunks of Task 1012 are already on `main`.
- The test differs from `git show 9de067faf:scripts/quality/ci-browser-cache.test.mjs` in two lines only (`Task 957 AC17` → `Task 1013 AC1`, lines 2 and 60).
- Each of the four jobs (`.github/workflows/ci.yml:62-91`, `:424-453`, `:486-515`, `:562-591`): key step from `${ImageOS}-${ImageVersion}` and `require('playwright/package.json').version`; `actions/cache/restore` of `~/.cache/ms-playwright` and `~/.cache/playwright-apt` with the exact key and no `restore-keys`; cached `.deb` files copied into `/var/cache/apt/archives`; the install with `timeout-minutes: 8` (`:77`, `:439`, `:501`, `:577`); on a `main` push with a cache miss the downloaded `.deb` files copied back and `actions/cache/save` (`:85`, `:447`, `:509`, `:585`).
- The Cause (32.1 MB of archives fetched in 13 min 52 s inside the install step) is removed on a cache hit: Playwright 1.60.0 runs `apt-get update` then `apt-get install -y --no-install-recommends ...` (`node_modules/playwright-core/lib/coreBundle.js:27629-27636`), and `apt-get` uses a matching archive already in `/var/cache/apt/archives`. The runner image sets no `Keep-Downloaded-Packages` (`gh api repos/actions/runner-images/contents/images/ubuntu/scripts/build/configure-apt.sh` → retries, timeouts, assume-yes, phased updates, proxy settings only). INFERENCE: the `.deb` files stay in `/var/cache/apt/archives` after the install; the kickoff's post-merge read ("Need to get 0 B", install under 90 s) confirms it.
- Concurrent saves: on a `main` push with a miss, nine jobs (`quality`, `homepage-grid`, six `locale-leak` shards, `click-shield`) save the same key; `src/saveImpl.ts` at the pinned SHA catches every save error with `utils.logWarning` (lines 75-76), which prints `[warning]` through `core.info`, so the losing saves do not fail a job.

## Approved behaviour (V5)

Every job keeps its steps and their order (`git diff HEAD`: only steps inserted around the install; the install command is unchanged). Three install steps gain a `name:` where `main` had a bare `- run:`; the job names the `CI Required` check reads are unchanged. No visible surface.

## Exemptions (V6)

None: the diff adds or removes no allowlist, baseline, registry row, `skip`, `only`, `continue-on-error`, `|| true` or `eslint-disable` (`grep` on the diff and the test → no match).

## Secure code review (V7, secure-code-review.md §2 and §3)

- §2: no control weakened (no test, gate or step removed); the new input is the restored cache, written only by a push to `main`, which changes only through a reviewed pull request; a pull request run cannot write the `main` cache scope (the save step is skipped, and a pull request's own cache scope is not read by `main`); apt checks each cached `.deb` against the signed index; one new integration, `actions/cache` v6.1.0 by full SHA, GitHub's own action, released 2026-06-26; workflow `permissions: {}` and job `permissions: contents: read` unchanged; no `pull_request_target`.
- Authorization: not touched — `git diff --name-only HEAD` holds no Server Action, Route Handler or policy.
- Input and output: not touched — no request input; the shell steps use fixed paths, `compgen -G` globs and runner variables; no `${{ }}` expression in a `run:` of the new steps (asserted by the test, line 74).
- Authentication and sessions: not touched — no auth file in the diff.
- Requests and redirects: not touched — no site route or fetch in the diff.
- Next.js entry points: not touched — no file under `src/`.
- Business logic: not touched — no product code.
- JavaScript and TypeScript: touched — the test parses the committed workflow with `js-yaml` (already in `package-lock.json`, used by `ci-secrets.test.mjs` and `codeql-models.test.mjs`); its regular expressions are constants, anchored, with no nested quantifier.
- Data exposure, errors, logging: not touched — the new steps print nothing but the cache key; no secret is bound to them; `click-shield` keeps its secrets on the steps that read them.
- Files: not touched — no upload.
- Dependencies and configuration: touched — `actions/cache/restore` and `actions/cache/save` pinned by full SHA (`.github/workflows/ci.yml:67`, `:86` and the same in the three other jobs); the save runs only under `github.event_name == 'push' && github.ref == 'refs/heads/main'`; no lockfile change.
- Agent and tool output: `check-files.mjs` → 0 findings on the two files; the CI change is the owner's decision O957-6 (2026-11-19) and is listed here for the owner's approval in the pull request.
- Tests: one new test file, none removed or weakened; every case fails without its control (V3, V8).

## Stories (V9)

No Story changed; the change has no visible surface.

## Findings

None.

## Open parts

- Opus, after the owner's push: `gh pr checks <n>` until every check concluded (AC2, V14).
- Opus, after the merge (AC1, second half): `gh run list --branch main --limit 3`, then `gh run view <id> --log` of the first `main` run (the cache saved) and of the next one (the install step under 90 s, "Need to get 0 B" of packages).
- The checklist contradiction reported with this review (I4 and I8 named only `npm test -- <file>`, while `vitest.config.ts` excludes `scripts/quality/**` and `quality-gates.md` §8 runs those tests with `node --test`) is fixed in `.claude/rules/checklists/execute.md` I4 and I8 at the owner's order of 2026-11-23 ("fix the text"), recorded in `.claude/rules/flow.md`.
