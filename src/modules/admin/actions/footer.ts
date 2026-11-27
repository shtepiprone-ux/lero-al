'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkStaff } from '@/lib/auth/staff'
import { revalidatePath } from 'next/cache'
import { resolveLinkTarget } from '@/lib/security/safeUrl'
import type { SiteFooter, FooterLink } from '@/types/database'
import { isValidFooterUrl, normalizeInternalPath, STATIC_INTERNAL_PATHS } from '@/lib/footer-route-allowlist'
import { FOOTER_SETTING_KEYS, validFooterSettingValue, withinFooterBounds } from '@/modules/admin/lib/settingKeys'

const VALID_LOCALES = ['sq', 'en', 'uk', 'it'] as const

/** what one language row of the Footer page saves (Task 989: the social links are shared by all languages and saved by `saveFooterShared`) */
export type FooterLocalePayload = Omit<SiteFooter, 'locale' | 'updated_at' | 'updated_by' | 'social_links'>

// ── Auth guard ────────────────────────────────────────────────────────────────

async function assertAdminUser(): Promise<string | null> {
  // one guard for every staff action (Task 923 R71 (k)): a blocked, deactivated, deleted or missing account, or a failed lookup, is not an administrator
  const staff = await checkStaff({ adminOnly: true })
  return staff.ok ? staff.userId : null
}

// ── URL validation ─────────────────────────────────────────────────────────────

// An ALLOW-list (Task 923 Revision 7, S9): the old deny-list looked for the words javascript: and data:, and `java<TAB>script:` passed it because a browser
// removes the tab. A link is saved only when it resolves to a path of the site, an http(s) address, mailto or tel.
function isValidLinkUrl(url: string): boolean {
  if (!url) return true
  return resolveLinkTarget(url, 'sq') !== null
}

function validateLinks(links: FooterLink[]): boolean {
  return links.every(l => isValidLinkUrl(l.url))
}

// A single-segment internal path that is not one of the static entries is a candidate
// CMS page slug (its shape already passed isValidFooterUrl's validateSlug check). Its
// EXISTENCE — is it a real, published `pages` row — is decided here, on the server,
// never by the client-reachable shape check alone.
function collectCandidateCmsSlugs(links: FooterLink[]): Set<string> {
  const slugs = new Set<string>()
  for (const link of links) {
    if (!link.enabled) continue
    const trimmed = link.url.trim()
    if (!trimmed || !trimmed.startsWith('/')) continue
    const normalized = normalizeInternalPath(trimmed)
    if ((STATIC_INTERNAL_PATHS as readonly string[]).includes(normalized)) continue
    const slug = normalized.slice(1)
    if (slug) slugs.add(slug)
  }
  return slugs
}

// The public footer read (`getFooterContent`) is NOT here: a `'use server'` export is callable by anyone, so it lives in the `server-only` module
// `@/modules/admin/lib/settings` (Task 923 R66 (n)).

/**
 * R4: every enabled CMS-slug candidate is resolved against `pages` in one batched query, not one query per link. Unknown or unpublished → `invalid_internal_link`,
 * as the shape rejection, so the whole payload is not saved. Called only after the admin check (a service-role read).
 */
async function checkCmsSlugs(db: ReturnType<typeof createAdminClient>, links: FooterLink[]): Promise<'transient' | 'invalid_internal_link' | null> {
  const candidateSlugs = collectCandidateCmsSlugs(links)
  if (candidateSlugs.size === 0) return null
  const { data: publishedPages, error: pagesError } = await db
    .from('pages')
    .select('slug')
    .in('slug', Array.from(candidateSlugs))
    .eq('is_published', true)
  if (pagesError) {
    console.error('[footer] pages lookup failed', { error: pagesError })
    return 'transient'
  }
  const publishedSlugs = new Set((publishedPages ?? []).map(p => p.slug))
  for (const slug of candidateSlugs) {
    if (!publishedSlugs.has(slug)) return 'invalid_internal_link'
  }
  return null
}

// ── Admin: read all 4 locale rows ─────────────────────────────────────────────

export async function getAllFooterContent(): Promise<{
  data: Record<string, SiteFooter | null>
  /** Task 989: the shared block (contacts and switches), from `site_settings`; only with a successful read */
  shared?: Record<string, string>
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

    const { data: settingRows, error: settingsError } = await db.from('site_settings').select('key, value').in('key', [...FOOTER_SETTING_KEYS])
    if (settingsError) return { data: {}, initialized: false, error: 'load_failed' }
    const shared = Object.fromEntries((settingRows ?? []).map(r => [r.key as string, r.value as string]))
    return { data: byLocale, shared, initialized: true }
  } catch {
    return { data: {}, initialized: false, error: 'load_failed' }
  }
}

// ── Admin: the shared block (Task 989) ────────────────────────────────────────

