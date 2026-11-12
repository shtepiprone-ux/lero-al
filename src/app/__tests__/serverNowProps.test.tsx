// @vitest-environment node
/**
 * Task 965 (AC1) — the server pages that list rows with a relative time hand their own `now` to the container.
 *
 * `RelativeTime` without `baseDate` reads the machine clock on the server and again in the browser, so a row only seconds old can print "less than a minute ago" in
 * the HTML and "1 minute ago" at hydration: React error 418 on a page that was never touched (found by the first walks of the production build). A page that
 * passes the instant it rendered at (`now`, an ISO string) makes both renders print the same text; the containers hand it down to `RelativeTime` as `baseDate`.
 * The components are doubles here: what is read is the prop the page gives the container.
 */
import { describe, expect, it, vi } from 'vitest'

const Stub = vi.hoisted(() => {
  const make = () => function Stub() { return null }
  return {
    currencies: make(), pages: make(), propertyTypes: make(), reports: make(), cabinet: make(), header: make(), frame: make(), recent: make(),
    companies: make(), listingsTable: make(), favorites: make(), listingsShell: make(), similarView: make(),
  }
})

// a chainable stand-in for a Supabase query: every call returns the chain, awaiting it answers an empty result
const chain = vi.hoisted(() => {
  const answer: { data: unknown[]; count: number; error: null } = { data: [], count: 0, error: null }
  const builder: unknown = new Proxy(function () {}, {
    get: (_target, prop) => (prop === 'then' ? (resolve: (value: unknown) => void) => resolve(answer) : builder),
    apply: () => builder,
  })
  return { builder, answer }
})

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key, getLocale: async () => 'sq' }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }) }))
vi.mock('@/lib/getExchangeRateServer', () => ({ getExchangeRates: async () => ({ ALL: 1 }) }))
vi.mock('@/modules/listings/lib/favoritesQueries', () => ({
  getFavoriteListingsPaginated: async () => ({ listings: [], total: 0 }),
  getFavoriteTypeCounts: async () => ({}),
  getUserCollections: async () => [],
}))
vi.mock('next/navigation', () => ({ redirect: (to: string) => { throw new Error(`NEXT_REDIRECT ${to}`) }, notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))
vi.mock('@/lib/auth/staff', () => ({ requireStaffPage: async () => ({ userId: 'u', role: 'admin' }) }))
vi.mock('@/lib/auth/permissions', () => ({ hasPermission: async () => true }))
vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => 'en' }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => chain.builder }) }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: () => chain.builder }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'user-1', email: 'a@example.com' }) }))
vi.mock('@/modules/admin/actions/currencies', () => ({ getAllCurrenciesAdmin: async () => [] }))
vi.mock('@/modules/admin/actions/propertyTypes', () => ({ getAllPropertyTypesAdmin: async () => [] }))
vi.mock('@/components/admin/AdminPageHeader', () => ({ AdminPageHeader: Stub.header }))
vi.mock('@/components/admin/AdminPageFrame', () => ({ AdminPageFrame: Stub.frame }))
vi.mock('@/components/admin/AdminCurrenciesManager', () => ({ AdminCurrenciesManager: Stub.currencies }))
vi.mock('@/components/admin/AdminPagesManager', () => ({ AdminPagesManager: Stub.pages }))
vi.mock('@/components/admin/AdminPropertyTypesManager', () => ({ AdminPropertyTypesManager: Stub.propertyTypes }))
vi.mock('@/components/admin/AdminReportsManager', () => ({ AdminReportsManager: Stub.reports }))
vi.mock('@/components/admin/AdminCompaniesManager', () => ({ AdminCompaniesManager: Stub.companies }))
vi.mock('@/components/admin/AdminListingsTable', () => ({ AdminListingsTable: Stub.listingsTable }))
vi.mock('@/modules/listings/components/FavoritesShell', () => ({ FavoritesShell: Stub.favorites }))
vi.mock('@/modules/listings/components/ListingsShell', () => ({ ListingsShell: Stub.listingsShell }))
vi.mock('@/modules/listings/components/SimilarListingsView', () => ({ SimilarListingsView: Stub.similarView }))
vi.mock('@/modules/cabinet/components/CabinetShell', () => ({ CabinetShell: Stub.cabinet }))
vi.mock('@/modules/listings/components/RecentlyViewedSection', () => ({ RecentlyViewedSection: Stub.recent }))

