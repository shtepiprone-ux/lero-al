'use client'

/**
 * AuthRedirect — bridge between /auth/login and the canonical AuthSheet drawer.
 *
 * The sign-in page renders this component only when SSR found no signed-in viewer
 * (LoginPage redirects authenticated users away before rendering this). The sign-up page
 * renders it with no server check of the viewer (Task 923 R148). Either way an
 * `authenticated` status at mount is re-checked once, below. Its jobs:
 *
 *   1. On mount: store the post-login destination in sessionStorage, then open the
 *      AuthSheet. The auth sheet is opened exactly once per mount.
 *   2. Status watcher: if auth state reaches `authenticated` (login succeeded),
 *      redirect to the login destination (next param or /{locale}/cabinet).
 *      A tab that is already `authenticated` at mount is not trusted: the server just found
 *      no signed-in viewer, so the status is re-checked once (Task 923 R147) and only the
 *      re-check's answer decides — otherwise a deleted account's open tab loops between
 *      this page and the cabinet.
 *   3. Cancel/dismiss: when the AuthSheet closes without login (`lero:auth-sheet-closed`
 *      from Header), redirect to the language home, /{locale} (Task 923 R158). It is never
 *      `next`: that is a gated page, which would send the person straight back to this one.
 *
 * Where the person goes (Task 923 R158, owner D90):
 *   • Sign-in view, a guest → /{locale} at once, with the sheet open (Header owns the sheet's
 *                             state, so it stays open across the navigation); closing it
 *                             leaves the person there as a guest
 *   • Login success         → `next` when valid, else /{locale}/cabinet
 *   • Cancel/dismiss        → /{locale}  (always public)
 *
 * Task 159 / Sprint 4
 */

import { useEffect, useRef, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Center } from '@mantine/core'
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
  const { status, refreshUser } = useUser()

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
    () => `/${locale}`,
    [locale],
  )

  // Guard: open the auth sheet exactly once per mount.
  const sheetOpenedRef = useRef(false)

  // Re-check of a stale `authenticated` status (Task 923 R147, F18). The server found no signed-in
  // viewer for this page, so an `authenticated` status at mount is the state the tab was given
  // when it first loaded and may be stale (the account was deleted or refused since). It is asked
  // of the server once, and only the status that re-check commits is acted on:
  //   pending → mounted `authenticated`, not yet asked        asked   → asked, `refreshing` not yet seen
  //   running → `refreshing` seen, the answer is awaited      settled → acts on the status as usual
  const recheck = useRef<'pending' | 'asked' | 'running' | 'settled'>(status === 'authenticated' ? 'pending' : 'settled')

  // ── Auth-state watcher ────────────────────────────────────────────────────────
  // Fires when status resolves. Authenticated → redirect to login destination.
  // Unauthenticated → open the auth sheet once; store loginDestination so
  // LoginView.handleSubmit navigates away instead of calling router.refresh().
  useEffect(() => {
    if (status === 'initializing') return

    // Skip transient states — syncFromServer is in flight. The re-check, if one is waited for, has started.
    if (status === 'refreshing') {
      if (recheck.current === 'pending' || recheck.current === 'asked') recheck.current = 'running'
      return
    }

    if (recheck.current === 'pending' && status === 'authenticated') {
      recheck.current = 'asked'
      refreshUser()
      return
    }
    if (recheck.current === 'asked') return
    recheck.current = 'settled'

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
      // A page without a session lands on the home page with the sheet open (Task 923 R158, owner D90): closing the sheet leaves the person there as a guest; the stored destination still takes them on after a sign-in.
      if (view === 'login') router.replace(`/${locale}`)
    }
  }, [view, sessionLost, status, loginDestination, locale, router, refreshUser])

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
    <Center mih="60vh" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={tc('loading')} />
    </Center>
  )
}
