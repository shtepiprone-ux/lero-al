// @vitest-environment node
/**
 * Owner correction (2026-10-17): a guest has no access to the owner's contact card. The page hides it, but a hidden button proves presentation only, so the two
 * Server Actions that reach the owner must refuse a guest themselves. The REAL actions, the REAL requireViewer and the REAL accountAccess run; the session
 * source, the database, the e-mail provider and the notification service are recording doubles, so a refusal is proven by the returned answer AND by the absence
 * of every read of the listing / owner, write, e-mail and notification. The real-Auth/database control is contactSession.integration.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface Profile { status: string; suspended_until: string | null; deleted_at: string | null }
const state = vi.hoisted(() => ({
  session: 'throw-not-set' as unknown,
  sessionThrows: false,
  profile: null as null | Record<string, unknown>,
  profileError: null as null | { message: string },
  profileThrows: false,
  reads: [] as string[],
  inserts: [] as Array<{ table: string; row: Record<string, unknown> }>,
  ownerLookups: 0,
  emails: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
}))

const VIEWER_ID = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'
const LISTING = { id: '6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b', user_id: 'owner-1', title: 'A flat in Tirana', status: 'active', slug: 'a-flat' }

vi.mock('@/lib/auth/server', () => ({
  getUser: async () => { if (state.sessionThrows) throw new Error('auth down'); return state.session },
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    // Auth e-mails: the viewer's own account is the sender of an inquiry (Task 923 R70 (c)); every other lookup is the owner's, which is what must not happen for a refused viewer
    auth: { admin: { getUserById: async (id: string) => { if (id !== VIEWER_ID) state.ownerLookups++; return { data: { user: { email: id === VIEWER_ID ? 'ana@example.com' : 'owner@example.com' } }, error: null } } } },
    from: (table: string) => {
      state.reads.push(table)
      // a chainable, awaitable query: the double supports exactly the calls the two actions make and fails loudly on anything else
      const chain: Record<string, unknown> = {}
      const done = (data: unknown, extra: Record<string, unknown> = {}) => ({ data, error: null, ...extra })
      for (const m of ['eq', 'in', 'gte', 'limit']) chain[m] = () => chain
      chain.select = () => chain
      chain.insert = async (row: Record<string, unknown>) => { state.inserts.push({ table, row }); return { error: null } }
      chain.maybeSingle = async () => {
        if (table === 'users') {
          if (state.profileThrows) throw new Error('db down')
          return { data: state.profile, error: state.profileError }
        }
        if (table === 'listings') return done(LISTING)
        throw new Error(`unexpected maybeSingle on ${table}`)
      }
      chain.then = (resolve: (v: unknown) => unknown) => resolve(table === 'listing_inquiries' ? { count: 0, data: null, error: null } : done([]))
      return chain
    },
  }),
}))
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.9' }) }))
vi.mock('@/modules/notifications/lib/emails/listingInquiry', () => ({ sendListingInquiryNotification: async (m: Record<string, unknown>) => { state.emails.push(m); return { ok: true } } }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async (n: Record<string, unknown>) => { state.notifications.push(n) } }))

import { submitListingInquiry } from './submitListingInquiry'
import { trackListingContactEvent } from './contactEvents'

const VIEWER = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'
const FIELDS = { listingId: LISTING.id, name: 'Ana Hoxha', email: 'ana@example.com', message: 'Hello, is the flat still available for a viewing?', captchaToken: 'dev-noop-token' }
const TRACK = { listingId: LISTING.id, channel: 'whatsapp', source: 'listing_detail_contact_card', locale: 'en' } as const
const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString()
const signedIn = (profile: Partial<Profile> | null) => { state.session = { id: VIEWER }; state.profile = profile === null ? null : { status: 'active', suspended_until: null, deleted_at: null, ...profile } }

/** Everything that may only ever happen for an allowed viewer. */
const effects = () => ({
  readsOfListing: state.reads.filter(t => t !== 'users'),
  inserts: state.inserts,
  ownerLookups: state.ownerLookups,
  emails: state.emails,
  notifications: state.notifications,
})
const noEffects = { readsOfListing: [], inserts: [], ownerLookups: 0, emails: [], notifications: [] }

