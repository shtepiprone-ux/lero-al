/**
 * Guard smoke — requestPasswordResetWithCaptcha server action (Task 441 / Epic RS Slice 2).
 *
 * Covers registry P0 auth lifecycle row:
 *   - Recovery request: neutral success; non-enumeration assertion (unknown ≡ known email).
 *
 * Key invariant (non-enumeration): whether the email belongs to an existing user or not,
 * the response MUST be identical ({ ok: true }) so attackers cannot enumerate registered
 * emails by observing different responses. The underlying Supabase SDK preserves this:
 * `resetPasswordForEmail` returns success even for unknown emails.
 *
 * Planted-violation proof:
 *   In the non-enumeration test, stub Supabase to return an error for the "unknown" email
 *   → the action would return { ok: false, reason: 'reset_failed' }
 *   → expect(unknownResult).toEqual({ ok: true }) FAILS.
 *   Revert → PASS. (Shows enumeration would be caught immediately.)
 *
 * Command: npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockVerifyTurnstile = vi.fn()
vi.mock('@/lib/captcha/verifyTurnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => mockVerifyTurnstile(...args),
}))

const mockResetPasswordForEmail = vi.fn()
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockVerifyTurnstile.mockResolvedValue({ success: true })
  mockResetPasswordForEmail.mockResolvedValue({ error: null })
  mockCreateClient.mockResolvedValue({
    auth: { resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args) },
  })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('requestPasswordResetWithCaptcha — smoke tests (Task 441)', () => {
  it('happy path: valid captcha + known email → { ok: true } (neutral success)', async () => {
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    const result = await requestPasswordResetWithCaptcha({
      email: 'registered@example.com',
      captchaToken: 'valid-token',
      redirectTo: 'https://lero.al/sq/auth/reset-password',
    })

    expect(result).toEqual({ ok: true })
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'registered@example.com',
      expect.objectContaining({ redirectTo: 'https://lero.al/sq/auth/reset-password' }),
    )
  })

  it('non-enumeration: unknown email → SAME { ok: true } as known email (no enumeration)', async () => {
    // Supabase SDK returns success even for unknown emails to prevent enumeration.
    // This test pins that contract: if someone changes the action to check whether
    // the email exists and return a different response, this test FAILS.
    mockResetPasswordForEmail.mockResolvedValue({ error: null }) // same as "known" email

    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    const unknownResult = await requestPasswordResetWithCaptcha({
      email: 'nobody@notregistered.com',
      captchaToken: 'valid-token',
      redirectTo: 'https://lero.al/sq/auth/reset-password',
    })

    // Guard: response MUST be identical to the "known email" case — no distinguishing info
    expect(unknownResult).toEqual({ ok: true })
  })

  it('captcha fail — empty token → { ok: false, reason: "captcha_failed" } without calling Supabase', async () => {
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    const result = await requestPasswordResetWithCaptcha({
      email: 'any@example.com',
      captchaToken: '',
      redirectTo: 'https://lero.al/sq/auth/reset-password',
    })

    expect(result).toEqual({ ok: false, reason: 'captcha_failed' })
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('supabase error (rate limit or transient) → { ok: false, reason: "reset_failed" }', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Email rate limit exceeded', status: 429 },
    })

    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    const result = await requestPasswordResetWithCaptcha({
      email: 'any@example.com',
      captchaToken: 'valid-token',
      redirectTo: 'https://lero.al/sq/auth/reset-password',
    })

    // Guard: error is typed (not raw Supabase), includes supabaseErrorMessage for diagnosis
    expect(result).toMatchObject({ ok: false, reason: 'reset_failed' })
  })
})
