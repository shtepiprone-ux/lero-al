# Task 441 — Regression Shield · SLICE 2: Auth-lifecycle smoke + gates (PREVENTION ONLY)

> **Part of Epic RS (Regression Shield).** See `tasks/Epics/Epic_RS_Regression_Shield.md` +
> `docs/critical-flow-registry.md` (P0 — Auth lifecycle section).
> **🔴 PREVENTION ONLY.** This slice does NOT fix Task 439 (auth recovery + self-delete) or any other live
> bug. It builds the regression net for the auth lifecycle so those flows cannot silently break again.
> Coordinate with Task 439 but do NOT implement 439's product fix here.
> **✅ UPDATE 2026-06-16 — Task 439 HAS LANDED on `main` (`f84f0ce40` + `3cd13c816`, approved + prod-validated).**
> The recovery-prefetch and self-delete-email-reuse cells are NO LONGER `pending-439`: assert the REAL shipped
> behavior (not just the contract), and flip those registry rows to ✅ when the smoke is green. (A separate live
> defect — signup confirmation → `/auth/verified` header mismatch — is owned by **Task 446**, NOT this slice; its
> Signup-confirmation registry row stays open until 446 lands.)

## Goal

Establish a reliable, non-flaky smoke suite + gates covering the P0 auth-lifecycle flows in the registry,
wired into CI, each with a planted-violation FAIL transcript. Smallest reliable happy path + one known
failure/no-op path per flow — NOT every UI state.

## Pre-read (rule-index → Regression/critical-flow + Email/auth lifecycle)

- `docs/agent-contract.md` (clause 15), `docs/backlog.md`, `docs/critical-flow-registry.md`
- `tasks/Epics/Epic_RS_Regression_Shield.md`
- `docs/qa-rules.md`, `docs/env.md`, `docs/integrations.md`, `docs/rls-rules.md`
- `docs/ai-behavior.md` (self-validation)
- Existing infra: `package.json` scripts, `scripts/responsive-screenshots.mjs`,
  `scripts/check-stories-rendered.mjs`, `.github/workflows/governance-pr.yml`, `src/tests/setup.ts`.

## Required investigation (report in session log BEFORE writing tests)

1. Decide the e2e harness: Playwright `^1.60.0` is installed but there is **no e2e config/folder yet**.
   Establish a minimal Playwright config + a `test:e2e` script (or justify vitest+jsdom for non-browser
   flows). STOP and ASK if a test infra decision is genuinely ambiguous — do not invent a parallel stack.
2. How auth runs in dev/test: Supabase client wiring, captcha (Turnstile) in test mode, how to create and
   tear down a disposable test user WITHOUT touching production (env, service-role only on server).
3. Whether email-dependent steps (recovery link, signup confirm) can be asserted via the Send Email Hook /
   a test inbox / token interception, or must be split into a documented manual step.

## Flows to cover (registry: P0 — Auth lifecycle)

For each: happy path + one failure/edge path. Reuse the registry's happy/failure columns as the contract.

- **Login** — valid creds → session; wrong creds → localized error, no session.
- **Signup** — valid → confirm-email triggered; duplicate email / weak password / captcha fail → typed error.
- **Recovery request** — neutral success; **non-enumeration assertion** (unknown vs known email give the
  same response).
- **Recovery link → reset** — link lands on the reset form (not login/verified); **a plain GET on the link
  (scanner simulation) does NOT consume the token** and the user can still reset afterwards; expired/used
  token → localized error + request-new CTA. *(Task 439 has LANDED — assert the REAL shipped behavior:
  `buildConfirmUrl` routes recovery → `/{locale}/auth/reset-password?token_hash=…&type=recovery`, and
  `ResetPasswordClient` calls `verifyOtp` only inside `handleSubmit`, never on mount. This cell is active, not
  pending-439.)*
- **Logout** — session cleared; header reflects guest.
- **OAuth (Google)** + **magic link** — mock/stub where a real provider round-trip is infeasible, or
  document as manual-only with an exact checklist (do not ship a flaky live-OAuth test).
- **Email change** — token consumed → email updated; expired token → error.
- **Self-delete + email reuse** — after self-delete, the **same email can sign up again**; auth-delete
  failure → error, NOT a false success. *(Task 439 has LANDED — assert the REAL shipped behavior:
  `deleteOwnAccount` hard-deletes the users row then calls `auth.admin.deleteUser`, returning distinct
  `delete_failed` vs `profile_deleted_auth_failed` (no false success). This cell is active, not pending-439.)*

## Gate requirements

- Each flow's smoke runs headless in CI via `governance-pr.yml` as a **blocking** step; expose the exact
  local command (e.g. `npm run test:e2e -- auth`).
- The suite must be deterministic (no real external email/OAuth in the blocking path; use stubs/intercepts
  or split to a documented manual checklist).
- Update `docs/critical-flow-registry.md`: flip each covered flow's status to ✅ with its command. The
  recovery-link (prefetch) and self-delete-email-reuse rows are **active** (439 has landed) — flip them to ✅
  once their smoke is green, no pending-439 carve-out. The Signup-confirmation row stays open (owned by Task 446).

## Positive flow

Clean tree: `lint` + `tsc` pass; `test:e2e -- auth` runs the auth smoke suite green (every happy path +
each chosen failure/edge path); registry updated; CI step present.

## Negative flow (PROOF each gate is real)

Planted-violation transcript per gate: break one asserted invariant (e.g. stub `signIn` to always succeed,
or make the recovery link auto-consume on GET) → the corresponding smoke FAILS → revert → green. A gate
that cannot be made to fail is a no-op = TASK FAILURE.

## Out of scope

No product redesign. No fix to Task 439/433/434/435/437. No incidental bug fixes. No flaky live
OAuth/email in the blocking suite. No broad coverage beyond the registry's P0 auth rows.

## Acceptance criteria

- AC1 — e2e harness established (Playwright config + `test:e2e` script) or justified alternative; no parallel stack invented.
- AC2 — Smoke covers every registry P0 auth flow: happy + one failure/edge each (OAuth/magic-link may be mock or documented-manual).
- AC3 — Recovery-link smoke asserts the SHIPPED 439 behavior: lands on reset (not login/verified), scanner-GET does not burn the token, reset completes afterwards, expired path localized. Registry row flipped to ✅ (active, not pending-439).
- AC4 — Self-delete smoke asserts the SHIPPED 439 behavior: email reuse after delete + no false success on auth-delete failure (`delete_failed` vs `profile_deleted_auth_failed`). Registry row flipped to ✅ (active, not pending-439).
- AC5 — Suite is deterministic and wired into `governance-pr.yml` as blocking; exact command documented.
- AC6 — Each gate has a planted-violation FAIL transcript in the session log.
- AC7 — `docs/critical-flow-registry.md` coverage statuses + commands updated.
- AC8 — No fix to live bugs; no unrelated refactor.

## Validation

- `npm run lint`, `npx tsc --noEmit`, the new `test:e2e -- auth`, file-integrity (clause 14) green on every
  touched file. Provide the "Files Changed" table; **do NOT run git** — the orchestrator emits commits.
