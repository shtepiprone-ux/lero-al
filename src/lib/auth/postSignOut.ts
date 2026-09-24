import { routing } from '@/i18n/routing'

export const SESSION_REQUIRED_ROUTE_PATTERNS = [
  '/cabinet',
  '/favorites',
  '/listings/create',
  '/listings/[slug]/edit',
] as const

function stripLocalePrefix(pathname: string): string | null {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`
    if (pathname === prefix) return ''
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length)
  }
  return null
}

function matchesPattern(rest: string, pattern: string): boolean {
  const restSegments = rest.split('/').filter(Boolean)
  const patternSegments = pattern.split('/').filter(Boolean)
  if (restSegments.length !== patternSegments.length) return false
  return patternSegments.every((segment, i) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return restSegments[i].length > 0
    }
    return restSegments[i] === segment
  })
}

export function resolvePostSignOutPath(pathname: string | null, locale: string): string | null {
  if (!pathname) return `/${locale}`

  const stripped = stripLocalePrefix(pathname)
  if (stripped === null) return `/${locale}`

  const rest = stripped.endsWith('/') && stripped.length > 1 ? stripped.slice(0, -1) : stripped

  const isSessionRequired = SESSION_REQUIRED_ROUTE_PATTERNS.some(pattern => matchesPattern(rest, pattern))
  return isSessionRequired ? `/${locale}` : null
}
