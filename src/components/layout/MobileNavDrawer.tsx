'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Avatar, Button } from '@mantine/core'
import { LogOut } from 'lucide-react'
import { MantineDrawer } from '@/design-system/mantine/patterns'

type MobileAuthView = 'login' | 'register' | 'register-agent'

export interface MobileNavDrawerProps {
  opened: boolean
  onClose: () => void
  user: { name: string | null; avatar_url: string | null } | null
  locale: string
  onNavigate: (path: string) => void
  onOpenAuth: (view: MobileAuthView) => void
  onLogout: () => void
}

const navLinkClass = 'text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'

export function MobileNavDrawer({ opened, onClose, user, locale, onNavigate, onOpenAuth, onLogout }: MobileNavDrawerProps) {
  const t = useTranslations('nav')

  function navigate(path: string) {
    onClose()
    onNavigate(path)
  }

  function openAuth(view: MobileAuthView) {
    onClose()
    onOpenAuth(view)
  }

  function logout() {
    onLogout()
    onClose()
  }

  return (
    <MantineDrawer opened={opened} onClose={onClose} side="right" size="xs">
      <div className="flex flex-col gap-6">
        {user && (
          <div className="flex items-center gap-3 pb-4 border-b">
            <Avatar src={user.avatar_url ?? undefined} name={user.name ?? undefined} color="brand" size={40} />
            <div>
              <p className="font-medium text-sm">{user.name}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-4">
          <Link href={`/${locale}`} className={navLinkClass} onClick={() => navigate(`/${locale}`)}>
            {t('home')}
          </Link>
          <Link href={`/${locale}/listings`} className={navLinkClass} onClick={() => navigate(`/${locale}/listings`)}>
            {t('listings')}
          </Link>
          {user && (
            <>
              <Link href={`/${locale}/cabinet`} className={navLinkClass} onClick={() => navigate(`/${locale}/cabinet`)}>
                {t('profile')}
              </Link>
              <Link
                href={`/${locale}/cabinet?tab=listings`}
                className={navLinkClass}
                onClick={() => navigate(`/${locale}/cabinet?tab=listings`)}
              >
                {t('my_listings')}
              </Link>
              <Link href={`/${locale}/favorites`} className={navLinkClass} onClick={() => navigate(`/${locale}/favorites`)}>
                {t('favorites')}
              </Link>
              <Link
                href={`/${locale}/listings/create`}
                className={navLinkClass}
                onClick={() => navigate(`/${locale}/listings/create`)}
              >
                {t('add_listing')}
              </Link>
            </>
          )}
        </nav>

        {!user && (
          <div className="border-t pt-4 flex flex-col gap-2">
            <Button variant="default" fullWidth onClick={() => openAuth('login')}>
              {t('login')}
            </Button>
            <Button variant="filled" fullWidth onClick={() => openAuth('register')}>
              {t('register')}
            </Button>
            {/* §6a-link — STOP-AND-ASK resolved (owner 2026-07-13): left-aligned, no icon today,
                consistent with the Logout link below; centered/iconed is a flagged follow-up, not this task. */}
            <Button
              variant="transparent"
              fullWidth
              justify="flex-start"
              styles={{ root: { paddingLeft: 0 } }}
              onClick={() => openAuth('register-agent')}
            >
              {t('register_agent')}
            </Button>
          </div>
        )}

        {user && (
          <div className="border-t pt-4">
            <Button
              variant="transparent"
              color="red"
              fullWidth
              justify="flex-start"
              leftSection={<LogOut size={16} />}
              styles={{ root: { paddingLeft: 0 } }}
              onClick={logout}
            >
              {t('logout')}
            </Button>
          </div>
        )}
      </div>
    </MantineDrawer>
  )
}
