'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { ListingStatus, UserRole, UserType } from '@/types/database'
import { applyListingTransitionByStatus } from '@/modules/listings/actions/applyListingTransition'
import { routing } from '@/i18n/routing'
import { assertPermission, hasPermission, roleHasPermission } from '@/lib/auth/permissions'
import { createNotification } from '@/modules/notifications/lib/mutations'
import { resolveUserLocale } from '@/modules/notifications/lib/emails/resolveUserLocale'

// ── Actor resolution ──────────────────────────────────────────────────────────
//
// Resolves the authenticated admin actor for transition gateway calls.
// Returns userId + role for the TransitionActorContext.

async function resolveAdminActor() {
  const user = await getUser()
  if (!user) throw new Error('unauthenticated')
  const supabase = await createClient()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    throw new Error('forbidden')
  }
  return { userId: user.id, role: profile.role as string, source: 'admin_panel' as const }
}

async function assertAdminAccess() {
  await resolveAdminActor()
}

// ── Listings ────────────────────────────────────────────────────────────────
//
// Thin adapter — no business logic, no transition validation, no DB writes.
// All status mutation authority is delegated to applyListingTransitionByStatus().

export async function updateListingStatus(
  listingId: string,
  toStatus: ListingStatus,
): Promise<{ error?: string }> {
  const actor = await resolveAdminActor()
  const result = await applyListingTransitionByStatus(listingId, toStatus, actor)
  if (!result.ok) {
    if (result.reason !== 'not_found') {
      console.error('updateListingStatus: transition failed', { result, listingId, toStatus })
    }
    return { error: result.reason }
  }
  revalidatePath('/admin/listings')
  return {}
}

export type SetListingPremiumResult =
  | { ok: true }
  | { error: 'forbidden' | 'db_missing_column' | 'not_found' | 'transient' | 'date_in_past' }

export async function setListingPremium(
  listingId: string,
  isPremium: boolean,
  premiumUntil?: string | null,
): Promise<SetListingPremiumResult> {
  try {
    await assertPermission('listings.set_premium')
  } catch {
    return { error: 'forbidden' }
  }

  // Server-side guard: reject timestamps already in the past
  if (premiumUntil && new Date(premiumUntil) < new Date()) {
    return { error: 'date_in_past' }
  }

  const db = createAdminClient()

  // Fetch slug BEFORE the write so we can revalidate the detail page.
  const { data: listing } = await db
    .from('listings')
    .select('slug')
    .eq('id', listingId)
    .single()

  if (!listing) {
    return { error: 'not_found' }
  }

  const update: Record<string, unknown> = { is_premium: isPremium }
  if (premiumUntil !== undefined) update['premium_until'] = premiumUntil
  const { error } = await db.from('listings').update(update).eq('id', listingId)
  if (error) {
    console.error('setListingPremium failed', { error, listingId })
    // PostgreSQL 42703 = column does not exist (premium_until migration not yet run)
    if ((error as { code?: string }).code === '42703') {
      return { error: 'db_missing_column' }
    }
    return { error: 'transient' }
  }

  revalidatePath('/admin/listings')
  revalidatePath('/admin/badges')

  // is_premium affects the listing card (premium badge + sort order is_premium desc)
  // and the detail page badge — both must be invalidated across all locales.
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/listings`, 'page')
    revalidatePath(`/${locale}/listings/${listing.slug}`, 'page')
  }

  return { ok: true }
}

export async function toggleListingPremium(id: string, isPremium: boolean): Promise<SetListingPremiumResult> {
  return setListingPremium(id, isPremium)
}

export async function deleteListing(listingId: string) {
  await assertPermission('listings.delete')
  const db = createAdminClient()
  const { error } = await db.from('listings').delete().eq('id', listingId)
  if (error) {
    console.error('deleteListing failed', { error, listingId })
    return
  }
  revalidateTag('site-stats')
  revalidatePath('/admin/listings')
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/listings`, 'page')
  }
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function updateUserProfile(
  userId: string,
  data: { name?: string; phone?: string; company_name?: string }
) {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('users').update(data).eq('id', userId)
  if (error) console.error('updateUserProfile failed', { error, userId })
  revalidatePath('/admin/users')
}

