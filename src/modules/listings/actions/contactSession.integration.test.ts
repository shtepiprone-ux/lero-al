/**
 * Real-boundary control for the owner correction of 2026-10-17 ("a guest has no access to the owner's contact card"): the REAL submitListingInquiry and the REAL
 * requireViewer run against REAL Supabase Auth and the REAL database of the approved development project. The doubles are the cookie-bound client factory (outside a
 * Next request it returns the client holding the REAL session of the chosen person, or an anonymous one), the request headers, and the e-mail provider, which
 * is a recording sink so that no real e-mail is ever sent. Synthetic rows only, verified clean-up.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown, emails: [] as unknown[] }))
const TEST_IP = vi.hoisted(() => `203.0.113.${1 + Math.floor(Math.random() * 253)}`)       // documentation range (TEST-NET-3): never a real visitor
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-forwarded-for': TEST_IP }) }))
vi.mock('@/modules/notifications/lib/emails/listingInquiry', () => ({ sendListingInquiryNotification: async (mail: unknown) => { acting.emails.push(mail); return { ok: true } } }))

import { submitListingInquiry } from './submitListingInquiry'

async function eventually<T>(read: () => PromiseLike<T>, done: (value: T) => boolean, ms = 15_000): Promise<T> {
  const until = Date.now() + ms
  let value = await read()
  while (!done(value) && Date.now() < until) { await new Promise(r => setTimeout(r, 500)); value = await read() }
  return value
}

describe('contact actions against real Auth and database', () => {
  let run: Run
  let owner: SyntheticUser
  let listingId: string

  beforeAll(async () => {
    run = createRun()
    owner = await run.makeUser('listing-owner')
    listingId = (await run.makeListing(owner.id, 'active', 'contact-target')).id
  })
  afterAll(async () => {
    const result = await run.cleanup()
    expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
  })

  const named = (who: string) => ({ listingId, name: `${run.RUN} ${who}`, email: 'sender@example.com', message: 'Hello, is the flat still available for a viewing this week?', captchaToken: 'dev-noop-token' })
  const inquiriesFor = (who: string) => run.admin.from('listing_inquiries').select('id').eq('listing_id', listingId).eq('name', `${run.RUN} ${who}`)
  const ownerBell = () => run.admin.from('notifications').select('id').eq('user_id', owner.id).eq('type', 'new_message')

  it('[SEC-CS-INT-DENY] on the real database a guest and a blocked account create no inquiry, e-mail or notification', async () => {
    acting.emails.length = 0

    // a guest: no session at all
    acting.client = run.anonymousClient()
    expect(await submitListingInquiry(named('guest'))).toEqual({ error: 'unauthenticated' })

    // a blocked account whose access token is still valid (it signed in BEFORE it was blocked): refused by the profile status alone
    const blocked = await run.makeUser('blocked-viewer')
    const live = await blocked.client.auth.getUser()
    expect(live.error).toBeNull()                                    // precondition: the session itself is valid, so the refusal below is the status check
    expect((await run.admin.from('users').update({ status: 'blocked', block_reason: 'integration run' }).eq('id', blocked.id)).error).toBeNull()
    acting.client = blocked.client
    expect(await submitListingInquiry(named('blocked'))).toEqual({ error: 'unauthenticated' })

    // an inactive account is refused the same way
    const inactive = await run.makeUser('inactive-viewer')
    expect((await run.admin.from('users').update({ status: 'inactive' }).eq('id', inactive.id)).error).toBeNull()
    acting.client = inactive.client
    expect(await submitListingInquiry(named('inactive'))).toEqual({ error: 'unauthenticated' })

    for (const who of ['guest', 'blocked', 'inactive']) {
      const rows = await inquiriesFor(who)
      expect(rows.error, who).toBeNull()
      expect(rows.data, `${who}: no inquiry row`).toEqual([])
    }
    expect(acting.emails, 'no e-mail went to the owner').toEqual([])
    await new Promise(r => setTimeout(r, 1500))
    const bell = await ownerBell()
    expect(bell.error).toBeNull()
    expect(bell.data, 'no notification for the owner').toEqual([])
  })

  it('[SEC-CS-INT-ALLOW] on the real database a signed-in active person creates exactly one inquiry', async () => {
    acting.emails.length = 0
    const viewer = await run.makeUser('active-viewer')
    acting.client = viewer.client

    expect(await submitListingInquiry(named('active'))).toEqual({})

    const rows = await inquiriesFor('active')
    expect(rows.error).toBeNull()
    expect(rows.data).toHaveLength(1)
    expect(acting.emails).toHaveLength(1)
    expect(acting.emails[0]).toMatchObject({ replyTo: viewer.email.toLowerCase() })
    const bell = await eventually(ownerBell, r => (r.data ?? []).length >= 1)
    expect(bell.error).toBeNull()
    expect(bell.data).toHaveLength(1)
  })
})
