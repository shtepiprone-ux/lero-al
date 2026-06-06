'use client'

/**
 * AuthRedirect — thin client bridge between server-side redirect()s and the
 * canonical AuthSheet drawer.
 *
 * When gated routes redirect to /auth/login?next=/favorites, this component:
 *   1. Stores `next` in sessionStorage (survives client navigation within the session).
 *   2. Stores `auth_session_lost` in sessionStorage when sessionLost=true so the
 *      LoginView can show a localized session-recovery banner (Task 281).
 *   3. Dispatches the lero:open-auth-sheet event so the Header's AuthSheet opens.
 *   4. Renders only a loading indicator while the drawer opens.
 *
 * After login, AuthSheet's LoginView reads sessionStorage to redirect the user
 * back to the originally-requested route.
 *
 * Task 159 / Sprint 4
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { openAuthSheet, type AuthSheetView } from '@/lib/auth/authSheet'
import { sanitizeReturnTo } from '@/modules/auth/lib/sanitizeReturnTo'

export const AUTH_NEXT_KEY = 'auth_redirect_next'
export const AUTH_SESSION_LOST_KEY = 'auth_session_lost'

interface Props {
  view: AuthSheetView
  /** Post-login redirect path (must start with /). Only set from /auth/login?next=… */
  next?: string
  /** When true, the LoginView shows a session-recovery banner (Task 281). */
  sessionLost?: boolean
}

export function AuthRedirect({ view, next, sessionLost }: Props) {
  const tc = useTranslations('common')
  useEffect(() => {
    // Store the intended destination so AuthSheet can redirect after login.
    // sanitizeReturnTo ensures only same-origin relative paths are accepted.
    const safe = sanitizeReturnTo(next)
    if (safe) {
      sessionStorage.setItem(AUTH_NEXT_KEY, safe)
    }
    // Signal session-recovery state so LoginView can show a banner.
    if (sessionLost) {
      sessionStorage.setItem(AUTH_SESSION_LOST_KEY, 'true')
    }
    openAuthSheet(view)
  }, [view, next, sessionLost])

  return (
    <div className="min-h-[60vh] flex items-center justify-center" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={tc('loading')} />
    </div>
  )
}