export async function toggleUserVerified(userId: string, isVerified: boolean) {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('users').update({ is_verified: isVerified }).eq('id', userId)
  if (error) console.error('toggleUserVerified failed', { error, userId })
  revalidatePath('/admin/users')
  revalidatePath('/admin/badges')
}

// ── Locations ────────────────────────────────────────────────────────────────

export async function createLocation(data: {
  name_al: string; name_en?: string; type: string; slug: string; parent_id?: number | null;
  image_url?: string | null; is_featured?: boolean; display_order?: number
}): Promise<{ error?: string }> {
  await assertPermission('locations.manage')
  const db = createAdminClient()
  const { error } = await db.from('locations').insert(data)
  if (error) { console.error('createLocation failed', { error }); return { error: error.message } }
  revalidatePath('/admin/locations')
  return {}
}

export async function updateLocation(
  id: number,
  data: { name_al?: string; name_en?: string; type?: string; slug?: string; image_url?: string | null; is_featured?: boolean; display_order?: number }
): Promise<{ error?: string }> {
  await assertPermission('locations.manage')
  const db = createAdminClient()
  const { error } = await db.from('locations').update(data).eq('id', id)
  if (error) { console.error('updateLocation failed', { error, id }); return { error: error.message } }
  revalidatePath('/admin/locations')
  return {}
}

export async function toggleLocationFeatured(id: number, isFeatured: boolean): Promise<{ error?: string }> {
  await assertPermission('locations.manage')
  const db = createAdminClient()
  const { error } = await db.from('locations').update({ is_featured: isFeatured }).eq('id', id)
  if (error) { console.error('toggleLocationFeatured failed', { error, id }); return { error: error.message } }
  revalidatePath('/admin/locations')
  return {}
}

export async function deleteLocation(id: number): Promise<{ error?: string }> {
  await assertPermission('locations.manage')
  const db = createAdminClient()
  const { error } = await db.from('locations').delete().eq('id', id)
  if (error) { console.error('deleteLocation failed', { error, id }); return { error: error.message } }
  revalidatePath('/admin/locations')
  return {}
}

// ── Site settings ────────────────────────────────────────────────────────────

export async function saveSettings(entries: Record<string, string>): Promise<{ error?: string }> {
  await assertPermission('settings.manage')
  const db = createAdminClient()
  const rows = Object.entries(entries).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await db
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' })
  if (error) {
    console.error('saveSettings failed', { error })
    return { error: 'save_failed' }
  }
  // Always revalidate the settings page so the admin sees fresh values.
  revalidatePath('/admin/settings')
  // Any setting change may affect layout (header, footer, SEO metadata) —
  // revalidate the full layout for both public and admin surfaces.
  revalidatePath('/', 'layout')
  revalidatePath('/admin', 'layout')
  return {}
}

// ── Legal pages ──────────────────────────────────────────────────────────────

export async function createPage(data: {
  title: string; slug: string; content: Record<string, unknown>; is_published: boolean
}) {
  await assertPermission('legal.manage')
  const db = createAdminClient()
  const { error } = await db.from('pages').insert(data)
  if (error) console.error('createPage failed', { error })
  revalidatePath('/admin/legal')
}

export async function updatePage(
  id: number,
  data: { title?: string; slug?: string; content?: Record<string, unknown>; is_published?: boolean }
) {
  await assertPermission('legal.manage')
  const db = createAdminClient()
  const { error } = await db.from('pages').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) console.error('updatePage failed', { error, id })
  revalidatePath('/admin/legal')
}

export async function deletePage(id: number) {
  await assertPermission('legal.manage')
  const db = createAdminClient()
  const { error } = await db.from('pages').delete().eq('id', id)
  if (error) console.error('deletePage failed', { error, id })
  revalidatePath('/admin/legal')
}

// ── User Profile Management ──────────────────────────────────────────────────

export type ProfileType = 'admin' | 'moderator' | 'private' | 'agent' | 'developer'

