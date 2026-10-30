/**
 * Real-boundary control for the contact gateway (Task 923 R111, R114 (d), R86): the REAL `revealListingContact` with the REAL `requireViewer`, `contactHumanCheck` and
 * `verifyTurnstile`, on REAL Supabase Auth and the REAL database of the approved development project (hardening v8a applied), and on Cloudflare's REAL siteverify with its
 * PUBLISHED test secrets (never the project's secret): the always-pass secret answers a success with the hostname example.com, no action and the testing marker; the
 * always-fail secret answers invalid-input-response. The only doubles are the cookie-bound client factory (outside a Next request it returns the client holding the
 * REAL session of the chosen person, or an anonymous one) and the request headers. Synthetic rows (`zz_synth_`) only, with verified clean-up.
 *  - SEC-X-INT-CONTACT-RPC-DENY / -ALLOW: the function that takes the caller answers the service role only, and keeps the contact rules (a blocked caller gets 42501);
 *  - SEC-X-INT-CONTACT-GATEWAY: a verified WhatsApp reveal returns the owner's number and writes exactly one event; the failing secret reveals nothing and writes nothing;
 *  - SEC-X-INT-CONTACT-SESSION-DENY: a guest and a person whose session was really ended get nothing;
 *  - SEC-X-INT-REVEAL-TABLE-DENY / -TABLE-SERVER: `public.listing_contact_reveals` answers the service role only (Task 923 R125, R129);
 *  - SEC-X-INT-REVEAL-RECORD / -LIMIT: a reveal writes one row per listing, and the 21st new listing within the hour is refused (D77).
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
const TEST_IP = vi.hoisted(() => `203.0.113.${1 + Math.floor(Math.random() * 253)}`)       // documentation range (TEST-NET-3): never a real visitor
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-forwarded-for': TEST_IP }) }))

import { revealListingContact } from '@/modules/listings/actions/contactGateway'

// Cloudflare's published test keys (https://developers.cloudflare.com/turnstile/troubleshooting/testing/): the secrets of its dummy site keys and its dummy token
const CLOUDFLARE_TEST = { alwaysPass: '1x0000000000000000000000000000000AA', alwaysFail: '2x0000000000000000000000000000000AA', dummyToken: 'XXXX.DUMMY.TOKEN.XXXX' }
const ENV = { secret: process.env.TURNSTILE_SECRET_KEY }

let run: Run
let owner: SyntheticUser
let viewer: SyntheticUser
let listingId: string
let ownerNumbers: { phone: string; whatsapp: string }

beforeAll(async () => {
  run = createRun()
  owner = await run.makeUser('contact-owner')
  viewer = await run.makeUser('contact-viewer')
  listingId = (await run.makeListing(owner.id, 'active', 'contact-gateway')).id
  const row = await run.admin.from('users').select('phone, whatsapp').eq('id', owner.id).single()
  expect(row.error, 'precondition: the synthetic owner has a phone and a WhatsApp number').toBeNull()
  ownerNumbers = { phone: row.data?.phone as string, whatsapp: row.data?.whatsapp as string }
  expect(ownerNumbers.phone && ownerNumbers.whatsapp).toBeTruthy()
})
afterEach(() => {
  if (ENV.secret === undefined) delete process.env.TURNSTILE_SECRET_KEY
  else process.env.TURNSTILE_SECRET_KEY = ENV.secret
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const eventsOf = async (actorId?: string) => {
  const query = run.admin.from('listing_contact_events').select('id, actor_user_id, channel').eq('listing_id', listingId)
  const rows = await (actorId ? query.eq('actor_user_id', actorId) : query)
  expect(rows.error, 'the contact events can be read').toBeNull()
  return rows.data ?? []
}
const reveal = (channel: 'call' | 'whatsapp', onListing = listingId) => revealListingContact({ listingId: onListing, channel, captchaToken: CLOUDFLARE_TEST.dummyToken, locale: 'en' })
/** the reveal rows of one synthetic viewer, read with the service role (Task 923 R125: the table is the server's only) */
const revealRowsOf = async (viewerId: string) => {
  const rows = await run.admin.from('listing_contact_reveals').select('viewer_id, listing_id, channel, requester_ip').eq('viewer_id', viewerId)
  expect(rows.error, 'the reveal rows can be read with the service role').toBeNull()
  return rows.data ?? []
}

