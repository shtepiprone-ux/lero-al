# Task 600 — Harden `check:hydration`: fail on ANY errored page, prove it catches a real hydration mismatch

Sprint 44 (Epic MM Phase-2 / Epic RS — Regression Shield). Follow-up from the Task 599 review.
Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_600_HydrationGateHardenErrorPage.md`.

## Summary

During the Task 599 review the owner hit a gate blind spot: a corrupted-`.next` runtime error
(`Cannot find module '../chunks/ssr/[turbopack]_runtime.js'`) produced a hard 500 — the app never
hydrated — yet `check:hydration -- --with-admin` reported 7/7 PASS. Root cause: `checkRoute` only
inspected `page.on('console')` for `HYDRATION_PATTERNS`; it never read the navigation response
status, never listened for uncaught `pageerror`, and never checked the Next dev error-overlay DOM.
This task closes that blind spot and adds a deterministic, CI-safe self-test proving it.

## AC-by-AC self-audit

1. **Non-OK response → FAIL.** ✅ `checkRoute` now captures `response = await page.goto(...)` and
   pushes an `{type:'http', ...}` violation when `response && !response.ok()`
   (`scripts/check-hydration-console.mjs:292-296`).
2. **`pageerror` listener → FAIL.** ✅ `page.on('pageerror', pageErrorHandler)` added alongside the
   existing console handler, detached in the same `finally` block (`:262-283`).
3. **Next dev error-overlay DOM detection.** ✅ NOT guessed — verified empirically against a real
   running Next 15 dev instance (see "Selector verification" below). Selector:
   `document.querySelector('nextjs-portal').shadowRoot.querySelector('#nextjs__container_errors_label')`
   (`:298-311`). Confirmed present only when a genuine error dialog is shown, absent on a clean
   200 page — the `<nextjs-portal>`/`devtools-indicator` element itself is ALWAYS present in dev
   mode and is NOT a valid signal on its own.
4. **`RUNTIME_ERROR_PATTERNS` added, `HYDRATION_PATTERNS` untouched.** ✅ New array
   (`/cannot find module/i`, `/unhandled runtime error/i`, `/module not found/i`,
   `/failed to compile/i`) checked in the same console handler alongside the existing hydration
   patterns — additive, not a replacement (`:123-146`).
5. **`--verify-error-page` self-test + native proof.** ✅ self-test / 🟡 native — see below.
6. **Existing self-tests + clean-route regression guard.** ✅ `check:hydration:verify` and
   `check:hydration:admin-config` both still green (transcripts below). `node --check`, `tsc`=0,
   eslint clean (scripts/ is intentionally eslint-ignored — 0 errors), `check:file-integrity`,
   `check:mojibake` all green.
7. **Session log / Files Changed / registry / backlog.** ✅ This file; `critical-flow-registry.md`
   row extended (kept 🟡 per the kickoff's explicit "flip to ✅ only after the owner native run");
   `docs/backlog.md` updated. No `git add`/`git commit` run.

## Selector verification (empirical, not guessed)

Per the hard contract ("do NOT guess the Next-overlay selector — verify it or STOP and ASK"), I
started a real `next dev` instance and triggered a genuine uncaught error via a temporary
throwaway route (`src/app/[locale]/tmp600errortest/page.tsx`, a client component that
unconditionally `throw`s — created, inspected, then deleted before this diff; confirmed via
`git status --porcelain -- src/app/` showing zero residual change).

- **Clean page** (`/en`, 200): `document.querySelector('nextjs-portal').shadowRoot` exists (the
  devtools-indicator badge is always in dev mode) but `#nextjs__container_errors_label` is `null`,
  `[data-nextjs-dialog]` count is 0, no `[role="dialog"]`.
- **Errored page** (thrown client exception, 500): same shadow root now contains
  `#nextjs__container_errors_label` with text `"Runtime Error"`, `[data-nextjs-dialog]` count 1,
  `[role="dialog"]` present.

This is the exact differential the kickoff asked me to confirm before writing the selector — no
guess, no STOP-AND-ASK needed.

## `--verify-error-page` self-test (CI-safe, deterministic — no Next server)

