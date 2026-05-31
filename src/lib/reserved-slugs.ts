export const LOCALE_CODES = ['sq', 'en', 'uk', 'it'] as const
export type LocaleCode = (typeof LOCALE_CODES)[number]

// Static app route segments that must never be used as CMS page slugs.
// Keep in sync with src/app/[locale]/* directory entries.
export const RESERVED_SLUGS: readonly string[] = [
  'auth',
  'cabinet',
  'contact',
  'favorites',
  'listings',
  ...LOCALE_CODES,
]

export function isReservedSlug(slug: string): boolean {
  const lower = slug.toLowerCase()
  return RESERVED_SLUGS.some(r => lower === r || lower.startsWith(r + '/'))
}
