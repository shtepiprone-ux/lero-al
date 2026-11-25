# Task 1033 — Review 5

Kickoff: [Sprint_94_kickoff_prompt_Task_1033_The_Notifications_Channel_Never_Joins_As_Anon.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1033_The_Notifications_Channel_Never_Joins_As_Anon.md) · OWASP record: [Task_1033.json](../security/owasp/reviews/Task_1033.json) · Previous: [Review 4](Task_1033_Review_4.md)

Review 5 of pull request #75 at 3fe2aeff7 (V14: CI run 45499925266) — NEEDS REVISION
Scope: no change since Review 4; this review reads the CI result.
Findings: Critical 0, High 0, Medium 1 (F3), Low 0
Overall risk: the product code type-checks and builds (every other job passed); one older test of the hook pins the synchronous join.

## V14 — `gh pr checks 75`

Failed: `Unit and component tests`, hence `CI Required`; every other check passed, the type check and the builds among them. `gh run view 45499925266 --log-failed`:
3 failed of 7350, all in `src/__tests__/reactHooksV7Behaviour.test.tsx` (`useNotifications`): "Cannot read properties of undefined (reading 'setAuth')",
"expected [] to deeply equal [ 'user-notifications:user:u1' ]", "expected [ …(2) ] to have a length of 1 but got 2".

Reviews 1-4 ran the tests of the callers by folder (`src/modules/notifications`, `src/lib/auth`, …); this file lives in `src/__tests__`. Searched by import over the
whole tree (`grep -rlE "hooks/useNotifications|useNotifications\b" src --include=*.test.ts --include=*.test.tsx` and the same for `lib/auth/browser`), 28 test files
(integration excluded) → `npx vitest run <them>` → 3 failed of 384, the same three. Checklists D10, I8 and V3 now require that search (owner, 2026-11-24).

## Findings

F3 — An older test of the notifications hook has no `realtime.setAuth` and expects the channel at once
Severity: Medium      Category: Tests      CWE: —
Location: `src/__tests__/reactHooksV7Behaviour.test.tsx:27-37` (the client double), `:365-389` (the three `useNotifications` cases)
Description: the double's client has no `realtime`, so the hook's `await supabase.realtime.setAuth()` throws inside `join`; and the cases read
`state.channels` right after the render, while the channel is now created after that await.
Impact: CI red.
Recommendation: the double gains `realtime: { setAuth: async () => {} }`; each case that reads `state.channels` after the render waits for it
(`await waitFor(() => expect(state.channels).toHaveLength(1))`) before its existing assertions; no assertion is removed or loosened (A9).
Status: open (Revision 3, R3-1)

## Revision 3 (executor)

- R3-1 (F3) `src/__tests__/reactHooksV7Behaviour.test.tsx`: as above, only in the client double and the three `useNotifications` cases.
- Run: `npm run typecheck`; the kickoff's Route step 4 line (it now lists this file); and checklist I8's import search for `useNotifications` and `lib/auth/browser` → every file exits 0.

## Open parts of Opus and the owner

- Owner: approve the checklist change D10, I8, V3; commit and push Revision 3; Opus: V14 again.