describe('contactGateway', () => {
  it('[SEC-X-INT-CONTACT-RPC-DENY] a session cannot reach the contact function', async () => {
    // the function exists and is callable by the service role (the control is the next case); a session gets a refusal, not a number
    for (const [who, client] of [['a signed-in session', viewer.client], ['a guest (anon, no session)', run.anonymousClient()]] as const) {
      const answer = await client.rpc('get_listing_owner_contact_as', { p_caller: viewer.id, listing_id_param: listingId })
      expect(answer.error, `${who}: the call is refused`).not.toBeNull()
      expect(answer.error?.code === '42501' || /permission denied/i.test(answer.error?.message ?? ''), `${who}: refused by the grant (${answer.error?.code})`).toBe(true)
      expect(answer.data, `${who}: no number is returned`).toBeNull()
    }
  })

  it('[SEC-X-INT-CONTACT-RPC-ALLOW] the gateway function keeps the contact rules', async () => {
    // the service role with an active caller's id gets the owner's numbers of the active listing
    const allowed = await run.admin.rpc('get_listing_owner_contact_as', { p_caller: viewer.id, listing_id_param: listingId })
    expect(allowed.error).toBeNull()
    expect(allowed.data).toEqual([{ phone: ownerNumbers.phone, whatsapp: ownerNumbers.whatsapp }])

    // a blocked caller's id gets a refusal and no number, though the service role asks
    const blocked = await run.makeUser('contact-blocked')
    expect((await run.admin.from('users').update({ status: 'blocked', block_reason: 'integration run' }).eq('id', blocked.id)).error).toBeNull()
    const denied = await run.admin.rpc('get_listing_owner_contact_as', { p_caller: blocked.id, listing_id_param: listingId })
    expect(denied.error?.code, 'a blocked caller is refused with 42501').toBe('42501')
    expect(denied.data, 'no number for a blocked caller').toBeNull()
  })

  it('[SEC-X-INT-CONTACT-GATEWAY] the real gateway on the real database and siteverify', async () => {
    expect(await eventsOf(), 'precondition: no event of this run yet').toEqual([])

    // the always-pass secret: the owner's WhatsApp number, and exactly one event of this viewer
    process.env.TURNSTILE_SECRET_KEY = CLOUDFLARE_TEST.alwaysPass
    acting.client = viewer.client
    expect(await reveal('whatsapp')).toEqual({ ok: true, number: ownerNumbers.whatsapp })
    const stored = await eventsOf()
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ actor_user_id: viewer.id, channel: 'whatsapp' })

    // the always-fail secret, another active person: bot_check_failed, no number, no further row
    const other = await run.makeUser('contact-viewer-b')
    process.env.TURNSTILE_SECRET_KEY = CLOUDFLARE_TEST.alwaysFail
    acting.client = other.client
    expect(await reveal('whatsapp')).toEqual({ ok: false, reason: 'bot_check_failed' })
    expect(await eventsOf(other.id), 'the refused person has no event').toEqual([])
    expect(await eventsOf(), 'no further row').toHaveLength(1)
  })

  it('[SEC-X-INT-CONTACT-SESSION-DENY] no number without a session Supabase Auth verifies', async () => {
    process.env.TURNSTILE_SECRET_KEY = CLOUDFLARE_TEST.alwaysPass
    const before = (await eventsOf()).length

    // a guest client with no session
    acting.client = run.anonymousClient()
    expect(await reveal('call')).toEqual({ ok: false, reason: 'unauthenticated' })

    // a person whose session was really ended: the old access token is refused by Auth itself (the precondition), and the client holds no session
    const ended = await run.makeUser('contact-signed-out')
    expect((await ended.client.auth.getUser()).error, 'precondition: the session is valid before it is ended').toBeNull()
    expect((await ended.client.auth.signOut()).error).toBeNull()
    const refused = await run.anonymousClient().auth.getUser(ended.accessToken)
    expect(refused.error, 'precondition: Auth refuses the ended session\'s access token').not.toBeNull()
    acting.client = ended.client
    expect(await reveal('call')).toEqual({ ok: false, reason: 'unauthenticated' })
    expect(await reveal('whatsapp')).toEqual({ ok: false, reason: 'unauthenticated' })

    expect(await eventsOf(ended.id), 'no event for the person whose session ended').toEqual([])
    expect(await eventsOf(), 'no event row was written').toHaveLength(before)
  })

  // Task 923 R125-R126, R129 (owner D77, D79, D80): the reveal record `public.listing_contact_reveals` (applied by the owner, AC125).
  it('[SEC-X-INT-REVEAL-TABLE-DENY] a session cannot touch the reveal record', async () => {
    const person = await run.makeUser('reveal-table-deny')
    // precondition: a synthetic row of this person exists, written by the service role, so a denied delete or select has something to hit
    const seeded = await run.admin.from('listing_contact_reveals').insert({ viewer_id: person.id, listing_id: listingId, channel: 'call', requester_ip: '198.51.100.250' })
    expect(seeded.error, 'precondition: the service role can write the record').toBeNull()
    const row = { viewer_id: person.id, listing_id: listingId, channel: 'call', requester_ip: '198.51.100.251' }

    for (const [who, client] of [['a signed-in session', person.client], ['a guest (anon, no session)', run.anonymousClient()]] as const) {
      const attempts = {
        select: await client.from('listing_contact_reveals').select('id'),
        insert: await client.from('listing_contact_reveals').insert(row),
        delete: await client.from('listing_contact_reveals').delete().eq('viewer_id', person.id),
      }
      for (const [action, answer] of Object.entries(attempts)) {
        expect(answer.error, `${who}: ${action} is refused`).not.toBeNull()
        expect(answer.error?.code === '42501' || /permission denied/i.test(answer.error?.message ?? ''), `${who}: ${action} is refused by the grant (${answer.error?.code})`).toBe(true)
        expect(answer.data, `${who}: ${action} returns no row`).toBeNull()
      }
    }
    // nothing changed: the seeded row is still there and the refused insert wrote none
    expect(await revealRowsOf(person.id), 'the record is unchanged').toEqual([{ viewer_id: person.id, listing_id: listingId, channel: 'call', requester_ip: '198.51.100.250' }])
  })

  it('[SEC-X-INT-REVEAL-TABLE-SERVER] the server reads and writes the reveal record', async () => {
    const person = await run.makeUser('reveal-table-server')
    const inserted = await run.admin.from('listing_contact_reveals').insert({ viewer_id: person.id, listing_id: listingId, channel: 'whatsapp', requester_ip: null }).select('id, viewer_id, channel, requester_ip')
    expect(inserted.error, 'the service role inserts a synthetic row').toBeNull()
    expect(inserted.data).toEqual([expect.objectContaining({ viewer_id: person.id, channel: 'whatsapp', requester_ip: null })])
    expect(await revealRowsOf(person.id), 'the service role selects it').toHaveLength(1)
    const deleted = await run.admin.from('listing_contact_reveals').delete().eq('viewer_id', person.id)
    expect(deleted.error, 'the service role deletes it').toBeNull()
    expect(await revealRowsOf(person.id), 'and it is gone').toEqual([])
  })

  it('[SEC-X-INT-REVEAL-RECORD] the real gateway records a reveal once per listing', async () => {
    const person = await run.makeUser('reveal-record')
    process.env.TURNSTILE_SECRET_KEY = CLOUDFLARE_TEST.alwaysPass
    acting.client = person.client
    expect(await revealRowsOf(person.id), 'precondition: no reveal row yet').toEqual([])

    // a verified call reveal writes exactly one row: the viewer, the listing, the channel and the request's address
    expect(await reveal('call')).toEqual({ ok: true, number: ownerNumbers.phone })
    expect(await revealRowsOf(person.id)).toEqual([{ viewer_id: person.id, listing_id: listingId, channel: 'call', requester_ip: TEST_IP }])

    // a second reveal of the same listing, by the same or the other channel, is free and writes none
    expect(await reveal('call')).toEqual({ ok: true, number: ownerNumbers.phone })
    expect(await reveal('whatsapp')).toEqual({ ok: true, number: ownerNumbers.whatsapp })
    expect(await revealRowsOf(person.id), 'still one row').toHaveLength(1)
  })

  it('[SEC-X-INT-REVEAL-LIMIT] the real gateway refuses a reveal past the hour limit', async () => {
    process.env.TURNSTILE_SECRET_KEY = CLOUDFLARE_TEST.alwaysPass
    const earlier = (await run.makeListing(owner.id, 'active', 'reveal-limit-earlier')).id
    const third = (await run.makeListing(owner.id, 'active', 'reveal-limit-third')).id
    const rowsFor = (viewerId: string, count: number) => Array.from({ length: count }, () => ({ viewer_id: viewerId, listing_id: earlier, channel: 'call', requester_ip: '198.51.100.77' }))

    // the control (allow): 19 rows in the hour, a reveal of a new listing is served and recorded
    const under = await run.makeUser('reveal-limit-under')
    expect((await run.admin.from('listing_contact_reveals').insert(rowsFor(under.id, 19))).error).toBeNull()
    acting.client = under.client
    expect(await reveal('call', third), 'at 19 rows the reveal is served').toEqual({ ok: true, number: ownerNumbers.phone })
    expect((await revealRowsOf(under.id)).filter(row => row.listing_id === third)).toHaveLength(1)

    // the deny: 20 rows in the hour, a reveal of a listing not among them is refused, with no number and no row for it
    const over = await run.makeUser('reveal-limit-over')
    expect((await run.admin.from('listing_contact_reveals').insert(rowsFor(over.id, 20))).error).toBeNull()
    acting.client = over.client
    const refused = await reveal('call', third)
    expect(refused).toEqual({ ok: false, reason: 'rate_limited' })
    expect(JSON.stringify(refused), 'no number in the answer').not.toContain(ownerNumbers.phone)
    expect((await revealRowsOf(over.id)).filter(row => row.listing_id === third), 'no row for the refused listing').toEqual([])
    // a listing the viewer already had revealed stays free at the limit
    expect(await reveal('call', earlier), 'a repeat reveal at the limit').toEqual({ ok: true, number: ownerNumbers.phone })
    expect(await revealRowsOf(over.id), 'and writes no row').toHaveLength(20)
  })
})
