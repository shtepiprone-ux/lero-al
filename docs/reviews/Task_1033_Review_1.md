# Task 1033 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_1033_The_Notifications_Channel_Never_Joins_As_Anon.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_1033_The_Notifications_Channel_Never_Joins_As_Anon.md) · OWASP record: [Task_1033.json](../security/owasp/reviews/Task_1033.json)

Review 1 of the working tree on f1959d0b5 (uncommitted) — NEEDS REVISION
Scope: `src/lib/auth/browser.ts` `signOut`, the Realtime effect of `useNotifications.ts`, and the two AC tests: exactly the Scope.
Findings: Critical 0, High 0, Medium 1 (F1), Low 0
Overall risk: the sign-out change breaks an existing security test that the Route did not run (Opus's miss in the design); the hook change holds.

## Checklist V

- V1: `owasp.mjs sync` → exit 0; `check` → exit 0; `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 1` → success.
- V2: `git diff --stat HEAD` → the four Scope files.
- V3: the kickoff's Route step 4 line → exit 0, 30 passed (reproduces). The tests of every `signOut` caller and of the notifications module
  (`npx vitest run src/lib/auth src/modules/notifications src/modules/auth src/components/admin/__tests__/AdminSidebar src/modules/cabinet/components src/components/layout`)
  → exit 1, 3 failed of 1074: `src/lib/auth/controller.signout.security.test.ts` (all three cases) — "left 1 timer(s) … pending after cleanup …
  10000 ms timer created at node_modules/@supabase/realtime-js/dist/main/phoenix/socketAdapter.js:59". The same file with `browser.ts` of `HEAD` → exit 0, 4 passed (file restored after).
- V4: the hook awaits `realtime.setAuth()` and creates no channel after a cleanup; `setAuth` cannot reject on a failing token callback (`RealtimeClient._performAuth` catches it and keeps the last token), so the executor's open question about an unhandled rejection needs no change. `signOut` is async with the same result type.
- V5-V9: no visible change, exemption or Story.

## Findings

F1 — `removeAllChannels()` always closes the socket, which leaves a timer and breaks the controller's sign-out test
Severity: Medium      Category: Tests (security test of sign-out)      CWE: —
Location: `src/lib/auth/browser.ts` `signOut`
Description: `removeAllChannels()` unsubscribes every channel and then always calls `disconnect()` (`node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js:282-290`), even with no channel; the disconnect leaves a 10 s timer, which `src/tests/pendingTimerGuard.ts` rejects in `controller.signout.security.test.ts` (a real client, no channel). In the unit job of CI this fails the build of the pull request.
Impact: CI red; a sign-out without channels needlessly reconnects the socket later.
Recommendation: remove only the channels that exist, without closing the socket: `await Promise.all(supabase.getChannels().map((channel) => supabase.removeChannel(channel)))` inside the existing try/catch (`removeChannel` unsubscribes and tears down, `RealtimeClient.js:270-276`, and does not disconnect). AC1's test records `removeChannel` per channel before `auth.signOut`; no channel → no call; a rejection still signs out. Add `src/lib/auth/controller.signout.security.test.ts` to the Route's run.
Status: open (Revision 1, R1-1)

## Revision 1 (executor)

- R1-1 (F1) `src/lib/auth/browser.ts` `signOut`: replace `removeAllChannels()` with `Promise.all(supabase.getChannels().map((channel) => supabase.removeChannel(channel)))`, in the same try/catch, before `auth.signOut` as today.
- Tests: `src/lib/auth/__tests__/browser.smoke.test.ts` — the double gains `getChannels` and `removeChannel`; the order test expects one `removeChannel` per channel before `auth.signOut` (two channels in the double); a case with no channel makes no `removeChannel` call; a rejecting `removeChannel` still calls `auth.signOut` and returns its result. Nothing removed (A9).
- Run: the kickoff's Route step 4 line plus `src/lib/auth/controller.signout.security.test.ts` (the kickoff's Route now lists it) → exit 0. Break: `removeChannel` after `auth.signOut` → AC1 fails; restore.

## Open parts of Opus and the owner

- Owner: commit the reviewed tree (below in the response); the executor's revision starts from that commit.
