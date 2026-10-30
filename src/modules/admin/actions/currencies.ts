'use server'

import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkStaff } from '@/lib/auth/staff'
import { isRatePublished } from '@/lib/getExchangeRateServer'
import type { DBCurrency } from '@/types/database'

const CURRENCIES_CACHE_TAG = 'currencies'

// An ISO 4217 style code (Task 923 Revision 7): the code is used as a word in a pattern that reads the exchange-rate page, so a code such as "(" or "A.*" would
// break the rates for every visitor.
const CURRENCY_CODE = /^[A-Z]{3}$/

// ── Auth guard ────────────────────────────────────────────────────────────────

async function assertAdmin() {
  // one guard for every staff action (Task 923 R71 (k)): the decision lives in `@/lib/auth/staff`, this keeps only the answer shape of this file
  // Task 923 R75: a moderator needs the `catalog.manage` key (currencies, exchange providers, property types); an administrator holds every key
  const staff = await checkStaff({ permission: 'catalog.manage' })
  if (!staff.ok) return { error: staff.reason }
  return { userId: staff.userId }
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
  // Security (Task 923 Revision 7, S16/S17): every exported function of this file is a public endpoint, so the read is guarded like the writes.
  // Without it the service-role query below answered ANY caller (here with the providers' api_key).
  if ('error' in (await assertAdmin())) return []
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
): Promise<{ id?: number; error?: string; code?: 'duplicate_code' | 'rate_unavailable' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (!input.code.trim()) return { error: 'Currency code is required' }
  if (!CURRENCY_CODE.test(input.code.trim().toUpperCase())) return { error: 'Currency code must be 3 letters' }
  if (!input.symbol.trim()) return { error: 'Symbol is required' }

  // Task 923 R79 (a): a new currency is ACTIVE from the start (the column's default), and an active currency needs a rate: the one source must publish it. A page that
  // cannot be read means "not proven published", which is refused too.
  if ((await isRatePublished(input.code)) !== true) return { error: 'rate_unavailable', code: 'rate_unavailable' }

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
    return { error: 'create_failed' }
  }

  revalidateTag(CURRENCIES_CACHE_TAG)
  return { id: data.id }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateCurrency(
  id: number,
  input: CurrencyInput,
): Promise<{ error?: string; code?: 'duplicate_code' | 'rate_unavailable' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (!input.code.trim()) return { error: 'Currency code is required' }
  if (!CURRENCY_CODE.test(input.code.trim().toUpperCase())) return { error: 'Currency code must be 3 letters' }
  if (!input.symbol.trim()) return { error: 'Symbol is required' }

  const db = createAdminClient()

  // Task 923 R79 (a): changing the code of an ACTIVE currency to one the single rate source does not publish would leave an active currency with no rate
  const { data: current } = await db.from('currencies').select('code, is_active').eq('id', id).single()
  if (current?.is_active && current.code !== input.code.trim().toUpperCase() && (await isRatePublished(input.code)) !== true) {
    return { error: 'rate_unavailable', code: 'rate_unavailable' }
  }

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
    return { error: 'update_failed' }
  }

  revalidateTag(CURRENCIES_CACHE_TAG)
  return {}
}

// ── Toggle active ─────────────────────────────────────────────────────────────

export async function toggleCurrencyActive(
  id: number,
  isActive: boolean,
): Promise<{ error?: string; code?: 'default_currency' | 'rate_unavailable' }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (isActive) {
    // Task 923 R79 (a): a currency the single rate source does not publish cannot be activated (`rate_unavailable`)
    const { data: target } = await createAdminClient().from('currencies').select('code').eq('id', id).single()
    if (!target || (await isRatePublished(target.code)) !== true) return { error: 'rate_unavailable', code: 'rate_unavailable' }
  }

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

  if (error) { console.error('toggleCurrencyActive failed', { code: error.code }); return { error: 'update_failed' } }
  revalidateTag(CURRENCIES_CACHE_TAG)
  return {}
}

// ── Set default ───────────────────────────────────────────────────────────────

export async function setDefaultCurrency(id: number): Promise<{ error?: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const db = createAdminClient()

  // Task 923 R67 (f) / R65 (d): one database function does it all. It refuses a missing or inactive currency (error 22023), then ONE update sets
  // `is_default = (id = p_id)` on every row, so there is never a moment with no default or with two. The old code cleared the default first and set the new one
  // second: a failure between the two left the site without a default currency.
  const { error } = await db.rpc('set_default_currency', { p_id: id })
  if (error) {
    if (error.code === '22023') return { error: 'Cannot set an inactive currency as default' }
    console.error('setDefaultCurrency failed', { id, code: error.code })
    return { error: 'Could not set the default currency' }
  }

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
    return { error: 'delete_failed' }
  }

  revalidateTag(CURRENCIES_CACHE_TAG)
  return {}
}
