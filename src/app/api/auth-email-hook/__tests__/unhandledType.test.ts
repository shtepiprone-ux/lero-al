// @vitest-environment node
/**
 * Task 951 AC3 (CodeQL js/log-injection): `email_action_type` comes from the request body. An unhandled type is logged, and a line break in it would forge a
 * second log line. The value reaches the log as one bounded line without control characters.
 */
import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

vi.mock('@/modules/notifications/lib/emails/send', () => ({ sendEmail: vi.fn(async () => ({})) }))
vi.mock('@/modules/notifications/lib/emails/RecoveryEmail', () => ({ RecoveryEmail: vi.fn(), getRecoveryEmailStrings: vi.fn().mockReturnValue({ subject: 'Recovery' }) }))
vi.mock('@/modules/notifications/lib/emails/VerifyEmail', () => ({ VerifyEmail: vi.fn(), getVerifyEmailStrings: vi.fn().mockReturnValue({ subject: 'Verify' }) }))
vi.mock('@/modules/notifications/lib/emails/MagicLinkEmail', () => ({ MagicLinkEmail: vi.fn(), getMagicLinkEmailStrings: vi.fn().mockReturnValue({ subject: 'MagicLink' }) }))
vi.mock('@/modules/notifications/lib/emails/ReauthEmail', () => ({ ReauthEmail: vi.fn(), getReauthEmailStrings: vi.fn().mockReturnValue({ subject: 'Reauth' }) }))

import { POST } from '../route'

const env = { ...process.env }
const SECRET_RAW = Buffer.from('a-test-webhook-secret-of-32-bytes!').toString('base64')

function signedRequest(type: string): NextRequest {
  const raw = JSON.stringify({
    user: { id: 'u1', email: 'person@example.com' },
    email_data: { token: 't', token_hash: 'H', redirect_to: 'https://lero.al/sq', email_action_type: type, site_url: 'https://x.supabase.co' },
  })
  const ts = Math.floor(Date.now() / 1000)
  const sig = createHmac('sha256', Buffer.from(SECRET_RAW, 'base64')).update(`msg_1.${ts}.${raw}`).digest('base64')
  return new NextRequest('https://lero.al/api/auth-email-hook', {
    method: 'POST',
    body: raw,
    headers: { 'webhook-id': 'msg_1', 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}`, 'content-type': 'application/json' },
  })
}

let warn: MockInstance<typeof console.warn>
beforeEach(() => {
  process.env.SUPABASE_EMAIL_HOOK_SECRET = `v1,whsec_${SECRET_RAW}`
  process.env.NEXT_PUBLIC_SITE_URL = 'https://lero.al'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { process.env = { ...env }; vi.restoreAllMocks() })

const MARKER = 'Unhandled email_action_type'
const loggedText = () => warn.mock.calls.map((call) => call.map(String).join(' ')).join('\n')
/** what the log line carries after the fixed message */
const loggedValue = () => {
  const text = loggedText()
  return text.slice(text.indexOf(MARKER) + MARKER.length).replace(/^[:\s]+/, '')
}

describe('an unhandled email_action_type is logged as one bounded line', () => {
  it('a type with CR, LF and 1,000 characters writes one log line with at most 64 characters of the value', async () => {
    const hostile = `x\r\n[auth-email-hook] FORGED line\n${'A'.repeat(1000)}`
    const res = await POST(signedRequest(hostile))
    expect(res.status).toBe(200)
    expect(warn).toHaveBeenCalledTimes(1)
    const text = loggedText()
    expect(text).not.toMatch(/[\r\n]/)
    expect(text).not.toContain('A'.repeat(65))
    expect(text).toContain(MARKER)
    expect(loggedValue().length).toBeLessThanOrEqual(64)
  })

  it('other control characters (tab, escape, NUL, line and paragraph separators) are removed', async () => {
    const separators = String.fromCharCode(0x2028, 0x2029)
    await POST(signedRequest(`a\tb\u001bc\u0000d${separators}e`))
    const left = [...loggedText()].filter((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 || separators.includes(ch))
    expect(left).toEqual([])
    expect(loggedValue()).toContain('abcde')
  })

  it('a plain unknown type is logged as it is', async () => {
    await POST(signedRequest('a_new_type'))
    expect(loggedValue()).toContain('a_new_type')
  })
})
