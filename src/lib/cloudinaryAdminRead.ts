/**
 * Reads of Cloudinary's Admin API for the daily cleanup and the account-folder purge (Task 957, O957-4). READ-ONLY: every request here is a GET. The one module allowed to delete is
 * `cloudinaryDelete.ts`; nothing in this file can remove or change an asset or a folder.
 *
 * The answers read (a read-only probe of the live Admin API, 2026-11-19): `GET /resources/image` and `GET /resources/by_asset_folder` answer `{ resources: [{ public_id, asset_folder,
 * created_at, ... }], next_cursor? }`; `GET /folders` and `GET /folders/<path>` answer `{ folders: [{ name, path }], next_cursor? }`.
 *
 * Every request spends one call of the run's budget: the Free plan allows 500 Admin API calls per hour, so one run is capped (200 for the cleanup). A request made with no call left
 * throws `BudgetExhausted` and is NOT sent.
 */

/** What one run may spend: Admin API calls (reads and folder deletions) and asset deletions. */
export interface AdminBudget {
  calls: number
  deletes: number
}

export class BudgetExhausted extends Error {
  constructor() {
    super('the Admin API budget of this run is spent')
    this.name = 'BudgetExhausted'
  }
}

/** Takes one call from the budget (a run with no budget object is not capped); throws `BudgetExhausted` when none is left. */
export function spendCall(budget?: AdminBudget): void {
  if (!budget) return
  if (budget.calls <= 0) throw new BudgetExhausted()
  budget.calls -= 1
}

export const PAGE_SIZE = 500

export interface ListedAsset {
  public_id: string
  created_at: string
}

function credentials() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary env vars missing')
  return { cloudName, authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}` }
}

/** One GET of the Admin API; a 404 answers `null` (a folder that is gone has nothing in it), any other failure throws with the status only. */
async function adminGet(path: string, query: Record<string, string | undefined>, budget?: AdminBudget): Promise<Record<string, unknown> | null> {
  spendCall(budget)
  const { cloudName, authorization } = credentials()
  const url = new URL(`https://api.cloudinary.com/v1_1/${cloudName}${path}`)
  for (const [key, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(key, value)
  const res = await fetch(url, { method: 'GET', headers: { Authorization: authorization } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Cloudinary Admin API read failed: ${res.status}`)
  return (await res.json()) as Record<string, unknown>
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/')

/** One page of the image assets of the account, in the order Cloudinary lists them. */
export async function listImageAssets(cursor: string | undefined, budget?: AdminBudget): Promise<{ assets: ListedAsset[]; nextCursor: string | undefined }> {
  const body = await adminGet('/resources/image', { max_results: String(PAGE_SIZE), next_cursor: cursor }, budget)
  const rows = Array.isArray(body?.resources) ? (body.resources as { public_id?: unknown; created_at?: unknown }[]) : []
  const assets = rows.flatMap((row) => (typeof row.public_id === 'string' && typeof row.created_at === 'string' ? [{ public_id: row.public_id, created_at: row.created_at }] : []))
  return { assets, nextCursor: typeof body?.next_cursor === 'string' && body.next_cursor ? body.next_cursor : undefined }
}

/** The full paths of the folders directly under `path` (the account's root folders for ''), every page. */
export async function listChildFolders(path: string, budget?: AdminBudget): Promise<string[]> {
  const found: string[] = []
  let cursor: string | undefined
  do {
    const body = await adminGet(path === '' ? '/folders' : `/folders/${encodePath(path)}`, { max_results: String(PAGE_SIZE), next_cursor: cursor }, budget)
    const rows = Array.isArray(body?.folders) ? (body.folders as { path?: unknown }[]) : []
    for (const row of rows) if (typeof row.path === 'string') found.push(row.path)
    cursor = typeof body?.next_cursor === 'string' && body.next_cursor ? body.next_cursor : undefined
  } while (cursor)
  return found
}

/** One page of the image assets whose asset folder is exactly `path`. */
export async function listAssetsInFolder(path: string, cursor: string | undefined, budget?: AdminBudget, maxResults: number = PAGE_SIZE): Promise<{ ids: string[]; nextCursor: string | undefined }> {
  const body = await adminGet('/resources/by_asset_folder', { asset_folder: path, max_results: String(maxResults), next_cursor: cursor }, budget)
  const rows = Array.isArray(body?.resources) ? (body.resources as { public_id?: unknown }[]) : []
  return {
    ids: rows.flatMap((row) => (typeof row.public_id === 'string' ? [row.public_id] : [])),
    nextCursor: typeof body?.next_cursor === 'string' && body.next_cursor ? body.next_cursor : undefined,
  }
}

/** True when at least one image asset lies directly in the folder (one call). */
export async function folderHasAssets(path: string, budget?: AdminBudget): Promise<boolean> {
  return (await listAssetsInFolder(path, undefined, budget, 1)).ids.length > 0
}
