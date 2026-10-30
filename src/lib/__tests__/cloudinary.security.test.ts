// @vitest-environment node
/**
 * Security (Task 923 Revision 7): the two doors to Cloudinary.
 *  - uploadToCloudinary signs the request with the API secret, which must never travel in the request itself;
 *  - deleteAsset never deletes an asset any table still points at, asks about the id as a literal (a "_" or "%" in an id is not a wildcard), runs as a dry run
 *    unless deletion is switched on, and only reports success when Cloudinary says "ok".
 */
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const likeAsked: { table: string; column: string; pattern: string }[] = []
const eqAsked: { table: string; column: string; value: unknown }[] = []
let referencedTables = new Set<string>()
/** the documents of the CMS pages (`pages.content`), read whole and searched by the code (Task 923 R66 (e)) */
let pagesContent: unknown[] = []
/** a `table.column` (or a whole table) whose read answers a database error with a marker message */
let failingRead: string | null = null
const answer = (table: string, column: string) => (
  failingRead && (failingRead === `${table}.${column}` || failingRead === table)
    ? { data: null, error: { code: 'XX000', message: 'MARKER-DB-MESSAGE' } }
    : { data: referencedTables.has(`${table}.${column}`) ? [{ id: 1 }] : [], error: null }
)
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: unknown) => { eqAsked.push({ table, column, value }); return { limit: async () => answer(table, column) } },
        ilike: (column: string, pattern: string) => { likeAsked.push({ table, column, pattern }); return { limit: async () => answer(table, column) } },
        limit: async () => (failingRead && (failingRead === table || failingRead === `${table}.content`) ? answer(table, 'content') : { data: pagesContent.map((content, id) => ({ id, content })), error: null }),
      }),
    }),
  }),
}))

import { uploadToCloudinary, readImageSize } from '../cloudinaryUpload'
import { deleteAsset } from '../cloudinaryDelete'

const ENV = { ...process.env }
const fetchMock = vi.fn()
const sha1 = (s: string) => createHash('sha1').update(s).digest('hex')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo'
  process.env.CLOUDINARY_API_KEY = 'key-1'
  process.env.CLOUDINARY_API_SECRET = 'TOP-SECRET'
  delete process.env.CLOUDINARY_DELETE_MODE
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  likeAsked.length = 0
  eqAsked.length = 0
  referencedTables = new Set()
  pagesContent = []
  failingRead = null
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); process.env = { ...ENV } })

const TS = Math.round(new Date('2026-10-17T10:00:00Z').getTime() / 1000)

