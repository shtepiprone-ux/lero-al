# Task 1033 — Review 3

Kickoff: [Sprint_94_kickoff_prompt_Task_1033_The_Notifications_Channel_Never_Joins_As_Anon.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_1033_The_Notifications_Channel_Never_Joins_As_Anon.md) · OWASP record: [Task_1033.json](../security/owasp/reviews/Task_1033.json) · Previous: [Review 2](Task_1033_Review_2.md)

Review 3 of pull request #75 at 195f08ea4 (V14: CI run 45495618495) — NEEDS REVISION
Scope: no change since Review 2; this review reads the CI result.
Findings: Critical 0, High 0, Medium 1 (F2), Low 0
Overall risk: the change does not compile; nothing reaches production until it does.

## V14 — `gh pr checks 75`

Failed: `Lint, types and product checks`, `Unit and component tests`, `Authorization regression`, `Click-shield`, `Vercel` (every one builds or
type-checks). The lint job's annotation (`gh api repos/:owner/:repo/check-runs/138805187153/annotations`): `src/lib/auth/browser.ts:66 Parameter
'channel' implicitly has an 'any' type.`

## Findings

F2 — The channel parameter of the sign-out's map has no type
Severity: Medium      Category: Tests / build      CWE: —
Location: `src/lib/auth/browser.ts:66`
Description: `supabase.getChannels()` is not typed through the project's browser client (`createBrowserClient` of `@supabase/ssr`), so the
callback `(channel) => supabase.removeChannel(channel)` has an implicit `any`, which the strict type check refuses.
Impact: the build and the type check fail; the pull request cannot merge.
Recommendation: type the parameter: `(channel: RealtimeChannel) => …` with `import type { RealtimeChannel } from '@supabase/supabase-js'`.
Status: open (Revision 2, R2-1)

## Revision 2 (executor)

- R2-1 (F2) `src/lib/auth/browser.ts:66`: `(channel: RealtimeChannel)` and `import type { RealtimeChannel } from '@supabase/supabase-js'` (the
  file's existing import from that package gains it, or one new type import). No other line changes.
- Run: the kickoff's Route step 4 line → exit 0. The type check is CI-only (A5) unless the owner changes that rule: then also run it.

## Open parts of Opus and the owner

- Owner: decide the rule question in the response (a local type check for changed TypeScript); commit and push Revision 2.
