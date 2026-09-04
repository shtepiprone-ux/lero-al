'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ActionIcon, Button, Group, useMantineTheme } from '@mantine/core'
import { Heart } from 'lucide-react'

export interface HeaderActionsProps {
  isAuthenticated: boolean
  favoritesHref: string
  onOpenAuth: (view: 'login' | 'register') => void
  /** NotificationBell — container-owned (own hooks + dynamic ssr:false), passed as a slot; never hook-called here. */
  notificationSlot?: ReactNode
}

export function HeaderActions({ isAuthenticated, favoritesHref, onOpenAuth, notificationSlot }: HeaderActionsProps) {
  const t = useTranslations('nav')
  const theme = useMantineTheme()

  return (
    <>
      {/* Favorites — visible at ALL breakpoints (owner decision 2026-07-11, Task 583; icon-only,
          clause-11 exempt), mirrors the hamburger's canonical icon-only ActionIcon reference
          (variant + 2.75rem/44px min touch target). */}
      {isAuthenticated ? (
        <ActionIcon
          component={Link}
          href={favoritesHref}
          variant="subtle"
          mih={theme.other.touchTarget}
          miw={theme.other.touchTarget}
          aria-label={t('favorites')}
        >
          <Heart size={theme.other.iconSize.roomy} />
        </ActionIcon>
      ) : (
        <ActionIcon
          variant="subtle"
          mih={theme.other.touchTarget}
          miw={theme.other.touchTarget}
          aria-label={t('favorites')}
          onClick={() => onOpenAuth('login')}
        >
          <Heart size={theme.other.iconSize.roomy} />
        </ActionIcon>
      )}

      {notificationSlot}

      {!isAuthenticated && (
        <Group gap="xs" visibleFrom="md">
          <Button variant="subtle" size="sm" onClick={() => onOpenAuth('login')}>
            {t('login')}
          </Button>
          <Button size="sm" onClick={() => onOpenAuth('register')}>
            {t('register')}
          </Button>
        </Group>
      )}
    </>
  )
}
