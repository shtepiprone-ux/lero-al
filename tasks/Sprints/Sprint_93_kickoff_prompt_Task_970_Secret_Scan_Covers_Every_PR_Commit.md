# Task 970 — The secret scan covers every commit of a pull request, and main's secret scan is green again

Sprint 93 (governance reset). Priority P1. Owner decision D2 (2026-11-06): "Quality must cover all files in the project,
without exceptions"; golden rule (2026-11-07): a gap found is closed, not reported. Found by Opus on 2026-11-09 in the
first `main` run after PR #19 merged.
Implementer: Opus (CI; the owner asks for the workflow change by assigning this task). Reviewer: Opus in a separate
session, never the implementing one. Human owner of the change: the owner.

## Goal

The `main` CI run of `b1c7b4147` (PR #19 squash, run 42695364395) fails "Secret scan (gitleaks)": `gitleaks detect
--log-opts=-1` reports one `generic-api-key` (entropy 3.66) at `scripts/lib/__tests__/redact-log.test.ts:17`, the
redaction test's fake key in an `apikey=` query parameter. It is no secret, but the scan of the PR passed: its command was
`--log-opts=--no-merges --first-parent 083129ce1^..0115c131c` (run 42690395258), and those are commits 1 and 30 of the
PR's 60 (`gh api "repos/shtepiprone-ux/lero-al/pulls/19/commits?per_page=100"`). The line came in commit 57
(`a3ece5e68`, Task 951), so it was never scanned before the merge. `gitleaks/gitleaks-action@e0c47f4f` (v3.0.0,
`.github/workflows/ci.yml:286`) takes the PR's range from one page of the commits API (30 entries), so any PR with more
than 30 commits lands its later commits unscanned. `scripts/quality/check-files.mjs` (the local secret check) does not
match this rule either.

The daily run (`schedule`, `.github/workflows/ci.yml:12-14`) has never run on `main` (the workflow reached it with
`b1c7b4147`). gitleaks 8.24.3 over the whole `main` history (Opus, 2026-11-09, 1820 commits, the Windows build checked
against the release checksums) finds 22 matches in 6 fingerprints, none a project secret: the fake key above; a
Google OAuth `authError` code in `docs/sessions/evidence/task927/review-11/rv11-07-authorize-probe.txt:14`; Google's
own public page keys in two saved Google documentation pages (`gcp-api-key`, deleted at HEAD); `o=e.key` in a minified
Storybook bundle and "token, …" in the Task 646 kickoff (both deleted at HEAD). History cannot change, so the first
daily run would fail on them.

After the task the secret scan of a PR covers every commit from the PR base to its head, a push covers every commit it
adds, the daily run covers the whole history with exactly these 6 reviewed fingerprints ignored, the scanner binary is
pinned by version and checksum, and the redaction test holds no complete key-shaped value, so `main`'s next run is
green.

## Scope

- `.github/workflows/ci.yml`, job `secrets`: replace `gitleaks/gitleaks-action` with a step that downloads
  `gitleaks_8.24.3_linux_x64.tar.gz` from the `gitleaks/gitleaks` v8.24.3 release (published 2025-04-11), checks its
  sha256 `9991e0b2903da4c8f6122b5c3186448b927a5da4deef1fe45271c3793f4ee29c` (release `gitleaks_8.24.3_checksums.txt`)
  and fails on a mismatch, then runs `gitleaks git --redact -v --exit-code=2 --log-opts="--no-merges <BASE>..<HEAD>"`
  with BASE = `github.event.pull_request.base.sha` on a pull request and `github.event.before` on a push (`-1` when
  `before` is all zeros), and with no range (the whole history) on `schedule` and `workflow_dispatch`; every value
  passed through `env:`, never interpolated into `run:`; `fetch-depth: 0`, `persist-credentials: false` and
  `permissions: contents: read` stay; no secret is bound.
- New `.gitleaksignore`: exactly the 6 fingerprints of Goal, each under a comment saying why it is no secret; its path
  joins the Secrets_Management path triggers in `docs/security/owasp/controls.json` (`owasp.mjs check` O9).
- `scripts/quality/ci-workflow.test.mjs`: a test that the `secrets` job uses no `gitleaks/gitleaks-action`, pins the
  version and the sha256 above and checks it before extracting, scans `<BASE>..<HEAD>` from the event's base on pull
  requests and pushes and the whole history on the daily run, and that `.gitleaksignore` holds exactly the 6 reviewed
  fingerprints (a new one changes the test, so it is reviewed); with a planted case for the old job.
- `scripts/lib/__tests__/redact-log.test.ts:17`: the fake key built from parts (`['ANONKEY', '9876543'].join('')`), as
  the file already does for its JWT (`:9`); the case still proves the redaction.
- Revision 1 (review 1, F1 and F2): the step refuses a `.gitleaks.toml` in the checkout; `scripts/quality/change-report.mjs`
  lists `.gitleaksignore` and `.gitleaks.toml` as sensitive and every added line with the inline allow marker; the
  ci-workflow test runs the step's script with stubs (AC7, AC8).
- Out of scope: `scripts/quality/check-files.mjs` rules (a gitleaks rule set there is a separate decision), other jobs.
- Dependencies: none new in `package.json`; gitleaks 8.24.3 is the version the action already installed (run logs).

## Attack surface

Changed: the CI secret-scan job downloads and runs a binary. Threat: a tampered download (mitigated by the pinned
sha256 checked before extraction, AC2); an injected ref or SHA in the shell (mitigated: event values through `env:`,
zizmor in CI, AC2); a commit range that misses commits (eliminated: base..head of the event, AC1, AC3); an ignore entry
that hides a real secret (mitigated: each of the 6 read and judged in Goal, the list pinned by the test, AC6). The job keeps
read-only contents permission and no secret. No product code, data or user-facing path changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (a13983001cb3, mapping of 2026-11-09).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the new download-and-run step is named in Attack surface with its three threats and their tests — AC1, AC2.
- Authorization: not applicable — "authorize" names an evidence file the scan reads; no access decision changes.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision or output path is touched by a CI scan change.
- Authorization_Patterns: not applicable — the OAuth probe file is evidence text; no authorization pattern is designed or changed.
- Authorization_Regression_Testing: not applicable — no role, policy or route changes; the authz CI job is untouched.
- Authorization_Testing_Automation: not applicable — no authorization rule changes, so no new authorization test is due.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the scan that guards every PR now sees all of its commits, so no commit reaches `main` unscanned; the change itself lands through a reviewed PR — AC1, AC3, AC5.
- Cryptographic_Storage: not applicable — sha256 is used only to verify a downloaded file; nothing is stored or encrypted.
- Dependency_Graph_SBOM: not applicable — `package.json` is named only to say it does not change; the SBOM job is untouched.
- GitHub_Actions_Security: "it must be treated as a critical asset, potentially even more critical than the source code it processes" — the job keeps read-only contents and no secret, event values pass through `env:`, zizmor runs on the change — AC2.
- Injection_Prevention: "the values for commands and the relevant arguments should be both validated" — the commit range comes from event SHAs through `env:`, never interpolated into `run:`, and the test asserts it — AC2.
- JSON_Web_Token: not applicable — the word names the test's existing parts-built fixture; no token handling changes.
- JavaScript_and_TypeScript_Security: not applicable — the test fixture's literal is split into two parts; no regex, merge or input handling changes.
- Key_Management: not applicable — the scan finds keys but none is created, stored or rotated by this task.
- NPM_Security: not applicable — no npm package is added; the scanner is a pinned release binary, not an npm install.
- OAuth2: not applicable — the Google OAuth `authError` is an error code in old evidence; no OAuth flow or client changes.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — the CI step runs one fixed command with the range in an environment variable; no OS call is added to project code — AC2.
- Secrets_Management: "Consider enabling secrets detection at the developer level to avoid checking secrets into code before commit/PR" — the CI secret detection now covers every PR commit, and the fake key no longer looks like a real one — AC1, AC3, AC4.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the reviewing session reads the workflow and test diff and reruns AC1 to AC5 — AC1, AC2, AC5.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the release checksum is taken from the release's own checksums file, not from memory, and the reviewer refetches it — AC2.
- Secure_Product_Design: not applicable — no product feature is designed; only a CI gate's commit range and download change.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — gitleaks is pinned to 8.24.3 and its sha256 is checked before it runs — AC2.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — Attack surface states what changes, what can go wrong (tampered binary, injected range, missed commits) and what is done about each — AC1, AC2, AC3.
- User_Privacy_Protection: not applicable — the scan reads repository history only; no personal data is collected or shown.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reads the PR run's scan log and counts the PR's commits itself — AC3.
- Vulnerable_Dependency_Management: not applicable — no dependency is added or upgraded; the scanner version stays 8.24.3.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A pull request's secret scan covers every commit from its base — test: `node --test scripts/quality/ci-workflow.test.mjs`
  (new case; red on today's workflow, which uses `gitleaks/gitleaks-action`).
- AC2 The scanner is pinned and verified, and event values reach the shell only through `env:` — test:
  `node --test scripts/quality/ci-workflow.test.mjs` (the same case asserts version, sha256 check before run, `env:`),
  and the CI "Workflow security (zizmor)" job is green.
- AC3 The PR of this task scans all of its commits and finds no leak — test: `gh run view <run> --log` of the PR's
  "Secret scan (gitleaks)" job shows the command with `<base>..<head>` of the PR and "N commits scanned" equal to
  `gh pr view <n> --json commits --jq '.commits | length'`.
- AC4 The redaction case still proves the redaction — test: `npx vitest run scripts/lib/__tests__/redact-log.test.ts`.
- AC6 The daily run scans the whole history and ignores only the 6 reviewed fingerprints — test:
  `node --test scripts/quality/ci-workflow.test.mjs` (the whole-history branch of the step and the exact ignore list),
  and the reviewer's local gitleaks 8.24.3 run over `origin/main` with `.gitleaksignore` reports no leak.
- AC5 `npm run lint`, `node scripts/quality/check-files.mjs --worktree`, `node scripts/quality/ac-tests.mjs --base main <kickoff>`
  exit 0, and the first `main` run after the merge has "Secret scan (gitleaks)" green (`gh run list --branch main --limit 3`).
- AC7 (review 1, F1) No change silences the scan unseen: the step refuses to scan when the checkout holds a
  `.gitleaks.toml`, and the change report lists `.gitleaksignore` and `.gitleaks.toml` as sensitive paths and every added
  line carrying the inline allow marker of gitleaks — test: `node --test scripts/quality/ci-workflow.test.mjs` (the step
  run with a planted `.gitleaks.toml` exits non-zero before the scanner runs) and `node --test scripts/quality/change-report.test.mjs`
  (planted cases for both paths and for an added marker line).
- AC8 (review 1, F2) The AC1/AC2 test runs the step's script, not its spelling — test: `node --test scripts/quality/ci-workflow.test.mjs`
  runs the `run:` block under bash with a stub download and a stub scanner that records its arguments, and asserts the
  exact `--log-opts` for `pull_request`, `push`, `push` with an all-zero `before`, `schedule` and `workflow_dispatch`, that
  a checksum mismatch fails before extraction and before the scanner, and that a scanner exit 2 fails the step; each of
  the four mutations of review 1 (M3, M4, M6, M7) turns it red.

## Route

1. Write the AC1/AC2 test; run it red. Change the `secrets` job; run it green; deliberate break: a wrong sha256 in the
   test's expectation fails, restored.
2. Change the fixture; run AC4.
3. Run AC5's local commands; the owner opens the PR; read AC3 from its run; after the merge read AC5's `main` run.

## Review

Review 1 of the working tree on b1c7b4147 — NEEDS REVISION (1 of 2)
Scope: diff-based; every changed file read in full (`ci.yml` job `secrets`, `.gitleaksignore`, `ci-workflow.test.mjs`,
`redact-log.test.ts`, `controls.json`, `backlog.md`, this kickoff); OWASP record `docs/security/owasp/reviews/Task_970.json`.
Tools (2026-11-09, reviewer reruns): `owasp.mjs sync` 0 changed, `check` 0; `check-ruleset` 0 (squash only, so
`--no-merges` drops nothing on `main`); lint 0; typecheck 0; quality tests 152/152; `ci-workflow.test.mjs` 13/13;
`redact-log.test.ts` 14/14; changed-lines coverage 0; `check-files --worktree` 0, `--all` 0; `product-gates.mjs` 36/36;
`npm audit --omit=dev --audit-level=high` 0; `ac-tests` PASS; `classify` misses `.gitleaksignore` (F1). CI not run.
gitleaks 8.24.3 (`gitleaks_8.24.3_checksums.txt` fetched by the reviewer: linux_x64 `9991e0b2…ee29c` equals the pin, the
tarball holds `gitleaks` at its root): `origin/main` (`b1c7b4147`) 1820 commits, no leaks; without the ignore file 22
matches in exactly the 6 fingerprints, each judged no secret (the fixture; `authError` decodes to Google's
`redirect_uri_mismatch` text; 9 `AIza` keys of `developers.google.com` page configuration, in no project env file or
`src/`; minified code; kickoff prose). PR #19 by the new logic: `--no-merges d8a07a3c7..f7838ca9a`, 60 commits scanned
(= `gh pr view 19`), 1 leak, the fixture; run 42690395258 logged `083129ce1^..0115c131c`, "30 commits scanned".
Mutations (restored, sha equal): main's job, wrong sha256, daily `-1`, an ignore entry removed or added: red. `|| true`
after the checksum (M3), `--first-parent -30` in the PR range (M4), a `pull_request) range="-1"` branch (M6), `|| true`
after the scanner (M7): green (F2).
Findings: Critical 0, High 0, Medium 2, Low 0.

F1 — The scan obeys suppressions a pull request adds without any review flag
Severity: Medium      Category: Dependencies and configuration      CWE: CWE-693
Location: `.github/workflows/ci.yml:309` (the scanner run on `.`); `scripts/quality/change-report.mjs:32` (`SENSITIVE`)
Description: gitleaks loads `<source>/.gitleaks.toml` ahead of its default rules and honours an inline allow marker on a
line. On a pull request the checkout is the PR's merge tree, so a PR can add either one next to a secret and the scan
passes. Neither `.gitleaks.toml` nor `.gitleaksignore` is a sensitive path of the change report, and no test or step
refuses them. The kickoff names "an ignore entry that hides a real secret" and closes it for `.gitleaksignore` only
(the pinned list makes a new entry change `scripts/quality/`, which is flagged); the other two channels stay open. The
old action behaved the same, so this is no regression, but the task's own threat is not closed.
Impact: an agent or contributor can land a real credential on `main` with every gate green; the owner's sensitive-path
list does not point at it.
Reproduction: gitleaks 8.24.3 `dir` on a scratch folder holding a `ghp_`-shaped token → "leaks found: 1"; the same
folder with `.gitleaks.toml` (`[extend] useDefault = true`, `[allowlist] paths = ['''leak.txt''']`) → "no leaks found",
exit 0; the same token line ending in the inline allow marker → "no leaks found", exit 0.
Recommendation: R1 — the step fails before the scanner when `.gitleaks.toml` exists in the checkout; the change report
lists `.gitleaksignore` and `.gitleaks.toml` as sensitive and lists every added line with the inline allow marker (list,
not fail: this review's own text names it); AC7 with planted cases.
References: OWASP Secrets Management §8.1, Threat Modeling, Secure Coding with AI §7; `secure-code-review.md` §3.
Status: fixed in revision 1 (verified in review 2)

F2 — The AC1/AC2 test stays green when the checksum, the range or the scan result is neutralised
Severity: Medium      Category: Tests      CWE: CWE-1164
Location: `scripts/quality/ci-workflow.test.mjs:152-177` (`secretScanProblems`)
Description: the test matches the `run:` text with regular expressions. It checks that `sha256sum --check` appears
before `tar` and that `--no-merges ${BASE_SHA}..${HEAD_SHA}` appears, not that a mismatch stops the step, that this
range is the one passed to the scanner, or that the scanner's exit code fails the job.
Impact: the regression the task exists for (a PR range capped at 30 commits) can come back with the test green, as can an
unverified binary or a scan that never fails.
Reproduction: mutations M3, M4, M6 and M7 above, each `node --test scripts/quality/ci-workflow.test.mjs` → 13/13.
Recommendation: R2 — the test runs the step's `run:` block under bash with stub `curl` and scanner on a temp
`RUNNER_TEMP` (the scanner stub records its arguments and exits with a chosen code) and asserts the exact `--log-opts`
per event, the stop on a checksum mismatch before `tar` and the scanner, and the failure on exit 2; AC8, with M3, M4,
M6 and M7 red.
References: OWASP Secure Coding with AI §8; `quality-gates.md` §8; `secure-code-review.md` §3 Tests.
Status: fixed in revision 1 (verified in review 2)

Not findings: event values reach `run:` only through `env:`, and every one is a GitHub-generated SHA or event name;
`permissions: contents: read`, no secret, `persist-credentials: false` stay; on `pull_request` the merge ref is fetched
with full history, so both `base.sha` and `head.sha` resolve (the reviewer's PR #19 range did); a stale `base.sha` only
widens the range. A force-pushed `before` that is no longer fetched makes `git log` fail and the step red (fails
closed). The `harden-runner` egress policy is `audit`; Task 958 starts its allow-list with `github.com` and
`objects.githubusercontent.com` and says each job adds what it needs, gitleaks named. The redaction case keeps its
proof (the joined value is the asserted secret).
Revision 1 (Opus, CI change): R1 and R2, then AC7, AC8 and the AC1/AC2/AC6 runs again; the mutations M3, M4, M6, M7 and
the planted `.gitleaks.toml` each red, restored.

Review 2 of the working tree on b1c7b4147 (revision 1) — APPROVED
Scope: the revision diff read in full (`ci.yml` step `secrets`, `change-report.mjs`, `change-report.test.mjs`,
`ci-workflow.test.mjs`, the backlog row); `.gitleaksignore` and `redact-log.test.ts` unchanged since review 1.
Tools (2026-11-09, reviewer reruns): `owasp.mjs sync`/`check` 0; `check-ruleset` 0; lint 0; typecheck 0; quality tests
154/154; `ci-workflow.test.mjs` 13/13; `change-report.test.mjs` 10/10; `redact-log.test.ts` 14/14; `check-files
--worktree` 0, `--all` 0; `ac-tests` PASS; changed-lines coverage 0; `product-gates.mjs` 36/36; `npm audit` 0; gitleaks
over `origin/main` 1820 commits, no leaks; each changed file, no leak. CI not run (AC2, AC3, AC5).
F1 fixed: the step refuses a `.gitleaks.toml` before the download (gitleaks loads only `<source>/.gitleaks.toml`, the
root, so the root check is complete); the change report groups `.gitleaksignore` and any `.gitleaks.toml` as
"Secret-scan suppressions" and lists each added marker line as `path:line`. `allowMarkerLines` on a real
`git diff --no-index -U0 -G<marker>` of scratch files returned `b/f.txt:2`, `b/f.txt:4`, `b/new.txt:1` (a content line
starting with `++` included), all right.
F2 fixed: the test runs the step's `run:` block under bash with stub `curl`, `tar` and scanner and the real `sha256sum`.
Mutations, each restored (sha of `ci.yml` and `change-report.mjs` equal after): M3 `|| true` after the checksum, M4
`--first-parent -30`, M6 a `pull_request) range="-1"` branch, M7 `|| true` after the scanner, the `.gitleaks.toml`
refusal off, `--no-merges` dropped, the daily range emptied (`git log --all`), an extra scanner flag: each 1 failing
test. In the change report: the suppressions group removed, `.gitleaks.toml` dropped from it, the marker search off,
the header guard off: each red. Dropping the `/dev/null` guard stays green; it is an equivalent mutation (a deleted file
has no added line).
Findings: Critical 0, High 0, Medium 0, Low 0. F1 and F2 fixed.
Overall risk: low; the scan covers every commit of a PR, a push and the history, with a verified binary and no unseen
suppression channel. AC2 (zizmor), AC3 (the PR's own scan count) and AC5 (`main` green after the merge) are read from CI
by the owner and the next session.
