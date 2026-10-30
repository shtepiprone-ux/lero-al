/**
 * The Google account this device remembers after a Google sign-in (Task 927 Amendment 5, owner decision D15): only the Google id (`sub`), the name, the masked e-mail
 * and a Google picture URL. The record stays after a sign-out; "Forget this account" and the account's deletion erase it.
 * Never stored: the credential, the nonce, the full e-mail, any other claim. Browser-only: it touches `localStorage`, which can throw (a private window, blocked storage).
 */
import { credentialClaims } from '@/lib/auth/googleIdentity'

export const REMEMBERED_GOOGLE_ACCOUNT_KEY = 'lero:google-account'

export interface RememberedGoogleAccount {
  sub: string
  name: string
  maskedEmail: string
  picture: string | null
}

const SUB_PATTERN = /^[0-9A-Za-z_-]{1,255}$/
const MAX_NAME_LENGTH = 200
const MASK = '•••••'

/** `ar•••••@example.com` for `arta.synthetic@example.com`; `null` unless the value has exactly one `@` with both parts non-empty. */
export function maskEmail(email: string): string | null {
  const parts = email.trim().toLowerCase().split('@')
  if (parts.length !== 2 || parts[0] === '' || parts[1] === '') return null
  const [local, domain] = parts
  const visible = Array.from(local).slice(0, local.length <= 2 ? 1 : 2).join('')
  return `${visible}${MASK}@${domain}`
}

/** A picture is kept only when it is an https URL on Google's own image host (the payload's picture lives on `lh3.googleusercontent.com`). */
function googlePicture(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    const onGoogleHost = host === 'googleusercontent.com' || host.endsWith('.googleusercontent.com')
    return url.protocol === 'https:' && onGoogleHost ? value : null
  } catch {
    return null
  }
}

function validName(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && value.length <= MAX_NAME_LENGTH
}

/** The four fields to remember from a Google ID token, or `null` when it carries no usable `sub` or e-mail. Nothing else of the token is returned. */
export function rememberedAccountFromCredential(credential: string): RememberedGoogleAccount | null {
  const claims = credentialClaims(credential)
  if (!claims) return null
  const sub = claims.sub
  if (typeof sub !== 'string' || !SUB_PATTERN.test(sub)) return null
  const maskedEmail = typeof claims.email === 'string' ? maskEmail(claims.email) : null
  if (!maskedEmail) return null
  const name = typeof claims.name === 'string' ? claims.name.trim() : ''
  return { sub, name: name !== '' && name.length <= MAX_NAME_LENGTH ? name : maskedEmail, maskedEmail, picture: googlePicture(claims.picture) }
}

export function saveRememberedGoogleAccount(account: RememberedGoogleAccount): void {
  try {
    const { sub, name, maskedEmail, picture } = account
    localStorage.setItem(REMEMBERED_GOOGLE_ACCOUNT_KEY, JSON.stringify({ sub, name, maskedEmail, picture }))
  } catch {
    // blocked storage: the device simply remembers nothing
  }
}

export function forgetRememberedGoogleAccount(): void {
  try {
    localStorage.removeItem(REMEMBERED_GOOGLE_ACCOUNT_KEY)
  } catch {
    // blocked storage: nothing to remove
  }
}

const FIELDS = ['maskedEmail', 'name', 'picture', 'sub']

/** The remembered record, or `null`. A stored value that is not exactly the four valid fields is removed: the device never shows what it did not write. */
export function readRememberedGoogleAccount(): RememberedGoogleAccount | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(REMEMBERED_GOOGLE_ACCOUNT_KEY)
  } catch {
    return null
  }
  if (raw === null) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const record = value as Record<string, unknown>
      const sameFields = JSON.stringify(Object.keys(record).sort()) === JSON.stringify(FIELDS)
      const picture = record.picture === null ? null : googlePicture(record.picture)
      if (
        sameFields &&
        typeof record.sub === 'string' && SUB_PATTERN.test(record.sub) &&
        validName(record.name) &&
        typeof record.maskedEmail === 'string' && record.maskedEmail.includes(`${MASK}@`) &&
        (record.picture === null || picture !== null)
      ) {
        return { sub: record.sub, name: record.name, maskedEmail: record.maskedEmail, picture }
      }
    }
  } catch {
    // malformed JSON falls through to the removal below
  }
  forgetRememberedGoogleAccount()
  return null
}
