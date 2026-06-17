# Task 451 — Regression Shield · SLICE 6b: authenticated admin runtime hydration harness (PREVENTION ONLY)

> **Part of Epic RS (Regression Shield).** Closes the row deferred by Task 445 / Slice 6:
> the **live authenticated admin-route hydration** coverage (`/en/admin/users`, `/en/admin/users/[id]`).
> See `tasks/Epics/Epic_RS_Regression_Shield.md` + `docs/critical-flow-registry.md`
> ("P1 — i18n / hydration / mobile contract", the two admin-route rows).
>
> **🔴 PREVENTION ONLY.** This slice builds/extends the regression net for the admin-route hydration class.
> It does NOT fix or redesign any product route, component, page, layout, formatter, or message file. The
> harness and gate READ the existing app; they do not change it. No "while I'm here" fix (Epic RS hard
> boundary). It must NOT touch the live local bugs (Task 433/434/435/437/439).
>
> **🔴🔴 OWNER SCOPE DECISION CARRIED FROM SLICE 6 (2026-06-17) — DO NOT RE-OPEN, DO NOT WIDEN.**
> **(1) NO admin auth in CI. NO booted-Next CI server.** This slice adds NO CI step that boots Next.js, logs
> in, seeds an admin, or injects auth cookies in CI. The authenticated admin-route hydration check is an
> **OWNER-RUN / native-evidence** check — exactly like the Slice 6 live public-route run. The only thing that
> may become a blocking CI step is a **server-less, auth-less config/wiring self-test** (see G-B below).
> **(2) The admin registry rows flip 🟡 → ✅ ONLY after the owner runs the harness and pastes PASS evidence**
> for BOTH admin routes (list + detail with a real user UUID). No false green; no "it should work" close.
> **(3) NO secrets, cookies, tokens, storage-state, or admin credentials committed to the repo — ever.** All
> captured session artifacts are written to a **git-ignored** path and the credentials come from env / a local
> `.env.local` that is already git-ignored. If a credential or capture file would land in the diff — STOP.
> If you find yourself wanting a live CI server, admin auth in CI, a product change, or to commit any
> session/cookie artifact — **STOP and ASK.** That is the boundary, not the task.

## Why this slice exists (the regression class)

Task 434 was an `/admin/users/[id]` date-format SSR/CSR **hydration mismatch** that shipped green through
`build`/`tsc`/`lint`. Slice 6 (Task 445) made the **public** routes' live hydration check real and owner-runnable,
but the **admin** routes need an authenticated session, and the current capture step is a brittle manual
"export the Supabase cookie from DevTools and paste JSON into `HYDRATION_GATE_COOKIES`" instruction
(`scripts/check-hydration-console.mjs` lines 40–45). That is not repeatable, so the two admin rows in the
registry are honestly stuck at 🟡. This slice builds a **repeatable, documented authenticated-admin capture
harness** so the owner can re-run the admin-route hydration check on demand, plus a deterministic auth-less
self-test that proves the admin branch of the gate is wired (not a no-op).

## What already exists (build ON it — do NOT reinvent)

- `scripts/check-hydration-console.mjs` (Task 436/445): Playwright hydration/console gate.
  - `--verify-gate` → server-less planted-violation self-test (already blocking in `governance-pr.yml`).
  - `npm run check:hydration` → public routes on a running server.
  - `npm run check:hydration --with-admin` → adds `ADMIN_ROUTES` = `/en/admin/users` and
    `/en/admin/users/${HYDRATION_ADMIN_USER_ID}`.
  - Reads `HYDRATION_GATE_COOKIES` (JSON array of Playwright cookie objects) via `context.addCookies(...)`.
  - When `HYDRATION_ADMIN_USER_ID` is unset → admin-detail row is reported **NOT-REAL-COVERAGE / SKIP**
    (never silently dropped, never green). Preserve this honesty.
- The auth login flow used by the app (for the capture helper): `AuthSheet.tsx` → `signIn`
  (`src/lib/auth/browser.ts`). Confirm the exact local login route/form during investigation.
- `.gitignore` — confirm/extend the ignore entries for the new captured-session + any `.env.local`.

## Goal

1. **A repeatable authenticated-admin session capture harness** — a Playwright helper script (e.g.
   `scripts/capture-admin-session.mjs`) that logs in as a **dedicated local/non-prod admin** using
   env-supplied credentials, captures the authenticated session as a Playwright **storageState** (and/or the
   cookie JSON the gate already consumes), and writes it to a **git-ignored** path. Re-running the script
   refreshes the session. NO credential or captured artifact is ever committed.
