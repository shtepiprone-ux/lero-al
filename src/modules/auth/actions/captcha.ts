'use server'

import { createClient } from '@/lib/supabase/server'
import { trustedRedirectUrl } from '@/lib/auth/trustedOrigin'
import { cleanSignupMetadata } from '@/modules/auth/lib/signupMetadata'

// Task 923 R67 (c): Supabase Auth is the ONE verifier of the Turnstile token. A Turnstile token is single-use: these actions used to verify it themselves and then hand
// the same token to Supabase, which, with its own CAPTCHA protection switched on, verified it a second time and refused every sign-up and reset as a replay. The token
// is only checked to be present here and goes to Supabase, which refuses a missing, invalid or replayed one (the `captcha_failed` answer below keeps its meaning).

/** Supabase Auth answers a CAPTCHA refusal with the code `captcha_failed` (and a message that names the captcha) */
function isCaptchaRefusal(error: { code?: string; message?: string }): boolean {
  return error.code === 'captcha_failed' || /captcha/i.test(error.message ?? '')
}

// ── Signup with captcha verification ─────────────────────────────────────────

type SignUpResult =
  | { ok: true }
  | { ok: false; reason: 'captcha_failed' | 'signup_failed'; supabaseErrorMessage?: string }

export async function signUpWithCaptcha(params: {
  email: string
  password: string
  captchaToken: string
  emailRedirectTo: string
  data?: Record<string, unknown>
}): Promise<SignUpResult> {
  const { email, password, captchaToken, emailRedirectTo, data } = params

  if (!captchaToken || typeof captchaToken !== 'string') return { ok: false, reason: 'captcha_failed' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: trustedRedirectUrl(emailRedirectTo), data: cleanSignupMetadata(data), captchaToken },
  })

  if (error) return { ok: false, reason: isCaptchaRefusal(error) ? 'captcha_failed' : 'signup_failed', supabaseErrorMessage: error.message }
  return { ok: true }
}

// ── Password-reset request with captcha verification ──────────────────────────

type ResetResult =
  | { ok: true }
  | { ok: false; reason: 'captcha_failed' | 'reset_failed'; supabaseErrorMessage?: string }

export async function requestPasswordResetWithCaptcha(params: {
  email: string
  captchaToken: string
  redirectTo: string
}): Promise<ResetResult> {
  const { email, captchaToken, redirectTo } = params

  if (!captchaToken || typeof captchaToken !== 'string') return { ok: false, reason: 'captcha_failed' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: trustedRedirectUrl(redirectTo),
    captchaToken,
  })

  if (error) return { ok: false, reason: isCaptchaRefusal(error) ? 'captcha_failed' : 'reset_failed', supabaseErrorMessage: error.message }
  return { ok: true }
}
