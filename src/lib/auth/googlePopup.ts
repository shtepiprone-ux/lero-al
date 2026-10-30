import { createNoncePair, createState, GOOGLE_CALLBACK_PATH, googleAuthorizationUrl } from './googleIdentity'

/**
 * Google's window for the sign-in button (Task 927 Amendment 10, owner decision D25). A click opens Google's OpenID Connect page in a popup, which names Lero.al; Google returns the
 * window to `/auth/google/callback` on this origin, and that page hands the ID token back to the opening window, here, through `window.opener` and a `BroadcastChannel`.
 * Browser-only: it touches `window`.
 */

/** The `type` of the message the callback page sends. */
export const GOOGLE_SIGN_IN_MESSAGE_TYPE = 'lero:google-sign-in'
/** The channel the callback page also posts on: Google's sign-in pages only report an opener policy today, but if Google ever enforces it the opener is cut and only the channel is left. */
export const GOOGLE_SIGN_IN_CHANNEL = 'lero-google-sign-in'

const POPUP_NAME = 'lero-google-sign-in'
const POPUP_FEATURES = 'popup=yes,width=500,height=640'
const CLOSED_POLL_MS = 500
const TIMEOUT_MS = 5 * 60 * 1000

interface GooglePopupRequest {
  clientId: string
  locale: string
  /** Preselects an account in Google's window; omitted when not given. */
  loginHint?: string
}

export interface GooglePopupResult {
  /** The ID token Google signed. Nothing here checks its signature: that is Supabase Auth's to do. */
  credential: string
  /** The raw nonce of this attempt: Google got only its SHA-256 hex. */
  nonce: string
}

/** One attempt, made ready before the click: its raw nonce (Google gets only the SHA-256 hex), its `state` and Google's address for it. */
export interface GoogleAttempt {
  nonce: string
  state: string
  url: string
}

/**
 * Makes ready one attempt: a new nonce pair, a new `state` and Google's address. The nonce is hashed here, which takes an await, and a browser lets a window open only inside the click
 * itself, so the container prepares the attempt before the click and `openGoogleAttempt` opens the window in the click (Task 927 Amendment 11, R53).
 */
export async function prepareGoogleAttempt({ clientId, locale, loginHint }: GooglePopupRequest): Promise<GoogleAttempt> {
  const { nonce, hashedNonce } = await createNoncePair()
  const state = createState()
  const url = googleAuthorizationUrl({ clientId, redirectUri: window.location.origin + GOOGLE_CALLBACK_PATH, hashedNonce, state, locale, loginHint })
  return { nonce, state, url }
}

/**
 * Opens Google's window for a prepared attempt and resolves with the ID token and that attempt's raw nonce. It is not `async` and opens the window as its first statement, so that, called
 * from a click handler before any await, the window opens inside the click. Call it once per attempt: every attempt has its own nonce and `state`.
 * A message is accepted only when it carries this attempt's `state` and comes from this origin (a window message) or from the channel, which only this origin can join. It rejects with
 * `popup_blocked` when the browser refuses the window, `cancelled` when the window closes or Google reports `access_denied`, `google_error` for any other error Google reports, and
 * `timeout` after 5 minutes. It settles once, then removes the listener, closes the channel, clears its timers and closes the window.
 * The credential and the raw nonce live only in memory: never in storage, the console or an address.
 */
export function openGoogleAttempt(attempt: GoogleAttempt): Promise<GooglePopupResult> {
  const popup = window.open(attempt.url, POPUP_NAME, POPUP_FEATURES)
  if (!popup) return Promise.reject(new Error('popup_blocked'))
  const { nonce, state } = attempt

  return new Promise<GooglePopupResult>((resolve, reject) => {
    let settled = false
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(GOOGLE_SIGN_IN_CHANNEL)

    const finish = (settle: () => void) => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onWindowMessage)
      if (channel) { channel.onmessage = null; channel.close() }
      clearInterval(closedPoll)
      clearTimeout(deadline)
      try { popup.close() } catch { /* the window may be gone already */ }
      settle()
    }

    const handle = (data: unknown) => {
      if (typeof data !== 'object' || data === null) return
      const message = data as { type?: unknown; state?: unknown; credential?: unknown; error?: unknown }
      if (message.type !== GOOGLE_SIGN_IN_MESSAGE_TYPE || message.state !== state) return
      const { credential, error } = message
      if (typeof error === 'string') {
        finish(() => reject(new Error(error === 'access_denied' ? 'cancelled' : 'google_error')))
      } else if (typeof credential === 'string' && credential !== '') {
        finish(() => resolve({ credential, nonce }))
      }
    }

    function onWindowMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      handle(event.data)
    }

    window.addEventListener('message', onWindowMessage)
    if (channel) channel.onmessage = event => handle(event.data)

    // A window closed by the person ends the attempt, but only once this page has focus again: Google's sign-in pages report an opener policy today (not enforced), and were Google
    // to enforce one, `closed` would read true while the person is still on Google's page. A person who closes the window gets the focus back to this page.
    const closedPoll = setInterval(() => {
      if (popup.closed && document.hasFocus()) finish(() => reject(new Error('cancelled')))
    }, CLOSED_POLL_MS)
    const deadline = setTimeout(() => finish(() => reject(new Error('timeout'))), TIMEOUT_MS)
  })
}
