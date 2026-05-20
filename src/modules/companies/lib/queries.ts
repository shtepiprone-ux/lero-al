import { createClient } from '@/lib/supabase/client'
import type { Company } from '@/types/database'

export async function getCompanies(): Promise<Company[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, logo_url, created_at')
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}
