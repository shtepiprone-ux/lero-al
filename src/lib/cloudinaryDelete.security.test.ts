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
}))

const READS = ['listing_images.url', 'users.avatar_url', 'users.company_logo_url', 'companies.logo_url', 'locations.image_url', 'site_settings.value', 'pages.content']

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const respond = (column: string) => {
        const key = `${table}.${column}`
        if (state.throws === key) throw new Error('connection reset')
        if (state.fails === key) return { data: null, error: { code: 'XX000', message: 'MARKER-DB-MESSAGE' } }
        if (table === 'pages') return { data: state.pages.map((content, id) => ({ id, content })), error: null }
        return { data: state.holds.has(key) ? [{ id: 1 }] : [], error: null }
      }
      let column = 'content'
      const chain = {
        select: () => chain,
        eq: (c: string) => { column = c; return chain },
        ilike: (c: string) => { column = c; return chain },
        limit: async () => respond(column),
      }
      return chain
    },
  }),
}))

import { deleteAsset } from './cloudinaryDelete'

const fetchMock = vi.fn()
const ENV = { ...process.env }

beforeEach(() => {
  state.holds = new Set()
  state.fails = null
  state.throws = null
  state.pages = []
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
