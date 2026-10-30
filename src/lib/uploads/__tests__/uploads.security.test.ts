// @vitest-environment node
/**
 * The two building blocks of a safe upload (Task 923 Revision 7, findings S3 / S15): the file signature check and the one-record upload grant.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { declaredTypeMatchesBytes, sniffImageType } from '../imageSniff'
import { GRANT_TTL_MS, createUploadGrant, verifyUploadGrant } from '../uploadGrant'

const bytes = (...n: number[]) => new Uint8Array(n)
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0)
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10)
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50)
const text = (s: string) => new TextEncoder().encode(s)

describe('sniffImageType', () => {
  it('recognises PNG, JPEG and WEBP by their first bytes', () => {
    expect(sniffImageType(PNG)).toBe('image/png')
    expect(sniffImageType(JPEG)).toBe('image/jpeg')
    expect(sniffImageType(WEBP)).toBe('image/webp')
  })

  it('accepts an ArrayBuffer as well as a Uint8Array', () => {
    expect(sniffImageType(PNG.buffer.slice(0) as ArrayBuffer)).toBe('image/png')
  })

  it.each([
    ['an HTML page', text('<html><script>alert(1)</script></html>')],
    ['an SVG with script (it can carry code, so it is not an accepted image)', text('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>')],
    ['a PHP / shell script', text('<?php system($_GET["c"]); ?>')],
    ['a Windows executable', bytes(0x4d, 0x5a, 0x90, 0)],
    ['a GIF (not an accepted type)', text('GIF89a')],
    ['an empty file', bytes()],
    ['one byte', bytes(0xff)],
    ['a RIFF container that is not WEBP (a WAV)', bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45)],
    ['a truncated PNG signature', bytes(0x89, 0x50, 0x4e, 0x47)],
  ])('rejects %s', (_label, data) => {
    expect(sniffImageType(data)).toBeNull()
  })
})

describe('declaredTypeMatchesBytes', () => {
  it('accepts a file whose bytes are the type it declares', () => {
    expect(declaredTypeMatchesBytes('image/png', PNG)).toBe(true)
    expect(declaredTypeMatchesBytes('image/jpeg', JPEG)).toBe(true)
    expect(declaredTypeMatchesBytes('image/webp', WEBP)).toBe(true)
  })

  it('rejects a script that declares itself an image', () => {
    expect(declaredTypeMatchesBytes('image/png', text('<script>alert(1)</script>'))).toBe(false)
  })

  it('rejects a real image that declares another image type (a mismatch is a spoof)', () => {
    expect(declaredTypeMatchesBytes('image/png', JPEG)).toBe(false)
    expect(declaredTypeMatchesBytes('image/jpeg', PNG)).toBe(false)
  })

  it('rejects a declared type outside the accepted three even when the bytes are an image', () => {
    expect(declaredTypeMatchesBytes('image/svg+xml', PNG)).toBe(false)
    expect(declaredTypeMatchesBytes('', PNG)).toBe(false)
  })
})

describe('upload grant', () => {
  const before = { a: process.env.UPLOAD_GRANT_SECRET, b: process.env.SUPABASE_SERVICE_ROLE_KEY }
  beforeEach(() => { process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-for-tests'; delete process.env.UPLOAD_GRANT_SECRET })
  afterEach(() => { process.env.UPLOAD_GRANT_SECRET = before.a; process.env.SUPABASE_SERVICE_ROLE_KEY = before.b; if (before.a === undefined) delete process.env.UPLOAD_GRANT_SECRET; if (before.b === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY })

  const NOW = 1_700_000_000_000

  it('a fresh grant verifies for the record it was made for', () => {
    const g = createUploadGrant('company-logo', 'company-1', NOW)
    expect(verifyUploadGrant('company-logo', 'company-1', g, NOW + 1000)).toBe(true)
  })

  it('does not verify for another record (a grant for company A cannot change company B)', () => {
    const g = createUploadGrant('company-logo', 'company-1', NOW)
    expect(verifyUploadGrant('company-logo', 'company-2', g, NOW + 1000)).toBe(false)
  })

  it('expires after its time to live, and not before', () => {
    const g = createUploadGrant('company-logo', 'c', NOW)
    expect(verifyUploadGrant('company-logo', 'c', g, NOW + GRANT_TTL_MS - 1)).toBe(true)
    expect(verifyUploadGrant('company-logo', 'c', g, NOW + GRANT_TTL_MS + 1)).toBe(false)
  })

  it('a changed deadline invalidates it (the deadline is signed, so it cannot be extended)', () => {
    const g = createUploadGrant('company-logo', 'c', NOW)
    const [exp, sig] = g.split('.')
    const extended = `${Number(exp) + 10 * GRANT_TTL_MS}.${sig}`
    expect(verifyUploadGrant('company-logo', 'c', extended, NOW + 1000)).toBe(false)
  })

  it('a changed signature invalidates it', () => {
    const g = createUploadGrant('company-logo', 'c', NOW)
    const bad = `${g.slice(0, -1)}${g.endsWith('0') ? '1' : '0'}`
    expect(verifyUploadGrant('company-logo', 'c', bad, NOW + 1000)).toBe(false)
  })

  it.each([[undefined], [null], [''], ['garbage'], ['.'], ['123.'], ['abc.def'], ['1'.repeat(300)], ['-5.sig']])('rejects the malformed token %j', (token) => {
    expect(verifyUploadGrant('company-logo', 'c', token as string | null | undefined, NOW)).toBe(false)
  })

  it('a grant made with another server key does not verify (it cannot be forged without the key)', () => {
    const g = createUploadGrant('company-logo', 'c', NOW)
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'a-different-key'
    expect(verifyUploadGrant('company-logo', 'c', g, NOW + 1000)).toBe(false)
  })

  it('an explicit UPLOAD_GRANT_SECRET takes precedence over the service-role key', () => {
    process.env.UPLOAD_GRANT_SECRET = 'dedicated-secret'
    const g = createUploadGrant('company-logo', 'c', NOW)
    process.env.UPLOAD_GRANT_SECRET = 'another-secret'
    expect(verifyUploadGrant('company-logo', 'c', g, NOW + 1000)).toBe(false)
  })

  it('without any server key it refuses to make a grant instead of making a forgeable one', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(() => createUploadGrant('company-logo', 'c', NOW)).toThrow('upload_grant_secret_missing')
  })
})

// Task 923 R38 (case SEC-S15-SRV-DENY)
it('[SEC-S15-SRV-DENY] An upload is accepted only when its bytes match the declared image type', () => {
  expect(declaredTypeMatchesBytes('image/png', text('<html><script>alert(1)</script></html>'))).toBe(false)   // HTML declared as a PNG
  expect(declaredTypeMatchesBytes('image/png', JPEG)).toBe(false)                                              // a real image of another type is a spoof
  expect(declaredTypeMatchesBytes('image/svg+xml', PNG)).toBe(false)                                           // a type outside the three
  expect(declaredTypeMatchesBytes('image/png', PNG)).toBe(true)                                                // the control
})
