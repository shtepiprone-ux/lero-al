/**
 * The one completion of every Google sign-in (Task 927 Amendment 5): the sheet's login and Welcome back views and the header's One Tap all end here.
 * The credential and the raw nonce stay in this call: only the remembered account's four fields are kept, and only after Supabase accepted the token.
 */
import { signInWithGoogleIdToken } from '@/lib/auth/browser'
import { rememberedAccountFromCredential, saveRememberedGoogleAccount } from '@/lib/auth/rememberedGoogleAccount'
import { mapAuthError } from '@/modules/auth/lib/mapAuthError'
import { sanitizeReturnTo } from '@/modules/auth/lib/sanitizeReturnTo'

/**
 * Task 988 (owner decision O988-3): an account this sign-in created. Supabase Auth writes `created_at` when it creates the account and `last_sign_in_at` when it issues
 * the session of the same request, each from its own clock reading (`internal/tokens/service.go`: `now := s.now(); user.LastSignInAt = &now`), so the two are a few
 * milliseconds apart, never equal; a later sign-in is minutes to months after `created_at`. Ten seconds separates the two.
 */
const NEW_ACCOUNT_WINDOW_MS = 10_000
function isNewAccount(user: { created_at?: string; last_sign_in_at?: string } | null | undefined): boolean {
  const created = Date.parse(user?.created_at ?? '')
  const signedIn = Date.parse(user?.last_sign_in_at ?? '')
  return Number.isFinite(created) && Number.isFinite(signedIn) && signedIn >= created && signedIn - created <= NEW_ACCOUNT_WINDOW_MS
}

/**
 * Signs in with the credential and this attempt's raw nonce. Returns an `auth` i18n key for the error to show, or `null` on success.
 * Task 988: Google sends no sign-up metadata, so the sign-up trigger stores `'sq'`; for an account this sign-in created, `onNewAccount` (the header's
 * `setAccountLocale(<page language>)`: this module may not import the admin module, eslint.config.mjs MODULE_LAYERS) writes the account language before this
 * resolves, so the caller navigates only after it. A failed write never blocks the sign-in.
 */
export async function completeGoogleSignIn({ credential, nonce }: { credential: string; nonce: string }, onNewAccount?: () => Promise<unknown>): Promise<string | null> {
  let result: Awaited<ReturnType<typeof signInWithGoogleIdToken>>
  try {
    result = await signInWithGoogleIdToken(credential, nonce)
  } catch {
    return 'error_generic'
  }
  if (result.error) return mapAuthError(result.error.message)
  const account = rememberedAccountFromCredential(credential)
  if (account) saveRememberedGoogleAccount(account)
  if (onNewAccount && isNewAccount(result.data.user)) {
    try { await onNewAccount() } catch { /* the sign-in stands; the account keeps 'sq' */ }
  }
  return null
}

/** The same destination rule as the password sign-in: only a safe path of this site, removed once used; otherwise the page refreshes. */
export function openStoredDestination(router: { push: (path: string) => void; refresh: () => void }): void {
  const next = sanitizeReturnTo(sessionStorage.getItem('auth_redirect_next'))
  if (next) {
    sessionStorage.removeItem('auth_redirect_next')
    router.push(next)
  } else {
    router.refresh()
  }
}
