'use client'

import { useEffect } from 'react'
import { useAuth } from '@/modules/auth/context/AuthContext'

// Triggers a server-side auth re-sync after the signup-confirmation redirect.
// /auth/confirm establishes the session server-side and sets cookies on the
// redirect response. The SSR of this page reads those cookies and initialises
// the AuthProvider with the authenticated user. This bridge calls refreshUser()
// once on mount so any browser-SDK / hydration timing edge is resolved and the
// header reflects the correct session state without a manual page refresh.
export function VerifiedBridge() {
  const { refreshUser } = useAuth()

  useEffect(() => {
    refreshUser()
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
