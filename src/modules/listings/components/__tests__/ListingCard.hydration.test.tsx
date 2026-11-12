/**
 * Task 965 Revision 1, AC8 (R1-2, Review 1 F3) — a listing card hydrates without a recoverable error whatever the browser clock says, and its `new` badge follows the
 * instant the server gave.
 *
 * `getBadges` decided the `new` badge from `Date.now()` while the card rendered, on the server and again in the browser, so a listing near the 7-day edge, or a browser
 * clock hours off, got a different badge in the browser than in the server HTML: React error 418 (the page's server HTML is thrown away). The card now reads the badge from
 * the instant its page rendered at (`now`, ISO, through `isListingNew`); with no `now` (a list that only exists in the browser) its first render shows no `new` badge and the
 * browser clock decides from the next render on.
 *
 * The test does what the browser does: render to a string on the server, put the string into a container, `hydrateRoot` it with the browser clock moved, and record every
 * `onRecoverableError` (see `adminPagesHydration.test.tsx`).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../messages/en.json'
import { ListingCard, type CardListingData } from '../ListingCard'

vi.mock('@/modules/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', preferred_currency: 'EUR' }, status: 'authenticated' as const, loading: false, signOut: () => {}, refreshUser: () => {} }),
}))

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const SERVER_NOW = new Date('2026-11-12T10:00:00.000Z')

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(SERVER_NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages as never} timeZone="UTC">
      <MantineProvider theme={theme} forceColorScheme="light">{children}</MantineProvider>
    </NextIntlClientProvider>
  )
}

const listingCreatedAgo = (ms: number): CardListingData => ({
  id: 'listing-1',
  public_id: 1234,
  slug: 'modern-apartment-tirana',
  title: 'Modern Apartment in Tirana',
  price: 80000,
  currency: 'EUR',
  listing_type: 'sale',
  property_type: 'apartment',
  is_premium: false,
  status: 'active',
  created_at: new Date(SERVER_NOW.getTime() - ms).toISOString(),
  images: [{ url: 'https://example.com/photo-1.jpg', is_cover: true, order: 0 }],
  location: { id: 1, name_al: 'Tiranë, Shqipëri', slug: 'tirane', type: 'city' },
  area_gross: 80,
  bedrooms: 2,
  bathrooms: 1,
})

/** Server render at SERVER_NOW → HTML in a container → the browser clock moved by `clockOffsetMs` → `hydrateRoot`; returns what React reported and what the DOM shows. */
async function hydrate(element: React.ReactElement, clockOffsetMs: number) {
  const html = renderToString(<Providers>{element}</Providers>)
  vi.setSystemTime(new Date(SERVER_NOW.getTime() + clockOffsetMs))
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)
  const recoverable: string[] = []
  const consoleErrors: string[] = []
  const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { consoleErrors.push(args.map(String).join(' ')) })
  let root: ReturnType<typeof hydrateRoot> | undefined
  await act(async () => {
    root = hydrateRoot(container, <Providers>{element}</Providers>, { onRecoverableError: error => { recoverable.push(String((error as Error).message)) } })
  })
  await act(async () => { await new Promise(resolveWait => setTimeout(resolveWait, 0)) })
  spy.mockRestore()
  const afterHydration = hasNewBadge(container)
  await act(async () => { root?.unmount() })
  container.remove()
  return { html, recoverable, consoleErrors, afterHydration }
}

/** True when the DOM below `root` holds the `new` badge: an element whose whole text is "New" (the provider's style tags also contain the word, e.g. "Courier New"). */
const hasNewBadge = (root: Element) => Array.from(root.querySelectorAll('*')).some(node => node.children.length === 0 && node.textContent === 'New')

const hydrationMessages = (lines: string[]) => lines.filter(line => /hydrat|did not match|didn't match/i.test(line))

describe('Task 965 R1-2 AC8 — the `new` badge of a listing card follows the server instant', () => {
  it('a listing 6 days 23 hours old, the browser clock 2 hours ahead: no recoverable error, the badge stays', async () => {
    const { html, recoverable, consoleErrors, afterHydration } = await hydrate(
      <ListingCard listing={listingCreatedAgo(6 * DAY + 23 * HOUR)} now={SERVER_NOW.toISOString()} />,
      2 * HOUR,
    )
    expect(html).toContain('>New<')
    expect(recoverable).toEqual([])
    expect(hydrationMessages(consoleErrors)).toEqual([])
    // the browser clock says 7 days 1 hour: the badge still follows the server's instant
    expect(afterHydration).toBe(true)
  })

  it('a listing 7 days 1 hour old by the server instant, the browser clock 2 hours behind: no recoverable error, no badge', async () => {
    const { html, recoverable, consoleErrors, afterHydration } = await hydrate(
      <ListingCard listing={listingCreatedAgo(7 * DAY + HOUR)} now={SERVER_NOW.toISOString()} />,
      -2 * HOUR,
    )
    expect(html).not.toContain('>New<')
    expect(recoverable).toEqual([])
    expect(hydrationMessages(consoleErrors)).toEqual([])
    expect(afterHydration).toBe(false)
  })

  it('a listing the server instant calls old keeps no badge even when its clock is a week behind', async () => {
    const { recoverable, afterHydration } = await hydrate(
      <ListingCard listing={listingCreatedAgo(30 * DAY)} now={SERVER_NOW.toISOString()} variant="horizontal" />,
      -7 * DAY,
    )
    expect(recoverable).toEqual([])
    expect(afterHydration).toBe(false)
  })

  it('a card with no `now` (a list that only exists in the browser): the first render shows no badge, the browser clock decides afterwards, nothing is recoverable', async () => {
    const { html, recoverable, consoleErrors, afterHydration } = await hydrate(<ListingCard listing={listingCreatedAgo(DAY)} />, 2 * HOUR)
    expect(html).not.toContain('>New<')
    expect(recoverable).toEqual([])
    expect(hydrationMessages(consoleErrors)).toEqual([])
    expect(afterHydration).toBe(true)
  })

  it('a card rendered only in the browser (no hydration) shows the badge at once, with or without `now`', () => {
    const { unmount } = render(<Providers><ListingCard listing={listingCreatedAgo(DAY)} /></Providers>)
    expect(hasNewBadge(document.body)).toBe(true)
    unmount()
    const withNow = render(<Providers><ListingCard listing={listingCreatedAgo(DAY)} now={SERVER_NOW.toISOString()} /></Providers>)
    expect(hasNewBadge(document.body)).toBe(true)
    withNow.unmount()
  })

  it('a listing that is not active gets its status badge and never `new`, whatever the instant', async () => {
    const { recoverable, afterHydration } = await hydrate(
      <ListingCard listing={{ ...listingCreatedAgo(HOUR), status: 'pending' }} now={SERVER_NOW.toISOString()} />,
      0,
    )
    expect(recoverable).toEqual([])
    expect(afterHydration).toBe(false)
  })
})
