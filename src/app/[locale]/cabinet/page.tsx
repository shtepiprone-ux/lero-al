import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { CabinetShell } from '@/modules/cabinet/components/CabinetShell'
import {
  buildCabinetListingsQuery,
  CABINET_LISTING_SELECT,
  VALID_VISIBILITY_GROUPS,
  type ListingVisibilityGroup,
  type ListingAttributeFilter,
} from '@/modules/cabinet/lib/queries'

interface Props {
  params:       Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'cabinet' })
  return { title: `${t('title')} | Lero.al` }
}

export default async function CabinetPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams

  const tab = (typeof sp.tab === 'string' ? sp.tab : null) ?? 'profile'

  // Visibility group — from ?filter= URL param
  const rawFilter = typeof sp.filter === 'string' ? sp.filter : 'ALL'
  const visibility: ListingVisibilityGroup =
    (VALID_VISIBILITY_GROUPS as readonly string[]).includes(rawFilter)
      ? (rawFilter as ListingVisibilityGroup)
      : 'ALL'

  // Attribute filter — from ?premium=1 URL param (independent of visibility)
  const isPremium = sp.premium === '1'
  const attribute: ListingAttributeFilter | undefined = isPremium ? 'PREMIUM' : undefined

  const authUser = await getUser()
  if (!authUser) redirect(`/${locale}/auth/login`)

  const supabase = await createClient()

  const baseListingsQuery = supabase
    .from('listings')
    .select(CABINET_LISTING_SELECT)
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })

  const [{ data: profile }, { data: listings }, { data: savedSearches }, { data: cities }, { data: regions }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    buildCabinetListingsQuery(baseListingsQuery, visibility, attribute),
    supabase.from('saved_searches').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
    supabase.from('locations').select('id, name_al, region_id').in('type', ['city', 'village']).order('name_al'),
    supabase.from('locations').select('id, name_al').eq('type', 'region').order('name_al'),
  ])

  return (
    <CabinetShell
      profile={profile}
      listings={listings ?? []}
      savedSearches={savedSearches ?? []}
      initialTab={tab}
      initialFilter={visibility}
      initialPremium={isPremium}
      locale={locale}
      cities={cities ?? []}
      regions={regions ?? []}
    />
  )
}
