# Session Log — Task 441 REWORK: Regression Shield Slice 2 — Auth-Lifecycle Smoke Tests

**Date:** 2026-06-16
**Task:** Task 441 (rework after orchestrator review) — Regression Shield Slice 2, Auth-lifecycle smoke (PREVENTION ONLY)
**Executor:** Sonnet 4.6
**Epic:** RS (Regression Shield)
**Status:** ✅ COMPLETE — 28/28 tests pass; tsc clean; lint clean; file-integrity clean; registry updated; CI wired

---

## What was built

6 Vitest smoke test files covering all P0 auth lifecycle registry rows (excluding OAuth + magic-link
which require live provider and are documented manual-only per kickoff).

**Scope boundary:** PREVENTION ONLY. No product redesign, no fix to Task 439/433/434/435/437,
no incidental refactors. Tests verify existing behavior.

---

## Investigation notes (required by rework)

### Why Vitest + jsdom (not Playwright)
All behavioral contracts under test (when verifyOtp is called, what state transitions occur,
which error codes are returned) are at action/function call level — not pixel-level visual rendering.
`@testing-library/react` renders the full component tree in jsdom, fires real DOM events, and awaits
async state updates via `act()`. No running Next.js server is needed in CI.

Playwright would add: a full Next.js build, a live Supabase project with seed data, real OAuth providers
for the Google flow, and wall-clock time for page navigations. All of that infrastructure complexity adds
nothing to the behavioral contracts covered here.

Specifically:
- Login/logout (`browser.ts`) → pure function-call contract; no DOM at all.
- Signup / recovery request (server actions) → async function; return-value contract.
- Recovery hook URL format → route handler test; no browser rendering.
- `ResetPasswordClient` mount + submit → RTL exercises the full React lifecycle including
  useEffect, fireEvent, and async `act()`; the contracts (verifyOtp timing, state transitions)
  are fully observable without a running server.
- `deleteOwnAccount` + `consumeEmailChangeToken` → server action; return-value + call-assertion contract.

### How Supabase / captcha are stubbed safely
Each test file mocks at the module boundary — the last seam before the network call:

| Dependency | Stub location | What's proven |
|---|---|---|
| `createClient()` (browser) | `vi.mock('@/lib/supabase/client')` | The action calls `signInWithPassword` with the right args and propagates the result |
| `createClient()` (server) | `vi.mock('@/lib/supabase/server')` | The action calls `signUp` / `resetPasswordForEmail` only after captcha passes |
| `createAdminClient()` | `vi.mock('@/lib/supabase/admin')` | `deleteUser` + `updateUserById` called in the correct sequence and only on success |
| `verifyTurnstile()` | `vi.mock('@/lib/captcha/verifyTurnstile')` | Captcha gate blocks Supabase call when captcha fails |
| `verifyOtp` / `updatePassword` etc. (browser lib) | `vi.mock('@/lib/auth/browser')` | Component calls them only at the right moment and reacts correctly to their result |
| `sendEmail` | `vi.mock('@/modules/notifications/lib/emails/send')` | Hook passes correct React element props (including the URL) to the email sender |

The stubs return typed values matching the Supabase SDK's return shape. No real credentials
are needed because the contracts are about routing control and result propagation, not about
whether Supabase itself accepts the credentials.

### Why no disposable live test user is needed
`verifyOtp` and `auth.admin.deleteUser` require a valid one-time token / real user ID in
a live Supabase project. Stubbing them at the module boundary gives the same behavioral
contract: the test proves the function IS called (or NOT called) at the right moment, and
that the component/action reacts correctly to success or error. Whether Supabase would
actually accept the call is a concern for integration tests or manual E2E — the component's
responsibility is to route correctly, not to implement the Supabase protocol.

### What email / OAuth / magic-link parts are manual-only and why

| Flow | Why manual-only |
|---|---|
| OAuth (Google) | Requires a live Google OAuth provider, a real browser session, a PKCE code, and a working `/auth/callback` redirect. There is no safe way to fake the PKCE exchange in jsdom without reimplementing the Supabase OAuth client, which would test the mock rather than the behavior. |
| Magic link | Requires a real email address, a live Supabase project to generate the token, and a one-time token that can only be used once. Stubbing it would only prove the stub works. |
| Full E2E signup + email click | Requires a real email inbox (or mail intercept service), a live Supabase project, and a real browser. Covered by manual QA checklist and periodic smoke on staging. |

These are documented as manual-only in the kickoff: "If creating this smoke reveals that the action
is not unit-testable without product changes, STOP and ASK." OAuth/magic-link are not
unit-testable without full infra — the decision is to document manual coverage rather than
add a flaky live-dependency test to the blocking CI suite.

---

## Test files

### 1. `src/lib/auth/__tests__/browser.smoke.test.ts` — 4 tests
Login happy, login wrong-creds, logout, logout global scope.

