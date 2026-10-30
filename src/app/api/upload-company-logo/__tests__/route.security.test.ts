// @vitest-environment node
/**
 * Security (Task 923 Revision 7, findings S3 / S15): POST /api/upload-company-logo.
 *
 * It had no session check and a service-role client: anyone who knew a company id could replace that company's logo (and burn the Cloudinary quota). It now accepts
 * a staff session, or a short-lived grant that was issued for exactly this NEW company, and it stores a file only when its bytes are the image type it declares.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let staff: 'admin' | 'moderator' | null = null
// the route asks the one staff guard for the `companies.manage` key (Task 923 R75); the double records what it was asked and answers from `staff`
const staffAsked: unknown[] = []
vi.mock('@/lib/auth/staff', () => ({
  getStaffRole: async () => staff,
  checkStaff: async (options?: unknown) => { staffAsked.push(options); return staff ? { ok: true, userId: 'staff-1', role: staff } : { ok: false, reason: 'forbidden' } },
}))

// the logo that was replaced is released through the deletion wrapper (Task 923 R71 (g))
const released: { publicId: string; reason: string }[] = []
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: vi.fn(async (publicId: string, opts: { reason: string }) => { released.push({ publicId, reason: opts.reason }) }) }))

const uploads: { mime: string; folder: string }[] = []
let uploadDims = { width: 100, height: 100 }
vi.mock('@/lib/cloudinaryUpload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/cloudinaryUpload')>()),   // the REAL readImageSize runs: the size is read from the bytes (Task 923 R71 (g))
  uploadToCloudinary: vi.fn(async (_b: ArrayBuffer, mime: string, folder: string) => { uploads.push({ mime, folder }); return { url: 'https://res.cloudinary.test/logo.png', publicId: 'x', ...uploadDims } }),
}))

type Op = { op: string; table: string; values?: unknown; filters: [string, unknown][] }
const ops: Op[] = []
let company: { id: string; logo_url: string | null } | null = null
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const rec: Op = { op: 'select', table, filters: [] }
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.update = (v: unknown) => { rec.op = 'update'; rec.values = v; ops.push(rec); return chain }
      chain.eq = (c: string, v: unknown) => { rec.filters.push([c, v]); return chain }
      chain.single = async () => { if (rec.op === 'select') ops.push(rec); return { data: company, error: company ? null : { message: 'none' } } }
      chain.then = (resolve: (v: unknown) => void) => resolve({ error: null })
      return chain
    },
  }),
}))

import { createUploadGrant } from '@/lib/uploads/uploadGrant'
import { POST } from '../route'

const COMPANY = '3f1c2a54-9d0e-4c43-8d7a-0e5b1a6c7d21'
const OTHER = '9a1c2a54-9d0e-4c43-8d7a-0e5b1a6c7d99'
/** a PNG signature and header that declare a size; the rest of the file is not needed for what these tests ask */
const pngOf = (width: number, height: number) => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, width >> 8, width & 255, 0, 0, height >> 8, height & 255])
const PNG = pngOf(100, 100)

function request(parts: { file?: Blob | null; type?: string; companyId?: string | null; grant?: string | null } = {}) {
  const fd = new FormData()
  const file = parts.file === undefined ? new Blob([PNG], { type: 'image/png' }) : parts.file
  if (file) fd.append('logo', new File([file], 'logo.png', { type: parts.type ?? (file as Blob).type }))
  if (parts.companyId !== null) fd.append('companyId', parts.companyId ?? COMPANY)
  if (parts.grant) fd.append('grant', parts.grant)
  return new NextRequest('http://localhost/api/upload-company-logo', { method: 'POST', body: fd })
}
const status = async (r: Request) => (await POST(r as NextRequest)).status
const noSideEffects = () => { expect(uploads).toEqual([]); expect(ops.filter((o) => o.op === 'update')).toEqual([]) }

