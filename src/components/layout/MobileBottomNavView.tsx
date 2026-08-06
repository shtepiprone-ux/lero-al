'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Home, Search, Plus, Heart, User } from 'lucide-react'
import { Box, UnstyledButton } from '@mantine/core'
import { cn } from '@/lib/utils'
import styles from './MobileBottomNavView.module.css'

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
      className={cn('mobile-bottom-nav', styles.navBar)}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={tc('aria_main_nav')}
    >
      <BottomNavItem href={`/${locale}`}             icon={Home}   label={t('home')}        active={active.home} />
      <BottomNavItem href={`/${locale}/listings`}    icon={Search} label={t('listings')}    active={active.listings} />

      {/* Centre add-listing button — elevated FAB style */}
      <Link
        href={`/${locale}/listings/create`}
        className={styles.fabLink}
        aria-label={t('add_listing')}
      >
        <span className={cn(styles.fab, active.add && styles.fabActive)}>
          <Plus className={styles.fabIcon} strokeWidth={2.5} />
        </span>
        <span className={styles.fabLabel}>{t('add_listing')}</span>
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
  const className = cn(styles.navItem, active && styles.navItemActive)
  if (onClick) {
    return (
      <UnstyledButton type="button" onClick={onClick} className={cn(className, styles.navItemButton)}>
        <Icon className={styles.navItemIcon} />
        <span className={styles.navItemLabel}>{label}</span>
      </UnstyledButton>
    )
  }
  return (
    <Link href={href!} className={className}>
      <Icon className={styles.navItemIcon} />
      <span className={styles.navItemLabel}>{label}</span>
    </Link>
  )
}
