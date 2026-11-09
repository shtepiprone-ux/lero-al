'use client'

import { useSyncExternalStore } from 'react'

const MOBILE_QUERY = '(max-width: 1023px)'

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(MOBILE_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

// The browser's own answer to the query, read each time React asks: every hook instance sees the same value.
const getSnapshot = (): boolean => window.matchMedia(MOBILE_QUERY).matches

// Mobile-first on the server and during hydration: the same markup on both sides, corrected right after.
const getServerSnapshot = (): boolean => true

/**
 * Returns true when the viewport is narrower than the lg: breakpoint (1024px).
 *
 * Used to switch between bottom-Sheet (mobile/tablet) and centered Dialog (desktop)
 * in admin components — matches the table↔card boundary in AdminTable (admin-ux-rules §14.3).
 *
 * Starts as `true` on the server and while hydrating (mobile-first default, safe for SSR), then follows the media query.
 * Since dialogs only open after user interaction, the correct value is set by the time
 * any dialog or sheet renders.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
