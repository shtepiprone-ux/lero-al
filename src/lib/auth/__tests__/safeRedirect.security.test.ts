// @vitest-environment node
/**
 * Open redirect (Task 923 Revision 7, finding S5): only a path of this site may come out of the `next` parameter.
 */
import { describe, expect, it } from 'vitest'
import { safeNextPath } from '../safeRedirect'

const ORIGIN = 'https://lero.al'
const BS = String.fromCharCode(92)

const ATTACKS: [string, string][] = [
  ['user-info trick (host becomes evil.example)', '@evil.example'],
  ['user-info trick with a path', '@evil.example/login'],
  ['sub-domain trick', '.evil.example'],
  ['protocol-relative', '//evil.example'],
  ['protocol-relative with a path', '//evil.example/a'],
  ['backslash form', `/${BS}evil.example`],
  ['double backslash', `${BS}${BS}evil.example`],
  ['absolute https url', 'https://evil.example'],
  ['absolute http url', 'http://evil.example/'],
  ['scheme only after a slash', '/https://evil.example'.replace('/https', 'https')],
  ['javascript url', 'javascript:alert(1)'],
  ['data url', 'data:text/html,<script>alert(1)</script>'],
  ['a tab that the URL parser removes ("/<TAB>/evil")', '/\t/evil.example'],
  ['a line break that the URL parser removes', '/\n/evil.example'],
  ['a carriage return', '/\r/evil.example'],
  ['a leading space', ' //evil.example'],
  ['no leading slash', 'evil.example'],
  ['a null byte', '/a\u0000b'],
  ['a very long value', `/${'a'.repeat(3000)}`],
]

describe('safeNextPath refuses everything that leaves the site', () => {
  it.each(ATTACKS)('%s: %j', (_label, attack) => {
    expect(safeNextPath(attack, ORIGIN, '/fallback')).toBe('/fallback')
  })

  it('the URL the route would redirect to always stays on the site origin, for every attack', () => {
    for (const [, attack] of ATTACKS) {
      const target = new URL(`${ORIGIN}${safeNextPath(attack, ORIGIN, '/')}`)
      expect(target.origin).toBe(ORIGIN)
    }
  })

  it('the old construction was exploitable (the test method sees the attack)', () => {
    expect(new URL(`${ORIGIN}@evil.example`).host).toBe('evil.example')
    expect(new URL(`${ORIGIN}.evil.example`).host).toBe('lero.al.evil.example')
  })
})

describe('safeNextPath keeps the legitimate destinations', () => {
  it.each([
    ['/'],
    ['/sq/auth/verified'],
    ['/en/cabinet/listings?tab=active'],
    ['/uk/listings/flat-in-tirana#photos'],
    ['/admin'],
    ['/%D0%BA%D0%B8%D1%97%D0%B2'],
  ])('%s', (path) => {
    expect(safeNextPath(path, ORIGIN, '/fallback')).toBe(path)
  })

  it('an encoded double slash stays a path of this site, not a host', () => {
    const out = safeNextPath('/%2f%2fevil.example', ORIGIN, '/fallback')
    expect(new URL(`${ORIGIN}${out}`).host).toBe('lero.al')
  })

  it('falls back for a missing value', () => {
    expect(safeNextPath(null, ORIGIN, '/sq')).toBe('/sq')
    expect(safeNextPath(undefined, ORIGIN, '/sq')).toBe('/sq')
    expect(safeNextPath('', ORIGIN, '/sq')).toBe('/sq')
  })

  it('the fallback defaults to the home page', () => {
    expect(safeNextPath('//evil.example', ORIGIN)).toBe('/')
  })

  it('works for an origin with a port', () => {
    expect(safeNextPath('/en/x', 'http://localhost:3000', '/')).toBe('/en/x')
    expect(safeNextPath('@evil.example', 'http://localhost:3000', '/')).toBe('/')
  })
})

// Task 923 R38 (case SEC-S05-SRV-DENY)
it('[SEC-S05-SRV-DENY] An auth redirect target is always a path of this site', () => {
  for (const attack of ['@evil.example', '//evil.example', 'https://evil.example']) {
    const target = safeNextPath(attack, ORIGIN, '/fallback')
    expect(target, attack).toBe('/fallback')
    expect(new URL(`${ORIGIN}${target}`).origin, attack).toBe(ORIGIN)
  }
  // the control: a real path of the site is kept
  expect(safeNextPath('/en/favorites', ORIGIN, '/fallback')).toBe('/en/favorites')
})
