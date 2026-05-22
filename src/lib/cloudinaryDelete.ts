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
  outcome: 'SKIP_REFERENCED' | 'DRY_RUN' | 'DELETED' | 'ERROR'
  referencedIn?: string[]
  error?: string
}

function logEntry(entry: DeleteLog) {
  console.info('[deleteAsset]', entry)
}

// ── Reference check ───────────────────────────────────────────────────────────

async function checkIsReferenced(publicId: string): Promise<{ referenced: boolean; tables: string[] }> {
  const db = createAdminClient()
  const tables: string[] = []
  // URL pattern: publicId appears anywhere after /upload/ in the stored URL.
  const urlPattern = `%${publicId}%`

  // listing_images.public_id — direct match (most precise check)
  const { data: byPublicId } = await db
    .from('listing_images')
    .select('id')
    .eq('public_id', publicId)
    .limit(1)
  if (byPublicId?.length) tables.push('listing_images.public_id')

  // listing_images.url — URL reference
  const { data: byImgUrl } = await db
    .from('listing_images')
    .select('id')
    .ilike('url', urlPattern)
    .limit(1)
  if (byImgUrl?.length) tables.push('listing_images.url')

  // users.avatar_url
  const { data: byAvatarUrl } = await db
    .from('users')
    .select('id')
    .ilike('avatar_url', urlPattern)
    .limit(1)
  if (byAvatarUrl?.length) tables.push('users.avatar_url')

  // companies.logo_url
  const { data: byLogoUrl } = await db
    .from('companies')
    .select('id')
    .ilike('logo_url', urlPattern)
    .limit(1)
  if (byLogoUrl?.length) tables.push('companies.logo_url')

  // popular_locations.photo — placeholder for Epic J; table added in J.1
  // TODO(Epic J): add check once popular_locations table exists

  return { referenced: tables.length > 0, tables }
}

// ── Cloudinary destroy ────────────────────────────────────────────────────────

async function cloudinaryDestroyAsset(publicId: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary env vars missing')

  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`
  const signature = createHash('sha1').update(`${paramsToSign}${apiSecret}`).digest('hex')

  const form = new FormData()
  form.append('public_id', publicId)
  form.append('timestamp', String(timestamp))
  form.append('api_key', apiKey)
  form.append('signature', signature)

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

  const { referenced, tables } = await checkIsReferenced(publicId)

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
