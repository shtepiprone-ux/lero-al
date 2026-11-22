// @vitest-environment node
/**
 * Task 957 (AC14, O957-4): `purgeAccountFolder` removes the whole folder of an account that is GONE and nothing else.
 *  - SEC-PURGE-SRV-DENY: an account that still exists, an account read that fails, an id that is not a UUID and a site folder touch nothing; a dry run touches nothing.
 *  - SEC-PURGE-SRV-ALLOW: a deleted account's `listings`, `avatars` and `Brand/Favicon` files and folders go, the account folder last; a file a row still uses (the site logo) stays with its folders.
 * The code under test is the real `cloudinaryDelete`, against the Cloudinary double (`src/tests/fakeCloudinary.ts`) and a database double. Every id is synthetic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeCloudinary, type FakeCloudinary } from '@/tests/fakeCloudinary'

const db = vi.hoisted(() => ({ referenced: new Map<string, string>(), accounts: new Set<string>(), accountReadError: false, accountReads: [] as string[] }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      let column = ''
      let pattern = ''
      const chain = {
        select: () => chain,
        order: () => chain,
        ilike: (c: string, p: string) => { column = c; pattern = p; return chain },
        limit: async () => ({ data: db.referenced.get(pattern.slice(1, -1)) === `${table}.${column}` ? [{ id: 1 }] : [], error: null }),
        range: async () => ({ data: [], error: null }),
      }
      return chain
    },
    auth: {
      admin: {
        getUserById: async (id: string) => {
          db.accountReads.push(id)
          if (db.accountReadError) return { data: { user: null }, error: { status: 500, code: 'unexpected_failure' } }
          return db.accounts.has(id) ? { data: { user: { id } }, error: null } : { data: { user: null }, error: { status: 404, code: 'user_not_found' } }
        },
      },
    },
  }),
}))

import { purgeAccountFolder } from '../cloudinaryDelete'

const U = '22222222-2222-4222-8222-222222222222'
const L = '44444444-4444-4444-8444-444444444444'
let cloud: FakeCloudinary

beforeEach(() => {
  cloud = createFakeCloudinary('demo')
  db.referenced = new Map()
  db.accounts = new Set()
  db.accountReadError = false
  db.accountReads = []
  vi.stubGlobal('fetch', vi.fn(cloud.fetch))
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo'
  process.env.CLOUDINARY_API_KEY = 'key-1'
  process.env.CLOUDINARY_API_SECRET = 'secret-1'
  process.env.CLOUDINARY_DELETE_MODE = 'enabled'
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

function seedAccountFolder() {
  cloud.addAsset(`${U}/listings/a`, 30)
  cloud.addAsset(`${U}/listings/${L}/b`, 30)
  cloud.addAsset(`${U}/avatars/c`, 30)
  cloud.addAsset(`${U}/Brand/Favicon/d`, 30)
  cloud.addFolder(`${U}/Brand/Logotype`)
}

describe('purgeAccountFolder', () => {
  it('[SEC-PURGE-SRV-DENY] an account that still exists touches nothing', async () => {
    db.accounts.add(U)
    seedAccountFolder()
    const result = await purgeAccountFolder(U)
    expect(result.outcome).toBe('account_exists')
    expect(cloud.calls).toEqual([])
    expect(cloud.assets).toHaveLength(4)
  })

  it('[SEC-PURGE-SRV-DENY] a failing existence read touches nothing', async () => {
    db.accountReadError = true
    seedAccountFolder()
    expect((await purgeAccountFolder(U)).outcome).toBe('lookup_failed')
    expect(cloud.calls).toEqual([])
    expect(cloud.assets).toHaveLength(4)
  })

  it.each([['Lero'], ['avatars'], [''], ['../x'], [`${U}/Brand`], [`${U}x`], ['not-a-uuid']])('[SEC-PURGE-SRV-DENY] %j is not an account id: nothing is read or touched', async (id) => {
    cloud.addAsset('Lero/logo', 30)
    expect((await purgeAccountFolder(id)).outcome).toBe('invalid_id')
    expect(db.accountReads).toEqual([])
    expect(cloud.calls).toEqual([])
  })

  it('[SEC-PURGE-SRV-ALLOW] a deleted account\'s files and folders go, any name included, and the account folder is last', async () => {
    seedAccountFolder()
    const result = await purgeAccountFolder(U)
    expect(result).toMatchObject({ outcome: 'purged', assetsDeleted: 4, assetsKept: 0 })
    expect(cloud.assets).toEqual([])
    expect([...cloud.folders]).toEqual([])
    const deletes = cloud.calls.filter((c) => c.startsWith('DELETE ')).map((c) => c.slice('DELETE /folders/'.length))
    expect(deletes.at(-1)).toBe(U)
    expect(deletes).toHaveLength(7)
    // a folder is removed only after everything inside it
    for (const folder of deletes) for (const later of deletes.slice(deletes.indexOf(folder) + 1)) expect(folder.startsWith(`${later}/`) || !later.startsWith(`${folder}/`), `${folder} before ${later}`).toBe(true)
  })

  it('[SEC-PURGE-SRV-ALLOW] a file a row still uses stays, with the folders that hold it; every other file and folder goes', async () => {
    seedAccountFolder()
    cloud.addAsset(`${U}/Brand/Logotype/logo`, 30)
    db.referenced.set(`${U}/Brand/Logotype/logo`, 'site_settings.value')
    const result = await purgeAccountFolder(U)
    expect(result).toMatchObject({ outcome: 'kept_some', assetsDeleted: 4, assetsKept: 1 })
    expect(cloud.assets.map((a) => a.public_id)).toEqual([`${U}/Brand/Logotype/logo`])
    expect([...cloud.folders].sort()).toEqual([U, `${U}/Brand`, `${U}/Brand/Logotype`].sort())
  })

  it('[SEC-PURGE-SRV-DENY] the dry-run mode deletes no asset and no folder', async () => {
    process.env.CLOUDINARY_DELETE_MODE = 'disabled'
    seedAccountFolder()
    const result = await purgeAccountFolder(U)
    expect(result.outcome).toBe('dry_run')
    expect(cloud.calls.filter((c) => c.startsWith('POST ') || c.startsWith('DELETE '))).toEqual([])
    expect(cloud.assets).toHaveLength(4)
  })

  it('[SEC-PURGE-SRV-DENY] a spent budget stops the purge half way and reports it; nothing is removed that still holds a file', async () => {
    seedAccountFolder()
    const result = await purgeAccountFolder(U, { budget: { calls: 3, deletes: 100 } })
    expect(result.outcome).toBe('budget_exhausted')
    expect(cloud.adminReads()).toBeLessThanOrEqual(3)
    for (const asset of cloud.assets) expect(cloud.folders.has(asset.asset_folder), asset.public_id).toBe(true)
  })

  it('[SEC-PURGE-SRV-DENY] the folder of another account is never read: only paths under the given id are walked', async () => {
    seedAccountFolder()
    const other = '33333333-3333-4333-8333-333333333333'
    cloud.addAsset(`${other}/listings/z`, 30)
    await purgeAccountFolder(U)
    expect(cloud.assets.map((a) => a.public_id)).toEqual([`${other}/listings/z`])
    expect(cloud.folders.has(other)).toBe(true)
  })

  it('[SEC-PURGE-SRV-DENY] an existence read that throws touches nothing', async () => {
    db.accounts.add(U)
    seedAccountFolder()
    const admin = await import('@/lib/supabase/admin')
    const spy = vi.spyOn(admin, 'createAdminClient').mockImplementation(() => { throw new Error('connection reset') })
    expect((await purgeAccountFolder(U)).outcome).toBe('lookup_failed')
    spy.mockRestore()
    expect(cloud.calls).toEqual([])
  })

  it('[SEC-PURGE-SRV-DENY] a folder with a name this module does not remove stays with its parents, and the purge says it failed', async () => {
    seedAccountFolder()
    cloud.addFolder(`${U}/Odd.Name`)
    const result = await purgeAccountFolder(U)
    expect(result.outcome).toBe('failed')
    expect(cloud.folders.has(`${U}/Odd.Name`)).toBe(true)
    expect(cloud.folders.has(U)).toBe(true)
    expect(cloud.assets).toEqual([])   // the rest of the account's files still went
  })

  it('[SEC-PURGE-SRV-DENY] no asset deletion left in the budget stops the purge before the first file', async () => {
    seedAccountFolder()
    const result = await purgeAccountFolder(U, { budget: { calls: 100, deletes: 0 } })
    expect(result.outcome).toBe('budget_exhausted')
    expect(cloud.destroyed()).toEqual([])
  })

  it('[SEC-PURGE-SRV-DENY] a file that cannot be destroyed keeps its folders and the purge says it failed', async () => {
    seedAccountFolder()
    const inner = cloud.fetch
    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => (init?.method === 'POST' ? new Response('{}', { status: 500 }) : inner(url, init))))
    const result = await purgeAccountFolder(U)
    expect(result.outcome).toBe('failed')
    expect(cloud.assets).toHaveLength(4)
    expect(cloud.folders.has(U)).toBe(true)
  })

  it('[SEC-PURGE-SRV-DENY] a folder the API refuses to remove is reported, never counted as removed', async () => {
    cloud.addFolder(`${U}/listings`)
    const inner = cloud.fetch
    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => (init?.method === 'DELETE' ? new Response('Folder is not empty', { status: 400 }) : inner(url, init))))
    const result = await purgeAccountFolder(U)
    expect(result.outcome).toBe('failed')
    expect(result.foldersRemoved).toBe(0)
  })

  it('[SEC-PURGE-SRV-DENY] a read of the folders that fails stops the purge as failed and removes nothing', async () => {
    seedAccountFolder()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })))
    expect((await purgeAccountFolder(U)).outcome).toBe('failed')
    expect(cloud.assets).toHaveLength(4)
  })

  it('[SEC-PURGE-SRV-ALLOW] more than one page of files: the kept file is walked past with the cursor and every other file goes', async () => {
    cloud.addAsset(`${U}/Brand/Logotype/logo`, 30)
    db.referenced.set(`${U}/Brand/Logotype/logo`, 'site_settings.value')
    for (let i = 0; i < 520; i++) cloud.addAsset(`${U}/Brand/Logotype/file-${String(i).padStart(3, '0')}`, 30)
    const result = await purgeAccountFolder(U)
    expect(result).toMatchObject({ outcome: 'kept_some', assetsDeleted: 520, assetsKept: 1 })
    expect(cloud.assets.map((a) => a.public_id)).toEqual([`${U}/Brand/Logotype/logo`])
  })
})
