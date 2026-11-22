// @vitest-environment node
/**
 * Security (Task 923 R66 (e)): a file is never deleted when any reference read fails, and the check also covers CMS images, company logos and the site settings.
 *  - SEC-X-SRV-CLEANUP-FAILCLOSED: the REAL deleteAsset runs, with deletion switched ON, against a database double. Each of the seven reference reads answers a database error
 *    in turn: the call is skipped (`skipped`, `deleted: false`), logged as `SKIP_LOOKUP_FAILED` with no database message, and Cloudinary's destroy endpoint is never called.
 *    An id that is present only in `pages.content`, only in `users.company_logo_url` or only in the image values of `site_settings` is kept as well. The control: with no
 *    reference and no error the same call destroys the asset.
 * Every id and URL is synthetic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  /** `table.column` that holds the id */
  holds: new Set<string>(),
  /** `table.column` whose read answers an error */
  fails: null as string | null,
  /** `table.column` whose read throws */
  throws: null as string | null,
  pages: [] as unknown[],
  /** the slice of every read of `pages` (null: an unsliced read) */
  pageReads: [] as ([number, number] | null)[],
}))

const READS = ['listing_images.url', 'users.avatar_url', 'users.company_logo_url', 'companies.logo_url', 'locations.image_url', 'site_settings.value', 'pages.content']

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const respond = (column: string, slice?: [number, number]) => {
        const key = `${table}.${column}`
        if (state.throws === key) throw new Error('connection reset')
        if (state.fails === key) return { data: null, error: { code: 'XX000', message: 'MARKER-DB-MESSAGE' } }
        if (table === 'pages') {
          const rows = state.pages.map((content, id) => ({ id, content }))
          state.pageReads.push(slice ?? null)
          return { data: slice ? rows.slice(slice[0], slice[1] + 1) : rows, error: null }
        }
        return { data: state.holds.has(key) ? [{ id: 1 }] : [], error: null }
      }
      let column = 'content'
      const chain = {
        select: () => chain,
        eq: (c: string) => { column = c; return chain },
        ilike: (c: string) => { column = c; return chain },
        order: () => chain,
        limit: async () => respond(column),
        range: async (from: number, to: number) => respond(column, [from, to]),
      }
      return chain
    },
  }),
}))

import { deleteAsset, deleteEmptyFolder } from './cloudinaryDelete'

const fetchMock = vi.fn()
const ENV = { ...process.env }

beforeEach(() => {
  state.holds = new Set()
  state.fails = null
  state.throws = null
  state.pages = []
  state.pageReads = []
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'ok' }) })
  vi.stubGlobal('fetch', fetchMock)
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo'
  process.env.CLOUDINARY_API_KEY = 'key-1'
  process.env.CLOUDINARY_API_SECRET = 'secret-1'
  process.env.CLOUDINARY_DELETE_MODE = 'enabled'
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllGlobals(); process.env = { ...ENV } })

