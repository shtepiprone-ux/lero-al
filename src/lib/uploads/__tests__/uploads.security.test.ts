// @vitest-environment node
/**
 * The building block of a safe upload (Task 923 Revision 7, findings S3 / S15): the file signature check. The one-record upload grant was removed with the
 * anonymous company registration (Task 926).
 */
import { describe, expect, it } from 'vitest'
import { declaredTypeMatchesBytes, sniffImageType } from '../imageSniff'

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

// Task 923 R38 (case SEC-S15-SRV-DENY)
it('[SEC-S15-SRV-DENY] An upload is accepted only when its bytes match the declared image type', () => {
  expect(declaredTypeMatchesBytes('image/png', text('<html><script>alert(1)</script></html>'))).toBe(false)   // HTML declared as a PNG
  expect(declaredTypeMatchesBytes('image/png', JPEG)).toBe(false)                                              // a real image of another type is a spoof
  expect(declaredTypeMatchesBytes('image/svg+xml', PNG)).toBe(false)                                           // a type outside the three
  expect(declaredTypeMatchesBytes('image/png', PNG)).toBe(true)                                                // the control
})
