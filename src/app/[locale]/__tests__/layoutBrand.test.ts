// @vitest-environment node
/**
 * Task 989 AC2: the logo, the favicon, the title and the description of the site follow the settings, and the logo and the favicon come only from the account's
 * Cloudinary. The site layout (`src/app/[locale]/(site)/layout.tsx`) hands `<Header />` a `logoUrl` and gives the metadata `icons` only when `isBrandImageUrl`
 * accepts the stored address; the admin layout gives the same favicon. `SEC-989-BRAND-URL-DENY`: an `http:` Cloudinary address, another cloud, a listing photo on the
 * media host, another site, a `javascript:` value and a failed read give no logo and no `icons` (the wordmark and `src/app/favicon.ico` stay). The element trees are
 * read, nothing is rendered.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement, ReactNode } from 'react'

const store = vi.hoisted(() => ({ values: {} as Record<string, string>, fail: false, asked: [] as string[][] }))

vi.mock('@/modules/admin/lib/settings', () => ({
  getSettings: async (keys: string[]) => {
    store.asked.push(keys)
    if (store.fail) throw new Error('db down')
    return Object.fromEntries(keys.filter((key) => key in store.values).map((key) => [key, store.values[key]]))
  },
  getAllSettings: async () => store.values,
}))
vi.mock('@/lib/auth/server', () => ({ resolveSession: async () => ({ user: null }) }))
vi.mock('@/modules/auth/context/AuthContext', () => ({ AuthProvider: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/layout/Header', () => ({ Header: function Header() { return null } }))
vi.mock('@/components/layout/Footer', () => ({ Footer: function Footer() { return null } }))
vi.mock('@/components/shared/WebVitalsReporter', () => ({ WebVitalsReporter: () => null }))
vi.mock('@/components/shared/PerformanceStoreInit', () => ({ PerformanceStoreInit: () => null }))
vi.mock('@/components/shared/PerfDevOverlay', () => ({ PerfDevOverlay: () => null }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: false, reason: 'unauthenticated' }) }))
vi.mock('@/lib/auth/permissions', () => ({ allowedAdminPageKeys: async () => [] }))
vi.mock('@/components/admin/AdminShell', () => ({ AdminShell: () => null }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') }, redirect: () => { throw new Error('NEXT_REDIRECT') } }))
vi.mock('next-intl/server', () => ({ setRequestLocale: () => {} }))

import SiteLayout, { generateMetadata as siteMetadata } from '../(site)/layout'
import { generateMetadata as adminMetadata } from '../admin/layout'
import { Header } from '@/components/layout/Header'
import { isBrandImageUrl, isTrustedImageUrl } from '@/lib/uploads/imageUrl'

const CLOUD = 'lero'
const LOGO = `https://res.cloudinary.com/${CLOUD}/image/upload/v1/Lero/logo.svg`
const FAVICON = `https://res.cloudinary.com/${CLOUD}/image/upload/v1/Lero/favicon.png`
const TODAY_TITLE = 'Lero.al — Real estate marketplace in Albania'
const TODAY_DESCRIPTION = 'Gjeni shtëpinë tuaj të ëndrrave në Shqipëri'

/** SEC-989-BRAND-URL-DENY: none of these is an image of the account's Cloudinary */
const REFUSED = [
  `http://res.cloudinary.com/${CLOUD}/image/upload/v1/Lero/logo.svg`,
  'https://res.cloudinary.com/another-cloud/image/upload/v1/logo.svg',
  'https://media.lero.al/0b6f5c8e-1c2d-4e3f-8a9b-0c1d2e3f4a5b/listings/1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d/full.webp',
  'https://evil.com/x.png',
  'javascript:alert(1)',
  `https://user:pass@res.cloudinary.com/${CLOUD}/image/upload/logo.svg`,
  '',
]

const params = (locale: string) => ({ params: Promise.resolve({ locale }) })

function findElement(node: unknown, type: unknown): ReactElement<Record<string, unknown>> | null {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, type)
      if (found) return found
    }
    return null
  }
  const element = node as ReactElement<{ children?: unknown }>
  if (element.type === type) return element as ReactElement<Record<string, unknown>>
  return findElement(element.props?.children, type)
}

