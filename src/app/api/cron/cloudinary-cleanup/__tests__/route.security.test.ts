// @vitest-environment node
/**
 * Task 957 (AC13, O957-4): the daily cleanup deletes only the listing and avatar uploads no row uses (older than 7 days) and the empty folders of an account.
 *  - SEC-CLEANUP-SRV-DENY: without the cron secret 401 and no Cloudinary call; a failing reference read, the dry run and the caps delete nothing / no more than allowed.
 *  - SEC-CLEANUP-SRV-PATTERN: only `<uuid>/listings/[<uuid>/]<name>` and `<uuid>/avatars/<name>` of 8 days are deleted; a referenced one, one of 6 days, `avatars/…`, a root logo, `Lero/…`,
 *    `task951-signature-check/…`, `<uuid>/Brand/…` and a deeper path stay.
 *  - SEC-CLEANUP-SRV-FOLDERS: an empty `<uuid>/listings/<uuid>` folder is removed before its parent; a root folder of no account holding only empty `listings` and `avatars` is removed whole;
 *    a folder with an asset, or with a subfolder outside the pattern (`<uuid>/Brand`) of a living account, stays.
 * The code under test is the real route, the real `cloudinaryDelete` and the real Admin API reads, against a Cloudinary double (`src/tests/fakeCloudinary.ts`) and a database double that
 * answers the reference reads and the existence of accounts. Every id is synthetic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeCloudinary, type FakeCloudinary } from '@/tests/fakeCloudinary'

const db = vi.hoisted(() => ({
  /** public ids a reference read finds (`id` → `table.column`) */
  referenced: new Map<string, string>(),
  failReads: false,
  /** ids of accounts that exist */
  accounts: new Set<string>(),
  accountReadError: false,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      let column = ''
      let pattern = ''
      const chain = {
        select: () => chain,
        order: () => chain,
        ilike: (c: string, p: string) => { column = c; pattern = p; return chain },
        limit: async () => {
          if (db.failReads) return { data: null, error: { code: 'XX000' } }
          const id = pattern.slice(1, -1)
          return { data: db.referenced.get(id) === `${table}.${column}` ? [{ id: 1 }] : [], error: null }
        },
        range: async () => (db.failReads ? { data: null, error: { code: 'XX000' } } : { data: [], error: null }),
      }
      return chain
    },
    auth: {
      admin: {
        getUserById: async (id: string) => {
          if (db.accountReadError) return { data: { user: null }, error: { status: 500, code: 'unexpected_failure' } }
          return db.accounts.has(id) ? { data: { user: { id } }, error: null } : { data: { user: null }, error: { status: 404, code: 'user_not_found' } }
        },
      },
    },
  }),
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const SECRET = 'cron-secret-957'
const U1 = '22222222-2222-4222-8222-222222222222'
const U2 = '33333333-3333-4333-8333-333333333333'
const U3 = '55555555-5555-4555-8555-555555555555'
const L1 = '44444444-4444-4444-8444-444444444444'
let cloud: FakeCloudinary

function call(secret: string | null = SECRET) {
  return GET(new NextRequest('http://localhost/api/cron/cloudinary-cleanup', { headers: secret === null ? {} : { authorization: `Bearer ${secret}` } }))
}

