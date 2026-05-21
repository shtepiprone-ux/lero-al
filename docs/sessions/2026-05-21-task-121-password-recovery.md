# Session Archive: Task 121 — Epic D.4 — Password / Login Recovery — 2026-05-21

## Summary

Implemented the full password recovery flow from scratch (no prior implementation existed). Builds on Task 119 (send helper) and Task 120 (VerifyEmail pattern).

## Deliverables

### 1. `RecoveryEmail.tsx` — React Email template
- `src/modules/notifications/lib/emails/RecoveryEmail.tsx`
- Wraps `BaseEmail`, follows `VerifyEmail` pattern exactly.
- Inline STRINGS for sq / en / uk / it.
- Single coral CTA "Reset password" using `BRAND_ACCENT`.
- Monospace fallback link + expiry/ignore notice.
- Exports `getRecoveryEmailStrings(locale)` — ready for the D.6 Send Email Hook.

### 2. `src/lib/auth/browser.ts` — two new auth helpers
- `requestPasswordReset(email, redirectTo)` — calls `supabase.auth.resetPasswordForEmail()`
- `updatePassword(password)` — calls `supabase.auth.updateUser({ password })`

### 3. `src/modules/auth/actions/recovery.ts` — security logging server actions
- `logPasswordRecoveryRequest()` — logs timestamp only; no email passed (no enumeration risk)
- `logPasswordRecoveryCompletion(userId)` — logs userId + timestamp on successful password change
- Uses `console.info('[security:recovery-request/complete]', ...)` → Vercel logs / Sentry

### 4. `src/modules/auth/components/AuthSheet.tsx` — ForgotPasswordView + LoginView link
- New `'forgot-password'` added to `AuthView` type
- `ForgotPasswordView` component: email input → `requestPasswordReset` + `logPasswordRecoveryRequest`
- **Neutral response**: always shows "if this email exists…" message regardless of whether email is registered — no enumeration leak
- `redirectTo` = `${origin}/auth/callback?next=/${locale}/auth/reset-password`
- "Forgot password?" link added to LoginView password field label row

### 5. `src/modules/auth/components/ResetPasswordClient.tsx` — reset-password client component
- On mount: `getSession()` — session exists → show form; no session → show expired state
- Password validation: min 8 chars + confirm match (client-side, before API call)
- `updatePassword(password)` → on success: `logPasswordRecoveryCompletion(userId)` → `signOut()` → success state
- 4 states: loading / form / success / expired
- Responsive: `min-h-[60vh]` card, `max-w-sm`, `py-8 md:py-12`

### 6. `src/app/[locale]/auth/reset-password/page.tsx` — server wrapper page
- `generateMetadata` with `reset_password_title` key
- Passes `locale` to `ResetPasswordClient`

### 7. i18n — 20 new keys × 4 locales = 80 new strings
Keys added: `forgot_password`, `forgot_password_title`, `forgot_password_body`, `forgot_password_submit`, `forgot_password_success_title`, `forgot_password_success_body`, `forgot_password_back`, `reset_password_title`, `reset_password_new_label`, `reset_password_confirm_label`, `reset_password_submit`, `reset_password_success_title`, `reset_password_success_body`, `reset_password_go_login`, `reset_password_expired_title`, `reset_password_expired_body`, `reset_password_request_new`, `reset_password_error_mismatch`, `reset_password_error_weak`, `reset_password_error_generic`

Locale key count: 956 → 976 × 4 (balanced).

## No-double-email guarantee (same rule as Task 120)

`requestPasswordReset` calls `supabase.auth.resetPasswordForEmail()` which triggers Supabase's own built-in recovery email. The `RecoveryEmail` template is NOT wired for delivery in this task — D.6 (Task 122) does that via the Send Email Hook.

**Until Task 122 ships:** Supabase sends its built-in recovery email.
**After Task 122:** The Send Email Hook intercepts Supabase's auth email dispatch and uses `RecoveryEmail` + `getRecoveryEmailStrings(locale)` instead.

At no point does Task 121 send a second parallel email. The template is prepared but dormant.

## How D.6 wires RecoveryEmail

The Supabase Send Email Hook (Edge Function) receives a payload with `{ type: 'recovery', user, token, token_hash }`. D.6 maps `type === 'recovery'` → `RecoveryEmail` template, resolves locale via `resolveUserLocale(user.id)`, constructs the reset URL from `token_hash`, and sends via `sendEmail()`. The hook registration is a manual owner action in Supabase Dashboard → Authentication → Hooks.

