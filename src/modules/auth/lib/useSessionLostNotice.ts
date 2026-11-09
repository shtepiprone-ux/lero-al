'use client'

import { useEffect, useState } from 'react'
import { AUTH_SESSION_LOST_KEY } from '@/modules/auth/components/AuthRedirect'

/**
 * True when the session ended while this device was away (the flag `AuthRedirect` stored). It is read once when the view opens and the flag is removed after that, so
 * the next view does not show the same note again. The read is the state's initializer (a plain read of `sessionStorage`, `false` on the server); the removal is an effect.
 */
export function useSessionLostNotice(): boolean {
  const [sessionLost] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem(AUTH_SESSION_LOST_KEY) === 'true')
  useEffect(() => {
    if (sessionLost) sessionStorage.removeItem(AUTH_SESSION_LOST_KEY)
  }, [sessionLost])
  return sessionLost
}
