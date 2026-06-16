/**
 * Guard smoke — signUpWithCaptcha server action (Task 441 / Epic RS Slice 2).
 *
 * Covers registry P0 auth lifecycle row:
 *   - Signup: valid → { ok: true }; captcha fail → typed error; dup email → typed error.
 *
 * Planted-violation proof:
 *   Remove the `if (!captchaToken) return { ok: false, reason: 'captcha_failed' }` guard
 *   → the empty-captcha test FAILS (proceeds to verifyTurnstile and gets captcha_failed
 *   from there, OR proceeds to Supabase with an empty token).
 *   Simpler: in the "signup failed" test, stub signUp to return success instead of error
 *   → expect(result.ok).toBe(false) FAILS. Revert → PASS.
 *
 * Command: npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockVerifyTurnstile = vi.fn()
vi.mock('@/lib/captcha/verifyTurnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => mockVerifyTurnstile(...args),
}))

const mockSignUp = vi.fn()
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // Default: turnstile succeeds
  mockVerifyTurnstile.mockResolvedValue({ success: true })
  // Default: Supabase signUp succeeds
  mockSignUp.mockResolvedValue({ error: null })
  mockCreateClient.mockResolvedValue({
    auth: { signUp: (...args: unknown[]) => mockSignUp(...args) },
  })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('signUpWithCaptcha — smoke tests (Task 441)', () => {
  it('happy path: valid captcha + email/password → { ok: true }', async () => {
    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'valid-turnstile-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: true })
    expect(mockVerifyTurnstile).toHaveBeenCalledWith('valid-turnstile-token')
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@example.com',
      password: 'SecureP@ss1',
    }))
  })

  it('captcha fail — empty token → { ok: false, reason: "captcha_failed" } without calling Supabase', async () => {
    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: '',               // empty
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: false, reason: 'captcha_failed' })
    // Guard: Supabase must NOT be called when captcha is absent
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('captcha fail — turnstile rejects → { ok: false, reason: "captcha_failed" } without calling Supabase', async () => {
    mockVerifyTurnstile.mockResolvedValue({ success: false, errorCodes: ['invalid-input-response'] })

    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'bad-turnstile-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: false, reason: 'captcha_failed' })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('signup failed (dup email / weak pw) → { ok: false, reason: "signup_failed" } with error message', async () => {
    const supabaseError = { message: 'User already registered', status: 422 }
    mockSignUp.mockResolvedValue({ error: supabaseError })

    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'existing@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'valid-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    // Guard: error must be typed (not raw Supabase error) so caller shows localized copy
    expect(result).toEqual({ ok: false, reason: 'signup_failed', supabaseErrorMessage: 'User already registered' })
  })
})