function profileTypeToDb(type: ProfileType): { role: UserRole; user_type: UserType } {
  switch (type) {
    case 'admin':     return { role: 'admin',     user_type: 'private' }
    case 'moderator': return { role: 'moderator', user_type: 'private' }
    case 'agent':     return { role: 'agent',     user_type: 'agent' }
    case 'developer': return { role: 'user',      user_type: 'developer' }
    default:          return { role: 'user',      user_type: 'private' }
  }
}

function profileTypeFromDb(role: UserRole, user_type: string): ProfileType {
  if (role === 'admin') return 'admin'
  if (role === 'moderator') return 'moderator'
  if (role === 'agent') return 'agent'
  if (user_type === 'developer') return 'developer'
  return 'private'
}

function generateTempPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = '!@#$%'
  const all = upper + lower + digits + special
  const arr = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
    ...Array.from({ length: 8 }, () => all[Math.floor(Math.random() * all.length)]),
  ]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}


export async function updateUserProfileFull(
  userId: string,
  data: {
    firstName: string
    lastName?: string
    profileType: ProfileType
    phone: string
    whatsapp?: string
    locationId: number
    companyName?: string
    companyLogoUrl?: string
    website?: string
    position?: string
    yearStarted?: number | null
    status: 'active' | 'blocked' | 'inactive'
    blockReason?: string
    /** ISO date string for temporary suspension expiry; null = permanent block. Only relevant when status = 'blocked'. */
    suspendedUntil?: string | null
  }
): Promise<{ error?: string }> {
  const me = await getUser()
  if (!me) return { error: 'Unauthorized' }
  const supabase = await createClient()
  const { data: myProfile } = await supabase.from('users').select('role').eq('id', me.id).single()
  if (!myProfile || (myProfile.role !== 'admin' && myProfile.role !== 'moderator')) {
    return { error: 'Forbidden' }
  }

  const db = createAdminClient()
  const { data: oldUser } = await db.from('users').select('role, user_type, status').eq('id', userId).single()

  const isBusiness = ['agent', 'developer'].includes(data.profileType)
  const update: Record<string, unknown> = {
    name: data.firstName,
    last_name: data.lastName ?? null,
    phone: data.phone,
    whatsapp: data.whatsapp || null,
    location_id: data.locationId,
    status: data.status,
    block_reason: data.status === 'blocked' ? (data.blockReason ?? null) : null,
    suspended_until: data.status === 'blocked' ? (data.suspendedUntil ?? null) : null,
    company_name: isBusiness ? (data.companyName ?? null) : null,
    company_logo_url: isBusiness ? (data.companyLogoUrl ?? null) : null,
    website: isBusiness ? (data.website ?? null) : null,
    position: isBusiness ? (data.position ?? null) : null,
    year_started: isBusiness ? (data.yearStarted ?? null) : null,
  }

  const canChangeRole = await roleHasPermission(myProfile.role as string, 'users.change_role')
  if (canChangeRole) {
    const { role, user_type } = profileTypeToDb(data.profileType)
    update.role = role
    update.user_type = user_type

    if (oldUser) {
      const oldType = profileTypeFromDb(oldUser.role as UserRole, oldUser.user_type)
      if (oldType !== data.profileType) {
        try {
          await db.from('user_change_log').insert({
            user_id: userId,
            changed_by: me.id,
            field_name: 'profile_type',
            old_value: oldType,
            new_value: data.profileType,
          })
        } catch {}
      }
    }
  }

  const { error } = await db.from('users').update(update).eq('id', userId)
  if (error) {
    console.error('updateUserProfileFull failed', { error, userId })
    return { error: 'update_failed' }
  }

  // Write status change history if status changed
  if (oldUser && oldUser.status !== data.status) {
    try {
      await db.from('user_status_history').insert({
        user_id: userId,
        old_status: oldUser.status,
        new_status: data.status,
        reason: data.status === 'blocked' ? (data.blockReason ?? null) : null,
        changed_by: me.id,
      })
    } catch {}
  }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
  return {}
}

