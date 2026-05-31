# Sprint 30 — Task 335 kickoff (Sonnet) — Password change flow root-cause + forced re-auth verification

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 5, 6, 6a, 7, 8, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits. Sonnet MUST NOT run git.
>
> **Numbering:** Task 335 = third direct Sonnet task in Sprint 30 (renumbered from old "334"). Parallel-safe with Tasks 330 + 334 (disjoint file scope). Wave 1.
>
> **Source:** `issues.md` 2026-05-31 — "Fix password change flow and force re-authentication after successful password update".
>
> **Orchestrator pre-inspection (2026-05-31):** `src/modules/cabinet/components/CabinetPasswordSection.tsx` ALREADY calls `signOut('global')` on success (line 50). The owner-reported failure is therefore NOT "missing logout" — it is "password update never succeeds" OR a specific reason-branch firing wrongly. **Root cause must be identified by reproducing the failure.**

```
Type:     bugfix / auth / UX / security
Priority: HIGH (production bug — users cannot change password)
Area:     src/modules/cabinet/components/CabinetPasswordSection.tsx
          src/modules/cabinet/actions/index.ts (changeCabinetPassword server action)
          src/lib/auth/browser.ts (signOut helper)
          src/lib/passwordRules.ts (allPasswordRulesMet)
          src/components/ui/PasswordInput.tsx + src/components/ui/PasswordRequirementsHint.tsx
          messages/{sq,en,uk,it}.json — cabinet.password_*
```

## Pre-read (bundle: "Profile / edit-flow" + "Email / auth lifecycle")

1. `docs/agent-contract.md`
2. `docs/backlog.md`
3. `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`
4. `docs/ai-behavior.md` → Notes 14 / 18 / 19 / 20 / 23 + Auth Lifecycle Rules + No Fake Fixes Policy
5. `docs/integrations.md` → Supabase Auth Configuration
6. `docs/env.md` + `docs/domain-rules.md`
7. `tasks/Sprints/Sprint_16_kickoff_prompt_Task_271.md` (Password UX refactor history)
8. `docs/sessions/2026-05-28-task-271-password-ux-refactor.md`
9. All Area files
10. `src/lib/auth/server.ts` (server-side auth + cookie handling)
11. `messages/{sq,en,uk,it}.json` — `cabinet.password_*`

## Owner-reported problem

User fills password-change form in profile/account settings; satisfies all visible requirements; change FAILS; new password not applied.

## Required after behavior

1. User enters current password.
2. User enters valid new password (satisfies visible rules; different from current).
3. Update succeeds.
4. User is signed out (`signOut('global')` — existing implementation).
5. User redirected to login.
6. New password works; old password no longer works.

## Current behavior to preserve (Notes 19 / 20 / 23)

`CabinetPasswordSection.tsx` already implements post-success `signOut('global')`. Inventory before editing:
- `currentPassword` + `newPassword` state.
- `submitting` + `rateLimitCooldown` flags.
- `currentInputRef` + `newInputRef` for focus management.
- `allPasswordRulesMet(newPassword)` from `src/lib/passwordRules.ts`.
- `PasswordInputState = 'idle' | 'success' | 'error'`.
- `isSamePassword` detection.
- `submitDisabled` formula (lines 30–35).
- `handleSubmit` → switch on `result.reason` for `invalid_current` / `weak_password` / `same_password` / `rate_limited` / `session_expired` / `server_error`.
- On success: toast → clear inputs → `signOut('global')`.
- `Alert` for error.
- `PasswordInput` + `PasswordRequirementsHint`.

**Every field + control + handler MUST remain functionally identical** unless investigation proves a specific behavior is the root cause. Document each preserved control in session log.

## Positive flow (happy path)