describe('cloudinaryDelete', () => {
  it('[SEC-X-SRV-CLEANUP-FAILCLOSED] a failed or matching reference read keeps the file', async () => {
    const info = vi.mocked(console.info)
    // every reference read, failing in turn (an error answer, and a read that throws): the file is kept and the failure is logged without the database message
    for (const read of READS) {
      for (const mode of ['fails', 'throws'] as const) {
        state.fails = null; state.throws = null
        state[mode] = read
        info.mockClear()
        const result = await deleteAsset('listings/pic-1', { reason: 't' })
        expect(result, `${read} ${mode}`).toMatchObject({ skipped: true, deleted: false })
        expect(info, `${read} ${mode}`).toHaveBeenCalledWith('[deleteAsset]', expect.objectContaining({ outcome: 'SKIP_LOOKUP_FAILED', publicId: 'listings/pic-1' }))
        expect(JSON.stringify(info.mock.calls), `${read} ${mode}`).not.toContain('MARKER-DB-MESSAGE')
        expect(fetchMock, `${read} ${mode}: no destroy call`).not.toHaveBeenCalled()
      }
    }
    // the id present only in the three newly covered places
    state.fails = null; state.throws = null
    for (const place of ['users.company_logo_url', 'site_settings.value']) {
      state.holds = new Set([place])
      expect(await deleteAsset('listings/pic-1', { reason: 't' }), place).toMatchObject({ skipped: true, deleted: false, skipReason: `referenced in: ${place}` })
    }
    state.holds = new Set()
    state.pages = [{ type: 'doc', content: [{ type: 'image', attrs: { src: 'https://res.cloudinary.com/demo/image/upload/v1/listings/pic-1.jpg' } }] }]
    expect(await deleteAsset('listings/pic-1', { reason: 't' })).toMatchObject({ skipped: true, deleted: false, skipReason: 'referenced in: pages.content' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('with no reference and no error the same call destroys the asset, and a page that names another file does not keep it (the controls)', async () => {
    state.pages = [{ type: 'doc', content: [{ type: 'image', attrs: { src: 'https://res.cloudinary.com/demo/image/upload/v1/listings/other.jpg' } }] }]
    expect(await deleteAsset('listings/pic-1', { reason: 't' })).toEqual({ skipped: false, dryRun: false, deleted: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

// Task 957 (AC7, case SEC-CMS-PAGES-FAILCLOSED): a reference on a CMS page beyond the first 500 keeps the asset; every page is read, in pages of 500, until a short page
describe('cloudinaryDelete: every CMS page is read (Task 957, C-05)', () => {
  const doc = (src: string) => ({ type: 'doc', content: [{ type: 'image', attrs: { src } }] })
  const filler = (count: number) => Array.from({ length: count }, (_, i) => doc(`https://res.cloudinary.com/demo/image/upload/v1/cms/other-${i}.jpg`))

  it('[SEC-CMS-PAGES-FAILCLOSED] a reference on page 501 of 600 keeps the asset, and the reads are pages of 500 until a short page', async () => {
    state.pages = [...filler(500), doc('https://res.cloudinary.com/demo/image/upload/v1/listings/pic-1.jpg'), ...filler(99)]
    expect(state.pages).toHaveLength(600)
    expect(await deleteAsset('listings/pic-1', { reason: 't' })).toMatchObject({ skipped: true, deleted: false, skipReason: 'referenced in: pages.content' })
    expect(state.pageReads).toEqual([[0, 499], [500, 999]])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('[SEC-CMS-PAGES-FAILCLOSED] exactly 500 pages need a second, empty read; with no reference on any page the asset is destroyed', async () => {
    state.pages = filler(500)
    expect(await deleteAsset('listings/pic-1', { reason: 't' })).toEqual({ skipped: false, dryRun: false, deleted: true })
    expect(state.pageReads).toEqual([[0, 499], [500, 999]])
  })

  it('[SEC-CMS-PAGES-FAILCLOSED] a failing read of the pages keeps the asset (fail closed)', async () => {
    state.pages = filler(600)
    state.fails = 'pages.content'
    expect(await deleteAsset('listings/pic-1', { reason: 't' })).toMatchObject({ skipped: true, deleted: false, skipReason: 'reference lookup failed' })
  })
})

// Task 957 (AC13): deleteEmptyFolder removes only the folders of an account (`<uuid>`, `<uuid>/listings`, `<uuid>/listings/<uuid>`, `<uuid>/avatars`), under the same mode switch
describe('deleteEmptyFolder', () => {
  const U = '22222222-2222-4222-8222-222222222222'
  const L = '44444444-4444-4444-8444-444444444444'

  it.each([
    [U], [`${U}/listings`], [`${U}/listings/${L}`], [`${U}/avatars`],
  ])('[SEC-FOLDER-GUARD-ALLOW] removes %s with a DELETE to the folders API', async (path) => {
    const result = await deleteEmptyFolder(path, { reason: 'empty_folder' })
    expect(result).toEqual({ refused: false, dryRun: false, deleted: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.cloudinary.com/v1_1/demo/folders/${path}`)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' })
  })

  it.each([
    ['avatars'], ['companies'], ['Lero'], ['../x'], [`${U}/other`], [`${U}/Brand`], [`${U}/Brand/Favicon`], [`${U}/listings/${L}/x`], [`${U}/../${U}`],
    [`${U}/listings/`], [`/${U}`], [`${U}x`], [''], ['cms/pages'], [`${U}/listings/not-a-uuid`],
  ])('[SEC-FOLDER-GUARD-DENY] refuses %j and calls nothing', async (path) => {
    const result = await deleteEmptyFolder(path, { reason: 'empty_folder' })
    expect(result).toEqual({ refused: true, dryRun: false, deleted: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('[SEC-FOLDER-GUARD-DENY] a dry run (the mode switch is off) calls nothing and says so', async () => {
    process.env.CLOUDINARY_DELETE_MODE = 'disabled'
    expect(await deleteEmptyFolder(U, { reason: 'empty_folder' })).toEqual({ refused: false, dryRun: true, deleted: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('[SEC-FOLDER-GUARD-DENY] a failing DELETE (the folder is not empty, or the API is down) is thrown, never reported as deleted', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'Folder is not empty' })
    await expect(deleteEmptyFolder(U, { reason: 'empty_folder' })).rejects.toThrow(/Cloudinary folder delete failed/)
  })
})
