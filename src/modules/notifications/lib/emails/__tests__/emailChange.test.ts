/**
 * Regression coverage for `sendEmailChangeEmails` — Task 860.
 *
 * Task 251 (2026-05-25) mocked this module wholesale in every caller test, so no test ever
 * exercised the real sender. It threw a `RangeError` on `'Europe/Tirana'` (an invalid IANA id;
 * the real Albania zone is `Europe/Tirane`), which no caller catches, so every email-change and
 * resend attempt rejected in production with no email sent. This file imports the REAL
 * `emailChange.ts` and mocks only `./send`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSendEmail = vi.fn()
vi.mock('../send', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

import { sendEmailChangeEmails } from '../emailChange'

describe('sendEmailChangeEmails (Task 860)', () => {
  beforeEach(() => {
    mockSendEmail.mockReset()
    mockSendEmail.mockResolvedValue({ error: null })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-29T00:30:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('T1: resolves and sends both emails with the Tirana wall-clock timestamp (sq layout)', async () => {
    await expect(
      sendEmailChangeEmails({
        userId: 'user-1',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        verificationUrl: 'https://lero.al/sq/auth/confirm-email?token=abc',
        locale: 'en',
      }),
    ).resolves.toBeUndefined()

    expect(mockSendEmail).toHaveBeenCalledTimes(2)
    const toNew = mockSendEmail.mock.calls.find((call) => call[0].to === 'new@example.com')
    const toOld = mockSendEmail.mock.calls.find((call) => call[0].to === 'old@example.com')
    expect(toNew).toBeDefined()
    expect(toOld).toBeDefined()
    expect(toOld![0].html).toContain('29.03.2026, 01:30 p.d.')
  })

  it('T2: includes the mobile device hint in the security email and leaves other content unchanged', async () => {
    await sendEmailChangeEmails({
      userId: 'user-1',
      oldEmail: 'old@example.com',
      newEmail: 'new@example.com',
      verificationUrl: 'https://lero.al/sq/auth/confirm-email?token=abc',
      locale: 'en',
      ip: '203.0.113.5',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36',
    })

    const toOld = mockSendEmail.mock.calls.find((call) => call[0].to === 'old@example.com')
    expect(toOld).toBeDefined()
    expect(toOld![0].html).toContain('Mobile')
    expect(toOld![0].html).toContain('203.0.113.5')
    expect(toOld![0].html).toContain('29.03.2026, 01:30 p.d.')
  })
})
