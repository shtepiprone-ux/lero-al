/**
 * Security (Task 923 R103, D72, case SEC-X-FE-RESTRICTED-VIEW): the restricted-listing page shows only the strings it is given and one action.
 *  - the REAL `ListingAccessRestrictedView` (the real listings page frame and the real canonical empty state, under the project theme) renders the Guest props (the Sign in
 *    action) and the SignedIn props (the Browse listings action) with the real messages of sq, en, uk and it;
 *  - it shows the breadcrumb, the restricted title and text, and exactly one link action with the given label and href outside the breadcrumb; no button, no second action and
 *    no text other than the given strings.
 * Only `next/navigation` is not needed: the View renders links and no router hook.
 */
import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import enMessages from '../../../../../messages/en.json'
import sqMessages from '../../../../../messages/sq.json'
import ukMessages from '../../../../../messages/uk.json'
import itMessages from '../../../../../messages/it.json'
import { ListingAccessRestrictedView, type ListingAccessRestrictedViewProps } from '../ListingAccessRestrictedView'

type Messages = { nav: { home: string }; common: { aria_breadcrumb: string }; listing: Record<string, string> }
const LOCALES: Record<string, Messages> = { sq: sqMessages as Messages, en: enMessages as Messages, uk: ukMessages as Messages, it: itMessages as Messages }

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})
afterEach(cleanup)

function propsFor(locale: string, who: 'guest' | 'signed-in'): ListingAccessRestrictedViewProps {
  const m = LOCALES[locale]
  return {
    homeHref: `/${locale}`,
    homeLabel: m.nav.home,
    listingsHref: `/${locale}/listings`,
    listingsLabel: m.listing.all_listings,
    currentLabel: m.listing.access_restricted_crumb,
    breadcrumbAriaLabel: m.common.aria_breadcrumb,
    title: m.listing.access_restricted_title,
    description: m.listing.access_restricted_text,
    actionHref: who === 'guest' ? `/${locale}/auth/login?next=%2F${locale}%2Flistings%2Fany` : `/${locale}/listings`,
    actionLabel: who === 'guest' ? m.listing.access_restricted_sign_in : m.listing.access_restricted_browse,
  }
}

describe('ListingAccessRestrictedView', () => {
  it('[SEC-X-FE-RESTRICTED-VIEW] the restricted page shows only its own strings and one action', () => {
    for (const locale of Object.keys(LOCALES)) {
      for (const who of ['guest', 'signed-in'] as const) {
        const props = propsFor(locale, who)
        const name = `${locale} ${who}`
        const { container } = render(<MantineProvider theme={theme}><ListingAccessRestrictedView {...props} /></MantineProvider>)

        // the strings of the locale are real (a missing key would render as a key path or an empty text)
        for (const text of [props.title, props.description, props.actionLabel, props.currentLabel]) expect(text.length, `${name}: a message exists`).toBeGreaterThan(0)

        // the breadcrumb: its label, then home, the listings and the current crumb
        const crumbs = container.querySelector(`nav[aria-label="${props.breadcrumbAriaLabel}"]`)
        expect(crumbs, `${name}: the breadcrumb`).not.toBeNull()
        expect(Array.from(crumbs!.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')]), `${name}: the breadcrumb links`).toEqual([
          [props.homeLabel, props.homeHref],
          [props.listingsLabel, props.listingsHref],
        ])
        expect(crumbs!.textContent, `${name}: the current crumb`).toContain(props.currentLabel)

        // the title and the text
        expect(container.textContent, `${name}: the title`).toContain(props.title)
        expect(container.textContent, `${name}: the text`).toContain(props.description)

        // exactly one link action outside the breadcrumb, with the given label and href, and no button
        const actions = Array.from(container.querySelectorAll('a')).filter((a) => !a.closest('nav'))
        expect(actions.map((a) => [a.textContent, a.getAttribute('href')]), `${name}: one action`).toEqual([[props.actionLabel, props.actionHref]])
        expect(container.querySelectorAll('button').length, `${name}: no button`).toBe(0)

        // nothing else is written: after the given strings are removed only separators and spaces remain (the provider's style element is not text the page shows)
        const shown = container.cloneNode(true) as HTMLElement
        shown.querySelectorAll('style').forEach((style) => style.remove())
        let rest = shown.textContent ?? ''
        for (const text of [props.homeLabel, props.listingsLabel, props.currentLabel, props.title, props.description, props.actionLabel]) rest = rest.replace(text, '')
        expect(rest.replace(/[\s/]/g, ''), `${name}: no other text`).toBe('')
        cleanup()
      }
    }
  })
})
