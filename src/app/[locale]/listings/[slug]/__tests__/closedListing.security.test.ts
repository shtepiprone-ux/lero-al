// @vitest-environment node
/**
 * Security (Task 923 R100, R73 (b); R103, D72; case SEC-X-SRV-CLOSED-PAGE): who may open the page of a closed listing.
 *
 * The REAL listing page (`ListingPage`) and its `generateMetadata` run with the REAL `getListingAccessState` against an in-memory database (it does NOT simulate row-level
 * security itself: the session client of each visitor is seeded with the rows the read policy of hardening v8a lets that visitor read, so the point is what the CODE asks for
 * and decides) with doubles for the identity, the viewer's profile, the settings, the exchange rates, the translations and the views that render the page.
 *  - a visitor, guest or signed in, opens an active, sold or rented listing: the page asks for those three statuses and for no other;
 *  - an ARCHIVED or PENDING listing opens for its owner and for staff only; a guest, a stranger and a viewer whose own profile is not in good standing get the restricted view,
 *    never the listing, and the non-public statuses are not even asked for on behalf of a guest or a blocked viewer;
 *  - the metadata treats active, sold and rented as public; every other status gets the bare title and `noindex`, also when the session reads no row; `noindex` of a sold or
 *    rented listing starts when `archived_noindex_days` have passed since its last update, and an active listing is never `noindex`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb, type Row } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  viewer: { ok: false, reason: 'unauthenticated' } as { ok: true; userId: string; role: string } | { ok: false; reason: string },
  noindexDays: 30,
  viewerReads: 0,
}))

/** the database as the admin client sees it: every row */
let adminDb = createFakeDb()
/** the database as the current visitor's session sees it: the rows the read policy lets that visitor read */
let sessionDb = createFakeDb()
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (t: string) => sessionDb.from(t) }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => adminDb.from(t) }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => { state.viewerReads += 1; return state.viewer } }))
vi.mock('@/modules/admin/lib/settings', () => ({
  getArchivedNoindexDays: async () => state.noindexDays,
  getSetting: async (_key: string, fallback: string) => fallback,
}))
vi.mock('@/lib/getExchangeRateServer', () => ({ getExchangeRates: async () => null }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))
vi.mock('next-intl/server', () => ({ getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}` }))
vi.mock('@/modules/listings/components/ListingDetailView', () => ({ ListingDetailView: () => null }))
vi.mock('@/modules/listings/components/ListingAccessRestrictedView', () => ({ ListingAccessRestrictedView: () => null }))

import ListingPage, { generateMetadata } from '../page'
import { ListingAccessRestrictedView } from '@/modules/listings/components/ListingAccessRestrictedView'

const OWNER = 'owner-1'
const STRANGER = 'stranger-1'
const STAFF = 'staff-1'
const DAY = 86_400_000
const longAgo = new Date(Date.now() - 90 * DAY).toISOString()
const recently = new Date(Date.now() - 2 * DAY).toISOString()
const PUBLIC_STATUSES = ['active', 'sold', 'rented']

function listing(id: string, status: string, updatedAt = recently): Row {
  return {
    id, slug: `slug-${id}`, status, user_id: OWNER, title: `Flat ${id}`, price: 1000, currency: 'EUR', description: 'A flat', updated_at: updatedAt, created_at: updatedAt,
    area_gross: null, listing_type: 'sale', property_type: 'apartment', images: [],
  }
}

const ALL_ROWS = (): Row[] => [
  listing('act', 'active'), listing('sold', 'sold'), listing('rent', 'rented'), listing('arch', 'archived'), listing('pend', 'pending'),
  listing('sold-old', 'sold', longAgo), listing('rent-old', 'rented', longAgo), listing('act-old', 'active', longAgo),
]

const params = (slug: string) => ({ params: Promise.resolve({ locale: 'en', slug }) })
type PageElement = { type: unknown; props: Record<string, unknown> & { listing?: { id: string; status: string } } }
/** the listing the page hands to its view, the word "restricted" for the restricted view, or the word "not found" */
async function open(slug: string): Promise<string> {
  try {
    const element = (await ListingPage(params(slug))) as unknown as PageElement
    if (element.type === ListingAccessRestrictedView) return 'restricted'
    return element.props.listing!.id
  } catch (error) {
    if ((error as Error).message === 'NEXT_NOT_FOUND') return 'not found'
    throw error
  }
}
/** every status list the page asked the visitor's session for, in order */
const statusFilters = () => sessionDb.log.filter((e) => e.table === 'listings' && e.op === 'select').map((e) => e.filters.find(([c]) => c === 'status'))
const askedFor = (status: string) => statusFilters().some((f) => f && (f[2] as string[]).includes(status))
const ownerFilterOnRead = () => sessionDb.log.some((e) => e.table === 'listings' && e.filters.some(([c, k, v]) => c === 'user_id' && k === 'eq' && v === state.user?.id))

function actAs(who: 'guest' | 'stranger' | 'owner' | 'staff' | 'blocked') {
  state.viewerReads = 0
  if (who === 'guest') { state.user = null; state.viewer = { ok: false, reason: 'unauthenticated' } } else {
    const id = who === 'owner' ? OWNER : who === 'staff' ? STAFF : STRANGER
    state.user = { id }
    state.viewer = who === 'blocked' ? { ok: false, reason: 'account_blocked' } : { ok: true, userId: id, role: who === 'staff' ? 'moderator' : 'user' }
  }
  // the read policy of hardening v8a: everyone reads the public statuses, the owner also reads their own listings in any status, staff read all
  const readable = ALL_ROWS().filter((r) => PUBLIC_STATUSES.includes(r.status as string) || who === 'staff' || (who === 'owner' && r.user_id === OWNER))
  sessionDb = createFakeDb({ listings: readable })
}

beforeEach(() => {
  adminDb = createFakeDb({ listings: ALL_ROWS() })
  actAs('guest')
  state.noindexDays = 30
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('closedListing', () => {
  it('[SEC-X-SRV-CLOSED-PAGE] visitors open sold and rented, not archived', async () => {
    // a guest and a signed-in stranger open active, sold and rented listings, and ask for those three statuses only
    for (const who of ['guest', 'stranger'] as const) {
      actAs(who)
      expect(await open('slug-act'), `${who}: active`).toBe('act')
      expect(await open('slug-sold'), `${who}: sold`).toBe('sold')
      expect(await open('slug-rent'), `${who}: rented`).toBe('rent')
      expect(statusFilters().every((f) => JSON.stringify(f?.[2]) === JSON.stringify(['active', 'sold', 'rented'])), `${who}: the first read asks for active, sold and rented`).toBe(true)
      expect(askedFor('archived'), `${who}: no read for the public statuses names archived`).toBe(false)
      expect(adminDb.log, `${who}: the admin client was not used for a public listing`).toEqual([])
    }

    // an archived listing and a pending one give a guest the restricted view, and a guest's request never asks for a non-public status or reads a profile
    actAs('guest')
    expect(await open('slug-arch'), 'guest: archived').toBe('restricted')
    expect(await open('slug-pend'), 'guest: pending').toBe('restricted')
    expect(askedFor('archived'), 'guest: archived was never asked for').toBe(false)
    expect(askedFor('pending'), 'guest: pending was never asked for').toBe(false)
    expect(state.viewerReads, 'guest: no profile was read').toBe(0)

    // a stranger is refused too, and the read made for a signed-in viewer is limited to that viewer's own listings
    actAs('stranger')
    expect(await open('slug-arch'), 'stranger: archived').toBe('restricted')
    expect(await open('slug-pend'), 'stranger: pending').toBe('restricted')
    expect(ownerFilterOnRead(), 'stranger: the non-public read is limited to the viewer\'s own listings').toBe(true)

    // a viewer whose own profile is not in good standing gets nothing non-public, and no non-public status is asked for
    actAs('blocked')
    expect(await open('slug-arch'), 'blocked: archived').toBe('restricted')
    expect(askedFor('archived'), 'blocked: archived was never asked for').toBe(false)

    // the owner and staff open it: the owner by the listing's own id, staff with no owner limit
    actAs('owner')
    expect(await open('slug-arch'), 'owner: archived').toBe('arch')
    expect(await open('slug-pend'), 'owner: pending').toBe('pend')
    actAs('staff')
    expect(await open('slug-arch'), 'staff: archived').toBe('arch')
    expect(ownerFilterOnRead(), 'staff: no owner limit on the non-public read').toBe(false)

    // a slug that does not exist stays not found, for a guest and for a signed-in viewer
    for (const who of ['guest', 'stranger'] as const) {
      actAs(who)
      expect(await open('slug-missing'), `${who}: a slug that does not exist`).toBe('not found')
    }

    // the metadata: public statuses get the full title, every other status the bare title and noindex, also when the session reads no row
    actAs('guest')
    const meta = async (slug: string) => (await generateMetadata(params(slug))) as { title?: string; robots?: { index: boolean; follow: boolean } }
    for (const slug of ['slug-act', 'slug-sold', 'slug-rent']) expect((await meta(slug)).title, slug).toContain('| Lero.al')
    for (const slug of ['slug-arch', 'slug-pend']) expect(await meta(slug), slug).toEqual({ title: 'Lero.al', robots: { index: false, follow: true } })
    expect(await meta('slug-missing'), 'a slug that does not exist').toEqual({})
    // noindex: only sold and rented, and only once the configured days have passed since the last update
    expect((await meta('slug-sold')).robots, 'sold, updated 2 days ago').toBeUndefined()
    expect((await meta('slug-rent')).robots, 'rented, updated 2 days ago').toBeUndefined()
    expect((await meta('slug-sold-old')).robots, 'sold, updated 90 days ago').toEqual({ index: false, follow: true })
    expect((await meta('slug-rent-old')).robots, 'rented, updated 90 days ago').toEqual({ index: false, follow: true })
    expect((await meta('slug-act-old')).robots, 'active is never noindex, however old').toBeUndefined()
  })
})
