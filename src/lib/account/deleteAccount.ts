import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { publicIdFromUrl } from '@/lib/cloudinaryUpload'
import { deleteAsset } from '@/lib/cloudinaryDelete'

export type DeleteAccountResult = { ok: true; filesNotRemoved: number } | { ok: false; error: 'delete_failed' }

/** the Storage bucket of profile pictures: the one bucket of the project (Task 923 C1290); its objects of a person live under `<user id>/` */
const AVATAR_BUCKET = 'avatars'

/** rows asked for in one page of a collection read (Task 923 R146, F17) */
const PAGE_SIZE = 1000

type Db = ReturnType<typeof createAdminClient>
type ReadResult = { data: unknown; error: { code?: string } | null }

/**
 * The one owner of an account's deletion (Task 923 R141, owner decision D30): staff, the person themselves, every role. Authorization is the caller's: this function
 * deletes what it is asked to, so it is only ever called after the permission, the rank rule or the re-authentication of the caller.
 *
 * 1. Collect, through the service role, the Cloudinary id of every file of the person. The rows that hold the URLs go with the account, so they are read first, page by page
 *    so that no row is left out; a read that fails refuses the deletion, as the listing deletion does, because without it the files could not be released.
 * 2. `auth.admin.deleteUser` removes the Auth user, the profile and every dependent row (listings, their images, the company the person created ...) in one database
 *    transaction (deletion v4, `proposed-account-deletion.sql`). An error answers `delete_failed` and no file is touched.
 * 3. Only then the files are released: Cloudinary ids through `deleteAsset` (its reference check now passes; it is a dry run unless `CLOUDINARY_DELETE_MODE=enabled`),
 *    and the person's objects of the `avatars` bucket. A file that is not removed never undoes the deletion; it is counted in `filesNotRemoved`.
 *
 * A log line carries `userId`, `reason`, ids and error codes only: never a URL, an e-mail or a name.
 */
export async function deleteAccount(userId: string, options: { reason: 'staff' | 'self' }): Promise<DeleteAccountResult> {
  const { reason } = options
  let db: Db
  let publicIds: string[]
  try {
    db = createAdminClient()
    const collected = await collectPublicIds(db, userId)
    if (!collected.ok) {
      console.error('deleteAccount: a read before the deletion failed', { userId, reason, source: collected.source, code: collected.code })
      return { ok: false, error: 'delete_failed' }
    }
    publicIds = collected.publicIds
    const { error } = await db.auth.admin.deleteUser(userId)
    if (error) {
      console.error('deleteAccount: auth deletion failed', { userId, reason, code: error.code ?? error.status ?? 'error' })
      return { ok: false, error: 'delete_failed' }
    }
  } catch (err) {
    console.error('deleteAccount: the deletion threw', { userId, reason, code: errorCode(err) })
    return { ok: false, error: 'delete_failed' }
  }

  let filesNotRemoved = 0

  const released = await Promise.allSettled(publicIds.map((publicId) => deleteAsset(publicId, { reason: 'account_deleted' })))
  released.forEach((outcome, index) => {
    if (outcome.status === 'rejected') {
      filesNotRemoved += 1
      console.error('deleteAccount: a file was not removed', { userId, reason, publicId: publicIds[index], code: errorCode(outcome.reason) })
    } else if (outcome.value.skipped && outcome.value.skipReason === 'reference lookup failed') {
      filesNotRemoved += 1
      console.error('deleteAccount: a file was kept because its reference check failed', { userId, reason, publicId: publicIds[index] })
    }
  })

  filesNotRemoved += await removeAvatarObjects(db, userId, reason)

  return { ok: true, filesNotRemoved }
}

type Collected = { ok: true; publicIds: string[] } | { ok: false; source: string; code: string }

/** The Cloudinary public id of every file the account holds, unique; the URLs that are not Cloudinary's are not ids and are dropped. */
async function collectPublicIds(db: Db, userId: string): Promise<Collected> {
  const urls: (string | null)[] = []
  const rows = (data: unknown) => (Array.isArray(data) ? (data as Record<string, string | null>[]) : [])
  /** Reads one collection page by page, each page ordered by `id`, until a page has no row, so any number of rows is read; an error on any page fails the whole read. */
  const read = async (source: string, page: (from: number, to: number) => PromiseLike<ReadResult>, take: (batch: Record<string, string | null>[]) => void): Promise<Collected | null> => {
    for (let from = 0; ; ) {
      const { data, error } = await page(from, from + PAGE_SIZE - 1)
      if (error) return { ok: false, source, code: error.code ?? 'error' }
      const batch = rows(data)
      if (!batch.length) return null
      take(batch)
      from += batch.length
    }
  }

  let failed = await read('users', (from, to) => db.from('users').select('avatar_url, company_logo_url').eq('id', userId).order('id').range(from, to),
    (batch) => batch.forEach((row) => urls.push(row.avatar_url, row.company_logo_url)))
  if (failed) return failed

  // the images are read through their listing, so the number of listings the person holds does not grow the request
  failed = await read('listing_images', (from, to) => db.from('listing_images').select('url, listings!inner(user_id)').eq('listings.user_id', userId).order('id').range(from, to),
    (batch) => batch.forEach((row) => urls.push(row.url)))
  if (failed) return failed

  failed = await read('companies', (from, to) => db.from('companies').select('logo_url').eq('created_by', userId).order('id').range(from, to),
    (batch) => batch.forEach((row) => urls.push(row.logo_url)))
  if (failed) return failed

  failed = await read('verification_requests', (from, to) => db.from('verification_requests').select('document_url').eq('user_id', userId).order('id').range(from, to),
    (batch) => batch.forEach((row) => urls.push(row.document_url)))
  if (failed) return failed

  const ids = urls.map((url) => publicIdFromUrl(url)).filter((id): id is string => id !== null)
  return { ok: true, publicIds: [...new Set(ids)] }
}

/** Removes the person's objects of the `avatars` bucket; returns how many objects it could not remove (a failed listing counts one). */
async function removeAvatarObjects(db: Db, userId: string, reason: string): Promise<number> {
  let covered = 1
  try {
    const bucket = db.storage.from(AVATAR_BUCKET)
    const listed = await bucket.list(userId, { limit: 1000 })
    if (listed.error) {
      console.error('deleteAccount: listing the avatar objects failed', { userId, reason, code: errorCode(listed.error) })
      return 1
    }
    const paths = (listed.data ?? []).map((object) => `${userId}/${object.name}`)
    if (!paths.length) return 0
    covered = paths.length
    const removed = await bucket.remove(paths)
    if (removed.error) {
      console.error('deleteAccount: removing the avatar objects failed', { userId, reason, objects: paths.length, code: errorCode(removed.error) })
      return paths.length
    }
    return 0
  } catch (err) {
    console.error('deleteAccount: the avatar objects threw', { userId, reason, code: errorCode(err) })
    return covered
  }
}

/** A code that is safe to log: the error's own `code`/`status`, or its class name. Never its message, which can carry a URL or a name. */
function errorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const { code, status, name } = err as { code?: unknown; status?: unknown; name?: unknown }
    if (typeof code === 'string' || typeof code === 'number') return String(code)
    if (typeof status === 'string' || typeof status === 'number') return String(status)
    if (typeof name === 'string') return name
  }
  return 'threw'
}
