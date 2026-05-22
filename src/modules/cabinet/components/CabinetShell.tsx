'use client'

import { useState, type ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { usePresence } from '@/hooks/usePresence'
import { User, LayoutList, Bookmark } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ProfileTab } from '@/modules/cabinet/components/ProfileTab'
import { ListingsTab } from '@/modules/cabinet/components/ListingsTab'
import { SavedSearchesTab } from '@/modules/cabinet/components/SavedSearchesTab'
import { formatDate } from '@/lib/formatters'
import type { User as UserType, SavedSearch } from '@/types/database'
import type { CardListingData } from '@/modules/listings/components/ListingCard'

type Tab = 'profile' | 'listings' | 'searches'

import type { ListingVisibilityGroup } from '@/modules/cabinet/components/ListingsTab'

interface CityOption { id: number; name_al: string; region_id: number | null }
interface RegionOption { id: number; name_al: string }

interface Props {
  profile: UserType | null
  listings: CardListingData[]
  savedSearches: SavedSearch[]
  initialTab: string
  initialFilter: ListingVisibilityGroup
  initialPremium: boolean
  locale: string
  cities: CityOption[]
  regions: RegionOption[]
  userId: string
  email?: string | null
  profileRecentlyViewed?: ReactNode
}

export function CabinetShell({ profile, listings, savedSearches, initialTab, initialFilter, initialPremium, locale, cities, regions, userId, email, profileRecentlyViewed }: Props) {
  const t = useTranslations('cabinet')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track authenticated presence — throttled server-side to once per 15 min.
  usePresence()

  // Lifted avatar state so header avatar updates immediately on upload without page refresh.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)

  const activeTab = (searchParams.get('tab') ?? initialTab) as Tab

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'profile', label: t('profile_tab'), icon: User },
    { key: 'listings', label: t('listings_tab'), icon: LayoutList, count: listings.length },
    { key: 'searches', label: t('searches_tab'), icon: Bookmark, count: savedSearches.length },
  ]

  return (
    <div className="cabinet min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* User card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-bold truncate">{profile?.name ?? '—'}</h1>
              {profile?.user_type === 'agent' && (
                <Badge variant="secondary" className="text-xs">{t('user_type_agent')}</Badge>
              )}
              {profile?.is_verified && (
                <Badge variant="success" className="text-xs">✓ {t('verified')}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('member_since')}: {formatDate(profile?.created_at, locale)}
            </p>
            {profile?.last_seen_at && (
              <p className="text-sm text-muted-foreground">
                {t('last_seen')}: {formatDate(profile.last_seen_at, locale)}
              </p>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div role="tablist" className="flex gap-1 bg-card rounded-xl border shadow-sm p-1 mb-6">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                activeTab === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              {count !== undefined && count > 0 && (
                <span className={cn(
                  'text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none',
                  activeTab === key
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'profile' && <ProfileTab profile={profile} locale={locale} cities={cities} regions={regions} email={email} onAvatarChange={setAvatarUrl} recentlyViewed={profileRecentlyViewed} />}
        {activeTab === 'listings' && <ListingsTab listings={listings} locale={locale} initialFilter={initialFilter} initialPremium={initialPremium} userId={userId} />}
        {activeTab === 'searches' && <SavedSearchesTab savedSearches={savedSearches} />}

      </div>
    </div>
  )
}
