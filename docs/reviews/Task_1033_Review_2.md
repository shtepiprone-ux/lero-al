# Task 1033 — Review 2

Kickoff: [Sprint_94_kickoff_prompt_Task_1033_The_Notifications_Channel_Never_Joins_As_Anon.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1033_The_Notifications_Channel_Never_Joins_As_Anon.md) · OWASP record: [Task_1033.json](../security/owasp/reviews/Task_1033.json) · Previous: [Review 1](Task_1033_Review_1.md)

Review 2 of the working tree on a806f9b0b (Revision 1, uncommitted) — APPROVED
Scope: `src/lib/auth/browser.ts` (one line and a comment line) and `src/lib/auth/__tests__/browser.smoke.test.ts`: exactly R1-1.
Findings: Critical 0, High 0, Medium 0 open (F1 fixed), Low 0
Overall risk: a sign-out removes the user's channels without closing the socket; the hook joins with the user's token; the type check is read in CI (A5).

## Checklist V on Revision 1

- V2: `git diff HEAD -- src` → `removeAllChannels()` replaced by `Promise.all(supabase.getChannels().map((channel) => supabase.removeChannel(channel)))` in the same try/catch, plus its test.
- V3: the kickoff's Route step 4 line (now with `src/lib/auth/controller.signout.security.test.ts`) → exit 0, 35 passed (reproduces). The executor's failing runs on `a806f9b0b` (the controller test 3 failed; the new AC1 cases 4 failed) and the break (removeChannel after `auth.signOut` → 2 failed) are as reported.
- V4, V7: `removeChannel` unsubscribes and tears down without `disconnect()` (`node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js:270-276`), so no timer remains; F1's cause is removed. The tests of every sign-out caller and the notifications module (`npx vitest run src/lib/auth src/modules/notifications src/modules/auth src/components/admin src/modules/cabinet src/components/layout src/app/admin`) → exit 0, 1613 passed.
- V5-V9: no visible change, exemption or Story.
- V10: `Task_1033.json`: WebSocket_Security now `met`.

## Open parts of Opus and the owner

- Owner: commit, push, open the pull request; Opus: V14, H7, and after the merge the sign-in/sign-out check of the kickoff's Route step 5 with the owner's Postgres log.