export async function createAdminUser(data: {
  firstName: string
  lastName?: string
  email: string
  profileType: ProfileType
  phone: string
  whatsapp?: string
  locationId: number
  companyName?: string
  website?: string
  position?: string
  yearStarted?: number | null
}): Promise<{ userId?: string; error?: string }> {
  await assertPermission('users.create')
  const db = createAdminClient()
  const { role, user_type } = profileTypeToDb(data.profileType)
  const isBusiness = ['agent', 'developer'].includes(data.profileType)

  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: data.email,
    password: generateTempPassword(),
    email_confirm: true,
    user_metadata: { name: data.firstName },
  })

  if (authError) {
    console.error('createAdminUser auth failed', { error: authError })
    const msg = authError.message.toLowerCase()
    if (msg.includes('already') || msg.includes('exists')) return { error: 'email_already_exists' }
    return { error: 'create_failed' }
  }

  const { error: profileError } = await db.from('users').upsert({
    id: authData.user.id,
    name: data.firstName,
    last_name: data.lastName ?? null,
    phone: data.phone,
    whatsapp: data.whatsapp || null,
    role,
    user_type,
    location_id: data.locationId,
    // eslint-disable-next-line no-restricted-syntax -- UserStatus initial value in user upsert, not ListingStatus; applyListingTransition not applicable here
    status: 'active',
    is_verified: false,
    company_name: isBusiness ? (data.companyName ?? null) : null,
    website:      isBusiness ? (data.website ?? null) : null,
    position:     isBusiness ? (data.position ?? null) : null,
    year_started: isBusiness ? (data.yearStarted ?? null) : null,
  })

  if (profileError) {
    console.error('createAdminUser profile failed', { error: profileError })
    await db.auth.admin.deleteUser(authData.user.id).catch(() => {})
    return { error: 'create_profile_failed' }
  }

  try {
    await db.auth.admin.generateLink({ type: 'recovery', email: data.email })
  } catch (e) {
    console.error('createAdminUser: failed to send recovery email', e)
  }

  revalidatePath('/admin/users')
  return { userId: authData.user.id }
}

export async function softDeleteUser(userId: string): Promise<{ error?: string }> {
  const allowed = await hasPermission('users.soft_delete').catch(() => false)
  if (!allowed) return { error: 'forbidden' }
  const me = await getUser()
  if (!me) return { error: 'Unauthorized' }

  const db = createAdminClient()
  const { error } = await db.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', userId)
  if (error) {
    console.error('softDeleteUser failed', { error, userId })
    return { error: 'delete_failed' }
  }

  // Archive all non-terminal listings through the mutation gateway so they no longer appear as contactable.
  const { data: listingsToArchive } = await db
    .from('listings')
    .select('id')
    .eq('user_id', userId)
    .not('status', 'in', '("sold","rented","archived")')
  const actor = { userId: me.id, role: 'admin', source: 'admin_panel' as const }
  await Promise.all(
    (listingsToArchive ?? []).map(l => applyListingTransitionByStatus(l.id, 'archived', actor))
  )

  revalidatePath('/admin/users')
  revalidatePath('/admin/listings')
  return {}
}

export async function deactivateUser(userId: string, reason: string): Promise<{ error?: string }> {
  const allowed = await hasPermission('users.soft_delete').catch(() => false)
  if (!allowed) return { error: 'forbidden' }
  if (!reason.trim()) return { error: 'reason_required' }
  const me = await getUser()
  if (!me) return { error: 'Unauthorized' }

  const db = createAdminClient()
  const { data: current } = await db.from('users').select('status').eq('id', userId).single()
  // eslint-disable-next-line no-restricted-syntax -- user status, not listing status
  const { error } = await db.from('users').update({ status: 'inactive' }).eq('id', userId)
  if (error) { console.error('deactivateUser failed', { error, userId }); return { error: 'update_failed' } }

  try {
    await db.from('user_status_history').insert({
      user_id: userId,
      old_status: current?.status ?? null,
      new_status: 'inactive',
      reason: reason.trim(),
      changed_by: me.id,
    })
  } catch {}

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
  return {}
}

