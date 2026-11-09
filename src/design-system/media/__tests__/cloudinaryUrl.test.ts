// @vitest-environment node
/**
 * Task 951 AC5 (CodeQL js/incomplete-url-substring-sanitization): an address counts as Cloudinary's only when it is https on the host res.cloudinary.com. A text that
 * merely contains the host name (in a path, a sub-domain label, a query) gets no transform, no srcset, no blur address and no preload hint, so no visitor request is
 * steered to another host.
 */
import { describe, expect, it } from 'vitest'
import { buildBlurUrl, buildSrcset, insertTransform, isCloudinaryDeliveryUrl, STATIC_BLUR } from '../appImageConfig'
import { buildGalleryMainPreloadAttrs } from '@/lib/imageDelivery'

const REAL = 'https://res.cloudinary.com/demo/image/upload/v123/listings/a.jpg'
const LOOK_ALIKES = [
  ['a path on another host', 'https://evil.example/res.cloudinary.com/x/upload/y'],
  ['plain http', 'http://res.cloudinary.com/demo/image/upload/y.jpg'],
  ['a longer host name', 'https://res.cloudinary.com.evil.example/demo/image/upload/y.jpg'],
  ['a user-info trick', 'https://res.cloudinary.com@evil.example/demo/image/upload/y.jpg'],
  ['the name in a query', 'https://evil.example/demo/image/upload/y.jpg?u=res.cloudinary.com'],
  ['not a URL at all', 'res.cloudinary.com/demo/image/upload/y.jpg'],
  ['an empty string', ''],
] as const

describe('isCloudinaryDeliveryUrl', () => {
  it('accepts https on res.cloudinary.com', () => {
    expect(isCloudinaryDeliveryUrl(REAL)).toBe(true)
  })

  it.each(LOOK_ALIKES)('refuses %s', (_label, src) => {
    expect(isCloudinaryDeliveryUrl(src)).toBe(false)
  })
})

describe('a look-alike address gets nothing built from it', () => {
  it.each(LOOK_ALIKES)('%s: no transform, no srcset, static blur, no preload', (_label, src) => {
    expect(insertTransform(src, 'w_100,f_auto')).toBe(src)
    expect(buildSrcset(src, 'f_auto', [{ w: 320 }, { w: 640, h: 360 }])).toBe('')
    expect(buildBlurUrl(src)).toBe(STATIC_BLUR)
    expect(buildGalleryMainPreloadAttrs(src)).toBeNull()
  })
})

describe('a real Cloudinary delivery address is transformed', () => {
  it('gets the transform, the srcset, the blur address and the preload hint', () => {
    expect(insertTransform(REAL, 'w_100,f_auto')).toBe('https://res.cloudinary.com/demo/image/upload/w_100,f_auto/v123/listings/a.jpg')
    expect(buildSrcset(REAL, 'f_auto', [{ w: 320 }])).toBe('https://res.cloudinary.com/demo/image/upload/w_320,f_auto/v123/listings/a.jpg 320w')
    expect(buildBlurUrl(REAL)).toBe('https://res.cloudinary.com/demo/image/upload/w_20,h_20,c_fill,f_auto,q_1/v123/listings/a.jpg')
    const preload = buildGalleryMainPreloadAttrs(REAL)
    expect(preload).not.toBeNull()
    expect(preload!.href).toContain('https://res.cloudinary.com/demo/image/upload/w_960,h_540,')
    expect(preload!.imageSrcSet).toContain('w_1600,h_900')
  })
})
