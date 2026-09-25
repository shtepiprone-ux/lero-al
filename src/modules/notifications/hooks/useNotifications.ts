'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/modules/auth/context/AuthContext'
import type { Notification } from '@/types/database'

const PAGE_SIZE = 30

export function useNotifications() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Tracks the current userId for every in-flight fetchAll() to consult after its await —
  // a response for a user who has since signed out (or been replaced by a different user)
  // is dropped instead of repopulating state with the wrong session's rows.
  const userIdRef = useRef(userId)
  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  const fetchAll = useCallback(async () => {
    if (!userId) {
      // No signed-in user — there is nothing to read, and nothing valid to show.
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    const requestedUserId = userId
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, link, is_read, created_at, template_id, template_params')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (requestedUserId !== userIdRef.current) {
      // The signed-in user changed (or signed out) while this request was in flight.
      // Its response belongs to a session that is no longer current; drop it.
      return
    }

    if (error) {
      // Query failed — keep the previously loaded list rather than clearing it.
      console.error('[notifications] fetch failed', error)
      setLoading(false)
      return
    }

    const list = (data ?? []) as Notification[]
    setNotifications(list)
    setUnreadCount(list.filter(n => !n.is_read).length)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchAll()

    if (!userId) return

    const supabase = createClient()
    // cancelled guards against acting on a status callback fired by the hook's own
    // removeChannel() cleanup (a CLOSED status), not only against a real disconnect.
    let cancelled = false
    // Tracks whether the channel has passed through a non-SUBSCRIBED status (error/timeout/
    // close) since it was opened, so a later SUBSCRIBED knows to recover any events missed
    // while disconnected. The very first SUBSCRIBED after mount does not need to refetch —
    // fetchAll() above already ran.
    let hadNonSubscribed = false

    // Subscribe to this user's own notifications via Realtime.
    // The filter scopes the subscription; Supabase RLS enforces it server-side too.
    const channel = supabase
      .channel(`user-notifications:user:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => { fetchAll() },
      )
      .subscribe((status: string, err?: Error) => {
        if (cancelled) return

        if (status === 'SUBSCRIBED') {
          if (hadNonSubscribed) {
            fetchAll()
          }
          return
        }

        console.warn(`[notifications] realtime ${status}`, err)
        hadNonSubscribed = true
      })

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId, fetchAll])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAll()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fetchAll])

  return { notifications, unreadCount, loading, refetch: fetchAll }
}
