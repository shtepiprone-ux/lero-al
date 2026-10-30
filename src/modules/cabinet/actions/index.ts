'use server'

import { createHash, randomBytes } from 'crypto'
import { headers, cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { getBlockedError } from '@/lib/auth/blockCheck'
import { revalidatePath } from 'next/cache'
import type { PreferredCurrency } from '@/types/database'
import { sendEmailChangeEmails } from '@/modules/notifications/lib/emails/emailChange'
import { allPasswordRulesMet } from '@/lib/passwordRules'
import { isE164, isPlainEmail, isProfileNameWithinBound } from '@/lib/security/inputs'
import { sendPasswordChangedEmail } from '@/modules/notifications/lib/emails/passwordChanged'
import { deleteAccount } from '@/lib/account/deleteAccount'
import { emailChangeErrorText as emailError } from '@/modules/cabinet/lib/emailChangeErrors'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveAuthUser(): Promise<string | null> {
  const user = await getUser()
  return user?.id ?? null
}

// ── Re-authentication (Task 923 R70 (a), R80, owner decision D54) ─────────────

/** a Google sign-in counts as proof of the person's presence for this long */
const REAUTH_WINDOW_SECONDS = 10 * 60
/** a password longer than this is not one of ours: it is refused without a call to Auth */
const MAX_PASSWORD_LENGTH = 256

type ReauthFailure = 'invalid_password' | 'reauth_required' | 'rate_limited' | 'reauth_unavailable'

/**
 * A verify-only client: it reads the current session from the cookies for context but does NOT write a new session back (no-op `setAll`). Signing in with it must not
 * overwrite the user's active auth cookie, which could make a later call fail on session state in the Server Action cookie-read/write model.
 * It uses the service-role key: Supabase's CAPTCHA protection refuses a password sign-in without a token, and lets a service-role caller through (Task 923 R153); it is used only for signInWithPassword and its own signOut.
 */
async function createVerifyClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
}

/** the password is checked by Auth's own sign-in, so a wrong attempt counts toward Auth's sign-in limit exactly like the password change does */
async function verifyPassword(email: string, password: string): Promise<'ok' | 'invalid' | 'rate_limited'> {
  const verifyClient = await createVerifyClient()
  const { error } = await verifyClient.auth.signInWithPassword({ email, password })
  if (error) {
    const msg = error.message.toLowerCase()
    return msg.includes('rate limit') || msg.includes('too many') ? 'rate_limited' : 'invalid'
  }
  // the check opened a session of its own; it is ended at once so that every check does not leave a live session behind
  try { await verifyClient.auth.signOut({ scope: 'local' }) } catch { /* best effort */ }
  return 'ok'
}

/** did the person sign in with Google in the last 10 minutes? The verified token's authentication methods (`amr`) carry the method and the time of each sign-in. */
async function hasRecentOAuthSignIn(): Promise<boolean> {
  try {
    const { data, error } = await (await createClient()).auth.getClaims()
    if (error || !data?.claims) return false
    const amr = (data.claims as { amr?: unknown }).amr
    if (!Array.isArray(amr)) return false
    const now = Date.now() / 1000
    return (amr as Array<{ method?: unknown; timestamp?: unknown }>).some(
      (entry) => entry?.method === 'oauth' && typeof entry.timestamp === 'number' && now - entry.timestamp >= 0 && now - entry.timestamp < REAUTH_WINDOW_SECONDS,
    )
  } catch {
    return false
  }
}

// ── The per-person limit of failed re-authentications (Task 923 R81 (b), review 21 finding F2) ───────────────
// Auth's own sign-in limit is counted per server address, and every person's check comes from the server's one address: one attacker's guesses would use up the allowance
// of everyone's password change. The limit below is per PERSON: each wrong current password stores one row in `public.reauth_failures` (hardening v7: the table is reachable
// by the service role only); a person with 5 rows of the last 15 minutes is refused before Auth is called, and a count that cannot be read refuses as well.

/** wrong passwords are counted over this window */
const REAUTH_FAILURE_WINDOW_MS = 15 * 60 * 1000
/** this many wrong passwords in the window block the next attempt */
const REAUTH_FAILURE_LIMIT = 5

type ReauthGate = 'open' | 'blocked' | 'unreadable'

