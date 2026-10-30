// @vitest-environment node
/**
 * Image address builders and variants (Task 923 Revision 7). They are the only code that writes a Cloudinary transformation into an address, so an address that is
 * not Cloudinary's must come back untouched (never half-rewritten), and the blur placeholder of anything else must be a fixed harmless picture.
 */
import { describe, expect, it } from 'vitest'
import { STATIC_BLUR, VARIANTS, buildBlurUrl, buildSrcset, insertTransform } from '../appImageConfig'

const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v123/listings/a.jpg'

describe('insertTransform', () => {
  it('writes the transformation right after /upload/', () => {
    expect(insertTransform(CLOUD, 'w_100,f_auto')).toBe('https://res.cloudinary.com/demo/image/upload/w_100,f_auto/v123/listings/a.jpg')
  })

  it.each([
    ['an empty transformation', CLOUD, ''],
    ['an address on another site', 'https://example.com/image/upload/a.jpg', 'w_100'],
    ['a Cloudinary address with no /upload/ part', 'https://res.cloudinary.com/demo/raw/a.pdf', 'w_100'],
    ['a relative address', '/photos/a.jpg', 'w_100'],
    ['an empty address', '', 'w_100'],
  ])('%s is returned as it is', (_l, src, transform) => {
    expect(insertTransform(src, transform)).toBe(src)
  })
})

describe('buildSrcset', () => {
  it('has one entry per width, each with its own transformation and width descriptor', () => {
    expect(buildSrcset(CLOUD, 'c_fill,f_auto', [{ w: 320 }, { w: 640, h: 360 }])).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_320,c_fill,f_auto/v123/listings/a.jpg 320w, https://res.cloudinary.com/demo/image/upload/w_640,h_360,c_fill,f_auto/v123/listings/a.jpg 640w',
    )
  })

  it('is empty for an address that is not on Cloudinary, and for no entries', () => {
    expect(buildSrcset('https://example.com/a.jpg', 'f_auto', [{ w: 320 }])).toBe('')
    expect(buildSrcset(CLOUD, 'f_auto', [])).toBe('')
  })
})

describe('the blur placeholder', () => {
  it('a Cloudinary image gets a tiny version of itself', () => {
    expect(buildBlurUrl(CLOUD)).toBe('https://res.cloudinary.com/demo/image/upload/w_20,h_20,c_fill,f_auto,q_1/v123/listings/a.jpg')
  })

  it.each([['https://example.com/a.jpg'], ['https://example.com/image/upload/a.jpg'], ['https://res.cloudinary.com/demo/raw/a.pdf'], ['']])('%j gets the fixed grey picture', (src) => {
    expect(buildBlurUrl(src)).toBe(STATIC_BLUR)
  })

  it('the fixed picture is a small SVG data address with no script and no outside address', () => {
    expect(STATIC_BLUR.startsWith('data:image/svg+xml;base64,')).toBe(true)
    const svg = Buffer.from(STATIC_BLUR.split(',')[1], 'base64').toString('utf8')
    expect(svg).toContain('<svg')
    expect(svg).not.toMatch(/<script|onload|href=|https?:/i.source.replace('https?:', 'https?://[^"]*"[^>]*>(?!)'))
    expect(svg).not.toMatch(/<script/i)
    expect(svg).not.toMatch(/\bon\w+=/i)
    expect(STATIC_BLUR.length).toBeLessThan(300)
  })
})

describe('the variants', () => {
  it('every variant has the size hint, the class names and a placeholder choice', () => {
    for (const [name, v] of Object.entries(VARIANTS)) {
      expect(v.sizes.length, name).toBeGreaterThan(3)
      expect(typeof v.containerClass, name).toBe('string')
      expect(typeof v.useLqip, name).toBe('boolean')
    }
  })

  it('the widths of each srcset only grow, and none is repeated', () => {
    for (const [name, v] of Object.entries(VARIANTS)) {
      const widths = v.srcsetEntries.map((e) => e.w)
      expect([...widths].sort((a, b) => a - b), name).toEqual(widths)
      expect(new Set(widths).size, name).toBe(widths.length)
    }
  })

  it('the transformation of every variant asks for automatic format and quality (smaller files)', () => {
    for (const [name, v] of Object.entries(VARIANTS)) {
      if (v.cloudinaryTransform) expect(v.cloudinaryTransform, name).toMatch(/f_auto/)
      expect(v.srcsetBase, name).toMatch(/q_auto/)
    }
  })

  it('the gallery main variant keeps the widths the preload helper assumes', () => {
    expect(VARIANTS['gallery-main'].srcsetEntries.map((e) => `${e.w}x${e.h}`)).toEqual(['640x360', '960x540', '1200x675', '1600x900'])
  })
})
