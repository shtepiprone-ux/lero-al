# Task 951 — Every CodeQL alert is closed, and the CodeQL check of the reset PR passes

Sprint 93 (governance reset). Priority **P0**: the reset PR (#19) cannot merge while its `CodeQL` check fails. Owner
decisions: D2 (2026-11-06) "Quality must cover all files in the project, without exceptions"; D 2026-11-06 "everything
must be covered by tests, all changes must automatically be covered by tests, all holes found must be fixed".
Implementer: Sonnet, on the branch `governance/reset-2026-11-06`. Reviewer: Opus.

## Goal

The first full CodeQL scan (PR #19, run 42263240996, 2026-11-06) left 325 open alerts:
`gh api "repos/shtepiprone-ux/lero-al/code-scanning/alerts?ref=refs/pull/19/merge&state=open"`. Opus closed the five
in `scripts/quality/` in the same session (agent-check, push-safety, check-files). The rest: 14 files under `src/`
(9 product, 5 tests), 38 files under `scripts/`, 183 one-off evidence scripts under `docs/` (174 in
`docs/sessions/evidence/`, 8 in `docs/reviews/artifacts/`, 1 in `docs/research/references/`). After the task the API
returns no open alert for the PR, the `CodeQL` check passes, and each product fix has a test that fails without it.
No alert is dismissed and no path is excluded from the scan (D2): each one is fixed, or its file is deleted.

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
  is SHA-1. Fix: SHA-256 with the signed parameter `signature_algorithm=sha256` (Cloudinary "Generating authentication
  signatures"). Prove it with one real signed upload and one destroy against the development Cloudinary account in
  `.env.local`. If Cloudinary refuses SHA-256, stop and report the response. Do not dismiss the alert.
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

Scripts (`scripts/`):
- Used by `package.json` or a workflow: fix each alert in place.
  - file-system-race: one file descriptor (`openSync` + `fstatSync` + `readFileSync(fd)`), the pattern of
    `readRegularFile` in `scripts/quality/check-files.mjs`.
  - insecure-temporary-file: `mkdtempSync`.
  - incomplete-url-substring-sanitization: `new URL(u).hostname ===`.
  - path-injection: a path from `argv` goes through a new `scripts/lib/within-repository.mjs`, which resolves it and
    throws when it leaves the repository root.
  - missing-regexp-anchor: group the alternation.
  - `scripts/check-hydration-console.mjs:735` (clear-text-logging): find what the logged value can carry (a URL with
    credentials, a token) and redact it.
- `scripts/rendered-state-census/runner.mjs` (used by `check-rendered-state-census.mjs`): fix all four alerts.
- The 16 one-off `scripts/task*-*.mjs` probes that no script, `package.json` or workflow calls: delete. Check first that
  nothing runs them: `git grep -n "<file name>" -- . ":!docs" ":!tasks"`. For each one that is also in `origin/main`
  (`git cat-file -e d8a07a3c7:<path>`), rewrite every Markdown link to it as a permalink
  `https://github.com/shtepiprone-ux/lero-al/blob/d8a07a3c7/<path>`. One that is not in `origin/main` is fixed, not
  deleted.

Evidence scripts under `docs/` (183 files): delete them, with the same permalink rule. They are records of past
probes that nothing runs, and Git history keeps them; a permalink keeps every document honest.

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

## UI

No visible change. Images render from the same sources; a source that is refused now rendered nothing useful before.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 Every alert of the PR is closed — test: `node scripts/quality/codeql-alerts.mjs --ref refs/pull/19/merge`
  (new). It reads the code-scanning API through `gh`, prints each open alert as `rule path:line`, exits 1 when any is
  open and 2 when it cannot read. Its unit test `scripts/quality/codeql-alerts.test.mjs` feeds a recorded response.
  Opus runs it after the push, once the CodeQL run of the new head has finished.
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
- AC6 The signature fix — test: `src/lib/__tests__/cloudinarySignature.test.ts` (new) checks the SHA-256 hex digest of
  a known input and that `signature_algorithm=sha256` is in the signed and sent parameters. The report holds the real
  upload and destroy responses (status 200, `public_id`).
- AC7 The image source fix — test: `src/design-system/media/__tests__/safeImageSrc.test.ts` (new). It covers each
  allowed and refused scheme. `AppImage` with `javascript:alert(1)` renders no `src` attribute (RTL).
- AC8 The script fixes — test: `scripts/lib/__tests__/within-repository.test.ts` (new) refuses `../x`, an absolute path
  outside the root and a path through a symlink out of the root. `npm run check:hydration:verify`,
  `npm run check:rendered-state-census:verify` and
  `node --test "scripts/quality/*.test.mjs"` exit 0.
- AC9 Nothing is left dangling — test: `node scripts/quality/check-files.mjs --all` exits 0 (no broken link, no stale
  path), and `git grep -nE "scripts/task[0-9]" -- package.json .github` prints nothing.
- AC10 The usual gates — test: `npm run lint`, `npm run typecheck`, `npm test -- --coverage` and
  `node scripts/quality/changed-lines-coverage.mjs --base origin/main` exit 0.

## Route

1. Read the alert list (Goal command) and save it as `docs/sessions/2026-11-06-task951-codeql-before.json`.
2. Tests first: write AC2–AC8. Run them on the unchanged code and save the failing output for the report.
3. Product fixes, then tests, then scripts, then deletions with permalinks, in that order. After each group, run
   `node scripts/quality/check-files.mjs --worktree` and the related tests.
4. Write `scripts/quality/codeql-alerts.mjs` and its test (AC1).
5. Run AC2–AC10. Report each command, its exit code and the relevant output, plus each new test's failing run from
   step 2. List the deleted files with their permalink count, and the Cloudinary responses.
6. Opus gives the owner the commit and push; after the CodeQL run of the new head, Opus runs AC1.

## Review
