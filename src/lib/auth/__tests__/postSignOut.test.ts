import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { resolvePostSignOutPath, SESSION_REQUIRED_ROUTE_PATTERNS } from '../postSignOut'

const LOCALES = ['sq', 'en', 'uk', 'it'] as const

describe('resolvePostSignOutPath — classification table', () => {
  describe('session-required routes stay guarded (return home) in every locale', () => {
    for (const locale of LOCALES) {
      it(`${locale}: /cabinet -> /${locale}`, () => {
        expect(resolvePostSignOutPath(`/${locale}/cabinet`, locale)).toBe(`/${locale}`)
      })
      it(`${locale}: /favorites -> /${locale}`, () => {
        expect(resolvePostSignOutPath(`/${locale}/favorites`, locale)).toBe(`/${locale}`)
      })
      it(`${locale}: /listings/create -> /${locale}`, () => {
        expect(resolvePostSignOutPath(`/${locale}/listings/create`, locale)).toBe(`/${locale}`)
      })
      it(`${locale}: /listings/abc-123/edit -> /${locale}`, () => {
        expect(resolvePostSignOutPath(`/${locale}/listings/abc-123/edit`, locale)).toBe(`/${locale}`)
      })
    }
  })

  describe('public routes stay (return null)', () => {
    const publicPaths = [
      '/en',
      '/en/',
      '/en/listings/abc-123',
      '/en/privacy-policy',
      '/en/auth/login',
    ]
    for (const path of publicPaths) {
      it(`${path} -> null`, () => {
        expect(resolvePostSignOutPath(path, 'en')).toBeNull()
      })
    }
  })

  describe('safe fallbacks -> /<locale>', () => {
    it('null pathname -> /en', () => {
      expect(resolvePostSignOutPath(null, 'en')).toBe('/en')
    })
    it("empty pathname '' -> /en", () => {
      expect(resolvePostSignOutPath('', 'en')).toBe('/en')
    })
    it('/listings (no locale prefix) -> /en', () => {
      expect(resolvePostSignOutPath('/listings', 'en')).toBe('/en')
    })
  })
})

describe('resolvePostSignOutPath — drift test against real guest guards', () => {
  const appLocaleRoot = join(process.cwd(), 'src', 'app', '[locale]')

  function findPageFiles(dir: string, relative: string): string[] {
    const entries = readdirSync(dir)
    const pages: string[] = []
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const relPath = `${relative}/${entry}`
      if (statSync(fullPath).isDirectory()) {
        pages.push(...findPageFiles(fullPath, relPath))
      } else if (entry === 'page.tsx') {
        pages.push(relPath)
      }
    }
    return pages
  }

  function routePatternFor(relativePagePath: string): string {
    // relativePagePath looks like "/cabinet/page.tsx" — drop the trailing "/page.tsx".
    return relativePagePath.slice(0, -'/page.tsx'.length)
  }

  const guardRegex = /redirect\(\s*`[^`]*auth\/login\?next=/

  function isGuarded(fullPath: string): boolean {
    const source = readFileSync(fullPath, 'utf8')
    return guardRegex.test(source)
  }

  it('SESSION_REQUIRED_ROUTE_PATTERNS equals the set of guest-guarded [locale] pages', () => {
    const relativePages = findPageFiles(appLocaleRoot, '')
    const guardedPatterns = relativePages
      .filter(rel => isGuarded(join(appLocaleRoot, rel.slice(1))))
      .map(routePatternFor)
      .sort()

    const expected: string[] = [...SESSION_REQUIRED_ROUTE_PATTERNS].sort()

    const missing = expected.filter(p => !guardedPatterns.includes(p))
    const extra = guardedPatterns.filter(p => !expected.includes(p))

    expect(
      missing.length === 0 && extra.length === 0,
      `SESSION_REQUIRED_ROUTE_PATTERNS drift — missing: [${missing.join(', ')}], extra: [${extra.join(', ')}]`,
    ).toBe(true)
  })
})
