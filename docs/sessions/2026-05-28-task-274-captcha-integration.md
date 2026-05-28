# Session Log — Task 274: Cloudflare Turnstile captcha on signup + password-reset

**Date:** 2026-05-28  
**Sprint:** 16 (final task — Sprint 16 COMPLETE 🎉)  
**Executor:** Sonnet 4.6

---

## Investigation Outputs

### §1 — AuthSheet imports + entry points
- `signUp` and `requestPasswordReset` called from `@/lib/auth/browser` (client-side helpers)
- `ForgotPasswordView` (lines 173–244): email field + submit; calls `requestPasswordReset` + `logPasswordRecoveryRequest`
- `RegisterView` (lines 504–686): full signup form; calls `signUp`
- `LoginView` (lines 52–168): unchanged — no captcha on login per strategy

### §2 — RegisterForm.tsx
`find src -name "RegisterForm*"` → **not found**. Signup is exclusively through `AuthSheet.tsx` → `RegisterView`. No second entry point to update.

### §3 — Turnstile in package.json
Not present before this task. Installed: `@marsidev/react-turnstile@^1.5.2`. Confirmed in package.json.

### §4 — Existing captcha
`grep -rn "captcha|turnstile|hcaptcha|recaptcha" src/` → 0 results before this task. No existing captcha.

### §5 — Alert/toast pattern
`<Alert variant="destructive">` with `<AlertDescription>` — used in both ForgotPasswordView and RegisterView. Same pattern applied.

### §7 — Auth actions directory
`ls src/modules/auth/actions/` → `recovery.ts` only before this task. New file: `captcha.ts`.

### Strategy decision: `@marsidev/react-turnstile`
Chosen over hand-rolled wrapper. Rationale: provides typed lifecycle management (TurnstileInstance ref, onSuccess/onError/onExpire callbacks, reset() method) in ~5 LoC vs ~80 LoC hand-rolled DOM script. MIT, React 18+ compatible. Installed as production dependency.

---

## Note 20 — AuthSheet before/after control inventory

### ForgotPasswordView
| State | Before | After |
|---|---|---|
| Email field | ✅ | ✅ (unchanged) |
| Submit button | ✅ | ✅ + disabled until `captchaToken !== null` |
| Back button | ✅ | ✅ (unchanged) |
| **CaptchaWidget** | — | ✅ NEW (above submit) |
| **captchaFailed Alert** | — | ✅ NEW (on failure) |

### RegisterView  
| State | Before | After |
|---|---|---|
| Name, email, phone, location, company, password, hint | ✅ | ✅ (all unchanged) |
| Submit button | ✅ | ✅ + disabled until `captchaToken !== null` |
| Register link | ✅ | ✅ (unchanged) |
| **CaptchaWidget** | — | ✅ NEW (above submit) |

### LoginView + OAuth: unchanged ✅

---

## Negative Flow Audit

| Branch | Handler |
|---|---|
| Empty email/password (forgot/signup) | Existing client-side guards (before captcha check) |
| Submit before captcha completes | `captchaToken === null` → `disabled` on Button + early `return` in handleSubmit |
| Captcha widget error (network/adblock) | `onError` → `setCaptchaToken(null)` + error shown |
| Captcha token expired | `onExpire` → `setCaptchaToken(null)` → submit re-disabled |
| Server: verifyTurnstile fails | `captcha.ts:20-24` → `{ ok: false, reason: 'captcha_failed' }` → widget reset + error |
| TURNSTILE_SECRET_KEY missing in prod | `verifyTurnstile.ts:8-10` → `{ success: false, errorCodes: ['missing-secret'] }` + console.error in captcha.ts |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY missing (dev) | `CaptchaWidget.tsx:40-48` → CaptchaDevFallback renders note + calls `onSuccess('dev-noop-token')` |
| dev-noop-token in production | `verifyTurnstile.ts:7` — `NODE_ENV !== 'production'` guard → returns `{ success: false }` |
| Bot calls server action without token | `captcha.ts:18` — `if (!captchaToken) return { ok: false, reason: 'captcha_failed' }` |
| Supabase signup fails after captcha passes | `captcha.ts:33-34` → `{ ok: false, reason: 'signup_failed', supabaseErrorMessage }` → `mapAuthError` |
| Network offline at submit | Server action throws → caught by Next.js → surfaces generic error; widget reset |
| Locale switch mid-form | Captcha re-renders with new locale; user re-completes if needed |
| 320px `uk` viewport | `size="flexible"` on Turnstile widget → no horizontal overflow |

