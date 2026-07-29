'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Home, Search, Plus, Heart, User } from 'lucide-react'
import { Box, UnstyledButton } from '@mantine/core'
import { cn } from '@/lib/utils'

export interface MobileBottomNavActive {
  home: boolean; listings: boolean; add: boolean; favorites: boolean; profile: boolean
}

export interface MobileBottomNavViewProps {
  isAuthenticated: boolean
  locale: string
  active: MobileBottomNavActive
  /** Guest branch only — opens the auth sheet. */
  onRequireAuth: () => void
  /**
   * Production passes `true`; the canonical Story omits it so the bar renders at the gate's
   * desktop-1024 cell instead of producing a blank screenshot (kickoff §3.5).
   */
  hideFromMd?: boolean
}

export function MobileBottomNavView({
  isAuthenticated, locale, active, onRequireAuth, hideFromMd,
}: MobileBottomNavViewProps) {
  const t = useTranslations('nav')
  const tc = useTranslations('common')

  return (
    <Box
      component="nav"
      hiddenFrom={hideFromMd ? 'md' : undefined}
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 bg-card border-t shadow-[0_-2px_16px_rgba(0,0,0,0.08)] flex items-stretch h-14" // design-tokens-allow: shadow-[0_-2px_16px_rgba(0,0,0,0.08)] — bespoke upward nav shadow (negative-y offset); no --shadow-* token matches upward direction (Task 408 detector blind spot)
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={tc('aria_main_nav')}
    >
      <BottomNavItem href={`/${locale}`}             icon={Home}   label={t('home')}        active={active.home} />
      <BottomNavItem href={`/${locale}/listings`}    icon={Search} label={t('listings')}    active={active.listings} />

      {/* Centre add-listing button — elevated FAB style */}
      <Link
        href={`/${locale}/listings/create`}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 -mt-3 group"
        aria-label={t('add_listing')}
      >
        <span className={cn(
          'h-12 w-12 rounded-full flex items-center justify-center shadow-lg ring-2 ring-background transition-transform duration-150 group-active:scale-95',
          active.add ? 'bg-primary/90 ring-primary/20' : 'bg-primary',
        )}>
          <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
        </span>
        <span
          className="text-[10px] font-medium text-muted-foreground leading-none" // design-tokens-allow: text-[10px] — primary MobileBottomNav FAB label; interactive/mobile-critical nav text (MobileBottomNav protection)
        >{t('add_listing')}</span>
      </Link>

      {isAuthenticated ? (
        <BottomNavItem href={`/${locale}/favorites`} icon={Heart} label={t('favorites')} active={active.favorites} />
      ) : (
        <BottomNavItem onClick={onRequireAuth} icon={Heart} label={t('favorites')} active={active.favorites} />
      )}
      {isAuthenticated ? (
        <BottomNavItem href={`/${locale}/cabinet`} icon={User} label={t('profile')} active={active.profile} />
      ) : (
        <BottomNavItem onClick={onRequireAuth} icon={User} label={t('login')} active={active.profile} />
      )}
    </Box>
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
      <UnstyledButton type="button" onClick={onClick} className={cn(className, 'h-full rounded-none p-0')}>
        <Icon className="h-5 w-5" />
        <span
          className="text-[10px] font-medium leading-none" // design-tokens-allow: text-[10px] — primary MobileBottomNav nav item label; interactive/mobile-critical nav text (MobileBottomNav protection)
        >{label}</span>
      </UnstyledButton>
    )
  }
  return (
    <Link href={href!} className={className}>
      <Icon className="h-5 w-5" />
      <span
        className="text-[10px] font-medium leading-none" // design-tokens-allow: text-[10px] — primary MobileBottomNav nav item label; interactive/mobile-critical nav text (MobileBottomNav protection)
      >{label}</span>
    </Link>
  )
}
