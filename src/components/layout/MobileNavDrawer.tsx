'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Avatar, Button, Divider, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { LogOut } from 'lucide-react'
import { MantineDrawer } from '@/design-system/mantine/patterns'
import styles from './MobileNavDrawer.module.css'

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

export function MobileNavDrawer({ opened, onClose, user, locale, onNavigate, onOpenAuth, onLogout }: MobileNavDrawerProps) {
  const t = useTranslations('nav')
  const theme = useMantineTheme()

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
      <Stack gap="xl">
        {user && (
          // Nested Stack (gap="md"=16px, matching pb-4) so the outer Stack's own gap="xl"
          // (24px, matching gap-6) still lands cleanly between this block and <nav> — Divider
          // itself carries no margin, so nesting is required to reproduce the original's
          // non-uniform 16px-then-24px spacing exactly (see Task 755 report).
          <Stack gap="md">
            <Group gap="sm">
              <Avatar src={user.avatar_url ?? undefined} name={user.name ?? undefined} color="brand" size={theme.other.iconSize.banner} />
              {/* lh=1.625 (leading-relaxed) — this <p> had no explicit leading-* class
                  pre-migration, so globals.css's `p { @apply leading-relaxed }` base rule won
                  over text-sm's own paired 20px line-height (see Task 753/754 finding). */}
              <Text size="sm" fw={500} lh={1.625}>{user.name}</Text>
            </Group>
            <Divider color="var(--border)" />
          </Stack>
        )}

        <Stack component="nav" gap="md">
          <Link href={`/${locale}`} className={styles.navLink} onClick={() => navigate(`/${locale}`)}>
            {t('home')}
          </Link>
          <Link href={`/${locale}/listings`} className={styles.navLink} onClick={() => navigate(`/${locale}/listings`)}>
            {t('listings')}
          </Link>
          {user && (
            <>
              <Link href={`/${locale}/cabinet`} className={styles.navLink} onClick={() => navigate(`/${locale}/cabinet`)}>
                {t('profile')}
              </Link>
              <Link
                href={`/${locale}/cabinet?tab=listings`}
                className={styles.navLink}
                onClick={() => navigate(`/${locale}/cabinet?tab=listings`)}
              >
                {t('my_listings')}
              </Link>
              <Link href={`/${locale}/favorites`} className={styles.navLink} onClick={() => navigate(`/${locale}/favorites`)}>
                {t('favorites')}
              </Link>
              <Link
                href={`/${locale}/listings/create`}
                className={styles.navLink}
                onClick={() => navigate(`/${locale}/listings/create`)}
              >
                {t('add_listing')}
              </Link>
            </>
          )}
        </Stack>

        {!user && (
          // Divider first, then a nested gap="xs"(8px, matching gap-2) group of buttons —
          // same non-uniform-spacing reasoning as the user block above.
          <Stack gap="md">
            <Divider color="var(--border)" />
            <Stack gap="xs">
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
            </Stack>
          </Stack>
        )}

        {user && (
          <Stack gap="md">
            <Divider color="var(--border)" />
            <Button
              variant="transparent"
              color="red"
              fullWidth
              justify="flex-start"
              leftSection={<LogOut size={theme.other.iconSize.standard} />}
              styles={{ root: { paddingLeft: 0 } }}
              onClick={logout}
            >
              {t('logout')}
            </Button>
          </Stack>
        )}
      </Stack>
    </MantineDrawer>
  )
}