2. **Wire the hydration gate to consume the captured session** — extend `check-hydration-console.mjs` to read
   the captured storageState file (e.g. `HYDRATION_GATE_STORAGE_STATE=<path>`) **in addition to** the existing
   `HYDRATION_GATE_COOKIES` JSON path (keep backward compatibility; do not remove the existing env var).
3. **A deterministic, server-less, auth-less config self-test (G-B)** — proves the admin branch is not a
   no-op: with `--with-admin` the admin routes are present; with no `HYDRATION_ADMIN_USER_ID` / no session the
   admin-detail row is reported NOT-REAL-COVERAGE (not green); with a session present the admin routes are
   actually navigated. This self-test needs NO running server and NO real auth, so it CAN be a blocking CI step.
4. **An owner runbook** — exact, ordered commands to: set the admin credentials in `.env.local`, run the
   capture helper, then run `check:hydration --with-admin` with a real `HYDRATION_ADMIN_USER_ID`, and read the
   PASS/FAIL summary for `/en/admin/users` + `/en/admin/users/[id]`.
5. **Registry rows flipped to ✅ ONLY on owner-run PASS evidence** for both admin routes; until the owner pastes
   that evidence they stay 🟡 with an honest note. The CI piece is the auth-less G-B self-test, never a booted
   admin-auth CI run.

Smallest reliable harness. NOT a full admin E2E suite. NOT flaky. Deterministic + auth-less in CI; the real
authenticated admin run is owner-run.

## Pre-read (rule-index → Regression/critical-flow + i18n/hydration/mobile)

- `docs/agent-contract.md` (clause 15), `docs/backlog.md`, `docs/critical-flow-registry.md` (the P1 admin rows).
- `tasks/Epics/Epic_RS_Regression_Shield.md` (Slice 6 contract + Definition of done + hard boundary).
- `docs/qa-rules.md` — test/error-handling conventions; "Actionable Error-Toast Rule" + "Encoding hygiene".
- `docs/responsive-screenshot-governance.md` (§MQ machine-detection limits) — context only.
- `docs/env.md` — secret/credential handling; confirm `.env.local` is git-ignored; how local env vars are read.
- `docs/rls-rules.md` + `docs/integrations.md` — only to understand the admin/Supabase auth session shape for
  the capture helper (READ-only context; no RLS/policy change in this task).
- `docs/ai-behavior.md` (Note 18 self-validation).
- **Existing infra to MIRROR/EXTEND:** `scripts/check-hydration-console.mjs`, `package.json`
  (`check:hydration*` scripts), `.github/workflows/governance-pr.yml`, `.gitignore`.

## Required investigation (report in session log BEFORE writing code)

1. **Login seam:** confirm the exact local login route + form selectors `capture-admin-session.mjs` must drive
   (email field, password field, submit), and which Supabase auth cookie names are set on success
   (e.g. `sb-<ref>-auth-token.0/.1`). Confirm whether a Playwright `storageState` cleanly captures them.
2. **Gate consumption:** confirm how to feed the captured session back into `check-hydration-console.mjs`
   (storageState file vs cookie JSON) with the **least** change, preserving the existing `HYDRATION_GATE_COOKIES`
   path. Decide the new env var name (suggested `HYDRATION_GATE_STORAGE_STATE`).
3. **Admin user UUID:** confirm how the owner obtains a real `HYDRATION_ADMIN_USER_ID` (a real user with history
   so `/admin/users/[id]` renders real data, exercising the Task 434 date-format path) and document it.
4. **Secrets hygiene:** confirm `.env.local` and the captured-session path are git-ignored; decide the
   git-ignored output location (e.g. `.auth/admin-storage-state.json`). If anything would be committed → STOP.
5. **CI self-test feasibility:** confirm the G-B config/wiring self-test can run with NO server and NO real auth
   (e.g. by exporting the route-config builder from the script and asserting it in a vitest, or a `--verify-admin-config`
   dry mode). If proving it requires a risky refactor of the script's product-adjacent logic → STOP and ASK.

## What to build

### G-A — Authenticated-admin capture harness (NEW, owner-run)
`scripts/capture-admin-session.mjs` (note any naming deviation):
- Reads admin credentials from env (e.g. `HYDRATION_ADMIN_EMAIL` / `HYDRATION_ADMIN_PASSWORD`) — NEVER hardcoded.
- Launches Playwright, drives the real login flow against `BASE_URL`, waits for the authenticated session.
- Writes a Playwright `storageState` (and/or the cookie JSON shape the gate consumes) to a **git-ignored** path.
- Prints the exact follow-up command to run the admin hydration check. Fails loudly (non-zero) if login fails or
  no auth cookie is captured — never writes an empty/partial session and never prints a false success.

