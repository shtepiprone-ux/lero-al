'use server'

import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkStaff } from '@/lib/auth/staff'
import { PROPERTY_TYPES_CACHE_TAG } from '@/modules/admin/lib/propertyTypes'
import type { DBPropertyType } from '@/types/database'

// ── Auth guard ────────────────────────────────────────────────────────────────

async function assertAdmin() {
  // one guard for every staff action (Task 923 R71 (k)): the decision lives in `@/lib/auth/staff`, this keeps only the answer shape of this file
  // Task 923 R75: a moderator needs the `catalog.manage` key (currencies, exchange providers, property types); an administrator holds every key
  const staff = await checkStaff({ permission: 'catalog.manage' })
  if (!staff.ok) return { error: staff.reason }
  return { userId: staff.userId }
}

// ── Slug normalization ────────────────────────────────────────────────────────

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
}

// ── Create ────────────────────────────────────────────────────────────────────

export interface PropertyTypeInput {
  slug?: string
  name_sq: string
  name_en: string
  name_uk: string
  name_it: string
  sort_order?: number
}

export async function createPropertyType(
  input: PropertyTypeInput,
): Promise<{ id?: number; error?: string; code?: 'duplicate_slug' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (!input.name_sq.trim()) return { error: 'Albanian name is required' }

  const slug = normalizeSlug(input.slug?.trim() || input.name_sq)
  if (!slug) return { error: 'Invalid slug' }

  const db = createAdminClient()
  const { data, error } = await db
    .from('property_types')
    .insert({
      slug,
      name_sq: input.name_sq.trim(),
      name_en: input.name_en.trim(),
      name_uk: input.name_uk.trim(),
      name_it: input.name_it.trim(),
      sort_order: input.sort_order ?? 99,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Slug already exists', code: 'duplicate_slug' }
    console.error('createPropertyType failed', { error })
    return { error: 'create_failed' }
  }

  revalidateTag(PROPERTY_TYPES_CACHE_TAG)
  return { id: data.id }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updatePropertyType(
  id: number,
  input: PropertyTypeInput,
): Promise<{ error?: string; code?: 'duplicate_slug' | 'has_listings' | 'count_failed' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (!input.name_sq.trim()) return { error: 'Albanian name is required' }

  const db = createAdminClient()

  // Fetch current slug to prevent changing system-locked slugs for existing types
  const { data: current } = await db
    .from('property_types')
    .select('slug')
    .eq('id', id)
    .single()

  const newSlug = input.slug?.trim()
    ? normalizeSlug(input.slug.trim())
    : (current?.slug ?? normalizeSlug(input.name_sq))

  // A listing refers to its type by slug. Renaming the slug of a type that listings use would leave them pointing at nothing (Task 923 Revision 7); the code's own
  // comment above promised this protection, the check was missing.
  if (current?.slug && newSlug !== current.slug) {
    const { count, error: countError } = await db.from('listings').select('*', { count: 'exact', head: true }).eq('property_type', current.slug)
    // Task 923 R71 (i): a count that cannot be read is not "no listings": the change is refused (it used to go ahead and could orphan the listings)
    if (countError || count === null) {
      console.error('updatePropertyType: listing count failed', { code: countError?.code, id })
      return { error: 'count_failed', code: 'count_failed' }
    }
    if ((count ?? 0) > 0) return { error: `Cannot change the slug: ${count} listing${count === 1 ? '' : 's'} use this type`, code: 'has_listings' }
  }

  const { error } = await db
    .from('property_types')
    .update({
      slug:       newSlug,
      name_sq:    input.name_sq.trim(),
      name_en:    input.name_en.trim(),
      name_uk:    input.name_uk.trim(),
      name_it:    input.name_it.trim(),
      sort_order: input.sort_order ?? 99,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Slug already exists', code: 'duplicate_slug' }
    console.error('updatePropertyType failed', { error, id })
    return { error: 'update_failed' }
  }

  revalidateTag(PROPERTY_TYPES_CACHE_TAG)
  return {}
}

// ── Toggle active ─────────────────────────────────────────────────────────────

export async function togglePropertyTypeActive(id: number, isActive: boolean): Promise<{ error?: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const db = createAdminClient()
  const { error } = await db
    .from('property_types')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) { console.error('togglePropertyTypeActive failed', { code: error.code }); return { error: 'update_failed' } }
  revalidateTag(PROPERTY_TYPES_CACHE_TAG)
  return {}
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deletePropertyType(
  id: number,
): Promise<{ error?: string; code?: 'has_listings' | 'not_found' | 'count_failed'; listingCount?: number }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const db = createAdminClient()

  // Fetch slug for the dependency check
  const { data: pt } = await db
    .from('property_types')
    .select('slug')
    .eq('id', id)
    .single()

  if (!pt) return { error: 'Not found', code: 'not_found' }

  // Dependency check: count listings using this property type
  const { count, error: countError } = await db
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('property_type', pt.slug)

  // Task 923 R71 (i): a count that cannot be read is not "no listings": the delete is refused
  if (countError || count === null) {
    console.error('deletePropertyType: listing count failed', { code: countError?.code, id })
    return { error: 'count_failed', code: 'count_failed' }
  }

  if ((count ?? 0) > 0) {
    return {
      error: `Cannot delete: ${count} listing${count === 1 ? '' : 's'} use this type`,
      code: 'has_listings',
      listingCount: count ?? 0,
    }
  }

  const { error } = await db.from('property_types').delete().eq('id', id)
  if (error) {
    console.error('deletePropertyType failed', { error, id })
    return { error: 'delete_failed' }
  }

  revalidateTag(PROPERTY_TYPES_CACHE_TAG)
  return {}
}

// ── Fetch all (for admin table — includes inactive) ───────────────────────────

export async function getAllPropertyTypesAdmin(): Promise<DBPropertyType[]> {
  // Security (Task 923 Revision 7, S16/S17): every exported function of this file is a public endpoint, so the read is guarded like the writes.
  // Without it the service-role query below answered ANY caller (here with the providers' api_key).
  if ('error' in (await assertAdmin())) return []
  const db = createAdminClient()
  const { data } = await db
    .from('property_types')
    .select('id, slug, name_sq, name_en, name_uk, name_it, is_active, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  return (data ?? []) as DBPropertyType[]
}
