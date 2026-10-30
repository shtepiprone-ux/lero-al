// @vitest-environment node
/**
 * Small pure libraries (Task 923 Revision 7): CMS slugs, text helpers, price conversion, image preload attributes, Cloudinary ids, HTML escaping.
 * Each is used on a trust boundary or in money maths, so edge cases are asserted, not just the happy path.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RESERVED_SLUGS, isReservedSlug } from '../reserved-slugs'
import { validateSlug } from '../slug-validator'
import { cn, capitalize, normalizeSearch } from '../utils'
import { LISTING_STATUS_CODES, getListingStatusLabel } from '../i18n/listingStatusLabel'
import { convertPrice } from '../getExchangeRate'
import { GALLERY_MAIN_SIZES, LISTING_LAYOUT_SIZES, MAX_PRIORITY_IMAGES, buildGalleryMainPreloadAttrs, getImagePriority } from '../imageDelivery'
import { publicIdFromUrl } from '../cloudinaryUpload'
import { escapeHtml, escapeHtmlWithBreaks } from '../security/escapeHtml'
import { safeNextPath } from '../auth/safeRedirect'

describe('reserved slugs', () => {
  it('every static route under [locale] is reserved, so a CMS page can never be hidden behind it', () => {
    const dir = join(process.cwd(), 'src', 'app', '[locale]')
    const routes = readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory() && !n.startsWith('[') && !n.startsWith('_') && !n.startsWith('('))
    expect(routes.length).toBeGreaterThan(3)
    expect(routes.filter((r) => !isReservedSlug(r)), 'a static route that is not in RESERVED_SLUGS').toEqual([])
  })

  it('the four locale codes are reserved', () => {
    for (const l of ['sq', 'en', 'uk', 'it']) expect(RESERVED_SLUGS).toContain(l)
  })

  it.each([['auth'], ['AUTH'], ['Cabinet'], ['listings/anything'], ['sq'], ['ci']])('%s is reserved', (s) => expect(isReservedSlug(s)).toBe(true))
  it.each([['terms'], ['authentic'], ['cabinets'], ['about-us']])('%s is not', (s) => expect(isReservedSlug(s)).toBe(false))
})

describe('validateSlug', () => {
  it.each([['terms'], ['about-us'], ['page-2'], ['  trimmed  ']])('accepts %j', (s) => expect(validateSlug(s)).toEqual({ ok: true }))

  it.each([[''], ['   '], ['a/b'], ['Upper'], ['with space'], ['under_score'], ['dot.dot'], ['ë'], ['../x'], ['a%2fb'], ['<b>'], ['a\nb']])('refuses the format %j', (s) => {
    expect(validateSlug(s)).toEqual({ ok: false, reason: 'slug_invalid_format' })
  })

  it.each([['auth'], ['cabinet'], ['listings'], ['sq'], ['ci']])('refuses the reserved %s', (s) => expect(validateSlug(s)).toEqual({ ok: false, reason: 'slug_reserved' }))
})

describe('text helpers', () => {
  it('cn merges classes and lets the later Tailwind class win', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('a', false && 'b', undefined, ['c'])).toBe('a c')
  })

  it.each([['Shtëpi', 'shtepi'], ['Çmimi', 'cmimi'], ['ÉCOLE', 'ecole'], ['Київ', 'киів'], ['', '']])('normalizeSearch(%j) = %j', (input, expected) => {
    expect(normalizeSearch(input)).toBe(expected)
  })

  it.each([['tirana', 'Tirana'], ['Tirana', 'Tirana'], ['', ''], ['ëndërr', 'Ëndërr'], ['1abc', '1abc']])('capitalize(%j) = %j', (input, expected) => {
    expect(capitalize(input)).toBe(expected)
  })
})

describe('getListingStatusLabel', () => {
  const t = (key: string) => `T(${key})`
  it.each(LISTING_STATUS_CODES)('%s is translated', (code) => expect(getListingStatusLabel(code, t)).toBe(`T(status_${code})`))
  it.each([['draft'], [''], ['ACTIVE'], ['status_active'], ['<script>']])('%j is shown as it is and never reaches the translator', (code) => {
    let asked = false
    expect(getListingStatusLabel(code, () => { asked = true; return 'x' })).toBe(code)
    expect(asked).toBe(false)
  })
})

describe('convertPrice (money)', () => {
  const rates = { EUR: 100, USD: 90 }

  it('the same currency, or no rates, returns the price untouched', () => {
    expect(convertPrice(123, 'EUR', 'EUR', rates)).toBe(123)
    expect(convertPrice(123, 'EUR', 'USD', null)).toBe(123)
  })

  it('converts through ALL and rounds to a whole number', () => {
    expect(convertPrice(10, 'EUR', 'ALL', rates)).toBe(1000)
    expect(convertPrice(1000, 'ALL', 'EUR', rates)).toBe(10)
    expect(convertPrice(100, 'EUR', 'USD', rates)).toBe(Math.round(Math.round(100 * 100) / 90))
    expect(convertPrice(1, 'USD', 'ALL', { USD: 90.4 })).toBe(90)
  })

  it('a currency without a rate never gives a made-up number', () => {
    expect(convertPrice(50, 'GBP', 'EUR', rates)).toBe(50)
    expect(convertPrice(50, 'EUR', 'GBP', rates)).toBe(5000)
    expect(convertPrice(50, 'GBP', 'ALL', rates)).toBe(50)
  })

  it('a zero rate is treated as missing, not as a division by zero', () => {
    expect(convertPrice(50, 'EUR', 'USD', { EUR: 100, USD: 0 })).toBe(5000)
    expect(convertPrice(50, 'EUR', 'ALL', { EUR: 0 })).toBe(50)
    expect(Number.isFinite(convertPrice(50, 'EUR', 'USD', { EUR: 100, USD: 0 }))).toBe(true)
  })

  it('0 stays 0', () => {
    expect(convertPrice(0, 'EUR', 'USD', rates)).toBe(0)
  })
})

describe('image delivery', () => {
  const src = 'https://res.cloudinary.com/demo/image/upload/v1/listings/a.jpg'

  it('builds the preload attributes of a Cloudinary image: the transform sits right after /upload/ in the main address and in every srcset entry', () => {
    const attrs = buildGalleryMainPreloadAttrs(src)!
    expect(attrs.href).toBe('https://res.cloudinary.com/demo/image/upload/w_960,h_540,c_fill,g_auto,f_auto,q_auto/v1/listings/a.jpg')
    expect(attrs.imageSrcSet.split(', ')).toEqual([640, 960, 1200, 1600].map((w) => `https://res.cloudinary.com/demo/image/upload/w_${w},h_${Math.round((w * 9) / 16)},c_fill,g_auto,f_auto,q_auto/v1/listings/a.jpg ${w}w`))
    expect(attrs.imageSizes).toBe(GALLERY_MAIN_SIZES)
  })

  it.each([[null], [undefined], [''], ['https://example.com/a.jpg'], ['/local.jpg']])('%j gives no preload', (s) => expect(buildGalleryMainPreloadAttrs(s)).toBeNull())

  it('an address on Cloudinary without /upload/ is returned without a transform', () => {
    const attrs = buildGalleryMainPreloadAttrs('https://res.cloudinary.com/demo/raw/a.pdf')!
    expect(attrs.href).toBe('https://res.cloudinary.com/demo/raw/a.pdf')
  })

  it('the priority budget is 2 featured, 1 latest, none in grids, and at most 3 in all', () => {
    expect([0, 1, 2].map((i) => getImagePriority(i, 'featured'))).toEqual([true, true, false])
    expect([0, 1].map((i) => getImagePriority(i, 'latest'))).toEqual([true, false])
    expect([0, 5].map((i) => getImagePriority(i, 'grid'))).toEqual([false, false])
    expect(MAX_PRIORITY_IMAGES).toBe(3)
  })

  it('every layout context has a sizes hint', () => {
    expect(Object.keys(LISTING_LAYOUT_SIZES).sort()).toEqual(['card-track-grid', 'card-track-rail', 'default'])
    for (const v of Object.values(LISTING_LAYOUT_SIZES)) expect(v.length).toBeGreaterThan(5)
  })
})

describe('publicIdFromUrl', () => {
  const base = 'https://res.cloudinary.com/demo/image/upload'

  it.each([
    [`${base}/v1700000000/listings/abc.jpg`, 'listings/abc'],
    [`${base}/listings/abc.webp`, 'listings/abc'],
    [`${base}/v12/user-1/listings/l-2/photo.png`, 'user-1/listings/l-2/photo'],
    [`${base}/c_fill,w_100/v3/avatars/me.jpg`, 'avatars/me'],
    [`${base}/avatars/no-extension`, 'avatars/no-extension'],
    [`${base}/v1/listings/my.photo.jpg`, 'listings/my.photo'],
    [`${base}/v1/listings/sp%20ace.jpg`, 'listings/sp ace'],
  ])('%s gives %s', (url, id) => expect(publicIdFromUrl(url)).toBe(id))

  it.each([
    [null], [undefined], [''], ['not a url'], ['https://evil.example/image/upload/listings/x.jpg'], ['http://res.cloudinary.com/demo/image/upload/a.jpg'],
    ['https://res.cloudinary.com.evil.example/demo/image/upload/a.jpg'], ['https://res.cloudinary.com@evil.example/demo/image/upload/a.jpg'], ['https://res.cloudinary.com/demo/image/fetch/a.jpg'],
    ['https://res.cloudinary.com/demo/image/upload/'], ['https://res.cloudinary.com/demo/image/upload/%E0%A4%A.jpg'], ['javascript:alert(1)//res.cloudinary.com/upload/x'],
  ])('%j is not a Cloudinary asset of ours: null', (url) => expect(publicIdFromUrl(url as never)).toBeNull())
})

describe('escapeHtml', () => {
  it.each([['<script>', '&lt;script&gt;'], ['a & b', 'a &amp; b'], ['"q"', '&quot;q&quot;'], ["it's", 'it&#39;s'], ['&lt;', '&amp;lt;'], ['', ''], ['plain text', 'plain text']])('%j becomes %j', (input, out) => {
    expect(escapeHtml(input)).toBe(out)
  })

  it.each([[null], [undefined]])('%j is an empty string', (v) => expect(escapeHtml(v)).toBe(''))
  it('other values are written as text', () => {
    expect(escapeHtml(0)).toBe('0')
    expect(escapeHtml(false)).toBe('false')
    expect(escapeHtml({ toString: () => '<b>' })).toBe('&lt;b&gt;')
  })

  it('line breaks become <br /> only after escaping', () => {
    expect(escapeHtmlWithBreaks('a\nb\r\nc<d')).toBe('a<br />b<br />c&lt;d')
    expect(escapeHtmlWithBreaks(null)).toBe('')
  })
})

describe('safeNextPath with an unusable site origin', () => {
  it('falls back instead of throwing', () => {
    expect(safeNextPath('/cabinet', 'not an origin', '/home')).toBe('/home')
  })
})
