'use server'

import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { ListingStatus, UserRole, UserType } from '@/types/database'
import { applyListingTransitionByStatus } from '@/modules/listings/actions/applyListingTransition'

// ── Cloudinary signed upload helper ──────────────────────────────────────────

async function uploadToCloudinary(
  bytes: ArrayBuffer,
  mimeType: string,
  folder: string,
): Promise<{ url: string; publicId: string; width?: number; height?: number }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary env vars missing')
  }

  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = createHash('sha1').update(`${paramsToSign}${apiSecret}`).digest('hex')

  const form = new FormData()
  form.append('file', new Blob([bytes], { type: mimeType }))
  form.append('timestamp', String(timestamp))
  form.append('api_key', apiKey)
  form.append('signature', signature)
  form.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status))
    throw new Error(`Cloudinary upload failed: ${errText}`)
  }
  const data = await res.json() as { secure_url: string; public_id: string; width?: number; height?: number }
  return { url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height }
}

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

export async function updateListingStatus(listingId: string, toStatus: ListingStatus) {
  const actor = await resolveAdminActor()
  const result = await applyListingTransitionByStatus(listingId, toStatus, actor)
  if (!result.ok && result.reason !== 'not_found') {
    console.error('updateListingStatus: transition failed', { result, listingId, toStatus })
  }
  revalidatePath('/admin/listings')
}

export async function setListingPremium(
  listingId: string,
  isPremium: boolean,
  premiumUntil?: string | null,
) {
  await assertAdminAccess()
  const db = createAdminClient()
  const update: Record<string, unknown> = { is_premium: isPremium }
  // premium_until column requires DB migration: ALTER TABLE listings ADD COLUMN premium_until timestamptz;
  if (premiumUntil !== undefined) update['premium_until'] = premiumUntil
  const { error } = await db.from('listings').update(update).eq('id', listingId)
  if (error) console.error('setListingPremium failed', { error, listingId })
  revalidatePath('/admin/listings')
  revalidatePath('/admin/badges')
}

export async function toggleListingPremium(id: string, isPremium: boolean) {
  return setListingPremium(id, isPremium)
}

export async function deleteListing(listingId: string) {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('listings').delete().eq('id', listingId)
  if (error) {
    console.error('deleteListing failed', { error, listingId })
    return
  }
  revalidateTag('site-stats', 'default')
  revalidatePath('/admin/listings')
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
  name_al: string; name_en?: string; type: string; slug: string; parent_id?: number | null
}) {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('locations').insert(data)
  if (error) console.error('createLocation failed', { error })
  revalidatePath('/admin/locations')
}

export async function updateLocation(
  id: number,
  data: { name_al?: string; name_en?: string; type?: string; slug?: string }
) {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('locations').update(data).eq('id', id)
  if (error) console.error('updateLocation failed', { error, id })
  revalidatePath('/admin/locations')
}

export async function deleteLocation(id: number) {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('locations').delete().eq('id', id)
  if (error) console.error('deleteLocation failed', { error, id })
  revalidatePath('/admin/locations')
}

// ── Site settings ────────────────────────────────────────────────────────────

export async function saveSetting(key: string, value: string) {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) console.error('saveSetting failed', { error, key })
  revalidatePath('/admin/settings')
  // Brand-related settings require full revalidation so Header/Footer/Sidebar reflect the change
  if (['site_name', 'logo_url', 'logo_dark_url', 'favicon_url'].includes(key)) {
    revalidatePath('/', 'layout')
    revalidatePath('/admin', 'layout')
  }
}

export async function saveSettings(entries: Record<string, string>): Promise<{ error?: string }> {
  await assertAdminAccess()
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
    return { error: 'Не вдалось зберегти налаштування' }
  }
  revalidatePath('/admin/settings')
  const brandKeys = ['site_name', 'logo_url', 'logo_dark_url', 'favicon_url']
  if (rows.some(r => brandKeys.includes(r.key))) {
    revalidatePath('/', 'layout')
    revalidatePath('/admin', 'layout')
  }
  return {}
}

// ── Legal pages ──────────────────────────────────────────────────────────────

export async function createPage(data: {
  title: string; slug: string; content: Record<string, unknown>; is_published: boolean
}) {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('pages').insert(data)
  if (error) console.error('createPage failed', { error })
  revalidatePath('/admin/legal')
}

