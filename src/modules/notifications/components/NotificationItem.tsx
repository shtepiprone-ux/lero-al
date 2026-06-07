'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, it, uk, sq } from 'date-fns/locale'
import type { Locale as DfLocale } from 'date-fns'
import { cn } from '@/lib/utils'

const DF_LOCALE_MAP: Record<string, DfLocale> = { sq, en: enUS, uk, it }
import { markNotificationRead } from '@/modules/notifications/lib/mutations'
import { getListingStatusLabel } from '@/lib/i18n/listingStatusLabel'
import type { Notification, NotificationType } from '@/types/database'

const TYPE_ICON: Record<NotificationType, string> = {
  new_message:            '💬',
  listing_status_change:  '🏠',
  saved_search_match:     '🔔',
  support_reply:          '🎧',
  listing_expires_soon:   '⏰',
  agent_verified:         '✅',
  marketing:              '📢',
  report_outcome:         '🛡️',
  price_change:           '💰',
}

interface Props {
  notification: Notification
  onRead: () => void
}

/**
 * Resolve the display body for a notification, localizing structured payloads.
 *
 * `listing_status_change` stores two formats:
 *   NEW    — JSON `{"from":"pending","to":"active"}` (written by Task 288+)
 *   LEGACY — plain string `"pending → active"` (written before Task 288)
 * Both are resolved to localized labels at render time using the canonical
 * getListingStatusLabel() helper from src/lib/i18n/listingStatusLabel.ts.
 */
function resolveStatusBody(body: string, tl: ReturnType<typeof useTranslations<'listing'>>): string {
  const label = (code: string) => getListingStatusLabel(code, s => tl(s as Parameters<typeof tl>[0]))

  // Try NEW JSON format: {"from":"X","to":"Y"}
  try {
    const parsed = JSON.parse(body) as { from?: string; to?: string }
    if (parsed && typeof parsed.from === 'string' && typeof parsed.to === 'string') {
      return `${label(parsed.from)} → ${label(parsed.to)}`
    }
  } catch {
    // not JSON — fall through to legacy parser
  }

  // Legacy format: "pending → active" (rows written before Task 288)
  const legacyMatch = body.match(/^(\w+)\s*→\s*(\w+)$/)
  if (legacyMatch) {
    return `${label(legacyMatch[1])} → ${label(legacyMatch[2])}`
  }

  // Unknown format — show as-is (safe fallback)
  return body
}

export function NotificationItem({ notification, onRead }: Props) {
  const t = useTranslations('notifications')
  const tl = useTranslations('listing')
  const locale = useLocale()
  const dfLocale = DF_LOCALE_MAP[locale] ?? enUS
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
            : notification.type === 'listing_status_change'
              ? resolveStatusBody(notification.body, tl)
              : notification.body}
        </p>
        <p className="text-2xs text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dfLocale })}
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
