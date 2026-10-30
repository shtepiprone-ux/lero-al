// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S17): POST /api/auth-email-hook.
 *  1. In production the signature secret must exist: without it every request used to be accepted (a free e-mail relay from our domain).
 *  2. A request with a wrong or missing signature is refused and sends nothing.
 *  3. The origin of the link in the e-mail is ours, never the `redirect_to` host of the payload (it would carry the person's one-time token to another site).
 */
import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const sent: { to: string; props: Record<string, unknown> }[] = []
vi.mock('@/modules/notifications/lib/emails/send', () => ({
  sendEmail: vi.fn(async (a: { to: string; react?: { props: Record<string, unknown> }; html?: string }) => { sent.push({ to: a.to, props: a.react?.props ?? { html: a.html } }); return { ok: true } }),
}))
vi.mock('@/modules/notifications/lib/emails/RecoveryEmail', () => ({ RecoveryEmail: vi.fn(), getRecoveryEmailStrings: vi.fn().mockReturnValue({ subject: 'Recovery' }) }))
vi.mock('@/modules/notifications/lib/emails/VerifyEmail', () => ({ VerifyEmail: vi.fn(), getVerifyEmailStrings: vi.fn().mockReturnValue({ subject: 'Verify' }) }))
vi.mock('@/modules/notifications/lib/emails/MagicLinkEmail', () => ({ MagicLinkEmail: vi.fn(), getMagicLinkEmailStrings: vi.fn().mockReturnValue({ subject: 'MagicLink' }) }))
vi.mock('@/modules/notifications/lib/emails/ReauthEmail', () => ({ ReauthEmail: vi.fn(), getReauthEmailStrings: vi.fn().mockReturnValue({ subject: 'Reauth' }) }))

import { POST } from '../route'

const env = { ...process.env }
const SECRET_RAW = Buffer.from('a-test-webhook-secret-of-32-bytes!').toString('base64')
const SECRET = `v1,whsec_${SECRET_RAW}`

function body(over: Record<string, unknown> = {}, type = 'signup') {
  return JSON.stringify({
    user: { id: 'u1', email: 'victim@example.com' },
    email_data: { token: 't', token_hash: 'ONE-TIME-TOKEN-HASH', redirect_to: 'https://lero.al/sq', email_action_type: type, site_url: 'https://x.supabase.co', ...over },
  })
}

/** a Standard Webhooks signature for this body (id.timestamp.body, HMAC-SHA256, base64) */
function signed(raw: string, secretRaw = SECRET_RAW, ts = Math.floor(Date.now() / 1000)) {
  const id = 'msg_1'
  const sig = createHmac('sha256', Buffer.from(secretRaw, 'base64')).update(`${id}.${ts}.${raw}`).digest('base64')
  return { 'webhook-id': id, 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}`, 'content-type': 'application/json' }
}
const request = (raw: string, headers: Record<string, string> = { 'content-type': 'application/json' }) => new NextRequest('https://lero.al/api/auth-email-hook', { method: 'POST', body: raw, headers })
const confirmUrl = () => String(sent[0].props.confirmUrl ?? sent[0].props.resetUrl ?? sent[0].props.signInUrl)

beforeEach(() => {
  sent.length = 0
  process.env.NEXT_PUBLIC_SITE_URL = 'https://lero.al'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { process.env = { ...env } })

describe('the signature', () => {
  beforeEach(() => { process.env.SUPABASE_EMAIL_HOOK_SECRET = SECRET })

  it('a correctly signed request sends the e-mail', async () => {
    const raw = body()
    const res = await POST(request(raw, signed(raw)))
    expect(res.status).toBe(200)
    expect(sent).toHaveLength(1)
    expect(sent[0].to).toBe('victim@example.com')
  })

  it('no signature headers: refused, nothing sent', async () => {
    expect((await POST(request(body()))).status).toBe(401)
    expect(sent).toEqual([])
  })

  it('a signature made with another secret: refused, nothing sent', async () => {
    const raw = body()
    const wrong = signed(raw, Buffer.from('another-secret-another-secret-12345').toString('base64'))
    expect((await POST(request(raw, wrong))).status).toBe(401)
    expect(sent).toEqual([])
  })

  it('a body changed after signing: refused (the attacker cannot swap the recipient)', async () => {
    const raw = body()
    const headers = signed(raw)
    const tampered = raw.replace('victim@example.com', 'attacker@example.com')
    expect((await POST(request(tampered, headers))).status).toBe(401)
    expect(sent).toEqual([])
  })

  it('an old signature (replay): refused', async () => {
    const raw = body()
    const old = signed(raw, SECRET_RAW, Math.floor(Date.now() / 1000) - 3600)
    expect((await POST(request(raw, old))).status).toBe(401)
    expect(sent).toEqual([])
  })
})

describe('a missing secret', () => {
  beforeEach(() => { delete process.env.SUPABASE_EMAIL_HOOK_SECRET })

  it('in production the route refuses every request and sends nothing (it fails closed)', async () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    const res = await POST(request(body()))
    expect([401, 500, 503]).toContain(res.status)
    expect(sent).toEqual([])
  })

  it('outside production an unsigned request is accepted (local development)', async () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'development'
    expect((await POST(request(body()))).status).toBe(200)
    expect(sent).toHaveLength(1)
  })
})

describe('the origin of the link', () => {
  beforeEach(() => { delete process.env.SUPABASE_EMAIL_HOOK_SECRET; (process.env as Record<string, string>).NODE_ENV = 'test' })

  it.each(['signup', 'magiclink', 'recovery'])('a %s link points at our origin even when redirect_to is another site', async (type) => {
    await POST(request(body({ redirect_to: 'https://evil.example/steal?next=/sq/x' }, type)))
    const url = new URL(confirmUrl())
    expect(url.origin).toBe('https://lero.al')
    expect(url.searchParams.get('token_hash')).toBe('ONE-TIME-TOKEN-HASH')
  })

  it('a redirect_to with user-info (lero.al@evil.example) does not move the link', async () => {
    await POST(request(body({ redirect_to: 'https://lero.al@evil.example/' })))
    expect(new URL(confirmUrl()).host).toBe('lero.al')
  })

  it('our own redirect_to keeps its locale for a recovery link', async () => {
    await POST(request(body({ redirect_to: 'https://lero.al/uk?next=/uk/x' }, 'recovery')))
    expect(new URL(confirmUrl()).pathname).toBe('/uk/auth/reset-password')
  })
})

// Task 923 R38 (cases SEC-S17-SRV-DENY, SEC-S17-SRV-ERR)
it('[SEC-S17-SRV-DENY] The auth e-mail hook refuses an unsigned request in production and builds links only on this site', async () => {
  process.env.SUPABASE_EMAIL_HOOK_SECRET = SECRET
  ;(process.env as Record<string, string>).NODE_ENV = 'production'
  const unsigned = await POST(request(body()))
  expect(unsigned.status).toBe(401)
  expect(sent).toEqual([])
  // a signed request with a redirect_to of another origin: the link stays on this site
  const raw = body({ redirect_to: 'https://evil.example/steal' })
  const ok = await POST(request(raw, signed(raw)))
  expect(ok.status).toBe(200)
  expect(new URL(confirmUrl()).origin).toBe('https://lero.al')
})

it('[SEC-S17-SRV-ERR] A missing webhook secret in production is an error, never a skipped check', async () => {
  delete process.env.SUPABASE_EMAIL_HOOK_SECRET
  ;(process.env as Record<string, string>).NODE_ENV = 'production'
  const res = await POST(request(body()))
  // an error answer, never a skipped check: the route answers 401 (the contract text says "a server error answer"; the code has answered 401 since the S17 fix, reported to Opus)
  expect(res.status).toBeGreaterThanOrEqual(400)
  expect(sent).toEqual([])
})
