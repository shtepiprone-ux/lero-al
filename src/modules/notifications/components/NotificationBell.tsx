'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { NotificationCenter } from './NotificationCenter'

export function NotificationBell() {
  const t = useTranslations('notifications')
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, loading, refetch } = useNotifications()

  if (loading) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('title')}
            className={cn(
              'relative rounded-xl',
              open ? 'bg-muted text-foreground' : 'text-muted-foreground',
            )}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full bg-destructive text-2xs font-bold text-destructive-foreground leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <PopoverContent
        role="dialog"
        aria-label={t('title')}
        align="end"
        sideOffset={8}
        className="w-80 max-h-120 gap-0 rounded-xl border bg-background p-0 shadow-lg ring-0 overflow-hidden"
      >
        <NotificationCenter
          notifications={notifications}
          onRead={() => refetch()}
        />
      </PopoverContent>
    </Popover>
  )
}
