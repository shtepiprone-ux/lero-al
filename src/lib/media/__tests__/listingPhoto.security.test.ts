// @vitest-environment node
/**
 * Task 1038 (AC8): every path that deletes a listing photo goes through `deleteListingPhoto` / `deleteListingPhotos`.
 *  - SEC-PHOTO-DELETE-ORDER: for an R2 photo the reference check runs first (on the key of `full`), then BOTH objects (`full` and `thumb`) are deleted, then the photo's folder is purged
 *    from the CDN, once for all the photos of a call; the same dry-run gate as the Cloudinary wrapper (`CLOUDINARY_DELETE_MODE=enabled`) decides whether anything is deleted.
 *  - SEC-PHOTO-DELETE-KEEP: a referenced photo, a failed reference check, a failed R2 delete keeps both objects and purges nothing; a failed purge is returned as `purge_failed`.
 *  - A Cloudinary address still goes to `deleteAsset` as before; an address of any other host calls nothing.
 * The code under test is the real module; the doubles are the reference check and the Cloudinary delete, the R2 delete and the CDN purge. Every id is synthetic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const order = vi.hoisted(() => ({ events: [] as string[] }))

vi.mock('@/lib/cloudinaryDelete', () => ({
  checkIsReferenced: vi.fn(),
  deleteAsset: vi.fn(),
}))
vi.mock('@/lib/media/r2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/media/r2')>()),
  deleteObjects: vi.fn(),
}))
vi.mock('@/lib/media/cdnPurge', () => ({ purgePhotoFolders: vi.fn() }))

import { checkIsReferenced, deleteAsset } from '@/lib/cloudinaryDelete'
import { deleteObjects } from '@/lib/media/r2'
import { purgePhotoFolders } from '@/lib/media/cdnPurge'
import { deleteListingPhoto, deleteListingPhotos } from '../listingPhoto'

const OWNER = '22222222-2222-4222-8222-222222222222'
const A = '44444444-4444-4444-8444-444444444441'
const B = '44444444-4444-4444-8444-444444444442'
const C = '44444444-4444-4444-8444-444444444443'
const url = (folder: string, ext = 'webp') => `https://media.lero.al/${OWNER}/listings/${folder}/full.${ext}`
const key = (folder: string, name: 'full' | 'thumb', ext = 'webp') => `${OWNER}/listings/${folder}/${name}.${ext}`
const prefix = (folder: string) => `media.lero.al/${OWNER}/listings/${folder}/`

const saved: Record<string, string | undefined> = {}
const ENV = { R2_PUBLIC_URL: 'https://media.lero.al', R2_ENDPOINT: 'https://a.r2.cloudflarestorage.com', R2_BUCKET_NAME: 'b', R2_ACCESS_KEY_ID: 'k', R2_SECRET_ACCESS_KEY: 's', CLOUDINARY_DELETE_MODE: 'enabled', NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'demo' } as Record<string, string>

beforeEach(() => {
  for (const [name, value] of Object.entries(ENV)) { saved[name] = process.env[name]; process.env[name] = value }
  order.events = []
  vi.mocked(checkIsReferenced).mockReset().mockImplementation(async (id: string) => { order.events.push(`check:${id}`); return { referenced: false, tables: [], lookupFailed: null } })
  vi.mocked(deleteAsset).mockReset().mockImplementation(async (id: string) => { order.events.push(`asset:${id}`); return { skipped: false, dryRun: false, deleted: true } })
  vi.mocked(deleteObjects).mockReset().mockImplementation(async (keys: readonly string[]) => { order.events.push(`delete:${keys.join(',')}`) })
  vi.mocked(purgePhotoFolders).mockReset().mockImplementation(async (prefixes: readonly string[]) => { order.events.push(`purge:${prefixes.join(',')}`); return { outcome: 'purged' as const, prefixes: [...prefixes] } })
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  for (const name of Object.keys(ENV)) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name] }
  vi.restoreAllMocks()
})

describe('an R2 photo', () => {
  it('[SEC-PHOTO-DELETE-ORDER] the reference check on the key of full, then both objects, then the purge of the photo folder', async () => {
    const result = await deleteListingPhoto(url(A), 'listing_deleted')
    expect(order.events).toEqual([`check:${key(A, 'full')}`, `delete:${key(A, 'full')},${key(A, 'thumb')}`, `purge:${prefix(A)}`])
    expect(result).toMatchObject({ removed: 1, kept: 0, dryRun: false, failed: 0, purge: { outcome: 'purged' } })
  })

  it('[SEC-PHOTO-DELETE-ORDER] a .jpg photo deletes full.jpg and thumb.jpg', async () => {
    await deleteListingPhoto(url(A, 'jpg'), 'listing_deleted')
    expect(vi.mocked(deleteObjects).mock.calls[0][0]).toEqual([key(A, 'full', 'jpg'), key(A, 'thumb', 'jpg')])
  })

  it('[SEC-PHOTO-DELETE-ORDER] the photos of one call are checked one by one, deleted together, and purged by ONE call with every folder', async () => {
    const result = await deleteListingPhotos([url(A), url(B), url(C, 'jpg')], 'listing_deleted')
    expect(vi.mocked(checkIsReferenced).mock.calls.map((c) => c[0])).toEqual([key(A, 'full'), key(B, 'full'), key(C, 'full', 'jpg')])
    expect(vi.mocked(deleteObjects)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(deleteObjects).mock.calls[0][0]).toEqual([key(A, 'full'), key(A, 'thumb'), key(B, 'full'), key(B, 'thumb'), key(C, 'full', 'jpg'), key(C, 'thumb', 'jpg')])
    expect(vi.mocked(purgePhotoFolders)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(purgePhotoFolders).mock.calls[0][0]).toEqual([prefix(A), prefix(B), prefix(C)])
    expect(result).toMatchObject({ removed: 3, kept: 0 })
    // the delete comes after every check and before the purge
    const last = (name: string) => order.events.map((e, i) => (e.startsWith(name) ? i : -1)).filter((i) => i >= 0).pop() as number
    expect(order.events.findIndex((e) => e.startsWith('delete:'))).toBeGreaterThan(last('check:'))
    expect(order.events.findIndex((e) => e.startsWith('purge:'))).toBeGreaterThan(order.events.findIndex((e) => e.startsWith('delete:')))
  })

  it('[SEC-PHOTO-DELETE-ORDER] the same dry-run gate as the Cloudinary wrapper: without CLOUDINARY_DELETE_MODE=enabled nothing is deleted or purged', async () => {
    delete process.env.CLOUDINARY_DELETE_MODE
    const result = await deleteListingPhoto(url(A), 'listing_deleted')
    expect(order.events).toEqual([`check:${key(A, 'full')}`])   // the check still runs, as in deleteAsset
    expect(vi.mocked(deleteObjects)).not.toHaveBeenCalled()
    expect(vi.mocked(purgePhotoFolders)).not.toHaveBeenCalled()
    expect(result).toMatchObject({ removed: 0, dryRun: true })
    process.env.CLOUDINARY_DELETE_MODE = 'disabled'
    await deleteListingPhoto(url(A), 'listing_deleted')
    expect(vi.mocked(deleteObjects)).not.toHaveBeenCalled()
  })

  it('[SEC-PHOTO-DELETE-KEEP] a photo that a row still uses is kept: nothing is deleted or purged', async () => {
    vi.mocked(checkIsReferenced).mockResolvedValue({ referenced: true, tables: ['listing_images.url'], lookupFailed: null })
    const result = await deleteListingPhoto(url(A), 'listing_image_removed')
    expect(vi.mocked(deleteObjects)).not.toHaveBeenCalled()
    expect(vi.mocked(purgePhotoFolders)).not.toHaveBeenCalled()
    expect(result).toMatchObject({ removed: 0, kept: 1 })
  })

  it('[SEC-PHOTO-DELETE-KEEP] a reference check that failed keeps the photo (fail closed)', async () => {
    vi.mocked(checkIsReferenced).mockResolvedValue({ referenced: false, tables: [], lookupFailed: 'pages.content: 57014' })
    const result = await deleteListingPhoto(url(A), 'listing_image_removed')
    expect(vi.mocked(deleteObjects)).not.toHaveBeenCalled()
    expect(vi.mocked(purgePhotoFolders)).not.toHaveBeenCalled()
    expect(result).toMatchObject({ removed: 0, kept: 1 })
  })

  it('[SEC-PHOTO-DELETE-KEEP] a reference check that throws keeps the photo', async () => {
    vi.mocked(checkIsReferenced).mockRejectedValue(new Error('boom'))
    const result = await deleteListingPhoto(url(A), 'listing_image_removed')
    expect(vi.mocked(deleteObjects)).not.toHaveBeenCalled()
    expect(result).toMatchObject({ removed: 0, kept: 1 })
  })

  it('[SEC-PHOTO-DELETE-KEEP] of three photos one is kept (referenced): the other two are deleted and purged', async () => {
    vi.mocked(checkIsReferenced).mockImplementation(async (id: string) => ({ referenced: id === key(B, 'full'), tables: id === key(B, 'full') ? ['listing_images.url'] : [], lookupFailed: null }))
    const result = await deleteListingPhotos([url(A), url(B), url(C)], 'listing_deleted')
    expect(vi.mocked(deleteObjects).mock.calls[0][0]).toEqual([key(A, 'full'), key(A, 'thumb'), key(C, 'full'), key(C, 'thumb')])
    expect(vi.mocked(purgePhotoFolders).mock.calls[0][0]).toEqual([prefix(A), prefix(C)])
    expect(result).toMatchObject({ removed: 2, kept: 1 })
  })

  it('[SEC-PHOTO-DELETE-KEEP] when the R2 delete fails nothing is purged and the failure is returned and logged, never thrown', async () => {
    vi.mocked(deleteObjects).mockRejectedValue(new Error('R2 delete failed: 500'))
    const result = await deleteListingPhoto(url(A), 'listing_deleted')
    expect(vi.mocked(purgePhotoFolders)).not.toHaveBeenCalled()
    expect(result).toMatchObject({ removed: 0, failed: 1 })
    expect(result.errors).toEqual([expect.any(Error)])
    expect(vi.mocked(console.error)).toHaveBeenCalled()
  })

  it('[SEC-PHOTO-DELETE-KEEP] a purge that failed is returned as purge_failed (the objects are already gone) and never as purged', async () => {
    vi.mocked(purgePhotoFolders).mockResolvedValue({ outcome: 'purge_failed', prefixes: [prefix(A)], codes: [10000] })
    const result = await deleteListingPhoto(url(A), 'listing_deleted')
    expect(result.purge).toMatchObject({ outcome: 'purge_failed' })
    expect(result).toMatchObject({ removed: 1, failed: 0 })
  })

  it('[SEC-PHOTO-DELETE-KEEP] a purge that throws is returned as purge_failed', async () => {
    vi.mocked(purgePhotoFolders).mockRejectedValue(new Error('boom'))
    const result = await deleteListingPhoto(url(A), 'listing_deleted')
    expect(result.purge).toMatchObject({ outcome: 'purge_failed' })
  })

  it('[SEC-PHOTO-DELETE-KEEP] an address of another host, another owner folder shape or a thumb address calls nothing', async () => {
    const result = await deleteListingPhotos([
      `https://evil.example/${OWNER}/listings/${A}/full.webp`,
      `https://media.lero.al/${OWNER}/listings/${A}/full.webp?x=1`,
      `https://media.lero.al/${OWNER}/listings/${A}/thumb.webp`,
      `https://media.lero.al/${OWNER}/listings/../x/full.webp`,
      'not a url',
      '',
    ], 'listing_deleted')
    expect(vi.mocked(checkIsReferenced)).not.toHaveBeenCalled()
    expect(vi.mocked(deleteObjects)).not.toHaveBeenCalled()
    expect(vi.mocked(purgePhotoFolders)).not.toHaveBeenCalled()
    expect(vi.mocked(deleteAsset)).not.toHaveBeenCalled()
    expect(result).toMatchObject({ removed: 0 })
  })

  it('[SEC-PHOTO-DELETE-KEEP] no photo: nothing is called', async () => {
    await deleteListingPhotos([], 'listing_deleted')
    expect(order.events).toEqual([])
  })
})

describe('a Cloudinary photo', () => {
  const CLOUDINARY = `https://res.cloudinary.com/demo/image/upload/v1/${OWNER}/listings/abc.jpg`

  it('goes to deleteAsset with its public id and the reason, as before; no R2 call', async () => {
    const result = await deleteListingPhoto(CLOUDINARY, 'listing_image_removed')
    expect(vi.mocked(deleteAsset)).toHaveBeenCalledWith(`${OWNER}/listings/abc`, { reason: 'listing_image_removed' })
    expect(vi.mocked(deleteObjects)).not.toHaveBeenCalled()
    expect(vi.mocked(purgePhotoFolders)).not.toHaveBeenCalled()
    expect(vi.mocked(checkIsReferenced)).not.toHaveBeenCalled()   // deleteAsset runs its own check
    expect(result).toMatchObject({ removed: 1 })
  })

  it('a Cloudinary delete that fails is returned as a failure and never stops the R2 photos of the same call', async () => {
    vi.mocked(deleteAsset).mockRejectedValue(new Error('destroy failed'))
    const result = await deleteListingPhotos([CLOUDINARY, url(A)], 'listing_deleted')
    expect(result).toMatchObject({ removed: 1, failed: 1 })
    expect(result.errors).toEqual([expect.any(Error)])   // the caller logs it
    expect(vi.mocked(deleteObjects)).toHaveBeenCalledTimes(1)
  })

  it('a Cloudinary photo kept by deleteAsset (referenced) counts as kept', async () => {
    vi.mocked(deleteAsset).mockResolvedValue({ skipped: true, skipReason: 'referenced in: listing_images.url', dryRun: false, deleted: false })
    expect(await deleteListingPhoto(CLOUDINARY, 'listing_image_removed')).toMatchObject({ removed: 0, kept: 1 })
  })
})