### G-B — Deterministic admin-config self-test (NEW, server-less, auth-less → CI-blocking)
- Proves the admin branch is not a no-op WITHOUT a server or real auth. Acceptable forms (pick the least-risky):
  - a vitest that imports an exported route-config/`buildAdminRoutes` helper from the script and asserts:
    `--with-admin` includes `/en/admin/users` + the detail route; unset `HYDRATION_ADMIN_USER_ID` → detail row
    flagged `notRealCoverage` (not green); set → detail path uses the UUID; OR
  - a `--verify-admin-config` dry mode in the script that asserts the same and exits non-zero on misconfig.
- This is the "gate is real" proof for the admin branch; it MUST be able to FAIL on a planted misconfig.

### Gate wiring
- Add an npm script for G-A capture (e.g. `"capture:admin-session"`) and for G-B self-test (e.g.
  `"check:hydration:admin-config"` or fold into an existing verify). Wire **only G-B** into
  `governance-pr.yml` as a blocking step. Do NOT wire G-A or the live `check:hydration --with-admin` into CI.
- Document the owner-run admin command:
  `HYDRATION_GATE_STORAGE_STATE=.auth/admin-storage-state.json HYDRATION_ADMIN_USER_ID=<uuid> BASE_URL=http://localhost:3000 npm run check:hydration --with-admin`

## Owner-run LIVE evidence (documented in session log — NOT a CI step)

Provide the exact ordered commands and leave a clearly-marked slot for the owner's pasted result:
1. set `HYDRATION_ADMIN_EMAIL` / `HYDRATION_ADMIN_PASSWORD` in `.env.local` (git-ignored);
2. `npm run dev` (or `next start`);
3. `npm run capture:admin-session` → writes git-ignored storageState;
4. `HYDRATION_GATE_STORAGE_STATE=… HYDRATION_ADMIN_USER_ID=<real-uuid> BASE_URL=http://localhost:3000 npm run check:hydration --with-admin`
   → paste the PASS summary for `/en/admin/users` AND `/en/admin/users/[id]`.

State explicitly these are owner-run because they need a live authenticated runtime, per the 2026-06-17 scope
decision. If the executor cannot run them (no local runtime / no admin creds / no real UUID), they MUST NOT
invent PASS — record the exact owner-native commands and leave the admin rows 🟡 (carried from Slice 6 addendum).

## Positive flow

Clean tree: `npm run lint` + `npx tsc --noEmit` pass; the G-B admin-config self-test runs green and is wired
blocking in CI; `npm run check:hydration:verify` still PASS; `npm run check:file-integrity:all` clean. The
capture helper runs locally and produces a git-ignored session; the owner-run `check:hydration --with-admin`
returns PASS for both admin routes (owner pastes evidence). `docs/critical-flow-registry.md` admin rows updated
per the result (✅ only with owner evidence, else 🟡 + honest note). `.gitignore` covers the new artifacts.

## Negative flow (PROOF the harness + gate are real)

- **G-A capture fail:** wrong/empty credentials → the helper exits non-zero, writes NO session file, prints no
  false success (transcript in session log).
- **G-B self-test:** a planted misconfig (e.g. admin route dropped from the builder, or detail row marked green
  while UUID unset) → the self-test FAILS; revert → green (transcript in session log). A self-test that cannot
  be made to fail is a no-op = TASK FAILURE.
- **Missing session at check time:** running `check:hydration --with-admin` with no session/UUID → admin rows
  reported NOT-REAL-COVERAGE / SKIP, never PASS (preserve existing behavior; show it in the log).
- **No fabricated live PASS:** if the owner-run admin evidence is unavailable, rows stay 🟡 — never invented.

## Registry update (required — be honest)

In `docs/critical-flow-registry.md` "P1 — i18n / hydration / mobile contract":
- **Hydration / console errors — admin routes (`/en/admin/users`, `/en/admin/users/[id]`)** → flip 🟡 → **✅
  ONLY if** the owner pastes PASS evidence for BOTH routes via the new harness; otherwise keep 🟡 and update the
  note to: "repeatable capture harness (`capture:admin-session`) + storageState wiring landed (Task 451);
  CI piece = auth-less admin-config self-test (G-B) blocking; live authenticated run is owner-run — flips to ✅
  when owner pastes `check:hydration --with-admin` PASS for list + detail with a real UUID."
