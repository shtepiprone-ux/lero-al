# Task 600 — Harden `check:hydration`: fail on ANY errored page, and prove it catches a real hydration mismatch

Sprint 44 (Epic MM Phase-2 / Epic RS — Regression Shield). Follow-up from the Task 599 review.

> **Why this exists (owner-found, 2026-07-15).** During the Task 599 planted-violation proof, the
> authenticated homepage threw a **corrupted-`.next` runtime error**
> (`Cannot find module '../chunks/ssr/[turbopack]_runtime.js'` via `.next/server/pages/_document.js`)
> — a hard 500, the React app never hydrated — yet `npm run check:hydration -- --with-admin` reported
> **7/7 PASS, 0 FAIL**. Root cause: `scripts/check-hydration-console.mjs` only inspects `page.on('console')`
> for the `HYDRATION_PATTERNS` regexes. It ignores the navigation **HTTP status**, uncaught **`pageerror`**
> exceptions, and the **Next.js dev error-overlay**. So it gives a FALSE PASS on any hard-errored page.
> A consequence: we still do NOT have native proof the gate catches the actual Task 599 `useId` hydration
> mismatch (that run was confounded by the `.next` corruption). This task closes both gaps.

## Pre-read (rule-index → regression/critical-flow + governance)
**Always:** `docs/agent-contract.md` (clauses 1–16, esp. 14 file-integrity + 15 regression), `docs/backlog.md`, `docs/critical-flow-registry.md` (the "Authenticated header hydration — NotificationBell SSR shell" row this task makes real).
**Regression:** `tasks/Epics/Epic_RS_Regression_Shield.md`, `docs/qa-rules.md`.
**Context:** `docs/sessions/2026-07-15-task599-header-auth-hydration-ssr-bell-fix.md`, `tasks/Sprints/Sprint_44_kickoff_prompt_Task_599_HeaderAuthHydrationSSRBellFix.md`.

## Scope (ONLY these files)
- `scripts/check-hydration-console.mjs` — harden `checkRoute` (and add a second self-test).
- `package.json` — a new `check:hydration:error-page` self-test script alias if needed (mirror the existing `check:hydration:verify` / `:admin-config`).
- `docs/critical-flow-registry.md` — flip the Task 599 row coverage once the gate genuinely catches the mismatch (see AC5).
- Session log + `docs/backlog.md`.
- **Do NOT touch product code (`src/`).** This is a gate/tooling task only.

## Current state (verified by orchestrator, 2026-07-15)
`checkRoute` (`scripts/check-hydration-console.mjs:255`) registers only `page.on('console', handler)` filtered by `HYDRATION_PATTERNS`, then `page.goto(url, { waitUntil: 'domcontentloaded' })` and an 800ms wait. It never reads the `Response` returned by `goto`, never listens for `pageerror`, and never checks for the Next error overlay. `status` is `PASS` unless a console message matches a hydration regex.

## Implementation (literal)
### 1. Fail on a non-OK navigation response
- Capture the `Response` from `await page.goto(...)`. If `response && !response.ok()` (status ≥ 400), record a violation `{ type:'http', text: 'HTTP <status> on <url>' }` → route status `FAIL`.
### 2. Fail on uncaught page exceptions (`pageerror`)
- Add `page.on('pageerror', err => …)` for the duration of the navigation; push every uncaught exception as a violation `{ type:'pageerror', text: err.message.slice(0,300) }` → `FAIL`. (This is what catches `Cannot find module …[turbopack]_runtime.js` and any thrown runtime error.)
- Detach the handler in `finally`, same as the console handler.
### 3. Detect the Next.js dev error overlay in the DOM
- After the wait, query for the Next dev overlay (e.g. `nextjs-portal`, `[data-nextjs-dialog]`, or the `#nextjs__container_errors_label` node — confirm the exact selector against the running Next 15 dev overlay; if ambiguous, STOP and ASK rather than guessing a selector). If present, record a violation `{ type:'overlay', text: <overlay heading text> }` → `FAIL`.
### 4. Broaden runtime-error console patterns (do NOT narrow hydration ones)
- Add a small `RUNTIME_ERROR_PATTERNS` set (`/cannot find module/i`, `/unhandled runtime error/i`, `/module not found/i`, `/failed to compile/i`) checked in the same console handler. Keep all existing `HYDRATION_PATTERNS`. A match in either set = violation.
### 5. New self-test proving the harden works (CI-safe, no Next server)
- Add `runErrorPageSelfTest()` (flag `--verify-error-page`, wired as `check:hydration:error-page` in `package.json`) mirroring `runGateSelfTest`: serve THREE tiny local pages — (a) one returning HTTP 500, (b) one that throws an uncaught `pageerror`, (c) one clean 200 page with no errors. Assert (a) and (b) → `FAIL`, (c) → `PASS`. Non-zero exit if any expectation is wrong (prove it is not a no-op). This runs without Next/Playwright browsers only if chromium is available — keep it consistent with how `--verify-gate` already launches chromium.

