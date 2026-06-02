'use client'

import { useTranslations } from 'next-intl'
import { Clock } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { useLocale } from 'next-intl'

export type HistoryEvent = {
  id: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  actorName: string | null
  createdAt: string
}

type Props = {
  events: HistoryEvent[]
  labelFormatter?: (status: string) => string
  emptyKey?: string
}

export function StatusChangeHistory({ events, labelFormatter, emptyKey }: Props) {
  const t = useTranslations('admin.common.status_control')
  const locale = useLocale()

  if (events.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {t('status_change_history_title')}
        </h4>
        <p className="text-xs text-muted-foreground">
          {emptyKey ? t(emptyKey as 'status_change_history_empty') : t('status_change_history_empty')}
        </p>
      </div>
    )
  }

  // Safe fallback: humanize snake_case → Title Case when no formatter is supplied.
  // Never leaks raw enum values (open, in_progress, …) as user-visible text.
  const humanize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const label = (s: string) => labelFormatter ? labelFormatter(s) : humanize(s)

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {t('status_change_history_title')}
      </h4>
      <ol className="space-y-2">
        {events.map(ev => (
          <li key={ev.id} className="flex items-start gap-2 text-xs">
            <div className="mt-0.5 h-4 w-4 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium">
                  {ev.actorName ?? t('status_change_history_actor_unknown')}
                </span>
                {ev.fromStatus && ev.toStatus && (
                  <span className="text-muted-foreground">
                    {label(ev.fromStatus)} → {label(ev.toStatus)}
                  </span>
                )}
              </div>
              {ev.note && (
                <p className="text-muted-foreground/80 mt-0.5 break-words">{ev.note}</p>
              )}
            </div>
            <span className="text-muted-foreground/60 shrink-0">{formatDate(ev.createdAt, locale)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