/** may this person try a password now? Used by `reauthenticate` and by the current-password check of `changeCabinetPassword`. */
async function reauthGate(userId: string): Promise<ReauthGate> {
  try {
    const since = new Date(Date.now() - REAUTH_FAILURE_WINDOW_MS).toISOString()
    const { count, error } = await createAdminClient()
      .from('reauth_failures')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since)
    if (error || count === null || count === undefined) return 'unreadable'
    return count >= REAUTH_FAILURE_LIMIT ? 'blocked' : 'open'
  } catch {
    return 'unreadable'
  }
}

/** one wrong password; a failure to store it is logged and never changes the answer the person gets */
async function noteReauthFailure(userId: string): Promise<void> {
  try {
    const { error } = await createAdminClient().from('reauth_failures').insert({ user_id: userId })
    if (error) console.error('reauth: storing a failed attempt failed', { code: error.code })
  } catch {
    console.error('reauth: storing a failed attempt threw')
  }
}

/**
 * does the account have a password? Asks `public.account_has_password`, which reads whether `auth.users` holds one. Auth's providers cannot tell: Supabase adds the `email`
 * provider when an account's address changes (Task 927 D28). `null` when it cannot be read (every caller refuses, never allows)
 */
async function accountHasPassword(userId: string): Promise<boolean | null> {
  try {
    const { data, error } = await createAdminClient().rpc('account_has_password', { p_user: userId })
    if (error || typeof data !== 'boolean') return null
    return data
  } catch {
    return null
  }
}

/**
 * How the signed-in person proves who they are before the e-mail change and the deletion (Task 923 R80): with the current password, or, for an account with none, with a new
 * Google sign-in. The answer is about the caller's OWN account only and decides which field the form shows; the server checks the proof itself every time. `null` when it
 * cannot be read (the form then shows the password field; the action refuses anyone it cannot verify).
 */
export async function getReauthMethod(): Promise<'password' | 'google' | null> {
  const userId = await resolveAuthUser()
  if (!userId) return null
  const hasPassword = await accountHasPassword(userId)
  if (hasPassword === null) return null
  return hasPassword ? 'password' : 'google'
}

/**
 * Proof that the person at the keyboard is the owner of the account, asked before the actions a stolen session must not be able to take (the sign-in e-mail change and the
 * deletion of the account). Returns `null` when proven, else why not.
 *  - an account WITH a password (`auth.users` holds one) must send it; it is checked with a separate client the way the password change does;
 *  - an account WITHOUT one (Google only) needs a Google sign-in within the last 10 minutes, else `reauth_required` and the person signs in with Google again.
 * Anything that cannot be read is refused, never allowed.
 */
async function reauthenticate(user: { id: string; email?: string | null }, password: unknown): Promise<ReauthFailure | null> {
  const hasPassword = await accountHasPassword(user.id)
  if (hasPassword === null) return 'reauth_unavailable'
  if (!hasPassword) return (await hasRecentOAuthSignIn()) ? null : 'reauth_required'
  if (typeof password !== 'string' || password === '' || password.length > MAX_PASSWORD_LENGTH || !user.email) return 'invalid_password'
  // the per-person limit: before Auth is called
  const gate = await reauthGate(user.id)
  if (gate === 'unreadable') return 'reauth_unavailable'
  if (gate === 'blocked') return 'rate_limited'
  try {
    const outcome = await verifyPassword(user.email, password)
    if (outcome === 'ok') return null
    if (outcome === 'rate_limited') return 'rate_limited'      // Auth's own limit: not a wrong password, nothing is counted
    await noteReauthFailure(user.id)
    return 'invalid_password'
  } catch {
    return 'reauth_unavailable'
  }
}

// ── Profile update ────────────────────────────────────────────────────────────

