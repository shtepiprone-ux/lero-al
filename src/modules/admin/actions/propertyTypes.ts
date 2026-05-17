'use server'

import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { PROPERTY_TYPES_CACHE_TAG } from '@/modules/admin/lib/propertyTypes'
import type { DBPropertyType } from '@/types/database'

// ── Auth guard ────────────────────────────────────────────────────────────────

async function assertAdmin() {
  const user = await getUser()
  if (!user) return { error: 'unauthenticated' as const }
  const supabase = await createClient()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
    return { error: 'forbidden' as const }
  }
  return { userId: user.id }
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
    return { error: error.message }
  }

  revalidateTag(PROPERTY_TYPES_CACHE_TAG)
  return { id: data.id }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updatePropertyType(
  id: number,
  input: PropertyTypeInput,
): Promise<{ error?: string; code?: 'duplicate_slug' }> {
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
    return { error: error.message }
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

  if (error) return { error: error.message }
  revalidateTag(PROPERTY_TYPES_CACHE_TAG)
  return {}
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deletePropertyType(
  id: number,
): Promise<{ error?: string; code?: 'has_listings' | 'not_found'; listingCount?: number }> {
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
  const { count } = await db
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('property_type', pt.slug)

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
    return { error: error.message }
  }

  revalidateTag(PROPERTY_TYPES_CACHE_TAG)
  return {}
}

// ── Fetch all (for admin table — includes inactive) ───────────────────────────

export async function getAllPropertyTypesAdmin(): Promise<DBPropertyType[]> {
  const db = createAdminClient()
  const { data } = await db
    .from('property_types')
    .select('id, slug, name_sq, name_en, name_uk, name_it, is_active, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  return (data ?? []) as DBPropertyType[]
}
