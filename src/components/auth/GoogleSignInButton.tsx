'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { openGoogleAttempt, prepareGoogleAttempt, type GoogleAttempt } from '@/lib/auth/googlePopup'
import { GoogleSignInSlot, type GoogleSignInNotice, type GoogleSignInPurpose, type GoogleSignInSlotStatus } from './GoogleSignInSlot'

interface GoogleSignInButtonProps {
  /** `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; without it the slot shows the unavailable state and a click opens nothing. */
  clientId: string | undefined
  onCredential: (result: { credential: string; nonce: string }) => Promise<void>
  /** `signin` (default) or `reauth` (the cabinet's re-confirmation: only the unavailable text differs). */
  purpose?: GoogleSignInPurpose
  /** Passed to Google as `login_hint` to preselect an account; omitted when not given. */
  loginHint?: string
}

/** What the person is told when an attempt ends without a credential: nothing for a window they closed themselves. */
function noticeFor(error: unknown): GoogleSignInNotice | null {
  const reason = error instanceof Error ? error.message : ''
  if (reason === 'cancelled') return null
  return reason === 'popup_blocked' ? 'popup_blocked' : 'failed'
}

/**
 * Container of the Google slot (Task 927). The button is our own (Task 927 D25), drawn with the page: a click opens Google's window, which names Lero.al, and the ID token comes back
 * through `/auth/google/callback` to `onCredential`. Every attempt has its own nonce and state: Google gets the SHA-256 hex of the nonce, `onCredential` gets the raw nonce. The
 * credential and the raw nonce live only in memory. No Google script is loaded and `prompt()` is never called: no One Tap here (One Tap is the header's `useGoogleOneTap`) and
 * nothing signs anybody in automatically. A credential that arrives after the button unmounted is dropped.
 * The attempt is prepared ahead (its nonce is hashed, which takes an await) so that the click opens Google's window before any await, as a browser requires of a pop-up (Amendment 11).
 */
export function GoogleSignInButton({ clientId, onCredential, purpose = 'signin', loginHint }: GoogleSignInButtonProps) {
  const locale = useLocale()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<GoogleSignInNotice | null>(null)
  const aliveRef = useRef(false)
  const pendingRef = useRef(false)
  const onCredentialRef = useRef(onCredential)
  const paramsRef = useRef({ clientId, locale, loginHint })
  const attemptRef = useRef<GoogleAttempt | null>(null)
  const generationRef = useRef(0)

  useEffect(() => {
    onCredentialRef.current = onCredential
  })

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      attemptRef.current = null
    }
  }, [])

  /** Prepares the next attempt for the current props into the ref; the one in the ref, and any still being prepared, are dropped. */
  const prepare = useCallback(() => {
    const { clientId: id, locale: pageLocale, loginHint: hint } = paramsRef.current
    const generation = ++generationRef.current
    attemptRef.current = null
    if (!id || !aliveRef.current) return
    prepareGoogleAttempt({ clientId: id, locale: pageLocale, loginHint: hint }).then(
      attempt => { if (aliveRef.current && generation === generationRef.current) attemptRef.current = attempt },
      () => { /* no attempt is ready: a click does nothing */ },
    )
  }, [])

  useEffect(() => {
    paramsRef.current = { clientId, locale, loginHint }
    prepare()
  }, [clientId, locale, loginHint, prepare])

  const handleClick = useCallback(() => {
    const attempt = attemptRef.current
    if (!attempt || pendingRef.current) return
    attemptRef.current = null
    // the window opens here, in the click, before any await
    const credential = openGoogleAttempt(attempt)
    pendingRef.current = true
    setPending(true)
    setNotice(null)
    void (async () => {
      try {
        const result = await credential
        if (!aliveRef.current) return
        try {
          await onCredentialRef.current(result)
        } catch {
          // the handler shows its own error; the next attempt still gets a new nonce and state
        }
      } catch (error) {
        if (aliveRef.current) setNotice(noticeFor(error))
      } finally {
        pendingRef.current = false
        if (aliveRef.current) {
          setPending(false)
          prepare()
        }
      }
    })()
  }, [prepare])

  const status: GoogleSignInSlotStatus = !clientId ? 'unavailable' : pending ? 'pending' : 'ready'
  return <GoogleSignInSlot status={status} notice={notice} purpose={purpose} onClick={handleClick} />
}
