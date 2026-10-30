/**
 * The one completion of every Google sign-in (Task 927 Amendment 5): the sheet's login and Welcome back views and the header's One Tap all end here.
 * The credential and the raw nonce stay in this call: only the remembered account's four fields are kept, and only after Supabase accepted the token.
 */
import { signInWithGoogleIdToken } from '@/lib/auth/browser'
import { rememberedAccountFromCredential, saveRememberedGoogleAccount } from '@/lib/auth/rememberedGoogleAccount'
import { mapAuthError } from '@/modules/auth/lib/mapAuthError'
import { sanitizeReturnTo } from '@/modules/auth/lib/sanitizeReturnTo'

/** Signs in with the credential and this attempt's raw nonce. Returns an `auth` i18n key for the error to show, or `null` on success. */
export async function completeGoogleSignIn({ credential, nonce }: { credential: string; nonce: string }): Promise<string | null> {
  let result: Awaited<ReturnType<typeof signInWithGoogleIdToken>>
  try {
    result = await signInWithGoogleIdToken(credential, nonce)
  } catch {
    return 'error_generic'
  }
  if (result.error) return mapAuthError(result.error.message)
  const account = rememberedAccountFromCredential(credential)
  if (account) saveRememberedGoogleAccount(account)
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
