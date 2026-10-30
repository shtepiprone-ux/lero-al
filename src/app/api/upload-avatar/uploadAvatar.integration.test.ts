/**
 * Real-boundary control for the rank rule of the avatar route (Task 923 R66 (o), R75; cases SEC-X-INT-AVATAR-RANK-ALLOW and -DENY): the REAL `POST /api/upload-avatar` with the REAL
 * `requireViewer`, the REAL rank rule (`checkActorRank`) and the REAL moderator key check, run against REAL Supabase Auth and the REAL database of the approved development
 * project. The doubles are the cookie-bound client factory (outside a Next request it returns the client that holds the REAL session of the chosen synthetic moderator) and the Cloudinary
 * provider, so that no file is sent to or deleted from any real account. The moderator key `users.edit` is switched on for the length of the file and put back exactly as it was.
 * Synthetic rows only, verified clean-up.
 *  - SEC-X-INT-AVATAR-RANK-ALLOW: a moderator replaces an ordinary account's picture: 200, the address stored (and removed again by the test);
 *  - SEC-X-INT-AVATAR-RANK-DENY: the same moderator cannot replace an administrator's picture: 403, nothing uploaded, the stored address unchanged.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown, uploaded: [] as string[], released: [] as string[] }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('@/lib/cloudinaryUpload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/cloudinaryUpload')>()),
  uploadToCloudinary: async (_bytes: ArrayBuffer, _mime: string, folder: string) => {
    acting.uploaded.push(folder)
    return { url: 'https://res.cloudinary.com/die7okukn/image/upload/v1/zz-synth-avatar.png', publicId: 'zz-synth-avatar', width: 256, height: 256 }
  },
}))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async (publicId: string) => { acting.released.push(publicId); return { skipped: true, dryRun: false, deleted: false } } }))

import { POST } from './route'

const AVATAR_URL = 'https://res.cloudinary.com/die7okukn/image/upload/v1/zz-synth-avatar.png'
/** a PNG signature and header that declare 256 by 256: what the route reads before it uploads */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 1, 0, 0, 0, 1, 0])

let run: Run
let moderator: SyntheticUser
let storedKey: Record<string, unknown> | null

beforeAll(async () => {
  run = createRun()
  moderator = await run.makeUser('avatar-rank-moderator', { role: 'moderator' })
  const row = await run.admin.from('role_permissions').select('*').eq('role', 'moderator').eq('permission_key', 'users.edit').maybeSingle()
  expect(row.error, 'the stored switch is readable').toBeNull()
  storedKey = row.data
  const set = await run.admin.from('role_permissions').upsert({ role: 'moderator', permission_key: 'users.edit', allowed: true }, { onConflict: 'role,permission_key' })
  expect(set.error, 'the moderator key users.edit is switched on for this file').toBeNull()
})
afterAll(async () => {
  const restored = storedKey
    ? await run.admin.from('role_permissions').upsert(storedKey, { onConflict: 'role,permission_key' })
    : await run.admin.from('role_permissions').delete().eq('role', 'moderator').eq('permission_key', 'users.edit')
  expect(restored.error, 'the stored switch is restored').toBeNull()
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

function avatarRequest(userId: string) {
  const form = new FormData()
  form.append('avatar', new File([PNG], 'a.png', { type: 'image/png' }))
  form.append('userId', userId)
  return new NextRequest('http://localhost/api/upload-avatar', { method: 'POST', body: form })
}
const storedAvatar = async (id: string) => (await run.admin.from('users').select('avatar_url').eq('id', id).single()).data?.avatar_url ?? null

describe('uploadAvatar', () => {
  it('[SEC-X-INT-AVATAR-RANK-ALLOW] avatar-rank allowed on the real project', async () => {
    const target = await run.makeUser('avatar-rank-user', { role: 'user' })
    acting.client = moderator.client
    acting.uploaded.length = 0
    expect(await storedAvatar(target.id), 'precondition: the account has no picture').toBeNull()

    const response = await POST(avatarRequest(target.id))
    expect(response.status, 'a moderator with users.edit replaces an ordinary account\'s picture').toBe(200)
    expect(await response.json()).toEqual({ url: AVATAR_URL })
    expect(acting.uploaded, 'one upload, into the target account\'s folder').toEqual([`${target.id}/avatars`])
    expect(await storedAvatar(target.id), 'the address is stored on the target account').toBe(AVATAR_URL)

    // restored by the test
    expect((await run.admin.from('users').update({ avatar_url: null }).eq('id', target.id)).error).toBeNull()
    expect(await storedAvatar(target.id), 'the picture is back as it was').toBeNull()
  })

  it('[SEC-X-INT-AVATAR-RANK-DENY] avatar-rank refused on the real project', async () => {
    const administrator = await run.makeUser('avatar-rank-admin', { role: 'admin' })
    acting.client = moderator.client
    acting.uploaded.length = 0
    acting.released.length = 0
    const before = await storedAvatar(administrator.id)

    const response = await POST(avatarRequest(administrator.id))
    expect(response.status, 'a moderator cannot replace an administrator\'s picture').toBe(403)
    expect(acting.uploaded, 'refused before the file is uploaded').toEqual([])
    expect(acting.released, 'nothing was released from the cloud either').toEqual([])
    expect(await storedAvatar(administrator.id), 'the administrator\'s picture is unchanged').toBe(before)
  })
})
