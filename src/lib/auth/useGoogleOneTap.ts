'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { createNoncePair, loadGoogleIdentity, type GoogleAccountsId } from '@/lib/auth/googleIdentity'

interface UseGoogleOneTapOptions {
  /** `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; without it nothing is requested. */
  clientId: string | undefined
  /** Only a guest is offered One Tap. */
  guest: boolean
  /** One Tap never runs over the sign-in sheet: Google keeps one configuration per page, and the sheet's button needs it (Task 927 C79). */
  sheetOpen: boolean
  onCredential: (result: { credential: string; nonce: string }) => Promise<void>
}

/**
 * Google's One Tap account chooser for a guest, once per page (Task 927 Amendment 5, owner decision D16). It renders nothing: Google draws the prompt.
 * A path is handled once it was prompted or once the sheet was open on it, so closing the sheet never raises One Tap on the same page; the next page may.
 * `auto_select` stays `false`: nobody is signed in without a click. Each prompt has its own nonce pair (Google gets the SHA-256 hex, `onCredential` the raw nonce),
 * and the credential and the raw nonce live only in memory. A load failure shows nothing and is not retried on that path.
 */
export function useGoogleOneTap({ clientId, guest, sheetOpen, onCredential }: UseGoogleOneTapOptions) {
  const pathname = usePathname()
  const locale = useLocale()
  const handled = useRef<Set<string>>(new Set())
  const onCredentialRef = useRef(onCredential)
  const localeRef = useRef(locale)

  useEffect(() => {
    onCredentialRef.current = onCredential
    localeRef.current = locale
  })

  useEffect(() => {
    if (!clientId || !guest) return
    if (sheetOpen) {
      handled.current.add(pathname)
      return
    }
    if (handled.current.has(pathname)) return

    let alive = true
    let initialized: GoogleAccountsId | null = null
    let used = false
    void (async () => {
      try {
        const api = await loadGoogleIdentity(localeRef.current)
        if (!alive) return
        const pair = await createNoncePair()
        if (!alive) return
        api.initialize({
          client_id: clientId,
          callback: response => {
            const credential = response.credential
            if (!credential || used || !alive) return
            used = true   // a pair serves one prompt only
            void onCredentialRef.current({ credential, nonce: pair.nonce }).catch(() => undefined)
          },
          nonce: pair.hashedNonce,
          auto_select: false,
          context: 'signin',
          ux_mode: 'popup',
          itp_support: true,
        })
        initialized = api
        handled.current.add(pathname)
        api.prompt()
      } catch {
        // nothing to show: the sheet's button keeps its own unavailable state, and this path is not retried
        if (alive) handled.current.add(pathname)
      }
    })()
    return () => {
      alive = false
      initialized?.cancel()
    }
  }, [clientId, guest, sheetOpen, pathname])
}
