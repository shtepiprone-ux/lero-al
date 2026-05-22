'use client'

import { useEffect } from 'react'
import { recordListingView } from '../actions/recentlyViewedActions'

interface Props {
  listingId: string
}

/**
 * Fires `recordListingView` 1 500 ms after the user lands on a listing detail page.
 * The delay filters bounce-backs and accidental clicks, matching the ViewTracker pattern.
 *
 * StrictMode safety: the cleanup cancels the pending timer on the first mount;
 * only the second mount's timer completes — so the server action fires exactly once.
 *
 * Speculation Rules guard: deferred until the prerender is activated
 * (same as ViewTracker) so prerenders don't pollute history.
 */
export function RecentlyViewedTracker({ listingId }: Props) {
  useEffect(() => {
    let timerId: number | undefined

    function scheduleRecord() {
      timerId = window.setTimeout(() => {
        recordListingView(listingId).catch(() => {
          // Network / server error — silent, never blocks UX
        })
      }, 1500)
    }

    if ((document as Document & { prerendering?: boolean }).prerendering) {
      document.addEventListener('prerenderingchange', scheduleRecord, { once: true })
    } else {
      scheduleRecord()
    }

    return () => {
      if (timerId !== undefined) window.clearTimeout(timerId)
      document.removeEventListener('prerenderingchange', scheduleRecord)
    }
  }, [listingId])

  return null
}
