import { createClient } from '@/lib/supabase/client'
import type { DBCurrency } from '@/types/database'

export async function getActiveCurrencies(): Promise<DBCurrency[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('currencies')
    .select('id, code, symbol, name_sq, name_en, name_uk, name_it, is_active, is_default, decimals, created_at, updated_at')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('code', { ascending: true })

  if (error) throw error
  return (data ?? []) as DBCurrency[]
}
