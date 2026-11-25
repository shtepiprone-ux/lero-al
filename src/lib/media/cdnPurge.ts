import 'server-only'
import { MEDIA_HOST } from '@/lib/uploads/imageUrl'

/**
 * Purges the folders of deleted photos from the Cloudflare CDN (Task 1038, owner decision O1038-5).
 *
 * The CDN keeps a photo for `s-maxage=31536000`, so deleting the objects from R2 is not enough: a deleted photo would stay reachable from the cache. `POST /zones/{zone_id}/purge_cache`
 * with `prefixes` clears every cached variant under a photo's folder (the plain address, the one with an `Origin` header, one with a query string). It NEVER purges everything and never
 * purges by file, tag or host: a prefix is `media.lero.al/<owner>/listings/<folder uuid>/`, which holds only `full` and `thumb` of one photo.
 *
 * Cloudflare (read 2026-11-25): the Free plan allows 100 operations per request and 5 prefix requests per minute, so one call carries every photo of a listing (at most 100 per
 * request); a 429 or a 5xx is retried twice, after `Retry-After` when Cloudflare sends it, else after 1 s and 4 s. The outcome is returned and logged: `purged` only when Cloudflare
 * answered `success: true` for every request, otherwise `purge_failed` with the prefixes that were not purged and Cloudflare's error codes. The zone id and the token are read here
 * only and are in no log line and no answer.
 */

export type PurgeResult =
  | { outcome: 'purged'; prefixes: string[] }
  | { outcome: 'purge_failed'; prefixes: string[]; codes: (string | number)[] }

const API = 'https://api.cloudflare.com/client/v4/zones'
const MAX_PER_REQUEST = 100
const BACKOFF_MS = [1_000, 4_000]
/** a `Retry-After` longer than this is waited for only this long: the delete runs inside a request, and the caller has the failure to report */
const MAX_RETRY_AFTER_MS = 30_000

/** `media.lero.al/<owner>/listings/<uuid>/`: no scheme, query, fragment, wildcard or `..` */
const PREFIX = new RegExp(`^${MEDIA_HOST.replace(/\./g, '\\.')}/[A-Za-z0-9_-]+/listings/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/$`)

type Attempt = { ok: true } | { ok: false; retry: boolean; retryAfterMs: number | null; codes: (string | number)[] }

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function attempt(zone: string, token: string, prefixes: string[]): Promise<Attempt> {
  let res: Response
  try {
    res = await fetch(`${API}/${zone}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes }),
    })
  } catch {
    return { ok: false, retry: true, retryAfterMs: null, codes: ['network'] }
  }
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  const parsed = body as { success?: unknown; errors?: unknown } | null
  if (res.ok && parsed?.success === true) return { ok: true }
  const errors = Array.isArray(parsed?.errors) ? (parsed.errors as { code?: unknown }[]) : []
  const codes = errors.map((error) => error?.code).filter((code): code is string | number => typeof code === 'string' || typeof code === 'number')
  const seconds = Number(res.headers.get('Retry-After'))
  return {
    ok: false,
    retry: res.status === 429 || res.status >= 500,
    retryAfterMs: Number.isFinite(seconds) && seconds >= 0 && res.headers.get('Retry-After') !== null ? Math.min(seconds * 1000, MAX_RETRY_AFTER_MS) : null,
    codes: codes.length > 0 ? codes : [res.status],
  }
}

export async function purgePhotoFolders(prefixes: readonly string[]): Promise<PurgeResult> {
  const unique = [...new Set(prefixes)]
  if (unique.length === 0) return { outcome: 'purged', prefixes: [] }
  const failed = (list: string[], codes: (string | number)[]): PurgeResult => {
    console.error('[cdnPurge] purge_failed', { prefixes: list, codes })
    return { outcome: 'purge_failed', prefixes: list, codes }
  }

  const invalid = unique.filter((prefix) => typeof prefix !== 'string' || !PREFIX.test(prefix))
  if (invalid.length > 0) return failed(invalid, ['invalid_prefix'])

  const zone = process.env.CLOUDFLARE_ZONE_ID
  const token = process.env.CLOUDFLARE_CACHE_PURGE_TOKEN
  if (!zone || !token) return failed(unique, ['not_configured'])

  const notPurged: string[] = []
  const codes: (string | number)[] = []
  for (let from = 0; from < unique.length; from += MAX_PER_REQUEST) {
    const chunk = unique.slice(from, from + MAX_PER_REQUEST)
    let last: Attempt = await attempt(zone, token, chunk)
    for (let retry = 0; !last.ok && last.retry && retry < BACKOFF_MS.length; retry++) {
      await wait(last.retryAfterMs ?? BACKOFF_MS[retry])
      last = await attempt(zone, token, chunk)
    }
    if (!last.ok) {
      notPurged.push(...chunk)
      codes.push(...last.codes)
    }
  }
  if (notPurged.length > 0) return failed(notPurged, codes)
  console.info('[cdnPurge] purged', { prefixes: unique.length })
  return { outcome: 'purged', prefixes: unique }
}
