'use server'

import { createHash, randomBytes } from 'crypto'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { getBlockedError } from '@/lib/auth/blockCheck'
import { revalidatePath, revalidateTag } from 'next/cache'
import { routing } from '@/i18n/routing'
import type { PreferredCurrency } from '@/types/database'
import { sendEmailChangeEmails } from '@/modules/notifications/lib/emails/emailChange'
import { allPasswordRulesMet } from '@/lib/passwordRules'
import { sendPasswordChangedEmail } from '@/modules/notifications/lib/emails/passwordChanged'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveAuthUser(): Promise<string | null> {
  const user = await getUser()
  return user?.id ?? null
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
      name:         name.trim() || 'Search',
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
    return { error: error.message }
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
    return { error: error.message }
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
    return { error: error.message }
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
    return { error: error.message }
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

  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_searches')
    .update({ notify_frequency: frequency })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('updateSavedSearchFrequency failed', { error, id, userId })
    return { error: error.message }
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
    return { error: error.message }
  }

  // Invalidate the cabinet SSR snapshot so toggling email notify is reflected
  // in other tabs and on hard-reload, not only in the current in-tab state.
  revalidatePath('/cabinet')
  return {}
}

// ── Self-delete ───────────────────────────────────────────────────────────────

export async function deleteOwnAccount(): Promise<{ error?: string }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized' }

  const db = createAdminClient()

  // Archive all user's listings in one transactional update
  const { error: listingsError } = await db
    .from('listings')
    // eslint-disable-next-line no-restricted-syntax -- bulk cascade during account deletion; applyListingTransition handles single listings only, not bulk user-scoped updates
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .not('status', 'in', '("sold","rented")')

  if (listingsError) {
    console.error('deleteOwnAccount: listings archive failed', { error: listingsError, userId })
  } else {
    // Bulk-archive bypasses the transition gateway (single-listing-only), so we
    // must compensate by manually firing the same cache invalidations the gateway
    // would have triggered. Compare: softDeleteUser/hardDeleteUser in admin actions
    // which correctly use applyListingTransitionByStatus per-listing.
    revalidateTag('site-stats')
    for (const locale of routing.locales) {
      revalidatePath(`/${locale}/listings`, 'page')
    }
  }

  // Soft-delete the user row
  const { error: userError } = await db
    .from('users')
    // eslint-disable-next-line no-restricted-syntax -- UserStatus soft-delete update on users table, not ListingStatus; applyListingTransition not applicable here
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
    .eq('id', userId)

  if (userError) {
    console.error('deleteOwnAccount: user soft-delete failed', { error: userError, userId })
    return { error: 'delete_failed' }
  }

  // Write status history entry
  try {
    await db.from('user_status_history').insert({
      user_id: userId,
      old_status: 'active',
      new_status: 'self_deleted',
      reason: 'User self-deleted account',
      changed_by: userId,
    })
  } catch {}

  // Sign the user out via admin API
  try {
    await db.auth.admin.signOut(userId)
  } catch (e) {
    console.error('deleteOwnAccount: signOut failed', e)
  }

  return {}
}

// ── Email change ──────────────────────────────────────────────────────────────

const EMAIL_CHANGE_EXPIRY_HOURS = 24

const EMAIL_ERRORS: Record<string, Record<string, string>> = {
  rate_limit: {
    sq: 'Shumë kërkesa. Provoni sërish pas një ore.',
    en: 'Too many requests. Please try again in one hour.',
    uk: 'Забагато запитів. Спробуйте за годину.',
    it: 'Troppe richieste. Riprova tra un\'ora.',
  },
  same_email: {
    sq: 'Ky email është tashmë adresa juaj aktuale.',
    en: 'This is already your current email address.',
    uk: 'Це вже ваша поточна електронна адреса.',
    it: 'Questa è già la tua email attuale.',
  },
  email_taken: {
    sq: 'Ky email është tashmë i regjistruar.',
    en: 'This email address is already in use.',
    uk: 'Ця електронна адреса вже використовується.',
    it: 'Questo indirizzo email è già in uso.',
  },
  failed: {
    sq: 'Ndryshimi i emailit dështoi. Provoni sërish.',
    en: 'Could not initiate email change. Please try again.',
    uk: 'Не вдалось ініціювати зміну email. Спробуйте ще раз.',
    it: 'Impossibile avviare il cambio email. Riprova.',
  },
  no_active_request: {
    sq: 'Nuk ka kërkesë aktive ndryshimi email-i. Filloni një të re.',
    en: 'No active email change request found. Please start a new request.',
    uk: 'Немає активного запиту зміни email. Надішліть новий.',
    it: 'Nessuna richiesta di cambio email attiva. Inizia una nuova.',
  },
}