beforeEach(() => {
  cloud = createFakeCloudinary('demo')
  db.referenced = new Map()
  db.failReads = false
  db.accounts = new Set([U1, U2, U3])
  db.accountReadError = false
  vi.stubGlobal('fetch', vi.fn(cloud.fetch))
  process.env.CRON_SECRET = SECRET
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo'
  process.env.CLOUDINARY_API_KEY = 'key-1'
  process.env.CLOUDINARY_API_SECRET = 'secret-1'
  process.env.CLOUDINARY_DELETE_MODE = 'enabled'
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('GET /api/cron/cloudinary-cleanup', () => {
  it('[SEC-CLEANUP-SRV-DENY] without the secret, with a wrong secret and with no CRON_SECRET: 401 and no Cloudinary call', async () => {
    cloud.addAsset(`${U1}/listings/a`, 30)
    expect((await call(null)).status).toBe(401)
    expect((await call('wrong')).status).toBe(401)
    delete process.env.CRON_SECRET
    expect((await call('')).status).toBe(401)
    expect(cloud.calls).toEqual([])
  })

  it('[SEC-CLEANUP-SRV-PATTERN] deletes the unreferenced listing and avatar uploads of 8 days, and nothing else', async () => {
    const gone = [`${U1}/listings/photo-a`, `${U1}/listings/${L1}/photo-b`, `${U1}/avatars/old-avatar`]
    for (const id of gone) cloud.addAsset(id, 8)
    const stays = [
      [`${U1}/listings/referenced`, 8], [`${U1}/avatars/current`, 8], [`${U1}/listings/young`, 6],
      ['avatars/legacy-root', 30], ['site-logo', 30], ['Lero/logo-dark', 30], ['task951-signature-check/probe', 30],
      [`${U1}/Brand/Favicon/icon`, 30], [`${U1}/listings/${L1}/deeper/x`, 30], [`${U1}/companies/logo`, 30], [`${U1}x/listings/photo`, 30],
    ] as const
    for (const [id, age] of stays) cloud.addAsset(id, age)
    db.referenced.set(`${U1}/listings/referenced`, 'listing_images.url')
    db.referenced.set(`${U1}/avatars/current`, 'users.avatar_url')

    const res = await call()
    expect(res.status).toBe(200)
    expect([...cloud.destroyed()].sort()).toEqual([...gone].sort())
    for (const [id] of stays) expect(cloud.assets.some((a) => a.public_id === id), id).toBe(true)
    const body = await res.json()
    expect(body).toMatchObject({ scanned: gone.length + stays.length, deleted: gone.length, dryRun: false })
    expect(body.kept).toBe(2)   // the two referenced ones were candidates and were kept by the reference check
  })

  it('[SEC-CLEANUP-SRV-DENY] a failing reference read deletes nothing (fail closed)', async () => {
    cloud.addAsset(`${U1}/listings/photo-a`, 30)
    db.failReads = true
    const res = await call()
    expect(res.status).toBe(200)
    expect(cloud.destroyed()).toEqual([])
    expect((await res.json()).deleted).toBe(0)
  })

  it('[SEC-CLEANUP-SRV-DENY] the dry-run mode deletes no asset and no folder and says so', async () => {
    process.env.CLOUDINARY_DELETE_MODE = 'disabled'
    cloud.addAsset(`${U1}/listings/photo-a`, 30)
    cloud.addFolder(`${U1}/listings/${L1}`)
    const res = await call()
    expect(cloud.calls.filter((c) => c.startsWith('POST ') || c.startsWith('DELETE '))).toEqual([])
    expect(await res.json()).toMatchObject({ dryRun: true, deleted: 0, foldersRemoved: 0 })
  })

  it('[SEC-CLEANUP-SRV-DENY] at most 100 assets are deleted and at most 200 Admin API reads are made in one run', async () => {
    for (let i = 0; i < 150; i++) cloud.addAsset(`${U1}/listings/photo-${i}`, 30)
    const res = await call()
    expect(cloud.destroyed()).toHaveLength(100)
    expect(cloud.adminReads()).toBeLessThanOrEqual(200)
    expect((await res.json()).deleted).toBe(100)
  })

  it('[SEC-CLEANUP-SRV-PATTERN] every page of the list is read before the first deletion, so a deletion never shifts a page still to be read', async () => {
    for (let i = 0; i < 700; i++) cloud.addAsset(`${U1}/Brand/keep-${i}`, 30)     // two pages of files that are never candidates
    for (let i = 0; i < 120; i++) cloud.addAsset(`${U1}/listings/old-${i}`, 30)    // candidates on the third page
    const res = await call()
    expect(cloud.destroyed()).toHaveLength(100)
    const lastRead = cloud.calls.map((c, i) => (c === 'GET /resources/image' ? i : -1)).reduce((a, b) => Math.max(a, b), -1)
    const firstDestroy = cloud.calls.findIndex((c) => c.startsWith('POST /image/destroy '))
    expect(firstDestroy).toBeGreaterThan(lastRead)
    expect((await res.json()).scanned).toBe(820)
  })

  it('[SEC-CLEANUP-SRV-DENY] the Admin API reads stop at 200 however many folders there are', async () => {
    const accounts = Array.from({ length: 60 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`)
    for (const id of accounts) { db.accounts.add(id); cloud.addFolder(`${id}/listings`); cloud.addFolder(`${id}/avatars`) }
    const res = await call()
    expect(cloud.adminReads()).toBeLessThanOrEqual(200)
    expect((await res.json()).budgetExhausted).toBe(true)
  })

  it('[SEC-CLEANUP-SRV-DENY] the run reads at most 10 pages of 500 assets', async () => {
    for (let i = 0; i < 5100; i++) cloud.addAsset(`${U1}/Brand/keep-${i}`, 30)
    await call()
    expect(cloud.calls.filter((c) => c === 'GET /resources/image')).toHaveLength(10)
  })

  it('[SEC-CLEANUP-SRV-DENY] the answer and the log line carry counts only, never an id', async () => {
    cloud.addAsset(`${U1}/listings/photo-a`, 30)
    const info = vi.mocked(console.info)
    const res = await call()
    const body = await res.json()
    for (const value of Object.values(body)) expect(['number', 'boolean']).toContain(typeof value)
    const runLine = info.mock.calls.find((c) => String(c[0]).includes('cloudinary-cleanup'))
    expect(runLine).toBeTruthy()
    for (const value of Object.values((runLine![1] ?? {}) as Record<string, unknown>)) expect(['number', 'boolean']).toContain(typeof value)
    expect(JSON.stringify(info.mock.calls.filter((c) => String(c[0]).includes('cloudinary-cleanup')))).not.toContain(U1)
  })
})

describe('GET /api/cron/cloudinary-cleanup: the folders', () => {
  it('[SEC-CLEANUP-SRV-FOLDERS] an empty listing folder is removed before its parent, and the empty folders of a living account go with them', async () => {
    cloud.addFolder(`${U1}/listings/${L1}`)
    cloud.addFolder(`${U1}/avatars`)
    const res = await call()
    const deletes = cloud.calls.filter((c) => c.startsWith('DELETE ')).map((c) => c.slice('DELETE /folders/'.length))
    expect([...deletes].sort()).toEqual([`${U1}/listings/${L1}`, `${U1}/listings`, `${U1}/avatars`, U1].sort())
    expect(deletes.indexOf(`${U1}/listings/${L1}`), 'the listing folder before its parent').toBeLessThan(deletes.indexOf(`${U1}/listings`))
    expect(deletes.at(-1), 'the account folder last').toBe(U1)
    expect([...cloud.folders]).toEqual([])
    expect((await res.json()).foldersRemoved).toBe(4)
  })

  it('[SEC-CLEANUP-SRV-FOLDERS] a root folder of no account holding only empty listings and avatars folders is removed whole', async () => {
    db.accounts.delete(U2)
    cloud.addFolder(`${U2}/listings`)
    cloud.addFolder(`${U2}/avatars`)
    await call()
    expect([...cloud.folders]).toEqual([])
  })

  it('[SEC-CLEANUP-SRV-FOLDERS] a folder with an asset stays, with its parents; a subfolder outside the pattern keeps the root of a living account', async () => {
    cloud.addAsset(`${U1}/listings/${L1}/young`, 1)           // an asset of 1 day: not deleted, so its folders stay
    cloud.addFolder(`${U2}/listings`)
    cloud.addFolder(`${U2}/Brand`)                            // not in the pattern
    await call()
    expect(cloud.folders.has(`${U1}/listings/${L1}`)).toBe(true)
    expect(cloud.folders.has(`${U1}/listings`)).toBe(true)
    expect(cloud.folders.has(U1)).toBe(true)
    expect(cloud.folders.has(`${U2}/Brand`)).toBe(true)
    expect(cloud.folders.has(U2)).toBe(true)
    expect(cloud.folders.has(`${U2}/listings`)).toBe(false)   // the empty sibling inside the pattern is removed
  })

  it('[SEC-CLEANUP-SRV-FOLDERS] the site folders and the folders that are not an account\'s are never touched', async () => {
    cloud.addFolder('Lero')
    cloud.addFolder('task951-signature-check')
    cloud.addFolder('avatars')
    cloud.addFolder('companies')
    await call()
    expect(cloud.calls.filter((c) => c.startsWith('DELETE '))).toEqual([])
    expect(cloud.folders.size).toBe(4)
  })

  it('[SEC-CLEANUP-SRV-DENY] an account that cannot be read is treated as existing: its folders are not purged', async () => {
    db.accountReadError = true
    cloud.addFolder(`${U1}/Brand/Favicon`)
    await call()
    expect(cloud.folders.has(`${U1}/Brand/Favicon`)).toBe(true)
    expect(cloud.calls.filter((c) => c.startsWith('DELETE ') || c.startsWith('POST '))).toEqual([])
  })
})
