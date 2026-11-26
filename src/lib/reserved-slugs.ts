export const LOCALE_CODES = ['sq', 'en', 'uk', 'it'] as const
export type LocaleCode = (typeof LOCALE_CODES)[number]

// Static app route segments that must never be used as CMS page slugs.
// Keep in sync with src/app/[locale]/admin and the directory entries of src/app/[locale]/(site)/*.
export const RESERVED_SLUGS: readonly string[] = [
  'admin', // the admin, under the language slug since Task 988 (src/app/[locale]/admin)
  'auth',
  'cabinet',
  'ci', // CI fixtures (/ci/click-shield-modal): a page with this slug would never be reachable (Task 923 Revision 7)
  'contact',
  'favorites',
  'listings',
  ...LOCALE_CODES,
]

export function isReservedSlug(slug: string): boolean {
  const lower = slug.toLowerCase()
  return RESERVED_SLUGS.some(r => lower === r || lower.startsWith(r + '/'))
}
