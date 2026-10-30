/**
 * Google sign-in for the sign-in sheet (Task 927): the Google Identity Services (GIS) script loader for One Tap, the per-attempt nonce and state, and the address of Google's
 * account chooser for the sign-in button's popup.
 *
 * Supabase wants the SHA-256 hex of the nonce at Google and the RAW nonce at `signInWithIdToken`, so a replayed ID token cannot sign anybody in.
 * Browser-only: it touches `window`, `document` and `crypto`.
 */

export const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const SCRIPT_ID = 'google-identity-services'

export interface GoogleCredentialResponse {
  credential?: string
}

export interface GoogleIdInitializeConfig {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  nonce: string
  auto_select: false
  context: 'signin'
  ux_mode: 'popup'
  /** Preselects an account. The sign-in button gives its hint (the profile's own e-mail, or the remembered account's `sub`) in the address of its popup, `googleAuthorizationUrl`. */
  login_hint?: string
  /** Enables the upgraded One Tap on ITP browsers; set only by the One Tap hook. */
  itp_support?: true
}

/** The calls of `google.accounts.id` this app uses: only One Tap (`useGoogleOneTap`) needs them. The sign-in button is our own and draws no Google script (Task 927 D25). */
export interface GoogleAccountsId {
  initialize: (config: GoogleIdInitializeConfig) => void
  prompt: () => void
  cancel: () => void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } }
  }
}

interface PendingLoad {
  locale: string
  promise: Promise<GoogleAccountsId>
  /** Rejects the promise and removes the script element. */
  cancel: (reason: string) => void
}

let pending: PendingLoad | null = null

/**
 * The library URL of one locale. Google sets the language of its button text, its iframe title and its accessible name from `hl` on this URL as well as from the
 * button's `locale`; without it GIS follows its own default, not the page.
 */
export function googleIdentityScriptUrl(locale: string): string {
  return `${GOOGLE_IDENTITY_SCRIPT_URL}?hl=${encodeURIComponent(locale)}`
}

/**
 * Appends at most one `<script async>` per page, shares one pending promise between callers of the same locale and resolves with `google.accounts.id` after `load`.
 * It rejects on `error`, on the timeout, or when `load` fires without that API; the failed element is then removed so a later call retries.
 * The library is loaded for one locale at a time: a call for another locale removes the element and `window.google` (a load still pending for the old locale is rejected,
 * so no promise is left unsettled) and loads the library for the new one, so a language switch without a full reload also changes Google's text.
 */
export function loadGoogleIdentity(locale: string, timeoutMs = 10000): Promise<GoogleAccountsId> {
  const url = googleIdentityScriptUrl(locale)
  if (pending?.locale === locale) return pending.promise
  const existing = document.getElementById(SCRIPT_ID)
  const ready = window.google?.accounts?.id
  if (ready && (!existing || existing.getAttribute('src') === url)) return Promise.resolve(ready)

  pending?.cancel('Google Identity Services was reloaded for another language')
  existing?.remove()
  delete window.google

  let cancel: (reason: string) => void = () => undefined
  const promise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = url
    script.async = true
    let settled = false
    const settle = () => {
      settled = true
      clearTimeout(timer)
      if (pending?.promise === promise) pending = null
    }
    const fail = (reason: string) => {
      if (settled) return
      settle()
      script.remove()
      reject(new Error(reason))
    }
    cancel = fail
    const timer = setTimeout(() => fail('Google Identity Services did not load in time'), timeoutMs)
    script.addEventListener('load', () => {
      const api = window.google?.accounts?.id
      if (!api) return fail('Google Identity Services loaded without its API')
      if (settled) return
      settle()
      resolve(api)
    })
    script.addEventListener('error', () => fail('Google Identity Services failed to load'))
    document.head.appendChild(script)
  })
  pending = { locale, promise, cancel }
  return promise
}

/**
 * The claims of a Google ID token's payload; `null` when the token is not three base64url parts or the payload is not a JSON object.
 * Nothing here checks the signature: that is Supabase Auth's to do, so a caller treats every claim as untrusted text.
 */
export function credentialClaims(credential: string): Record<string, unknown> | null {
  const parts = credential.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), char => char.charCodeAt(0))))
    return typeof payload === 'object' && payload !== null && !Array.isArray(payload) ? (payload as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * The `email` claim of a Google ID token's payload, lower-cased; `null` when the token is not three base64url parts, the payload is not JSON or carries no e-mail.
 * Only a guard against confirming with another account: the signature is Supabase Auth's to check, and the server acts only on the session's own account.
 */
export function emailFromCredential(credential: string): string | null {
  const email = credentialClaims(credential)?.email
  return typeof email === 'string' && email.trim() !== '' ? email.trim().toLowerCase() : null
}

export interface NoncePair {
  /** 32 random bytes in base64: given to `signInWithIdToken`. */
  nonce: string
  /** Lowercase hex SHA-256 of the nonce's UTF-8 bytes: given to Google. */
  hashedNonce: string
}

export async function createNoncePair(): Promise<NoncePair> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const nonce = btoa(String.fromCharCode(...bytes))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))
  const hashedNonce = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  return { nonce, hashedNonce }
}

/** Google's OpenID Connect authorization endpoint: the sign-in button's popup opens it with an ID-token response (Task 927 D25). */
export const GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
/** The page on this origin Google returns the window to; it lies outside the locale middleware and hands the ID token to the opening window. */
export const GOOGLE_CALLBACK_PATH = '/auth/google/callback'

/** A random `state` for one attempt: 32 random bytes in base64url without padding. The callback echoes it, so only the attempt that asked can accept the answer. */
export function createState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export interface GoogleAuthorizationParams {
  clientId: string
  redirectUri: string
  /** The lowercase hex SHA-256 of the attempt's raw nonce: Google puts it in the ID token, Supabase checks the raw one against it. */
  hashedNonce: string
  state: string
  /** The page's locale: the language of Google's window. */
  locale: string
  /** Preselects an account (an e-mail or an ID token `sub`); omitted when not given. */
  loginHint?: string
}

/** The address of Google's account chooser for one attempt. The query is exactly these keys, in this order; `login_hint` only when given. */
export function googleAuthorizationUrl({ clientId, redirectUri, hashedNonce, state, locale, loginHint }: GoogleAuthorizationParams): string {
  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'id_token')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('nonce', hashedNonce)
  url.searchParams.set('state', state)
  url.searchParams.set('prompt', 'select_account')
  url.searchParams.set('hl', locale)
  if (loginHint) url.searchParams.set('login_hint', loginHint)
  return url.toString()
}
