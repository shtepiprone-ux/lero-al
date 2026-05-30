// Canonical list of confirmed-public internal routes for Footer link validation.
// pages table slugs are excluded: the table exists but no public [locale]/[slug]
// renderer exists yet. Follow-up: "Admin CMS pages + Footer create/select page flow".
export const STATIC_INTERNAL_PATHS = [
  '/',
  '/contact',
  '/favorites',
  '/listings',
  '/listings/create',
] as const

export function getKnownInternalPaths(): string[] {
  return [...STATIC_INTERNAL_PATHS]
}

// Strips query string, hash, and trailing slash (preserves root "/").
export function normalizeInternalPath(url: string): string {
  const withoutQuery = url.split('?')[0]
  const withoutHash = withoutQuery.split('#')[0]
  const path = withoutHash
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path
}

// Returns false only for invalid internal paths (starting with "/").
// External URLs (https?://), empty strings, and non-path protocols pass through.
// Locale-prefixed paths (/sq/..., /en/..., /uk/..., /it/...) are always rejected.
export function isValidFooterUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return true
  if (!trimmed.startsWith('/')) return true  // external or other protocol — not validated here

  const LOCALE_PREFIXES = ['/sq', '/en', '/uk', '/it']
  for (const prefix of LOCALE_PREFIXES) {
    if (trimmed === prefix || trimmed.startsWith(prefix + '/')) return false
  }

  const normalized = normalizeInternalPath(trimmed)
  return getKnownInternalPaths().includes(normalized)
}