export async function reactivateUser(userId: string, reason: string): Promise<{ error?: string }> {
  const allowed = await hasPermission('users.soft_delete').catch(() => false)
  if (!allowed) return { error: 'forbidden' }
  if (!reason.trim()) return { error: 'reason_required' }
  const me = await getUser()
  if (!me) return { error: 'Unauthorized' }

  const db = createAdminClient()
  const { data: current } = await db.from('users').select('status').eq('id', userId).single()
  // eslint-disable-next-line no-restricted-syntax -- user status, not listing status
  const { error } = await db.from('users').update({ status: 'active' }).eq('id', userId)
  if (error) { console.error('reactivateUser failed', { error, userId }); return { error: 'update_failed' } }

  try {
    await db.from('user_status_history').insert({
      user_id: userId,
      old_status: current?.status ?? null,
      new_status: 'active',
      reason: reason.trim(),
      changed_by: me.id,
    })
  } catch {}

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
  return {}
}

export async function hardDeleteUser(userId: string): Promise<{ error?: string }> {
  const allowed = await hasPermission('users.hard_delete').catch(() => false)
  if (!allowed) return { error: 'forbidden' }
  const me = await getUser()
  if (!me) return { error: 'Unauthorized' }

  const db = createAdminClient()

  // 1. Archive all non-terminal listings through the mutation gateway before removing the user
  //    so they remain in the system with a "deleted owner" notice rather than disappearing.
  const { data: listingsToArchive } = await db
    .from('listings')
    .select('id')
    .eq('user_id', userId)
    .not('status', 'in', '("sold","rented","archived")')
  const actor = { userId: me.id, role: 'admin', source: 'admin_panel' as const }
  await Promise.all(
    (listingsToArchive ?? []).map(l => applyListingTransitionByStatus(l.id, 'archived', actor))
  )

  // 2. Remove the user profile row (cascades to related records via FK).
  const { error: profileError } = await db.from('users').delete().eq('id', userId)
  if (profileError) {
    console.error('hardDeleteUser profile failed', { error: profileError, userId })
    return { error: 'delete_failed' }
  }

  // 3. Remove from Supabase Auth (permanent — cannot be undone).
  const { error: authError } = await db.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('hardDeleteUser auth failed', { error: authError, userId })
    return { error: 'profile_deleted_auth_failed' }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/listings')
  return {}
}

export async function removeUserAvatar(userId: string): Promise<{ error?: string }> {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('users').update({ avatar_url: null }).eq('id', userId)
  if (error) {
    console.error('removeUserAvatar failed', { error, userId })
    return { error: 'delete_failed' }
  }
  revalidatePath(`/admin/users/${userId}`)
  return {}
}

export async function addLocation(data: {
  name_al: string
  region_id: number
}): Promise<{ id?: number; error?: string }> {
  await assertAdminAccess()
  const db = createAdminClient()
  const slug = `${data.name_al.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`

  const { data: loc, error } = await db
    .from('locations')
    .insert({ name_al: data.name_al, type: 'city', slug, parent_id: data.region_id, region_id: data.region_id })
    .select('id')
    .single()

  if (error) {
    console.error('addLocation failed', { error })
    return { error: 'add_failed' }
  }

  revalidatePath('/admin/users')
  return { id: loc.id }
}

export async function approveLocationRequest(
  userId: string,
  locationId: number
): Promise<{ error?: string }> {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db
    .from('users')
    .update({ location_id: locationId, location_request: null })
    .eq('id', userId)

  if (error) {
    console.error('approveLocationRequest failed', { error, userId })
    return { error: 'confirm_failed' }
  }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return {}
}

export async function rejectLocationRequest(userId: string): Promise<{ error?: string }> {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('users').update({ location_request: null }).eq('id', userId)

  if (error) {
    console.error('rejectLocationRequest failed', { error, userId })
    return { error: 'reject_failed' }
  }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return {}
}

// ── Support tickets ───────────────────────────────────────────────────────────