### 2. `src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` — 4 tests
Happy, empty-captcha, turnstile-reject, dup-email/error.

### 3. `src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` — 4 tests
Neutral success, non-enumeration (unknown email → same `{ ok: true }`), captcha fail, supabase error.

### 4. `src/app/api/auth-email-hook/__tests__/recoveryUrl.smoke.test.ts` — 3 tests
Recovery URL → `/auth/reset-password` NOT `/auth/confirm`; locale default; signup type → `/auth/confirm`.

### 5. `src/modules/auth/components/__tests__/ResetPasswordClient.smoke.test.ts` — 5 tests
- **Mount (2):** tokenHash+recovery → no verifyOtp on mount; no tokenHash → getSession only.
- **Submit (3):** verifyOtp called on submit with correct args; success path (link usable post-mount);
  expired/used token → expired state + request-new CTA.

### 6. `src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts` — 8 tests
`deleteOwnAccount` (happy + auth-fail + profile-fail + unauthorized);
`consumeEmailChangeToken` (happy + invalid + consumed + expired).

---

## Planted-violation transcripts (actual runs)

### Violation 1 — `recoveryUrl.smoke.test.ts`
**Change:** `src/app/api/auth-email-hook/route.ts` line 202: `if (type === 'recovery')` → `if (type === '_recovery')`
(all recovery emails now route to `/auth/confirm` instead of `/auth/reset-password`)

**Command:** `npx vitest run src/app/api/auth-email-hook/__tests__/recoveryUrl.smoke.test.ts`

**FAIL output (2 tests fail):**
```
FAIL  …/recoveryUrl.smoke.test.ts > … > recovery type: sendEmail receives a resetUrl pointing to reset-password (NOT /auth/confirm)
AssertionError: expected 'https://lero.al/auth/confirm?token_hash=tok-hash-recovery…' to match /\/auth\/reset-password/
- Expected: /\/auth\/reset-password/
+ Received: "https://lero.al/auth/confirm?token_hash=tok-hash-recovery&type=recovery&next=%2Fsq%2Fauth%2Fverified"
  at recoveryUrl.smoke.test.ts:110:22

FAIL  …/recoveryUrl.smoke.test.ts > … > recovery URL: defaults to /sq/auth/reset-password when redirect_to has no ?next param
AssertionError: expected 'https://lero.al/auth/confirm?token_ha…' to match /^https:\/\/lero\.al\/sq\/auth\/reset-password/
- Expected: /^https:\/\/lero\.al\/sq\/auth\/reset-password/
+ Received: "https://lero.al/auth/confirm?token_hash=test-token-hash&type=recovery&next=%2Fsq%2Fauth%2Fverified"
  at recoveryUrl.smoke.test.ts:122:47

Test Files  1 failed (1) | Tests  2 failed | 1 passed (3)
```

**Revert:** restore `if (type === 'recovery') {`

**PASS rerun:**
```
Test Files  1 passed (1) | Tests  3 passed (3)
```

---

### Violation 2 — `ResetPasswordClient.smoke.test.ts`
**Change:** `src/modules/auth/components/ResetPasswordClient.tsx` — added
`await verifyOtp({ token_hash: tokenHash, type: 'recovery' })` before the `return` in the
`if (tokenHash && otpType === 'recovery')` useEffect branch (simulates the pre-Task-439 bug
where verifyOtp was called on mount, burning the one-time token on scanner GET).

**Command:** `npx vitest run src/modules/auth/components/__tests__/ResetPasswordClient.smoke.test.ts`

**FAIL output (4 of 5 tests fail — all tests that assert verifyOtp not called on mount):**
```
FAIL  … > tokenHash + type=recovery: shows form WITHOUT calling verifyOtp on mount
AssertionError: expected "vi.fn()" to not have been called but was called 1 time(s)
  at ResetPasswordClient.smoke.test.ts:89:35

FAIL  … > form submit: verifyOtp called with correct token_hash + type — NOT on mount
AssertionError: expected "vi.fn()" to not have been called but was called 1 time(s)
  at ResetPasswordClient.smoke.test.ts:135:33

FAIL  … > success path: verifyOtp ok → updatePassword → success state shown (link usable post-mount)
AssertionError: expected "vi.fn()" to not have been called but was called 1 time(s)
  [1st vi.fn() call: Array [{ "token_hash": "valid-once-hash", "type": "recovery" }] Number of calls: 1]
  at ResetPasswordClient.smoke.test.ts:218:31

FAIL  … > expired/used token on submit → expired state + request-new CTA rendered
AssertionError: expected "vi.fn()" to be called once, but got 2 times
  at ResetPasswordClient.smoke.test.ts:267:27

Test Files  1 failed (1) | Tests  4 failed | 1 passed (5)
```

