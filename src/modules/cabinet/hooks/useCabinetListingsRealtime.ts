'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CabinetListingRealtimeEvent =
  | { type: 'UPDATE'; listingId: string; patch: CabinetListingPatch }
  | { type: 'DELETE'; listingId: string }

// Only scalar fields safely mergeable from postgres_changes payload.new.
// Joined relations (listing_images) are absent from realtime payloads.
export type CabinetListingPatch = {
  status?:       string
  price?:        number
  currency?:     string
  is_premium?:   boolean
  views_count?:  number
  title?:        string
  slug?:         string
}

interface Options {
  userId: string
  onEvent: (event: CabinetListingRealtimeEvent) => void
}

export function useCabinetListingsRealtime({ userId, onEvent }: Options) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    let cancelled = false

    const supabase = createClient()

    const channel = supabase
      .channel(`cabinet-listings:user:${userId}`)
      .on(
        'postgres_changes' as const,
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          if (payload.eventType === 'UPDATE') {
            const listingId = payload.new?.id as string | undefined
            const payloadUserId = payload.new?.user_id as string | undefined

            if (!listingId) return

            if (payloadUserId !== userId) {
              console.warn('[CabinetListingsRealtime] user_id mismatch — skipped', { payloadUserId, userId })
              return
            }

            if (cancelled) return

            const patch: CabinetListingPatch = {}
            if ('status'      in payload.new) patch.status      = payload.new.status as string
            if ('price'       in payload.new) patch.price       = payload.new.price as number
            if ('currency'    in payload.new) patch.currency    = payload.new.currency as string
            if ('is_premium'  in payload.new) patch.is_premium  = payload.new.is_premium as boolean
            if ('views_count' in payload.new) patch.views_count = payload.new.views_count as number
            if ('title'       in payload.new) patch.title       = payload.new.title as string
            if ('slug'        in payload.new) patch.slug        = payload.new.slug as string

            onEventRef.current({ type: 'UPDATE', listingId, patch })
          } else if (payload.eventType === 'DELETE') {
            const listingId = payload.old?.id as string | undefined
            const payloadUserId = payload.old?.user_id as string | undefined

            if (!listingId) {
              console.warn('[CabinetListingsRealtime] DELETE payload missing id — REPLICA IDENTITY FULL not set?')
              return
            }

            if (payloadUserId !== userId) {
              console.warn('[CabinetListingsRealtime] user_id mismatch — skipped', { payloadUserId, userId })
              return
            }

            if (cancelled) return

            onEventRef.current({ type: 'DELETE', listingId })
          }
        },
      )
      .subscribe((status: string, err?: Error) => {
        if (err) {
          console.error('[CabinetListingsRealtime] subscription error', { error: err, userId, status })
        }
      })

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId]) // re-subscribe only if userId changes
}
