# Task 951 — Every CodeQL alert is closed, and the CodeQL check of the reset PR passes

Sprint 93 (governance reset). Priority **P0**: the reset PR (#19) cannot merge while its `CodeQL` check fails. Owner
decisions: D2 (2026-11-06) "Quality must cover all files in the project, without exceptions"; D 2026-11-06 "everything
must be covered by tests, all changes must automatically be covered by tests, all holes found must be fixed".
Implementer: Sonnet, on the branch `governance/reset-2026-11-06`. Reviewer: Opus.

## Goal

The first full CodeQL scan (PR #19, run 42263240996, 2026-11-06) left 325 open alerts; Opus closed the five in
`scripts/quality/`. Re-measured 2026-11-09 on `39d0fecc7` with `node scripts/quality/codeql-alerts.mjs --ref
refs/pull/19/merge` (exit 1): 325 open — 26 under `src/`, 57 under `scripts/`, 242 under `docs/` (183 one-off evidence
scripts, finding E-01 of `docs/security/audit-2026-11-06/findings.md`); new: `src/__tests__/eslintConfig.test.ts`
(Task 953). After the task the API returns no open alert for the PR, the `CodeQL` check passes, and each product fix
has a test that fails without it. No alert is dismissed and no path is excluded (D2): each is fixed, or its file deleted.

## Scope

Product code — the alert, the fault, the fix:
- `src/lib/getExchangeRateServer.ts:98,102,112` (remote-property-injection): `result[currency] = …`, where `currency`
  comes from the `currencies` table (`getActiveCurrencyCodes`, `:46`). A code such as `__proto__` writes to the
  prototype; the code is also put into `new RegExp(…)` unescaped (`:88`, `:108`). Fix: accept only `/^[A-Z]{3}$/` codes
  from the catalog, build `result` with `Object.create(null)` (or a `Map`), and escape the regex input.
- `src/app/api/auth-email-hook/route.ts:335` (log-injection): `email_action_type` from the request is logged as it is.
  Fix: log it through one helper that removes CR/LF and other control characters and caps the length at 64.
- `src/modules/notifications/lib/emails/send.ts:21,75` (polynomial-redos): `SINGLE_ADDRESS` lets `@` into both halves,
  so `"!@".repeat(n)` backtracks. Fix: exclude `@` from both character classes (exactly one `@`) and cap the length at
  254 before the test.
- `src/lib/imageDelivery.ts:23,42` and `src/design-system/media/appImageConfig.ts:236,244,275`
  (incomplete-url-substring-sanitization): `src.includes('res.cloudinary.com')` is true for
  `https://evil.example/res.cloudinary.com/…`. Fix: one exported helper, `isCloudinaryDeliveryUrl(src)` in
  `appImageConfig.ts`: `new URL(src)`, protocol `https:`, hostname exactly `res.cloudinary.com`. All five sites use it.
- `src/lib/cloudinaryUpload.ts:40`, `src/lib/cloudinaryDelete.ts:117` (weak-cryptographic-algorithm): the API signature
  is SHA-1. Fix (revised by review 1, F1): SHA-256 of the old string plus the secret; `signature_algorithm=sha256` is
  sent as a form field, NOT signed (Cloudinary "Generating authentication signatures": "Cloudinary supports both SHA-1
  and SHA-256 digests for validation"; the live 401 of 2026-11-09 named its string without the parameter). Prove it
  with one real signed upload and the destroy of that asset against the development account in `.env.local`. If
  Cloudinary refuses SHA-256, stop and report the response. Do not dismiss the alert.
- `src/design-system/media/AppImage.tsx:148`, `src/components/admin/AdminCompaniesManager.tsx:157` (xss-through-dom):
  an `<img src>` takes a string from the DOM or props. Fix: one helper `safeImageSrc(src)` in `appImageConfig.ts` that
  returns the value only for `https:`, `blob:`, `data:image/` or a root-relative `/path`, else `undefined`. Both sites
  use it.
- Tests with alerts. Fix the code of the test; keep its assertion:
  - `src/__tests__/security/directives.test.ts:61` (file-system-race);
  - `src/app/auth/callback/__tests__/route.security.test.ts:44` (incomplete-sanitization, `replace` → `replaceAll`);
  - `src/lib/__tests__/exchangeRateServer.test.ts:51,141,142` and `src/lib/__tests__/exchangeRates.security.test.ts:56`
    (compare `new URL(u).hostname` or `origin`, not a substring);
  - `src/modules/admin/actions/__tests__/exchangeProvidersRemoved.security.test.ts:18` (group the alternation).
  - `src/__tests__/serverLinkComponent.test.ts:24` (redos, added by Task 952, open 2026-11-08): read `'use client'` from
    the syntax tree (`ts.createSourceFile`, the directive prologue), not with a nested-quantifier regex.
  - `src/__tests__/eslintConfig.test.ts:56,58,70,71` (identity-replacement, useless-regexp-character-escape; Task 953):
    remove the no-op `replace` and the needless escapes; the assertions stay.

Scripts (`scripts/`):
- Used by `package.json` or a workflow: fix each alert in place.
  - file-system-race: one file descriptor (`openSync` + `fstatSync` + `readFileSync(fd)`), the pattern of
    `readRegularFile` in `scripts/quality/check-files.mjs`.
  - insecure-temporary-file: `mkdtempSync`.
  - incomplete-url-substring-sanitization: `new URL(u).hostname ===`.
  - path-injection: a path from `argv`, or from a request URL in a detector's static server
    (`check-locale-leak.mjs:315`, `check-stories-rendered.mjs`, `check-homepage-grid.mjs`,
    `check-card-track-monotonicity.mjs`, `responsive-screenshots.mjs`, `rendered-state-census/runner.mjs`), goes through
    a new `scripts/lib/within-repository.mjs`: `withinRoot(root, candidate)` resolves real paths and throws when the
    candidate leaves `root` (the repository, or the directory the server serves).
  - missing-regexp-anchor: group the alternation.
  - incomplete-sanitization (`check-hardcoded-i18n.mjs`): `replaceAll` or an escape of every special character.
  - resource-exhaustion and xss-through-exception (`rendered-state-census/runner.mjs`): cap the value; never write an
    error's text into HTML.
- Any script with an alert that nothing runs (no hit in `package.json`, `.github/` or another script for
  `git grep -n "<file name>" -- . ":!docs" ":!tasks"`), for example the LCP probes `validate-production-lcp.mjs`,
  `profile-listing-lcp.mjs`, `diagnose-lcp-preload-network.mjs`, `compare-listing-lcp-lighthouse.mjs`: deleted with the
  permalink rule below, like the `task*` probes; one that something runs is fixed.
- Entry-point guards (Task 963 AC18, 2026-11-09): every file in `PENDING_951` of
  `scripts/quality/entry-point-guards.test.mjs` replaces its `process.argv[1]` comparison with
  `isEntryPoint(import.meta.url)` from `scripts/lib/entry-point.mjs` (a raw comparison skips the run through a symlinked
  path and exits 0), or is deleted as unused. Do not edit the test or its list (Opus empties it in review).
  - `scripts/check-hydration-console.mjs:735` (clear-text-logging): find what the logged value can carry (a URL with
    credentials, a token) and redact it.
- `scripts/rendered-state-census/runner.mjs` (used by `check-rendered-state-census.mjs`): fix all four alerts.
- The 16 one-off `scripts/task*-*.mjs` probes nothing runs (`git grep -n "<file name>" -- . ":!docs" ":!tasks"`) and
  the 183 evidence scripts under `docs/`: delete. Each Markdown link to one that is in `origin/main` (`git cat-file -e
  d8a07a3c7:<path>`) becomes `https://github.com/shtepiprone-ux/lero-al/blob/d8a07a3c7/<path>`; one not there is fixed.

- Dependencies: none.
- Out of scope: any rule outside CodeQL; behaviour changes beyond the listed fixes; `.github/codeql` configuration (the
  default query suite stays; nothing is excluded).

## Attack surface

Controls change on existing entry points (no new entry point) → threat model:
- T1 Tampering (prototype pollution through a currency code an admin saves): eliminate. Only 3-letter codes, and a
  null-prototype result.
- T2 Repudiation / log forgery (forged lines in the auth email hook log): mitigate. Control characters are removed and
  the length is capped.
- T3 Denial of service (ReDoS on an address field a stranger fills): eliminate. A linear regex and a length cap.
- T4 Spoofing (a non-Cloudinary URL treated as Cloudinary and transformed): eliminate. Exact host check.
- T5 Tampering (a weak hash on the signed Cloudinary request): mitigate. SHA-256.
- T6 Injection (a `javascript:` image source): eliminate. Scheme allowlist.
Authorization matrix: unchanged (no actor gains or loses an action).


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — the oversized address (ReDoS) and the poisoned catalog are the abuse cases — AC2, AC4.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC2, AC3, AC4, AC5, AC6, AC7, AC8.
- Authentication: not applicable — the auth callback test file is touched for a CodeQL alert only; no sign-in behaviour changes.
- Authentication_Patterns: not applicable — no authentication code changes; one test file is corrected.
- Authorization: not applicable — the admin test file is corrected for an alert; no access decision changes.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision changes; the fixes are input and output helpers.
- Authorization_Patterns: not applicable — no access check moves; one removed-feature test is corrected.
- Authorization_Regression_Testing: not applicable — no authorization test changes meaning; one file is fixed for CodeQL.
- Authorization_Testing_Automation: not applicable — the matrix is Task 950; this task closes scanner alerts.
- Bot_Management_and_Anti-Automation: not applicable — no endpoint gains or loses a limit; limits are Task 959.
- Business_Logic_Security: not applicable — the race named in the alerts is in a test script; no product workflow changes.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the CodeQL check on the pull request must show no open alert before the owner merges — AC1.
- Cookie_Theft_Mitigation: not applicable — no cookie changes in any of the fixes.
- Credential_Stuffing_Prevention: not applicable — no sign-in path changes in any of the fixes.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — AppImage renders no src for javascript: and other refused schemes — AC7.
- Cryptographic_Storage: "Cryptographically Secure Pseudo-Random Number Generators (CSPRNG) are designed to produce a much higher quality of randomness" — CodeQL security-extended guards randomness; the Cloudinary signature moves to SHA-256 — AC6.
- Denial_of_Service: "Using validation that is cheap in resources first" — the address check is linear and refuses a 100 000-character input in under 100 ms — AC4.
- Dependency_Graph_SBOM: "Validate the document against its format's schema before publication or ingestion" — the CI SBOM job generates and validates CycloneDX for the new tree — AC10.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — AppImage and the media helpers add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC10.
- DOM_Clobbering_Prevention: not applicable — no HTML is sanitized or injected by these fixes; the CMS sanitizer is untouched.
- File_Upload: not applicable — the signature fix changes the algorithm only; upload validation is Task 957.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the workflow keeps permissions: {} at the top and per-job grants (ci-workflow.test.mjs) — AC1.
- HTTP_Strict_Transport_Security: not applicable — no header changes; https is enforced in the helper, HSTS stays in headers.ts.
- Injection_Prevention: "the values for commands and the relevant arguments should be both validated" — the fixed scripts pass file names and arguments as array items; no value is joined into a command line — AC8.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the address, the image source and the Cloudinary host are validated on the server path that uses them — AC4, AC5, AC7.
- Insecure_Direct_Object_Reference_Prevention: not applicable — no object reference handling changes in these fixes.
- JavaScript_and_TypeScript_Security: "Never pass untrusted input to a recursive merge or set-by-path helper" — no catalog key writes into an object path; Object.prototype stays untouched — AC2.
- Key_Management: not applicable — the signing secret and its storage are unchanged; only the digest algorithm changes.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the unhandled hook type is logged as one bounded line without control characters — AC3.
- Logging_Vocabulary: not applicable — the event vocabulary is introduced by Task 955 AC12; this task only bounds one existing line.
- Mass_Assignment: not applicable — no request is bound to a model by the changed code.
- Multifactor_Authentication: not applicable — no sign-in factor changes; staff MFA is Task 960.
- Nextjs_Security: not applicable — no Server Action or route contract changes; the fixes are inside helpers.
- Nodejs_Security: "some third-party rulesets can be used to flag dangerous patterns such as eval()" — lint keeps no-eval on; the click-shield Function constructor stays removed — AC10.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — install scripts stay off and every package with a script is reviewed (install-scripts.test.mjs) — AC10.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — the fixed scripts start git and node with argument arrays, never a shell string — AC8.
- Prototype_Pollution_Prevention: "If objects have to be used then they should be created using the Object.create(null) API" — the currency catalog is read into a Map or a null-prototype object; __proto__ yields no rate — AC2.
- REST_Security: not applicable — no route changes its access decision; the hook route only bounds a log value.
- Secrets_Management: not applicable — no secret is added or moved; the fixes read the existing server variables.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC9, AC10.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC10.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC2, AC3, AC4, AC5, AC6, AC7, AC8.
- Server_Side_Request_Forgery_Prevention: "Application can send request only to identified and trusted applications" — the Cloudinary host check accepts only https on res.cloudinary.com — AC5.
- Serverless_FaaS_Security: not applicable — no function trigger or permission changes; helpers only.
- Session_Management: not applicable — no session handling changes; the callback route test is the only auth file touched.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — the lockfile pins every version; CI installs with npm ci — AC10.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC2, AC3, AC4, AC5, AC6, AC7, AC8.
- Transport_Layer_Security: "HTTP Strict Transport Security (HSTS) instructs the user's browser to always request the site over HTTPS" — http:// Cloudinary addresses are refused, https only — AC5.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — a look-alike host gets no transform, srcset or preload, so no visitor request reaches it — AC5.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC10.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — the CI dependency audit runs npm audit on the changed tree — AC10.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — AppImage and the media helpers use no innerHTML; lint (react/no-danger) fails on one — AC10.
- Web_Service_Security: not applicable — no schema or contract of a service changes in these fixes.
- Webhook_Security: "Accept only the signature scheme you expect" — the email hook keeps its standardwebhooks verification; only its log line changes — AC3.
- XSS_Filter_Evasion: "input filtering is an incomplete defense for XSS" — the image source is allow-listed by scheme and host, not filtered by pattern — AC5, AC7.

## UI

No visible change. Images render from the same sources; a source that is refused now rendered nothing useful before.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 Every alert of the PR is closed — test: `node scripts/quality/codeql-alerts.mjs --ref refs/pull/19/merge`
  exits 0. It reads the code-scanning API through `gh`, prints each open alert as `rule path:line`, exits 1 when any is
  open and 2 when it cannot read (written by Opus 2026-11-09, the path is Opus's; its unit test
  `scripts/quality/codeql-alerts.test.mjs` feeds a recorded response; red today: exit 1, 325 lines). Opus runs it after
  the push, once the CodeQL run of the new head has finished.
- AC2 The currency fix — test: `src/lib/__tests__/exchangeRateServer.test.ts` gains cases. A catalog with `__proto__`,
  `ab`, `A.C` and `EUR` yields rates for `EUR` only; `Object.prototype` is untouched; a code with regex characters
  cannot change the match.
- AC3 The log fix — test: `src/app/api/auth-email-hook/__tests__/unhandledType.test.ts` (new). A type containing `\n`,
  `\r` and 1,000 characters produces one log line of at most 64 characters of the value.
- AC4 The address fix — test: `src/modules/notifications/lib/emails/__tests__/send.address.test.ts` (new):
  - `"!@".repeat(50000)` returns `send_failed` in under 100 ms;
  - `a@b@c` and `a@b, c@d` are refused;
  - `name@example.com` passes.
- AC5 The Cloudinary host fix — test: `src/design-system/media/__tests__/cloudinaryUrl.test.ts` (new):
  - `https://evil.example/res.cloudinary.com/x/upload/y`, `http://res.cloudinary.com/…`,
    `https://res.cloudinary.com.evil.example/…` and a non-URL string get no transform, srcset or preload;
  - a real `https://res.cloudinary.com/<cloud>/image/upload/…` URL does.
- AC6 The signature fix (revised by review 1, F1) — test: `src/lib/__tests__/cloudinarySignature.test.ts` (new) and
  `src/lib/__tests__/cloudinary.security.test.ts` check the SHA-256 hex digest of a known input, that the signature is
  the SHA-256 of `folder=<f>&timestamp=<ts><secret>` (upload) and `public_id=<id>&timestamp=<ts><secret>` (destroy)
  with no `signature_algorithm` in the signed string, and that `signature_algorithm=sha256` is sent; each is red with
  the parameter signed again and with SHA-1 restored. The report holds the real upload response (status 200,
  `public_id`) and the destroy of that `public_id` (status 200, `result: ok`).
- AC7 The image source fix — test: `src/design-system/media/__tests__/safeImageSrc.test.ts` (new). It covers each
  allowed and refused scheme. `AppImage` with `javascript:alert(1)` renders no `src` attribute (RTL).
- AC8 The script fixes — test: `scripts/lib/__tests__/within-repository.test.ts` (new) refuses `../x`, `%2e%2e/x` as a
  request path, an absolute path outside the root and a path through a symlink out of the root, for the repository and
  for a served directory as root. `npm run check:hydration:verify`,
  `npm run check:rendered-state-census:verify` and
  `node --test "scripts/quality/*.test.mjs"` exit 0.
- AC9 Nothing is left dangling — test: `node scripts/quality/check-files.mjs --all` exits 0 (no broken link, no stale
  path), and `git grep -nE "scripts/task[0-9]" -- package.json .github` prints nothing.
- AC10 The usual gates — test: `npm run lint`, `npm run typecheck`, `npm test -- --coverage` and
  `node scripts/quality/changed-lines-coverage.mjs --base origin/main` exit 0.
- AC11 No script decides "am I the entry point" from `argv[1]` as typed — test:
  `node --test scripts/quality/entry-point-guards.test.mjs` exits 0 (review 1, F2: each script imports `isEntryPoint`
  in its import block and ends with a newline), and
  `git grep -nE "process\.argv\[1\].*import\.meta\.url|import\.meta\.url.*process\.argv\[1\]" -- scripts ":!scripts/quality" ":!scripts/lib"`
  prints nothing; one converted gate started through a junction runs (its normal output, not a silent exit 0).

## Route

1. Read the alert list: `node scripts/quality/codeql-alerts.mjs --ref refs/pull/19/merge` (keep the output in your
   scratchpad, not in the repository).
2. Tests first: write AC2–AC8. Run them on the unchanged code and save the failing output for the report.
3. Product fixes, then tests, then scripts (entry-point guards included), then deletions with permalinks, in that
   order. After each group, run `node scripts/quality/check-files.mjs --worktree` and the related tests.
4. Run AC2–AC11. Report each command, its exit code and the relevant output, plus each new test's failing run from
   step 2. List the deleted files with their permalink count, and the Cloudinary responses.
5. Opus gives the owner the commit and push; after the CodeQL run of the new head, Opus runs AC1.

## Review

Review 1 of the working tree on 39d0fecc7 — NEEDS REVISION (1 of 2). Every changed file read; the 199 deletions
checked by path (none run by `package.json`, `.github/` or a script); OWASP record `docs/security/owasp/reviews/Task_951.json`.
Tools as in review 2 (quality tests then 146/146). Breaks (reverted, red, restored, sha equal): AC2 5, AC3 2, AC4 4,
AC5 10 + 6, AC7 9 + 2 + 4, AC8 26. AC1 after the push. Opus emptied `PENDING_951` (the guard test red with one back).

F1 — the SHA-256 signature signs a string Cloudinary does not sign (High, CWE-347; `cloudinaryUpload.ts:40`,
`cloudinaryDelete.ts:117`; cause: AC6's text): the live upload got 401, every upload and destroy would fail. R1: SHA-256
of the old string, `signature_algorithm` sent but not signed, two breaks, one live upload and destroy. Status: fixed.
F2 — `import { isEntryPoint }` after its use, no final newline, in 8 scripts (Low; the reviewer's case in
`scripts/quality/entry-point-guards.test.mjs`). R2: the import into the import block. Status: fixed.

Not findings: the four LCP probes are run by `package.json`; `safeImageSrc` refusing `http:` breaks no Story, fixture
or source. The executor's `check:homepage-theme-runtime-deps` find (red on `HEAD` too) is filed as Task 968.

Review 2 of Revision 1 (`be1e715aa`) — NEEDS REVISION (2 of 2): AC1 red after the push, F3
Tools (2026-11-09, reviewer reruns): `owasp.mjs sync`/`check`/`gate` 0; `check-ruleset` 0; change report 1 (the same
D3 exception); lint 0; typecheck 0; `npm test -- --coverage` 0 (382 files, 6279 tests);
changed-lines coverage 0 (`main`, `origin/main`; 337/341); `check-files --all` 0 (14751); `ac-tests` PASS; quality
tests 147/147 (`entry-point-guards` 3/3); `product-gates` 34/34; `npm audit` 0; `cloudinary-config` 1 (U1, Task 957).
AC6: the two Cloudinary test files 29/29; `signature_algorithm` signed again 4 red, SHA-1 4 red, restored, sha equal.
The executor's live upload and destroy (200, `result: ok`) checked by an Admin API read: the asset 404, the folder
empty. AC11: the grep empty, the 8 imports in their import blocks, each file ends with a newline.

F3 — AC1: 2 `js/xss-through-dom` alerts open on `refs/pull/19/merge` (High, CWE-79; `AppImage.tsx:148` #340 new,
`AdminCompaniesManager.tsx:159` #5). SARIF: `e.target.files` / `e.target.value` of 3 admin forms reach `<img src>`
through `safeImageSrc`, which returns `src` itself; CodeQL has no barrier for a scheme check on a URL attribute
(its `DomBasedXss`/`XssThroughDom` libraries, read 2026-11-09). The allow-list works (AC7 tests); AC1 does not.
Status: fixed in Revision 2 (Opus, owner's choice 2026-11-09): `.github/codeql/extensions/lero-al-javascript-models`
declares the return of `safeImageSrc` an `html-injection` barrier; `scripts/quality/codeql-models.test.mjs` allows
only reviewed barrier rows with their refusing test (red on an unknown function 2, on a `sinkModel` row 1).

Review 3 — APPROVED (Revision 2) Local CodeQL 2.27.4, `javascript-queries@2.5.0` `XssThroughDom.ql`: the same 2 results without the
pack, 0 with it. Quality tests 149/149; `safeImageSrc` 20/20. AC1 is rerun on the pushed PR before the merge.
