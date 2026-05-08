'use client'

import { useEffect } from 'react'

interface Props {
  slug: string
}

export function ViewTracker({ slug }: Props) {
  useEffect(() => {
    const controller = new AbortController()

    // Delay by 1500 ms before firing the view increment.
    // Rationale: firing immediately on mount means bots, accidental clicks,
    // and back-navigation all inflate view counts. A 1.5 s delay ensures the
    // user has genuinely started reading before the POST is sent.
    //
    // StrictMode safety: the timer is cleared by cleanup before it fires on
    // the first (discarded) mount. Only the second mount's timer completes,
    // preserving the "exactly one POST per real mount" guarantee.
    const timer = window.setTimeout(() => {
      fetch(`/api/listings/${slug}/view`, {
        method: 'POST',
        signal: controller.signal,
      }).catch(() => {})
    }, 1500)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [slug])

  return null
}
