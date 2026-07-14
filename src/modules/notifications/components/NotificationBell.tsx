'use client'

import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { NotificationBellView } from './NotificationBellView'

export function NotificationBell() {
  const { notifications, unreadCount, loading, refetch } = useNotifications()

  if (loading) return null

  return (
    <NotificationBellView
      notifications={notifications}
      unreadCount={unreadCount}
      onRead={refetch}
    />
  )
}
