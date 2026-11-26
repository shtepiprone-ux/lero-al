'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useResetOnChange } from '@/hooks/useStateFromProp'
import type { Notification } from '@/types/database'

const PAGE_SIZE = 30

// The caller passes the live session's user id (Task 1053: notifications may not import auth, MODULE_LAYERS in eslint.config.mjs); `null` is signed out.
export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  // Nothing to load for a visitor with no session, so there is nothing to wait for either.
  const [loading, setLoading] = useState(userId !== null)

  // Signing out empties the list at once, in the render that sees the sign-out: a later sign-in never shows the previous user's rows.
  useResetOnChange(userId, () => {
    if (userId === null) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
    }
  })

  // Tracks the current userId for every in-flight fetchAll() to consult after its await —
  // a response for a user who has since signed out (or been replaced by a different user)
  // is dropped instead of repopulating state with the wrong session's rows.
  const userIdRef = useRef(userId)
  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  // Reads the notifications of `requestedUserId` and applies the answer after the read — never synchronously, so an effect can start it.
  const loadFor = useCallback((requestedUserId: string): Promise<void> => {
    const supabase = createClient()
    return Promise.resolve(
      supabase
        .from('notifications')
        .select('id, user_id, type, title, body, link, is_read, created_at, template_id, template_params')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
    ).then(({ data, error }) => {
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
    })
  }, [])

  const fetchAll = useCallback(async () => {
    if (!userId) {
      // No signed-in user — there is nothing to read, and nothing valid to show.
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    await loadFor(userId)
  }, [userId, loadFor])

  useEffect(() => {
    if (!userId) return

    loadFor(userId)

    const supabase = createClient()
    // cancelled guards against acting on a status callback fired by the hook's own
    // removeChannel() cleanup (a CLOSED status), not only against a real disconnect.
    let cancelled = false
    // Tracks whether the channel has passed through a non-SUBSCRIBED status (error/timeout/
    // close) since it was opened, so a later SUBSCRIBED knows to recover any events missed
    // while disconnected. The very first SUBSCRIBED after mount does not need to refetch —
    // fetchAll() above already ran.
    let hadNonSubscribed = false

    let channel: ReturnType<typeof supabase.channel> | null = null

    // Subscribe to this user's own notifications via Realtime.
    // The filter scopes the subscription; Supabase RLS enforces it server-side too.
    // Task 1033: a channel joins with the token the Realtime client holds at that moment, and Realtime checks the filter with the role in it. The client gets the user's
    // token asynchronously, so it is set here first; with the anonymous key the check fails ("invalid column for filter user_id").
    const join = async () => {
      await supabase.realtime.setAuth()
      if (cancelled) return

      channel = supabase
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
    }
    void join()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId, fetchAll, loadFor])

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
