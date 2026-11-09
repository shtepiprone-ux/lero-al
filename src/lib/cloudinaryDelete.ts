/**
 * Canonical Cloudinary asset deletion wrapper — Epic H.6 / Task 144.
 *
 * RULE: This is the ONLY allowed way to delete assets from Cloudinary.
 * No code in this project may call the Cloudinary /destroy API directly.
 * See docs/integrations.md §Cloudinary deletion rules.
 *
 * Safety guarantees:
 *   1. Reference check — every DB table that can store an asset URL / public_id
 *      is checked; any match cancels the delete.
 *   2. Dry-run mode — default everywhere; real deletes require
 *      CLOUDINARY_DELETE_MODE=enabled in env. Never enabled by default.
 *   3. Structured log — every call is logged regardless of outcome so
 *      H.3 / H.5 / H.7 callers have an audit trail.
 */

import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { escapeLike } from '@/lib/postgrest/escape'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DeleteAssetOptions {
  /** Human-readable reason for the delete — included in every log entry. */
  reason: string
  /**
   * Override dry-run for this call.
   * When omitted the global env var `CLOUDINARY_DELETE_MODE` is used:
   *   'enabled'  → real delete; any other value or absent → dry-run.
   */
  dryRun?: boolean
}

export interface DeleteAssetResult {
  /** True when the reference check found an active DB reference. */
  skipped: boolean
  /** Human-readable reason for skip (only set when skipped=true). */
  skipReason?: string
  /** Whether this call ran in dry-run mode. */
  dryRun: boolean
  /** True only when the Cloudinary API was actually called and succeeded. */
  deleted: boolean
}

// ── Structured log ────────────────────────────────────────────────────────────

interface DeleteLog {
  publicId: string
  reason: string
  dryRun: boolean
  outcome: 'SKIP_REFERENCED' | 'SKIP_LOOKUP_FAILED' | 'DRY_RUN' | 'DELETED' | 'ERROR'
  referencedIn?: string[]
  lookup?: string
  error?: string
}

function logEntry(entry: DeleteLog) {
  console.info('[deleteAsset]', entry)
}

// ── Reference check ───────────────────────────────────────────────────────────

/**
 * Where the id of an asset can still be in use. Task 923 R66 (e): the check used to look at five places and to IGNORE the error of every read, so a failed read counted
 * as "not referenced" and the file was destroyed; it did not look at `pages.content` (CMS images), `users.company_logo_url` or the image values of `site_settings`.
 * Now every read is checked: ANY error (or a read that throws) keeps the file (`SKIP_LOOKUP_FAILED`, logged), never deletes it.
 * Task 923 R145: seven reads. `listing_images` has no id column (its columns are id, listing_id, url, order, is_cover), so a read filtered on one always answered an error and every file was kept.
 */
async function checkIsReferenced(publicId: string): Promise<{ referenced: boolean; tables: string[]; lookupFailed: string | null }> {
  const db = createAdminClient()
  const tables: string[] = []
  let lookupFailed: string | null = null
  // URL pattern: publicId appears anywhere after /upload/ in the stored URL.
  // `%` and `_` are literal characters of the id, not wildcards (Task 923 Revision 7): "listings/ab_cd" must not also match "listings/abXcd"
  const urlPattern = `%${escapeLike(publicId)}%`

  type Read = PromiseLike<{ data: unknown; error: { code?: string } | null }>
  const check = async (label: string, read: () => Read, found: (data: unknown) => boolean) => {
    try {
      const { data, error } = await read()
      if (error) { lookupFailed ??= `${label}: ${error.code ?? 'error'}`; return }
      if (found(data)) tables.push(label)
    } catch (err) {
      lookupFailed ??= `${label}: ${err instanceof Error ? err.message : 'threw'}`
    }
  }
  const any = (data: unknown) => Array.isArray(data) && data.length > 0

  // listing_images.url — URL reference (the table has no id column: its columns are id, listing_id, url, order and is_cover, so the URL read covers an image)
  await check('listing_images.url', () => db.from('listing_images').select('id').ilike('url', urlPattern).limit(1), any)
  // users.avatar_url
  await check('users.avatar_url', () => db.from('users').select('id').ilike('avatar_url', urlPattern).limit(1), any)
  // users.company_logo_url (an agent's own agency logo)
  await check('users.company_logo_url', () => db.from('users').select('id').ilike('company_logo_url', urlPattern).limit(1), any)
  // companies.logo_url
  await check('companies.logo_url', () => db.from('companies').select('id').ilike('logo_url', urlPattern).limit(1), any)
  // popular location photos are stored in locations.image_url (J.1 uses existing locations table)
  await check('locations.image_url', () => db.from('locations').select('id').ilike('image_url', urlPattern).limit(1), any)
  // the image values of the site settings (logo, favicon, social image …): any setting whose value carries the id
  await check('site_settings.value', () => db.from('site_settings').select('key').ilike('value', urlPattern).limit(1), any)
  // CMS pages: the content is a JSON document with image nodes; the table is small, so the document is searched here rather than through a JSON path
  await check('pages.content', () => db.from('pages').select('id, content').limit(500), (data) => Array.isArray(data) && data.some((row) => JSON.stringify((row as { content?: unknown }).content ?? null).includes(publicId)))

  return { referenced: tables.length > 0, tables, lookupFailed }
}

