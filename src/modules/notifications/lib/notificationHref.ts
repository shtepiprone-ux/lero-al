import { safeNextPath } from '@/lib/auth/safeRedirect'
import { SITE_URL } from '@/lib/siteUrl'

const SITE_ORIGIN = new URL(SITE_URL).origin
const LOCALE_SEGMENT = /^\/(?:sq|en|uk|it)(?=[/?#]|$)/

/**
 * The address a notification opens (Task 988; the render part of audit finding P-06). The stored link is a path without a language, a path with one, or an
 * absolute address of the site's own origin (the cron jobs write `${SITE_URL}/sq/...`). It must stay a path of this site (`safeNextPath`: no other origin, no `//`,
 * backslash or control character); its language segment is replaced by the reader's. An empty, foreign or unsafe link gives `null`: the item renders without an anchor.
 */
export function notificationHref(link: string | null | undefined, locale: string): string | null {
  if (typeof link !== 'string' || link.length === 0) return null
  const path = link.startsWith(`${SITE_ORIGIN}/`) ? link.slice(SITE_ORIGIN.length) : link
  const safe = safeNextPath(path, SITE_ORIGIN, '')
  if (!safe) return null
  return `/${locale}${safe.replace(LOCALE_SEGMENT, '').replace(/^\/(?=[?#]|$)/, '')}`
}
