interface TurnstileResult {
  success: boolean
  errorCodes?: string[]
}

export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<TurnstileResult> {
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
    const data = await res.json() as { success: boolean; 'error-codes'?: string[] }
    return { success: data.success, errorCodes: data['error-codes'] }
  } catch {
    return { success: false, errorCodes: ['internal-error'] }
  }
}
