# Sprint 35 — Task 418 REWORK — Clean teardown on FAIL + per-page leak fix in the rendered harness

**Type:** Storybook / visual-snapshot harness (TOOLING — not product code) — REWORK of Task 418 (Slice 6a)
**Executor:** Sonnet 4.6
**Status:** OPEN — hand off now (orchestrator diff review of Task 418 found 2 P1 resource-lifecycle defects in the new code)
**Created by:** orchestrator, 2026-06-11, after diff review of `scripts/check-stories-rendered.mjs` @ working tree (base HEAD `bca52538`)
**Reviewer:** Opus 4.7 orchestrator (diff review + owner-native multi-run stability proof)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST**, then the Storybook/visual-snapshot pre-read in the original Task 418 kickoff. Do NOT weaken any assertion or change the matrix to make anything pass.

---

## Why this REWORK exists

Task 418's logic (readiness wait, bounded per-cell retry gated on transient-no-error classes, `waitForServerReady`, port-safety fail-fast, `flaky-recovered` summary) is **sound and stays**. But the orchestrator diff review of the real change found two **P1 resource-lifecycle defects** in the new code. Both undermine the determinism goal of 418 itself — a stabilisation harness must not leak processes/pages.

### P1-a — `process.exit(1)` skips the `finally` teardown (FAIL path leaks browser + server)
In `runAssert()` the failure branch calls `process.exit(1)` **inside the `try`**, while teardown lives in `} finally { await browser?.close(); server?.close(); }`. `process.exit()` terminates the process synchronously and does **not** run the async function's pending `finally` — so on **every FAIL run** the Chromium instance and the static server are never closed. The kickoff's item 3 required the server be "torn down cleanly"; this violates it on the failure path.

### P1-b — `captureCell()` leaks the page on any post-`newPage()` exception
`captureCell()` does `const page = await browser.newPage();` inside the `try`, and only calls `page.close()` on the happy path. Any throw after `newPage` — most commonly the `page.goto(..., { timeout: 20000 })` timeout, or a `screenshot`/`evaluate` error — lands in `catch`, sets `cell.pass = false`, and **never closes the page**. Because a `goto` timeout / `ERR_NO_BUFFER_SPACE` is exactly what `isTransientFailure()` matches on `cell.error`, that cell is then **retried up to 3×**, leaking up to **3 pages per flaky cell**. Across the 2520-cell matrix this can manufacture the very resource-exhaustion / blank-canvas flake the harness is supposed to eliminate.

### P2 (record as tech debt — fix only if trivial, do NOT expand scope)
- **P2-a:** `waitForStoryReady` checks `#storybook-root.children.length > 0` + non-zero bounding box (or the error display), not a Storybook `storyRendered` event or a non-uniform-pixel check. The original kickoff's "e.g. non-empty bbox / non-uniform pixel check" makes bbox acceptable, so this is acknowledged debt, not a defect. If you can cheaply also await `#storybook-root` having a `storyRendered`/`docs-story` signal without new flake, fine; otherwise leave a one-line code comment marking it as the known limit and move on.
- **P2-b:** `waitForServerReady` pings only `/iframe.html`, not a JS chunk. Acceptable (a static server that serves HTML serves its sibling assets), but add a one-line comment noting readiness does not assert a specific chunk 200.

---

## Scope (and NOT)

**In scope — `scripts/check-stories-rendered.mjs` only.**

1. **Make the FAIL path run teardown.** Replace the in-`try` `process.exit(1)` with `process.exitCode = 1;` + a normal `return;` (or restructure so the failure branch falls through to `finally`). The process must still exit non-zero on any FAIL, but only **after** `browser?.close()` and `server?.close()` have run. Verify the exit code is still `1` on FAIL and `0` on all-pass.
2. **Make `captureCell()` always close its page.** Hoist the page handle (`let page;`) and close it in a `finally` inside `captureCell`: `finally { await page?.close().catch(() => {}); }`. The page must be closed on the happy path, on a thrown exception, and on a render-fail-but-no-throw path — exactly once, never leaking, never double-closing.
3. **P2 comments only** as described above. No behavior change for P2.

**NOT in scope:**
- No change to the retry gating, `isTransientFailure`, the assertion logic, the readiness/serve logic, the `flaky-recovered` summary, the matrix (45×14×4 = 2520), or any threshold. This REWORK is lifecycle-correctness ONLY.
- No product code, no `*.stories.tsx`, no locale files, no design-system docs. Harness only.
- Do NOT "fix" flake by lowering any assertion. If determinism regresses, STOP & ASK.

