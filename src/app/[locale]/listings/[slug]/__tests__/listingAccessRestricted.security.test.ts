// @vitest-environment node
/**
 * Security (Task 923 R103, D72, cases SEC-X-SRV-RESTRICTED-PAGE-DENY and -ALLOW): what a visitor learns at the address of a listing that is not public.
 *
 * The REAL listing page (`ListingPage`) and its `generateMetadata` run with the REAL `getListingAccessState` over an in-memory database (it does NOT simulate row-level
 * security: the session client is given EVERY row, so what keeps a hidden listing from a visitor is what the CODE asks for and decides) with doubles for the identity, the
 * viewer's profile, the settings, the exchange rates, the translations and the views that render the page. The admin client reads the same rows.
 *  - DENY: a guest, a signed-in stranger and a viewer whose own profile is not in good standing, on an inactive, an archived, a pending and an expired listing, get the restricted
 *    view whose props are exactly the allowed strings and hrefs; no listing field reaches the rendered element, its props or the metadata; a slug that does not exist stays not found;
 *  - ALLOW: the owner and staff open their listing in each of those statuses, an active listing opens for every visitor, and the helper is not used when a read returned the row.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb, type Row } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  viewer: { ok: false, reason: 'unauthenticated' } as { ok: true; userId: string; role: string } | { ok: false; reason: string },
  viewerReads: 0,
}))

let db = createFakeDb()
// a client that sees every row; the admin client and the session client are separate recordings of the same rows
let adminDb = createFakeDb()
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (t: string) => db.from(t) }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => adminDb.from(t) }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => { state.viewerReads += 1; return state.viewer } }))
vi.mock('@/modules/admin/lib/settings', () => ({
  getArchivedNoindexDays: async () => 30,
  getSetting: async (_key: string, fallback: string) => fallback,
}))
vi.mock('@/lib/getExchangeRateServer', () => ({ getExchangeRates: async () => null }))
vi.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
  redirect: (to: string) => { throw new Error(`NEXT_REDIRECT ${to}`) },
}))
vi.mock('next-intl/server', () => ({ getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}` }))
vi.mock('@/modules/listings/components/ListingDetailView', () => ({ ListingDetailView: () => null }))
vi.mock('@/modules/listings/components/ListingAccessRestrictedView', () => ({ ListingAccessRestrictedView: () => null }))

import ListingPage, { generateMetadata } from '../page'
import { ListingAccessRestrictedView } from '@/modules/listings/components/ListingAccessRestrictedView'

const OWNER = 'owner-1'
const STRANGER = 'stranger-1'
const STAFF = 'staff-1'
const HIDDEN = ['inactive', 'archived', 'pending', 'expired'] as const
// markers that must never leave the database for a visitor who may not open the listing
const MARKER = { title: 'MARKER-TITLE', address: 'MARKER-ADDRESS', description: 'MARKER-DESCRIPTION', price: 987654321, owner: 'MARKER-OWNER-ID' }

function listing(status: string): Row {
  return {
    id: `id-${status}`, slug: `slug-${status}`, status, user_id: OWNER, title: `${MARKER.title} ${status}`, price: MARKER.price, currency: 'EUR', description: MARKER.description,
    address: MARKER.address, owner_marker: MARKER.owner, updated_at: new Date().toISOString(), created_at: new Date().toISOString(),
    area_gross: null, listing_type: 'sale', property_type: 'apartment', images: [{ url: 'https://example.com/MARKER-IMAGE.jpg', is_cover: true, order: 0 }],
  }
}

function seed() {
  const rows = [listing('active'), ...HIDDEN.map(listing)]
  db = createFakeDb({ listings: rows })
  adminDb = createFakeDb({ listings: rows })
}

function actAs(who: 'guest' | 'stranger' | 'owner' | 'staff' | 'blocked') {
  state.viewerReads = 0
  if (who === 'guest') { state.user = null; state.viewer = { ok: false, reason: 'unauthenticated' }; return }
  const id = who === 'owner' ? OWNER : who === 'staff' ? STAFF : STRANGER
  state.user = { id }
  state.viewer = who === 'blocked' ? { ok: false, reason: 'account_blocked' } : { ok: true, userId: id, role: who === 'staff' ? 'moderator' : 'user' }
}

const params = (slug: string) => ({ params: Promise.resolve({ locale: 'en', slug }) })
type PageElement = { type: unknown; props: Record<string, unknown> & { listing?: { id: string } } }
const render = async (slug: string) => (await ListingPage(params(slug))) as unknown as PageElement
/** what the page did: the element it rendered, or the redirect or not-found it threw (as text), so a different outcome is a failed assertion and not a crash */
async function outcome(slug: string): Promise<{ element?: PageElement; thrown?: string }> {
  try { return { element: await render(slug) } } catch (error) { return { thrown: (error as Error).message } }
}
const ownerFilterOnRead = () => db.log.some((e) => e.table === 'listings' && e.filters.some(([c, k, v]) => c === 'user_id' && k === 'eq' && v === state.user?.id))