// ── Cloudinary destroy ────────────────────────────────────────────────────────

async function cloudinaryDestroyAsset(publicId: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary env vars missing')

  const timestamp = Math.round(Date.now() / 1000)
  // SHA-256 (Task 951 AC6): the signed string is the one SHA-1 signed; `signature_algorithm=sha256` is sent as a form field and is NOT signed (Cloudinary 401, 2026-11-09)
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`
  const signature = createHash('sha256').update(`${paramsToSign}${apiSecret}`).digest('hex')

  const form = new FormData()
  form.append('public_id', publicId)
  form.append('timestamp', String(timestamp))
  form.append('api_key', apiKey)
  form.append('signature', signature)
  form.append('signature_algorithm', 'sha256')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status))
    throw new Error(`Cloudinary destroy failed: ${errText}`)
  }
  const data = await res.json() as { result?: string }
  if (data.result !== 'ok') {
    throw new Error(`Cloudinary destroy unexpected result: ${JSON.stringify(data)}`)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Safely delete a Cloudinary asset.
 *
 * Always runs the reference check first. Never deletes a referenced asset.
 * Real deletes only occur when `CLOUDINARY_DELETE_MODE=enabled` (env) or
 * `options.dryRun` is explicitly false.
 *
 * @example
 * // H.3 avatar replacement:
 * await deleteAsset(oldPublicId, { reason: 'avatar_replaced' })
 *
 * @example
 * // H.5 listing image removal:
 * await deleteAsset(publicId, { reason: 'listing_image_removed' })
 */
export async function deleteAsset(
  publicId: string,
  options: DeleteAssetOptions,
): Promise<DeleteAssetResult> {
  const dryRun = options.dryRun ?? (process.env.CLOUDINARY_DELETE_MODE !== 'enabled')

  const { referenced, tables, lookupFailed } = await checkIsReferenced(publicId)

  // Task 923 R66 (e): fail closed. A reference read that failed means the file may still be in use: it is kept, logged, and nothing is destroyed.
  if (lookupFailed) {
    logEntry({ publicId, reason: options.reason, dryRun, outcome: 'SKIP_LOOKUP_FAILED', lookup: lookupFailed })
    return { skipped: true, skipReason: 'reference lookup failed', dryRun, deleted: false }
  }

  if (referenced) {
    logEntry({ publicId, reason: options.reason, dryRun, outcome: 'SKIP_REFERENCED', referencedIn: tables })
    return {
      skipped: true,
      skipReason: `referenced in: ${tables.join(', ')}`,
      dryRun,
      deleted: false,
    }
  }

  if (dryRun) {
    logEntry({ publicId, reason: options.reason, dryRun: true, outcome: 'DRY_RUN' })
    return { skipped: false, dryRun: true, deleted: false }
  }

  try {
    await cloudinaryDestroyAsset(publicId)
    logEntry({ publicId, reason: options.reason, dryRun: false, outcome: 'DELETED' })
    return { skipped: false, dryRun: false, deleted: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    logEntry({ publicId, reason: options.reason, dryRun: false, outcome: 'ERROR', error })
    throw err
  }
}
