import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ChevronRight, Home } from 'lucide-react'
import { getUser } from '@/lib/auth/server'
import { getFavoriteListingsPaginated, getFavoriteTypeCounts, getUserCollections } from '@/modules/listings/lib/favoritesQueries'
import { FavoritesShell } from '@/modules/listings/components/FavoritesShell'
import type { CardListingData } from '@/modules/listings/components/ListingCard'
import { PROPERTY_TYPES, FAVORITES_PER_PAGE } from '@/modules/listings/constants'
import type { PropertyType } from '@/types/database'

interface Props {
  params:       Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// Derived from the canonical PROPERTY_TYPES constant — the only source of truth
// for valid property type values in this codebase. Using a Set for O(1) lookup.
const VALID_PROPERTY_TYPE_SET = new Set<string>(PROPERTY_TYPES.map(pt => pt.value))

function parsePropertyType(raw: unknown): PropertyType | undefined {
  if (typeof raw !== 'string') return undefined
  // Safe cast: raw has been verified against the canonical domain set.
  if (VALID_PROPERTY_TYPE_SET.has(raw)) return raw as PropertyType
  return undefined
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'favorites' })
  return { title: `${t('page_title')} | Lero.al` }
}

export default async function FavoritesPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams

  const authUser = await getUser()
  if (!authUser) redirect(`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/favorites`)}&session=lost`)

  const t = await getTranslations({ locale, namespace: 'favorites' })
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const typeFilter = parsePropertyType(sp.type)

  const rawPage = sp.page
  const page = typeof rawPage === 'string' && /^\d+$/.test(rawPage)
    ? Math.max(1, parseInt(rawPage, 10))
    : 1

  let fetchError = false

  const [favResult, typeCounts, collections] = await Promise.all([
    getFavoriteListingsPaginated(authUser.id, typeFilter, page, FAVORITES_PER_PAGE)
      .catch((err) => {
        console.error('Failed to fetch favorite listings', err)
        fetchError = true
        return { listings: [] as CardListingData[], total: 0 }
      }),
    getFavoriteTypeCounts(authUser.id),
    getUserCollections(authUser.id).catch(() => []),
  ])

  const { listings } = favResult

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="bg-muted/40 border-b">
        <div className="container-wide py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" />
              {tNav('home')}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{t('page_title')}</span>
          </nav>
        </div>
      </div>

      <div className="container-wide py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t('page_title')}</h1>
        </div>
        <FavoritesShell
          listings={listings}
          userId={authUser.id}
          typeFilter={typeFilter}
          typeCounts={typeCounts}
          page={page}
          perPage={FAVORITES_PER_PAGE}
          error={fetchError}
          initialCollections={collections}
        />
      </div>
    </div>
  )
}
