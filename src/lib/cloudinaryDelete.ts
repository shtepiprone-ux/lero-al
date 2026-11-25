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
import {
  BudgetExhausted, listAssetsInFolder, listChildFolders, spendCall, type AdminBudget,
} from '@/lib/cloudinaryAdminRead'

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

/** rows of `pages` read at a time by the reference check (Task 957) */
const PAGES_PER_READ = 500

/**
 * Where the id of an asset can still be in use. Task 923 R66 (e): the check used to look at five places and to IGNORE the error of every read, so a failed read counted
 * as "not referenced" and the file was destroyed; it did not look at `pages.content` (CMS images), `users.company_logo_url` or the image values of `site_settings`.
 * Now every read is checked: ANY error (or a read that throws) keeps the file (`SKIP_LOOKUP_FAILED`, logged), never deletes it.
 * Task 923 R145: seven reads. `listing_images` has no id column (its columns are id, listing_id, url, order, is_cover), so a read filtered on one always answered an error and every file was kept.
 */
export async function checkIsReferenced(publicId: string): Promise<{ referenced: boolean; tables: string[]; lookupFailed: string | null }> {
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
  // CMS pages: the content is a JSON document with image nodes, so the document is searched here rather than through a JSON path. EVERY page is read, in pages of 500 ordered by id, until
  // a short page (Task 957, C-05: a read of the first 500 only called an asset on a later page unreferenced); a failed read of any page fails the whole check (the file is kept).
  const readPages = async (): Promise<{ data: unknown; error: { code?: string } | null }> => {
    for (let from = 0; ; from += PAGES_PER_READ) {
      const { data, error } = await db.from('pages').select('id, content').order('id').range(from, from + PAGES_PER_READ - 1)
      if (error) return { data: null, error }
      const rows = Array.isArray(data) ? (data as { content?: unknown }[]) : []
      if (rows.some((row) => JSON.stringify(row.content ?? null).includes(publicId))) return { data: true, error: null }
      if (rows.length < PAGES_PER_READ) return { data: false, error: null }
    }
  }
  await check('pages.content', readPages, (data) => data === true)

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

// ── Folders (Task 957, O957-4) ────────────────────────────────────────────────

export const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const UUID = UUID_PATTERN
const UUID_ONLY = new RegExp(`^${UUID}$`)
/** the only folders the cleanup removes when they are empty: an account's root, its `listings`, a listing's folder and its `avatars` */
export const EMPTY_FOLDER_ALLOWED = new RegExp(`^${UUID}(/listings(/${UUID})?|/avatars)?$`)
/** a folder name under an account: what a person or the console gave it, with no dot and no empty or odd segment */
const ACCOUNT_SUBFOLDER = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/

export interface DeleteFolderResult {
  /** the path is not one this module removes: nothing was called */
  refused: boolean
  dryRun: boolean
  /** true only when the Cloudinary API was called and succeeded */
  deleted: boolean
}

/** `DELETE /folders/<path>`; Cloudinary refuses a folder that is not empty, so a call can never remove a file with it. */
async function cloudinaryDeleteFolder(path: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary env vars missing')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/folders/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'DELETE',
    headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}` },
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status))
    throw new Error(`Cloudinary folder delete failed: ${res.status} ${errText.slice(0, 200)}`)
  }
}

/**
 * Removes one EMPTY folder of an account: `<uuid>`, `<uuid>/listings`, `<uuid>/listings/<uuid>` or `<uuid>/avatars`. Any other path (`avatars`, `companies`, `Lero`, `<uuid>/Brand`, `..`) is
 * refused and nothing is called. The same mode switch as `deleteAsset`: a dry run calls nothing. The caller proves the folder is empty; Cloudinary refuses a folder that is not.
 */
export async function deleteEmptyFolder(path: string, options: { reason: string; dryRun?: boolean }): Promise<DeleteFolderResult> {
  const dryRun = options.dryRun ?? (process.env.CLOUDINARY_DELETE_MODE !== 'enabled')
  if (!EMPTY_FOLDER_ALLOWED.test(path)) return { refused: true, dryRun: false, deleted: false }
  if (dryRun) return { refused: false, dryRun: true, deleted: false }
  await cloudinaryDeleteFolder(path)
  console.info('[deleteFolder]', { path, reason: options.reason, outcome: 'DELETED' })
  return { refused: false, dryRun: false, deleted: true }
}

export type PurgeOutcome = 'purged' | 'kept_some' | 'dry_run' | 'account_exists' | 'lookup_failed' | 'invalid_id' | 'budget_exhausted' | 'failed'

export interface PurgeResult {
  outcome: PurgeOutcome
  assetsDeleted: number
  assetsKept: number
  foldersRemoved: number
}

/**
 * Removes the whole Cloudinary folder of an account that is GONE (owner, 2026-11-18: deleting a user removes "the user's main folder and all files and folders in it"): every file of every
 * folder under `<userId>` (any name, `Brand` included) through `deleteAsset` (its reference check keeps a file a row still uses, the site logo), then the emptied folders, deepest first,
 * `<userId>` last. A folder that holds a kept file stays with its parents.
 *
 * It first proves the account is gone: `auth.admin.getUserById` must answer "not found"; any other answer or error touches nothing. An id that is not a UUID (`Lero`, `avatars`) is refused
 * before anything is read. `options.budget` caps the Admin API calls and the asset deletions of the run (the cleanup shares one budget over every account).
 */
export async function purgeAccountFolder(userId: string, options: { budget?: AdminBudget; dryRun?: boolean } = {}): Promise<PurgeResult> {
  const result: PurgeResult = { outcome: 'purged', assetsDeleted: 0, assetsKept: 0, foldersRemoved: 0 }
  if (!UUID_ONLY.test(userId)) return { ...result, outcome: 'invalid_id' }

  try {
    const { data, error } = await createAdminClient().auth.admin.getUserById(userId)
    const gone = Boolean(error) && (error?.status === 404 || error?.code === 'user_not_found')
    if (!gone) return { ...result, outcome: error || !data?.user ? 'lookup_failed' : 'account_exists' }
  } catch {
    return { ...result, outcome: 'lookup_failed' }
  }

  const dryRun = options.dryRun ?? (process.env.CLOUDINARY_DELETE_MODE !== 'enabled')
  if (dryRun) return { ...result, outcome: 'dry_run' }

  const { budget } = options
  let failed = false
  /** the folders that stay: one that holds a kept or undeletable file, and every parent of it */
  const stays = new Set<string>()
  const keep = (folder: string) => {
    for (let path = folder; ; path = path.slice(0, path.lastIndexOf('/'))) {
      stays.add(path)
      if (!path.includes('/')) break
    }
  }
  try {
    // every folder under the account, the account's own first in the list; a folder with a name this module does not remove stays with its parents
    const folders: string[] = [userId]
    for (let at = 0; at < folders.length; at++) {
      for (const child of await listChildFolders(folders[at], budget)) {
        if (child.startsWith(`${folders[at]}/`) && ACCOUNT_SUBFOLDER.test(child.slice(folders[at].length + 1))) folders.push(child)
        else { failed = true; keep(child.startsWith(`${userId}/`) ? child : folders[at]) }
      }
    }

    for (const folder of [...folders].sort((a, b) => b.split('/').length - a.split('/').length)) {
      // every file of the folder is listed first, page by page, and only then removed: a list that changes under a cursor would skip files
      const ids: string[] = []
      let cursor: string | undefined
      for (let guard = 0; guard < 1000; guard++) {
        const page = await listAssetsInFolder(folder, cursor, budget)
        ids.push(...page.ids)
        if (!page.nextCursor) break
        cursor = page.nextCursor
      }
      for (const id of ids) {
        if (budget) {
          if (budget.deletes <= 0) throw new BudgetExhausted()
          budget.deletes -= 1
        }
        try {
          const outcome = await deleteAsset(id, { reason: 'account_folder', dryRun: false })
          if (outcome.deleted) result.assetsDeleted += 1
          else {
            result.assetsKept += 1
            keep(folder)
            if (outcome.skipReason === 'reference lookup failed') failed = true
          }
        } catch {
          failed = true
          keep(folder)
        }
      }
      if (stays.has(folder)) continue
      spendCall(budget)
      try {
        await cloudinaryDeleteFolder(folder)
        result.foldersRemoved += 1
      } catch (err) {
        failed = true
        keep(folder)
        console.error('[purgeAccountFolder] a folder was not removed', { code: err instanceof Error ? err.name : 'threw' })
      }
    }
  } catch (err) {
    if (err instanceof BudgetExhausted) return { ...result, outcome: 'budget_exhausted' }
    console.error('[purgeAccountFolder] the purge stopped', { code: err instanceof Error ? err.name : 'threw' })
    return { ...result, outcome: 'failed' }
  }
  if (failed) return { ...result, outcome: 'failed' }
  return { ...result, outcome: result.assetsKept > 0 ? 'kept_some' : 'purged' }
}
