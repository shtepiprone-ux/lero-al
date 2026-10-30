'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyTurnstile } from '@/lib/captcha/verifyTurnstile'

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

  if (!captchaToken) return { ok: false, reason: 'captcha_failed' }

  const verify = await verifyTurnstile(captchaToken)
  if (!verify.success) {
    if (verify.errorCodes?.includes('missing-secret')) {
      console.error('[captcha] signUpWithCaptcha: TURNSTILE_SECRET_KEY missing in production')
    }
    return { ok: false, reason: 'captcha_failed' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo, data, captchaToken },
  })

  if (error) return { ok: false, reason: 'signup_failed', supabaseErrorMessage: error.message }
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

  if (!captchaToken) return { ok: false, reason: 'captcha_failed' }

  const verify = await verifyTurnstile(captchaToken)
  if (!verify.success) {
    if (verify.errorCodes?.includes('missing-secret')) {
      console.error('[captcha] requestPasswordResetWithCaptcha: TURNSTILE_SECRET_KEY missing in production')
    }
    return { ok: false, reason: 'captcha_failed' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
    captchaToken,
  })

  if (error) return { ok: false, reason: 'reset_failed', supabaseErrorMessage: error.message }
  return { ok: true }
}
