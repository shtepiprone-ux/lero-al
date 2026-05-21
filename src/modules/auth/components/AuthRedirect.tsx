'use client'

/**
 * AuthRedirect — thin client bridge between server-side redirect()s and the
 * canonical AuthSheet drawer.
 *
 * When gated routes redirect to /auth/login?next=/favorites, this component:
 *   1. Stores `next` in sessionStorage (survives client navigation within the session).
 *   2. Dispatches the lero:open-auth-sheet event so the Header's AuthSheet opens.
 *   3. Renders only a loading indicator while the drawer opens.
 *
 * After login, AuthSheet's LoginView reads sessionStorage to redirect the user
 * back to the originally-requested route.
 *
 * Task 159 / Sprint 4
 */

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { openAuthSheet, type AuthSheetView } from '@/lib/auth/authSheet'

export const AUTH_NEXT_KEY = 'auth_redirect_next'

interface Props {
  view: AuthSheetView
  /** Post-login redirect path (must start with /). Only set from /auth/login?next=… */
  next?: string
}

export function AuthRedirect({ view, next }: Props) {
  useEffect(() => {
    // Store the intended destination so AuthSheet can redirect after login.
    // Validate: only same-origin paths (start with /) are accepted.
    if (next?.startsWith('/')) {
      sessionStorage.setItem(AUTH_NEXT_KEY, next)
    }
    openAuthSheet(view)
  }, [view, next])

  return (
    <div className="min-h-[60vh] flex items-center justify-center" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading…" />
    </div>
  )
}
