'use client'

import { useEffect } from 'react'

/**
 * Fire-and-forget authenticated presence ping.
 * Calls POST /api/presence once per component mount.
 * The server throttles DB writes to at most once per 15 minutes per user.
 * Never blocks rendering — errors are silently ignored.
 */
export function usePresence() {
  useEffect(() => {
    fetch('/api/presence', { method: 'POST' }).catch(() => {})
  }, [])
}
