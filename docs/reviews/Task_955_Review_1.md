# Task 955 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_955_Server_Input_Errors_And_Logs.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_955_Server_Input_Errors_And_Logs.md) · OWASP record: [Task_955.json](../security/owasp/reviews/Task_955.json)

Review 1 of the working tree on 5355ed1c8 (uncommitted, branch `task/955-error-text`) — APPROVED
Scope: `src/modules/listings/actions/favoriteActions.ts`, `src/modules/auth/actions/captcha.ts`, `src/modules/auth/components/AuthSheet.tsx` (`:456`) and the
tests `visitorActions.security.test.ts`, `captcha.security.test.ts`, `signUpWithCaptcha.smoke.test.ts`, `requestPasswordReset.smoke.test.ts`,
`AuthSheet.test.tsx`; `git diff --stat` → 8 files, all in the kickoff's Scope.
Tools (local, 2026-11-23): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 2` → CI and Scorecard
`success` on `4f08e3727`; the three `npm test --` commands of the Route → exit 0, 55, 80 and 73 passed, as reported; the breaks (below);
`owasp.mjs review <kickoff> --base origin/main` → exit 0. Not run (A5): `tsc` (`error.status` and `errorKey` types are read on GitHub), lint, the full
unit run, build, census.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: low; neither action hands a provider's text to the browser, every screen shows what it shows on `main`, and the open proof is the pull
request's CI.

## Breaks (V8; each file restored, md5 equal before and after)

- AC1: `return { error: error.message }` put back in both favourite actions → `visitorActions.security.test.ts` exit 1, 2 failed.
- AC2: `supabaseErrorMessage: error.message` added back to the sign-up refusal → `captcha.security.test.ts` exit 1, 2 failed.

## Secure code review (`secure-code-review.md` §2, §3)

1. Existing controls: none weakened; the captcha handling (`captcha.ts:31`, `:57`, `isCaptchaRefusal`) and the favourite session and block checks are
unchanged. 2. New vectors: none. 3. Trust boundaries: server → browser output narrowed to a fixed code (`favoriteActions.ts:40`, `:66`) and a key of the
closed set of `mapAuthError` (`captcha.ts:45`); the new log lines hold `{ code, status }` only (`:43`, `:72`), no address and no message
(`[SEC-955-AUTH-TEXT-DENY]` asserts both). 4. Integrations: none. 5. Regression: the changed assertions expect less text, not fewer checks; each old
assertion of `supabaseErrorMessage` became an exact `toEqual` of the new shape. 6. Categories: Data exposure, errors, logging — touched (above);
Authentication and sessions — touched only in the refusal shape of sign-up and reset, the neutral reset kept (`AuthSheet.tsx:244-245`); every other
category: not touched. Noted by the executor (A4): `favoriteActions.ts:39`, `:65` keep logging the whole error and the user id, as on `main`; personal data
in logs is Task 1021 (C-03, A-06), so no new task.

## Rendered comparison (V5a)

No visible element changes: the `AuthSheet.tsx` diff is the argument of `setErrorKey` (`:456`); the alert, its markup, styles and texts are as on `main`.
The shown text per refusal is proven by `AuthSheet.test.tsx` (the three keys render `error_email_exists`, `error_weak_password`, `error_rate_limit`; no key
renders `error_generic`) together with `captcha.security.test.ts` (each Supabase message maps to the same key the sheet mapped on `main`).
V9: no Story changes.

## Acceptance criteria

- AC1, AC2, AC3: their tests pass and the AC1 and AC2 tests fail without the change (above).
- AC4: `gh pr checks <n>` (V14).

## V14 — pull request #69 (commit `f06c3ed5a`), 2026-11-23

`gh pr checks 69` → red: "Unit and component tests" and `CI Required`; every other check passes. `gh run view 45263602305 --log-failed`: 1 of 7189 tests
failed, `src/modules/__tests__/noDbMessage.security.test.ts:99` `[SEC-X-SRV-NO-DB-MESSAGE]`: "src/modules/listings/actions/favoriteActions.ts no longer
returns a message: remove it from STILL_OPEN". The test keeps a list of places still returning a database message (`:72-75`) and fails once one is fixed,
so the list cannot outlive the code. The kickoff's Scope did not name it: the design (Opus, D2) did not search the tests that pin the old answers. The same
file keeps `captcha.ts` in `ON_PURPOSE` (`:69`) with a reason that is no longer true ("the sign-up and reset forms map Supabase AUTH's own message"):
since this task the action maps it on the server and answers only the key; the file stays listed, because its line
`errorKey: mapAuthError(error.message)` matches the scan.
Fix in this pull request: Revision 1 (Sonnet).

Open parts, in order: Revision 1 → Review 2 → the commit and push → `gh pr checks 69` → the merge.