beforeEach(() => {
  staff = null
  uploads.length = 0
  ops.length = 0
  released.length = 0
  company = { id: COMPANY, logo_url: null }
  uploadDims = { width: 100, height: 100 }
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-for-tests'
  delete process.env.UPLOAD_GRANT_SECRET
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('who may upload', () => {
  it('an anonymous caller with no grant is refused and nothing is uploaded or written', async () => {
    expect(await status(request())).toBe(403)
    noSideEffects()
  })

  it('a caller with a made-up grant is refused', async () => {
    expect(await status(request({ grant: '9999999999999.deadbeef' }))).toBe(403)
    noSideEffects()
  })

  it('a staff member may upload for any company, with no grant', async () => {
    staff = 'moderator'
    company = { id: COMPANY, logo_url: 'https://old.example/logo.png' }
    const res = await POST(request())
    expect(res.status).toBe(200)
    expect(uploads).toEqual([{ mime: 'image/png', folder: `companies/${COMPANY}` }])
    expect(ops.find((o) => o.op === 'update')?.values).toEqual({ logo_url: 'https://res.cloudinary.test/logo.png' })
  })

  it('a grant issued for this company lets a new agency set its first logo', async () => {
    const res = await POST(request({ grant: createUploadGrant('company-logo', COMPANY) }))
    expect(res.status).toBe(200)
    expect(ops.find((o) => o.op === 'update')?.filters).toEqual([['id', COMPANY]])
  })

  it('a grant issued for ANOTHER company does not work here', async () => {
    expect(await status(request({ grant: createUploadGrant('company-logo', OTHER) }))).toBe(403)
    noSideEffects()
  })

  it('an expired grant does not work', async () => {
    const old = createUploadGrant('company-logo', COMPANY, Date.now() - 60 * 60 * 1000)
    expect(await status(request({ grant: old }))).toBe(403)
    noSideEffects()
  })

  it('a grant never replaces a logo that already exists (it is for the first logo only)', async () => {
    company = { id: COMPANY, logo_url: 'https://old.example/logo.png' }
    expect(await status(request({ grant: createUploadGrant('company-logo', COMPANY) }))).toBe(409)
    noSideEffects()
  })

  it('a staff member may replace an existing logo', async () => {
    staff = 'admin'
    company = { id: COMPANY, logo_url: 'https://old.example/logo.png' }
    expect(await status(request())).toBe(200)
  })

  it('the company must exist even for a valid grant', async () => {
    company = null
    expect(await status(request({ grant: createUploadGrant('company-logo', COMPANY) }))).toBe(404)
    noSideEffects()
  })
})

describe('who may replace a logo: the key (Task 923 R75)', () => {
  it('the route asks for companies.manage, and a staff member the guard refuses (a moderator without the key) uploads nothing', async () => {
    staff = null
    expect(await status(request())).toBe(403)
    expect(staffAsked.at(-1)).toEqual({ permission: 'companies.manage' })
    noSideEffects()
  })
})

describe('the logo that is replaced (Task 923 R71 (g))', () => {
  beforeEach(() => { staff = 'admin' })

  it('is released after the new one is saved, and nothing is released when there is nothing of ours to release', async () => {
    company = { id: COMPANY, logo_url: 'https://res.cloudinary.com/demo/image/upload/v1/companies/c1/old-logo.png' }
    expect(await status(request())).toBe(200)
    expect(released).toEqual([{ publicId: 'companies/c1/old-logo', reason: 'company_logo_replaced' }])
    released.length = 0
    for (const logo_url of [null, 'https://old.example/logo.png', 'https://res.cloudinary.com/demo/image/upload/v1/x.png']) {
      company = { id: COMPANY, logo_url }
      await POST(request())
    }
    // no previous logo, a logo that is not on Cloudinary, and the SAME asset ('x' is the id the image host double gives every upload): nothing is released
    expect(released).toEqual([])
  })

  it('a logo that could not be saved releases nothing', async () => {
    company = { id: COMPANY, logo_url: 'https://res.cloudinary.com/demo/image/upload/v1/companies/c1/old-logo.png' }
    uploadDims = { width: 300, height: 100 }                               // measured too large by the image host: refused, the company keeps its logo
    expect(await status(request())).toBe(400)
    expect(released).toEqual([])
  })
})

describe('what may be uploaded', () => {
  beforeEach(() => { staff = 'admin' })

  it('a script that declares itself a PNG is refused before anything is stored', async () => {
    const evil = new Blob(['<script>alert(document.cookie)</script>'], { type: 'image/png' })
    expect(await status(request({ file: evil }))).toBe(400)
    noSideEffects()
  })

  it('a real JPEG that declares itself a PNG is refused (a spoofed type)', async () => {
    const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0, 0, 0, 0, 0, 0])], { type: 'image/png' })
    expect(await status(request({ file: jpeg }))).toBe(400)
    noSideEffects()
  })

  it('an SVG is refused', async () => {
    const svg = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'], { type: 'image/svg+xml' })
    expect(await status(request({ file: svg }))).toBe(400)
    noSideEffects()
  })

  it('a file over 2 MB is refused', async () => {
    const big = new Blob([PNG, new Uint8Array(2 * 1024 * 1024)], { type: 'image/png' })
    expect(await status(request({ file: big }))).toBe(400)
    noSideEffects()
  })

  it('an empty file and a missing file are refused', async () => {
    expect(await status(request({ file: new Blob([], { type: 'image/png' }) }))).toBe(400)
    expect(await status(request({ file: null }))).toBe(400)
    noSideEffects()
  })

  it('a logo larger than 256 x 256 is refused from its own header, before any upload (Task 923 R71 (g))', async () => {
    for (const [w, h] of [[300, 100], [100, 300], [257, 257]]) {
      expect(await status(request({ file: new Blob([pngOf(w, h)], { type: 'image/png' }) })), `${w}x${h}`).toBe(400)
    }
    noSideEffects()                                                                       // nothing uploaded, nothing written
    expect(await status(request({ file: new Blob([pngOf(256, 256)], { type: 'image/png' }) }))).toBe(200)   // the control: the limit itself is allowed
  })

  it('a logo whose header says it fits but that the image host measures larger is still refused and the company is not changed', async () => {
    uploadDims = { width: 300, height: 100 }
    expect(await status(request())).toBe(400)
    expect(ops.filter((o) => o.op === 'update')).toEqual([])
  })

  it('a PNG whose header cannot be read is refused before any upload', async () => {
    const truncated = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0])], { type: 'image/png' })
    expect(await status(request({ file: truncated }))).toBe(400)
    noSideEffects()
  })

  it('a company id that is not a UUID is refused before any lookup (no id with query syntax reaches the database)', async () => {
    for (const bad of ['abc', "1' or '1'='1", 'x&folder=other', '../../etc', '']) {
      expect(await status(request({ companyId: bad })), bad).toBe(400)
    }
    noSideEffects()
  })

  it('a missing company id is refused', async () => {
    expect(await status(request({ companyId: null }))).toBe(400)
  })

  it('the stored url is the one the image host returned, never anything the caller sent', async () => {
    const res = await POST(request())
    expect(await res.json()).toEqual({ url: 'https://res.cloudinary.test/logo.png' })
  })
})

// Task 923 R38 (case SEC-S03-SRV-DENY)
it('[SEC-S03-SRV-DENY] Only staff or the holder of a one-record upload grant replace a company logo', async () => {
  company = { id: OTHER, logo_url: 'https://res.cloudinary.test/old.png' }
  expect(await status(request({ companyId: OTHER }))).toBeGreaterThanOrEqual(401)                         // anonymous, no grant
  expect(await status(request({ companyId: OTHER }))).toBeLessThanOrEqual(403)
  expect(await status(request({ companyId: OTHER, grant: createUploadGrant('company-logo', COMPANY) }))).toBeLessThanOrEqual(403)   // a grant for ANOTHER company
  noSideEffects()                                                                                         // no upload, no change of companies.logo_url
  staff = 'admin'                                                                                         // the control: staff may
  expect(await status(request({ companyId: OTHER }))).toBe(200)
})
