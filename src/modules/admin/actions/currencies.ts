'use server'

import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import type { DBCurrency } from '@/types/database'

const CURRENCIES_CACHE_TAG = 'currencies'

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

export interface CurrencyInput {
  code: string
  symbol: string
  name_sq: string
  name_en: string
  name_uk: string
  name_it: string
  decimals?: number
}

// ── Fetch all (admin — includes inactive) ────────────────────────────────────

export async function getAllCurrenciesAdmin(): Promise<DBCurrency[]> {
  const db = createAdminClient()
  const { data } = await db
    .from('currencies')
    .select('id, code, symbol, name_sq, name_en, name_uk, name_it, is_active, is_default, decimals, created_at, updated_at')
    .order('is_default', { ascending: false })
    .order('code', { ascending: true })
  return (data ?? []) as DBCurrency[]
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createCurrency(
  input: CurrencyInput,
): Promise<{ id?: number; error?: string; code?: 'duplicate_code' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (!input.code.trim()) return { error: 'Currency code is required' }
  if (!input.symbol.trim()) return { error: 'Symbol is required' }

  const db = createAdminClient()
  const { data, error } = await db
    .from('currencies')
    .insert({
      code:    input.code.trim().toUpperCase(),
      symbol:  input.symbol.trim(),
      name_sq: input.name_sq.trim(),
      name_en: input.name_en.trim(),
      name_uk: input.name_uk.trim(),
      name_it: input.name_it.trim(),
      decimals: input.decimals ?? 0,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Currency code already exists', code: 'duplicate_code' }
    console.error('createCurrency failed', { error })
    return { error: error.message }
  }

  revalidateTag(CURRENCIES_CACHE_TAG)
  return { id: data.id }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateCurrency(
  id: number,
  input: CurrencyInput,
): Promise<{ error?: string; code?: 'duplicate_code' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (!input.code.trim()) return { error: 'Currency code is required' }
  if (!input.symbol.trim()) return { error: 'Symbol is required' }

  const db = createAdminClient()
  const { error } = await db
    .from('currencies')
    .update({
      code:       input.code.trim().toUpperCase(),
      symbol:     input.symbol.trim(),
      name_sq:    input.name_sq.trim(),
      name_en:    input.name_en.trim(),
      name_uk:    input.name_uk.trim(),
      name_it:    input.name_it.trim(),
      decimals:   input.decimals ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Currency code already exists', code: 'duplicate_code' }
    console.error('updateCurrency failed', { error, id })
    return { error: error.message }
  }

  revalidateTag(CURRENCIES_CACHE_TAG)
  return {}
}

// ── Toggle active ─────────────────────────────────────────────────────────────

export async function toggleCurrencyActive(
  id: number,
  isActive: boolean,
): Promise<{ error?: string; code?: 'default_currency' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (!isActive) {
    // Cannot deactivate the default currency
    const db = createAdminClient()
    const { data: cur } = await db
      .from('currencies')
      .select('is_default')
      .eq('id', id)
      .single()
    if (cur?.is_default) {
      return { error: 'Cannot deactivate the default currency', code: 'default_currency' }
    }
  }

  const db = createAdminClient()
  const { error } = await db
    .from('currencies')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateTag(CURRENCIES_CACHE_TAG)
  return {}
}

// ── Set default ───────────────────────────────────────────────────────────────

export async function setDefaultCurrency(id: number): Promise<{ error?: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const db = createAdminClient()

  // Ensure the target currency is active
  const { data: target } = await db
    .from('currencies')
    .select('is_active')
    .eq('id', id)
    .single()

  if (!target?.is_active) {
    return { error: 'Cannot set an inactive currency as default' }
  }

  // Clear existing default, then set new one
  const { error: clearError } = await db
    .from('currencies')
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq('is_default', true)

  if (clearError) return { error: clearError.message }

  const { error } = await db
    .from('currencies')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateTag(CURRENCIES_CACHE_TAG)
  return {}
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCurrency(
  id: number,
): Promise<{ error?: string; code?: 'default_currency' | 'not_found' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const db = createAdminClient()
  const { data: cur } = await db
    .from('currencies')
    .select('code, is_default')
    .eq('id', id)
    .single()

  if (!cur) return { error: 'Not found', code: 'not_found' }
  if (cur.is_default) return { error: 'Cannot delete the default currency', code: 'default_currency' }

  const { error } = await db.from('currencies').delete().eq('id', id)
  if (error) {
    console.error('deleteCurrency failed', { error, id })
    return { error: error.message }
  }

  revalidateTag(CURRENCIES_CACHE_TAG)
  return {}
}
