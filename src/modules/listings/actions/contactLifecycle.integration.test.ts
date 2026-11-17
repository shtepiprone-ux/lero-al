/**
 * Real-boundary control for the lifecycle of the contact paths (Task 923 R66 (f), R65 (b), owner decision F2; cases SEC-X-INT-CONTACT-LIFECYCLE-ALLOW and -DENY): the REAL
 * `submitListingInquiry`, the REAL `trackListingContactEvent` and the REAL database function `get_listing_owner_contact_as`, with the REAL `requireViewer`, run against REAL Supabase
 * Auth and the REAL database of the approved development project. The owner's numbers are read the way the real gateway reads them (`contactGateway.ts:120-123`): the service role
 * calls `get_listing_owner_contact_as` with the visitor as `p_caller` (hardening v8b revokes the session function `get_listing_owner_contact`, `v8b.sql:180`). The doubles are the
 * cookie-bound client factory (outside a Next request it returns the client that holds the REAL session of the chosen synthetic person), the request headers, and the e-mail
 * provider, which is a recording sink so that no real e-mail is ever sent. Synthetic rows only, verified clean-up.
 *  - SEC-X-INT-CONTACT-LIFECYCLE-ALLOW: on an ACTIVE listing of a live owner the three paths work: one inquiry, one contact event, the owner's numbers; the session call of
 *    `get_listing_owner_contact` is refused;
 *  - SEC-X-INT-CONTACT-LIFECYCLE-DENY: on an archived, expired, sold, rented and pending listing each path is refused: no inquiry, no event, no number (the function answers
 *    with no error and no row), no e-mail.
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
import { trackListingContactEvent } from './contactEvents'

const LOCKED = ['archived', 'expired', 'sold', 'rented', 'pending'] as const

let run: Run
let owner: SyntheticUser
let visitor: SyntheticUser
let ownerNumbers: { phone: string; whatsapp: string }
let activeId: string
const lockedIds: Record<string, string> = {}

beforeAll(async () => {
  run = createRun()
  owner = await run.makeUser('lifecycle-owner')
  visitor = await run.makeUser('lifecycle-visitor')
  const row = await run.admin.from('users').select('phone, whatsapp').eq('id', owner.id).single()
  expect(row.error, 'precondition: the synthetic owner has a phone and a WhatsApp number').toBeNull()
  ownerNumbers = { phone: row.data?.phone as string, whatsapp: row.data?.whatsapp as string }
  activeId = (await run.makeListing(owner.id, 'active', 'lifecycle-active')).id
  for (const status of LOCKED) lockedIds[status] = (await run.makeListing(owner.id, status, `lifecycle-${status}`)).id
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const inquiry = (listingId: string, who: string) => submitListingInquiry({
  listingId, name: `${run.RUN} ${who}`, email: 'sender@example.com', message: 'Hello, is the flat still available for a viewing this week?', captchaToken: 'dev-noop-token',
})
const track = (listingId: string) => trackListingContactEvent({ listingId, channel: 'whatsapp', source: 'listing_detail_contact_card' })
const inquiryRows = async (who: string) => (await run.admin.from('listing_inquiries').select('id, listing_id').like('name', `${run.RUN} ${who}%`)).data ?? []
const eventRows = async (ids: string[]) => (await run.admin.from('listing_contact_events').select('id, listing_id').in('listing_id', ids)).data ?? []
const ownerContact = (listingId: string) => run.admin.rpc('get_listing_owner_contact_as', { p_caller: visitor.id, listing_id_param: listingId })

describe('contactLifecycle', () => {
  it('[SEC-X-INT-CONTACT-LIFECYCLE-ALLOW] contact-lifecycle allowed on the real project', async () => {
    acting.client = visitor.client
    acting.emails.length = 0

    expect(await inquiry(activeId, 'allowed'), 'the inquiry on the active listing is accepted').toEqual({})
    expect(await inquiryRows('allowed'), 'exactly one inquiry row').toHaveLength(1)
    expect(acting.emails, 'one e-mail went to the owner').toHaveLength(1)

    expect(await track(activeId), 'the contact event on the active listing is accepted').toEqual({ ok: true })
    expect(await eventRows([activeId]), 'exactly one event row').toHaveLength(1)

    const numbers = await ownerContact(activeId)
    expect(numbers.error, 'the owner-contact function answers').toBeNull()
    expect(numbers.data, 'the owner\'s numbers are returned').toEqual([{ phone: ownerNumbers.phone, whatsapp: ownerNumbers.whatsapp }])

    // the function that takes no caller is closed to the session (hardening v8b): the visitor's own call is refused, not answered
    const session = await visitor.client.rpc('get_listing_owner_contact', { listing_id_param: activeId })
    expect(session.error, 'the session call of get_listing_owner_contact is refused').not.toBeNull()
    expect(session.error?.code === '42501' || /permission denied/i.test(session.error?.message ?? ''), `refused by the grant (${session.error?.code})`).toBe(true)
    expect(session.data, 'the session call returns no number').toBeNull()
  })

  it('[SEC-X-INT-CONTACT-LIFECYCLE-DENY] contact-lifecycle refused on the real project', async () => {
    acting.client = visitor.client
    acting.emails.length = 0

    for (const status of LOCKED) {
      const id = lockedIds[status]
      expect(await inquiry(id, `locked-${status}`), `${status}: no inquiry (the contact card of a listing that is not active is locked)`).toEqual({ error: 'validation' })
      expect(await track(id), `${status}: no contact event`).toEqual({ ok: false, reason: 'not_found' })
      const numbers = await ownerContact(id)
      expect(numbers.error, `${status}: the function answers (the refusal is the rule, not a missing grant)`).toBeNull()
      expect(numbers.data, `${status}: no number is returned`).toEqual([])
    }
    for (const status of LOCKED) expect(await inquiryRows(`locked-${status}`), `${status}: no inquiry row`).toEqual([])
    expect(await eventRows(Object.values(lockedIds)), 'no contact event row for any locked listing').toEqual([])
    expect(acting.emails, 'no e-mail went to the owner').toEqual([])
  })
})