- Reference the new owner-run command and the G-B CI self-test. Do NOT claim any authenticated admin run happens
  in CI. No false green.

## Out of scope

No product/route/component/page/formatter/message change; **no booted-Next CI step, no admin auth in CI, no
live `check:hydration --with-admin` CI job**; no committed secrets/cookies/tokens/storageState/credentials; no
fix to Task 433/434/435/437/439; no incidental bug fixes; no edits to the Slice 2–6 smokes or the public-route
hydration behavior; no RLS/policy change. If the capture helper or self-test cannot be built without changing
product code or committing a secret → STOP and ASK.

**No rendered product UI is modified (harness + gate + docs only), so the `<640` full-width product gate is N/A
— state this explicitly in the session log.**

## Acceptance criteria

- **AC1** — NEW G-A `scripts/capture-admin-session.mjs`: logs in via env-supplied admin credentials, writes a
  **git-ignored** storageState/cookie artifact, prints the follow-up command; fails loudly with no artifact on
  bad/empty credentials.
- **AC2** — `check-hydration-console.mjs` extended to consume the captured session (e.g.
  `HYDRATION_GATE_STORAGE_STATE`) **without removing** the existing `HYDRATION_GATE_COOKIES` path; admin-route
  NOT-REAL-COVERAGE honesty preserved when session/UUID absent.
- **AC3** — NEW G-B deterministic, server-less, auth-less admin-config self-test that asserts the admin branch
  wiring and can FAIL on a planted misconfig.
- **AC4** — npm scripts added (`capture:admin-session`, the G-B self-test) and **only G-B** wired into
  `governance-pr.yml` as a blocking step; exact owner-run admin command documented (NOT in CI).
- **AC5** — Negative-flow transcripts in the session log: G-A bad-credentials no-artifact; G-B planted-misconfig
  FAIL → revert → PASS; admin-without-session → NOT-REAL-COVERAGE.
- **AC6** — Owner-run LIVE evidence section in the session log with the exact ordered commands; admin-route
  PASS results pasted by the owner OR rows left 🟡 (no fabricated PASS).
- **AC7** — `docs/critical-flow-registry.md` admin rows updated honestly (✅ only with owner evidence, else 🟡 +
  harness-landed note); no CI-auth claim; no false green.
- **AC8** — `.gitignore` covers the captured-session path and any `.env.local`; the diff contains NO secret,
  cookie, token, storageState, or credential. (Verify the diff explicitly.)
- **AC9** — No product/route/component/formatter/message change; no admin-auth-in-CI; no booted-Next CI; no fix
  to live bugs; Slice 2–6 smokes + public-route hydration behavior unedited.
- **AC10** — `npx tsc --noEmit` clean.
- **AC11** — `npm run lint` clean.
- **AC12** — `npm run check:file-integrity:all` clean (every touched file: 0 NUL, parses, not truncated).
- **AC13** — Investigation notes (login seam, gate consumption, admin UUID source, secrets hygiene, CI self-test
  feasibility, and confirmation the `<640` product gate is N/A) in the session log.

## Validation

- `npm run lint`, `npx tsc --noEmit`, the G-B admin-config self-test, `npm run check:hydration:verify`,
  `npm run check:file-integrity:all` — all green on every touched file. Provide the AC-by-AC self-audit table +
  the **"Files Changed"** table in the session log. **Do NOT run git** — the orchestrator reviews the diff and
  emits the commit commands.

## Deliverables / expected Files Changed

- `scripts/capture-admin-session.mjs` — NEW (G-A authenticated-admin session capture harness)
- `scripts/check-hydration-console.mjs` — MODIFIED (consume captured storageState; G-B config self-test or
  `--verify-admin-config` dry mode; preserve existing behavior)
- `package.json` — MODIFIED (`capture:admin-session` + G-B self-test scripts)
- `.github/workflows/governance-pr.yml` — MODIFIED (blocking G-B self-test step ONLY; no live admin run)
- `.gitignore` — MODIFIED (git-ignore captured-session artifact + `.env.local` if not already)
- `docs/critical-flow-registry.md` — MODIFIED (admin rows per result; harness-landed note)
- `docs/sessions/2026-06-1X-task451-admin-runtime-hydration-harness.md` — NEW (session log; adjust date)
- `docs/backlog.md` — MODIFIED (Last Session + Task 451 status)

(If the G-B self-test cleanly belongs in a small vitest instead of the script, that is acceptable — note the
deviation in Files Changed. Any need for product code, admin-auth-in-CI, a booted-Next CI step, or committing a
secret → STOP and ASK, do not proceed.)
