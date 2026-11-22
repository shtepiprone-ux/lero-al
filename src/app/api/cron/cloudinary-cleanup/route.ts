/**
 * GET /api/cron/cloudinary-cleanup — Task 957 (O957-4), daily `15 3 * * *` (vercel.json).
 *
 * Until 2026-11-18 production never deleted a file (`CLOUDINARY_DELETE_MODE` was off) and nothing removed an upload no row used (a create form left open, a photo uploaded and never saved), nor
 * an empty folder. This job does, and only this:
 *  1. Assets: it pages the Admin API image list (at most 10 pages of 500) and keeps only a `public_id` of the shape `<uuid>/listings/<name>`, `<uuid>/listings/<uuid>/<name>` or
 *     `<uuid>/avatars/<name>` created MORE THAN 7 DAYS ago (a create form left open for days still saves). Each one goes to `deleteAsset(id, { reason: 'upload_unreferenced' })`, at most 100
 *     per run: its reference check over every table, its fail-closed lookup and its `CLOUDINARY_DELETE_MODE` decide; a used file is kept.
 *  2. Folders: every root folder named by a UUID. When the account is gone, `purgeAccountFolder` removes its whole folder (a file a row still uses stays with its folders); when it exists (or
 *     cannot be read), only the EMPTY folders `<uuid>/listings/<uuid>`, `<uuid>/listings` and `<uuid>/avatars`, and then `<uuid>` itself when nothing else is left in it, deepest first. A folder
 *     with an asset, with a subfolder outside that pattern (`<uuid>/Brand`) or not named by a UUID (`Lero`, `avatars`, `companies`) is never touched.
 *  3. At most 200 Admin API calls per run (the Free plan allows 500 per hour). The answer and one log line carry counts only, never an id.
 *
 * Authentication: Vercel injects Authorization: Bearer ${CRON_SECRET}; an unset secret refuses every call (401).
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron/verifyCronRequest'
import { BudgetExhausted, folderHasAssets, listChildFolders, listImageAssets, spendCall, type AdminBudget } from '@/lib/cloudinaryAdminRead'
import { EMPTY_FOLDER_ALLOWED, UUID_PATTERN, deleteAsset, deleteEmptyFolder, purgeAccountFolder } from '@/lib/cloudinaryDelete'

/** an upload no listing or avatar row may still need: the folder of a listing photo or of an avatar of an account */
const UPLOAD_ID = new RegExp(`^${UUID_PATTERN}/(listings/(${UUID_PATTERN}/)?|avatars/)[^/]+$`)
const ROOT_FOLDER = new RegExp(`^${UUID_PATTERN}$`)
const MIN_AGE_MS = 7 * 86_400_000
const MAX_IMAGE_PAGES = 10
const MAX_DELETES = 100
const MAX_CALLS = 200

interface Counts {
  scanned: number
  deleted: number
  wouldDelete: number
  kept: number
  foldersRemoved: number
  wouldRemoveFolders: number
  accountFoldersPurged: number
  errors: number
  dryRun: boolean
  budgetExhausted: boolean
}

export async function GET(request: NextRequest) {
  const auth = verifyCronRequest(request)
  if (!auth.ok) return auth.response

  const budget: AdminBudget = { calls: MAX_CALLS, deletes: MAX_DELETES }
  const counts: Counts = {
    scanned: 0, deleted: 0, wouldDelete: 0, kept: 0, foldersRemoved: 0, wouldRemoveFolders: 0, accountFoldersPurged: 0, errors: 0,
    dryRun: process.env.CLOUDINARY_DELETE_MODE !== 'enabled', budgetExhausted: false,
  }

  /** removes the folder when nothing is in it and nothing but pattern folders under it were left; returns whether it still exists */
  async function prune(path: string): Promise<boolean> {
    let stays = false
    for (const child of await listChildFolders(path, budget)) {
      if (EMPTY_FOLDER_ALLOWED.test(child)) { if (await prune(child)) stays = true } else stays = true
    }
    if (stays) return true
    if (await folderHasAssets(path, budget)) return true
    spendCall(budget)
    const outcome = await deleteEmptyFolder(path, { reason: 'empty_folder' })
    if (outcome.deleted) { counts.foldersRemoved += 1; return false }
    if (outcome.dryRun) counts.wouldRemoveFolders += 1
    return true
  }

  try {
    // 1. the unreferenced uploads of 7 days: the pages are listed first and only then removed from, so a deletion never shifts a page that is still to be read
    const now = Date.now()
    const candidates: string[] = []
    let cursor: string | undefined
    for (let page = 0; page < MAX_IMAGE_PAGES; page++) {
      const listed = await listImageAssets(cursor, budget)
      for (const asset of listed.assets) {
        counts.scanned += 1
        const created = Date.parse(asset.created_at)
        if (UPLOAD_ID.test(asset.public_id) && !Number.isNaN(created) && now - created > MIN_AGE_MS) candidates.push(asset.public_id)
      }
      cursor = listed.nextCursor
      if (!cursor) break
    }
    for (const publicId of candidates) {
      if (budget.deletes <= 0) break
      budget.deletes -= 1
      try {
        const outcome = await deleteAsset(publicId, { reason: 'upload_unreferenced' })
        if (outcome.deleted) counts.deleted += 1
        else if (outcome.dryRun && !outcome.skipped) counts.wouldDelete += 1
        else counts.kept += 1
      } catch {
        counts.errors += 1
      }
    }

    // 2. the folders of every account; a folder that fails is counted and the next account is still handled (only a spent budget stops the run)
    for (const root of await listChildFolders('', budget)) {
      if (!ROOT_FOLDER.test(root)) continue
      try {
        const purge = await purgeAccountFolder(root, { budget })
        if (purge.outcome === 'account_exists') {
          // a living account keeps its folders: only the empty ones of the pattern go
          await prune(root)
          continue
        }
        // an account that cannot be read ('lookup_failed') keeps everything too
        if (purge.outcome === 'lookup_failed') continue
        counts.deleted += purge.assetsDeleted
        counts.kept += purge.assetsKept
        counts.foldersRemoved += purge.foldersRemoved
        if (purge.outcome === 'purged' || purge.outcome === 'kept_some') counts.accountFoldersPurged += 1
        else if (purge.outcome === 'failed') counts.errors += 1
        else if (purge.outcome === 'budget_exhausted') throw new BudgetExhausted()
      } catch (err) {
        if (err instanceof BudgetExhausted) throw err
        counts.errors += 1
        console.error('[cron/cloudinary-cleanup] an account folder failed', { code: err instanceof Error ? err.name : 'threw' })
      }
    }
  } catch (err) {
    if (err instanceof BudgetExhausted) counts.budgetExhausted = true
    else {
      counts.errors += 1
      console.error('[cron/cloudinary-cleanup] the run stopped', { code: err instanceof Error ? err.name : 'threw' })
    }
  }

  console.info('[cron/cloudinary-cleanup] complete (counts only)', counts)
  return NextResponse.json(counts)
}
