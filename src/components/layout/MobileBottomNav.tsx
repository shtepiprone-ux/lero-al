'use client'

import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useUser } from '@/modules/auth/hooks/useUser'
import { openAuthSheet } from '@/lib/auth/authSheet'
import { MobileBottomNavView } from './MobileBottomNavView'

export function MobileBottomNav() {
  const locale = useLocale()
  const pathname = usePathname()
  const { user } = useUser()

  const isHome      = pathname === `/${locale}` || pathname === `/${locale}/`
  const isListings  = pathname.startsWith(`/${locale}/listings`) && !pathname.includes('/create')
  const isAdd       = pathname.includes('/create')
  const isFavorites = pathname.startsWith(`/${locale}/favorites`)
  const isProfile   = pathname.startsWith(`/${locale}/cabinet`) || pathname.startsWith(`/${locale}/auth`)

  return (
    <MobileBottomNavView
      isAuthenticated={!!user}
      locale={locale}
      active={{ home: isHome, listings: isListings, add: isAdd, favorites: isFavorites, profile: isProfile }}
      onRequireAuth={() => openAuthSheet('login')}
      hideFromMd
    />
  )
}
