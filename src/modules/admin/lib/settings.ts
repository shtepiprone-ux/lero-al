import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { ARCHIVED_NOINDEX_DAYS } from '@/modules/listings/constants'
import type { FooterLink, SiteFooter } from '@/types/database'

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
  const db = createAdminClient()
  const { data } = await db
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

/**
 * The footer as the public site shows it: display fields only. `updated_by`, `updated_by_name` and `updated_at` are editor bookkeeping and never leave the server.
 */
export type PublicFooter = Omit<SiteFooter, 'updated_at' | 'updated_by'>

/** the display columns of `site_footer`, and nothing else (Task 923 R66 (n)) */
const PUBLIC_FOOTER_COLUMNS = 'locale, brand_title, tagline, nav_section_title, nav_links, info_section_title, info_links, social_section_title, social_links, copyright_template'

/**
 * Public footer read for the site footer (server rendering only).
 *
 * It lives here and not in `actions/footer.ts` on purpose (Task 923 R66 (n)): every export of a `'use server'` module is a Server Action that any visitor can call by id,
 * and this one read through the service role with `select('*')`, so a stranger got the whole row, editor ids included. A `server-only` module cannot be called from the
 * browser at all.
 */
export async function getFooterContent(locale: string): Promise<PublicFooter | null> {
  // called with a value the visitor can influence: anything but a supported language is Albanian (Task 923 Revision 7)
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) locale = LOCALE_FALLBACK
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('site_footer')
      .select(PUBLIC_FOOTER_COLUMNS)
      .in('locale', locale !== LOCALE_FALLBACK ? [locale, LOCALE_FALLBACK] : [LOCALE_FALLBACK])
    if (error) return null
    if (!data?.length) return null
    const rows = data as unknown as Array<Record<string, unknown> & { locale: string }>
    const row = rows.find(r => r.locale === locale) ?? rows.find(r => r.locale === LOCALE_FALLBACK) ?? null
    if (!row) return null
    // the fields are copied one by one: whatever else a row carries (now or after a column is added) is not passed on
    return {
      locale:               row.locale,
      brand_title:          row.brand_title as string,
      tagline:              row.tagline as string,
      nav_section_title:    row.nav_section_title as string,
      nav_links:            (row.nav_links    as FooterLink[] | null) ?? [],
      info_section_title:   row.info_section_title as string,
      info_links:           (row.info_links   as FooterLink[] | null) ?? [],
      social_section_title: row.social_section_title as string,
      social_links:         (row.social_links as FooterLink[] | null) ?? [],
      copyright_template:   row.copyright_template as string,
    }
  } catch {
    return null  // table not yet created — fallback to i18n in public footer
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = createAdminClient()
  const { data } = await db.from('site_settings').select('key, value')
  return Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
}