export async function updateCabinetProfile(data: {
  name: string
  phone?: string
  whatsapp?: string
  companyName: string | null
  userType: 'private' | 'agent'
  locationId: number | null
  preferredCurrency: PreferredCurrency
}): Promise<{ error?: string }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized' }
  const blockError = await getBlockedError(userId)
  if (blockError) return { error: blockError }

  // TypeScript types do not exist at runtime: the browser can send any `userType`. A person chooses between exactly these two (Task 923 Revision 7).
  if (data.userType !== 'private' && data.userType !== 'agent') return { error: 'save_failed' }
  // a number is stored only in the form the forms produce (E.164); it ends up in tel: and wa.me addresses (Task 923 Revision 7, S54)
  for (const number of [data.phone, data.whatsapp]) {
    if (number !== undefined && number !== null && number.trim() !== '' && !isE164(number.trim())) return { error: 'invalid_phone' }
  }
  // Task 923 R100: the name is stored trimmed and at most as long as the `users` CHECK of hardening v8b allows; checked before anything is read or written
  if (typeof data.name !== 'string') return { error: 'save_failed' }
  if (!isProfileNameWithinBound(data.name)) return { error: 'name_too_long' }

  const supabase = await createClient()

  // Defense-in-depth: validate currency against active catalog before hitting the DB.
  // Without this, an admin-added currency would fail with raw Postgres 23514.
  const { data: catalogRows } = await supabase
    .from('currencies')
    .select('code')
    .eq('is_active', true)
  const validCodes = new Set((catalogRows ?? []).map(r => r.code as string))
  if (validCodes.size > 0 && !validCodes.has(data.preferredCurrency)) {
    return { error: 'save_failed' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      name: data.name.trim() || null,
      phone: data.phone?.trim() || null,
      whatsapp: data.whatsapp?.trim() || null,
      company_name: data.userType === 'agent' ? (data.companyName?.trim() || null) : null,
      user_type: data.userType,
      location_id: data.locationId,
      preferred_currency: data.preferredCurrency,
    })
    .eq('id', userId)

  if (error) {
    console.error('updateCabinetProfile failed', { error, userId })
    return { error: 'save_failed' }
  }

  revalidatePath('/cabinet')
  return {}
}

// ── Saved searches ────────────────────────────────────────────────────────────

export async function saveSavedSearch(
  rawParams: Record<string, string | string[] | undefined>,
  name: string,
): Promise<{ id?: string; error?: string; code?: 'already_exists' | 'unauthorized' }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized', code: 'unauthorized' }

  // Import canonicalization utilities from the listings module (listings owns saved_searches).
  const { canonicalizeFilters, computeFiltersHash } = await import('@/modules/listings/lib/savedSearchCanonicalize')
  const canonical = canonicalizeFilters(rawParams)
  const hash = computeFiltersHash(canonical)

  // a name is text of a sane length (Task 923 Revision 7); anything else is the default name
  const label = (typeof name === 'string' ? name.trim() : '').slice(0, 100) || 'Search'

  const supabase = await createClient()

  // Deduplication check: reject if the same canonical search already exists for this user.
  const { data: existing } = await supabase
    .from('saved_searches')
    .select('id')
    .eq('user_id', userId)
    .eq('filters_hash', hash)
    .maybeSingle()

  if (existing) return { error: 'already_saved', code: 'already_exists' }

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id:      userId,
      name:         label,
      filters:      canonical,
      filters_hash: hash,
      notify_email: false,
    })
    .select('id')
    .single()

  if (error) {
    // Unique constraint violation: race condition — treat same as duplicate.
    if (error.code === '23505') return { error: 'already_saved', code: 'already_exists' }
    console.error('saveSavedSearch failed', { error, userId })
    return { error: 'save_failed' }
  }

  revalidatePath('/cabinet')
  return { id: data.id }
}

export async function updateLastViewed(id: string): Promise<{ error?: string }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_searches')
    .update({ last_viewed_at: new Date().toISOString(), new_count: 0 })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('updateLastViewed failed', { error, id, userId })
    return { error: 'update_failed' }
  }

  revalidatePath('/cabinet')
  return {}
}

export async function deleteAllSavedSearches(): Promise<{ error?: string }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('deleteAllSavedSearches failed', { error, userId })
    return { error: 'delete_failed' }
  }

  revalidatePath('/cabinet')
  return {}
}

export async function deleteSavedSearch(id: string): Promise<{ error?: string }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)   // belt-and-suspenders: RLS already enforces this

  if (error) {
    console.error('deleteSavedSearch failed', { error, id, userId })
    return { error: 'delete_failed' }
  }

  // Invalidate the cabinet SSR snapshot so cross-tab opens and hard-reloads
  // don't show the deleted search. In-tab UX is handled by local state.
  revalidatePath('/cabinet')
  return {}
}

