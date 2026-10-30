// @vitest-environment node
/**
 * Security (Task 923 R66 (o), R71 (g)): POST /api/upload-avatar and the size rule of the upload routes.
 *  - SEC-X-SRV-AVATAR-RANK: a staff member replacing ANOTHER account's picture obeys the rank rule of the admin actions. A moderator cannot replace an administrator's
 *    avatar; an unknown account is a 404 and an unreadable rank a refusal; all of it is decided before the file's bytes are read and before any upload.
 *  - SEC-X-SRV-UPLOAD-SIZE-FIRST: an image of the wrong size is refused from its own header before anything is uploaded (a 300 by 300 PNG, on the avatar route and on
 *    the company-logo route). The size reader, the signature check, the rank rule and both routes are the real ones; the identity, the database and Cloudinary are
 *    doubles. Every id and value is synthetic.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const ADMIN = '00000000-0000-4000-8000-0000000000a1'
const ADMIN2 = '00000000-0000-4000-8000-0000000000a2'
const MOD = '00000000-0000-4000-8000-0000000000b1'
const PLAIN = '00000000-0000-4000-8000-0000000000c1'
const TARGET = '00000000-0000-4000-8000-0000000000d1'
const GHOST = '00000000-0000-4000-8000-0000000000ee'
const COMPANY = '00000000-0000-4000-8000-0000000000f1'

const state = vi.hoisted(() => ({
  viewer: { ok: true, userId: '', role: 'user' } as { ok: true; userId: string; role: string },
  users: [] as Array<{ id: string; role: string; avatar_url: string | null }>,
  rankReadError: false,
  /** the number of rows an avatar UPDATE reports as changed, or null to apply it to the table as a database would */
  updateRowsOverride: null as number | null,
  uploads: [] as string[],
  deletes: [] as string[],
  updates: [] as Array<{ id: unknown; values: unknown }>,
  reads: 0,
  /** the keys a moderator holds (Task 923 R75): the route needs `users.edit` to replace ANOTHER account's picture */
  keys: new Set<string>(['users.edit']),
}))

vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => state.viewer }))
vi.mock('@/lib/auth/permissions', () => ({ roleHasPermission: async (role: string, key: string) => role === 'admin' || (role === 'moderator' && state.keys.has(key)), hasPermission: async () => false }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: vi.fn(async (id: string) => { state.deletes.push(id); return { skipped: false, dryRun: false, deleted: true } }) }))
vi.mock('@/lib/cloudinaryUpload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/cloudinaryUpload')>()),   // the REAL readImageSize and publicIdFromUrl
  uploadToCloudinary: vi.fn(async (_bytes: ArrayBuffer, _mime: string, folder: string) => {
    state.uploads.push(folder)
    return { url: 'https://res.cloudinary.com/demo/image/upload/v1/new.png', publicId: 'new', width: 256, height: 256 }
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const filters: Array<[string, unknown]> = []
      let op: 'select' | 'update' = 'select'
      let payload: Record<string, unknown> = {}
      let ids: string[] | null = null
      let withRows = false
      const idFilter = () => filters.find(([c]) => c === 'id')?.[1] as string | undefined
      const chain: Record<string, unknown> = {}
      chain.select = (cols?: string) => { if (op === 'update') withRows = true; else if (cols === 'id, role') ids = [] ; return chain }
      chain.in = (_c: string, values: string[]) => { ids = values; return chain }
      chain.eq = (c: string, v: unknown) => { filters.push([c, v]); return chain }
      chain.update = (v: Record<string, unknown>) => { op = 'update'; payload = v; return chain }
      chain.single = async () => {
        state.reads += 1
        const row = state.users.find((u) => u.id === idFilter())
        return { data: row ? { avatar_url: row.avatar_url } : null, error: row ? null : { message: 'none' } }
      }
      chain.then = (resolve: (v: unknown) => void) => {
        if (table === 'users' && op === 'select' && ids) {
          state.reads += 1
          if (state.rankReadError) return resolve({ data: null, error: { message: 'boom' } })
          return resolve({ data: state.users.filter((u) => ids!.includes(u.id)).map((u) => ({ id: u.id, role: u.role })), error: null })
        }
        if (op === 'update') {
          const id = idFilter()
          state.updates.push({ id, values: payload })
          const row = state.users.find((u) => u.id === id)
          if (row && table === 'users' && state.updateRowsOverride === null) Object.assign(row, payload)
          const changed = state.updateRowsOverride ?? (row ? 1 : 0)
          return resolve({ data: withRows ? Array.from({ length: changed }, () => ({ id })) : null, error: null })
        }
        return resolve({ data: null, error: null })
      }
      return chain
    },
  }),
}))

