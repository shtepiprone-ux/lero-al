// @vitest-environment node
/**
 * Security (Task 923 R66 (h)): the Auth e-mail hook reports a failed delivery.
 *  - SEC-X-SRV-HOOK-DELIVERY: with a valid signature, every e-mail type answers HTTP 500 when the mail adapter reports an error, and when the REAL adapter cannot send because
 *    `RESEND_API_KEY` is missing outside development. The hook used to answer 200 for every e-mail, so Supabase Auth believed that a recovery or confirmation mail had been
 *    sent that never was.
 * The route, the signature check and (in the second layer) the mail adapter are the real ones; the mail provider (`resend`) and the e-mail templates are doubles.
 * Every value is a synthetic placeholder.
 */
import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  /** true: the real `sendEmail` runs (its provider is the `resend` double below); false: `adapter` answers */
  real: false,
  adapter: (async () => ({ id: 'ok' })) as (a: unknown) => Promise<{ id?: string; error?: string }>,
  adapterCalls: 0,
  providerSends: 0,
}))

vi.mock('@/modules/notifications/lib/emails/send', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/modules/notifications/lib/emails/send')>()
  return {
    ...real,
    sendEmail: (a: Parameters<typeof real.sendEmail>[0]) => {
      if (state.real) return real.sendEmail(a)
      state.adapterCalls += 1
      return state.adapter(a)
    },
  }
})
vi.mock('resend', () => ({
  Resend: class { emails = { send: async () => { state.providerSends += 1; return { data: { id: 'provider-id' }, error: null } } } },
}))
vi.mock('@react-email/components', () => ({ render: async () => '<p>x</p>' }))
vi.mock('@/modules/notifications/lib/emails/RecoveryEmail', () => ({ RecoveryEmail: vi.fn(), getRecoveryEmailStrings: vi.fn().mockReturnValue({ subject: 'Recovery' }) }))
vi.mock('@/modules/notifications/lib/emails/VerifyEmail', () => ({ VerifyEmail: vi.fn(), getVerifyEmailStrings: vi.fn().mockReturnValue({ subject: 'Verify' }) }))
vi.mock('@/modules/notifications/lib/emails/MagicLinkEmail', () => ({ MagicLinkEmail: vi.fn(), getMagicLinkEmailStrings: vi.fn().mockReturnValue({ subject: 'MagicLink' }) }))
vi.mock('@/modules/notifications/lib/emails/ReauthEmail', () => ({ ReauthEmail: vi.fn(), getReauthEmailStrings: vi.fn().mockReturnValue({ subject: 'Reauth' }) }))

import { POST } from './route'

const SECRET_RAW = Buffer.from('a-test-webhook-secret-of-32-bytes!').toString('base64')
const TYPES = ['signup', 'invite', 'recovery', 'magiclink', 'email_change', 'reauthentication'] as const

function body(type: string) {
  return JSON.stringify({
    user: { id: 'u1', email: 'person@example.com', new_email: 'new-person@example.com' },
    email_data: { token: '123456', token_hash: 'SYNTHETIC-TOKEN-HASH', redirect_to: 'https://lero.al/sq', email_action_type: type, site_url: 'https://x.supabase.co' },
  })
}

/** a Standard Webhooks signature for this body (id.timestamp.body, HMAC-SHA256, base64) */
function signedRequest(raw: string) {
  const id = 'msg_1'
  const ts = Math.floor(Date.now() / 1000)
  const sig = createHmac('sha256', Buffer.from(SECRET_RAW, 'base64')).update(`${id}.${ts}.${raw}`).digest('base64')
  return new NextRequest('https://lero.al/api/auth-email-hook', {
    method: 'POST',
    body: raw,
    headers: { 'webhook-id': id, 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}`, 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  state.real = false
  state.adapter = async () => ({ id: 'ok' })
  state.adapterCalls = 0
  state.providerSends = 0
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://lero.al')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co')
  vi.stubEnv('SUPABASE_EMAIL_HOOK_SECRET', `v1,whsec_${SECRET_RAW}`)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllEnvs() })

describe('authEmailHook', () => {
  it('[SEC-X-SRV-HOOK-DELIVERY] a failed or impossible delivery is not acknowledged', async () => {
    // (a) the adapter reports an error: every e-mail type answers 500
    state.adapter = async () => ({ error: 'transient' })
    for (const type of TYPES) {
      const res = await POST(signedRequest(body(type)))
      expect(res.status, `${type}: adapter error`).toBe(500)
      expect(await res.json()).toEqual({ error: 'delivery_failed' })
    }
    expect(state.adapterCalls).toBe(TYPES.length)

    // (b) the REAL adapter has no provider key outside development: it cannot send, and the hook says so for every type
    state.real = true
    vi.stubEnv('RESEND_API_KEY', '')
    for (const nodeEnv of ['production', 'test']) {
      vi.stubEnv('NODE_ENV', nodeEnv)
      for (const type of TYPES) {
        const res = await POST(signedRequest(body(type)))
        expect(res.status, `${type}: no key, ${nodeEnv}`).toBe(500)
      }
    }
    expect(state.providerSends).toBe(0)
  })

  it('a delivery that succeeded is acknowledged with the empty object (the control)', async () => {
    for (const type of TYPES) {
      const res = await POST(signedRequest(body(type)))
      expect(res.status, type).toBe(200)
      expect(await res.json()).toEqual({})
    }
    expect(state.adapterCalls).toBe(TYPES.length)
  })

  it('the real adapter with a key sends and is acknowledged; local development without a key skips quietly (the controls)', async () => {
    state.real = true
    vi.stubEnv('RESEND_API_KEY', 're_synthetic_key')
    vi.stubEnv('NODE_ENV', 'production')
    const sent = await POST(signedRequest(body('recovery')))
    expect(sent.status).toBe(200)
    expect(state.providerSends).toBe(1)

    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('NODE_ENV', 'development')
    const skipped = await POST(signedRequest(body('recovery')))
    expect(skipped.status).toBe(200)
    expect(state.providerSends).toBe(1)
  })
})