/** one social link as it is stored: its own fields only, whatever else the request carried */
function socialLinkFrom(raw: unknown): FooterLink | null {
  if (!raw || typeof raw !== 'object') return null
  const { id, label, url, enabled, order } = raw as Record<string, unknown>
  if (typeof id !== 'string' || typeof label !== 'string' || typeof url !== 'string' || typeof enabled !== 'boolean') return null
  if (typeof order !== 'number' || !Number.isInteger(order) || order < 0) return null
  return { id, label, url, enabled, order }
}

/**
 * The shared block of the Footer page (Task 989, O989-1): the phone, the support and sales e-mails and the show switches go to `site_settings`, the social list to
 * the four language rows of `site_footer`. The same admin check as `upsertFooterContent`, before any read or write; one invalid value refuses the whole save.
 */
export async function saveFooterShared(payload: {
  settings: Record<string, string>
  social_links: FooterLink[]
}): Promise<{ error?: string }> {
  const actorId = await assertAdminUser()
  if (!actorId) return { error: 'forbidden' }

  if (!payload || typeof payload !== 'object') return { error: 'validation' }
  const { settings, social_links: rawLinks } = payload as { settings?: unknown; social_links?: unknown }
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return { error: 'validation' }
  const entries = Object.entries(settings as Record<string, unknown>)
  if (entries.some(([key, value]) => !validFooterSettingValue(key, value))) return { error: 'validation' }
  // a list that is not a list, more than 50 links or a field over its bound (Revision 1, F4)
  if (!Array.isArray(rawLinks) || !withinFooterBounds([rawLinks])) return { error: 'validation' }
  const socialLinks = rawLinks.map(socialLinkFrom)
  if (socialLinks.some(link => link === null)) return { error: 'validation' }
  const links = socialLinks as FooterLink[]
  if (!validateLinks(links)) return { error: 'invalid_url' }
  if (links.some(l => l.enabled && !isValidFooterUrl(l.url))) return { error: 'invalid_internal_link' }

  const db = createAdminClient()
  const slugError = await checkCmsSlugs(db, links)
  if (slugError) return { error: slugError }

  const now = new Date().toISOString()
  if (entries.length > 0) {
    const { error: settingsError } = await db
      .from('site_settings')
      .upsert(entries.map(([key, value]) => ({ key, value: value as string, updated_at: now })), { onConflict: 'key' })
    if (settingsError) {
      console.error('[footer] shared settings upsert failed', { error: settingsError })
      return { error: 'transient' }
    }
  }

  const { error } = await db
    .from('site_footer')
    .update({ social_links: links, updated_at: now, updated_by: actorId })
    .in('locale', [...VALID_LOCALES])
  if (error) {
    console.error('[footer] social links update failed', { error })
    return { error: 'transient' }
  }

  revalidatePath('/', 'layout')
  return {}
}

// ── Admin: upsert one locale row ──────────────────────────────────────────────

export async function upsertFooterContent(
  locale: string,
  payload: FooterLocalePayload,
): Promise<{ error?: string }> {
  if (!(VALID_LOCALES as readonly string[]).includes(locale)) {
    return { error: 'validation' }
  }
  // Revision 1, F4: at most 50 links per list, each field of a link and each text field within its bound
  const texts = [payload.brand_title, payload.tagline, payload.nav_section_title, payload.info_section_title, payload.social_section_title, payload.copyright_template]
  if (!withinFooterBounds([payload.nav_links, payload.info_links], texts)) {
    return { error: 'validation' }
  }
  if (!validateLinks(payload.nav_links) || !validateLinks(payload.info_links)) {
    return { error: 'invalid_url' }
  }
  const allLinks = [...payload.nav_links, ...payload.info_links]
  if (allLinks.some(l => l.enabled && !isValidFooterUrl(l.url))) {
    return { error: 'invalid_internal_link' }
  }

  // R7/review-1 F1: the admin check runs after the pure checks above but BEFORE any
  // service-role client or DB call — a 'use server' export is callable by anyone, so an
  // unauthenticated/non-admin caller must never trigger a service-role `pages` read.
  const actorId = await assertAdminUser()
  if (!actorId) return { error: 'forbidden' }

  const db = createAdminClient()

  const slugError = await checkCmsSlugs(db, allLinks)
  if (slugError) return { error: slugError }

  // Task 989: the social links are not written here: they are shared by the four rows and saved by `saveFooterShared`
  const { error } = await db.from('site_footer').upsert({
    locale,
    brand_title:          payload.brand_title.trim(),
    tagline:              payload.tagline.trim(),
    nav_section_title:    payload.nav_section_title.trim(),
    nav_links:            payload.nav_links,
    info_section_title:   payload.info_section_title.trim(),
    info_links:           payload.info_links,
    social_section_title: payload.social_section_title.trim(),
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
