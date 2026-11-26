'use client'

import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { NotificationBellView } from './NotificationBellView'

export function NotificationBell({ userId }: { userId: string | null }) {
  const { notifications, unreadCount, refetch } = useNotifications(userId)

  return (
    <NotificationBellView
      notifications={notifications}
      unreadCount={unreadCount}
      onRead={refetch}
    />
  )
}
