// @vitest-environment node
/**
 * Security (Task 923 R141, R142, owner decision D30): one complete deletion of an account, for every role and path.
 *  - SEC-DEL-SRV-ALLOW: `deleteAccount` reads every file reference first, then removes the Auth user (one transaction: the profile, the listings, their images and the
 *    company go with it), and only then releases the Cloudinary files and the person's `avatars` objects; it writes no row itself;
 *  - SEC-DEL-SRV-ERR: a failed read, or a failed Auth deletion, answers `delete_failed` and releases nothing; a file that is not removed never undoes the deletion and is counted;
 *    no log line carries a URL, an e-mail or a name;
 *  - SEC-DEL-SRV-DENY: the REAL `hardDeleteUser` and `deleteOwnAccount` refuse everyone they must refuse before `deleteAccount` reads or removes anything of the target.
 * The code under test is the real one. The doubles are the service-role client (it records every `from`, filter, `auth.admin.deleteUser` and Storage call in ONE ordered log, and
 * answers from plain arrays: it knows no foreign key and no transaction, so the cascade itself is proved by the real-boundary suite `deleteAccount.integration.test.ts`),
 * Cloudinary's `deleteAsset` (it records the id and the reason), the identity and the permission helper, the cache, and the SDK's verify client.
 */
import { beforeEach, expect, it, vi, type MockInstance } from 'vitest'

type AssetMode = 'ok' | 'throws' | 'lookup' | 'referenced'
type StorageMode = 'ok' | 'list-error' | 'remove-error' | 'list-throws' | 'remove-throws'

const world = vi.hoisted(() => ({
  log: [] as string[],
  user: null as { id: string; email?: string } | null,
  permitted: true,
  tables: {} as Record<string, unknown[]>,
  failRead: null as string | null,
  /** `<table>:<from>`: the page of that table that starts at `from` answers an error */
  failPage: null as string | null,
  deleteUserError: null as { code?: string; status?: number; message: string } | null,
  assets: new Map<string, AssetMode>(),
  storage: 'ok' as StorageMode,
  objects: [] as { name: string }[],
  providers: ['email'] as string[],
  amr: [] as unknown[],
  password: 'Right-Passw0rd!',
}))

/**
 * a database whose reads answer from `world.tables` (or fail for `world.failRead`, or for one page of `world.failPage`) and which records every table, filter, order, page and write in
 * the one log; a read with `range(from, to)` answers that slice of the table's rows (it ignores the filters: the real filter is proved by the real-boundary suite)
 */
