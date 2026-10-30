// @vitest-environment node
/**
 * Security (Task 923 R70 (c)): the sender of a listing inquiry is the signed-in account, and the limit is per person and per IP.
 *  - SEC-X-SRV-INQUIRY-SENDER: the REAL submitListingInquiry runs against an in-memory database. Another address typed into the e-mail field is ignored: the stored
 *    and the mailed sender (Reply-To) is the account's own Auth e-mail. Eleven inquiries with no IP header cannot all pass: the requests without an address share one
 *    bucket with the limit of five an hour, so the sixth and every later one is `rate_limited` and nothing is stored or sent for it. The limit also counts per person,
 *    whatever the IP, and a count that cannot be read refuses.
 * Identity (`requireViewer`), Auth e-mails, the mailer and the notification service are doubles. Every address is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({
  viewerId: 'viewer-1',
  countFails: false,
  emails: [] as Array<Record<string, unknown>>,
  headers: {} as Record<string, string>,
}))

let db = createFakeDb()
const AUTH_EMAILS: Record<string, string> = { 'viewer-1': 'account@example.com', 'viewer-2': 'second@example.com', 'owner-1': 'owner@example.com' }

const failingCount: unknown = new Proxy(function () {}, {
  get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ count: null, error: { message: 'MARKER-DB-MESSAGE', code: 'XX000' } }) : failingCount),
  apply: () => failingCount,
})

vi.mock('next/headers', () => ({ headers: async () => ({ get: (n: string) => state.headers[n.toLowerCase()] ?? null }) }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: state.viewerId, role: 'user' }) }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: { admin: { getUserById: async (id: string) => ({ data: { user: AUTH_EMAILS[id] ? { email: AUTH_EMAILS[id] } : null }, error: null }) } },
    from: (t: string) => {
      const chain = db.client.from(t) as Record<string, (...a: unknown[]) => unknown>
      if (state.countFails && t === 'listing_inquiries') {
        const select = chain.select.bind(chain)
        chain.select = (cols: unknown, opts?: unknown) => ((opts as { head?: boolean } | undefined)?.head ? failingCount : select(cols, opts))
      }
      return chain
    },
  }),
}))
vi.mock('@/modules/notifications/lib/emails/listingInquiry', () => ({
  sendListingInquiryNotification: async (m: Record<string, unknown>) => { state.emails.push(m); return { ok: true } },
}))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))

import { submitListingInquiry } from '../submitListingInquiry'

const LISTING_ID = '6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b'
const input = (over: Record<string, unknown> = {}) => ({ listingId: LISTING_ID, name: 'Ana Hoxha', email: 'typed.by.someone@example.org', message: 'Is the flat still available for a viewing this week?', captchaToken: 'dev-noop-token', ...over })

beforeEach(() => {
  db = createFakeDb({
    listings: [{ id: LISTING_ID, user_id: 'owner-1', title: 'A flat in Tirana', status: 'active', slug: 'a-flat' }],
    users: [{ id: 'owner-1', status: 'active', suspended_until: null, deleted_at: null }],
    listing_inquiries: [],
  })
  state.viewerId = 'viewer-1'
  state.countFails = false
  state.emails = []
  state.headers = {}
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('submitListingInquiry', () => {
  it('[SEC-X-SRV-INQUIRY-SENDER] the inquiry sender is the account', async () => {
    // the typed address is ignored: the stored and the mailed sender is the account's Auth e-mail
    expect(await submitListingInquiry(input())).toEqual({})
    expect(db.tables.listing_inquiries.at(-1)).toMatchObject({ email: 'account@example.com', requester_ip: null })
    expect(state.emails[0]).toMatchObject({ to: 'owner@example.com', replyTo: 'account@example.com', email: 'account@example.com' })
    expect(JSON.stringify([db.tables.listing_inquiries, state.emails])).not.toContain('typed.by.someone')

    // eleven inquiries with no IP header: five pass (the first is the one above), every later one is refused and nothing is stored or sent for it
    for (let i = 0; i < 4; i++) expect(await submitListingInquiry(input()), `inquiry ${i + 2}`).toEqual({})
    for (let i = 6; i <= 11; i++) expect(await submitListingInquiry(input()), `inquiry ${i}`).toEqual({ error: 'rate_limited' })
    expect(db.tables.listing_inquiries).toHaveLength(5)
    expect(state.emails).toHaveLength(5)
  })

  it('the limit is also per person: another address does not reset it, and another person is not blocked by it', async () => {
    for (let i = 0; i < 5; i++) {
      state.headers = { 'x-forwarded-for': `203.0.113.${i + 1}` }                       // a different address every time
      expect(await submitListingInquiry(input()), `inquiry ${i + 1}`).toEqual({})
    }
    state.headers = { 'x-forwarded-for': '198.51.100.77' }
    expect(await submitListingInquiry(input())).toEqual({ error: 'rate_limited' })      // the same person from a new address
    state.viewerId = 'viewer-2'
    expect(await submitListingInquiry(input())).toEqual({})                             // another person from the same new address
    expect(db.tables.listing_inquiries.at(-1)).toMatchObject({ email: 'second@example.com' })
  })

  it('a count that cannot be read refuses, and a sender without an e-mail sends nothing', async () => {
    state.countFails = true
    expect(await submitListingInquiry(input())).toEqual({ error: 'rate_limited' })
    expect(db.tables.listing_inquiries).toEqual([])
    expect(state.emails).toEqual([])
    state.countFails = false
    state.viewerId = 'viewer-without-email'
    expect(await submitListingInquiry(input())).toEqual({ error: 'save_failed' })
    expect(db.tables.listing_inquiries).toEqual([])
  })
})
