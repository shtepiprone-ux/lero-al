/**
 * Guard smoke — signUpWithCaptcha server action (Task 441 / Epic RS Slice 2).
 *
 * Covers registry P0 auth lifecycle row:
 *   - Signup: valid → { ok: true }; captcha fail → typed error; dup email → typed error.
 *
 * Task 923 R67 (c) / Task 931 R6: Supabase Auth is the ONE verifier of the Turnstile token. The action only checks that a
 * token is present and hands it to `signUp`; a refusal by Supabase (code `captcha_failed`) maps to `captcha_failed`.
 * `verifyTurnstile` stays mocked so that a call to it would be seen.
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
  // The action must not call it (Supabase Auth is the one verifier); it succeeds so that a stray call would not change the result
  mockVerifyTurnstile.mockResolvedValue({ success: true })
  // Default: Supabase signUp succeeds
  mockSignUp.mockResolvedValue({ error: null })
  mockCreateClient.mockResolvedValue({
    auth: { signUp: (...args: unknown[]) => mockSignUp(...args) },
  })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('signUpWithCaptcha — smoke tests (Task 441)', () => {
  it('[SEC-931-SRV-CAPTCHA-ALLOW] happy path: valid captcha + email/password → { ok: true }; the token goes to Supabase and verifyTurnstile is not called', async () => {
    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'valid-turnstile-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: true })
    // Task 923 R67 (c): Supabase Auth is the ONE verifier — the action only hands the token over (a Turnstile token is single-use)
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
    expect(mockSignUp).toHaveBeenCalledTimes(1)
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      options: expect.objectContaining({ captchaToken: 'valid-turnstile-token' }),
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
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
  })

  it('[SEC-931-SRV-CAPTCHA-DENY] captcha fail — Supabase refuses the token → { ok: false, reason: "captcha_failed" }', async () => {
    // Task 923 R67 (c): the action no longer verifies the token itself; Supabase Auth refuses an invalid or replayed one with code `captcha_failed`.
    const refusal = { code: 'captcha_failed', message: 'captcha protection: request disallowed (invalid-input-response)', status: 400 }
    mockSignUp.mockResolvedValue({ error: refusal })

    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'bad-turnstile-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: false, reason: 'captcha_failed', supabaseErrorMessage: refusal.message })
    expect(mockSignUp).toHaveBeenCalledTimes(1)
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({ captchaToken: 'bad-turnstile-token' }),
    }))
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
  })

  it('captcha fail — a refusal that only names the captcha in its message is also captcha_failed', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Captcha verification process failed', status: 400 } })

    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'replayed-turnstile-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: false, reason: 'captcha_failed', supabaseErrorMessage: 'Captcha verification process failed' })
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
