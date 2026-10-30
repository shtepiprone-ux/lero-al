'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkStaff } from '@/lib/auth/staff'
import { revalidatePath } from 'next/cache'
import { resolveLinkTarget } from '@/lib/security/safeUrl'
import type { SiteFooter, FooterLink } from '@/types/database'
import { isValidFooterUrl, normalizeInternalPath, STATIC_INTERNAL_PATHS } from '@/lib/footer-route-allowlist'

const VALID_LOCALES = ['sq', 'en', 'uk', 'it'] as const

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
  const allLinks = [...payload.nav_links, ...payload.info_links, ...payload.social_links]
  if (allLinks.some(l => l.enabled && !isValidFooterUrl(l.url))) {
    return { error: 'invalid_internal_link' }
  }

  // R7/review-1 F1: the admin check runs after the pure checks above but BEFORE any
  // service-role client or DB call — a 'use server' export is callable by anyone, so an
  // unauthenticated/non-admin caller must never trigger a service-role `pages` read.
  const actorId = await assertAdminUser()
  if (!actorId) return { error: 'forbidden' }

  const db = createAdminClient()

  // R4: resolve every enabled CMS-slug candidate against `pages` in one batched query —
  // not one query per link. Unknown or unpublished → invalid_internal_link, same as the
  // shape rejection above, so the whole locale payload (nav + info + social) is not saved.
  const candidateSlugs = collectCandidateCmsSlugs(allLinks)
  if (candidateSlugs.size > 0) {
    const { data: publishedPages, error: pagesError } = await db
      .from('pages')
      .select('slug')
      .in('slug', Array.from(candidateSlugs))
      .eq('is_published', true)
    if (pagesError) {
      console.error('[footer] pages lookup failed', { error: pagesError })
      return { error: 'transient' }
    }
    const publishedSlugs = new Set((publishedPages ?? []).map(p => p.slug))
    for (const slug of candidateSlugs) {
      if (!publishedSlugs.has(slug)) {
        return { error: 'invalid_internal_link' }
      }
    }
  }

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