export async function updateSavedSearchFrequency(
  id: string,
  frequency: 'instant' | 'daily' | 'weekly',
): Promise<{ error?: string }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized' }
  // Runtime check: the union type is erased, the browser can send any string (Task 923 Revision 7).
  if (frequency !== 'instant' && frequency !== 'daily' && frequency !== 'weekly') return { error: 'invalid_frequency' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_searches')
    .update({ notify_frequency: frequency })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('updateSavedSearchFrequency failed', { error, id, userId })
    return { error: 'update_failed' }
  }

  revalidatePath('/cabinet')
  return {}
}

export async function updateSavedSearchNotify(
  id: string,
  notifyEmail: boolean,
): Promise<{ error?: string }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_searches')
    .update({ notify_email: notifyEmail })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('updateSavedSearchNotify failed', { error, id, userId })
    return { error: 'update_failed' }
  }

  // Invalidate the cabinet SSR snapshot so toggling email notify is reflected
  // in other tabs and on hard-reload, not only in the current in-tab state.
  revalidatePath('/cabinet')
  return {}
}

// ── Self-delete ───────────────────────────────────────────────────────────────

export async function deleteOwnAccount(data?: { password?: string }): Promise<{ error?: string }> {
  const user = await getUser()
  const userId = user?.id ?? null
  if (!user || !userId) return { error: 'Unauthorized' }  // N7

  // Re-authentication (Task 923 R70 (a), R80, D54): the current password, or for an account with none a Google sign-in within 10 minutes. Nothing is read or written before it.
  const failure = await reauthenticate(user, data?.password)
  if (failure) return { error: failure === 'reauth_unavailable' ? 'delete_failed' : failure }

  // Task 923 R142: one complete deletion for every role and path (owner decision D30). The Auth user, the profile, the listings and their files go together; the
  // old order (archive, profile row, Auth user) could leave a profile-less account that still signed in, and it archived what the person asked to delete.
  const result = await deleteAccount(userId, { reason: 'self' })
  return result.ok ? {} : { error: 'delete_failed' }
}

// ── Email change ──────────────────────────────────────────────────────────────

const EMAIL_CHANGE_EXPIRY_HOURS = 24

/** requests within one hour that a person's e-mail change may make (a new request and a resend each count) */
const EMAIL_CHANGE_HOURLY_LIMIT = 3

/** how many e-mail change links this account was given in the last hour; `null` when the count cannot be read (the caller then refuses) */
async function emailChangeRequestsLastHour(db: ReturnType<typeof createAdminClient>, userId: string): Promise<number | null> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error } = await db
    .from('email_change_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo)
  if (error || count === null || count === undefined) return null
  return count
}

/**
 * Does ANOTHER account already use this address? Asked through the existing `admin_search_users_by_email` function (a substring match on the full address), then each
 * candidate's own address is compared exactly: one page of `listUsers` saw the first accounts only (Task 923 R66 (d)). `null` when it cannot be decided; the caller refuses.
 */
async function emailUsedByAnother(db: ReturnType<typeof createAdminClient>, email: string, userId: string): Promise<boolean | null> {
  try {
    const { data, error } = await db.rpc('admin_search_users_by_email', { q: email })
    if (error || !Array.isArray(data)) return null
    const candidates = (data as { id: string }[]).map(row => row.id).filter(id => id !== userId)
    for (const id of candidates) {
      const { data: found, error: lookupError } = await db.auth.admin.getUserById(id)
      if (lookupError) return null
      if (found?.user?.email?.toLowerCase() === email) return true
    }
    return false
  } catch {
    return null
  }
}