## Recovery flow end-to-end

```
LoginView (AuthSheet) → "Forgot password?" → ForgotPasswordView
  → requestPasswordReset(email, redirectTo)
  → Supabase sends built-in recovery email (until D.6)
  → user clicks recovery link → /auth/callback?code=...&next=/[locale]/auth/reset-password
  → exchangeCodeForSession (PKCE) → redirects to /[locale]/auth/reset-password
  → ResetPasswordClient: getSession() → show form
  → updatePassword(newPassword)
  → logPasswordRecoveryCompletion(userId)
  → signOut()
  → success state → "Log in now" → /[locale]/auth/login
```

## Validation

- `npm run typecheck` — 0 new errors (2 pre-existing test.tsx errors unrelated to this task)
- `npx eslint` on all 6 modified/created files — 0 errors / 0 warnings
- `npm run governance:localization` — PASS (C0/H0/M17, below baseline C0/H0/M18)
- Locale key count: 976 × 4 (balanced)
- `npm run build` — owner's manual step

---

## Post-review hardening (2026-05-21, same day)

Quality review of Task 121 surfaced two items; both actioned this session.

### 1. Governance gap — hardcoded colors bypassed `governance:tailwind`
`scripts/governance/scan-tailwind.mjs` only flagged arbitrary hex (`text-[#...]`,
`bg-[#...]`) and `bg-white`/`bg-black`. It did **not** check raw Tailwind palette
utilities (`text-green-500`, `bg-blue-600`, …), which are not in the project's
semantic-token library (`globals.css`). That blind spot is why a `text-green-500`
shipped and still passed the gate.

Changes:
- Added **Rule T6** — raw palette colors (`text|bg|border|ring|ring-offset|fill|stroke|from|via|to|divide|outline|decoration|accent|caret|placeholder` + palette name + 50–950 shade). Lookbehind/ahead anchors so `hover:`/`dark:` modifiers and `/opacity` suffixes still match, semantic tokens never do.
- Promoted **T3** (hex text) and **T4** (hex/`bg-white`/`bg-black` bg) from MEDIUM → **HIGH**. All hardcoded colors are now HIGH and **block the gate** (MEDIUM/LOW never fail it).
- Storybook `*.stories.tsx` files are exempt from **T6 only** (literal swatches are their purpose).
- Verified empirically: with the rule added, the scan flagged `RegisterForm.tsx:183` as HIGH and failed the gate (+1). After the fix below, tailwind = C0/H0/M0 and the full suite PASSES.

Fix of the lone live violation:
- `src/modules/auth/components/RegisterForm.tsx:183` — success `CheckCircle2`
  `text-green-500` → `text-status-success` (the canonical token already used on
  `/auth/verified` and `/auth/confirm-email`).

Docs:
- `docs/ui-rules.md` §13 — new "Hardcoded color enforcement (governance:tailwind)" table (T3/T4/T6).
- `scripts/governance/baseline.json` — comment updated; tailwind counts unchanged (C0/H0/M0).

Note: `scan-tailwind.mjs`'s own standalone `console.log` icons were changed from
emoji to ASCII tags (`[H]`/`[M]`/…) during the rewrite; the `governance.mjs`
runner summary (what the npm scripts surface) is unchanged and still uses its own
icons. Findings, severities, and gate behavior are identical.

### 2. Forensic logging follow-up — deferred to Task 157
`recovery.ts` logs request (timestamp only) + completion (`userId` + timestamp) —
neutral-by-design to avoid email enumeration, but no IP/user-agent, so weak as an
audit trail. Adding source IP / user-agent / correlation id via `headers()`
(without reintroducing enumeration) is queued as **Task 157**.
Kickoff: `tasks/Epics/Epic_D_kickoff_prompt_Task_157.md`.

### Validation (post-hardening)
- `node --check scripts/governance/scan-tailwind.mjs` — OK.
- `npm run governance:tailwind` — PASS (C0/H0/M0); future hardcoded colors now FAIL the gate.
- `npm run governance` (all) — PASS, no regressions above baseline.
- `npx eslint src/modules/auth/components/RegisterForm.tsx` — 0 errors / 0 warnings.
