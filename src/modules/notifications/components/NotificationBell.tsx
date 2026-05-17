'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { NotificationCenter } from './NotificationCenter'

export function NotificationBell() {
  const t = useTranslations('notifications')
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { notifications, unreadCount, loading, refetch } = useNotifications()

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  if (loading) return null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(v => !v)}
        aria-label={t('title')}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'relative h-9 w-9 flex items-center justify-center rounded-xl transition-colors',
          open ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-[1rem] px-0.5 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t('title')}
          className="absolute right-0 top-full mt-2 z-50"
        >
          <NotificationCenter
            notifications={notifications}
            onRead={() => refetch()}
          />
        </div>
      )}
    </div>
  )
}
