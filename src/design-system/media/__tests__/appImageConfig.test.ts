// @vitest-environment node
/**
 * Image address builders and variants (Task 923 Revision 7). They are the only code that writes a Cloudinary transformation into an address, so an address that is
 * not Cloudinary's must come back untouched (never half-rewritten), and the blur placeholder of anything else must be a fixed harmless picture.
 */
import { describe, expect, it } from 'vitest'
import { STATIC_BLUR, VARIANTS, buildBlurUrl, buildSrcset, insertTransform } from '../appImageConfig'
import { GALLERY_MAIN_SIZES, buildGalleryMainPreloadAttrs } from '@/lib/imageDelivery'

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

// Task 1038 (AC7): a listing photo on the platform's own media host has two objects, `full` (1920 px) and `thumb` (640 px). Cards and tiles use `thumb`; the gallery and the lightbox
// get a `srcset` of `thumb 640w, full 1920w`; Cloudinary addresses are built exactly as before.
describe('an R2 listing photo', () => {
  const OWNER = '22222222-2222-4222-8222-222222222222'
  const FOLDER = '44444444-4444-4444-8444-444444444444'
  const FULL = `https://media.lero.al/${OWNER}/listings/${FOLDER}/full.webp`
  const THUMB = `https://media.lero.al/${OWNER}/listings/${FOLDER}/thumb.webp`
  const FULL_JPG = `https://media.lero.al/${OWNER}/listings/${FOLDER}/full.jpg`
  const THUMB_JPG = `https://media.lero.al/${OWNER}/listings/${FOLDER}/thumb.jpg`

  it.each(['listing', 'listing-thumb', 'gallery-strip', 'upload'] as const)('[AC7] the %s variant renders the thumb object, and has no srcset (the thumb is the one picture)', (name) => {
    const v = VARIANTS[name]
    expect(insertTransform(FULL, v.cloudinaryTransform)).toBe(THUMB)
    expect(insertTransform(FULL_JPG, v.cloudinaryTransform)).toBe(THUMB_JPG)
    expect(buildSrcset(FULL, v.srcsetBase, v.srcsetEntries)).toBe('')
  })

  it.each(['gallery-main', 'lightbox'] as const)('[AC7] the %s variant gets a srcset of the thumb at 640w and the full object at 1920w, and the full object as its fallback address', (name) => {
    const v = VARIANTS[name]
    expect(buildSrcset(FULL, v.srcsetBase, v.srcsetEntries)).toBe(`${THUMB} 640w, ${FULL} 1920w`)
    expect(buildSrcset(FULL_JPG, v.srcsetBase, v.srcsetEntries)).toBe(`${THUMB_JPG} 640w, ${FULL_JPG} 1920w`)
    expect(insertTransform(FULL, v.cloudinaryTransform)).toBe(FULL)
  })

  it('[AC7] the address is never given a Cloudinary transformation, whatever the variant', () => {
    for (const [name, v] of Object.entries(VARIANTS)) {
      expect(insertTransform(FULL, v.cloudinaryTransform), name).not.toMatch(/w_\d|c_fill|f_auto|\/upload\//)
      expect(buildSrcset(FULL, v.srcsetBase, v.srcsetEntries), name).not.toMatch(/w_\d|c_fill|f_auto|\/upload\//)
    }
  })

  it('[AC7] the blur placeholder is the static picture, with no request', () => {
    expect(buildBlurUrl(FULL)).toBe(STATIC_BLUR)
  })

  it.each([
    ['a thumb address', THUMB],
    ['another host', `https://evil.example/${OWNER}/listings/${FOLDER}/full.webp`],
    ['a query', `${FULL}?v=1`],
    ['a folder that is not a UUID', `https://media.lero.al/${OWNER}/listings/x/full.webp`],
    ['another extension', `https://media.lero.al/${OWNER}/listings/${FOLDER}/full.png`],
  ])('[AC7] %s is not an R2 listing photo: it is returned as it is and has no srcset', (_label, src) => {
    expect(insertTransform(src, VARIANTS.listing.cloudinaryTransform)).toBe(src)
    expect(buildSrcset(src, VARIANTS['gallery-main'].srcsetBase, VARIANTS['gallery-main'].srcsetEntries)).toBe('')
  })

  it('[AC7] a Cloudinary address is built exactly as before for every variant', () => {
    for (const v of Object.values(VARIANTS)) {
      expect(insertTransform(CLOUD, v.cloudinaryTransform)).toBe(`https://res.cloudinary.com/demo/image/upload/${v.cloudinaryTransform}/v123/listings/a.jpg`)
      expect(buildSrcset(CLOUD, v.srcsetBase, v.srcsetEntries)).toBe(
        v.srcsetEntries.map(({ w, h }) => `https://res.cloudinary.com/demo/image/upload/${h !== undefined ? `w_${w},h_${h}` : `w_${w}`},${v.srcsetBase}/v123/listings/a.jpg ${w}w`).join(', '),
      )
    }
  })

  it('[AC7] the preload of the gallery main image: a srcset of thumb 640w and full 1920w, the full object as href', () => {
    expect(buildGalleryMainPreloadAttrs(FULL)).toEqual({ href: FULL, imageSrcSet: `${THUMB} 640w, ${FULL} 1920w`, imageSizes: GALLERY_MAIN_SIZES })
  })

  it('[AC7] the preload of a Cloudinary photo is as before, and of any other address is null', () => {
    expect(buildGalleryMainPreloadAttrs(CLOUD)?.href).toBe('https://res.cloudinary.com/demo/image/upload/w_960,h_540,c_fill,g_auto,f_auto,q_auto/v123/listings/a.jpg')
    expect(buildGalleryMainPreloadAttrs('https://example.com/a.jpg')).toBeNull()
    expect(buildGalleryMainPreloadAttrs(`${FULL}?v=1`)).toBeNull()
    expect(buildGalleryMainPreloadAttrs(null)).toBeNull()
  })
})