---

## Dev Fallback Dual-Key Guard

| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `TURNSTILE_SECRET_KEY` | `NODE_ENV` | Behavior |
|---|---|---|---|
| absent | absent | dev | Widget shows note + auto-calls `onSuccess('dev-noop-token')`. Server returns `{ success: true }` for the dev token. ✅ Dev works without keys. |
| absent | present | any | Widget shows note + calls `onSuccess('dev-noop-token')`. Server has the real secret → verifies 'dev-noop-token' against Cloudflare → FAILS. Form submits but server rejects. ⚠️ Misconfiguration. |
| present | absent | prod | Widget renders normally → user gets real token. Server has no secret → `{ success: false }`. Captcha always fails. ❌ Deployment misconfiguration. |
| present | present | any | Normal operation. ✅ |

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/captcha/verifyTurnstile.ts` | NEW — server-side Turnstile verification helper (dev-noop dual-key guard, production fails-closed) |
| `src/components/auth/CaptchaWidget.tsx` | NEW — client widget wrapping @marsidev/react-turnstile (reset() ref, dev fallback, 4-locale aria-label) |
| `src/modules/auth/actions/captcha.ts` | NEW — `signUpWithCaptcha` + `requestPasswordResetWithCaptcha` server actions |
| `src/modules/auth/components/AuthSheet.tsx` | UPDATED — signup + forgot-password tabs: captcha state, widget above button, gated submit, error handling; imports updated (removed signUp/requestPasswordReset from browser.ts) |
| `package.json` | UPDATED — `@marsidev/react-turnstile: ^1.5.2` added |
| `messages/sq.json` | UPDATED — 3 new auth captcha keys |
| `messages/en.json` | UPDATED — 3 new auth captcha keys |
| `messages/uk.json` | UPDATED — 3 new auth captcha keys |
| `messages/it.json` | UPDATED — 3 new auth captcha keys |
| `docs/env.md` | UPDATED — `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` + dev-fallback docs |
| `docs/integrations.md` | UPDATED — captcha dependent-task row status: Pending → ✅ Shipped 2026-05-28 |
| `docs/dependencies.md` | UPDATED — `@marsidev/react-turnstile` approved-additions row |
| `docs/sessions/2026-05-28-task-274-captcha-integration.md` | NEW — this file |
| `docs/backlog.md` | UPDATED — Task 274 ✅, Sprint 16 COMPLETE 6/6 |

---

## Owner Action (after git commit + deploy)

1. Obtain Cloudflare Turnstile site key + secret key from Cloudflare Dashboard → Turnstile.
2. Set env vars in Vercel (or Cloudflare Pages) → Settings → Environment Variables:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = your site key
   - `TURNSTILE_SECRET_KEY` = your secret key
3. Flip in Supabase Dashboard → Authentication → Sign In / Providers:
   - **"Captcha protection"** → ON
   - Set the Captcha secret: same `TURNSTILE_SECRET_KEY` value
4. Update `docs/integrations.md` → "Supabase Auth Configuration" → "Captcha protection" row from "OFF (interim)" to "ON".

---

## Self-validation verdict

`Self-validation: tsc=0 errors · build=N/A · AC table=all green · runtime locale=uk structure-verified · scope=clean`
