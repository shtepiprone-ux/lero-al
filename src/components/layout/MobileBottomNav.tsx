'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Home, Search, Plus, Heart, User } from 'lucide-react'
import { useUser } from '@/modules/auth/hooks/useUser'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { openAuthSheet } from '@/lib/auth/authSheet'

export function MobileBottomNav() {
  const locale = useLocale()
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const pathname = usePathname()
  const { user } = useUser()

  const isHome      = pathname === `/${locale}` || pathname === `/${locale}/`
  const isListings  = pathname.startsWith(`/${locale}/listings`) && !pathname.includes('/create')
  const isAdd       = pathname.includes('/create')
  const isFavorites = pathname.startsWith(`/${locale}/favorites`)
  const isProfile   = pathname.startsWith(`/${locale}/cabinet`) || pathname.startsWith(`/${locale}/auth`)

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card border-t shadow-[0_-2px_16px_rgba(0,0,0,0.08)] flex items-stretch h-14"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={tc('aria_main_nav')}
    >
      <BottomNavItem href={`/${locale}`}             icon={Home}   label={t('home')}        active={isHome} />
      <BottomNavItem href={`/${locale}/listings`}    icon={Search} label={t('listings')}    active={isListings} />

      {/* Centre add-listing button — elevated FAB style */}
      <Link
        href={`/${locale}/listings/create`}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 -mt-3 group"
        aria-label={t('add_listing')}
      >
        <span className={cn(
          'h-12 w-12 rounded-full flex items-center justify-center shadow-lg ring-2 ring-background transition-transform duration-150 group-active:scale-95',
          isAdd ? 'bg-primary/90 ring-primary/20' : 'bg-primary',
        )}>
          <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
        </span>
        <span className="text-[10px] font-medium text-muted-foreground leading-none">{t('add_listing')}</span>
      </Link>

      {user ? (
        <BottomNavItem href={`/${locale}/favorites`} icon={Heart} label={t('favorites')} active={isFavorites} />
      ) : (
        <BottomNavItem onClick={() => openAuthSheet('login')} icon={Heart} label={t('favorites')} active={isFavorites} />
      )}
      {user ? (
        <BottomNavItem href={`/${locale}/cabinet`} icon={User} label={t('profile')} active={isProfile} />
      ) : (
        <BottomNavItem onClick={() => openAuthSheet('login')} icon={User} label={t('login')} active={isProfile} />
      )}
    </nav>
  )
}

function BottomNavItem({
  href, onClick, icon: Icon, label, active,
}: {
  href?: string
  onClick?: () => void
  icon: React.ElementType
  label: string
  active: boolean
}) {
  const className = cn(
    'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-full',
    active ? 'text-primary' : 'text-muted-foreground',
  )
  if (onClick) {
    return (
      <Button type="button" variant="ghost" onClick={onClick} className={cn(className, 'h-full rounded-none p-0')}>
        <Icon className="h-5 w-5" />
        <span className="text-[10px] font-medium leading-none">{label}</span>
      </Button>
    )
  }
  return (
    <Link href={href!} className={className}>
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  )
}
