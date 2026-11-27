# Task 989 — Revision 4 executor report (Review 5, F13)

Kickoff: `tasks/Sprints/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md` ("## Revision 4"). Review: `docs/reviews/Task_989_Review_5.md`.
Executor: Sonnet, 2026-11-27. Base commit `4acea0d58` (the owner's local commit of Revision 3). Shell: Windows PowerShell 5.1 (the PowerShell tool) unless a line names Git Bash.
No Git command that writes was run; read-only `git status`, `git log`, `git diff` only.

## Checklist I

| Item | Result |
|---|---|
| A0 | `node scripts/quality/owasp.mjs sync` → `owasp sync: 142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0`, exit 0; `owasp.mjs plan <kickoff>` exit 0. The revision adds no entry point, query or output sink. `.claude/rules/quality-gates.md` §1, §2, §8.1 as in Revision 3. `src/__tests__/security/clientSinks.test.ts:19` and `scripts/quality/client-sinks.mjs:19` skip `__tests__` folders, so the test's `container.innerHTML = <renderToString output>` (the standard way to stage server HTML for `hydrateRoot`) is outside both. |
| I1 | `git status --short` → `docs/backlog.md`, the kickoff, `docs/reviews/Task_989_Review_4.md`, `docs/reviews/Task_989_Review_5.md` (Opus's documents); `git log --oneline -1` → `4acea0d58 Task 989: the CI gates of PR #85 - UI contracts, Stories, MantineBadge, census baseline, tests (Revision 3)`. The prompt's base was "<hash printed by `git log --oneline -1` after the owner's local commit>". |
| I2 | Scope: `src/components/admin/AdminFooterManager.tsx`, `src/components/admin/__tests__/AdminFooterManager.shared.test.tsx`. |
| I3 | Read `AdminFooterManager.tsx:125-214` (`LinkGroupEditor`) and the test file in full; `node_modules/@dnd-kit/core/dist/core.esm.js:2903` (`useUniqueId("DndDescribedBy", id)`), `:86-172` (the instructions element `HiddenText` mounts only after an effect, through a portal); `node_modules/@dnd-kit/utilities/dist/utilities.esm.js:168-179` (`if (value) return value;` else the module counter `ids[prefix]`). React 19.2.4. |
| I4 | Below, "Failing first". |
| I5-I6 | Only the two Scope files changed. |
| I7 | `git diff --stat 4acea0d58` below; both changed files read once. |
| I8 | Below, "Commands". |
| I8a | No visible element changed (the `id` changes only the `aria-describedby` value). Item 2 of the prompt (the dev server's console after a reload of `/uk/admin/footer`) is below, partly `BLOCKED`. |
| I9 | Not a security test (no `SEC-` case, no access control); the test fails without the change, as I4 shows. |
| I10 | Not named: not run. |
| I11 | No CI check run locally. |

## `git diff --stat 4acea0d58`

```
 docs/backlog.md                                    |  4 +-
 src/components/admin/AdminFooterManager.tsx        |  4 +-
 .../__tests__/AdminFooterManager.shared.test.tsx   | 50 +++++++++++++++++++---
 ...prompt_Task_989_Site_Settings_Reach_The_Site.md | 17 ++++++++
 4 files changed, 67 insertions(+), 8 deletions(-)
```

`docs/backlog.md` and the kickoff are Opus's and were not touched.

## Item 1 — F13

`src/components/admin/AdminFooterManager.tsx`, the whole diff:

```
-import { useState, useTransition } from 'react'
+import { useId, useState, useTransition } from 'react'
@@ function LinkGroupEditor
   const theme = useMantineTheme()
+  const dndId = useId()
@@
       <DndContext
+        id={dndId}
         sensors={sensors}
```

With `id`, `useUniqueId` returns the value itself (`utilities.esm.js:172-174`), so the handles' `aria-describedby` and the instructions element's `id` are the React `useId` value of that `LinkGroupEditor`, the same in the server render and in the hydration. Each of the three editors (the shared social list, the navigation and information lists of the language tab) gets its own.

Test, `AdminFooterManager.shared.test.tsx`: `renderManager`'s providers moved into `managerTree(sq)`, which `renderManager` renders as before (no existing case changed). New case "the drag handles hydrate with the aria-describedby of the server HTML, and it names the drag instructions":
- `renderToString(managerTree())` twice (`react-dom/server`; the first stands for an earlier request on the same server); the second HTML goes into a `div` attached to `document.body`; every `[data-testid="footer-link-handle"]` there has an `aria-describedby`.
- `console.error` spied, `onRecoverableError` recorded; `hydrateRoot(container, managerTree(), { onRecoverableError })` inside `await act(...)`.
- No `console.error` call whose text matches `hydrated but some attributes|did not match`; no recoverable error.
- Every handle keeps the server HTML's `aria-describedby`, and `document.getElementById(<that id>)` holds `t.drag_instructions`.
- `finally`: the spy restored, the root unmounted inside `act`, the container removed.

## Failing first (I4)

On the unchanged component, `npm test -- src/components/admin/__tests__/AdminFooterManager.shared.test.tsx`:

```
 ❯ src/components/admin/__tests__/AdminFooterManager.shared.test.tsx (14 tests | 1 failed) 11977ms
     × the drag handles hydrate with the aria-describedby of the server HTML, and it names the drag instructions 363ms
AssertionError: expected [ Array(1) ] to deeply equal []
 Test Files  1 failed (1)
      Tests  1 failed | 13 passed (14)
```

Exit 1. The same case alone (`-t "hydrate"`), its message as printed:

```
+   "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:
+ +                                   aria-describedby=\"DndDescribedBy-6\"
+ -                                   aria-describedby=\"DndDescribedBy-3\"
+ +                                   aria-describedby=\"DndDescribedBy-6\"
+ -                                   aria-describedby=\"DndDescribedBy-3\"
```

Exit 1: the mismatch of the owner's log (server and client ids from one module counter), reproduced in one process.

## Commands (I8)

All PowerShell unless named.

1. `npm test -- src/components/admin/__tests__/AdminFooterManager.shared.test.tsx` (after the change):
   ```
    Test Files  1 passed (1)
         Tests  14 passed (14)
   ```
   Exit 0.
2. `npm run typecheck` (output to a temp file) → `EXIT=2`, `total TS errors: 80`, `in src: 0`, `in .next: 80` (the stale generated `.next/types/validator.ts`, as in Revision 3 and Review 5).
3. `npx eslint --no-warn-ignored --max-warnings 0 src/components/admin/AdminFooterManager.tsx src/components/admin/__tests__/AdminFooterManager.shared.test.tsx` → no output, exit 0.
4. `npx vitest related --run --reporter=verbose src/components/admin/AdminFooterManager.tsx src/components/admin/__tests__/AdminFooterManager.shared.test.tsx`:
   ```
   ✓ src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx
   ✓ src/components/admin/__tests__/AdminFooterManager.shared.test.tsx
    Test Files  2 passed (2)
         Tests  17 passed (17)
   ```
   Exit 0.
5. Text search of §8.1 (Git Bash): `grep -rlE "components/admin/AdminFooterManager|admin/__tests__/AdminFooterManager\.shared|LinkGroupEditor|\bdndId\b" src scripts --include=*.test.ts --include=*.test.tsx --include=*.test.mjs` → `src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx` (run in 4), `src/components/admin/__tests__/adminFormsKit.test.ts` (reads the form's source); exit 0.
6. `npm test -- src/components/admin/__tests__/adminFormsKit.test.ts`:
   ```
    Test Files  1 passed (1)
         Tests  8 passed (8)
   ```
   Exit 0.

## Item 2 — the dev server after the change

- The owner's browser could not be reached: the Claude-in-Chrome tool answered "Browser extension is not connected"; the Chrome DevTools tool "Could not connect to Chrome … Could not find DevToolsActivePort". Without a session, `http://localhost:3000/uk/admin/footer` answers 307 (to the sign-in page). `BLOCKED: no reload of /uk/admin/footer in an administrator's session from this session.`
- Read: the dev server's own log `.next/dev/logs/next-development.log` (43 lines; Next writes the server output and the browser console, `"source":"Browser"`, into it; times from the server's start):
  - `00:00:03.724 Browser ERROR` and `00:00:03.725 Server ERROR` "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up." next to pageview events of `/uk/admin/footer`: the error of Review 5, before the change.
  - `00:12:14.592` / `00:12:15.652` "✓ Compiled", `00:12:16.056` and `00:12:16.070` WARN "⚠ Fast Refresh had to perform a full reload when ./src/components/admin/AdminFooterManager.tsx changed", then two browser loads (`00:12:18.826`, `00:12:24.879`, INFO "Download the React DevTools …"). No ERROR line and no hydration message after the change.
  - `UNKNOWN`: which page those two loads were. The log has no pageview line after them; the last pageview is `/uk/admin/settings` at `00:01:24`. So this is not proof of a clean `/uk/admin/footer`.
- What the owner can do: reload `/uk/admin/footer` in the open window; the result is in the browser console and in `.next/dev/logs/next-development.log`, which the reviewer can read.

## Not done

- `BLOCKED`: the reload of `/uk/admin/footer` in an administrator's session (item 2), facts above.
- No Git command run.
