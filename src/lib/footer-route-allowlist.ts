import { validateSlug } from '@/lib/slug-validator'

// Canonical list of confirmed-public internal routes for Footer link validation, plus
// single-segment CMS page slugs. This is the SHAPE check only — it is pure and runs on
// both client and server. A shape-valid CMS slug (single segment, passes validateSlug)
// still needs a server-side EXISTENCE check against `pages` where `is_published = true`
// (see upsertFooterContent in src/modules/admin/actions/footer.ts) before it is trusted.
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
// A single-segment path that is not one of the static entries is accepted here when its
// slug passes the canonical shape check (validateSlug) — this is shape only; the caller
// (upsertFooterContent) still resolves the slug against `pages` on the server before saving.
export function isValidFooterUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return true
  if (!trimmed.startsWith('/')) return true  // external or other protocol — not validated here

  const LOCALE_PREFIXES = ['/sq', '/en', '/uk', '/it']
  for (const prefix of LOCALE_PREFIXES) {
    if (trimmed === prefix || trimmed.startsWith(prefix + '/')) return false
  }

  const normalized = normalizeInternalPath(trimmed)
  if (getKnownInternalPaths().includes(normalized)) return true

  const segment = normalized.slice(1)
  if (segment.length > 0 && !segment.includes('/') && validateSlug(segment).ok) return true

  return false
}
