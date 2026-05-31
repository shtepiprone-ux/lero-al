import { isReservedSlug } from '@/lib/reserved-slugs'

export type SlugError = 'slug_reserved' | 'slug_invalid_format'
export type SlugValidationResult = { ok: true } | { ok: false; reason: SlugError }

export function validateSlug(slug: string): SlugValidationResult {
  const trimmed = slug.trim()
  if (!trimmed) return { ok: false, reason: 'slug_invalid_format' }
  if (trimmed.includes('/')) return { ok: false, reason: 'slug_invalid_format' }
  if (!/^[a-z0-9-]+$/.test(trimmed)) return { ok: false, reason: 'slug_invalid_format' }
  if (isReservedSlug(trimmed)) return { ok: false, reason: 'slug_reserved' }
  return { ok: true }
}
