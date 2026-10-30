// @vitest-environment node
/**
 * Stored links (Task 923 Revision 7, finding S9): only http(s) (and, where allowed, mailto / tel) links are ever output.
 */
import { describe, expect, it } from 'vitest'
import { isSafeExternalUrl, resolveLinkTarget, safeExternalUrl } from '../safeUrl'

const SCRIPTS = [
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  '  javascript:alert(1)',
  'java\tscript:alert(1)',
  'java\nscript:alert(1)',
  'java\rscript:alert(1)',
  '\u0001javascript:alert(1)',
  'javascript\t:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'DATA:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  'blob:https://example.com/uuid',
  'ftp://example.com/x',
  'about:blank',
  'x-custom:payload',
  '//example.com/protocol-relative',
  '/relative/path',
  'https://user:secret@example.com/',
  'http://user@example.com/',
  '',
  '   ',
  'no host here',
  'just-a-word',
]

describe('safeExternalUrl (default: http and https only)', () => {
  it.each(SCRIPTS)('refuses %j', (value) => {
    expect(safeExternalUrl(value)).toBeNull()
    expect(isSafeExternalUrl(value)).toBe(false)
  })

  it.each([null, undefined, 5 as unknown as string, {} as unknown as string])('refuses a non-string %j', (value) => {
    expect(safeExternalUrl(value)).toBeNull()
  })

  it('refuses a very long value', () => {
    expect(safeExternalUrl(`https://example.com/${'a'.repeat(3000)}`)).toBeNull()
  })

  it.each([
    ['https://example.com', 'https://example.com/'],
    ['http://example.com/a?b=1#c', 'http://example.com/a?b=1#c'],
    ['  https://www.example.al/path  ', 'https://www.example.al/path'],
    ['HTTPS://EXAMPLE.COM', 'https://example.com/'],
    ['https://instagram.com/lero.al', 'https://instagram.com/lero.al'],
  ])('accepts %j', (value, expected) => {
    expect(safeExternalUrl(value)).toBe(expected)
  })

  it.each([
    ['example.com', 'https://example.com/'],
    ['www.example.al/agency', 'https://www.example.al/agency'],
  ])('reads the schemeless host %j as https', (value, expected) => {
    expect(safeExternalUrl(value)).toBe(expected)
  })

  it('never returns a URL whose scheme is not http or https', () => {
    for (const v of SCRIPTS) {
      const out = safeExternalUrl(v)
      if (out) expect(/^https?:\/\//.test(out)).toBe(true)
    }
  })
})

describe('safeExternalUrl with extra schemes', () => {
  const allowed = ['http:', 'https:', 'mailto:', 'tel:'] as const

  it('accepts mailto and tel when the caller allows them', () => {
    expect(safeExternalUrl('mailto:info@lero.al', allowed)).toBe('mailto:info@lero.al')
    expect(safeExternalUrl('tel:+355691234567', allowed)).toBe('tel:+355691234567')
  })

  it('still refuses scripts and other schemes', () => {
    for (const v of ['javascript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,x', 'file:///x']) expect(safeExternalUrl(v, allowed)).toBeNull()
  })

  it('does not accept mailto by default', () => {
    expect(safeExternalUrl('mailto:info@lero.al')).toBeNull()
  })
})

describe('resolveLinkTarget (footer and menu links)', () => {
  it('an empty value is the home page of the locale', () => {
    expect(resolveLinkTarget('', 'uk')).toEqual({ href: '/uk', external: false })
    expect(resolveLinkTarget(null, 'uk')).toEqual({ href: '/uk', external: false })
    expect(resolveLinkTarget('   ', 'uk')).toEqual({ href: '/uk', external: false })
  })

  it('a path of this site gets the locale prefix, with or without the slash, query and hash kept', () => {
    expect(resolveLinkTarget('/listings', 'en')).toEqual({ href: '/en/listings', external: false })
    expect(resolveLinkTarget('about', 'en')).toEqual({ href: '/en/about', external: false })
    expect(resolveLinkTarget('/listings?type=flat&time=10:30#top', 'en')).toEqual({ href: '/en/listings?type=flat&time=10:30#top', external: false })
  })

  it('http and https are external; mailto and tel are allowed and not external', () => {
    expect(resolveLinkTarget('https://example.com/a', 'en')).toEqual({ href: 'https://example.com/a', external: true })
    expect(resolveLinkTarget('http://example.com', 'en')).toEqual({ href: 'http://example.com/', external: true })
    expect(resolveLinkTarget('mailto:info@lero.al', 'en')).toEqual({ href: 'mailto:info@lero.al', external: false })
    expect(resolveLinkTarget('tel:+355691234567', 'en')).toEqual({ href: 'tel:+355691234567', external: false })
  })

  it.each([
    ['javascript:alert(1)'], ['JaVaScRiPt:alert(1)'], ['java\tscript:alert(1)'], ['java\nscript:alert(1)'], ['data:text/html,x'], ['vbscript:x'], ['file:///etc/passwd'],
    ['//evil.example'], [`${String.fromCharCode(92)}evil.example`], [`/${String.fromCharCode(92)}evil.example`], ['evil:thing'], ['a\u0000b'],
  ])('refuses %j', (value) => {
    expect(resolveLinkTarget(value, 'en')).toBeNull()
  })

  it('never returns a href that is not a path of the site or an http / mailto / tel address', () => {
    for (const v of SCRIPTS.concat(['', '/a', 'b', 'https://x.example', 'mailto:a@b.co'])) {
      const t = resolveLinkTarget(v, 'en')
      if (t) expect(/^(\/|https?:\/\/|mailto:|tel:)/.test(t.href), `${JSON.stringify(v)} -> ${t.href}`).toBe(true)
    }
  })
})
