// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S21): which image addresses a browser may send to the listing actions.
 */
import { describe, expect, it } from 'vitest'
import { allImagesTrusted, isTrustedImageUrl } from '../imageUrl'

const CLOUD = 'lero-cloud'

describe('isTrustedImageUrl', () => {
  it.each([
    ['https://res.cloudinary.com/lero-cloud/image/upload/v1/listings/a.jpg'],
    ['https://res.cloudinary.com/lero-cloud/image/upload/c_fill,w_400/v1/x.webp'],
  ])('accepts %s', (url) => {
    expect(isTrustedImageUrl(url, CLOUD)).toBe(true)
  })

  it.each([
    ['another site (tracking pixel)', 'https://evil.example/pixel.gif'],
    ['another cloud on the same host', 'https://res.cloudinary.com/someone-else/image/upload/v1/x.jpg'],
    ['a host that only starts like it', 'https://res.cloudinary.com.evil.example/lero-cloud/x.jpg'],
    ['user-info trick', 'https://res.cloudinary.com@evil.example/lero-cloud/x.jpg'],
    ['plain http', 'http://res.cloudinary.com/lero-cloud/x.jpg'],
    ['a port', 'https://res.cloudinary.com:8443/lero-cloud/x.jpg'],
    ['credentials', 'https://user:pw@res.cloudinary.com/lero-cloud/x.jpg'],
    ['a data url', 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+'],
    ['a javascript url', 'javascript:alert(1)'],
    ['a protocol-relative url', '//res.cloudinary.com/lero-cloud/x.jpg'],
    ['a relative path', '/lero-cloud/x.jpg'],
    ['an empty string', ''],
    ['a path-confusing prefix of the cloud name', 'https://res.cloudinary.com/lero-cloud-evil/x.jpg'],
  ])('refuses %s', (_label, url) => {
    expect(isTrustedImageUrl(url, CLOUD)).toBe(false)
  })

  it.each([[null], [undefined], [5], [{}], [[]]])('refuses the non-string %j', (value) => {
    expect(isTrustedImageUrl(value, CLOUD)).toBe(false)
  })

  it('refuses a very long address', () => {
    expect(isTrustedImageUrl(`https://res.cloudinary.com/${CLOUD}/${'a'.repeat(3000)}.jpg`, CLOUD)).toBe(false)
  })

  it('without a configured cloud name it still requires the delivery host and https', () => {
    expect(isTrustedImageUrl('https://res.cloudinary.com/any/x.jpg', undefined)).toBe(true)
    expect(isTrustedImageUrl('https://evil.example/x.jpg', undefined)).toBe(false)
  })
})

describe('allImagesTrusted', () => {
  const good = { url: 'https://res.cloudinary.com/lero-cloud/a.jpg' }
  const bad = { url: 'https://evil.example/a.jpg' }

  it('an empty or missing list is fine', () => {
    expect(allImagesTrusted([])).toBe(true)
    expect(allImagesTrusted(undefined)).toBe(true)
  })

  it('one bad image makes the whole list untrusted', () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = CLOUD
    expect(allImagesTrusted([good, good])).toBe(true)
    expect(allImagesTrusted([good, bad])).toBe(false)
    expect(allImagesTrusted([{}])).toBe(false)
  })
})

// Task 923 R38 (case SEC-S21-SRV-DENY)
it('[SEC-S21-SRV-DENY] Only an image on the project Cloudinary account is accepted', () => {
  expect(isTrustedImageUrl('https://evil.example/pixel.gif', CLOUD)).toBe(false)                              // another host
  expect(isTrustedImageUrl('http://res.cloudinary.com/lero-cloud/x.jpg', CLOUD)).toBe(false)                  // plain http
  expect(isTrustedImageUrl('https://res.cloudinary.com/someone-else/image/upload/v1/x.jpg', CLOUD)).toBe(false) // another account on the same host
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = CLOUD
  expect(allImagesTrusted([{ url: 'https://evil.example/pixel.gif' }])).toBe(false)
  expect(isTrustedImageUrl('https://res.cloudinary.com/lero-cloud/image/upload/v1/listings/a.jpg', CLOUD)).toBe(true)   // the control
})
