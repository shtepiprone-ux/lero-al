import { createClient } from '@/lib/supabase/server'
import { ARCHIVED_NOINDEX_DAYS } from '@/modules/listings/constants'

const SUPPORTED_LOCALES = ['sq', 'en', 'uk', 'it'] as const
type SupportedLocale = typeof SUPPORTED_LOCALES[number]
const LOCALE_FALLBACK: SupportedLocale = 'sq'

/** Reads the admin-configured default locale from site_settings. Falls back to 'sq'. */
export async function getDefaultSiteLocale(): Promise<SupportedLocale> {
  try {
    const value = await getSetting('default_locale', LOCALE_FALLBACK)
    return (SUPPORTED_LOCALES as readonly string[]).includes(value)
      ? (value as SupportedLocale)
      : LOCALE_FALLBACK
  } catch {
    return LOCALE_FALLBACK
  }
}

export async function getSetting(key: string, fallback: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? fallback
}

export async function getArchivedNoindexDays(): Promise<number> {
  const raw = await getSetting('archived_noindex_days', String(ARCHIVED_NOINDEX_DAYS))
  const n = parseInt(raw)
  return Number.isFinite(n) && n > 0 ? n : ARCHIVED_NOINDEX_DAYS
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('key, value')
  return Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
}
