'use client'

/**
 * AuthRedirect — bridge between /auth/login and the canonical AuthSheet drawer.
 *
 * This component is only rendered when SSR confirmed the user is NOT authenticated
 * (LoginPage redirects authenticated users away before rendering this). Its jobs:
 *
 *   1. On mount: store the post-login destination in sessionStorage, then open the
 *      AuthSheet. The auth sheet is opened exactly once per mount.
 *   2. Status watcher: if auth state reaches `authenticated` (login succeeded),
 *      redirect to the login destination (next param or /{locale}/cabinet).
 *   3. Cancel/dismiss: when the AuthSheet closes without login (`lero:auth-sheet-closed`
 *      from Header), redirect to the cancel destination (next param or /{locale}).
 *
 * Two distinct fallbacks when there is no valid `?next=` param:
 *   • Login success  → /{locale}/cabinet  (authenticated space, now accessible)
 *   • Cancel/dismiss → /{locale}          (always public; prevents gated-route loop
 *                                          if cancel used cabinet as fallback)
 *
 * When `?next=` is present and valid (e.g. gated-route redirect), both paths use
 * it — the user was heading there deliberately.
 *
 * Task 159 / Sprint 4
 */

import { useEffect, useRef, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { openAuthSheet, AUTH_SHEET_CLOSED_EVENT, type AuthSheetView } from '@/lib/auth/authSheet'
import { sanitizeReturnTo } from '@/modules/auth/lib/sanitizeReturnTo'
import { useUser } from '@/modules/auth/hooks/useUser'

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
  const locale = useLocale()
  const router = useRouter()
  const { status } = useUser()

  const validNext = sanitizeReturnTo(next)

  // Where to go after successful login.
  // Falls back to cabinet (authenticated space) when there is no explicit next.
  const loginDestination = useMemo(
    () => validNext ?? `/${locale}/cabinet`,
    [validNext, locale],
  )

  // Where to go on cancel/dismiss.
  // Falls back to home (always public) — prevents a cabinet→login loop when
  // cabinet is gated and the user cancels without authenticating.
  const cancelDestination = useMemo(
    () => validNext ?? `/${locale}`,
    [validNext, locale],
  )

  // Guard: open the auth sheet exactly once per mount.
  const sheetOpenedRef = useRef(false)

  // ── Auth-state watcher ────────────────────────────────────────────────────────
  // Fires when status resolves. Authenticated → redirect to login destination.
  // Unauthenticated → open the auth sheet once; store loginDestination so
  // LoginView.handleSubmit navigates away instead of calling router.refresh().
  useEffect(() => {
    // Skip transient states — syncFromServer is in flight.
    if (status === 'initializing' || status === 'refreshing') return

    if (status === 'authenticated') {
      // LoginPage's SSR redirect should have caught this already, but guard
      // client-side too (e.g. login completes inside AuthSheet on this page).
      sessionStorage.removeItem(AUTH_NEXT_KEY)
      router.replace(loginDestination)
      return
    }

    // Unauthenticated: store login destination and open auth sheet (once).
    if (!sheetOpenedRef.current) {
      sheetOpenedRef.current = true
      sessionStorage.setItem(AUTH_NEXT_KEY, loginDestination)
      if (sessionLost) sessionStorage.setItem(AUTH_SESSION_LOST_KEY, 'true')
      openAuthSheet(view)
    }
  }, [view, sessionLost, status, loginDestination, router])

  // ── Cancel / dismiss watcher ──────────────────────────────────────────────────
  // Header dispatches AUTH_SHEET_CLOSED_EVENT whenever the AuthSheet closes
  // (both on login success and on dismiss). Since AuthRedirect only mounts on
  // /auth/login, this listener is removed automatically when the component unmounts.
  useEffect(() => {
    function handleSheetClosed() {
      // Login success is handled by the status watcher above — skip here.
      if (status === 'authenticated') return
      sessionStorage.removeItem(AUTH_NEXT_KEY)
      router.replace(cancelDestination)
    }
    window.addEventListener(AUTH_SHEET_CLOSED_EVENT, handleSheetClosed)
    return () => window.removeEventListener(AUTH_SHEET_CLOSED_EVENT, handleSheetClosed)
  }, [cancelDestination, status, router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={tc('loading')} />
    </div>
  )
}
