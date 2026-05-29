import { describe, it, expect } from 'vitest'
import { sanitizeReturnTo } from '../sanitizeReturnTo'

describe('sanitizeReturnTo', () => {
  // ── Valid paths ───────────────────────────────────────────────────────────

  it('accepts a clean relative path', () => {
    expect(sanitizeReturnTo('/sq/cabinet')).toBe('/sq/cabinet')
  })

  it('accepts root path', () => {
    expect(sanitizeReturnTo('/')).toBe('/')
  })

  it('accepts path with query string', () => {
    expect(sanitizeReturnTo('/favorites?type=all')).toBe('/favorites?type=all')
  })

  it('accepts legitimately percent-encoded path (%20 space)', () => {
    expect(sanitizeReturnTo('/sq/listings/my%20listing')).toBe('/sq/listings/my%20listing')
  })

  it('accepts admin path (authorization is enforced by admin/layout.tsx SSR guard)', () => {
    expect(sanitizeReturnTo('/admin')).toBe('/admin')
  })

  // ── Null / empty ──────────────────────────────────────────────────────────

  it('returns null for undefined', () => {
    expect(sanitizeReturnTo(undefined)).toBeNull()
  })

  it('returns null for null', () => {
    expect(sanitizeReturnTo(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(sanitizeReturnTo('')).toBeNull()
  })

  // ── Protocol-relative and scheme ──────────────────────────────────────────

  it('rejects protocol-relative URL (//)', () => {
    expect(sanitizeReturnTo('//evil.com')).toBeNull()
  })

  it('rejects javascript: scheme', () => {
    expect(sanitizeReturnTo('javascript:alert(1)')).toBeNull()
  })

  it('rejects data: scheme', () => {
    expect(sanitizeReturnTo('data:text/html,<h1>xss</h1>')).toBeNull()
  })

  it('rejects absolute external URL', () => {
    expect(sanitizeReturnTo('https://evil.com')).toBeNull()
  })

  // ── Non-relative ──────────────────────────────────────────────────────────

  it('rejects path not starting with /', () => {
    expect(sanitizeReturnTo('evil.com/page')).toBeNull()
  })

  // ── Path traversal ────────────────────────────────────────────────────────

  it('rejects /../ traversal', () => {
    expect(sanitizeReturnTo('/../etc/passwd')).toBeNull()
  })

  it('rejects trailing /.. traversal', () => {
    expect(sanitizeReturnTo('/sq/..')).toBeNull()
  })

  it('rejects %2e%2e encoded traversal', () => {
    expect(sanitizeReturnTo('/%2e%2e/etc/passwd')).toBeNull()
  })

  it('rejects .%2e mixed encoding traversal', () => {
    expect(sanitizeReturnTo('/.%2e/etc')).toBeNull()
  })

  it('rejects %2e. mixed encoding traversal', () => {
    expect(sanitizeReturnTo('/%2e./etc')).toBeNull()
  })

  it('rejects ..%2f encoded-slash traversal', () => {
    expect(sanitizeReturnTo('/..%2fetc')).toBeNull()
  })

  // ── Backslash ─────────────────────────────────────────────────────────────

  it('rejects backslash in path', () => {
    expect(sanitizeReturnTo('/sq\\cabinet')).toBeNull()
  })

  it('rejects path starting with backslash-slash', () => {
    expect(sanitizeReturnTo('/\\evil.com')).toBeNull()
  })

  // ── Control characters ────────────────────────────────────────────────────

  it('rejects path with null byte', () => {
    expect(sanitizeReturnTo('/sq\x00cabinet')).toBeNull()
  })

  it('rejects path with newline', () => {
    expect(sanitizeReturnTo('/sq\ncabinet')).toBeNull()
  })

  it('rejects path with carriage return', () => {
    expect(sanitizeReturnTo('/sq\rcabinet')).toBeNull()
  })
})
