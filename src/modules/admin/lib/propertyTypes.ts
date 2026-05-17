import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DBPropertyType } from '@/types/database'

export const PROPERTY_TYPES_CACHE_TAG = 'property-types'

/** Fetch all active property types ordered by sort_order. Cached 1 hour. */
export const getPropertyTypes = unstable_cache(
  async (): Promise<DBPropertyType[]> => {
    const db = createAdminClient()
    const { data } = await db
      .from('property_types')
      .select('id, slug, name_sq, name_en, name_uk, name_it, is_active, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    return (data ?? []) as DBPropertyType[]
  },
  [PROPERTY_TYPES_CACHE_TAG],
  { revalidate: 3600, tags: [PROPERTY_TYPES_CACHE_TAG] },
)

/** Return property types with localized label for a given locale. */
export async function getLocalizedPropertyTypes(locale: string): Promise<{ value: string; label: string }[]> {
  const types = await getPropertyTypes()
  return types
    .filter(pt => pt.is_active)
    .map(pt => ({
      value: pt.slug,
      label: getLocalizedName(pt, locale),
    }))
}

/** Get the localized name for a property type, with 'sq' as fallback. */
export function getLocalizedName(pt: DBPropertyType, locale: string): string {
  const key = `name_${locale}` as keyof DBPropertyType
  const val = pt[key] as string | undefined
  return (val && val.trim()) ? val : (pt.name_sq || pt.slug)
}
