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
      {/* Notifications — authenticated only (container passes undefined for guests); rendered
          BEFORE Favorites so the two sit adjacent to each other and to the hamburger that follows
          in HeaderView's rightCluster (owner mobile top-bar contract, Task 787: "сповіщення +
          Обране", grouped beside the burger, Favorites nearest it). */}
      {notificationSlot}

      {/* Favorites — authenticated only (Task 787, owner "скрізь" decision 2026-09-04: guests never
          see Add listing or Favorites, mobile or desktop). The prior guest branch that opened the
          auth sheet from a Favorites heart is removed; guests reach login/register only. Icon-only,
          clause-11 exempt, mirrors the hamburger's canonical icon-only ActionIcon reference
          (variant + 2.75rem/44px min touch target). */}
      {isAuthenticated && (
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
      )}

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
