'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ActionIcon, Button, Group } from '@mantine/core'
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
          mih="2.75rem"
          miw="2.75rem"
          aria-label={t('favorites')}
        >
          <Heart className="size-5" />
        </ActionIcon>
      ) : (
        <ActionIcon
          variant="subtle"
          mih="2.75rem"
          miw="2.75rem"
          aria-label={t('favorites')}
          onClick={() => onOpenAuth('login')}
        >
          <Heart className="size-5" />
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
