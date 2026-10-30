import { getLocalizedPropertyTypes } from '@/modules/admin/lib/propertyTypes'
import { routing } from '@/i18n/routing'

export const revalidate = 3600  // 1 hour — synced with unstable_cache TTL

// Only a supported locale reaches the cached query (Task 923 Revision 7, S10): every distinct string would otherwise be a new cache key and a new database read.
const DEFAULT_LOCALE = 'sq'
const isSupportedLocale = (value: string | null): value is (typeof routing.locales)[number] => !!value && (routing.locales as readonly string[]).includes(value)

export async function GET(req: Request) {
  const requested = new URL(req.url).searchParams.get('locale')
  const locale = isSupportedLocale(requested) ? requested : DEFAULT_LOCALE
  const types = await getLocalizedPropertyTypes(locale)
  return Response.json(types, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
  })
}
