// @vitest-environment node
/**
 * Security (Task 923 Revision 7, findings S4 / S15): POST /api/upload-popular-location-photo.
 *
 * It had no session or permission check: anyone could replace the photo of any popular location on the public site. Only an admin or a moderator may, and the
 * file must really be the image type it declares.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let staff: 'admin' | 'moderator' | null = null
vi.mock('@/lib/auth/staff', () => ({ getStaffRole: async () => staff }))
// Task 923 R66 (c): the photo is a write to `locations`, so staff need `locations.manage`; the moderator holds it unless a test takes it away
let moderatorMayManageLocations = true
vi.mock('@/lib/auth/permissions', () => ({
  roleHasPermission: async (role: string, key: string) => (role === 'admin' ? true : key === 'locations.manage' && moderatorMayManageLocations),
}))
// the photo that was replaced is released through the deletion wrapper (Task 923 R71 (g))
const released: { publicId: string; reason: string }[] = []
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: vi.fn(async (publicId: string, opts: { reason: string }) => { released.push({ publicId, reason: opts.reason }) }) }))

const uploads: { mime: string; folder: string }[] = []
vi.mock('@/lib/cloudinaryUpload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/cloudinaryUpload')>()),
  uploadToCloudinary: vi.fn(async (_b: ArrayBuffer, mime: string, folder: string) => { uploads.push({ mime, folder }); return { url: 'https://res.cloudinary.test/p.jpg', publicId: 'p' } }),
}))
const revalidated: string[] = []
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => { revalidated.push(p) } }))

type Op = { op: string; table: string; values?: unknown; filters: [string, unknown][] }
const ops: Op[] = []
let location: { id: number; image_url?: string | null } | null = { id: 7 }
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const rec: Op = { op: 'select', table, filters: [] }
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.update = (v: unknown) => { rec.op = 'update'; rec.values = v; ops.push(rec); return chain }
      chain.eq = (c: string, v: unknown) => { rec.filters.push([c, v]); return chain }
      chain.single = async () => { ops.push(rec); return { data: location } }
      chain.then = (resolve: (v: unknown) => void) => resolve({ error: null })
      return chain
    },
  }),
}))

import { POST } from '../route'

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0, 0, 0, 0, 0, 0])

function request(parts: { file?: Blob | null; locationId?: string | null } = {}) {
  const fd = new FormData()
  const file = parts.file === undefined ? new Blob([JPEG], { type: 'image/jpeg' }) : parts.file
  if (file) fd.append('photo', new File([file], 'p.jpg', { type: file.type }))
  if (parts.locationId !== null) fd.append('locationId', parts.locationId ?? '7')
  return new NextRequest('http://localhost/api/upload-popular-location-photo', { method: 'POST', body: fd })
}
const status = async (r: NextRequest) => (await POST(r)).status
const untouched = () => { expect(uploads).toEqual([]); expect(ops.filter((o) => o.op === 'update')).toEqual([]); expect(revalidated).toEqual([]) }

beforeEach(() => { staff = null; uploads.length = 0; ops.length = 0; revalidated.length = 0; released.length = 0; moderatorMayManageLocations = true; location = { id: 7 }; vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('who may replace a popular location photo', () => {
  it('an anonymous caller is refused and nothing is uploaded, written or published', async () => {
    expect(await status(request())).toBe(403)
    untouched()
  })

  it.each(['admin', 'moderator'] as const)('a %s may', async (role) => {
    staff = role
    const res = await POST(request())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://res.cloudinary.test/p.jpg' })
    expect(uploads).toEqual([{ mime: 'image/jpeg', folder: 'popular_locations/7' }])
    expect(ops.find((o) => o.op === 'update')).toMatchObject({ table: 'locations', values: { image_url: 'https://res.cloudinary.test/p.jpg' }, filters: [['id', 7]] })
    expect(revalidated).toEqual(['/admin/popular-locations'])
  })

  it('a moderator without locations.manage is refused before anything is read, uploaded or written (Task 923 R66 (c))', async () => {
    staff = 'moderator'
    moderatorMayManageLocations = false
    expect(await status(request())).toBe(403)
    untouched()
    staff = 'admin'
    expect(await status(request())).toBe(200)                          // the control: an administrator does not need the key
  })

  it('the photo that is replaced is released after the new one is saved, and never the new one (Task 923 R71 (g))', async () => {
    staff = 'admin'
    location = { id: 7, image_url: 'https://res.cloudinary.com/demo/image/upload/v1/popular_locations/7/old.jpg' }
    expect((await POST(request())).status).toBe(200)
    expect(released).toEqual([{ publicId: 'popular_locations/7/old', reason: 'popular_location_photo_replaced' }])
    // the same file again, no previous photo, and a previous photo that is not ours: nothing is released
    released.length = 0
    location = { id: 7, image_url: 'https://res.cloudinary.com/demo/image/upload/v1/p.jpg' }
    await POST(request())
    location = { id: 7, image_url: null }
    await POST(request())
    location = { id: 7, image_url: 'https://elsewhere.example/old.jpg' }
    await POST(request())
    expect(released).toEqual([])
  })

  it('the refusal does not reveal whether the location exists', async () => {
    location = null
    const anon = await POST(request({ locationId: '999999' }))
    expect(anon.status).toBe(403)
  })
})

describe('what may be uploaded', () => {
  beforeEach(() => { staff = 'admin' })

  it('a script that declares itself a JPEG is refused', async () => {
    expect(await status(request({ file: new Blob(['<script>alert(1)</script>'], { type: 'image/jpeg' }) }))).toBe(400)
    untouched()
  })

  it('a PNG that declares itself a JPEG is refused (a spoofed type)', async () => {
    const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], { type: 'image/jpeg' })
    expect(await status(request({ file: png }))).toBe(400)
    untouched()
  })

  it('an SVG and a GIF are refused', async () => {
    expect(await status(request({ file: new Blob(['<svg/>'], { type: 'image/svg+xml' }) }))).toBe(400)
    expect(await status(request({ file: new Blob(['GIF89a'], { type: 'image/gif' }) }))).toBe(400)
    untouched()
  })

  it('a file over 2 MB, an empty file and a missing file are refused', async () => {
    expect(await status(request({ file: new Blob([JPEG, new Uint8Array(2 * 1024 * 1024)], { type: 'image/jpeg' }) }))).toBe(400)
    expect(await status(request({ file: new Blob([], { type: 'image/jpeg' }) }))).toBe(400)
    expect(await status(request({ file: null }))).toBe(400)
    untouched()
  })

  it.each(['', 'abc', '1.5', '-3', '0', '7; drop table locations', '1e9'])('the location id %j is refused', async (id) => {
    expect(await status(request({ locationId: id }))).toBe(400)
    untouched()
  })

  it('a location id that does not exist is a 404 and writes nothing', async () => {
    location = null
    expect(await status(request({ locationId: '12345' }))).toBe(404)
    untouched()
  })
})

// Task 923 R38 (case SEC-S04-SRV-DENY)
it('[SEC-S04-SRV-DENY] Only staff replace a popular-location photo', async () => {
  expect(await status(request())).toBe(403)                              // anonymous
  untouched()                                                            // no upload, no write, no publish
  staff = 'moderator'                                                    // the control: staff may
  expect(await status(request())).toBe(200)
})