1. User opens `/cabinet` as authenticated user.
2. Scrolls to "Password" section.
3. Enters correct current password.
4. Enters new password satisfying ALL visible requirements (≥ 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special) AND different from current.
5. `allPasswordRulesMet === true`; submit button enabled.
6. Clicks submit. `submitting = true`; button shows `Loader2`.
7. Client calls `changeCabinetPassword({ currentPassword, newPassword })`.
8. Server validates current password (re-auth) + validates new (server-side rules) + calls Supabase `updateUser({ password })`.
9. Server returns `{ ok: true }`.
10. Client: toast `cabinet.password_changed_success`; clears inputs; calls `signOut('global')`.
11. Browser navigates to login page.
12. User logs in with new password → success.
13. Old password tested → rejected.

## Negative flow (every off-happy-path branch)

| Branch | Trigger | Expected response | What is NOT done | Locale key |
|---|---|---|---|---|
| Wrong current password | Re-auth fails | `result.reason='invalid_current'` → Alert `cabinet.password_error_invalid_current`; focus → currentInputRef; user stays logged in | No `updateUser`; no sign-out | `cabinet.password_error_invalid_current` |
| Weak new password | Server rules reject | `result.reason='weak_password'` → Alert `cabinet.password_error_weak`; focus → newInputRef; user stays logged in | No `updateUser`; no sign-out | `cabinet.password_error_weak` |
| Same password | New === current | `result.reason='same_password'` → Alert `cabinet.password_error_same`; focus → newInputRef; user stays logged in. **AC: server check must match client check; do NOT trust client-only.** | No `updateUser` | `cabinet.password_error_same` |
| Supabase rate-limit | Too many attempts | `result.reason='rate_limited'` → Alert `cabinet.password_error_rate_limited`; submit disabled for 30 s with cooldown timer | No `updateUser` | `cabinet.password_error_rate_limited` |
| Session expired mid-submit | Auth cookie invalid | `result.reason='session_expired'` → Alert `cabinet.password_error_session_expired`; auto-signOut('local') after 2 s; redirect to login | No `updateUser` | `cabinet.password_error_session_expired` |
| Network / server 500 | Unexpected error | `result.reason='server_error'` → Alert `cabinet.password_error_server`; form stays editable for retry | No silent success | `cabinet.password_error_server` |
| Double-submit | Click submit twice fast | `submitting` guard no-ops second click | No duplicate write | n/a |
| Cancel/dismiss / navigate away mid-submit | User clicks Back during submit | Submit completes server-side; UI state cleaned on next mount; if success fired → next mount shows logged-out state | n/a | n/a |
| Locale mismatch | User in `uk` locale; server returns en error reason | Client maps `result.reason` → localized message via existing `t()` switch; no raw text leaks | n/a | sq/en/uk/it |
| Passwords ever logged | Server / client logger | **AC: passwords NEVER appear in console / structured logs / Sentry breadcrumbs**. Verify in code review. | n/a | n/a |

## STOP & ASK — server-side current-password verification (CRITICAL)

If the server action does NOT currently verify the current password before calling `updateUser`, the natural fix is `supabase.auth.signInWithPassword({ email, password: currentPassword })` BEFORE `updateUser`. **BUT this call must NOT overwrite the user's existing session cookie** (could cause session-corruption if the existing session is on a different device or has different role claims).

**Sonnet MUST:**
1. Determine whether project already has a safe pattern for "verify password without re-issuing session" (e.g. an isolated Supabase client without cookie writes, or a separate RPC `verify_password(email, password)` server function).
2. If a safe pattern exists → use it.
3. If no safe pattern exists → **STOP & ASK the orchestrator before proceeding.** Do NOT introduce a naked `signInWithPassword` that writes to the active session.

## Required investigation

