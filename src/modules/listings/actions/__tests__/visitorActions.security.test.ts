// @vitest-environment node
/**
 * Security (Task 923 Revision 7): what a visitor can do with a listing.
 *  - the owner's phone number is no longer reached from here: its session-path action was replaced by the contact gateway (Task 923 R111, contactGateway.security.test.ts);
 *  - the recently-viewed cookie holds only listing ids and is capped; a signed-in person's history is read and cleared for THEM only;
 *  - favourites are added and removed for the signed-in person only, and a blocked person cannot write;
 *  - a contact click is counted once per signed-in person in 30 minutes, the owner's own click is not counted, and the channel, source and language are checked;
 *    a guest cannot record one at all (owner correction 2026-10-17: a guest has no access to the owner's contact card; the full matrix of refused callers is in
 *    contactSession.security.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
let blocked: string | null = null
let rpcResult: { data: unknown; error: { message: string } | null } = { data: [], error: null }
const rpcCalls: { name: string; args: unknown }[] = []
const revalidated: string[] = []
const jar: { value: string | undefined; sets: { name: string; value: string; options: Record<string, unknown> }[] } = { value: undefined, sets: [] }
let headerValues: Record<string, string> = {}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ ...db.client, rpc: async (name: string, args: unknown) => { rpcCalls.push({ name, args }); return rpcResult }, auth: { getUser: async () => ({ data: { user: currentUser } }) } }),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => blocked }))
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => { revalidated.push(p) } }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (jar.value === undefined ? undefined : { value: jar.value }), set: (name: string, value: string, options: Record<string, unknown>) => { jar.sets.push({ name, value, options }) } }),
  headers: async () => ({ get: (n: string) => headerValues[n.toLowerCase()] ?? null }),
}))

import { clearRecentlyViewed, recordListingView } from '../recentlyViewedActions'
import { addFavorite, removeFavorite } from '../favoriteActions'
import { trackListingContactEvent } from '../contactEvents'
import { getRecentlyViewedForGuest, getRecentlyViewedForUser } from '../../lib/recentlyViewedQueries'

const L1 = '11111111-1111-4111-8111-111111111111'
const L2 = '22222222-2222-4222-8222-222222222222'
const L3 = '33333333-3333-4333-8333-333333333333'
const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const VISITOR = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const VISITOR2 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

beforeEach(() => {
  db = createFakeDb({
    users: [OWNER, VISITOR, VISITOR2].map((id) => ({ id, status: 'active', suspended_until: null, deleted_at: null })),
    listings: [{ id: L1, user_id: OWNER, status: 'active' }, { id: L2, user_id: OWNER, status: 'draft' }, { id: L3, user_id: OWNER, status: 'archived' }],
    favorites: [{ id: 'f1', user_id: OWNER, listing_id: L1 }, { id: 'f2', user_id: VISITOR, listing_id: L1 }],
    recently_viewed: [{ id: 'r1', user_id: OWNER, listing_id: L1, viewed_at: '2026-10-01' }, { id: 'r2', user_id: VISITOR, listing_id: L3, viewed_at: '2026-10-02' }],
    listing_contact_events: [],
  })
  currentUser = null
  blocked = null
  rpcResult = { data: [], error: null }
  rpcCalls.length = 0
  revalidated.length = 0
  jar.value = undefined
  jar.sets.length = 0
  headerValues = { 'x-forwarded-for': '203.0.113.7', 'user-agent': 'Mozilla/5.0' }
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('recordListingView', () => {
  it('a guest\'s cookie gets the id first, without duplicates, capped at 25, httpOnly off, 30 days', async () => {
    const existing = Array.from({ length: 30 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`)
    jar.value = JSON.stringify([...existing.slice(0, 5), L1, ...existing.slice(5)])
    await recordListingView(L1)
    const set = jar.sets[0]
    const stored = JSON.parse(set.value) as string[]
    expect(stored[0]).toBe(L1)
    expect(stored.filter((x) => x === L1)).toHaveLength(1)
    expect(stored).toHaveLength(25)
    expect(set.options).toMatchObject({ maxAge: 2592000, path: '/', sameSite: 'lax', httpOnly: false })
  })

  it.each([[''], ['not-an-id'], ['<script>alert(1)</script>'], ['a'.repeat(10000)], [null], [undefined], [{ a: 1 }], [['x']]])('ignores %j: no cookie, no database call', async (id) => {
    await recordListingView(id as never)
    expect(jar.sets).toEqual([])
    expect(rpcCalls).toEqual([])
  })

  it('drops anything in an edited cookie that is not a listing id', async () => {
    jar.value = JSON.stringify([L2, 'x"; DROP', 5, null, { a: 1 }, '<b>', L3])
    await recordListingView(L1)
    expect(JSON.parse(jar.sets[0].value)).toEqual([L1, L2, L3])
  })

  it.each([['not json'], ['{"a":1}'], ['"string"'], ['']])('survives the broken cookie %j', async (raw) => {
    jar.value = raw
    await recordListingView(L1)
    expect(JSON.parse(jar.sets[0].value)).toEqual([L1])
  })

  it('a signed-in person uses the database function and sets no cookie', async () => {
    currentUser = { id: VISITOR }
    await recordListingView(L1)
    expect(rpcCalls).toEqual([{ name: 'record_recently_viewed', args: { p_listing_id: L1 } }])
    expect(jar.sets).toEqual([])
  })

  it('a database error is logged without the person or the message and does not throw', async () => {
    currentUser = { id: VISITOR }
    rpcResult = { data: null, error: { message: 'x' } }
    await expect(recordListingView(L1)).resolves.toBeUndefined()
  })
})

describe('clearRecentlyViewed', () => {
  it('deletes only the signed-in person\'s history and refreshes the cabinet in every language', async () => {
    currentUser = { id: VISITOR }
    await clearRecentlyViewed()
    expect(db.tables.recently_viewed.map((r) => r.user_id)).toEqual([OWNER])
    expect(db.log.find((l) => l.op === 'delete')?.filters).toEqual([['user_id', 'eq', VISITOR]])
    expect(revalidated.sort()).toEqual(['/en/cabinet', '/it/cabinet', '/sq/cabinet', '/uk/cabinet'])
  })

  it('a guest only resets the cookie and nothing in the database is touched', async () => {
    await clearRecentlyViewed()
    expect(jar.sets[0]).toMatchObject({ name: 'rv_listings', value: '[]' })
    expect(db.log).toEqual([])
  })
})

describe('recently viewed queries', () => {
  it('a signed-in person gets their own history, asked for explicitly', async () => {
    currentUser = { id: VISITOR }
    const rows = await getRecentlyViewedForUser()
    expect(db.log.find((l) => l.table === 'recently_viewed')?.filters).toEqual([['user_id', 'eq', VISITOR]])
    expect(rows.map((r) => r.id)).toEqual([L3])
  })

  it('nobody signed in gets nothing, and the table is not read', async () => {
    expect(await getRecentlyViewedForUser()).toEqual([])
    expect(db.log).toEqual([])
  })

  it('a draft listing is never shown', async () => {
    currentUser = { id: VISITOR }
    db.tables.recently_viewed.push({ id: 'r3', user_id: VISITOR, listing_id: L2, viewed_at: '2026-10-03' })
    expect((await getRecentlyViewedForUser()).map((r) => r.id)).not.toContain(L2)
  })

  it('the guest query keeps the cookie\'s order, drops non-ids and the excluded one, and obeys the limit', async () => {
    db.tables.listings.find((l) => l.id === L3)!.status = 'sold'
    const rows = await getRecentlyViewedForGuest([L3, 'x"),id.neq.(a', L1, '', L2], { excludeId: L1 })
    expect(rows.map((r) => r.id)).toEqual([L3])
    const asked = db.log.find((l) => l.table === 'listings')!.filters.find((f) => f[1] === 'in')![2] as string[]
    expect(asked).toEqual([L3, L2])
    expect(await getRecentlyViewedForGuest(['junk'])).toEqual([])
    expect(await getRecentlyViewedForGuest([L1, L3], { limit: 1 })).toHaveLength(1)
  })
})

describe('favourites', () => {
  it('a signed-in person adds a favourite for themselves, whatever else is sent', async () => {
    currentUser = { id: VISITOR }
    expect(await addFavorite(L3)).toEqual({ isFavorited: true })
    expect(db.tables.favorites.at(-1)).toMatchObject({ user_id: VISITOR, listing_id: L3 })
    expect(revalidated.sort()).toEqual(['/en/favorites', '/it/favorites', '/sq/favorites', '/uk/favorites'])
  })

  it('removing deletes only the caller\'s row for that listing', async () => {
    currentUser = { id: VISITOR }
    expect(await removeFavorite(L1)).toEqual({ isFavorited: false })
    expect(db.tables.favorites.map((f) => f.user_id)).toEqual([OWNER])
  })

  it('anonymous callers are refused and nothing is written', async () => {
    expect(await addFavorite(L1)).toEqual({ error: 'unauthenticated' })
    expect(await removeFavorite(L1)).toEqual({ error: 'unauthenticated' })
    expect(db.log).toEqual([])
  })

  it.each(['account_blocked', 'account_suspended'] as const)('a person who is %s cannot add or remove', async (reason) => {
    currentUser = { id: VISITOR }
    blocked = reason
    expect(await addFavorite(L3)).toEqual({ error: reason })
    expect(await removeFavorite(L1)).toEqual({ error: reason })
    expect(db.log).toEqual([])
  })

  it('adding twice is a success (the unique violation is the desired state)', async () => {
    currentUser = { id: VISITOR }
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'favorites') c.insert = () => ({ then: (r: (v: unknown) => void) => r({ error: { code: '23505', message: 'dup' } }) })
      return c
    }) as never
    expect(await addFavorite(L1)).toEqual({ isFavorited: true })
  })

  it('another database error is returned and nothing is refreshed', async () => {
    currentUser = { id: VISITOR }
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'favorites') { c.insert = () => ({ then: (r: (v: unknown) => void) => r({ error: { code: '42501', message: 'denied' } }) }); c.delete = () => c }
      return c
    }) as never
    expect(await addFavorite(L1)).toEqual({ error: 'denied' })
    expect(revalidated).toEqual([])
  })
})

describe('trackListingContactEvent', () => {
  const args = { listingId: L1, channel: 'whatsapp' as const, source: 'listing_detail_contact_card' as const, locale: 'en' }
  beforeEach(() => { currentUser = { id: VISITOR } })       // a contact event exists only for a signed-in person; the refused callers are in contactSession.security.test.ts

  it('a guest is refused and nothing is stored: no fingerprint, no address', async () => {
    currentUser = null
    expect(await trackListingContactEvent(args)).toEqual({ ok: false, reason: 'unauthenticated' })
    expect(db.tables.listing_contact_events).toEqual([])
    expect(JSON.stringify(db.log)).not.toContain('203.0.113.7')
  })

  it('records a signed-in person\'s click by id, with the listing\'s real owner and no address or fingerprint', async () => {
    expect(await trackListingContactEvent(args)).toEqual({ ok: true })
    const row = db.tables.listing_contact_events[0]
    expect(row).toMatchObject({ listing_id: L1, listing_owner_id: OWNER, actor_user_id: VISITOR, actor_ip_hash: null, channel: 'whatsapp', locale: 'en', is_owner_click: false })
    expect(JSON.stringify(row)).not.toContain('203.0.113.7')
  })

  it('counts a repeat from the same person within 30 minutes once, and again after that', async () => {
    currentUser = { id: VISITOR }
    expect(await trackListingContactEvent(args)).toEqual({ ok: true })
    db.tables.listing_contact_events[0].created_at = new Date(Date.now() - 29 * 60 * 1000).toISOString()
    expect(await trackListingContactEvent(args)).toEqual({ ok: false, reason: 'deduplicated' })
    db.tables.listing_contact_events[0].created_at = new Date(Date.now() - 31 * 60 * 1000).toISOString()
    expect(await trackListingContactEvent(args)).toEqual({ ok: true })
  })

  it('one signed-in person is told apart from another one', async () => {
    await trackListingContactEvent(args)
    currentUser = { id: VISITOR2 }
    expect(await trackListingContactEvent(args)).toEqual({ ok: true })
    expect(db.tables.listing_contact_events.map((e) => e.actor_user_id)).toEqual([VISITOR, VISITOR2])
  })

  it('the owner\'s own click is stored as such and not counted', async () => {
    currentUser = { id: OWNER }
    expect(await trackListingContactEvent(args)).toEqual({ ok: false, reason: 'self_click' })
    expect(db.tables.listing_contact_events[0].is_owner_click).toBe(true)
  })

  it.each([['a draft listing', L2], ['a listing that does not exist', '99999999-9999-4999-8999-999999999999']])('%s is "not_found" and nothing is stored', async (_l, listingId) => {
    expect(await trackListingContactEvent({ ...args, listingId })).toEqual({ ok: false, reason: 'not_found' })
    expect(db.tables.listing_contact_events).toEqual([])
  })

  it.each([
    ['a channel that does not exist', { channel: 'sms' }], ['a source that does not exist', { source: 'footer' }], ['a listing id that is not an id', { listingId: '1 OR 1=1' }],
    ['no listing id', { listingId: undefined }], ['an object as the channel', { channel: { a: 1 } }],
  ])('%s is refused before any query', async (_l, patch) => {
    expect(await trackListingContactEvent({ ...args, ...patch } as never)).toEqual({ ok: false, reason: 'not_found' })
    expect(db.log).toEqual([])
  })

  it.each([['sq', 'sq'], ['xx', null], ['<script>', null], ['a'.repeat(500), null], [undefined, null], [5, null]])('the language %j is stored as %j', async (locale, stored) => {
    await trackListingContactEvent({ ...args, locale: locale as never })
    expect(db.tables.listing_contact_events[0].locale).toBe(stored)
  })

  it('a failing look-up does not lose the click', async () => {
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'listing_contact_events') {
        const insert = c.insert as (v: unknown) => unknown
        c.insert = insert
        c.select = () => ({ eq: () => ({ eq: () => ({ gte: () => ({ limit: async () => ({ data: null, error: { code: 'X', message: 'x' } }) }) }) }) })
      }
      return c
    }) as never
    expect(await trackListingContactEvent(args)).toEqual({ ok: true })
    expect(db.tables.listing_contact_events).toHaveLength(1)
  })
})

// Task 923 R38 (cases SEC-S38-SRV-DENY, SEC-S39-SRV-DENY)
it('[SEC-S38-SRV-DENY] A contact event has a known channel and source, a supported locale or null, and a real listing id', async () => {
  currentUser = { id: VISITOR }
  const args = { listingId: L1, channel: 'whatsapp' as const, source: 'listing_detail_contact_card' as const, locale: 'en' }
  for (const patch of [{ channel: 'sms' }, { source: 'footer' }, { listingId: '1 OR 1=1' }, { listingId: '99999999-9999-4999-8999-999999999999' }]) {
    expect(await trackListingContactEvent({ ...args, ...patch } as never), JSON.stringify(patch)).toEqual({ ok: false, reason: 'not_found' })
  }
  expect(db.tables.listing_contact_events).toEqual([])
  await trackListingContactEvent({ ...args, locale: '<script>' as never })
  expect(db.tables.listing_contact_events[0].locale).toBeNull()             // an unsupported language is stored as null
})

it('[SEC-S39-SRV-DENY] Recently viewed and owner contact actions use only a UUID listing id and the history of the signed-in person', async () => {
  currentUser = { id: VISITOR }
  await recordListingView('<script>alert(1)</script>' as never)
  expect(jar.sets).toEqual([])
  expect(rpcCalls).toEqual([])
  await clearRecentlyViewed()
  expect(db.tables.recently_viewed.some((r) => r.user_id === OWNER)).toBe(true)         // another person's history is untouched
  expect(db.tables.recently_viewed.some((r) => r.user_id === VISITOR)).toBe(false)
})
