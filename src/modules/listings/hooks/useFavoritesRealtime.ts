'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CardListingData } from '@/modules/listings/components/ListingCard'
import { LISTING_SELECT } from '@/modules/listings/lib/listingSelect'

export type FavoritesRealtimeEvent =
  | { type: 'INSERT'; listing: CardListingData }
  | { type: 'DELETE'; listingId: string }

interface FavoriteRow {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

interface Options {
  userId: string
  /**
   * Ref to the set of listing IDs currently in the displayed list.
   * When provided, INSERT events for listings already present are skipped
   * without an extra DB round-trip (avoids the unnecessary fetch).
   * Updated synchronously in the render body of FavoritesShell so the
   * async realtime handler always sees the latest set.
   */
  displayedIdsRef?: { readonly current: ReadonlySet<string> }
  onEvent: (event: FavoritesRealtimeEvent) => void
}

export function useFavoritesRealtime({ userId, displayedIdsRef, onEvent }: Options) {
  // Always-latest callback ref — lets the subscription closure stay stable
  // while callers can update onEvent without re-subscribing.
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`favorites:user:${userId}`)
      .on(
        'postgres_changes' as const,
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${userId}`,
        },
        async (payload: { eventType: string; new: Partial<FavoriteRow>; old: Partial<FavoriteRow> }) => {
          if (payload.eventType === 'INSERT') {
            const listingId = payload.new.listing_id
            if (!listingId) return

            // Skip the fetch if the listing is already in the displayed set.
            // This covers the case where the same tab's optimistic update already
            // added the card, making the realtime echo redundant.
            if (displayedIdsRef?.current.has(listingId)) return

            const { data: listing } = await supabase
              .from('listings')
              .select(LISTING_SELECT)
              .eq('id', listingId)
              .neq('status', 'archived')
              .maybeSingle()

            if (listing) {
              onEventRef.current({ type: 'INSERT', listing: listing as CardListingData })
            }
          } else if (payload.eventType === 'DELETE') {
            // listing_id is available because REPLICA IDENTITY FULL is set on the table.
            // Graceful fallback: if listing_id is absent (migration not applied), skip silently.
            const listingId = payload.old.listing_id
            if (listingId) {
              onEventRef.current({ type: 'DELETE', listingId })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId]) // re-subscribe only if userId changes
}
