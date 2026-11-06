# Task 451 — REWORK kickoff: no-session `--with-admin` must NEVER PASS on admin routes (false-green fix)

**Epic:** RS — Regression Shield (Slice 6b)
**Type:** Regression Shield — PREVENTION ONLY (gate-script + self-test only; NO product code)
**Status:** REWORK (Task 451 was IMPLEMENTED but is NOT approved / NOT committed)
**Orchestrator verdict (2026-06-17):** Route back. One blocker confirmed in code; one non-blocker.

---

## Why this is routed back (confirmed against the real file, not the log)

The owner flagged — and I confirmed by reading `scripts/check-hydration-console.mjs` — that
`runChecks()` computes `hasSession` (line 351) but **never uses it to gate admin-route navigation.**

When `--with-admin` runs **without** `HYDRATION_GATE_STORAGE_STATE` and without
`HYDRATION_GATE_COOKIES`, the script:
1. logs `Auth: NO session — admin routes will redirect to login` (line 362), then
2. **still navigates** `/en/admin/users` (and `/en/admin/users/[id]` when `HYDRATION_ADMIN_USER_ID`
   is set).

The unauthenticated request redirects to the login page, the login page has no hydration warning,
so `checkRoute()` returns **PASS** (line 205). Result: **a false green** — the summary reports
`/en/admin/users` PASS while the gate only ever rendered the login page. This defeats the entire
purpose of Slice 6b (real authenticated admin hydration coverage) and is exactly the "no-op /
fake-coverage gate" that agent-contract clause 15 forbids.

Note the G-B self-test (`--verify-admin-config`) does **not** catch this: it only asserts
`ADMIN_ROUTES.length === 2` and the UUID branch — it never asserts the no-session route **plan**.

### What is already correct (do NOT change / do NOT regress)
- Dual-source fail-fast (both `STORAGE_STATE_PATH` and `COOKIES_JSON` set → exit 1). Keep.
- `--verify-admin-config` is server-less / auth-less / deterministic. Keep that property.
- The registry row stays **🟡** until owner live evidence — not flipped to ✅. Keep honest.
- `capture-admin-session.mjs`, npm scripts, CI wiring (G-B only), secrets hygiene. Keep.

---

## Required after-behavior — the route plan, by session state

The script must select admin coverage from **session state**, never navigate an admin route it
cannot really cover. Required matrix:

| State | `/en/admin/users` (list) | `/en/admin/users/[id]` (detail) |
|---|---|---|
| `--with-admin`, **no session** | **SKIP / NOT-REAL-COVERAGE** (not navigated, never PASS) | **SKIP / NOT-REAL-COVERAGE** |
| `--with-admin`, session, **no UUID** | navigated + checked (PASS/FAIL real) | **SKIP / NOT-REAL-COVERAGE** (already the case) |
| `--with-admin`, session, **UUID set** | navigated + checked | navigated + checked |

Implementation guidance (Sonnet decides exact code, but prefer this shape):
- Factor route planning into a single **pure function**, e.g.
  `planRoutes({ withAdmin, hasSession, adminUserId, listingPath }) → Route[]`, returning each admin
  route with `notRealCoverage: true` + a clear `reason` whenever it cannot be really covered
  (no session → reason `"no admin session (HYDRATION_GATE_STORAGE_STATE / HYDRATION_GATE_COOKIES not set)"`).
- `runChecks()` consumes `planRoutes(...)`; the existing `notRealCoverage` SKIP branch (lines
  404–410) then handles the skip + warning + non-green status automatically.
- `verifyAdminConfig()` (G-B) consumes the **same** `planRoutes(...)` so the self-test asserts the
  real plan, not a hard-coded length.

## Positive flow (happy path)
- **Actor:** owner running the documented Step-4 command (storageState + real UUID).
- **Steps:** capture session → `HYDRATION_GATE_STORAGE_STATE=… HYDRATION_ADMIN_USER_ID=… npm run check:hydration -- --with-admin`.
- **System response:** `hasSession === true`, UUID set → both admin routes navigated and checked for
  hydration/console errors; PASS only if the real admin pages render clean.
- **Success state:** summary shows real PASS/FAIL for list + detail; owner can paste it as the
  registry-flip evidence.

## Negative flow (every off-happy-path branch)
- **No session + `--with-admin`:** both admin routes → SKIP `NOT-REAL-COVERAGE` with reason; **never
  PASS**; summary `SKIP` count includes them; exit code unaffected by them (they are not failures,
  but they are not green either). The existing "all routes skipped — is the dev server running?"
  guard (lines 451–455) must still behave sanely (public routes still run).
- **Session, no UUID:** list checked; detail → SKIP `NOT-REAL-COVERAGE` (unchanged).
- **Both session sources set:** fail-fast exit 1 (unchanged — keep).
- **storageState path missing on disk:** existing exit-1 guard (lines 374–379) unchanged.
- **G-B planted violation:** if someone makes a no-session admin route navigable/green, the extended
  `--verify-admin-config` must FAIL (exit 1). Provide the transcript.

---

## Acceptance criteria
- **AC1 (blocker fix):** With `--with-admin` and **no** session source, neither `/en/admin/users`
  nor `/en/admin/users/[id]` is navigated; both report SKIP / NOT-REAL-COVERAGE; **neither can ever
  report PASS.** Verifiable at the `planRoutes`/`runChecks` line in the diff.
- **AC2:** Session-present matrix preserved exactly per the table above (list checked; detail gated
  on UUID).
- **AC3 (G-B hardening — clause 15):** `--verify-admin-config` asserts the route **plan** for all
  three session states (no-session → both notRealCoverage; session-no-UUID → list real + detail
  notRealCoverage; session+UUID → both real), driven by the same `planRoutes` function. It must be
  able to FAIL on a planted violation (e.g. force the no-session admin route navigable) — paste the
  FAIL transcript, then restore → PASS.
- **AC4 (non-blocker, do it here):** Update the top usage/comment block (lines ~18–50) so the
  preferred `HYDRATION_GATE_STORAGE_STATE` + `capture:admin-session` flow is the documented primary
  path; keep the legacy `HYDRATION_GATE_COOKIES` DevTools route only as a clearly-labeled fallback.
  Runbook in the session log must not conflict with the script header.
- **AC5:** No product/route/component/locale change — only `scripts/check-hydration-console.mjs`
  (and, if needed, the session log / registry note). `capture-admin-session.mjs` and CI wiring
  unchanged unless a script-name reference must follow.
- **AC6:** clause-14 integrity: `node --check scripts/check-hydration-console.mjs` passes; 0 NUL
  bytes; file ends on its intended final token. Paste the green integrity transcript.
- **AC7:** Self-validation: `npx tsc --noEmit` = 0, `npm run lint` clean,
  `npm run check:hydration:admin-config` PASS (new 3-state assertions), `npm run check:hydration:verify`
  still FUNCTIONAL. Paste transcripts. AC-by-AC table in the session log.
- **AC8:** Registry row 77 stays 🟡 (owner live evidence still pending) — do NOT flip to ✅; you may
  append a one-line note that the no-session false-green hole is now closed.
- **AC9:** "Files Changed" table in the session log. Do NOT emit git commands (orchestrator does).

## Pre-read
- `docs/agent-contract.md` (clause 14 + clause 15), `docs/backlog.md`,
  `docs/critical-flow-registry.md` (row 77)
- `tasks/Epics/Epic_RS_Regression_Shield.md`
- `docs/qa-rules.md`

## Out of scope
- No new live CI step (owner-run live decision stands).
- No change to the hydration pattern list, public routes, or capture harness behavior.
