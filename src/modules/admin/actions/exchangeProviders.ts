'use server'

import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import type { DBExchangeProvider } from '@/types/database'

export const EXCHANGE_PROVIDERS_CACHE_TAG = 'exchange_providers'

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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExchangeProviderInput {
  name: string
  endpoint_url: string
  api_key?: string
  refresh_interval_min?: number
  priority?: number
  mode?: 'auto' | 'manual' | 'hybrid'
  notes?: string
}

// ── Fetch all ─────────────────────────────────────────────────────────────────

export async function getAllExchangeProvidersAdmin(): Promise<DBExchangeProvider[]> {
  const db = createAdminClient()
  const { data } = await db
    .from('exchange_providers')
    .select('id, name, endpoint_url, api_key, refresh_interval_min, priority, mode, is_enabled, notes, created_at, updated_at')
    .order('priority', { ascending: true })
  return (data ?? []) as DBExchangeProvider[]
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createExchangeProvider(
  input: ExchangeProviderInput,
): Promise<{ id?: number; error?: string; code?: 'duplicate_name' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (!input.name.trim()) return { error: 'Provider name is required' }
  if (!input.endpoint_url.trim()) return { error: 'Endpoint URL is required' }

  const db = createAdminClient()
  const { data, error } = await db
    .from('exchange_providers')
    .insert({
      name:                 input.name.trim(),
      endpoint_url:         input.endpoint_url.trim(),
      api_key:              input.api_key?.trim() || null,
      refresh_interval_min: input.refresh_interval_min ?? 60,
      priority:             input.priority ?? 99,
      mode:                 input.mode ?? 'auto',
      notes:                input.notes?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Provider name already exists', code: 'duplicate_name' }
    console.error('createExchangeProvider failed', { error })
    return { error: error.message }
  }

  revalidateTag(EXCHANGE_PROVIDERS_CACHE_TAG)
  return { id: data.id }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateExchangeProvider(
  id: number,
  input: ExchangeProviderInput,
): Promise<{ error?: string; code?: 'duplicate_name' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (!input.name.trim()) return { error: 'Provider name is required' }

  const db = createAdminClient()
  const { error } = await db
    .from('exchange_providers')
    .update({
      name:                 input.name.trim(),
      endpoint_url:         input.endpoint_url.trim(),
      api_key:              input.api_key?.trim() || null,
      refresh_interval_min: input.refresh_interval_min ?? 60,
      priority:             input.priority ?? 99,
      mode:                 input.mode ?? 'auto',
      notes:                input.notes?.trim() || null,
      updated_at:           new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Provider name already exists', code: 'duplicate_name' }
    console.error('updateExchangeProvider failed', { error, id })
    return { error: error.message }
  }

  revalidateTag(EXCHANGE_PROVIDERS_CACHE_TAG)
  return {}
}

// ── Toggle enabled ────────────────────────────────────────────────────────────

export async function toggleExchangeProviderEnabled(
  id: number,
  isEnabled: boolean,
): Promise<{ error?: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const db = createAdminClient()
  const { error } = await db
    .from('exchange_providers')
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateTag(EXCHANGE_PROVIDERS_CACHE_TAG)
  return {}
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteExchangeProvider(
  id: number,
): Promise<{ error?: string; code?: 'not_found' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const db = createAdminClient()
  const { data: provider } = await db
    .from('exchange_providers')
    .select('id')
    .eq('id', id)
    .single()

  if (!provider) return { error: 'Not found', code: 'not_found' }

  const { error } = await db.from('exchange_providers').delete().eq('id', id)
  if (error) {
    console.error('deleteExchangeProvider failed', { error, id })
    return { error: error.message }
  }

  revalidateTag(EXCHANGE_PROVIDERS_CACHE_TAG)
  return {}
}
