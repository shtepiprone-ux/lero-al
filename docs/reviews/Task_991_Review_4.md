# Task 991 — Review 4

Kickoff: [Sprint_94_kickoff_prompt_Task_991_Existing_And_Blocked_Accounts_Are_Told.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_991_Existing_And_Blocked_Accounts_Are_Told.md) · OWASP record: [Task_991.json](../security/owasp/reviews/Task_991.json) · Previous: [Review 3](Task_991_Review_3.md)

Review 4 of the working tree on 59ff109d5 (Revision 2, uncommitted) — APPROVED WITH NOTES
Scope: Revision 2 changed `src/__tests__/security/serverEntryGuards.test.ts` (+1 line), `src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx`
and the `LoginBlocked` play in `src/stories/patterns/mantine/AuthSheet.stories.tsx`: exactly R2-1 to R2-3; no product file.
Findings: Critical 0, High 0, Medium 0 open (F3, F5 fixed), Low 0 open (F4 fixed)
Overall risk: the three CI failures of run 45417124768 are removed at their cause; CI on GitHub decides the rest (V14 after the push).

## Checklist V on Revision 2

- V1: `owasp.mjs sync` → exit 0; `check` → exit 0 (140 sheets, 87 apply); `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 1` → success.
- V2: `git diff --stat HEAD` → the three files above, 31 insertions, 4 deletions.
- V3: the eight files (the six of the Route, `serverEntryGuards.test.ts`, `AuthSheet.passwordCaptcha.security.test.tsx`) → exit 0, 251 passed
  (reproduces). The two test files at `59ff109d5` → exit 1, 3 failed (the two register assertions and "User is banned resets the check: expected 1,
  got 2"; reproduces). Break: the new `PUBLIC_BY_DESIGN` line removed → exit 1, 2 failed, 21 passed; restored.
- V4: R2-1's reason names the token, the limit and what the service-role check answers. R2-2 keeps one reset for wrong credentials and asserts two
  resets, one explain call with the fresh token, the same text, a disabled button and no reuse of the token for the ban; the double gains
  `getToken` (the real `CaptchaWidgetHandle` method the sheet calls, `src/components/auth/CaptchaWidget.tsx:36`), which the explain call needs:
  accepted. R2-3 asserts the alert that holds the link.
- V5, V5a: no product surface changed. `LoginBlocked` on a Storybook dev server started with an empty `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (the CI build's state), opened as the detector opens it, at 320, 375 and 1280 in en, sq, uk, it (12 renders):
  phase `finished`, no error display, two alerts (the blocked text with its link, the Google notice), link `/<locale>/contact`, no horizontal
  overflow, no page or console error. The element values of Review 1 stand (the render is unchanged).
- V6: one register entry added, proven by the break above.
- V7: Tests — touched (no assertion weakened: the banned case gains assertions, the wrong-credentials case keeps its count); Next.js entry
  points — touched (the register names the action and its bounds); every other category not touched by Revision 2.
- V8: V3's base run (3 failed without the revision).
- V9: the owner's Stories: `LoginBlocked`, `RegisterSuccess` (restart Storybook 6006 first).
- V10: `Task_991.json`: Nextjs_Security `met` (F3 fixed).

## Notes

- N1 (Review 2) stays Task 1032.

## Open parts of Opus and the owner

- Owner: commit and push Revision 2 with this review; Opus: V14 on pull request #71; after the merge, H7 and the probe of the kickoff's Route step 5.
