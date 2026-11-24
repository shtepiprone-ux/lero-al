# Task 991 — Review 3

Kickoff: [Sprint_94_kickoff_prompt_Task_991_Existing_And_Blocked_Accounts_Are_Told.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_991_Existing_And_Blocked_Accounts_Are_Told.md) · OWASP record: [Task_991.json](../security/owasp/reviews/Task_991.json) · Previous: [Review 2](Task_991_Review_2.md)

Review 3 of pull request #71 at 3dacefe0a (V14: CI run 45417124768) — NEEDS REVISION
Scope: no product change since Review 2; this review reads the CI result. Opus's own changes in this review: the React_Security line in the
"## OWASP" of 20 open kickoffs and three hashes of `CAUSE_GRANDFATHERED` (`scripts/quality/check-files.mjs`, owner 2026-11-24).
Findings: Critical 0, High 0, Medium 2 (F3, F5), Low 1 (F4)
Overall risk: the product code is unchanged and its own tests pass; CI found one public entry point missing from the entry-point register, one
older test that pins the old reset count, and a Story whose play assumes a single alert. Review 2's verdict is superseded.

## V14 — `gh pr checks 71` (every check concluded)

Failed: `Lint, types and product checks`, `Unit and component tests`, `Locale leak (4/6)`, hence `CI Required`. Passed: the other 20, among them
`Authorization regression (real Supabase development project)` (AC5 on the applied SQL), `OWASP task gate`, `CodeQL (SAST)`, `Storybook build`,
`Secret scan (gitleaks)`, `Change report`. Each failure opened with `gh run view 45417124768 --log-failed`:

1. Lint — `check-files.mjs --all`: 20 open kickoffs "required sheet React_Security is missing (triggered by this kickoff)". Cause: Review 2 mapped
   the sheet with the trigger `\.tsx$` and did not add the line to the open kickoffs it triggers (Opus's miss). Fixed by Opus in this review: each
   line follows the kickoff's own Cross_Site_Scripting_Prevention judgement (954: the CSP quote; 1002: the server/client boundary quote). Kickoffs
   950, 954 and 969 are in `CAUSE_GRANDFATHERED` by text hash; their hashes are updated with a comment, as Task 983 did for 951 (owner 2026-11-24:
   "change the rules if it is really necessary from the point of view of best practice"). Planted proof: one extra line in kickoff 950 →
   `missing section "## Cause"`, exit 1; restored → exit 0. `check-files.mjs` on the 21 files → exit 0; `node --test scripts/quality/check-files.test.mjs` → 32 pass.
2. Unit tests — F3 and F4 below.
3. Locale leak (4/6) — F5 below. Reproduced on the CI build itself: the `storybook-build` artifact of the run (sha256
   `3e07ff1e5b69e5b480f91225a80a59f778613f2bc28f750a00d8ea628e0b470f`, downloaded through the owner's browser at the owner's request), served
   locally and opened as the detector opens it.

## Findings

F3 — `explainRefusedSignIn` is not in the register of public entry points
Severity: Medium      Category: Next.js entry points      CWE: 306
Location: `src/__tests__/security/serverEntryGuards.test.ts:90` (`PUBLIC_BY_DESIGN`)
Description: the register lists every Server Action without a session, permission or secret check together with why it is public and how it is
bounded; the new anonymous service-role action has no entry.
Impact: CI fails (`no unguarded entry point is missing from the allowlist`, `a service-role entry point that is public is on the allowlist AND
says how it is bounded`); the reason the action is public is recorded nowhere a reviewer of the register reads.
Reproduction: the CI unit job, both assertions.
Recommendation: add `'src/modules/auth/actions/explainRefusedSignIn.ts#explainRefusedSignIn'` with a reason that names its bounds (a fresh
Turnstile token, the `blocked_signin` limit of 5 per address per 15 minutes, a service-role check that answers a flag only after the password matches).
References: OWASP Nextjs_Security ("Treat each reachable action as a client-callable POST entry point."); `secure-code-review.md` §3.
Status: open (Revision 2, R2-1)

F4 — An older sheet test pins one reset of the human check for a banned answer
Severity: Low      Category: Tests      CWE: —
Location: `src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx:140-151`
Description: the test loops over "Invalid login credentials" and "User is banned" and expects `widget.reset` once. After a banned answer the sheet
now resets twice: after the sign-in, and after the explain call, which used a fresh token of its own (kickoff Scope, `AuthSheet.tsx` `explainBan`).
The kickoff's list of "Existing tests the Fix changes" did not name this file (Opus's miss in the design), and the Route did not run it.
Impact: CI fails (`sq: User is banned resets the check: expected 1, got 2`).
Recommendation: split the loop: wrong credentials keep one reset; the banned answer mocks `@/modules/auth/actions/explainRefusedSignIn`
(`{ blocked: false }`), expects two resets, one explain call with `captchaToken: 'dev-noop-token'`, the same wrong-credentials text, a disabled
button and no second sign-in with the used token. Every other assertion stays (A9).
Status: open (Revision 2, R2-2)

F5 — The `LoginBlocked` play fails where the Google button is unavailable
Severity: Medium      Category: Tests (Story)      CWE: —
Location: `src/stories/patterns/mantine/AuthSheet.stories.tsx` (`LoginBlocked`, `play`, `canvas.getByRole('alert')`)
Description: without a Google client id (the CI build has none) the sheet also shows "Google sign-in is not available right now" as an alert;
`getByRole('alert')` then finds two elements and throws.
Impact: `Locale leak (4/6)` fails for `patterns-mantine-authsheet--login-blocked` at 320, 375 and 1280 in `en`, and the other locales are never compared.
Reproduction: the CI build served locally, the Story at 320 and 1280 in `en` and `sq` → phase `finished`, `sb-show-errordisplay`, error
"Found multiple elements with the role \"alert\""; the two alerts: the blocked text with its link, and the Google notice. On a dev server with
`.env.local` (a client id) the play passes, which is why Review 1's V5a did not see it.
Recommendation: assert the alert that holds the link: `expect(link.closest('[role="alert"]')).toHaveTextContent(...)`; keep the link and `href` assertions.
Status: open (Revision 2, R2-3)

## Revision 2 (executor)

- R2-1 (F3) `src/__tests__/security/serverEntryGuards.test.ts`: one `PUBLIC_BY_DESIGN` entry for `explainRefusedSignIn` as in F3. No other entry changes.
- R2-2 (F4) `src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx`: as in F4; the wrong-credentials case keeps
  `toHaveBeenCalledTimes(1)`.
- R2-3 (F5) `src/stories/patterns/mantine/AuthSheet.stories.tsx`: as in F5. No product file changes.
- Run: the six Route files, plus `src/__tests__/security/serverEntryGuards.test.ts` and
  `src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx`. Failing-first: the two test files on `3dacefe0a`
  (they fail there as CI showed). Deliberate break: remove the new allowlist entry → both register assertions fail; restore.
- Storybook (I8a): `LoginBlocked` on the Storybook dev server started with an EMPTY `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and an empty
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (the CI build's state), at 320 and 1280 in en and sq: no error display, both alerts present, the play finishes.

## Open parts of Opus and the owner

- Owner: a local commit of Opus's files of this review (H3, below in the response), then Revision 2 from it; push after Review 4.
- Note N1 of Review 2 stays Task 1032.
