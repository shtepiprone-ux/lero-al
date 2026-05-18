'use client'

import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { markNotificationRead } from '@/modules/notifications/lib/mutations'
import type { Notification, NotificationType } from '@/types/database'

const TYPE_ICON: Record<NotificationType, string> = {
  new_message:            '💬',
  listing_status_change:  '🏠',
  saved_search_match:     '🔔',
  support_reply:          '🎧',
  listing_expires_soon:   '⏰',
  agent_verified:         '✅',
  marketing:              '📢',
}

interface Props {
  notification: Notification
  onRead: () => void
}

export function NotificationItem({ notification, onRead }: Props) {
  const t = useTranslations('notifications')
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (notification.is_read) return
    startTransition(async () => {
      await markNotificationRead(notification.id)
      onRead()
    })
  }

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors',
        !notification.is_read && 'bg-primary/5',
        !notification.is_read && !isPending && 'cursor-pointer hover:bg-primary/10',
        isPending && 'opacity-60',
      )}
      onClick={handleClick}
      role={!notification.is_read ? 'button' : undefined}
      tabIndex={!notification.is_read ? 0 : undefined}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
    >
      <span className="text-base shrink-0 mt-0.5" aria-hidden>
        {TYPE_ICON[notification.type] ?? '🔔'}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !notification.is_read && 'font-medium')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.type === 'saved_search_match'
            ? t('saved_search_match_body', { count: parseInt(notification.body) || 1 })
            : notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notification.is_read && (
        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" aria-label={t('unread_count', { count: 1 })} />
      )}
    </div>
  )

  if (notification.link) {
    return (
      <a href={notification.link} className="block hover:no-underline" onClick={handleClick}>
        {content}
      </a>
    )
  }

  return content
}
