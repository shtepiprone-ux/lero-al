import { getLocalizedPropertyTypes } from '@/modules/admin/lib/propertyTypes'

export const revalidate = 3600  // 1 hour — synced with unstable_cache TTL

export async function GET(req: Request) {
  const locale = new URL(req.url).searchParams.get('locale') ?? 'sq'
  const types = await getLocalizedPropertyTypes(locale)
  return Response.json(types, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
  })
}
