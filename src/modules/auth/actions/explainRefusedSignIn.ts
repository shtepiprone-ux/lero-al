'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTurnstile } from '@/lib/captcha/verifyTurnstile'
import { accountStatusByEmail } from '@/modules/auth/lib/accountStatus'

// Task 991 (O991-2, owner item 32): Supabase Auth refuses a banned account with `user_banned` BEFORE it checks the password, so the sign-in sheet cannot tell a blocked person from a stranger and
// shows the wrong-credentials text to both (D21, Task 923). This action is called by the sheet after such a refusal. It says `blocked: true` ONLY to a caller that proves the password, so a
// stranger who does not know the password learns nothing: every other case, and every failure, answers `{ blocked: false }`. It never signs anyone in and creates no session.
// Order, cheapest first (OWASP Denial_of_Service): the shape of the input, the Turnstile token, the limit of this address, and only then the costly password check.

export type ExplainRefusedSignInResult = { blocked: true; until?: string } | { blocked: false }

const NOT_BLOCKED: ExplainRefusedSignInResult = { blocked: false }
const MAX_ADDRESS_LENGTH = 254
const MAX_PASSWORD_LENGTH = 1024

export async function explainRefusedSignIn(params: { email: string; password: string; captchaToken: string }): Promise<ExplainRefusedSignInResult> {
  try {
    const { email, password, captchaToken } = params ?? ({} as typeof params)
    // 1. the shape: the types are erased at runtime and the caller is anyone; nothing is looked up for an input that cannot be an address, a password and a token
    if (typeof email !== 'string' || email.length === 0 || email.length > MAX_ADDRESS_LENGTH || !email.includes('@')) return NOT_BLOCKED
    if (typeof password !== 'string' || password.length === 0 || password.length > MAX_PASSWORD_LENGTH) return NOT_BLOCKED
    if (typeof captchaToken !== 'string' || captchaToken.length === 0) return NOT_BLOCKED
    const address = email.trim().toLowerCase()

    // 2. a fresh Turnstile token: this action is a guessing oracle for the password otherwise
    const human = await verifyTurnstile(captchaToken)
    if (!human.success) return NOT_BLOCKED

    // 3. the limit of this address: five checks in 15 minutes; a limiter that fails refuses (fail closed)
    const db = createAdminClient()
    const { data: allowed, error: limitError } = await db.rpc('consume_rate_limit', { bucket: 'blocked_signin', subject: address, window_seconds: 900, max_hits: 5 })
    if (limitError) {
      console.error('[explainRefusedSignIn] the limiter failed', { code: limitError.code })
      return NOT_BLOCKED
    }
    if (allowed !== true) return NOT_BLOCKED

    // 4. the password: compared in the database against the stored hash; the password is an argument of this one call and is logged nowhere
    const { data: matches, error: matchError } = await db.rpc('auth_password_matches', { p_email: address, p_password: password })
    if (matchError) {
      console.error('[explainRefusedSignIn] the password check failed', { code: matchError.code })
      return NOT_BLOCKED
    }
    if (matches !== true) return NOT_BLOCKED

    // 5. the right password: now the status may be told (one exact-address lookup, Revision 1, F1; a lookup that fails throws and is a refusal below)
    const status = await accountStatusByEmail(address)
    if (!status || !status.blocked) return NOT_BLOCKED
    return status.until ? { blocked: true, until: status.until } : { blocked: true }
  } catch {
    console.error('[explainRefusedSignIn] the check failed')
    return NOT_BLOCKED
  }
}
