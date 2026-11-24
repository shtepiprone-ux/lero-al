# Task 1032 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_1032_An_Unconfirmed_Address_Signs_Up_Again.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1032_An_Unconfirmed_Address_Signs_Up_Again.md) · OWASP record: [Task_1032.json](../security/owasp/reviews/Task_1032.json)

Review 1 of the working tree on b582094da (uncommitted) — APPROVED
Scope: one file, `src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts`, the case at `:348-358` replaced (8 insertions, 6 deletions): exactly the Fix.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: none added; the test now states the measured answer, and the error mapping the old case covered stays covered elsewhere.

## Checklist V

- V1: `owasp.mjs sync` → exit 0; `check` → exit 0; `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 1` → success.
- V2: `git diff --stat HEAD` → the one Scope file.
- V3: `npm test -- src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` → exit 0, 21 passed (reproduces). Break: `captcha.ts:97`
  without `identities.length === 0` → exit 1, 2 failed (the new case and "a new address sends no mail and does not even look up an account";
  reproduces); restored. The executor's report says I7 read only `:1-130` and `:290-375` of the file; the reviewer read the whole diff and the file's cases around it.
- V4: the case mocks the measured Auth answer (no error, a user with an identity) and asserts `{ ok: true }`, an empty `afterQueue`, no RPC
  call and no mail; the comment cites the measurement of the kickoff's "## Cause". The Cause (a test pinning an unmeasured 500) is removed.
- V5, V5a: no product file and no visible element changed (`captcha.ts` equals `HEAD`).
- V6: no exemption added.
- V7: Tests — touched: the old case's assertion of the 500 mapping (`signup_failed`, `error_generic`) is not lost: `src/modules/auth/actions/__tests__/captcha.security.test.ts:217-222`
  still maps an unknown Auth error to `error_generic`, so no check is weakened (A9). Every other category not touched (`git diff --name-only HEAD` → the one test file).
- V8: AC1's test fails with the product change undone (the break above); AC2 is CI on GitHub.
- V9: no Story.
- V10: `owasp.mjs review <kickoff> --base main` → 22 sheets (the branch also carries the checklist H3 text: AI_Agent_Security, LLM_Prompt_Injection_Prevention,
  MCP_Security), each with a verdict in `Task_1032.json`.

## Open parts of Opus and the owner

- Owner: commit, push and open the pull request; Opus: V14 (`gh pr checks <n>`), then H7.