const FULL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function searchUsersForPicker(query: string): Promise<{
  id: string; name: string | null; last_name: string | null; phone: string | null;
  role: string; status: string | null; company_name: string | null;
}[]> {
  await assertAdminAccess()
  const q = query.trim()
  if (q.length < 2) return []
  const db = createAdminClient()

  if (FULL_UUID.test(q)) {
    const { data } = await db
      .from('users')
      .select('id, name, last_name, phone, role, status, company_name')
      .eq('id', q)
      .is('deleted_at', null)
      .limit(1)
    return data ?? []
  }

  const { data } = await db
    .from('users')
    .select('id, name, last_name, phone, role, status, company_name')
    .is('deleted_at', null)
    .or(`name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,company_name.ilike.%${q}%`)
    .order('name', { ascending: true })
    .limit(8)
  return data ?? []
}

const SUPPORT_NOTIFY_STRINGS: Record<string, { created_title: string; created_body: string; resolved_title: string; resolved_body: string; closed_title: string; closed_body: string }> = {
  sq: {
    created_title: 'Ankesë për llogarinë tuaj',
    created_body: 'Administratori ka hapur një ankesë lidhur me llogarinë tuaj. Ekipi ynë do ta shqyrtojë.',
    resolved_title: 'Çështja juaj u zgjidh',
    resolved_body: 'Ankesa lidhur me llogarinë tuaj u shqyrtua dhe u zgjidh nga ekipi ynë.',
    closed_title: 'Çështja juaj u mbyll',
    closed_body: 'Ankesa lidhur me llogarinë tuaj u mbyll nga ekipi ynë.',
  },
  en: {
    created_title: 'A complaint about your account',
    created_body: 'An administrator has opened a complaint about your account. Our team will review it.',
    resolved_title: 'Your case has been resolved',
    resolved_body: 'The complaint about your account has been reviewed and resolved by our team.',
    closed_title: 'Your case has been closed',
    closed_body: 'The complaint about your account has been closed by our team.',
  },
  uk: {
    created_title: 'Скарга на ваш акаунт',
    created_body: 'Адміністратор відкрив скаргу щодо вашого акаунту. Наша команда її розгляне.',
    resolved_title: 'Вашу справу вирішено',
    resolved_body: 'Скаргу щодо вашого акаунту розглянуто і вирішено нашою командою.',
    closed_title: 'Вашу справу закрито',
    closed_body: 'Скаргу щодо вашого акаунту закрито нашою командою.',
  },
  it: {
    created_title: 'Un reclamo sul tuo account',
    created_body: 'Un amministratore ha aperto un reclamo riguardante il tuo account. Il nostro team lo esaminerà.',
    resolved_title: 'Il tuo caso è stato risolto',
    resolved_body: 'Il reclamo riguardante il tuo account è stato esaminato e risolto dal nostro team.',
    closed_title: 'Il tuo caso è stato chiuso',
    closed_body: 'Il reclamo riguardante il tuo account è stato chiuso dal nostro team.',
  },
}

function getSupportNotifyStrings(locale: string) {
  return SUPPORT_NOTIFY_STRINGS[locale] ?? SUPPORT_NOTIFY_STRINGS.en
}

const VALID_TICKET_TYPES = ['support', 'user_complaint'] as const

const VALID_COMPLAINT_TYPES = [
  'fraud_or_scam', 'fake_listing_or_profile', 'harassment_or_abuse',
  'inappropriate_content', 'spam', 'payment_or_deposit_issue',
  'duplicate_or_impersonation', 'other',
] as const

