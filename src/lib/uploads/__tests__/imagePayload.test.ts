// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { MAX_LISTING_IMAGES, isValidImagePayload } from '../imageUrl'

// Task 957: the payload is checked against the OWNER of the listing, so every address lies in that person's folder
const OWNER = '22222222-2222-4222-8222-222222222222'
const url = (n: number) => `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'c'}/image/upload/v1/${OWNER}/listings/${n}.jpg`
const good = (n: number) => ({ url: url(n), is_cover: n === 0, order: n })

describe('isValidImagePayload', () => {
  it('the limit is 20', () => expect(MAX_LISTING_IMAGES).toBe(20))
  it('accepts an empty list and a full list', () => {
    expect(isValidImagePayload([], OWNER)).toBe(true)
    expect(isValidImagePayload(Array.from({ length: 20 }, (_, n) => good(n)), OWNER)).toBe(true)
  })
  it('refuses 21 images', () => expect(isValidImagePayload(Array.from({ length: 21 }, (_, n) => good(n)), OWNER)).toBe(false))
  it.each([[undefined], [null], ['[]'], [{}], [5]])('refuses %j as the list', (v) => expect(isValidImagePayload(v, OWNER)).toBe(false))
  it.each([[null], ['x'], [5], [[]]])('refuses the entry %j', (e) => expect(isValidImagePayload([e], OWNER)).toBe(false))
  it('refuses an address that is not ours, a flag that is not a boolean and a position that is not a small whole number', () => {
    expect(isValidImagePayload([{ ...good(0), url: 'https://example.com/a.jpg' }], OWNER)).toBe(false)
    expect(isValidImagePayload([{ ...good(0), is_cover: 1 }], OWNER)).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: NaN }], OWNER)).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: Infinity }], OWNER)).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: 999.5 }], OWNER)).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: -1 }], OWNER)).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: 1000 }], OWNER)).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: 999 }], OWNER)).toBe(true)
    expect(isValidImagePayload([{ ...good(0), order: 0 }], OWNER)).toBe(true)
  })
});