beforeEach(() => {
  state.session = null; state.sessionThrows = false; state.profile = null; state.profileError = null; state.profileThrows = false
  state.reads = []; state.inserts = []; state.ownerLookups = 0; state.emails = []; state.notifications = []
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('contact actions need a signed-in active person', () => {
  it('[SEC-CS-SRV-DENY] a guest, a session without a profile and a blocked or inactive account get nothing from the inquiry and contact-event actions', async () => {
    const callers: Array<[string, () => void]> = [
      ['a guest without a session', () => { state.session = null }],
      ['a session whose profile row does not exist', () => signedIn(null)],
      ['a profile marked deleted', () => signedIn({ deleted_at: '2026-10-01T00:00:00Z' })],
      ['a permanently blocked account', () => signedIn({ status: 'blocked' })],
      ['an account suspended until a future date', () => signedIn({ status: 'blocked', suspended_until: inMinutes(60) })],
      ['an inactive (deactivated) account', () => signedIn({ status: 'inactive' })],
      ['an inactive account with an old suspension date', () => signedIn({ status: 'inactive', suspended_until: inMinutes(-60) })],
      ['a profile with an unknown status', () => signedIn({ status: 'admin' })],
    ]
    for (const [label, arrange] of callers) {
      state.reads = []; state.inserts = []; state.ownerLookups = 0; state.emails = []; state.notifications = []
      arrange()
      expect(await submitListingInquiry(FIELDS), `${label}: inquiry`).toEqual({ error: 'unauthenticated' })
      expect(await trackListingContactEvent({ ...TRACK }), `${label}: contact event`).toEqual({ ok: false, reason: 'unauthenticated' })
      expect(effects(), `${label}: side effects`).toEqual(noEffects)
    }
  })

  it('[SEC-CS-SRV-ALLOW] a signed-in active person who is not the owner sends an inquiry and a WhatsApp tap is recorded', async () => {
    for (const profile of [{}, { status: 'blocked', suspended_until: inMinutes(-5) }]) {       // the second: a suspension that has ended gives access back
      state.reads = []; state.inserts = []; state.ownerLookups = 0; state.emails = []; state.notifications = []
      signedIn(profile)
      expect(await submitListingInquiry(FIELDS)).toEqual({})
      expect(state.inserts.filter(i => i.table === 'listing_inquiries')).toHaveLength(1)
      expect(state.inserts[0].row).toMatchObject({ listing_id: LISTING.id, listing_owner_id: 'owner-1', name: 'Ana Hoxha', email: 'ana@example.com', status: 'new' })
      expect(state.emails).toHaveLength(1)
      expect(state.emails[0]).toMatchObject({ to: 'owner@example.com', replyTo: 'ana@example.com' })
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0]).toMatchObject({ userId: 'owner-1', type: 'new_message' })

      expect(await trackListingContactEvent({ ...TRACK })).toEqual({ ok: true })
      const event = state.inserts.find(i => i.table === 'listing_contact_events')!
      expect(event.row).toMatchObject({ listing_id: LISTING.id, actor_user_id: VIEWER, actor_ip_hash: null, channel: 'whatsapp', locale: 'en', is_owner_click: false })
    }
  })

  it('[SEC-CS-SRV-ERR] when the session or profile lookup fails the request is refused and nothing is written', async () => {
    const outages: Array<[string, () => void]> = [
      ['the session lookup throws', () => { state.sessionThrows = true }],
      ['the profile query returns an error', () => { signedIn({}); state.profileError = { message: 'db error' } }],
      ['the profile query throws', () => { signedIn({}); state.profileThrows = true }],
    ]
    for (const [label, arrange] of outages) {
      state.sessionThrows = false; state.profileError = null; state.profileThrows = false
      state.reads = []; state.inserts = []; state.ownerLookups = 0; state.emails = []; state.notifications = []
      arrange()
      // not a guest ("sign in") and not a viewer: a retryable failure, with the exact answers each action documents
      expect(await submitListingInquiry(FIELDS), `${label}: inquiry`).toEqual({ error: 'save_failed' })
      expect(await trackListingContactEvent({ ...TRACK }), `${label}: contact event`).toEqual({ ok: false, reason: 'session_error' })
      expect(effects(), `${label}: side effects`).toEqual(noEffects)
    }
  })

  it('hostile arguments are refused before the session is even asked', async () => {
    signedIn({})
    const bad: unknown[] = [null, undefined, {}, { ...FIELDS, name: 5 }, { ...FIELDS, message: { toString: () => 'x'.repeat(30) } }, { ...FIELDS, listingId: "x' or 1=1" }, { ...FIELDS, listingId: 7 }]
    for (const input of bad) {
      const answer = await submitListingInquiry(input as never)
      expect(['validation', 'not_found'], JSON.stringify(input)).toContain(answer.error)
    }
    expect(await trackListingContactEvent({ ...TRACK, channel: 'sms' } as never)).toEqual({ ok: false, reason: 'not_found' })
    expect(await trackListingContactEvent(undefined as never)).toEqual({ ok: false, reason: 'not_found' })
    expect(effects()).toEqual(noEffects)
    expect(state.reads).toEqual([])            // not even the profile table was touched
  })

  it('the owner tapping their own WhatsApp is recorded as an owner click and the owner cannot message themselves', async () => {
    state.session = { id: 'owner-1' }; state.profile = { status: 'active', suspended_until: null, deleted_at: null }
    expect(await submitListingInquiry(FIELDS)).toEqual({ error: 'validation' })
    expect(state.emails).toEqual([])
    expect(await trackListingContactEvent({ ...TRACK })).toEqual({ ok: false, reason: 'self_click' })
    expect(state.inserts.find(i => i.table === 'listing_contact_events')!.row).toMatchObject({ actor_user_id: 'owner-1', is_owner_click: true })
  })
})