---

## Positive flow (happy path)

1. Apply fix (1) — `process.exitCode = 1; return;` in the FAIL branch; confirm `finally` now runs (browser + server closed) on a failing run, and the process still exits non-zero.
2. Apply fix (2) — `let page;` + `finally { await page?.close().catch(()=>{}); }` in `captureCell`; confirm the page closes on success, on throw, and on render-fail.
3. Add the two P2 clarifying comments.
4. `node --check scripts/check-stories-rendered.mjs` → clean; `npx tsc --noEmit` → 0 new; `npm run lint` → 0 new.
5. **Determinism preserved:** `npm run screenshots:assert` **×3 back-to-back → 2520/2520, 0 FAIL each**, `flaky-recovered` line present. Paste all three transcripts.
6. **FAIL-path teardown proof:** plant one real `<640` overflow → run → confirm (a) the run reports FAIL and exits non-zero, AND (b) browser + server are torn down (no orphaned Chromium / no port-6008 still held after the process exits). Paste evidence (e.g. exit code + `lsof -i:6008` / process check showing nothing left, or an instrumented teardown log line). Then revert the plant → 2520/2520 green.
7. **Page-leak proof:** force a `goto` failure on one cell (e.g. temporarily point one cell at a bad URL or drop the timeout) → confirm the retried cell does not accumulate open pages (instrument/log `browser.contexts()[0].pages().length` staying bounded), then revert.
8. Update `docs/backlog.md` + write/append the session log (before/after for both fixes, all transcripts, Files-Changed table). Emit NO git commands.

## Negative flow (every off-happy-path branch)

- **`process.exit` still anywhere on the FAIL path** → TASK FAILURE (teardown would be skipped again). Grep the file: no `process.exit(` may remain on a path that bypasses `finally` (the port-in-use fail-fast `process.exit(1)` BEFORE the browser/server are created is acceptable — there is nothing to tear down yet; confirm that one runs before `startStaticServer` succeeds).
- **Page closed twice / `page` undefined when closed** → guard with `page?.close().catch(()=>{})`; must not throw.
- **Determinism regressed** (a 3× run flakes) → do NOT lower thresholds; report and STOP & ASK.
- **Exit code wrong** (0 on FAIL, or non-zero on all-pass) → TASK FAILURE; CI relies on it.
- **Scope creep** into assertion/retry/serve logic or any product/story/locale file → forbidden.

---

## Required validation (paste transcripts in the session log)

- `node --check` clean; `npx tsc --noEmit` 0 new; `npm run lint` 0 new; `npm run build-storybook` builds.
- `npm run screenshots:assert` **×3 → 2520/2520, 0 FAIL each** + `flaky-recovered` line.
- FAIL-path teardown proof (exit code non-zero + no orphaned browser/port after exit).
- Page-leak proof (bounded open-page count across a forced-throw retried cell).
- Negative-flow: planted overflow FAILs and exits non-zero with clean teardown; green after revert.
- File-integrity (clause 14) on the one touched file: 0 NUL, no BOM, `node --check` clean, tail re-read.

## Acceptance criteria

- FAIL runs exit non-zero **and** close the browser + static server (no orphaned Chromium, port 6008 released).
- `captureCell()` closes its page on success, throw, and render-fail — no page leak under retry.
- Determinism unchanged: 3 consecutive runs = 2520/2520, 0 FAIL; no assertion weakened; matrix shape unchanged.
- P2-a/P2-b acknowledged via inline comments; no behavior change.
- `tsc=0 new`, `lint=0 new`, `build-storybook` builds, file-integrity GREEN.
- `docs/backlog.md` + session log updated; Files-Changed table matches the real diff. Executor emits NO git commands.

## Ordering

418 REWORK (this) → orchestrator diff review → **owner-native 3× `screenshots:assert` = 2520/2520** (clause 14 — sandbox is a screen, not the verdict) → commit (explicit paths: `scripts/check-stories-rendered.mjs` + `docs/backlog.md` + the 418 session log ONLY; the untracked `scripts/task4xx-*.mjs` and `*.txt` scratch artifacts are EXCLUDED). Then Slice 4b → Slice 5. Slice 6 proper (new DOM assertions for button full-width + popup bottom-sheet) remains separate and open.