async function headerProps(locale = 'en') {
  const tree = await SiteLayout({ children: null, ...params(locale) } as unknown as Parameters<typeof SiteLayout>[0])
  const header = findElement(tree, Header)
  expect(header, 'the layout renders <Header />').not.toBeNull()
  return header!.props
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', CLOUD)
  store.values = {}
  store.fail = false
  store.asked = []
})
afterEach(() => vi.unstubAllEnvs())

describe('isBrandImageUrl — the account\'s Cloudinary only', () => {
  it('accepts an https address of the project\'s cloud', () => {
    expect(isBrandImageUrl(LOGO)).toBe(true)
    expect(isBrandImageUrl(FAVICON)).toBe(true)
  })

  it.each(REFUSED)('[SEC-989-BRAND-URL-DENY] refuses %s', (url) => {
    expect(isBrandImageUrl(url)).toBe(false)
  })

  it('isTrustedImageUrl keeps its answers: it still accepts a listing photo on the media host, and the Cloudinary answers are the brand ones', () => {
    expect(isTrustedImageUrl(REFUSED[2])).toBe(true)
    for (const url of [LOGO, ...REFUSED.filter((_, i) => i !== 2)]) expect(isTrustedImageUrl(url)).toBe(isBrandImageUrl(url))
  })
})

describe('Task 989 AC2 — the site layout', () => {
  it('a saved logo of the account\'s Cloudinary reaches <Header /> with the site name', async () => {
    store.values = { logo_url: LOGO, site_name: 'Lero.al' }
    expect(await headerProps()).toMatchObject({ logoUrl: LOGO, siteName: 'Lero.al' })
  })

  it.each(REFUSED)('[SEC-989-BRAND-URL-DENY] a stored logo %s does not reach the header', async (url) => {
    store.values = { logo_url: url }
    expect((await headerProps()).logoUrl ?? null).toBeNull()
  })

  it('[SEC-989-BRAND-URL-DENY] a failed read gives the wordmark, and the page still renders', async () => {
    store.fail = true
    expect((await headerProps()).logoUrl ?? null).toBeNull()
  })

  it('a saved favicon of the account\'s Cloudinary becomes the icon of the site and of the admin', async () => {
    store.values = { favicon_url: FAVICON }
    expect((await siteMetadata(params('en'))).icons).toEqual({ icon: FAVICON })
    expect((await adminMetadata()).icons).toEqual({ icon: FAVICON })
  })

  it.each(REFUSED)('[SEC-989-BRAND-URL-DENY] a stored favicon %s gives no icons (src/app/favicon.ico stays)', async (url) => {
    store.values = { favicon_url: url }
    expect((await siteMetadata(params('en'))).icons).toBeUndefined()
    expect((await adminMetadata()).icons).toBeUndefined()
  })

  it('[SEC-989-BRAND-URL-DENY] a failed read gives no icons and today\'s title', async () => {
    store.fail = true
    const metadata = await siteMetadata(params('en'))
    expect(metadata.icons).toBeUndefined()
    expect(metadata).toMatchObject({ title: TODAY_TITLE, description: TODAY_DESCRIPTION })
    const admin = await adminMetadata()
    expect(admin.icons).toBeUndefined()
    expect(admin.title).toBe('Admin — Lero.al')
  })

  it.each(['sq', 'en', 'uk', 'it'])('the title and description of %s are the saved ones of that language', async (locale) => {
    store.values = { [`meta_title_${locale}`]: `Title ${locale}`, [`meta_desc_${locale}`]: `Description ${locale}`, meta_title_sq: locale === 'sq' ? 'Title sq' : 'Other', meta_desc_sq: locale === 'sq' ? 'Description sq' : 'Other' }
    expect(await siteMetadata(params(locale))).toMatchObject({ title: `Title ${locale}`, description: `Description ${locale}` })
  })

  it.each(['sq', 'en', 'uk', 'it'])('an empty title and description of %s give today\'s text', async (locale) => {
    store.values = { [`meta_title_${locale}`]: '', [`meta_desc_${locale}`]: '  ' }
    expect(await siteMetadata(params(locale))).toMatchObject({ title: TODAY_TITLE, description: TODAY_DESCRIPTION })
  })

  it('an unknown language reads no per-language key of another name', async () => {
    await siteMetadata(params('xx'))
    expect(store.asked.flat().filter((key) => /^meta_(title|desc)_/.test(key)).every((key) => /_(sq|en|uk|it)$/.test(key))).toBe(true)
  })
})