describe('uploadToCloudinary', () => {
  const ok = { ok: true, json: async () => ({ secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/listings/a.jpg', public_id: 'listings/a', width: 800, height: 600 }) }

  it('signs folder and timestamp with the secret, and the secret itself is not sent', async () => {
    fetchMock.mockResolvedValue(ok)
    const res = await uploadToCloudinary(new Uint8Array([1, 2, 3]).buffer, 'image/jpeg', 'listings')
    expect(res).toEqual({ url: 'https://res.cloudinary.com/demo/image/upload/v1/listings/a.jpg', publicId: 'listings/a', width: 800, height: 600 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.cloudinary.com/v1_1/demo/image/upload')
    expect(init.method).toBe('POST')
    const form = init.body as FormData
    expect(form.get('signature')).toBe(sha1(`folder=listings&timestamp=${TS}TOP-SECRET`))
    expect(form.get('api_key')).toBe('key-1')
    expect(form.get('folder')).toBe('listings')
    expect(form.get('timestamp')).toBe(String(TS))
    expect((form.get('file') as Blob).type).toBe('image/jpeg')
    expect([...form.values()].some((v) => typeof v === 'string' && v.includes('TOP-SECRET'))).toBe(false)
  })

  it.each([['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'], ['CLOUDINARY_API_KEY'], ['CLOUDINARY_API_SECRET']])('without %s it refuses and calls nobody', async (name) => {
    delete process.env[name]
    await expect(uploadToCloudinary(new ArrayBuffer(1), 'image/png', 'x')).rejects.toThrow('Cloudinary env vars missing')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a refusal by Cloudinary is thrown with its text, and the secret is not in the message', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'Invalid image file' })
    const err = await uploadToCloudinary(new ArrayBuffer(1), 'image/png', 'x').catch((e: Error) => e)
    expect((err as Error).message).toBe('Cloudinary upload failed: Invalid image file')
    expect((err as Error).message).not.toContain('TOP-SECRET')
  })

  it('an unreadable refusal falls back to the status code', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, text: async () => { throw new Error('x') } })
    await expect(uploadToCloudinary(new ArrayBuffer(1), 'image/png', 'x')).rejects.toThrow('Cloudinary upload failed: 503')
  })
})

describe('deleteAsset', () => {
  it('asks every table that can hold an address, with the id as a literal', async () => {
    await deleteAsset('listings/ab_cd%x', { reason: 't' })
    expect(eqAsked, '`listing_images` has no id column: no read filters on equality (Task 923 R145)').toEqual([])
    expect(likeAsked.map((l) => `${l.table}.${l.column}`)).toEqual(['listing_images.url', 'users.avatar_url', 'users.company_logo_url', 'companies.logo_url', 'locations.image_url', 'site_settings.value'])
    for (const l of likeAsked) expect(l.pattern).toBe('%listings/ab\\_cd\\%x%')
  })

  it.each([['listing_images.url'], ['users.avatar_url'], ['users.company_logo_url'], ['companies.logo_url'], ['locations.image_url'], ['site_settings.value']])('an asset used by %s is never deleted, even when deletion is on', async (where) => {
    process.env.CLOUDINARY_DELETE_MODE = 'enabled'
    referencedTables = new Set([where])
    const res = await deleteAsset('avatars/me', { reason: 't' })
    expect(res).toMatchObject({ skipped: true, deleted: false, skipReason: `referenced in: ${where}` })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('an unused asset is only logged when deletion is not switched on', async () => {
    const info = vi.mocked(console.info)
    info.mockClear()
    expect(await deleteAsset('avatars/me', { reason: 't' })).toEqual({ skipped: false, dryRun: true, deleted: false })
    expect(info, 'the dry run is logged once, as DRY_RUN').toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledWith('[deleteAsset]', expect.objectContaining({ publicId: 'avatars/me', outcome: 'DRY_RUN' }))
    process.env.CLOUDINARY_DELETE_MODE = 'ENABLED'
    expect((await deleteAsset('avatars/me', { reason: 't' })).dryRun).toBe(true)
    process.env.CLOUDINARY_DELETE_MODE = 'true'
    expect((await deleteAsset('avatars/me', { reason: 't' })).dryRun).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('with deletion on, a signed destroy is sent and the secret is not', async () => {
    process.env.CLOUDINARY_DELETE_MODE = 'enabled'
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'ok' }) })
    expect(await deleteAsset('avatars/me', { reason: 'avatar_replaced' })).toEqual({ skipped: false, dryRun: false, deleted: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.cloudinary.com/v1_1/demo/image/destroy')
    const form = init.body as FormData
    expect(form.get('public_id')).toBe('avatars/me')
    expect(form.get('signature')).toBe(sha1(`public_id=avatars/me&timestamp=${TS}TOP-SECRET`))
    expect([...form.values()].some((v) => typeof v === 'string' && v.includes('TOP-SECRET'))).toBe(false)
  })

  it('the per-call dryRun overrides the switch in both directions', async () => {
    process.env.CLOUDINARY_DELETE_MODE = 'enabled'
    expect((await deleteAsset('a/b', { reason: 't', dryRun: true })).dryRun).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
    delete process.env.CLOUDINARY_DELETE_MODE
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'ok' }) })
    expect((await deleteAsset('a/b', { reason: 't', dryRun: false })).deleted).toBe(true)
  })

  it.each([
    ['a refusal', { ok: false, text: async () => 'Invalid signature', status: 401 }, 'Cloudinary destroy failed: Invalid signature'],
    ['an unreadable refusal', { ok: false, text: async () => { throw new Error('x') }, status: 500 }, 'Cloudinary destroy failed: 500'],
    ['"not found"', { ok: true, json: async () => ({ result: 'not found' }) }, 'Cloudinary destroy unexpected result: {"result":"not found"}'],
    ['an answer with no result', { ok: true, json: async () => ({}) }, 'Cloudinary destroy unexpected result: {}'],
  ])('%s is thrown, never reported as deleted', async (_l, response, message) => {
    process.env.CLOUDINARY_DELETE_MODE = 'enabled'
    fetchMock.mockResolvedValue(response)
    await expect(deleteAsset('a/b', { reason: 't' })).rejects.toThrow(message)
  })

  it('without the credentials a real delete is refused before any request', async () => {
    process.env.CLOUDINARY_DELETE_MODE = 'enabled'
    delete process.env.CLOUDINARY_API_SECRET
    await expect(deleteAsset('a/b', { reason: 't' })).rejects.toThrow('Cloudinary env vars missing')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('every call is logged with its reason and outcome', async () => {
    const info = vi.spyOn(console, 'info')
    await deleteAsset('a/b', { reason: 'listing_deleted' })
    expect(info).toHaveBeenCalledWith('[deleteAsset]', expect.objectContaining({ publicId: 'a/b', reason: 'listing_deleted', outcome: 'DRY_RUN' }))
  })
})

// Task 923 R38 (case SEC-S48-SRV-DENY)
it('[SEC-S48-SRV-DENY] Image clean-up deletes only assets of the project Cloudinary account', async () => {
  const { publicIdFromUrl } = await import('../cloudinaryUpload')
  expect(publicIdFromUrl('https://evil.example/upload/listings/x.jpg')).toBeNull()                  // another host with an /upload/ path
  expect(publicIdFromUrl('http://res.cloudinary.com/demo/image/upload/v1/listings/x.jpg')).toBeNull() // plain http
  expect(publicIdFromUrl('https://res.cloudinary.com.evil.example/demo/image/upload/v1/listings/x.jpg')).toBeNull()
  expect(publicIdFromUrl('https://res.cloudinary.com/demo/image/upload/v1/listings/x.jpg')).toBe('listings/x')   // the control
  // the clean-up reads the address the same way: nothing is destroyed for a foreign address
  expect(fetchMock).not.toHaveBeenCalled()
})

// Task 923 R71 (g): the size an image declares in its own header is read from the bytes, so a route refuses a wrong size before any upload.
describe('readImageSize', () => {
  const be32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
  const le32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]
  const png = (w: number, h: number) => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, ...be32(w), ...be32(h)])
  /** SOI, an APP0 segment, a DQT segment, then SOF0 (or the given frame marker): the size lives in the first frame header, not at a fixed offset */
  const jpeg = (w: number, h: number, frame = 0xc0) => new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, 0, 6, 0, 0, 0, 0,
    0xff, 0xdb, 0, 4, 0, 0,
    0xff, frame, 0, 11, 8, h >> 8, h & 255, w >> 8, w & 255, 1, 1, 0x11, 0,
  ])
  const riff = (kind: string, chunk: number[]) => new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, ...[...kind].map((c) => c.charCodeAt(0)), 0, 0, 0, 0, ...chunk])
  const webpLossy = (w: number, h: number) => riff('VP8 ', [0, 0, 0, 0x9d, 0x01, 0x2a, w & 255, (w >> 8) & 0x3f, h & 255, (h >> 8) & 0x3f])
  const webpLossless = (w: number, h: number) => {
    const bits = (w - 1) | ((h - 1) << 14)
    return riff('VP8L', [0x2f, ...le32(bits)])
  }
  const webpExtended = (w: number, h: number) => riff('VP8X', [0, 0, 0, 0, (w - 1) & 255, ((w - 1) >> 8) & 255, ((w - 1) >> 16) & 255, (h - 1) & 255, ((h - 1) >> 8) & 255, ((h - 1) >> 16) & 255])

  it('reads the size of a PNG, a JPEG and the three WebP kinds', () => {
    expect(readImageSize(png(256, 256))).toEqual({ width: 256, height: 256 })
    expect(readImageSize(png(300, 100))).toEqual({ width: 300, height: 100 })
    expect(readImageSize(jpeg(300, 200))).toEqual({ width: 300, height: 200 })
    expect(readImageSize(jpeg(256, 256, 0xc2))).toEqual({ width: 256, height: 256 })      // progressive
    expect(readImageSize(webpLossy(300, 200))).toEqual({ width: 300, height: 200 })
    expect(readImageSize(webpLossless(256, 300))).toEqual({ width: 256, height: 300 })
    expect(readImageSize(webpExtended(1024, 768))).toEqual({ width: 1024, height: 768 })
    expect(readImageSize(png(256, 256).buffer)).toEqual({ width: 256, height: 256 })       // an ArrayBuffer, as the routes pass it
  })

  it('gives null for what is not an image it reads, a truncated header and a zero size', () => {
    expect(readImageSize(new Uint8Array([]))).toBeNull()
    expect(readImageSize(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'))).toBeNull()
    expect(readImageSize(png(256, 256).slice(0, 20))).toBeNull()
    expect(readImageSize(png(0, 0))).toBeNull()
    expect(readImageSize(jpeg(256, 256).slice(0, 22))).toBeNull()
    expect(readImageSize(jpeg(256, 256, 0xc4))).toBeNull()                                  // 0xC4 is a Huffman table, not a frame
    expect(readImageSize(webpLossy(300, 200).slice(0, 25))).toBeNull()
    // a PNG signature without an IHDR chunk, and a JPEG whose segments never reach a frame header
    const noIhdr = png(256, 256); noIhdr[12] = 0x58
    expect(readImageSize(noIhdr)).toBeNull()
    expect(readImageSize(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 6, 0, 0, 0, 0, 0xff, 0xd9]))).toBeNull()
  })

  it('never reads past the bytes it was given', () => {
    // a segment that declares a length beyond the end of the data ends the walk with null, not an exception
    expect(readImageSize(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff, 1, 2, 3, 4]))).toBeNull()
    expect(readImageSize(new Uint8Array([0xff, 0xd8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]))).toBeNull()
  })
})