**Revert:** remove the planted `await verifyOtp(…)` line.

**PASS rerun:**
```
Test Files  1 passed (1) | Tests  5 passed (5)
```

---

### Violation 3 — `deleteOwnAccount.smoke.test.ts`
**Change:** `src/modules/cabinet/actions/index.ts` — removed `return { error: 'profile_deleted_auth_failed' }` from
the `if (authError)` branch after `auth.admin.deleteUser` (action returns `{}` even on auth-delete failure —
false success, email not freed).

**Command:** `npx vitest run src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts`

**FAIL output (1 test fails):**
```
FAIL  … > deleteOwnAccount — smoke tests (Task 441) > auth-delete fail → { error: "profile_deleted_auth_failed" } — NOT false success
AssertionError: expected {} to deeply equal { Object (error) }
- Expected: { "error": "profile_deleted_auth_failed" }
+ Received: {}
  at deleteOwnAccount.smoke.test.ts:184:20

Test Files  1 failed (1) | Tests  1 failed | 7 passed (8)
```

**Revert:** restore `return { error: 'profile_deleted_auth_failed' }`

**PASS rerun:**
```
Test Files  1 passed (1) | Tests  8 passed (8)
```

---

## CI wiring

Added as blocking step in `.github/workflows/governance-pr.yml`:
```yaml
- name: Auth lifecycle regression guard (Epic RS Slice 2)
  run: npm run test:auth
```
Placed after the existing `npm test` (unit) step and before Storybook/governance scans.

---

## Final check results

```
npm run test:auth     → 6 files / 28 tests / 0 failed
npx tsc --noEmit      → (no output) — clean
npm run lint          → (no output) — clean
npm run check:file-integrity:all → ✅ 946 file(s) clean
```

---

## AC checklist

| AC | Description | Status |
|---|---|---|
| AC1 | Login + logout smokes (browser.ts functions) | ✅ `browser.smoke.test.ts` — 4 tests |
| AC2 | Signup smoke (signUpWithCaptcha) | ✅ `signUpWithCaptcha.smoke.test.ts` — 4 tests |
| AC3 | Recovery: request (non-enumeration) + hook URL format + client mount (no verifyOtp) + submit-path (verifyOtp on gesture) + success path (link usable post-mount) + expired/used → expired state + request-new CTA | ✅ 3 files, 12 tests total |
| AC4 | Self-delete (email freed) + email-change token (consumed/expired guards) | ✅ `deleteOwnAccount.smoke.test.ts` — 8 tests |
| AC5 | OAuth + magic-link — documented manual-only with justification | ✅ documented above + in test file header |
| AC6 | Registry flipped: 7 rows ❌ → ✅; 2 rows remain ❌ manual-only with explanation | ✅ `docs/critical-flow-registry.md` |
| AC7 | `test:auth` script in package.json | ✅ added |
| AC8 | `test:auth` wired as blocking step in governance-pr.yml CI | ✅ added |
| AC9 | tsc --noEmit clean | ✅ |
| AC10 | lint clean | ✅ |
| AC11 | file-integrity:all clean (946 files) | ✅ |
| AC12 | Planted-violation FAIL/PASS transcripts (3 violations, actual runs) | ✅ documented above |
| AC13 | Investigation notes: harness choice, stubbing approach, no live user, manual-only rationale | ✅ documented above |

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/lib/auth/__tests__/browser.smoke.test.ts` | NEW | Login + logout coverage (AC1) — 4 tests |
| `src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` | NEW | Signup coverage (AC2) — 4 tests |
| `src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` | NEW | Recovery request + non-enumeration guard (AC3) — 4 tests |
| `src/app/api/auth-email-hook/__tests__/recoveryUrl.smoke.test.ts` | NEW | Hook builds reset-password URL NOT /auth/confirm (AC3, Task 439 scanner-GET guard) — 3 tests |
| `src/modules/auth/components/__tests__/ResetPasswordClient.smoke.test.ts` | NEW + EXPANDED | Mount (no verifyOtp) + submit (verifyOtp on gesture) + success path + expired path (AC3) — 5 tests |
| `src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts` | NEW | Self-delete (email freed) + consumeEmailChangeToken guards (AC4) — 8 tests |
| `package.json` | MODIFIED | Add `test:auth` script running all 6 files |
| `.github/workflows/governance-pr.yml` | MODIFIED | Add `npm run test:auth` as blocking CI step |
| `docs/critical-flow-registry.md` | MODIFIED | 7 auth lifecycle rows flipped ❌ → ✅; commands + evidence added; OAuth + magic-link documented manual-only |
| `docs/sessions/2026-06-16-task441-auth-lifecycle-smoke.md` | NEW/UPDATED | This file |
| `docs/backlog.md` | MODIFIED | Last Session updated; Task 441 marked implemented |
