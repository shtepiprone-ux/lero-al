'use client'

import { useState, useEffect } from 'react'

/**
 * Returns true when the viewport is narrower than the lg: breakpoint (1024px).
 *
 * Used to switch between bottom-Sheet (mobile/tablet) and centered Dialog (desktop)
 * in admin components — matches the table↔card boundary in AdminTable (admin-ux-rules §14.3).
 *
 * Starts as `true` (mobile-first default, safe for SSR). Updates on first client render.
 * Since dialogs only open after user interaction, the correct value is set by the time
 * any dialog or sheet renders.
 */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}