export async function createSupportTicket({
  ticketType,
  requesterUserId,
  reportedUserId,
  complaintType,
  subject,
  reason,
}: {
  ticketType: string
  requesterUserId: string
  reportedUserId?: string
  complaintType?: string
  subject: string
  reason: string
}): Promise<{ id?: string; error?: string }> {
  const actor = await resolveAdminActor()
  if (!(VALID_TICKET_TYPES as readonly string[]).includes(ticketType)) return { error: 'ticket_type_invalid' }
  if (!requesterUserId.trim()) return { error: 'requester_required' }
  if (ticketType === 'user_complaint') {
    if (!reportedUserId?.trim()) return { error: 'reported_required' }
    if (!complaintType?.trim()) return { error: 'complaint_type_required' }
    if (!(VALID_COMPLAINT_TYPES as readonly string[]).includes(complaintType)) return { error: 'complaint_type_invalid' }
  }
  if (!subject.trim()) return { error: 'subject_required' }
  if (!reason.trim()) return { error: 'reason_required' }

  const db = createAdminClient()

  // Verify required users exist
  const userIdsToCheck = [requesterUserId]
  if (ticketType === 'user_complaint' && reportedUserId) userIdsToCheck.push(reportedUserId)
  const { data: users } = await db.from('users').select('id').in('id', userIdsToCheck)
  const foundIds = (users ?? []).map(u => u.id)
  if (!foundIds.includes(requesterUserId)) return { error: 'requester_not_found' }
  if (ticketType === 'user_complaint' && reportedUserId && !foundIds.includes(reportedUserId)) {
    return { error: 'reported_not_found' }
  }

  const insertData: Record<string, unknown> = {
    user_id: requesterUserId,
    subject: subject.trim(),
    reason: reason.trim(),
    created_by_admin_id: actor.userId,
    ticket_type: ticketType,
    status: 'open',
  }
  if (ticketType === 'user_complaint') {
    insertData.reported_user_id = reportedUserId
    insertData.complaint_type = complaintType
  }

  const { data: ticket, error } = await db
    .from('support_tickets')
    .insert(insertData)
    .select('id')
    .single()

  if (error || !ticket) {
    console.error('createSupportTicket failed', { error })
    return { error: 'create_failed' }
  }

  // Record creation event
  try {
    await db.from('support_ticket_events').insert({
      ticket_id: ticket.id,
      actor_user_id: actor.userId,
      actor_role: actor.role,
      event_type: 'created',
      new_status: 'open',
      note: reason.trim(),
    })
  } catch {}

  // Notify the reported user (user_complaint only)
  if (ticketType === 'user_complaint' && reportedUserId) try {
    const locale = await resolveUserLocale(reportedUserId)
    const s = getSupportNotifyStrings(locale)
    await createNotification({
      userId: reportedUserId,
      type: 'support_reply',
      title: s.created_title,
      body: s.created_body,
    })
  } catch {}

  revalidatePath('/admin/support')
  return { id: ticket.id }
}

const VALID_TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const
export async function updateTicketStatus(
  ticketId: string,
  newStatus: string,
  note?: string,
): Promise<{ error?: string }> {
  if (!(VALID_TICKET_STATUSES as readonly string[]).includes(newStatus)) {
    return { error: 'invalid_status' }
  }
  const actor = await resolveAdminActor()
  const db = createAdminClient()

  const { data: ticket, error: fetchError } = await db
    .from('support_tickets')
    .select('status, reported_user_id')
    .eq('id', ticketId)
    .single()

  if (fetchError || !ticket) return { error: 'not_found' }
  if (ticket.status === newStatus) return {}

  /* eslint-disable no-restricted-syntax */ // support_tickets status, not listing status
  const { error } = await db
    .from('support_tickets')
    .update({ status: newStatus })
    .eq('id', ticketId)
  /* eslint-enable no-restricted-syntax */

  if (error) {
    console.error('updateTicketStatus failed', { error, ticketId })
    return { error: 'update_failed' }
  }

  // Record status change event
  try {
    await db.from('support_ticket_events').insert({
      ticket_id: ticketId,
      actor_user_id: actor.userId,
      actor_role: actor.role,
      event_type: 'status_changed',
      old_status: ticket.status,
      new_status: newStatus,
      note: note?.trim() || null,
    })
  } catch {}

  // Notify reported user when ticket is resolved or closed
  if (ticket.reported_user_id && (newStatus === 'resolved' || newStatus === 'closed')) {
    try {
      const locale = await resolveUserLocale(ticket.reported_user_id)
      const s = getSupportNotifyStrings(locale)
      await createNotification({
        userId: ticket.reported_user_id,
        type: 'report_outcome',
        title: newStatus === 'resolved' ? s.resolved_title : s.closed_title,
        body: newStatus === 'resolved' ? s.resolved_body : s.closed_body,
      })
    } catch {}
  }

  revalidatePath('/admin/support')
  return {}
}
