'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCheck } from 'lucide-react'
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
    <div className="w-80 max-h-[480px] flex flex-col overflow-hidden rounded-xl border bg-background shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <p className="text-sm font-semibold">{t('title')}</p>
        {hasUnread && (
          <button
            onClick={handleMarkAll}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t('mark_all_read')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y">
        {notifications.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onRead={onRead} />
          ))
        )}
      </div>
    </div>
  )
}