import { POST as avatarPost } from './route'
import { POST as logoPost } from '../upload-company-logo/route'

/** a PNG signature and header that declare a size; the rest of the file is not needed for what these tests ask */
const pngOf = (width: number, height: number) => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, width >> 8, width & 255, 0, 0, height >> 8, height & 255])
const AVATAR = pngOf(256, 256)

function avatarRequest(parts: { userId?: string | null; bytes?: Uint8Array; type?: string } = {}) {
  const fd = new FormData()
  fd.append('avatar', new File([(parts.bytes ?? AVATAR) as BlobPart], 'a.png', { type: parts.type ?? 'image/png' }))
  if (parts.userId) fd.append('userId', parts.userId)
  return new NextRequest('http://localhost/api/upload-avatar', { method: 'POST', body: fd })
}
const as = (userId: string, role: string) => { state.viewer = { ok: true, userId, role } }

beforeEach(() => {
  state.viewer = { ok: true, userId: PLAIN, role: 'user' }
  state.users = [
    { id: ADMIN, role: 'admin', avatar_url: null },
    { id: ADMIN2, role: 'admin', avatar_url: 'https://res.cloudinary.com/demo/image/upload/v1/admin2.png' },
    { id: MOD, role: 'moderator', avatar_url: null },
    { id: PLAIN, role: 'user', avatar_url: null },
    { id: TARGET, role: 'user', avatar_url: 'https://res.cloudinary.com/demo/image/upload/v1/old.png' },
  ]
  state.rankReadError = false
  state.updateRowsOverride = null
  state.uploads = []
  state.deletes = []
  state.updates = []
  state.reads = 0
  state.keys = new Set(['users.edit'])
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

const nothingHappened = () => { expect(state.uploads).toEqual([]); expect(state.updates).toEqual([]); expect(state.deletes).toEqual([]) }

describe('uploadAvatar', () => {
  it('[SEC-X-SRV-AVATAR-RANK] a moderator cannot replace an administrator avatar', async () => {
    as(MOD, 'moderator')
    const refused = await avatarPost(avatarRequest({ userId: ADMIN }))
    expect(refused.status).toBe(403)
    expect(state.uploads).toEqual([])                       // refused before any upload
    expect(state.updates).toEqual([])                       // the administrator's row is not touched
    expect(state.users.find((u) => u.id === ADMIN)?.avatar_url).toBeNull()
    // the rest of the rule, each answer before the bytes are read
    expect((await avatarPost(avatarRequest({ userId: GHOST }))).status).toBe(404)                 // no account has that id
    expect((await avatarPost(avatarRequest({ userId: "x' or '1'='1" }))).status).toBe(404)        // not an id at all: never sent to the database
    state.rankReadError = true
    expect((await avatarPost(avatarRequest({ userId: TARGET }))).status).toBe(403)                // the rank cannot be read: refused, not allowed
    state.rankReadError = false
    as(PLAIN, 'user')
    expect((await avatarPost(avatarRequest({ userId: TARGET }))).status).toBe(403)                // a plain user cannot replace someone else's picture
    nothingHappened()
    // the controls: staff may replace an ordinary account's picture, an administrator may replace another administrator's, anyone may replace their own
    as(MOD, 'moderator')
    expect((await avatarPost(avatarRequest({ userId: TARGET }))).status).toBe(200)
    as(ADMIN, 'admin')
    expect((await avatarPost(avatarRequest({ userId: ADMIN2 }))).status).toBe(200)
    as(PLAIN, 'user')
    expect((await avatarPost(avatarRequest())).status).toBe(200)
    expect(state.updates.map((u) => u.id)).toEqual([TARGET, ADMIN2, PLAIN])
  })

  it('a moderator without the users.edit key cannot replace the avatar of another account, and an administrator needs no key (Task 923 R75)', async () => {
    as(MOD, 'moderator')
    state.keys = new Set()
    expect((await avatarPost(avatarRequest({ userId: TARGET }))).status).toBe(403)
    nothingHappened()
    as(ADMIN, 'admin')
    expect((await avatarPost(avatarRequest({ userId: TARGET }))).status).toBe(200)
    // the moderator's OWN picture needs no key
    as(MOD, 'moderator')
    expect((await avatarPost(avatarRequest())).status).toBe(200)
  })

  it('an avatar UPDATE that changes no account releases the uploaded file and answers 404', async () => {
    as(ADMIN, 'admin')
    state.updateRowsOverride = 0
    const res = await avatarPost(avatarRequest({ userId: TARGET }))
    expect(res.status).toBe(404)
    expect(state.uploads).toHaveLength(1)
    expect(state.deletes).toEqual(['new'])                  // the just-uploaded file, and only that one
    // the control: one changed row is a success and the replaced picture is released, not the new one
    state.updateRowsOverride = null
    state.deletes = []
    expect((await avatarPost(avatarRequest({ userId: TARGET }))).status).toBe(200)
    expect(state.deletes).toEqual(['old'])
  })

  it('[SEC-X-SRV-UPLOAD-SIZE-FIRST] the size is checked before the upload', async () => {
    as(ADMIN, 'admin')
    state.users.push({ id: COMPANY, role: 'user', avatar_url: null })
    const big = pngOf(300, 300)
    const avatar = await avatarPost(avatarRequest({ userId: TARGET, bytes: big }))
    expect(avatar.status).toBe(400)
    expect(await avatar.json()).toEqual({ error: 'invalid_dimensions' })
    // the company-logo route, on its own limit (at most 256 x 256)
    const fd = new FormData()
    fd.append('logo', new File([big as BlobPart], 'logo.png', { type: 'image/png' }))
    fd.append('companyId', COMPANY)
    const logo = await logoPost(new NextRequest('http://localhost/api/upload-company-logo', { method: 'POST', body: fd }))
    expect(logo.status).toBe(400)
    expect(await logo.json()).toEqual({ error: 'invalid_dimensions' })
    expect(state.uploads).toEqual([])                       // nothing was uploaded by either route
    expect(state.updates).toEqual([])
    // wrong in only one dimension, and a header that cannot be read
    expect((await avatarPost(avatarRequest({ bytes: pngOf(256, 255) }))).status).toBe(400)
    expect((await avatarPost(avatarRequest({ bytes: pngOf(0, 0) }))).status).toBe(400)
    expect(state.uploads).toEqual([])
    // the control: exactly 256 x 256 is uploaded
    expect((await avatarPost(avatarRequest({ userId: TARGET }))).status).toBe(200)
    expect(state.uploads).toEqual([`${TARGET}/avatars`])
  })

  it('a file whose first bytes are not the type it declares is refused before any upload', async () => {
    as(ADMIN, 'admin')
    const script = new TextEncoder().encode('<script>alert(1)</script>')
    expect((await avatarPost(avatarRequest({ bytes: script }))).status).toBe(400)
    expect((await avatarPost(avatarRequest({ bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0, 0, 0, 0, 0, 0]), type: 'image/png' }))).status).toBe(400)
    nothingHappened()
  })
})
