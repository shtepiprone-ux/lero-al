// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { MAX_LISTING_IMAGES, isValidImagePayload } from '../imageUrl'

const url = (n: number) => `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'c'}/image/upload/v1/listings/${n}.jpg`
const good = (n: number) => ({ url: url(n), is_cover: n === 0, order: n })

describe('isValidImagePayload', () => {
  it('the limit is 20', () => expect(MAX_LISTING_IMAGES).toBe(20))
  it('accepts an empty list and a full list', () => {
    expect(isValidImagePayload([])).toBe(true)
    expect(isValidImagePayload(Array.from({ length: 20 }, (_, n) => good(n)))).toBe(true)
  })
  it('refuses 21 images', () => expect(isValidImagePayload(Array.from({ length: 21 }, (_, n) => good(n)))).toBe(false))
  it.each([[undefined], [null], ['[]'], [{}], [5]])('refuses %j as the list', (v) => expect(isValidImagePayload(v)).toBe(false))
  it.each([[null], ['x'], [5], [[]]])('refuses the entry %j', (e) => expect(isValidImagePayload([e])).toBe(false))
  it('refuses an address that is not ours, a flag that is not a boolean and a position that is not a small whole number', () => {
    expect(isValidImagePayload([{ ...good(0), url: 'https://example.com/a.jpg' }])).toBe(false)
    expect(isValidImagePayload([{ ...good(0), is_cover: 1 }])).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: NaN }])).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: Infinity }])).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: 999.5 }])).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: -1 }])).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: 1000 }])).toBe(false)
    expect(isValidImagePayload([{ ...good(0), order: 999 }])).toBe(true)
    expect(isValidImagePayload([{ ...good(0), order: 0 }])).toBe(true)
  })
});