export async function initiateEmailChange(data: {
  newEmail: string
  locale: string
  requestIp?: string
  /** the current password (Task 923 R70 (a), D54); a Google-only account sends none and needs a Google sign-in within 10 minutes */
  currentPassword?: string
}): Promise<{ error?: string; reason?: 'invalid_password' | 'reauth_required' | 'rate_limited'; pendingEmail?: string }> {
  const user = await getUser()
  const userId = user?.id ?? null
  if (!user || !userId) return { error: 'Unauthorized' }

  // A new address must look like one address (Task 923 Revision 7): the value is stored, put into a verification message and used as the recipient.
  const candidate = typeof data.newEmail === 'string' ? data.newEmail.trim() : ''
  if (!isPlainEmail(candidate)) {
    return { error: emailError('failed', data.locale) }
  }

  // Re-authentication (Task 923 R70 (a), R80, D54): before any read of the limit, any token and any e-mail. A refused attempt writes nothing and sends nothing.
  const failure = await reauthenticate(user, data.currentPassword)
  if (failure === 'invalid_password' || failure === 'reauth_required') return { error: emailError(failure, data.locale), reason: failure }
  if (failure === 'rate_limited') return { error: emailError('rate_limit', data.locale), reason: 'rate_limited' }
  if (failure) return { error: emailError('failed', data.locale) }

  const db = createAdminClient()

  // Rate limit: max 3 requests per hour; a count that cannot be read refuses (Task 923 R66 (d))
  const requests = await emailChangeRequestsLastHour(db, userId)
  if (requests === null || requests >= EMAIL_CHANGE_HOURLY_LIMIT) {
    return { error: emailError('rate_limit', data.locale) }
  }

  // Uniqueness: new email must not belong to another active account
  const newEmailLower = candidate.toLowerCase()
  const { data: authUser } = await db.auth.admin.getUserById(userId)
  const currentEmail = authUser?.user?.email ?? ''

  if (newEmailLower === currentEmail.toLowerCase()) {
    return { error: emailError('same_email', data.locale) }
  }

  const taken = await emailUsedByAnother(db, newEmailLower, userId)
  if (taken === null) return { error: emailError('failed', data.locale) }
  if (taken) {
    return { error: emailError('email_taken', data.locale) }
  }

  // A new request makes every earlier link of this account useless: only the newest link may change the address (Task 923 R66 (d)).
  const { error: retireError } = await db
    .from('email_change_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('consumed_at', null)
  if (retireError) {
    console.error('initiateEmailChange: retiring the earlier links failed', { code: retireError.code })
    return { error: emailError('failed', data.locale) }
  }

  // Store pending email and create single-use token
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()

  const { error: tokenError } = await db.from('email_change_tokens').insert({
    user_id: userId,
    new_email: newEmailLower,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  if (tokenError) {
    console.error('initiateEmailChange: token insert failed', { error: tokenError })
    return { error: emailError('failed', data.locale) }
  }

  // Update pending_email on user row: the link works only while it matches the token's address (consume checks it)
  const { error: pendingError } = await db.from('users').update({ pending_email: newEmailLower }).eq('id', userId)
  if (pendingError) {
    console.error('initiateEmailChange: storing the pending address failed', { code: pendingError.code })
    return { error: emailError('failed', data.locale) }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'
  // Albanian-only policy (Task 251): CTA link routes to /sq/ regardless of user's app locale.
  const verificationUrl = `${siteUrl}/sq/auth/confirm-email?token=${rawToken}`

  const reqHeaders = await headers()
  const ip = reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? reqHeaders.get('x-real-ip')
    ?? undefined
  const userAgent = reqHeaders.get('user-agent') ?? undefined

  await sendEmailChangeEmails({
    userId,
    oldEmail: currentEmail,
    newEmail: newEmailLower,
    verificationUrl,
    locale: data.locale,
    ip,
    userAgent,
  })

  return { pendingEmail: newEmailLower }
}

export async function resendEmailVerification(data: {
  locale: string
}): Promise<{ error?: string }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized' }

  const db = createAdminClient()

  // A resend counts toward the same 3-per-hour limit as a new request; a count that cannot be read refuses (Task 923 R66 (d)).
  const requests = await emailChangeRequestsLastHour(db, userId)
  if (requests === null || requests >= EMAIL_CHANGE_HOURLY_LIMIT) {
    return { error: emailError('rate_limit', data.locale) }
  }

  // Find the most recent unconsumed token
  const { data: token } = await db
    .from('email_change_tokens')
    .select('*')
    .eq('user_id', userId)
    .is('consumed_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!token) {
    return { error: emailError('no_active_request', data.locale) }
  }

  // The resend is a NEW link: every earlier link of the account is retired first, then one new token is stored (Task 923 R66 (d)). The old link is not re-armed.
  const { error: retireError } = await db
    .from('email_change_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('consumed_at', null)
  if (retireError) {
    console.error('resendEmailVerification: retiring the earlier links failed', { code: retireError.code })
    return { error: emailError('failed', data.locale) }
  }

  const rawToken = randomBytes(32).toString('hex')
  const newHash = createHash('sha256').update(rawToken).digest('hex')
  const newExpiry = new Date(Date.now() + EMAIL_CHANGE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await db.from('email_change_tokens').insert({
    user_id: userId,
    new_email: (token as { new_email: string }).new_email,
    token_hash: newHash,
    expires_at: newExpiry,
  })
  if (insertError) {
    console.error('resendEmailVerification: token insert failed', { code: insertError.code })
    return { error: emailError('failed', data.locale) }
  }

  const { data: authUser } = await db.auth.admin.getUserById(userId)
  const currentEmail = authUser?.user?.email ?? ''
  const newEmail: string = (token as { new_email: string }).new_email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'
  // Albanian-only policy (Task 251): CTA link routes to /sq/ regardless of user's app locale.
  const verificationUrl = `${siteUrl}/sq/auth/confirm-email?token=${rawToken}`

  await sendEmailChangeEmails({
    userId,
    oldEmail: currentEmail,
    newEmail,
    verificationUrl,
    locale: data.locale,
  })

  return {}
}

// ── Cabinet password change (requires current-password re-verify) ─────────────

type ChangePasswordReason =
  | 'invalid_current'
  | 'weak_password'
  | 'same_password'
  | 'rate_limited'
  | 'session_expired'
  | 'sessions_not_ended'
  | 'server_error'

export async function changeCabinetPassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<{ ok: true } | { ok: false; reason: ChangePasswordReason }> {
  try {
    const { currentPassword, newPassword } = data

    if (!allPasswordRulesMet(newPassword)) return { ok: false, reason: 'weak_password' }
    if (currentPassword === newPassword) return { ok: false, reason: 'same_password' }

    const user = await getUser()
    if (!user?.email) return { ok: false, reason: 'session_expired' }

    // The per-person limit of failed current passwords (Task 923 R81 (b)): before Auth is called; a count that cannot be read refuses.
    const gate = await reauthGate(user.id)
    if (gate === 'unreadable') return { ok: false, reason: 'server_error' }
    if (gate === 'blocked') return { ok: false, reason: 'rate_limited' }

    // Verify-only client (see createVerifyClient): it never writes a session back to the user's cookies.
    const verifyClient = await createVerifyClient()

    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (verifyError) {
      const msg = verifyError.message.toLowerCase()
      if (msg.includes('rate limit') || msg.includes('too many')) return { ok: false, reason: 'rate_limited' }
      await noteReauthFailure(user.id)
      return { ok: false, reason: 'invalid_current' }
    }

    // Use the admin client to apply the password update: no dependency on the SSR
    // session state, so no race between verify-client cookie reads and Server Action
    // response cookie writes. Current password already verified above.
    const admin = createAdminClient()
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password: newPassword })
    if (updateError) return { ok: false, reason: 'server_error' }

    // Every session of this account ends now (Task 923 R156, finding S55): a changed password locks out whoever got hold of the old one, and the person signs in again with the new one.
    // Supabase already ends every session on the password update above; this global sign-out through the request's session client also empties this browser's auth cookie, so the form's local sign-out sends no request.
    // A failure here must not undo the change that was made, and it must not be hidden either: the SDK answers with { error } instead of throwing, so both are read, and the person is told (sessions_not_ended, Task 923 R70 (b)).
    let othersEnded = true
    try {
      const { error: signOutError } = await (await createClient()).auth.signOut({ scope: 'global' })
      if (signOutError) othersEnded = false
    } catch {
      othersEnded = false
    }
    if (!othersEnded) console.error('changeCabinetPassword: the other sessions were not ended', { userId: user.id })

    // Password-changed notification email (Task 276), sent AFTER the response (Task 923 R71 (d)): an e-mail nobody awaits can be dropped in serverless code when the
    // response ends, `after()` keeps the function alive until it is sent. Outside a request there is no response to wait for and `after()` throws: it then starts at once.
    try {
      const { data: profile } = await admin.from('users').select('name').eq('id', user.id).single()
      const recipient = user.email
      const send = () => sendPasswordChangedEmail({ to: recipient, name: profile?.name ?? null })
      // `next/server` is loaded when the work is scheduled, not when this module is: Storybook bundles this module with every component that imports it and cannot run `next/server` in the browser (its import failed the AuthSheet, SaveSearchButton and listing Stories with `__dirname is not defined`).
      try { (await import('next/server')).after(send) } catch { await send() }
    } catch {
      // Best-effort — the password change has already completed.
    }

    // The password HAS changed; only the sign-out of the other devices failed. The answer says so, and the form shows it (not "wrong password", not success).
    if (!othersEnded) return { ok: false, reason: 'sessions_not_ended' }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'server_error' }
  }
}

// ── Email verification (called from the public confirm-email page) ────────────

export async function consumeEmailChangeToken(rawToken: string): Promise<{
  success?: boolean
  /** present and false only when the address changed but the sessions of the account could not be ended (logged; the confirm page does not show it yet) */
  sessionsEnded?: boolean
  error?: string
  errorCode?: 'expired' | 'consumed' | 'invalid'
}> {
  if (typeof rawToken !== 'string' || rawToken === '') return { error: 'invalid_link', errorCode: 'invalid' }
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const db = createAdminClient()

  const { data: token } = await db
    .from('email_change_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .single()

  if (!token) return { error: 'invalid_link', errorCode: 'invalid' }
  if (token.consumed_at) return { error: 'link_already_used', errorCode: 'consumed' }
  if (new Date(token.expires_at) < new Date()) return { error: 'link_expired', errorCode: 'expired' }

  // The link works only for the address the account is waiting for: a newer request moves `pending_email`, so an older link (whatever its state) changes nothing
  // (Task 923 R66 (d)).
  const { data: profile, error: profileError } = await db.from('users').select('pending_email').eq('id', token.user_id).single()
  if (profileError) return { error: 'confirmation_failed', errorCode: 'invalid' }
  if (!profile || typeof profile.pending_email !== 'string' || profile.pending_email.toLowerCase() !== String(token.new_email).toLowerCase()) {
    return { error: 'invalid_link', errorCode: 'invalid' }
  }

  // Claim the token: the UPDATE matches only an unconsumed row and must change exactly ONE row. A second visit (or a parallel one) matches none and is refused, so a
  // link changes the address once (Task 923 R66 (d)).
  const { data: claimed, error: consumeErr } = await db
    .from('email_change_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', token.id)
    .is('consumed_at', null)
    .select('id')

  if (consumeErr) return { error: 'confirmation_failed', errorCode: 'invalid' }
  if (!claimed || claimed.length !== 1) return { error: 'link_already_used', errorCode: 'consumed' }

  // Update Supabase auth email
  const { error: authErr } = await db.auth.admin.updateUserById(token.user_id, {
    email: token.new_email,
    email_confirm: true,
  })

  if (authErr) {
    console.error('consumeEmailChangeToken: auth update failed', { code: authErr.code })
    // The address did not change, so the link must stay usable: the claim is released.
    const { error: releaseErr } = await db.from('email_change_tokens').update({ consumed_at: null }).eq('id', token.id)
    if (releaseErr) console.error('consumeEmailChangeToken: releasing the claim failed', { code: releaseErr.code })
    return { error: 'email_update_failed' }
  }

  // The sign-in address changed: every session of the account ends, so whoever held the old address's session is signed out (Task 923 R66 (d), R65 (c): the database
  // function `end_user_sessions` is the only call that ends a user's sessions by id). A failure does not undo the change; it is reported to the caller.
  let sessionsEnded = true
  try {
    const { error: endError } = await db.rpc('end_user_sessions', { p_user: token.user_id })
    if (endError) sessionsEnded = false
  } catch {
    sessionsEnded = false
  }
  if (!sessionsEnded) console.error('consumeEmailChangeToken: the sessions of the account were not ended', { userId: token.user_id })

  // Clear pending_email; its error is read (a left-over pending address would show "verification pending" for an address that is already the account's own)
  const { error: clearErr } = await db
    .from('users')
    .update({ pending_email: null })
    .eq('id', token.user_id)
  if (clearErr) console.error('consumeEmailChangeToken: clearing the pending address failed', { code: clearErr.code })

  return sessionsEnded ? { success: true } : { success: true, sessionsEnded: false }
}