```
🔬 Error-page self-test (--verify-error-page)
   Purpose: prove checkRoute() FAILs on a hard-errored page instead of a false PASS.

   ✅ HTTP 500 page: expected FAIL, got FAIL — (http) HTTP 500 on http://127.0.0.1:59586/500
   ✅ Uncaught pageerror page: expected FAIL, got FAIL — (pageerror) Task 600 self-test: deliberate uncaught pageerror
   ✅ Clean 200 page: expected PASS, got PASS

✅ ERROR-PAGE HARDENING IS FUNCTIONAL — 500/pageerror FAIL, clean page PASSes.
```

Pre-existing self-tests re-verified green (no regression from the `checkRoute` changes):

```
check:hydration:verify        → ✅ GATE IS FUNCTIONAL (planted hydration violation correctly detected)
check:hydration:admin-config  → ✅ PASSED, states 1–5 all green (Task 599's authenticated-homepage
                                  route gating unaffected by this task's checkRoute changes)
```

## Native / sandbox transcripts (AC5 second half)

Per the kickoff's own framing, this transcript is explicitly "**owner-run native**" — the same
class of requirement as the Task 599 entry (the Cowork sandbox is a screen, not a verdict, per
agent-contract clause 14). What I collected in the sandbox, clean `.next`, fresh captured session:

**Fixed code, clean `.next`, first run after a fresh compile — 3/3 identical clean passes:**
```
Homepage authenticated (en) … PASS ✅   (×3 consecutive runs)
Homepage authenticated (uk) … PASS ✅   (×3 consecutive runs)
```
The SAME runs also caught a genuine, unrelated, real HTTP 404 on `/en/admin/users` — real-world
proof the hardening is not a no-op beyond the synthetic self-test (this 404 is a pre-existing
admin-route/environment issue, out of this task's scope — not investigated further here).

**Violation replanted (both `ssr:false` and `if (loading) return null`), clean `.next` restart:**
Mixed signal across 3 runs — 1 of 3 showed `Homepage authenticated (uk)` FAIL with the expected
`useId`/hydration console pattern; the other 2 runs were confounded by the same ambient sandbox
Turbopack dev-mode flakiness already documented in the Task 599 session log and registry row
(guest routes with zero relationship to the bell — `/sq`, `/uk`, `/listings` — also flipped FAIL
on unrelated unchanged code across these runs). This is consistent with, not contradictory to, the
Task 599 finding: the sandbox cannot produce a clean, low-noise signal for this class of test.

**Reverted, re-verified clean:** `git diff --stat` on both product files returned empty before
moving on — confirmed byte-identical to the committed Task 599 state.

**Conclusion:** the registry row stays 🟡, per the kickoff's explicit instruction. The owner-native
commands to close both the Task 599 row and this task are unchanged from the Task 599 session log
(clean `.next`, fresh `capture:admin-session`, ≥3 runs each direction). The `--verify-error-page`
self-test is the durable, CI-runnable proof that survives regardless of sandbox flakiness.

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/check-hydration-console.mjs` | `checkRoute` hardened: non-OK response → FAIL, `pageerror` listener → FAIL, Next dev error-overlay DOM detection → FAIL; `RUNTIME_ERROR_PATTERNS` added; new `runErrorPageSelfTest()` (`--verify-error-page`); header-comment documentation of the blind spot + hardening + selector verification | Closes the false-PASS blind spot the Task 599 review found (AC1–5) |
| `package.json` | New `check:hydration:error-page` script alias | Wires the new self-test, mirrors the existing `:verify`/`:admin-config` aliases |
| `docs/critical-flow-registry.md` | Extended the Task 599 row with the Task 600 hardening detail + sandbox-observed evidence; row stays 🟡 pending the owner native run | Regression-coverage requirement (agent-contract clause 15); kickoff explicitly says flip to ✅ only after the native run |
| `docs/backlog.md` | Last Session updated | Session-log discipline |

No product code (`src/`) touched in the final diff — the temporary throwaway error route used to
verify the overlay selector was created, inspected, and deleted within this session (confirmed via
`git status --porcelain -- src/app/` showing no residual change).

No `git add`/`git commit` run — orchestrator emits explicit-path commits at review time.
