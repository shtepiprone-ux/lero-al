'use client'

import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { NotificationBellView } from './NotificationBellView'

export function NotificationBell() {
  const { notifications, unreadCount, refetch } = useNotifications()

  return (
    <NotificationBellView
      notifications={notifications}
      unreadCount={unreadCount}
      onRead={refetch}
    />
  )
}
