# Kickoff prompt — Task 210 (Sprint 9 — chore: green `tsc` baseline before the critical batch)

> RUNS FIRST in Sprint 9. Sonnet's typecheck on 2026-05-22 surfaced pre-existing `tsc --noEmit` errors:
> the `MOCK_USER: User` test fixtures omit two fields the `User` type now requires —
> `suspended_until` (added Task 126 / Epic C.5) and `inactivity_warning_sent_at` (added in the Task 173
> schema reconcile). Two fixtures are stale: `src/lib/auth/__tests__/controller.test.ts:49` and
> `src/modules/auth/__tests__/AuthContext.test.tsx:44`. This is exactly the failure mode the new
> "Global Change Verification Rule" exists to prevent (a type changed; its fixtures weren't updated).
> A red baseline makes "0 NEW typecheck errors" unverifiable for every other Sprint 9 task, so fix it
> first — after this, the gate for 175–183 becomes simply "0 total tsc errors".

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope: this is ONLY making `npx tsc --noEmit` clean by fixing stale test fixtures.
  Do NOT change the User type, production code, or test logic/assertions — only complete the fixtures.
- Do NOT invent architecture. Add the missing fields with sensible null defaults matching the type.
- Global Change Verification Rule: fix EVERY fixture/stub `tsc` reports, not just the first file.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-210-tsc-baseline-green.md.
- 0 lint errors; `npx tsc --noEmit` must be FULLY clean afterward (0 errors).
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- src/types/database.ts (User interface — note suspended_until: string|null @~95 and
  inactivity_warning_sent_at: string|null @~110 are REQUIRED)
- src/lib/auth/__tests__/controller.test.ts (MOCK_USER: User @49)
- src/modules/auth/__tests__/AuthContext.test.tsx (MOCK_USER: User @44)
- docs/ai-behavior.md ("Global Change Verification Rule")

Scope:
1. Run `npx tsc --noEmit` and read the FULL error list (do not stop at the first file).
2. In each stale `User` fixture, add the missing required fields:
   `suspended_until: null` and `inactivity_warning_sent_at: null` (and any other field tsc reports
   missing). Match the existing null-default style of the fixture.
3. Re-run `npx tsc --noEmit` and confirm it reports ZERO errors. Run the auth test suites
   (controller + AuthContext) to confirm they still pass.

Acceptance criteria:
- `npx tsc --noEmit` is fully clean (0 errors) — paste the real terminal output in the session log.
- Both MOCK_USER fixtures (controller.test.ts, AuthContext.test.tsx) include suspended_until +
  inactivity_warning_sent_at; auth test suites still pass.
- No change to the User type, production code, or test assertions.
- backlog + session log updated; commit pushed.

Out of scope:
- Any Sprint 9 feature/bug task (175–183); changing the User type or runtime code; touching tsbuildinfo.
```
