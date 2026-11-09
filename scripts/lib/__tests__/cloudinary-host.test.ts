// @vitest-environment node
/**
 * Task 951 (CodeQL js/incomplete-url-substring-sanitization, the LCP probes in scripts/): the host is compared whole.
 */
import { describe, expect, it } from 'vitest'
import { isCloudinaryUrl, mentionsCloudinaryUrl } from '../cloudinary-host.mjs'

const REAL = 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg'

describe('isCloudinaryUrl', () => {
  it('accepts https on res.cloudinary.com', () => {
    expect(isCloudinaryUrl(REAL)).toBe(true)
  })

  it.each([
    ['a path on another host', 'https://evil.example/res.cloudinary.com/x'],
    ['a longer host', 'https://res.cloudinary.com.evil.example/x'],
    ['user-info', 'https://res.cloudinary.com@evil.example/x'],
    ['plain http', 'http://res.cloudinary.com/x'],
    ['text that is not a URL', 'res.cloudinary.com/x'],
    ['nothing', undefined],
  ])('refuses %s', (_label, value) => {
    expect(isCloudinaryUrl(value)).toBe(false)
  })
})

describe('mentionsCloudinaryUrl', () => {
  it('finds a Cloudinary URL in an HTML tag and in a srcset', () => {
    expect(mentionsCloudinaryUrl(`<link rel="preload" as="image" href="${REAL}">`)).toBe(true)
    expect(mentionsCloudinaryUrl(`<img srcSet="https://example.com/a.jpg 1x, ${REAL} 2x">`)).toBe(true)
  })

  it('does not take a look-alike or a bare mention for one', () => {
    expect(mentionsCloudinaryUrl('<img src="https://evil.example/res.cloudinary.com/x/upload/a.jpg">')).toBe(false)
    expect(mentionsCloudinaryUrl('<img alt="res.cloudinary.com">')).toBe(false)
    expect(mentionsCloudinaryUrl('')).toBe(false)
  })
})
