/**
 * FooterView (Task 923 Revision 7: it had no unit test; finding S9: a stored link went into `href` unchecked).
 * Covers: the brand, titles and copyright; internal links get the locale prefix; external links open in a new tab with `noopener noreferrer`; a link whose URL is a
 * script (`javascript:`, also with a tab or line break inside the scheme, `data:`) is NOT a link; the social links have the same rules.
 */
import React from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { FooterView } from '../FooterView'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import type { FooterLink } from '@/types/database'

beforeAll(() => setViewport(1024))

const link = (id: string, label: string, url: string): FooterLink => ({ id, label, url, enabled: true } as FooterLink)

function footer(over: Partial<React.ComponentProps<typeof FooterView>> = {}) {
  return render(
    <MantineProvider theme={theme} env="test">
      <FooterView
        brand="Lero"
        tld=".al"
        tagline="Real estate in Albania"
        navTitle="Navigation"
        infoTitle="Information"
        socialTitle="Follow us"
        navLinks={[link('n1', 'Listings', '/listings'), link('n2', 'Partner', 'https://partner.example/a')]}
        infoLinks={[link('i1', 'About', 'about'), link('i2', 'Home', '')]}
        socialLinks={[link('s1', 'Instagram', 'https://instagram.com/lero.al')]}
        copyright="© 2026 Lero.al"
        locale="en"
        {...over}
      />
    </MantineProvider>,
  )
}
const anchor = (name: string) => screen.queryByRole('link', { name }) as HTMLAnchorElement | null

describe('FooterView content', () => {
  it('shows the brand, tagline, section titles and copyright', () => {
    footer()
    expect(screen.getByText('Lero')).toBeInTheDocument()
    expect(screen.getByText('.al')).toBeInTheDocument()
    expect(screen.getByText('Real estate in Albania')).toBeInTheDocument()
    expect(screen.getByText('© 2026 Lero.al')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navigation' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Information' })).toBeInTheDocument()
  })

  it('the brand links to the home page of the locale', () => {
    footer({ locale: 'uk' })
    expect(screen.getAllByRole('link').find((a) => a.getAttribute('href') === '/uk')).toBeDefined()
  })
})

describe('FooterView links', () => {
  it('an internal link gets the locale prefix, with or without a leading slash, and an empty one goes home', () => {
    footer()
    expect(anchor('Listings')).toHaveAttribute('href', '/en/listings')
    expect(anchor('About')).toHaveAttribute('href', '/en/about')
    expect(anchor('Home')).toHaveAttribute('href', '/en')
  })

  it('an internal link opens in the same tab', () => {
    footer()
    expect(anchor('Listings')).not.toHaveAttribute('target')
  })

  it('an external link opens in a new tab and cannot reach back to the opener', () => {
    footer()
    const a = anchor('Partner')!
    expect(a).toHaveAttribute('href', 'https://partner.example/a')
    expect(a).toHaveAttribute('target', '_blank')
    expect(a.getAttribute('rel')).toContain('noopener')
    expect(a.getAttribute('rel')).toContain('noreferrer')
  })

  it('a social link opens in a new tab with noopener noreferrer', () => {
    footer()
    const a = anchor('Instagram')!
    expect(a).toHaveAttribute('href', 'https://instagram.com/lero.al')
    expect(a).toHaveAttribute('target', '_blank')
    expect(a.getAttribute('rel')).toMatch(/noopener/)
  })
})

const SCRIPT_URLS = ['javascript:alert(document.cookie)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'java\nscript:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)']

describe('FooterView refuses a script URL', () => {
  it.each(SCRIPT_URLS)('a navigation link with the url %j is not a link', (url) => {
    footer({ navLinks: [link('n1', 'Evil', url)] })
    expect(anchor('Evil')).toBeNull()
    expect(document.querySelector('a[href^="javascript" i], a[href^="data" i], a[href^="vbscript" i]')).toBeNull()
    expect(screen.getByText('Evil')).toBeInTheDocument()
  })

  it.each(SCRIPT_URLS)('a social link with the url %j is not a link', (url) => {
    footer({ socialLinks: [link('s1', 'Evil social', url)] })
    expect(anchor('Evil social')).toBeNull()
    expect(screen.getByText('Evil social')).toBeInTheDocument()
  })

  it('no anchor on the page has a href that is not a path of the site or an http(s) address, whatever the data', () => {
    footer({
      navLinks: SCRIPT_URLS.map((u, i) => link(`n${i}`, `N${i}`, u)),
      infoLinks: SCRIPT_URLS.map((u, i) => link(`i${i}`, `I${i}`, u)),
      socialLinks: SCRIPT_URLS.map((u, i) => link(`s${i}`, `S${i}`, u)),
    })
    for (const a of Array.from(document.querySelectorAll('a'))) {
      const href = a.getAttribute('href') ?? ''
      expect(/^(\/|https?:\/\/)/.test(href), href).toBe(true)
    }
  })
})

// Task 923 R38 (cases SEC-S09-SRV-DENY, SEC-S09-FE-ALLOW, SEC-S09-FE-DENY, SEC-S09-FE-ERR)
vi.mock('@/lib/auth/server', () => ({ getUser: async () => null }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { throw new Error('the save must be refused before any database client') } }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))

it('[SEC-S09-SRV-DENY] A stored link with an unsafe scheme is refused on save', async () => {
  const { upsertFooterContent } = await import('@/modules/admin/actions/footer')
  const empty = { brand_title: 'B', tagline: 'T', nav_section_title: 'N', nav_links: [], info_section_title: 'I', info_links: [], social_section_title: 'S', social_links: [], copyright_template: 'C' }
  for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)']) {
    expect(await upsertFooterContent('en', { ...empty, social_links: [link('s1', 'Evil', url)] } as never), url).toEqual({ error: 'invalid_url' })
  }
})

it('[SEC-S09-FE-ALLOW] FooterView renders a safe stored link as a link', () => {
  footer()
  expect(anchor('Instagram')?.getAttribute('href')).toBe('https://instagram.com/lero.al')
  expect(anchor('Listings')?.getAttribute('href')).toBe('/en/listings')
})

it('[SEC-S09-FE-DENY] FooterView never renders a stored link with an unsafe scheme as a link', () => {
  footer({ navLinks: [link('n1', 'Evil', 'javascript:alert(document.cookie)')], socialLinks: [link('s1', 'Evil social', 'data:text/html,<script>alert(1)</script>')] })
  expect(anchor('Evil')).toBeNull()
  expect(anchor('Evil social')).toBeNull()
  expect(screen.getByText('Evil')).toBeInTheDocument()                    // the label stays, as text
  expect(document.querySelector('a[href^="javascript" i], a[href^="data" i]')).toBeNull()
})

it('[SEC-S09-FE-ERR] FooterView treats a malformed stored link as unsafe', () => {
  footer({ navLinks: [link('n1', 'Broken one', 'java\tscript:alert(1)'), link('n2', 'Broken two', 'http://[not-a-host'), link('n3', 'Broken three', undefined as never)] })
  for (const name of ['Broken one', 'Broken two']) expect(anchor(name), name).toBeNull()
  for (const a of Array.from(document.querySelectorAll('a'))) expect(/^(\/|https?:\/\/)/.test(a.getAttribute('href') ?? ''), a.outerHTML).toBe(true)
})
