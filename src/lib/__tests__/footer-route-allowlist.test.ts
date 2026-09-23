/**
 * footer-route-allowlist.test.ts — Task 867 (Sprint 79), R3/AC4.
 *
 * isValidFooterUrl's shape check now accepts a single-segment CMS page slug in addition
 * to the five static paths, while preserving every prior verdict (empty, external,
 * locale-prefixed, multi-segment). Existence (is the slug a real published page) is a
 * separate, server-only check in upsertFooterContent — not covered here.
 *
 * Command: npx vitest run src/lib/__tests__/footer-route-allowlist.test.ts
 */

import { describe, it, expect } from 'vitest'
import { isValidFooterUrl } from '@/lib/footer-route-allowlist'

describe('isValidFooterUrl', () => {
  it('accepts the five static paths', () => {
    expect(isValidFooterUrl('/')).toBe(true)
    expect(isValidFooterUrl('/contact')).toBe(true)
    expect(isValidFooterUrl('/favorites')).toBe(true)
    expect(isValidFooterUrl('/listings')).toBe(true)
    expect(isValidFooterUrl('/listings/create')).toBe(true)
  })

  it('accepts empty string and external URLs (not validated here)', () => {
    expect(isValidFooterUrl('')).toBe(true)
    expect(isValidFooterUrl('   ')).toBe(true)
    expect(isValidFooterUrl('https://facebook.com/lero')).toBe(true)
    expect(isValidFooterUrl('https://instagram.com/lero')).toBe(true)
  })

  it('rejects locale-prefixed and reserved-segment paths', () => {
    expect(isValidFooterUrl('/en/about')).toBe(false)
    expect(isValidFooterUrl('/sq')).toBe(false)
    expect(isValidFooterUrl('/it/x')).toBe(false)
    expect(isValidFooterUrl('/auth')).toBe(false)
  })

  it('accepts shape-valid single-segment CMS slugs', () => {
    expect(isValidFooterUrl('/privacy-policy')).toBe(true)
    expect(isValidFooterUrl('/about')).toBe(true)
    expect(isValidFooterUrl('/terms-of-service')).toBe(true)
  })

  it('rejects multi-segment paths that are not static entries', () => {
    expect(isValidFooterUrl('/some/deep/path')).toBe(false)
  })

  it('rejects slugs that fail the canonical shape (case, underscore)', () => {
    expect(isValidFooterUrl('/Privacy-Policy')).toBe(false)
    expect(isValidFooterUrl('/privacy_policy')).toBe(false)
  })
})