function chainFor(table: string): unknown {
  let columns = ''
  let slice: [number, number] | null = null
  const chain: Record<string, unknown> = {}
  chain.select = (cols?: string) => { columns = cols ?? '*'; world.log.push(`select:${table}:${columns}`); return chain }
  chain.eq = (column: string, value: unknown) => { world.log.push(`eq:${table}:${column}=${String(value)}`); return chain }
  chain.in = (column: string, values: unknown[]) => { world.log.push(`in:${table}:${column}=${values.join(',')}`); return chain }
  chain.order = (column: string) => { world.log.push(`order:${table}:${column}`); return chain }
  chain.range = (from: number, to: number) => { world.log.push(`range:${table}:${from}-${to}`); slice = [from, to]; return chain }
  chain.gte = () => chain
  for (const op of ['insert', 'update', 'delete', 'upsert']) chain[op] = () => { world.log.push(`write:${table}:${op}`); return chain }
  const reply = () => {
    if (world.failRead === table || (world.failRead === 'rank' && table === 'users' && columns === 'id, role')) return { data: null, error: { code: 'XX000' } }
    if (slice && world.failPage === `${table}:${slice[0]}`) return { data: null, error: { code: 'XX000' } }
    if (table === 'reauth_failures') return { data: null, count: 0, error: null }
    const key = table === 'users' && columns === 'id, role' ? 'rank' : table
    const all = world.tables[key] ?? []
    return { data: slice ? all.slice(slice[0], slice[1] + 1) : all, error: null }
  }
  chain.maybeSingle = async () => ({ data: null, error: null })
  chain.single = async () => ({ data: null, error: null })
  chain.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(reply()).then(resolve, reject)
  return chain
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => { world.log.push(`from:${table}`); return chainFor(table) },
    rpc: async (name: string) => (name === 'account_has_password' ? { data: world.providers.includes('email'), error: null } : { data: [], error: null }),
    auth: {
      admin: {
        deleteUser: async (id: string) => { world.log.push(`deleteUser:${id}`); return { error: world.deleteUserError } },
        getUserById: async (id: string) => ({ data: { user: { id, email: 'person@example.com', app_metadata: { providers: world.providers } } }, error: null }),
      },
    },
    storage: {
      from: (bucket: string) => ({
        list: async (path: string, options: unknown) => {
          world.log.push(`storage.list:${bucket}:${path}:${JSON.stringify(options)}`)
          if (world.storage === 'list-throws') throw new Error('storage unreachable')
          if (world.storage === 'list-error') return { data: null, error: { name: 'StorageApiError', message: 'list failed' } }
          return { data: world.objects, error: null }
        },
        remove: async (paths: string[]) => {
          world.log.push(`storage.remove:${bucket}:${paths.join(',')}`)
          if (world.storage === 'remove-throws') throw new Error('storage unreachable')
          if (world.storage === 'remove-error') return { data: null, error: { name: 'StorageApiError', message: 'remove failed' } }
          return { data: paths.map((name) => ({ name })), error: null }
        },
      }),
    },
  }),
}))
vi.mock('@/lib/cloudinaryDelete', () => ({
  deleteAsset: async (publicId: string, options: { reason: string }) => {
    world.log.push(`deleteAsset:${publicId}:${options.reason}`)
    const mode = world.assets.get(publicId) ?? 'ok'
    if (mode === 'throws') throw new Error(`Cloudinary destroy failed: https://res.cloudinary.com/demo/image/upload/v1/${publicId}.jpg for Alba Hoxha alba@example.com`)
    if (mode === 'lookup') return { skipped: true, skipReason: 'reference lookup failed', dryRun: false, deleted: false }
    if (mode === 'referenced') return { skipped: true, skipReason: 'referenced in: users.avatar_url', dryRun: false, deleted: false }
    return { skipped: false, dryRun: false, deleted: true }
  },
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => world.user, resolveSession: async () => ({ user: world.user }), getSession: async () => null }))
vi.mock('@/lib/auth/permissions', () => ({ hasPermission: async () => world.permitted, assertPermission: async () => undefined, roleHasPermission: () => false }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
// the rest of what the two callers import: the session client (re-authentication reads the Google sign-in claims), the SDK's verify client, the cookies and the mail
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getClaims: async () => ({ data: { claims: { amr: world.amr } }, error: null }) } }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      signInWithPassword: async ({ password }: { password: string }) => ({ error: password === world.password ? null : { message: 'Invalid login credentials' } }),
      signOut: async () => ({ error: null }),
    },
  }),
}))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [], get: () => undefined, set: () => undefined }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('@/lib/auth/accountAccess', async (orig) => ({ ...(await orig<typeof import('@/lib/auth/accountAccess')>()), syncAccountAccess: async () => ({ ok: true }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))

import { hardDeleteUser } from '@/modules/admin/actions'
import { deleteOwnAccount } from '@/modules/cabinet/actions'
import { deleteAccount } from './deleteAccount'

const cloud = (id: string, extension = 'jpg') => `https://res.cloudinary.com/demo/image/upload/v1700000000/${id}.${extension}`
const TARGET = 'tgt-0001'
const AVATAR = 'avatars/a1'
const OWN_LOGO = 'logos/own'
const IMAGE_ONE = 'listings/i1'
const IMAGE_TWO = 'listings/i2'
const IMAGE_THREE = 'listings/i3'
const COMPANY_LOGO = 'companies/c1'
const DOCUMENT = 'verification/d1'
const EVERY_ID = [AVATAR, OWN_LOGO, IMAGE_ONE, IMAGE_TWO, IMAGE_THREE, COMPANY_LOGO, DOCUMENT].sort()

/**
 * the person's rows as the four reads of `deleteAccount` see them: three images, and a URL twice, one that is not Cloudinary's and a null, which must not become ids.
 * The two listings are rows of a table the code no longer reads (R146): they stay so that a read of that table coming back finds rows and fails on the read order.
 */
function seedPerson() {
  world.tables.users = [{ avatar_url: cloud(AVATAR), company_logo_url: cloud(OWN_LOGO, 'png') }]
  world.tables.listings = [{ id: 'l1' }, { id: 'l2' }]
  world.tables.listing_images = [
    { url: cloud(IMAGE_ONE) }, { url: cloud(IMAGE_TWO) }, { url: cloud(IMAGE_THREE) }, { url: cloud(IMAGE_ONE) }, { url: 'https://example.com/elsewhere/photo.jpg' }, { url: null },
  ]
  world.tables.companies = [{ logo_url: cloud(COMPANY_LOGO, 'png') }]
  world.tables.verification_requests = [{ document_url: cloud(DOCUMENT, 'pdf') }]
  world.objects = [{ name: 'avatar.png' }, { name: 'older.png' }]
}

const writes = () => world.log.filter((entry) => entry.startsWith('write:'))
const index = (prefix: string) => world.log.findIndex((entry) => entry.startsWith(prefix))
const lastIndex = (prefix: string) => world.log.map((entry) => entry.startsWith(prefix)).lastIndexOf(true)
const released = () => world.log.filter((entry) => entry.startsWith('deleteAsset:')).map((entry) => entry.split(':')[1]).sort()
const consoleText = (spy: MockInstance) => JSON.stringify(spy.mock.calls)

let errorSpy: MockInstance
let infoSpy: MockInstance

beforeEach(() => {
  world.log.length = 0
  world.user = null
  world.permitted = true
  world.tables = {}
  world.failRead = null
  world.failPage = null
  world.deleteUserError = null
  world.assets.clear()
  world.storage = 'ok'
  world.objects = []
  world.providers = ['email']
  world.amr = []
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
})

it('[SEC-DEL-SRV-ALLOW] Deleting an account removes the account, its data, its listings and their files for every role, in one database transaction', async () => {
  for (const reason of ['staff', 'self'] as const) {
    world.log.length = 0
    seedPerson()
    expect(await deleteAccount(TARGET, { reason }), `${reason}: every file was released`).toEqual({ ok: true, filesNotRemoved: 0 })

    // each id once, only Cloudinary's, each with the reason of this deletion; the null and the foreign URL made no id
    expect(released(), `${reason}: the ids released`).toEqual(EVERY_ID)
    expect(world.log.filter((entry) => entry.startsWith('deleteAsset:')).every((entry) => entry.endsWith(':account_deleted'))).toBe(true)

    // the four reads name the person (the images through their listing, with no list of listing ids), then the Auth user goes, then the files: the order is the safety of the design
    // (a read asks one page more than it has rows for, so a filter is logged once per page: the distinct entries, in order, are compared; an `in:` entry would show here)
    expect([...new Set(world.log.filter((entry) => entry.startsWith('eq:') || entry.startsWith('in:')))], `${reason}: what each read asked for`).toEqual([
      `eq:users:id=${TARGET}`, `eq:listing_images:listings.user_id=${TARGET}`, `eq:companies:created_by=${TARGET}`, `eq:verification_requests:user_id=${TARGET}`,
    ])
    expect(world.log.includes('from:listings'), `${reason}: the listings table is not read`).toBe(false)
    expect([...new Set(world.log.filter((entry) => entry.startsWith('select:')))], `${reason}: the columns each read asks for`).toEqual([
      'select:users:avatar_url, company_logo_url', 'select:listing_images:url, listings!inner(user_id)', 'select:companies:logo_url', 'select:verification_requests:document_url',
    ])
    expect([...new Set(world.log.filter((entry) => entry.startsWith('order:')))], `${reason}: every collection is read in the order of its id`).toEqual([
      'order:users:id', 'order:listing_images:id', 'order:companies:id', 'order:verification_requests:id',
    ])
    expect(world.log.filter((entry) => entry.startsWith('deleteUser:')), `${reason}: exactly one Auth deletion, of the target`).toEqual([`deleteUser:${TARGET}`])
    const deletion = index('deleteUser:')
    expect(lastIndex('from:'), `${reason}: every read comes before the Auth deletion`).toBeLessThan(deletion)
    expect(index('deleteAsset:'), `${reason}: no file is released before the Auth deletion`).toBeGreaterThan(deletion)
    expect(index('storage.list:'), `${reason}: the Storage objects are listed after the Cloudinary files`).toBeGreaterThan(lastIndex('deleteAsset:'))
    expect(index('storage.remove:')).toBeGreaterThan(index('storage.list:'))

    expect(world.log.filter((entry) => entry.startsWith('storage.')), `${reason}: the person's own folder, one listing and one removal`).toEqual([
      `storage.list:avatars:${TARGET}:{"limit":1000}`, `storage.remove:avatars:${TARGET}/avatar.png,${TARGET}/older.png`,
    ])
    expect(writes(), `${reason}: the function writes no row itself`).toEqual([])
  }

  // an account with 2 345 images: the image read asks page after page, and every id is released once (a person's rows can outnumber one page)
  world.log.length = 0
  seedPerson()
  const bulkIds = Array.from({ length: 2345 }, (_, i) => `listings/bulk-${String(i).padStart(4, '0')}`)
  world.tables.listing_images = bulkIds.map((id, i) => ({ id: `img-${String(i).padStart(4, '0')}`, url: cloud(id) }))
  expect(await deleteAccount(TARGET, { reason: 'staff' }), 'every file was released').toEqual({ ok: true, filesNotRemoved: 0 })
  const releasedBulk = released()
  const releasedSet = new Set(releasedBulk)
  const missing = bulkIds.filter((id) => !releasedSet.has(id))
  expect(missing.length, `${missing.length} of the 2 345 image ids were not released (first: ${missing[0]})`).toBe(0)
  expect(releasedBulk.length, 'each id is released once: the four ids of the other tables and the 2 345 images').toBe(2349)
  expect(world.log.filter((entry) => entry.startsWith('range:listing_images:')), 'the image read: a page from 0, then from the rows already read, until a page has no row').toEqual([
    'range:listing_images:0-999', 'range:listing_images:1000-1999', 'range:listing_images:2000-2999', 'range:listing_images:2345-3344',
  ])
  expect(world.log.filter((entry) => entry === 'order:listing_images:id').length, 'every page is ordered by id').toBe(4)
  expect(lastIndex('from:'), 'every page is read before the Auth deletion').toBeLessThan(index('deleteUser:'))

  // an account that holds nothing releases nothing; its image read ends at the first, empty page
  world.log.length = 0
  world.tables = { users: [{ avatar_url: null, company_logo_url: null }] }
  world.objects = []
  expect(await deleteAccount(TARGET, { reason: 'staff' })).toEqual({ ok: true, filesNotRemoved: 0 })
  expect(world.log.filter((entry) => entry.startsWith('range:listing_images:')), 'one empty page ends the read').toEqual(['range:listing_images:0-999'])
  expect(released()).toEqual([])
  expect(world.log.some((entry) => entry.startsWith('storage.remove:')), 'nothing to remove, nothing removed').toBe(false)
  expect(world.log.filter((entry) => entry.startsWith('deleteUser:'))).toEqual([`deleteUser:${TARGET}`])
})

it('[SEC-DEL-SRV-ERR] Deleting an account removes the account, its data, its listings and their files for every role, in one database transaction', async () => {
  // 1. a read that fails refuses: no Auth deletion, no file released, one log line with the ids and the code only
  for (const source of ['users', 'listing_images', 'companies', 'verification_requests']) {
    world.log.length = 0
    errorSpy.mockClear()
    seedPerson()
    world.failRead = source
    expect(await deleteAccount(TARGET, { reason: 'self' }), `a failed read of ${source}`).toEqual({ ok: false, error: 'delete_failed' })
    expect(world.log.filter((entry) => /^(deleteUser|deleteAsset|storage)/.test(entry)), `${source}: nothing is deleted or released`).toEqual([])
    expect(errorSpy).toHaveBeenCalledWith('deleteAccount: a read before the deletion failed', { userId: TARGET, reason: 'self', source, code: 'XX000' })
  }
  world.failRead = null

  // 1b. an error on a later page refuses the whole deletion too: the second page of 1 500 images fails, and nothing is deleted or released
  world.log.length = 0
  errorSpy.mockClear()
  seedPerson()
  world.tables.listing_images = Array.from({ length: 1500 }, (_, i) => ({ id: `img-${i}`, url: cloud(`listings/bulk-${i}`) }))
  world.failPage = 'listing_images:1000'
  expect(await deleteAccount(TARGET, { reason: 'self' }), 'a failed second page of listing_images').toEqual({ ok: false, error: 'delete_failed' })
  expect(world.log.filter((entry) => entry.startsWith('range:listing_images:')), 'the second page was asked for').toEqual(['range:listing_images:0-999', 'range:listing_images:1000-1999'])
  expect(world.log.filter((entry) => /^(deleteUser|deleteAsset|storage)/.test(entry)), 'a failed later page: nothing is deleted or released').toEqual([])
  expect(errorSpy).toHaveBeenCalledWith('deleteAccount: a read before the deletion failed', { userId: TARGET, reason: 'self', source: 'listing_images', code: 'XX000' })
  world.failPage = null

  // 2. the Auth deletion fails: delete_failed, and no file is touched (the account still exists and still uses them)
  world.log.length = 0
  seedPerson()
  world.deleteUserError = { code: 'unexpected_failure', status: 500, message: 'database error deleting user' }
  expect(await deleteAccount(TARGET, { reason: 'staff' })).toEqual({ ok: false, error: 'delete_failed' })
  expect(world.log.filter((entry) => entry.startsWith('deleteUser:'))).toEqual([`deleteUser:${TARGET}`])
  expect(world.log.filter((entry) => /^(deleteAsset|storage)/.test(entry)), 'no file is touched').toEqual([])
  world.deleteUserError = null

  // 3. files that cannot be removed never undo the deletion and are counted: a throw, a failed reference check and a failed removal of the one Storage object count one each,
  //    a file still referenced elsewhere counts none
  world.log.length = 0
  errorSpy.mockClear()
  seedPerson()
  world.objects = [{ name: 'avatar.png' }]
  world.storage = 'remove-error'
  world.assets.set(AVATAR, 'throws')
  world.assets.set(OWN_LOGO, 'lookup')
  world.assets.set(DOCUMENT, 'referenced')
  expect(await deleteAccount(TARGET, { reason: 'staff' })).toEqual({ ok: true, filesNotRemoved: 3 })
  expect(released(), 'every id was still tried').toEqual(EVERY_ID)
  expect(world.log.filter((entry) => entry.startsWith('deleteUser:')), 'the account was deleted').toEqual([`deleteUser:${TARGET}`])
  world.assets.clear()
  world.storage = 'ok'

  // 4. the Storage objects: a failed listing counts one, a failed or thrown removal counts every object it covered
  const storageCases: [StorageMode, number][] = [['list-error', 1], ['list-throws', 1], ['remove-error', 2], ['remove-throws', 2]]
  for (const [mode, counted] of storageCases) {
    world.log.length = 0
    seedPerson()
    world.storage = mode
    expect(await deleteAccount(TARGET, { reason: 'self' }), `Storage ${mode}`).toEqual({ ok: true, filesNotRemoved: counted })
    expect(world.log.filter((entry) => entry.startsWith('deleteUser:')), `Storage ${mode}: the account was deleted`).toEqual([`deleteUser:${TARGET}`])
    expect(world.log.some((entry) => entry.startsWith('storage.remove:')), `Storage ${mode}`).toBe(!mode.startsWith('list'))
  }

  // 5. no log line of any failure carries a URL, an e-mail or a name; the ids, the reason and the codes stay
  const text = consoleText(errorSpy) + consoleText(infoSpy)
  expect(text).not.toMatch(/https?:|cloudinary\.com|@example\.com|Alba|Hoxha/)
  expect(text).toContain(TARGET)
  expect(text).toContain('"reason":"staff"')
})

it('[SEC-DEL-SRV-DENY] Only the person or a staff member whose rank allows it can delete an account', async () => {
  const untouched = (label: string) => {
    expect(world.log.filter((entry) => /^(deleteUser|deleteAsset|storage\.)/.test(entry)), `${label}: no Auth deletion, no file`).toEqual([])
    expect(world.log.filter((entry) => /^(from:(listings|listing_images|companies|verification_requests))|^select:users:avatar_url/.test(entry)), `${label}: no read of the target's files`).toEqual([])
    expect(world.log.filter((entry) => entry.startsWith('write:users') || entry.startsWith('write:listings')), `${label}: no write`).toEqual([])
  }
  const admin = { id: 'adm-0001', email: 'admin@example.com' }
  const moderator = { id: 'mod-0001', email: 'moderator@example.com' }
  const ranks = (actor: string, actorRole: string, target: string, targetRole: string) => [{ id: actor, role: actorRole }, { id: target, role: targetRole }]
  seedPerson()

  // the staff path: every refusal comes before deleteAccount
  const staffCases: [string, string, () => void, { error: string }][] = [
    ['a moderator without users.hard_delete', TARGET, () => { world.user = moderator; world.permitted = false }, { error: 'forbidden' }],
    ['a blocked administrator (the permission helper answers false for a blocked account)', TARGET, () => { world.user = admin; world.permitted = false }, { error: 'forbidden' }],
    ['no session', TARGET, () => { world.user = null }, { error: 'Unauthorized' }],
    ['an administrator deleting their own account', admin.id, () => { world.user = admin; world.tables.rank = ranks(admin.id, 'admin', admin.id, 'admin') }, { error: 'forbidden' }],
    ['a moderator deleting their own account', moderator.id, () => { world.user = moderator; world.tables.rank = ranks(moderator.id, 'moderator', moderator.id, 'moderator') }, { error: 'forbidden' }],
    ['a moderator deleting an administrator', 'adm-0002', () => { world.user = moderator; world.tables.rank = ranks(moderator.id, 'moderator', 'adm-0002', 'admin') }, { error: 'forbidden' }],
    ['a rank read that fails', TARGET, () => { world.user = moderator; world.failRead = 'rank' }, { error: 'forbidden' }],
    ['a target with no profile row', 'ghost-0001', () => { world.user = moderator; world.tables.rank = [{ id: moderator.id, role: 'moderator' }] }, { error: 'forbidden' }],
  ]
  for (const [label, target, arrange, answer] of staffCases) {
    world.log.length = 0
    world.permitted = true
    world.failRead = null
    world.tables.rank = []
    arrange()
    expect(await hardDeleteUser(target), `hardDeleteUser: ${label}`).toEqual(answer)
    untouched(`hardDeleteUser: ${label}`)
  }

  // the self path: no session, no proof, a wrong password and a stale Google sign-in are refused before anything of the person is read
  const person = { id: 'own-0001', email: 'person@example.com' }
  const selfCases: [string, () => void, () => Promise<{ error?: string }>, { error: string }][] = [
    ['no session', () => { world.user = null }, () => deleteOwnAccount({ password: world.password }), { error: 'Unauthorized' }],
    ['no password', () => { world.user = person }, () => deleteOwnAccount(), { error: 'invalid_password' }],
    ['a wrong password', () => { world.user = person }, () => deleteOwnAccount({ password: 'Wrong-Passw0rd!' }), { error: 'invalid_password' }],
    ['a Google-only account with no recent Google sign-in', () => { world.user = person; world.providers = ['google'] }, () => deleteOwnAccount(), { error: 'reauth_required' }],
  ]
  for (const [label, arrange, call, answer] of selfCases) {
    world.log.length = 0
    world.providers = ['email']
    world.amr = []
    arrange()
    expect(await call(), `deleteOwnAccount: ${label}`).toEqual(answer)
    untouched(`deleteOwnAccount: ${label}`)
  }

  // the controls: the same two actions delete when the person or the staff member is allowed, so the refusals above are not passing for another reason
  world.log.length = 0
  world.providers = ['email']
  world.user = admin
  world.permitted = true
  world.failRead = null
  world.tables.rank = ranks(admin.id, 'admin', TARGET, 'user')
  expect(await hardDeleteUser(TARGET), 'an administrator deletes an ordinary account').toEqual({})
  expect(world.log.filter((entry) => entry.startsWith('deleteUser:'))).toEqual([`deleteUser:${TARGET}`])
  expect(released()).toEqual(EVERY_ID)
  world.log.length = 0
  world.user = person
  expect(await deleteOwnAccount({ password: world.password }), 'the person deletes their own account with the right password').toEqual({})
  expect(world.log.filter((entry) => entry.startsWith('deleteUser:'))).toEqual([`deleteUser:${person.id}`])
})