/** the props the restricted view may carry: the labels, the links and the texts, and nothing else */
const ALLOWED_PROPS = ['homeHref', 'homeLabel', 'listingsHref', 'listingsLabel', 'currentLabel', 'breadcrumbAriaLabel', 'title', 'description', 'actionHref', 'actionLabel']
const restrictedProps = (slug: string, action: 'sign-in' | 'browse') => ({
  homeHref: '/en',
  homeLabel: 'nav.home',
  listingsHref: '/en/listings',
  listingsLabel: 'listing.all_listings',
  currentLabel: 'listing.access_restricted_crumb',
  breadcrumbAriaLabel: 'common.aria_breadcrumb',
  title: 'listing.access_restricted_title',
  description: 'listing.access_restricted_text',
  actionHref: action === 'sign-in' ? `/en/auth/login?next=${encodeURIComponent(`/en/listings/${slug}`)}` : '/en/listings',
  actionLabel: action === 'sign-in' ? 'listing.access_restricted_sign_in' : 'listing.access_restricted_browse',
})

beforeEach(() => { seed(); actAs('guest'); vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('listingAccessRestricted', () => {
  it('[SEC-X-SRV-RESTRICTED-PAGE-DENY] a visitor gets the restricted page and no listing data for every non-public status', async () => {
    // a guest and a viewer who is not in good standing are offered to sign in and come back to the listing; a signed-in stranger is offered the listings
    const visitors = [
      ['guest', 'sign-in'],
      ['blocked', 'sign-in'],
      ['stranger', 'browse'],
    ] as const
    for (const [who, action] of visitors) {
      for (const status of HIDDEN) {
        seed()
        actAs(who)
        const slug = `slug-${status}`
        const element = await render(slug)
        const name = `${who} on ${status}`

        // the restricted view, with exactly the allowed props: strings and hrefs
        expect(element.type, `${name}: the restricted view, not the listing`).toBe(ListingAccessRestrictedView)
        expect(Object.keys(element.props).sort(), `${name}: only the allowed props`).toEqual([...ALLOWED_PROPS].sort())
        expect(element.props, `${name}: the labels, texts and links`).toEqual(restrictedProps(slug, action))
        expect(Object.values(element.props).every((v) => typeof v === 'string'), `${name}: every prop is a string`).toBe(true)

        // no listing field anywhere in the element
        const serialized = JSON.stringify(element.props)
        for (const marker of [MARKER.title, MARKER.address, MARKER.description, String(MARKER.price), MARKER.owner, 'MARKER-IMAGE', `id-${status}`, OWNER]) {
          expect(serialized, `${name}: no ${marker} in the props`).not.toContain(marker)
        }

        // the metadata: the bare title and noindex, never the listing's title
        const meta = (await generateMetadata(params(slug))) as { title?: string; robots?: { index: boolean; follow: boolean }; description?: string; openGraph?: unknown }
        expect(meta, `${name}: the metadata`).toEqual({ title: 'Lero.al', robots: { index: false, follow: true } })
      }
    }

    // the non-public statuses are asked for only on behalf of a signed-in viewer in good standing, and only for that viewer's own listings
    seed(); actAs('guest'); await render('slug-archived')
    expect(db.log.some((e) => e.filters.some(([c, , v]) => c === 'status' && (v as string[]).includes('archived'))), 'guest: the session never asked for a non-public status').toBe(false)
    seed(); actAs('blocked'); await render('slug-archived')
    expect(db.log.some((e) => e.filters.some(([c, , v]) => c === 'status' && (v as string[]).includes('archived'))), 'blocked: the session never asked for a non-public status').toBe(false)
    expect(state.viewerReads, 'blocked: the profile was read once').toBe(1)
    seed(); actAs('stranger'); await render('slug-archived')
    expect(ownerFilterOnRead(), 'stranger: the non-public read is limited to the stranger\'s own listings').toBe(true)

    // a slug that does not exist stays not found, with an empty metadata object, for every visitor
    for (const who of ['guest', 'blocked', 'stranger'] as const) {
      seed()
      actAs(who)
      expect((await outcome('slug-missing')).thrown, `${who}: a slug that does not exist is not found`).toBe('NEXT_NOT_FOUND')
      expect(await generateMetadata(params('slug-missing')), `${who}: metadata of a slug that does not exist`).toEqual({})
    }

    // the metadata also holds when the session reads no row at all (the read policy hides the listing): the helper alone says the address is a real listing
    for (const status of HIDDEN) {
      seed()
      db = createFakeDb({ listings: [] })
      actAs('guest')
      expect(await generateMetadata(params(`slug-${status}`)), `no row for the session, ${status}`).toEqual({ title: 'Lero.al', robots: { index: false, follow: true } })
    }
  })

  it('[SEC-X-SRV-RESTRICTED-PAGE-ALLOW] the owner and staff open their listing in every non-public status', async () => {
    for (const who of ['owner', 'staff'] as const) {
      for (const status of HIDDEN) {
        seed()
        actAs(who)
        const element = await render(`slug-${status}`)
        const name = `${who} on ${status}`
        expect(element.type, `${name}: not the restricted view`).not.toBe(ListingAccessRestrictedView)
        expect(element.props.listing?.id, `${name}: the listing view receives that listing`).toBe(`id-${status}`)
        expect(adminDb.log, `${name}: the helper is not used when a read returned the row`).toEqual([])
        expect(ownerFilterOnRead(), `${name}: only the owner's read is limited to the viewer's own listings`).toBe(who === 'owner')
      }
    }

    // the active listing opens for every visitor, with no use of the helper
    for (const who of ['guest', 'stranger', 'blocked', 'owner', 'staff'] as const) {
      seed()
      actAs(who)
      const element = await render('slug-active')
      expect(element.props.listing?.id, `${who}: active`).toBe('id-active')
      expect(adminDb.log, `${who}: active: the helper is not used`).toEqual([])
    }
  })
})
