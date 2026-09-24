'use client'

import { useTranslations } from 'next-intl'
import { ActionIcon, Flex, Indicator, useMantineTheme } from '@mantine/core'
import { Bell } from 'lucide-react'
import { MantinePopover } from '@/design-system/mantine/patterns'
import { NotificationCenter } from './NotificationCenter'
import type { Notification } from '@/types/database'

export interface NotificationBellViewProps {
  notifications: Notification[]
  unreadCount: number
  onRead: () => void
}

/**
 * Presentational primitive (Task 591) — the bell trigger (icon-only `ActionIcon`, clause-11
 * exemption) with an unread-count `Indicator`, wrapped in the canonical `MantinePopover`
 * (anchored dropdown ≥640 / full-width bottom sheet <640). Content is `NotificationCenter`.
 * Task 861: the `Indicator` is a role-less wrapper, so the trigger is a render function and the inner
 * `ActionIcon` (the real button) carries `aria-haspopup`/`aria-expanded` itself — never the wrapper root.
 * The inner `Box` reproduces the legacy `PopoverContent`'s `max-h-120` (480px) flex-column cap —
 * `NotificationCenter`'s own `flex-1 min-h-0` list assumes a bounded flex ancestor, which neither
 * `Popover.Dropdown` nor `SheetContent` supplies by default.
 */
export function NotificationBellView({ notifications, unreadCount, onRead }: NotificationBellViewProps) {
  const t = useTranslations('notifications')
  const theme = useMantineTheme()

  return (
    <MantinePopover
      trigger={({ opened }) => (
        <Indicator
          inline
          label={unreadCount > 99 ? '99+' : unreadCount}
          color="red.5"
          size={theme.other.layout.iconButtonIndicatorSize}
          offset={theme.other.layout.iconButtonIndicatorOffset}
          disabled={unreadCount === 0}
        >
          <ActionIcon
            variant="subtle"
            aria-label={t('title')}
            aria-haspopup="dialog"
            aria-expanded={opened}
            mih={theme.other.touchTarget}
            miw={theme.other.touchTarget}
          >
            <Bell size={theme.other.iconSize.roomy} />
          </ActionIcon>
        </Indicator>
      )}
      iconOnlyTrigger
      position="bottom-end"
      width={theme.other.layout.notificationPanelWidth}
    >
      <Flex direction="column" mah={theme.other.layout.notificationPanelMaxHeight} style={{ overflow: 'hidden' }}>
        <NotificationCenter notifications={notifications} onRead={onRead} />
      </Flex>
    </MantinePopover>
  )
}
