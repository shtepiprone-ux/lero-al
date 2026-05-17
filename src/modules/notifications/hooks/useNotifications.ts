'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'

const PAGE_SIZE = 30

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const fetchAll = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, link, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    const list = (data ?? []) as Notification[]
    setNotifications(list)
    setUnreadCount(list.filter(n => !n.is_read).length)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()

    const supabase = createClient()
    // Subscribe to own notifications via Realtime.
    // Supabase RLS filters to the authenticated user's rows server-side.
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => { fetchAll() },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAll])

  return { notifications, unreadCount, loading, refetch: fetchAll }
}
