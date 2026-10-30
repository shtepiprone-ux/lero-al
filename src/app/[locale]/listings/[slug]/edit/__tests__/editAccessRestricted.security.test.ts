// @vitest-environment node
/**
 * Security (Task 923 R103 (d), D72, case SEC-X-SRV-RESTRICTED-EDIT): what a visitor who is not the owner learns at the edit link of a listing that is not public.
 *
 * The REAL edit page (`EditListingPage`) runs with the REAL `getListingAccessState` over an in-memory database (it does NOT simulate row-level security itself: the session client
 * of each visitor is seeded with the rows the read policy of hardening v8a lets that visitor read, and the admin client reads every row) with doubles for the identity, the
 * viewer's profile, the translations and the views.
 *  - a guest on the edit link of a hidden listing gets the restricted view with the sign-in action whose `next` is the edit path, and no redirect to sign-in;
 *  - a signed-in stranger on that link gets the restricted view with the browse action;
 *  - a guest on the edit link of an active listing is sent to sign in, as before; a slug that does not exist is not found for a signed-in viewer;
 *  - the listing form, or any listing field, reaches none of them; the owner still reaches the form;
 *  - the edit page's metadata carries `robots` noindex for every visitor (R106, D72).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb, type Row } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  viewer: { ok: false, reason: 'unauthenticated' } as { ok: true; userId: string; role: string } | { ok: false; reason: string },
}))

let sessionDb = createFakeDb()
let adminDb = createFakeDb()
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (t: string) => sessionDb.from(t) }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => adminDb.from(t) }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => state.viewer }))
vi.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
  redirect: (to: string) => { throw new Error(`NEXT_REDIRECT ${to}`) },
}))
vi.mock('next-intl/server', () => ({ getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}` }))
vi.mock('@/modules/listings/components/ListingFormLoader', () => ({ ListingFormLoader: () => null }))
vi.mock('@/modules/listings/components/ListingAccessRestrictedView', () => ({ ListingAccessRestrictedView: () => null }))

import EditListingPage, { generateMetadata } from '../page'
import { ListingAccessRestrictedView } from '@/modules/listings/components/ListingAccessRestrictedView'
import { ListingFormLoader } from '@/modules/listings/components/ListingFormLoader'

const OWNER = 'owner-1'
const STRANGER = 'stranger-1'
const MARKER = { title: 'MARKER-TITLE', address: 'MARKER-ADDRESS', description: 'MARKER-DESCRIPTION', price: 987654321 }

function listing(status: string): Row {
  return {
    id: `id-${status}`, slug: `slug-${status}`, status, user_id: OWNER, title: `${MARKER.title} ${status}`, price: MARKER.price, price_old: null, currency: 'EUR',
    description: MARKER.description, address: MARKER.address, listing_type: 'sale', property_type: 'apartment', images: [],
  }
}

function seed(readableBy: 'guest' | 'stranger' | 'owner') {
  const rows = [listing('active'), listing('archived'), listing('pending')]
  adminDb = createFakeDb({ listings: rows })
  // the read policy of hardening v8a: everyone reads the public statuses, the owner also reads their own listings
  sessionDb = createFakeDb({ listings: rows.filter((r) => r.status === 'active' || readableBy === 'owner') })
}

function actAs(who: 'guest' | 'stranger' | 'owner') {
  if (who === 'guest') { state.user = null; state.viewer = { ok: false, reason: 'unauthenticated' } } else {
    const id = who === 'owner' ? OWNER : STRANGER
    state.user = { id }
    state.viewer = { ok: true, userId: id, role: 'user' }
  }
  seed(who)
}

const params = (slug: string) => ({ params: Promise.resolve({ locale: 'en', slug }) })
type PageElement = { type: unknown; props: Record<string, unknown> }
/** what the page did: the element it rendered, or the redirect or not-found it threw (as text), so a different outcome is a failed assertion and not a crash */
async function outcome(slug: string): Promise<{ element?: PageElement; thrown?: string }> {
  try { return { element: (await EditListingPage(params(slug))) as unknown as PageElement } } catch (error) { return { thrown: (error as Error).message } }
}
const render = async (slug: string) => {
  const result = await outcome(slug)
  expect(result.thrown, `${slug}: the page rendered an element and threw nothing`).toBeUndefined()
  return result.element as PageElement
}
const editPath = (slug: string) => `/en/listings/${slug}/edit`

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('editAccessRestricted', () => {
  it('[SEC-X-SRV-RESTRICTED-EDIT] the edit link of a hidden listing shows the restricted page to a non-owner', async () => {
    const hidden = ['archived', 'pending']
    const expectNoListing = (element: PageElement, name: string) => {
      expect(element.type, `${name}: the restricted view, not the page that wraps the listing form`).toBe(ListingAccessRestrictedView)
      const serialized = JSON.stringify(element.props)
      for (const marker of [MARKER.title, MARKER.address, MARKER.description, String(MARKER.price), OWNER, 'id-archived', 'id-pending']) {
        expect(serialized, `${name}: no ${marker} in the props`).not.toContain(marker)
      }
      expect(Object.values(element.props).every((v) => typeof v === 'string'), `${name}: every prop is a string`).toBe(true)
    }

    for (const status of hidden) {
      const slug = `slug-${status}`

      // a guest: the restricted view with the sign-in action back to the edit link, and no redirect
      actAs('guest')
      const guest = await render(slug)
      expect(guest.type, `guest on ${status}: the restricted view`).toBe(ListingAccessRestrictedView)
      expect(guest.props.actionHref, `guest on ${status}: sign in, then back to the edit path`).toBe(`/en/auth/login?next=${encodeURIComponent(editPath(slug))}`)
      expect(guest.props.actionLabel, `guest on ${status}: the sign-in label`).toBe('listing.access_restricted_sign_in')
      expect(guest.props.title, `guest on ${status}: the restricted title`).toBe('listing.access_restricted_title')
      expectNoListing(guest, `guest on ${status}`)

      // a signed-in stranger: the restricted view with the browse action
      actAs('stranger')
      const stranger = await render(slug)
      expect(stranger.type, `stranger on ${status}: the restricted view`).toBe(ListingAccessRestrictedView)
      expect(stranger.props.actionHref, `stranger on ${status}: browse the listings`).toBe('/en/listings')
      expect(stranger.props.actionLabel, `stranger on ${status}: the browse label`).toBe('listing.access_restricted_browse')
      expectNoListing(stranger, `stranger on ${status}`)
    }

    // a guest on the edit link of an active listing is sent to sign in, as before
    actAs('guest')
    expect((await outcome('slug-active')).thrown, 'guest on active').toBe(`NEXT_REDIRECT /en/auth/login?next=${encodeURIComponent(editPath('slug-active'))}&session=lost`)

    // a slug that does not exist: a guest is sent to sign in, a signed-in viewer gets not found
    actAs('guest')
    expect((await outcome('slug-missing')).thrown, 'guest on a missing slug').toContain('NEXT_REDIRECT /en/auth/login')
    actAs('stranger')
    expect((await outcome('slug-missing')).thrown, 'stranger on a missing slug').toBe('NEXT_NOT_FOUND')

    // the control: the owner reaches the form of the listing
    actAs('owner')
    // (the page wraps the form in one block, so the form is that block's only child)
    const owner = await render('slug-pending')
    const form = owner.props.children as { type: unknown; props: Record<string, unknown> }
    expect(form.type, 'owner on pending: the listing form').toBe(ListingFormLoader)
    expect(form.props.listingId, 'owner on pending: the form of that listing').toBe('id-pending')

    // the metadata: the edit page is never indexed, whoever asks and whatever the listing's state (R106; the translation double answers `<namespace>.<key>`)
    for (const who of ['guest', 'stranger', 'owner'] as const) {
      actAs(who)
      expect(await generateMetadata(params('slug-archived')), `${who}: the edit page metadata`).toEqual({
        title: 'listing.edit_listing | Lero.al',
        robots: { index: false, follow: true },
      })
    }
  })
})
