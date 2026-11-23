// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S21): which image addresses a browser may send to the listing actions.
 */
import { describe, expect, it } from 'vitest'
import { allImagesTrusted, isOwnedListingImageUrl, isTrustedImageUrl, isValidImagePayload } from '../imageUrl'

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

// Task 957 (AC3, SEC-UPLOAD-OWNER-*): a listing accepts only photos under its OWNER's folder `<owner>/listings/`
describe('isOwnedListingImageUrl', () => {
  const OWNER = '22222222-2222-4222-8222-222222222222'
  const OTHER = '33333333-3333-4333-8333-333333333333'
  const LISTING = '44444444-4444-4444-8444-444444444444'
  const base = `https://res.cloudinary.com/${CLOUD}/image/upload`

  it.each([
    ['the folder of the person', `${base}/v1731000000/${OWNER}/listings/a1b2.jpg`],
    ['a listing folder', `${base}/v12/${OWNER}/listings/${LISTING}/a1b2.webp`],
    ['an address with no version', `${base}/${OWNER}/listings/a1b2.png`],
  ])('[SEC-UPLOAD-OWNER-ALLOW] accepts %s', (_label, url) => {
    expect(isOwnedListingImageUrl(url, OWNER, CLOUD)).toBe(true)
  })

  it.each([
    ['another account\'s folder', `${base}/v1/${OTHER}/listings/a.jpg`],
    ['the cloud root', `${base}/v1/a.jpg`],
    ['a folder that only starts like the owner\'s', `${base}/v1/${OWNER}x/listings/a.jpg`],
    ['the owner\'s other folder', `${base}/v1/${OWNER}/avatars/a.jpg`],
    ['the folder name with nothing after it', `${base}/v1/${OWNER}/listings/`],
    ['a .. segment that walks into the owner\'s folder', `${base}/v1/${OTHER}/../${OWNER}/listings/a.jpg`],
    ['a .. segment after the folder', `${base}/v1/${OWNER}/listings/../../${OTHER}/listings/a.jpg`],
    ['an encoded dot segment', `${base}/v1/${OWNER}/listings/%2e%2e/a.jpg`],
    ['a query string', `${base}/v1/${OWNER}/listings/a.jpg?x=1`],
    ['a fragment', `${base}/v1/${OWNER}/listings/a.jpg#x`],
    ['another cloud', `https://res.cloudinary.com/someone-else/image/upload/v1/${OWNER}/listings/a.jpg`],
    ['another host', `https://evil.example/${CLOUD}/image/upload/v1/${OWNER}/listings/a.jpg`],
    ['a video address', `https://res.cloudinary.com/${CLOUD}/video/upload/v1/${OWNER}/listings/a.mp4`],
  ])('[SEC-UPLOAD-OWNER-DENY] refuses %s', (_label, url) => {
    expect(isOwnedListingImageUrl(url, OWNER, CLOUD)).toBe(false)
  })

  it.each([[null], [undefined], [5], [{}]])('[SEC-UPLOAD-OWNER-DENY] refuses the non-string %j', (value) => {
    expect(isOwnedListingImageUrl(value, OWNER, CLOUD)).toBe(false)
  })

  it('[SEC-UPLOAD-OWNER-DENY] an empty owner id, and an id shaped like a pattern, match nothing (the id is compared as text, never used as a pattern)', () => {
    expect(isOwnedListingImageUrl(`${base}/v1/${OWNER}/listings/a.jpg`, '', CLOUD)).toBe(false)
    expect(isOwnedListingImageUrl(`${base}/v1/${OWNER}/listings/a.jpg`, '.*', CLOUD)).toBe(false)
    expect(isOwnedListingImageUrl(`${base}/v1/${OWNER}/listings/a.jpg`, `${OWNER}/listings`, CLOUD)).toBe(false)
  })

  it('[SEC-UPLOAD-OWNER-DENY] the whole payload is refused when one photo is another account\'s', () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = CLOUD
    const mine = { url: `${base}/v1/${OWNER}/listings/a.jpg`, is_cover: true, order: 0 }
    const theirs = { url: `${base}/v1/${OTHER}/listings/a.jpg`, is_cover: false, order: 1 }
    expect(isValidImagePayload([mine], OWNER)).toBe(true)
    expect(isValidImagePayload([mine, theirs], OWNER)).toBe(false)
    expect(isValidImagePayload([theirs], OWNER)).toBe(false)
  })
})