export async function updatePage(
  id: number,
  data: { title?: string; slug?: string; content?: Record<string, unknown>; is_published?: boolean }
) {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('pages').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) console.error('updatePage failed', { error, id })
  revalidatePath('/admin/legal')
}

export async function deletePage(id: number) {
  await assertAdminAccess()
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

async function getCallerId(): Promise<string | null> {
  const user = await getUser()
  return user?.id ?? null
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
    company_name: isBusiness ? (data.companyName ?? null) : null,
    company_logo_url: isBusiness ? (data.companyLogoUrl ?? null) : null,
    website: isBusiness ? (data.website ?? null) : null,
    position: isBusiness ? (data.position ?? null) : null,
    year_started: isBusiness ? (data.yearStarted ?? null) : null,
  }

  if (myProfile.role === 'admin') {
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
    return { error: 'Не вдалось оновити профіль' }
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
  await assertAdminAccess()
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
    if (msg.includes('already') || msg.includes('exists')) return { error: 'Користувач з таким email вже існує' }
    return { error: 'Не вдалось створити користувача' }
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
    return { error: 'Не вдалось створити профіль' }
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
  const me = await getUser()
  if (!me) return { error: 'Unauthorized' }
  const supabase = await createClient()
  const { data: myProfile } = await supabase.from('users').select('role').eq('id', me.id).single()
  if (myProfile?.role !== 'admin') return { error: 'Тільки адміністратор може видаляти профілі' }

  const db = createAdminClient()
  const { error } = await db.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', userId)
  if (error) {
    console.error('softDeleteUser failed', { error, userId })
    return { error: 'Не вдалось видалити профіль' }
  }

  revalidatePath('/admin/users')
  return {}
}

// Restored original FormData/File upload contract (Task 11 stable baseline).
// The crop layer produces a Blob → wrapped into File → FormData → this action.
// Transport is identical to pre-crop-refactor; only the source image differs.
export async function uploadUserAvatar(userId: string, formData: FormData): Promise<{ url?: string; error?: string }> {
  await assertAdminAccess()

  const file = formData.get('avatar') as File | null
  if (!file) return { error: 'Файл не надано' }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) return { error: 'Тільки JPG, PNG або WEBP' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Максимальний розмір файлу — 2 МБ' }

  const bytes = await file.arrayBuffer()
  console.log('[uploadUserAvatar] received bytes:', bytes.byteLength, 'type:', file.type, 'userId:', userId)

  let cloudUrl: string
  try {
    const result = await uploadToCloudinary(bytes, file.type, 'avatars')
    console.log('[uploadUserAvatar] Cloudinary ok:', result.width, 'x', result.height, result.url.slice(0, 60))
    if (result.width && result.height && (result.width !== 256 || result.height !== 256)) {
      return { error: `Розмір зображення: ${result.width}×${result.height} (потрібно 256×256)` }
    }
    cloudUrl = result.url
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadUserAvatar] Cloudinary failed:', msg, '| userId:', userId, '| bytes:', bytes.byteLength)
    return { error: process.env.NODE_ENV === 'development' ? `Cloudinary: ${msg}` : 'Помилка завантаження аватара' }
  }

  const db = createAdminClient()
  const { error: updateError } = await db.from('users').update({ avatar_url: cloudUrl }).eq('id', userId)
  if (updateError) {
    console.error('[uploadUserAvatar] DB update failed', { error: updateError, userId })
    return { error: 'Аватар завантажено, але не вдалось зберегти — спробуйте ще раз' }
  }

  revalidatePath(`/admin/users/${userId}`)
  return { url: cloudUrl }
}

export async function removeUserAvatar(userId: string): Promise<{ error?: string }> {
  await assertAdminAccess()
  const db = createAdminClient()
  const { error } = await db.from('users').update({ avatar_url: null }).eq('id', userId)
  if (error) {
    console.error('removeUserAvatar failed', { error, userId })
    return { error: 'Не вдалось видалити аватар' }
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
    return { error: 'Не вдалось додати населений пункт' }
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
    return { error: 'Не вдалось підтвердити запит' }
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
    return { error: 'Не вдалось відхилити запит' }
  }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return {}
}
