// @vitest-environment node
/**
 * Security (Task 923 R66 (f), owner F2): no contact path serves a listing whose contact is locked.
 *  - SEC-X-SRV-CONTACT-LIFECYCLE: the REAL submitListingInquiry and trackListingContactEvent run against an in-memory database with a listing in each status (pending,
 *    inactive, expired, sold, rented, archived) and with an ACTIVE listing whose owner is deleted, blocked or has no profile row. Every one of them gets `validation` /
 *    `not_found`: no inquiry row, no e-mail, no notification, no contact event. The controls: an active listing of a live owner (and of an owner whose suspension has
 *    ended) is served. (The third path, the database function `get_listing_owner_contact`, is the SQL half of R65 (a): its own harness and integration cases.)
 * Identity, the mailer and the notification service are doubles. Every id and address is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({ emails: 0, notifications: 0 }))

let db = createFakeDb()
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }) }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: 'viewer-1', role: 'user' }) }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: { admin: { getUserById: async (id: string) => ({ data: { user: { email: id === 'viewer-1' ? 'viewer@example.com' : 'owner@example.com' } }, error: null }) } },
    from: (t: string) => db.client.from(t),
  }),
}))
vi.mock('@/modules/notifications/lib/emails/listingInquiry', () => ({ sendListingInquiryNotification: async () => { state.emails++; return { ok: true } } }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => { state.notifications++ } }))

import { submitListingInquiry } from '../submitListingInquiry'
import { trackListingContactEvent } from '../contactEvents'

const LISTING_ID = '6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b'
const OWNER = 'owner-1'
const live = { status: 'active', suspended_until: null as string | null, deleted_at: null as string | null }
const input = { listingId: LISTING_ID, name: 'Ana Hoxha', email: 'typed@example.com', message: 'Is the flat still available for a viewing this week?', captchaToken: 'dev-noop-token' }
const track = { listingId: LISTING_ID, channel: 'whatsapp', source: 'listing_detail_contact_card', locale: 'sq' } as const

function arrange(listingStatus: string, owner: Record<string, unknown> | null) {
  db = createFakeDb({
    listings: [{ id: LISTING_ID, user_id: OWNER, title: 'A flat', status: listingStatus, slug: 'a-flat' }],
    users: owner ? [{ id: OWNER, ...owner }] : [],
    listing_inquiries: [],
    listing_contact_events: [],
  })
  state.emails = 0
  state.notifications = 0
}
const nothingServed = () => {
  expect(db.tables.listing_inquiries).toEqual([])
  expect(db.tables.listing_contact_events).toEqual([])
  expect(state.emails).toBe(0)
  expect(state.notifications).toBe(0)
}

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('contactLifecycle', () => {
  it('[SEC-X-SRV-CONTACT-LIFECYCLE] no contact path serves a listing whose contact is locked', async () => {
    const locked: Array<[string, string, Record<string, unknown> | null]> = [
      ['a pending listing', 'pending', live],
      ['an inactive listing', 'inactive', live],
      ['an expired listing', 'expired', live],
      ['a sold listing', 'sold', live],
      ['a rented listing', 'rented', live],
      ['an archived listing', 'archived', live],
      ['an active listing of a deleted owner', 'active', { ...live, deleted_at: '2026-10-01T00:00:00Z' }],
      ['an active listing of a blocked owner', 'active', { ...live, status: 'blocked' }],
      ['an active listing of a deactivated owner', 'active', { ...live, status: 'inactive' }],
      ['an active listing of an owner who is suspended until a future date', 'active', { ...live, status: 'blocked', suspended_until: new Date(Date.now() + 3600_000).toISOString() }],
      ['an active listing whose owner has no profile row', 'active', null],
    ]
    for (const [label, status, owner] of locked) {
      arrange(status, owner)
      expect(await submitListingInquiry(input), `${label}: inquiry`).toEqual({ error: 'validation' })
      expect(await trackListingContactEvent({ ...track }), `${label}: contact event`).toMatchObject({ ok: false })
      nothingServed()
    }
  })

  it('an active listing of a live owner, and of an owner whose suspension has ended, is served (the controls)', async () => {
    arrange('active', live)
    expect(await submitListingInquiry(input)).toEqual({})
    expect(db.tables.listing_inquiries).toHaveLength(1)
    expect(state.emails).toBe(1)
    expect(await trackListingContactEvent({ ...track })).toEqual({ ok: true })
    expect(db.tables.listing_contact_events).toHaveLength(1)

    arrange('active', { ...live, status: 'blocked', suspended_until: new Date(Date.now() - 3600_000).toISOString() })
    expect(await submitListingInquiry(input)).toEqual({})
    expect(await trackListingContactEvent({ ...track })).toEqual({ ok: true })
  })
})