import AdminCompaniesPage from '@/app/admin/companies/page'
import AdminListingsPage from '@/app/admin/listings/page'
import FavoritesPage from '@/app/[locale]/favorites/page'
import ListingsPage from '@/app/[locale]/listings/page'
import { SimilarListings } from '@/modules/listings/components/SimilarListings'
import AdminCurrencyPage from '@/app/admin/currency/page'
import AdminPagesPage from '@/app/admin/pages/page'
import AdminPropertyTypesPage from '@/app/admin/property-types/page'
import AdminReportsPage from '@/app/admin/reports/page'
import CabinetPage from '@/app/[locale]/cabinet/page'

/** The first element of `type` in a returned React tree, searched through `props.children`. */
function findElement(node: unknown, type: unknown): { props: Record<string, unknown> } | null {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, type)
      if (found) return found
    }
    return null
  }
  const element = node as { type?: unknown; props?: { children?: unknown } }
  if (element.type === type) return element as { props: Record<string, unknown> }
  return findElement(element.props?.children, type)
}

function expectNow(props: Record<string, unknown> | undefined, before: number) {
  const now = props?.now
  expect(typeof now).toBe('string')
  expect(new Date(now as string).toISOString()).toBe(now)
  expect(new Date(now as string).getTime()).toBeGreaterThanOrEqual(before)
  expect(new Date(now as string).getTime()).toBeLessThanOrEqual(Date.now())
}

describe('Task 965 — a page hands its own `now` to the container that prints relative times', () => {
  it('/admin/currency', async () => {
    const before = Date.now()
    expectNow(findElement(await AdminCurrencyPage(), Stub.currencies)?.props, before)
  })

  it('/admin/pages', async () => {
    const before = Date.now()
    expectNow(findElement(await AdminPagesPage(), Stub.pages)?.props, before)
  })

  it('/admin/property-types', async () => {
    const before = Date.now()
    expectNow(findElement(await AdminPropertyTypesPage({ searchParams: Promise.resolve({}) }), Stub.propertyTypes)?.props, before)
  })

  it('/admin/reports', async () => {
    const before = Date.now()
    expectNow(findElement(await AdminReportsPage({ searchParams: Promise.resolve({}) }), Stub.reports)?.props, before)
  })

  it('/{locale}/cabinet', async () => {
    const before = Date.now()
    const tree = await CabinetPage({ params: Promise.resolve({ locale: 'sq' }), searchParams: Promise.resolve({}) })
    expectNow((tree as { props: Record<string, unknown> }).props, before)
  })

  it('/admin/companies', async () => {
    const before = Date.now()
    expectNow(findElement(await AdminCompaniesPage(), Stub.companies)?.props, before)
  })

  it('/admin/listings', async () => {
    const before = Date.now()
    expectNow(findElement(await AdminListingsPage({ searchParams: Promise.resolve({}) }), Stub.listingsTable)?.props, before)
  })

  // The listing cards of these pages decide the `new` badge from the instant the server gave (Task 965 R1-2), never from the browser clock in the first render.
  it('/{locale}/favorites', async () => {
    const before = Date.now()
    const tree = await FavoritesPage({ params: Promise.resolve({ locale: 'sq' }), searchParams: Promise.resolve({}) })
    expectNow(findElement(tree, Stub.favorites)?.props, before)
  })

  it('/{locale}/listings', async () => {
    const before = Date.now()
    const tree = await ListingsPage({ params: Promise.resolve({ locale: 'sq' }), searchParams: Promise.resolve({}) })
    expectNow(findElement(tree, Stub.listingsShell)?.props, before)
  })

  it('the similar listings of a listing page', async () => {
    chain.answer.data = [{ id: 'l-2', slug: 'second', title: 'Second', created_at: '2026-11-12T10:00:00Z' }]
    try {
      const before = Date.now()
      const tree = await SimilarListings({
        currentId: 'l-1', propertyType: 'apartment', listingType: 'sale', locationId: null, condition: null, heating: null, wallType: null, marketType: null,
        offerType: null, purchaseConditions: null, rooms: null, areaGross: null, floor: null, yearBuilt: null,
      })
      expectNow(findElement(tree, Stub.similarView)?.props, before)
    } finally {
      chain.answer.data = []
    }
  })
})
