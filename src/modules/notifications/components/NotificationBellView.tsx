'use client'

import { useTranslations } from 'next-intl'
import { ActionIcon, Box, Indicator } from '@mantine/core'
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
 * The inner `Box` reproduces the legacy `PopoverContent`'s `max-h-120` (480px) flex-column cap —
 * `NotificationCenter`'s own `flex-1 min-h-0` list assumes a bounded flex ancestor, which neither
 * `Popover.Dropdown` nor `SheetContent` supplies by default.
 */
export function NotificationBellView({ notifications, unreadCount, onRead }: NotificationBellViewProps) {
  const t = useTranslations('notifications')

  return (
    <MantinePopover
      trigger={
        <Indicator
          inline
          label={unreadCount > 99 ? '99+' : unreadCount}
          color="red.5"
          size={16}
          offset={4}
          disabled={unreadCount === 0}
        >
          <ActionIcon variant="default" aria-label={t('title')} mih="2.75rem" miw="2.75rem">
            <Bell size={20} />
          </ActionIcon>
        </Indicator>
      }
      iconOnlyTrigger
      position="bottom-end"
      width={320}
    >
      <Box style={{ display: 'flex', flexDirection: 'column', maxHeight: 480, overflow: 'hidden' }}>
        <NotificationCenter notifications={notifications} onRead={onRead} />
      </Box>
    </MantinePopover>
  )
}
