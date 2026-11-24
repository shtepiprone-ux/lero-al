# Task 991 — Review 2

Kickoff: [Sprint_94_kickoff_prompt_Task_991_Existing_And_Blocked_Accounts_Are_Told.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_991_Existing_And_Blocked_Accounts_Are_Told.md) · OWASP record: [Task_991.json](../security/owasp/reviews/Task_991.json) · Previous: [Review 1](Task_991_Review_1.md)

Review 2 of the working tree on 9aad177c0 (Revision 1, uncommitted) — APPROVED WITH NOTES
Scope: Revision 1 changed `captcha.ts`, `explainRefusedSignIn.ts`, the three action tests and the four `task991*.sql` files, and added
`src/modules/auth/lib/accountStatus.ts` and `src/tests/integration/accountStatusByEmail.integration.test.ts`: exactly R1-1 to R1-4. The three
`.claude/rules/` files (I1, V13, `flow.md`), `controls.json`, the kickoff, the backlog row and the preflight fix of F2 are Opus's.
Findings: Critical 0, High 0 open (F1 fixed), Medium 0, Low 0 open (F2 fixed by Opus in H4)
Overall risk: every auth action finds an account by one exact, service-role-only lookup after a shape check; the SQL was applied on the
development database inside a rolled-back transaction and verified. Note N1 (the unconfirmed address) is Task 1032 by owner decision.

## Checklist V on Revision 1

- V1: `owasp.mjs sync` and `check` → exit 1 at the start (`O2 React_Security`); after Opus mapped the sheet in
  `docs/security/owasp/controls.json` (five requirements: `client-sinks.mjs` K8, K5, K3, `serverEntryGuards.test.ts`, Task 1025; triggers
  `\.tsx$` and the words `dangerouslySetInnerHTML|innerHTML|Server Functions?|JSX`) → `sync` exit 0, `check` exit 0 ("140 sheets mapped (87
  apply)"). `check-ruleset.mjs` → exit 0. `gh run list --branch main` → CI and Scorecard of `d1cc78258` success.
- V2: `git diff --stat 9aad177c0` → the files above; no hunk outside R1-1 to R1-4.
- V3: the six Route files → exit 0, 225 passed (reproduces). The three action tests on the product code of `9aad177c0` (`captcha.ts`,
  `explainRefusedSignIn.ts`, no `accountStatus.ts`) → exit 1, 31 failed, 43 passed (reproduces); restored, sha1 checked. Breaks, each restored:
  the shape check replaced by `typeof email === 'string'` → 5 failed; the lookup without lower-casing → 2 failed.
- V4: `accountStatus.ts` makes one `account_status_by_email` call with the trimmed, lower-cased address, validates the row's types and throws
  `lookup_failed` on any error; `findAccount` and `statusOf` are gone; `grep admin_search_users_by_email src/modules/auth` → only the comment.
  The reset action calls it only for a string of 1-254 characters with `@` (`captcha.ts` `looksLikeAddress`). The cause of F1 is removed.
- V5, V5a: no visible element changed in Revision 1 (`AuthSheet.tsx`, the messages and the Stories are as in `9aad177c0`); the Review 1
  measurements of `LoginBlocked`, `LoginValidationError` and `RegisterSuccess` stand.
- V6: `git diff 9aad177c0` adds no `eslint-disable`, `skip`, `only`, `ts-ignore` or `ts-expect-error`.
- V7: Input and output, Authentication, Business logic, Data exposure — touched by `accountStatus.ts`, `captcha.ts:115-126`; every other
  category not touched by Revision 1. H4 on the development database (script in the scratchpad, owner decision D91, catalog fingerprint before
  and after equal `8e91d74dd09f7874d9c36f3d8733ac9e`, 8 template rows): preflight LF and CRLF → rows 1-5 = 0 after the F2 fix; `task991.sql`
  applied inside one transaction that was rolled back → `task991-verify.sql` rows 1-7 `true`; as `service_role`: the HYDRATION_AGENT2 address
  in upper case → one row, `active`; `%`, `_` and the address without its first letter → 0 rows; `auth_password_matches` right password → true,
  wrong → false, unknown address → false; as `anon` and `authenticated` → 42501 for both functions. `task991.sql` then `task991-rollback.sql`
  in one rolled-back transaction → functions 2 → 0, template rows 2 → 0.
- V8: the failing-first run of V3 (31 failed without the change).
- V9: no Story changed in Revision 1; the owner's list of Review 1 stands (`LoginBlocked`, `RegisterSuccess`; restart Storybook 6006 first).
- V10: `owasp.mjs review <kickoff> --base main` → 49 sheets, including `React_Security` (now mapped) and `AI_Agent_Security`,
  `LLM_Prompt_Injection_Prevention`, `MCP_Security` (triggered by the `.claude/rules/` change); `Task_991.json` gives each a verdict;
  Denial_of_Service and Input_Validation are `met` (F1 fixed). The kickoff's "## OWASP" names React_Security.

## Findings

F1 — The reset request searches `auth.users` by an unvalidated wildcard before any human check
Severity: High      Category: Input and output; Business logic (Denial_of_Service)      CWE: 400, 203
Location: `src/modules/auth/actions/captcha.ts:30-47`, `:134-139` (Review 1)
Description, Impact, Reproduction: Review 1.
Recommendation: Review 1, Revision 1.
Status: fixed in Revision 1 (`src/modules/auth/lib/accountStatus.ts`, `public.account_status_by_email`, `looksLikeAddress`), proven in V3 and V7.

F2 — Preflight row 3 counts function overloads and answers -1 on the development database
Severity: Low      Category: Database (owner delivery path)      CWE: —
Location: `supabase/sql_migrations/task991/task991-preflight.sql:13`
Description: `2 - count(*)` over `crypt` and `gen_salt` in `extensions` counts every overload; the database has two `gen_salt`, so the row says
-1 while its comment says it must be 0.
Impact: the owner's preflight shows a non-zero row on a database that is ready.
Recommendation: count distinct names.
Status: fixed by Opus in H4 (`count(distinct p.proname)`); rerun LF and CRLF → 0.

## Notes

- N1 — the unconfirmed-address case of the kickoff's Scope ("Measured first by the task") is unmeasured: the development Auth answered 500 to
  every sign-up (Revision 0 report). Owner decision 2026-11-24 ("Окрема задача 1032"): Task 1032 in `docs/backlog.md`. The page's answer is
  neutral in every case (`[SEC-991-ENUM-DENY]`).

## Open parts of Opus and the owner

- Owner: apply `task991.sql` on the development project (preflight, apply, verify) before the push, so the CI `authz` job runs AC5
  (`authPasswordMatches.integration.test.ts`, `accountStatusByEmail.integration.test.ts`); then commit, push and open the pull request.
- Opus: V14 after the push (`gh pr checks <n>`); after the merge, H7 and the probe of the kickoff's Route step 5.
