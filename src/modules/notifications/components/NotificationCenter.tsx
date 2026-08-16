'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCheck } from 'lucide-react'
import { Button } from '@mantine/core'
import { markAllNotificationsRead } from '@/modules/notifications/lib/mutations'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '@/types/database'

interface Props {
  notifications: Notification[]
  onRead: () => void
}

export function NotificationCenter({ notifications, onRead }: Props) {
  const t = useTranslations('notifications')
  const [isPending, startTransition] = useTransition()

  function handleMarkAll() {
    if (isPending) return
    startTransition(async () => {
      await markAllNotificationsRead()
      onRead()
    })
  }

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <div data-testid="notification-center" className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Header — Task 593: <640px the mark-all button drops to its own row below the title,
          full-width with flush-left content (owner decision 2026-07-14); >=640px reverts to the
          original single-row layout (title left, button right) byte-for-byte. Task 724 first
          retargeted this from the custom 390px breakpoint token to the canonical 640px `sm`, but
          that retarget was never committed to this file (724R V4 reverted the NotificationCenter.tsx
          portion pending an owner decision superseding 593); Task 749 D-2 (2026-08-15) is that
          decision, so the threshold now moves 390 -> 640 using Tailwind's stock `sm:` breakpoint
          instead of the now-deleted custom token. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b shrink-0">
        <p className="text-sm font-semibold">{t('title')}</p>
        {hasUnread && (
          <Button
            variant="transparent"
            color="brand"
            leftSection={<CheckCheck size={14} />}
            onClick={handleMarkAll}
            disabled={isPending}
            justify="flex-start"
            styles={{ label: { textAlign: 'left' } }}
            className="w-full sm:w-auto"
          >
            {t('mark_all_read')}
          </Button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onRead={onRead} />
          ))
        )}
      </div>
    </div>
  )
}
