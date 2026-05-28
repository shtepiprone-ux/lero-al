'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import type { SiteFooter, FooterLink } from '@/types/database'

const VALID_LOCALES = ['sq', 'en', 'uk', 'it'] as const

// ── Auth guard ────────────────────────────────────────────────────────────────

async function assertAdminUser(): Promise<string | null> {
  const user = await getUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user.id : null
}

// ── URL validation ─────────────────────────────────────────────────────────────

function isValidLinkUrl(url: string): boolean {
  if (!url) return true
  const lower = url.trim().toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) return false
  return true
}

function validateLinks(links: FooterLink[]): boolean {
  return links.every(l => isValidLinkUrl(l.url))
}

// ── Public: read footer for a locale (used by public footer SSR) ──────────────

export async function getFooterContent(locale: string): Promise<SiteFooter | null> {
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('site_footer')
      .select('*')
      .in('locale', locale !== 'sq' ? [locale, 'sq'] : ['sq'])
    if (error) return null
    if (!data?.length) return null
    const row = data.find(r => r.locale === locale) ?? data.find(r => r.locale === 'sq') ?? null
    if (!row) return null
    return {
      ...row,
      nav_links:    (row.nav_links    as FooterLink[] | null) ?? [],
      info_links:   (row.info_links   as FooterLink[] | null) ?? [],
      social_links: (row.social_links as FooterLink[] | null) ?? [],
    } as SiteFooter
  } catch {
    return null  // table not yet created — fallback to i18n in public footer
  }
}

// ── Admin: read all 4 locale rows ─────────────────────────────────────────────

export async function getAllFooterContent(): Promise<{
  data: Record<string, SiteFooter | null>
  initialized: boolean
  error?: string
}> {
  try {
    const actorId = await assertAdminUser()
    if (!actorId) return { data: {}, initialized: false, error: 'forbidden' }

    const db = createAdminClient()
    const { data, error } = await db.from('site_footer').select('*')
    if (error) {
      // table not found → not initialized
      if (error.code === '42P01') return { data: {}, initialized: false }
      return { data: {}, initialized: false, error: 'load_failed' }
    }

    const byLocale: Record<string, SiteFooter | null> = {
      sq: null, en: null, uk: null, it: null,
    }
    for (const row of data ?? []) {
      byLocale[row.locale] = {
        ...row,
        nav_links:    (row.nav_links    as FooterLink[] | null) ?? [],
        info_links:   (row.info_links   as FooterLink[] | null) ?? [],
        social_links: (row.social_links as FooterLink[] | null) ?? [],
      } as SiteFooter
    }
    return { data: byLocale, initialized: true }
  } catch {
    return { data: {}, initialized: false, error: 'load_failed' }
  }
}

// ── Admin: upsert one locale row ──────────────────────────────────────────────

export async function upsertFooterContent(
  locale: string,
  payload: Omit<SiteFooter, 'locale' | 'updated_at' | 'updated_by'>,
): Promise<{ error?: string }> {
  if (!(VALID_LOCALES as readonly string[]).includes(locale)) {
    return { error: 'validation' }
  }
  if (!validateLinks(payload.nav_links) || !validateLinks(payload.info_links) || !validateLinks(payload.social_links)) {
    return { error: 'invalid_url' }
  }

  const actorId = await assertAdminUser()
  if (!actorId) return { error: 'forbidden' }

  const db = createAdminClient()
  const { error } = await db.from('site_footer').upsert({
    locale,
    brand_title:          payload.brand_title.trim(),
    tagline:              payload.tagline.trim(),
    nav_section_title:    payload.nav_section_title.trim(),
    nav_links:            payload.nav_links,
    info_section_title:   payload.info_section_title.trim(),
    info_links:           payload.info_links,
    social_section_title: payload.social_section_title.trim(),
    social_links:         payload.social_links,
    copyright_template:   payload.copyright_template.trim(),
    updated_at:           new Date().toISOString(),
    updated_by:           actorId,
  }, { onConflict: 'locale' })

  if (error) {
    console.error('[footer] upsert failed', { locale, error })
    return { error: 'transient' }
  }

  revalidatePath('/', 'layout')
  return {}
}
