# Task 210 — Sprint 9 chore: green `tsc --noEmit` baseline

**Date:** 2026-05-23  
**Sprint:** 9  
**Type:** chore / test-fixture fix

## Summary

`npx tsc --noEmit` was red at Sprint 9 start with 2 errors, both in `MOCK_USER: User` test fixtures
that were not updated when the `User` interface gained `suspended_until` (Task 126) and
`inactivity_warning_sent_at` (Task 173 schema reconcile).

## Changes

| File | Change |
|---|---|
| `src/lib/auth/__tests__/controller.test.ts` | Added `suspended_until: null` + `inactivity_warning_sent_at: null` to `MOCK_USER` fixture |
| `src/modules/auth/__tests__/AuthContext.test.tsx` | Added `suspended_until: null` + `inactivity_warning_sent_at: null` to `MOCK_USER` fixture |

No production code, no User type, no test assertions were changed.

## Terminal output

```
$ npx tsc --noEmit
(no output — exit 0)
```

```
$ npx vitest run src/lib/auth/__tests__/controller.test.ts src/modules/auth/__tests__/AuthContext.test.tsx

 Test Files  2 passed (2)
      Tests  56 passed (56)
   Duration  2.75s
```

## Acceptance criteria

- [x] `npx tsc --noEmit` → 0 errors
- [x] Both `MOCK_USER` fixtures include `suspended_until` + `inactivity_warning_sent_at`
- [x] Auth test suites (controller + AuthContext) pass (56/56)
- [x] No change to `User` type, production code, or test assertions
- [x] `docs/backlog.md` + session log updated
