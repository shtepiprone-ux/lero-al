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
   * Ref to the set of listing IDs currently displayed.
   * When provided, INSERT events for already-present listings are skipped
   * without a DB round-trip (dedup optimization).
   * Populated via useEffect([displayedListings]) in FavoritesShell — the committed
   * state is always reflected before any event can arrive.
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
    // Cancellation flag: set true in cleanup so in-flight INSERT fetches that
    // complete after unmount are silently dropped.
    let cancelled = false

    // Race guard: tracks listing IDs that received a DELETE event while their
    // INSERT fetch was still in flight. Without this, a fast DELETE→INSERT→fetch
    // sequence could resurrect a listing the user just unfavorited.
    //
    // Timeline this guards against:
    //   T0: INSERT event fires for listing X → fetch starts
    //   T1: DELETE event fires for listing X → removed from UI
    //   T2: INSERT fetch completes → would add X back (wrong!)
    // With this guard: T2 sees X in deletedDuringFetch → suppresses the add.
    const deletedDuringFetch = new Set<string>()

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

            const { data: listing, error } = await supabase
              .from('listings')
              .select(LISTING_SELECT)
              .eq('id', listingId)
              .neq('status', 'archived')
              .maybeSingle()

            // Bail out if the component unmounted while the fetch was in flight.
            if (cancelled) return

            // Bail out if a DELETE for this listing arrived while the fetch was running.
            if (deletedDuringFetch.has(listingId)) {
              deletedDuringFetch.delete(listingId)
              console.info('[FavoritesRealtime] INSERT superseded by concurrent DELETE — suppressed', { listingId, userId })
              return
            }

            if (listing) {
              onEventRef.current({ type: 'INSERT', listing: listing as CardListingData })
            } else if (error) {
              // DB error during listing fetch — surface for observability.
              console.error('[FavoritesRealtime] listing fetch error', { error, listingId, userId })
            } else {
              // Null result: the listing was deleted or archived between the INSERT
              // event firing and this fetch completing. Expected in concurrent-edit
              // scenarios (e.g. admin archives a listing the user just favorited).
              console.info(
                '[FavoritesRealtime] listing fetch miss — deleted or archived since event',
                { listingId, userId },
              )
            }
          } else if (payload.eventType === 'DELETE') {
            // listing_id is available because REPLICA IDENTITY FULL is set on the table.
            // Graceful fallback: if listing_id is absent (migration not applied), skip silently.
            const listingId = payload.old.listing_id
            if (!listingId) return

            // Register the DELETE so any concurrent INSERT fetch for this ID is suppressed.
            deletedDuringFetch.add(listingId)

            if (!cancelled) {
              onEventRef.current({ type: 'DELETE', listingId })
            }
          }
        },
      )
      .subscribe((status: string, err?: Error) => {
        if (err) {
          console.error('[FavoritesRealtime] subscription error', { error: err, userId, status })
        }
      })

    return () => {
      cancelled = true
      deletedDuringFetch.clear()
      supabase.removeChannel(channel)
    }
  }, [userId]) // re-subscribe only if userId changes
}
