import { SITE_URL } from '@/lib/siteUrl'

interface TurnstileResult {
  success: boolean
  errorCodes?: string[]
}

/** Cloudflare documents a token as at most 2048 characters; anything longer is not one and is not sent. */
const MAX_TOKEN_LENGTH = 2048

interface SiteverifyAnswer {
  success: boolean
  'error-codes'?: string[]
  action?: string
  hostname?: string
  metadata?: { result_with_testing_key?: boolean }
}

/**
 * With `expected`, a successful answer must also be for that action and for this site (Cloudflare: "Validate the action and hostname when specified"). Cloudflare's published
 * test keys answer with the hostname `example.com`, no action and `metadata.result_with_testing_key`: such an answer is accepted outside production only, without the comparison.
 */
function checkExpected(data: SiteverifyAnswer, expected: { action: string }): TurnstileResult {
  const production = process.env.NODE_ENV === 'production'
  if (data.metadata?.result_with_testing_key === true) {
    return production ? { success: false, errorCodes: ['testing-key-in-production'] } : { success: true, errorCodes: data['error-codes'] }
  }
  if (data.action !== expected.action) return { success: false, errorCodes: ['action-mismatch'] }
  const siteHostname = new URL(SITE_URL).hostname
  const hostnameOk = data.hostname === siteHostname || (!production && (data.hostname === 'localhost' || data.hostname === '127.0.0.1'))
  if (!hostnameOk) return { success: false, errorCodes: ['hostname-mismatch'] }
  return { success: true, errorCodes: data['error-codes'] }
}

export async function verifyTurnstile(
  token: unknown,
  remoteIp?: string,
  expected?: { action: string },
): Promise<TurnstileResult> {
  // The token comes from a browser and its type is erased: only a non-empty string of a plausible length is ever sent to Cloudflare.
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { success: false, errorCodes: ['invalid-input'] }
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    if (process.env.NODE_ENV !== 'production' && token === 'dev-noop-token') {
      console.warn('[captcha] TURNSTILE_SECRET_KEY not set — captcha verification skipped (dev only).')
      return { success: true }
    }
    return { success: false, errorCodes: ['missing-secret'] }
  }

  try {
    const body = new URLSearchParams({ secret: secretKey, response: token })
    if (remoteIp) body.set('remoteip', remoteIp)

    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body, cache: 'no-store' },
    )
    const data = await res.json() as SiteverifyAnswer
    // Fail closed (Task 923 Revision 7): only the literal boolean `true` is a verified human. A truthy string or number from a proxy or a changed API is not.
    if (data.success !== true) return { success: false, errorCodes: data['error-codes'] }
    if (expected) return checkExpected(data, expected)
    return { success: true, errorCodes: data['error-codes'] }
  } catch {
    return { success: false, errorCodes: ['internal-error'] }
  }
}
