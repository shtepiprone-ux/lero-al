'use server'

import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { trustedRedirectUrl } from '@/lib/auth/trustedOrigin'
import { verifyTurnstile } from '@/lib/captcha/verifyTurnstile'
import { SITE_URL } from '@/lib/siteUrl'
import { cleanSignupMetadata } from '@/modules/auth/lib/signupMetadata'
import { mapAuthError } from '@/modules/auth/lib/mapAuthError'
import { accountStatusByEmail, type AccountStatus } from '@/modules/auth/lib/accountStatus'
import { sendTemplatedEmail } from '@/modules/notifications/lib/sendTemplatedEmail'

// Task 923 R67 (c): Supabase Auth is the ONE verifier of the Turnstile token. A Turnstile token is single-use: these actions used to verify it themselves and then hand
// the same token to Supabase, which, with its own CAPTCHA protection switched on, verified it a second time and refused every sign-up and reset as a replay. The token
// is only checked to be present here and goes to Supabase, which refuses a missing, invalid or replayed one (the `captcha_failed` answer below keeps its meaning).

/** Supabase Auth answers a CAPTCHA refusal with the code `captcha_failed` (and a message that names the captcha) */
function isCaptchaRefusal(error: { code?: string; message?: string }): boolean {
  return error.code === 'captcha_failed' || /captcha/i.test(error.message ?? '')
}

// ── The notice to the owner of an existing address (Task 991, O991-1) ─────────
// A sign-up with an address that already has an account, and a reset request for a blocked address, are answered like any other request (`ok`); the owner of the address is told by
// mail what the page may not say. The account is found by its exact address in one call (`accountStatusByEmail`, Revision 1, F1). Every failure here
// stays inside: a lookup or a limiter that fails sends no mail, and nothing but a code is logged (no address, no text).

/** An address of a shape that cannot be an account's is not looked up (OWASP Input_Validation, Denial_of_Service: the cheap check first). */
function looksLikeAddress(email: unknown): email is string {
  return typeof email === 'string' && email.length > 0 && email.length <= 254 && email.includes('@')
}

/** " deri më 24.12.2026" (the sq text of the template), or nothing for a block with no end date */
function untilText(until: string | null): string {
  if (!until) return ''
  const [year, month, day] = new Date(until).toISOString().slice(0, 10).split('-')
  return ` deri më ${day}.${month}.${year}`
}

/** One notice mail per address per hour (O991-1); a limiter that fails sends nothing (fail closed). */
async function sendAccountNotice(account: AccountStatus): Promise<void> {
  const { data, error } = await createAdminClient().rpc('consume_rate_limit', { bucket: 'account_notice_mail', subject: account.email.toLowerCase(), window_seconds: 3600, max_hits: 1 })
  if (error) {
    console.error('[auth] the account notice limiter failed', { code: error.code })
    return
  }
  if (data !== true) return
  const sent = await sendTemplatedEmail(account.blocked
    ? { key: 'account_blocked', to: account.email, userId: account.id, variables: { supportUrl: `${SITE_URL}/sq/contact`, untilText: untilText(account.until) } }
    : { key: 'account_exists', to: account.email, userId: account.id, variables: { signInUrl: `${SITE_URL}/sq/auth/login` } })
  if (sent.error) console.error('[auth] the account notice was not sent', { code: sent.error })
}

/** Runs after the answer, so neither the answer nor its time depends on the address; never throws. */
async function noticeInBackground(email: string, known?: AccountStatus | null): Promise<void> {
  try {
    const account = known === undefined ? await accountStatusByEmail(email) : known
    if (account) await sendAccountNotice(account)
  } catch {
    console.error('[auth] the account notice failed')
  }
}

// ── Signup with captcha verification ─────────────────────────────────────────

type SignUpResult =
  | { ok: true }
  | { ok: false; reason: 'captcha_failed' | 'signup_failed'; errorKey?: string }

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
  const { data: created, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: trustedRedirectUrl(emailRedirectTo), data: cleanSignupMetadata(data), captchaToken },
  })

  if (error) {
    // Only the code and the status go to the log: no address, no Supabase message. The browser gets a key, never the message.
    console.error('Sign-up refused', { code: error.code, status: error.status })
    if (isCaptchaRefusal(error)) return { ok: false, reason: 'captcha_failed' }
    return { ok: false, reason: 'signup_failed', errorKey: mapAuthError(error.message) }
  }
  // Task 991 (O991-1): for an address that already has an account Auth answers with no error and a user with NO identities (measured 2026-11-19), so the answer cannot tell. The owner of
  // the address gets the mail instead (after the answer, so the answer and its time are the same for every address); this answer stays the neutral `ok`.
  const identities = created?.user?.identities
  if (Array.isArray(identities) && identities.length === 0) after(() => noticeInBackground(email))
  return { ok: true }
}

// ── Password-reset request with captcha verification ──────────────────────────

type ResetResult =
  | { ok: true }
  | { ok: false; reason: 'captcha_failed' | 'reset_failed' }

export async function requestPasswordResetWithCaptcha(params: {
  email: string
  captchaToken: string
  redirectTo: string
}): Promise<ResetResult> {
  const { email, captchaToken, redirectTo } = params

  if (!captchaToken || typeof captchaToken !== 'string') return { ok: false, reason: 'captcha_failed' }

  // Task 991: a blocked or inactive address gets the "blocked" mail instead of a reset link that its ban would make useless. Auth would verify the token for every other request; here
  // nothing goes to Auth, so the token is verified by this action. A lookup that fails cannot show the status, and the request goes to Auth as before.
  // An address of a shape that cannot be an account's (not text, empty, over 254 characters, no `@`) goes to Auth as before, with no lookup (Revision 1, F1).
  let account: AccountStatus | null = null
  if (looksLikeAddress(email)) {
    try {
      account = await accountStatusByEmail(email)
    } catch {
      console.error('[auth] the account lookup of a reset request failed')
    }
  }
  if (account?.blocked) {
    const human = await verifyTurnstile(captchaToken)
    if (!human.success) return { ok: false, reason: 'captcha_failed' }
    const blocked = account
    after(() => noticeInBackground(email, blocked))
    return { ok: true }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: trustedRedirectUrl(redirectTo),
    captchaToken,
  })

  if (error) {
    console.error('Password reset refused', { code: error.code, status: error.status })
    return { ok: false, reason: isCaptchaRefusal(error) ? 'captcha_failed' : 'reset_failed' }
  }
  return { ok: true }
}
