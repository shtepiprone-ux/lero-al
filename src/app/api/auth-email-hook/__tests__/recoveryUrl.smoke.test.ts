/**
 * Guard smoke — auth-email-hook recovery URL format (Task 441 / Epic RS Slice 2, AC3).
 *
 * Verifies the Task 439 fix: for 'recovery' emails, the hook builds a URL pointing to
 * /{locale}/auth/reset-password?token_hash=…&type=recovery, NOT to /auth/confirm.
 *
 * WHY THIS MATTERS (scanner-GET protection):
 *   If the recovery email linked to /auth/confirm, any prefetch/scanner GET would call
 *   verifyOtp server-side and consume the one-time token, locking the user out.
 *   By routing to the reset-password page with the token as a query param, the token
 *   is only consumed when the user submits the form (client-side handleSubmit, N1 gate).
 *
 * What is tested:
 *   - POST with email_action_type='recovery' → sendEmail called with a React element whose
 *     props.resetUrl matches /{locale}/auth/reset-password?token_hash=…&type=recovery
 *   - POST with email_action_type='signup' → sendEmail called with a React element whose
 *     props.confirmUrl matches /auth/confirm?token_hash=…&type=signup (unchanged)
 *
 * Planted-violation proof:
 *   Change buildConfirmUrl to route 'recovery' to /auth/confirm instead of reset-password →
 *   expect(resetUrl).toMatch(/\/auth\/reset-password/) FAILS (URL is /auth/confirm).
 *   Revert → PASS.
 *
 * Command: npx vitest run src/app/api/auth-email-hook/__tests__/recoveryUrl.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Environment ───────────────────────────────────────────────────────────────

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SITE_URL = 'https://lero.al'
// No SUPABASE_EMAIL_HOOK_SECRET → signature check is skipped (local dev mode in the route)
delete process.env.SUPABASE_EMAIL_HOOK_SECRET

// ── Capture sendEmail calls ────────────────────────────────────────────────────
//
// The route handler calls: sendEmail({ to, subject, react: React.createElement(Template, props) })
// We capture the React element and inspect its props to find the URL.

const mockSendEmail = vi.fn().mockResolvedValue({ ok: true })
vi.mock('@/modules/notifications/lib/emails/send', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

// Stub the string-getter functions (they return { subject } for the locale)
vi.mock('@/modules/notifications/lib/emails/RecoveryEmail', () => ({
  RecoveryEmail: vi.fn(),
  getRecoveryEmailStrings: vi.fn().mockReturnValue({ subject: 'Recovery' }),
}))
vi.mock('@/modules/notifications/lib/emails/VerifyEmail', () => ({
  VerifyEmail: vi.fn(),
  getVerifyEmailStrings: vi.fn().mockReturnValue({ subject: 'Verify' }),
}))
vi.mock('@/modules/notifications/lib/emails/MagicLinkEmail', () => ({
  MagicLinkEmail: vi.fn(),
  getMagicLinkEmailStrings: vi.fn().mockReturnValue({ subject: 'Magic link' }),
}))
vi.mock('@/modules/notifications/lib/emails/ReauthEmail', () => ({
  ReauthEmail: vi.fn(),
  getReauthEmailStrings: vi.fn().mockReturnValue({ subject: 'Reauth' }),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1', email: 'user@example.com' }

function makeHookRequest(emailActionType: string, overrides: Record<string, unknown> = {}) {
  const payload = {
    user: MOCK_USER,
    email_data: {
      token: 'raw-token',
      token_hash: 'test-token-hash',
      redirect_to: 'https://lero.al/sq',
      email_action_type: emailActionType,
      site_url: 'https://test.supabase.co',
      ...overrides,
    },
  }
  return new NextRequest('http://localhost:3000/api/auth-email-hook', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('auth-email-hook recovery URL format — smoke (AC3, Task 439 behavior, Task 441)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendEmail.mockResolvedValue({ ok: true })
  })

  it('recovery type: sendEmail receives a resetUrl pointing to reset-password (NOT /auth/confirm)', async () => {
    const { POST } = await import('../route')
    const req = makeHookRequest('recovery', { token_hash: 'tok-hash-recovery' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalledOnce()

    const sendEmailArg = mockSendEmail.mock.calls[0][0] as { react: { props: { resetUrl: string } } }
    // The RecoveryEmail element is passed as { react: React.createElement(RecoveryEmail, { resetUrl, locale }) }
    const { resetUrl } = sendEmailArg.react.props

    // Critical: recovery emails MUST NOT link to /auth/confirm.
    // A GET to /auth/confirm would call verifyOtp server-side and burn the token.
    expect(resetUrl).toMatch(/\/auth\/reset-password/)
    expect(resetUrl).toContain('token_hash=tok-hash-recovery')
    expect(resetUrl).toContain('type=recovery')
    expect(resetUrl).not.toContain('/auth/confirm')
  })

  it('recovery URL: defaults to /sq/auth/reset-password when redirect_to has no ?next param', async () => {
    const { POST } = await import('../route')
    const req = makeHookRequest('recovery', { redirect_to: 'https://lero.al' })
    await POST(req)

    const sendEmailArg = mockSendEmail.mock.calls[0][0] as { react: { props: { resetUrl: string } } }
    expect(sendEmailArg.react.props.resetUrl).toMatch(/^https:\/\/lero\.al\/sq\/auth\/reset-password/)
  })

  it('signup type: sendEmail receives a confirmUrl pointing to /auth/confirm (standard flow)', async () => {
    const { POST } = await import('../route')
    const req = makeHookRequest('signup', {
      token_hash: 'tok-hash-signup',
      redirect_to: 'https://lero.al/sq?next=/sq/auth/verified',
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalledOnce()

    const sendEmailArg = mockSendEmail.mock.calls[0][0] as { react: { props: { confirmUrl: string } } }
    const { confirmUrl } = sendEmailArg.react.props

    // Signup goes through /auth/confirm — server-side verifyOtp is correct here
    expect(confirmUrl).toContain('/auth/confirm')
    expect(confirmUrl).toContain('token_hash=tok-hash-signup')
    expect(confirmUrl).toContain('type=signup')
  })
})