function emailError(key: string, locale: string): string {
  const msgs = EMAIL_ERRORS[key]
  return msgs?.[locale] ?? msgs?.['en'] ?? key
}

export async function initiateEmailChange(data: {
  newEmail: string
  locale: string
  requestIp?: string
}): Promise<{ error?: string; pendingEmail?: string }> {
  const userId = await resolveAuthUser()
  if (!userId) return { error: 'Unauthorized' }

  const db = createAdminClient()

  // Rate limit: max 3 requests per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await db
    .from('email_change_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo)

  if ((count ?? 0) >= 3) {
    return { error: emailError('rate_limit', data.locale) }
  }

  // Uniqueness: new email must not belong to another active account
  const newEmailLower = data.newEmail.toLowerCase().trim()
  const { data: authUser } = await db.auth.admin.getUserById(userId)
  const currentEmail = authUser?.user?.email ?? ''

  if (newEmailLower === currentEmail.toLowerCase()) {
    return { error: emailError('same_email', data.locale) }
  }

  const { data: existing } = await db.auth.admin.listUsers()
  const taken = existing?.users?.some(
    u => u.email?.toLowerCase() === newEmailLower && u.id !== userId,
  )
  if (taken) {
    return { error: emailError('email_taken', data.locale) }
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

  // Update pending_email on user row
  await db.from('users').update({ pending_email: newEmailLower }).eq('id', userId)

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

  const rawToken = randomBytes(32).toString('hex')
  const newHash = createHash('sha256').update(rawToken).digest('hex')
  const newExpiry = new Date(Date.now() + EMAIL_CHANGE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()

  await db
    .from('email_change_tokens')
    .update({ token_hash: newHash, expires_at: newExpiry })
    .eq('id', token.id)

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

    const supabase = await createClient()

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (verifyError) {
      const msg = verifyError.message.toLowerCase()
      if (msg.includes('rate limit') || msg.includes('too many')) return { ok: false, reason: 'rate_limited' }
      return { ok: false, reason: 'invalid_current' }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) return { ok: false, reason: 'server_error' }

    // Fire-and-forget: password-changed notification email (Task 276).
    try {
      const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).single()
      void sendPasswordChangedEmail({ to: user.email, name: profile?.name ?? null })
    } catch {
      // Best-effort — the password change has already completed.
    }

    return { ok: true }
  } catch {
    return { ok: false, reason: 'server_error' }
  }
}

// ── Email verification (called from the public confirm-email page) ────────────

export async function consumeEmailChangeToken(rawToken: string): Promise<{
  success?: boolean
  error?: string
  errorCode?: 'expired' | 'consumed' | 'invalid'
}> {
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

  // Atomically consume the token and update the email
  const { error: consumeErr } = await db
    .from('email_change_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', token.id)
    .is('consumed_at', null)

  if (consumeErr) return { error: 'confirmation_failed', errorCode: 'invalid' }

  // Update Supabase auth email
  const { error: authErr } = await db.auth.admin.updateUserById(token.user_id, {
    email: token.new_email,
    email_confirm: true,
  })

  if (authErr) {
    console.error('consumeEmailChangeToken: auth update failed', { error: authErr })
    return { error: 'email_update_failed' }
  }

  // Update users table and clear pending_email
  await db
    .from('users')
    .update({ pending_email: null })
    .eq('id', token.user_id)

  // Invalidate all existing sessions for this user (force re-login with new email)
  await db.auth.admin.signOut(token.user_id, 'global').catch(() => {})

  return { success: true }
}