1. Read `CabinetPasswordSection.tsx` end-to-end (orchestrator confirmed lines 1–144).
2. Read `src/modules/cabinet/actions/index.ts` `changeCabinetPassword` — what does it actually call? Re-auth flow? Documented?
3. Read `src/lib/auth/browser.ts` `signOut('global' | 'local')` — confirm `'global'` is supported.
4. Read `src/lib/passwordRules.ts` `allPasswordRulesMet`. **Compare with server-side rules.** If they differ → that is the bug (visible rules say PASS, server rejects as WEAK).
5. Read `src/components/ui/PasswordRequirementsHint.tsx` — confirm visible checklist matches `allPasswordRulesMet`.
6. Reproduce the failure: open `/cabinet` as test user; fill valid form; submit; capture network response + console + `result.reason` value (via React DevTools or temporary `console.log` of `result.reason`).
7. Based on actual `result.reason`, identify root cause:
   - `invalid_current` returned despite correct password → server-side verification bug.
   - `weak_password` despite all-rules-met → client-server rule mismatch.
   - `same_password` despite different inputs → trim/encoding bug.
   - `rate_limited` → document actual configured limit.
   - `session_expired` → cookie SameSite/domain/lifetime issue.
   - `server_error` → unhandled server exception.
8. Run:
   ```
   rg -n "password|changePassword|updatePassword|updateUser|signOut|currentPassword|newPassword|allPasswordRulesMet|passwordRules" src messages docs
   rg -n "supabase.*auth|auth.update|auth.signOut|signInWithPassword|reauth|session|cookie|AuthRedirect|AuthSheet" src docs
   ```

## Implementation requirements (depends on root-cause finding)

- Apply the **smallest safe fix** that resolves the root cause (No Fake Fixes Policy + Scope Isolation).
- If client-server rule mismatch → both call the SAME shared rule helper (Note 14 single source of truth).
- If server-side current-password verification missing → implement per STOP & ASK protocol above.
- If cookie/session loss → align cookie SameSite/domain/lifetime per existing project pattern (no per-route hacks).
- `signOut('global')` post-success MUST remain.
- After `signOut('global')` user lands on login (existing pattern). Login page should flash "Пароль змінено — увійдіть з новим паролем" if existing flash pattern supports it; do NOT invent.
- Do NOT log passwords or sensitive auth data (verify in code review).
- Do NOT expose raw Supabase errors to user (translate via `result.reason` → localized key).

## Acceptance criteria

- Reproduction documented in session log (`result.reason` for failing case).
- Root cause documented + fixed.
- Wrong current → localized error; user stays logged in.
- Invalid new → localized error; user stays logged in.
- Same password → server-validated localized error.
- Valid current + valid new → password changes; `signOut('global')` fires; user redirected to login; new password works; old rejected.
- Visible rules == server validation (single source).
- Passwords never logged (verifiable).
- Delete-account section UNCHANGED.
- Affected strings localized sq/en/uk/it.
- 14 canonical widths verified (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560).
- 0 new lint errors / 0 new warnings; `pnpm tsc --noEmit` → 0 errors; `pnpm build` passes.
- `docs/backlog.md` + `docs/sessions/2026-05-31-task-335-password-change-reauth-fix.md` updated; Files Changed table; Note 18 self-validation block.

## Out of scope

- Do NOT redesign profile / account settings page.
- Do NOT implement password reset by email (Task 333).
- Do NOT change account-deletion (Tasks 336 + 337).
- Do NOT change registration validation unless shared password validator requires safe consistency fix (Note 14).
- Do NOT change unrelated Supabase auth policies.
- Do NOT fix unrelated console 404s unless they actually block password change.
- Do NOT add MFA.
- Do NOT add global-logout-from-all-devices unless `signOut('global')` already implements it.
- Do NOT expose raw technical errors.

## Validation

```
pnpm tsc --noEmit
pnpm build
pnpm lint
```

## Manual QA

- Log in as normal user.
- Open `/cabinet` → password section.
- Wrong current → localized error; stays logged in.
- Invalid new → localized error; stays logged in.
- Same password → localized error; stays logged in.
- Valid current + valid new → success → forced sign-out → login page.
- Log in with new password → works. Old password → rejected.
- Repeat in sq/en/uk/it.
- Verify all 14 canonical widths.

## Final report

Files Changed table; reproduction notes (`result.reason` captured); root cause; current vs new flow; confirmation visible rules == server validation; confirmation success → signOut → re-login works; confirmation old password rejected; confirmation delete-account section unchanged; confirmation sq/en/uk/it + 14 widths verified; validation results; backlog + session log paths; Note 18 self-validation verdict.