## Positive flow (happy path)
Actor: CI / owner runs `check:hydration`.
1. A route that returns 200 and hydrates cleanly → `PASS` (unchanged behavior — regression-guard the existing clean routes still pass).
2. `--verify-error-page` self-test → the 500 page and the throwing page both `FAIL`, the clean page `PASS`; script exits 0 (all expectations met).

## Negative flow (every off-happy-path branch)
- **Route returns HTTP 500 (corrupted `.next`, server crash):** `response.ok()` false → `FAIL` with `HTTP 500` (NOT a false PASS). This is the exact Task-599-review case.
- **Route throws an uncaught exception (`Cannot find module …`):** `pageerror` → `FAIL`.
- **Next dev error overlay is shown but console/pageerror somehow silent:** overlay DOM detection → `FAIL`.
- **Real hydration mismatch (`useId` target-id divergence):** existing `HYDRATION_PATTERNS` console match → `FAIL` (must still work — see AC5 native proof).
- **Clean 200 page, no overlay, no errors:** `PASS` (must NOT regress to false FAIL — the self-test's clean page guards this).
- **Selector for the overlay uncertain on Next 15:** STOP and ASK the orchestrator — do NOT guess a selector that silently never matches (that would be a no-op).

## Acceptance criteria (each verifiable in the diff)
1. `checkRoute` reads the `goto` response and `FAIL`s on status ≥ 400. (file:line)
2. `checkRoute` registers a `pageerror` listener and `FAIL`s on any uncaught exception; handler detached in `finally`. (file:line)
3. Next dev error-overlay DOM detection added (or STOP-AND-ASK if the selector is uncertain), `FAIL` when present. (file:line)
4. `RUNTIME_ERROR_PATTERNS` added alongside (not replacing) `HYDRATION_PATTERNS`. (file:line)
5. **New `--verify-error-page` self-test** proves 500 → FAIL, throw → FAIL, clean → PASS (paste transcript). AND — **owner-run native, in a CLEAN `.next` env** (`Remove-Item -Recurse -Force .next` with dev stopped, then `npm run dev`): replant `ssr:false` in `Header.tsx` → the hardened gate must FAIL the authenticated `/en`+`/uk` rows with the `useId`/hydration pattern (NOT an HTTP/overlay error — a genuine hydration console match); revert → PASS. Paste both transcripts. THIS is the proof the Task 599 row needs — flip it to ✅ only after this. If the mismatch still does not surface in the console even on a clean env, STOP and ASK (it may require capturing React's `onRecoverableError` — see the Task 599 session log's "Recommended follow-up").
6. Existing self-tests still green (`check:hydration:verify`, `check:hydration:admin-config`). `check:hydration` on clean routes still PASSes (no false FAIL). Gates: `node --check scripts/check-hydration-console.mjs`, `tsc`=0, eslint clean, `check:file-integrity`, `check:mojibake` green.
7. Session log: AC-by-AC self-audit, "Files Changed" table, both self-test + native transcripts. `docs/backlog.md` + `docs/critical-flow-registry.md` updated. NO `git add`/`git commit` (orchestrator emits at review).

## Hard contract
No product-code (`src/`) change. Do NOT narrow or remove any existing `HYDRATION_PATTERN`. Do NOT guess the Next-overlay selector — verify it or STOP and ASK. The gate must never again report PASS on a page that returned an error status, threw, or shows the error overlay. Self-validate before "complete"; "Files Changed" table required; executor emits NO git.
