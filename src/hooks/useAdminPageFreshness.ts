'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_MIN_INTERVAL_MS = 5_000

export function useAdminPageFreshness(minIntervalMs = DEFAULT_MIN_INTERVAL_MS) {
  const router = useRouter()
  const lastRefreshRef = useRef(0)

  const scheduleRefresh = useCallback(() => {
    if (typeof document === 'undefined') return
    if (document.visibilityState !== 'visible') return
    const now = Date.now()
    if (now - lastRefreshRef.current < minIntervalMs) return
    lastRefreshRef.current = now
    router.refresh()
  }, [router, minIntervalMs])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const onFocus = () => scheduleRefresh()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') scheduleRefresh()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [scheduleRefresh])
}
