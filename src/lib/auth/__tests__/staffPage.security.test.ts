// @vitest-environment node
/**
 * Security (Task 923 R68 (a)): no admin page or metadata reads anything for a viewer who is not an active administrator or moderator.
 *  - SEC-X-SRV-ADMINPAGE-GUARD: the admin layout is not a guard for the page below it (a React Server Components request whose router-state header already names
 *    the layout renders the page alone), so every `src/app/admin/**\/page.tsx` and every admin `generateMetadata` calls `requireStaffPage()` as its FIRST await.
 *    This file proves it twice: a scan of every admin page lists them and fails on one whose first await is anything else, and every page and metadata function is
 *    really called with a guest, a plain user, an agent, a blocked moderator, a deleted administrator and a failed role lookup against a database double that counts
 *    every read. Each call ends in `notFound()` or the sign-in redirect, with no read counted and nothing of a row in the result.
 *  - SEC-1007-PAGE-DENY (Task 1007 AC2): the guard follows the administrator's page switches. For every page key but `page.dashboard` (the `/admin` landing is AC5) a moderator
 *    without the key gets `notFound()` before any other read, with it the page, and a failed key read is `notFound()`; an administrator needs no row; Footer and Permissions
 *    (`adminOnly`) are closed to a moderator whatever is switched on; a user and an agent get `notFound()`; a guest is sent to sign-in. The census above now needs the
 *    first await of every page to name its access.
 * The REAL requireViewer, the real helper and the real pages run; the identity, the database and the i18n lookups are doubles. Every id is synthetic.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN_PAGES, ADMIN_PAGE_KEYS } from '../adminPages'

const state = vi.hoisted(() => ({
  authUserId: null as string | null,
  /** the signed-in account's own row, as the service role returns it */
  viewerRow: null as null | { role: string; status: string; suspended_until: string | null; deleted_at: string | null },
  viewerLookupFails: false,
  /** every database or Auth access that is NOT the viewer lookup of the signed-in account's own row and NOT the read of a moderator's key */
  reads: [] as string[],
  /** the `role_permissions` switches of the moderator that are on, and every key that was read (Task 1007) */
  moderatorKeys: new Set<string>(),
  keyReads: [] as string[],
  keyReadFails: false,
  keyReadThrows: false,
}))

const VIEWER_COLUMNS = 'role, status, suspended_until, deleted_at'

/** a recorder: any call it receives is a read, and it answers with an empty result */
function recorder(label: string): unknown {
  const answer = { data: null, error: null, count: 0 }
  const chain: unknown = new Proxy(function () {}, {
    get: (_t, key) => {
      if (key === 'then') return (resolve: (v: unknown) => void) => resolve(answer)
      state.reads.push(`${label}.${String(key)}`)
      return chain
    },
    apply: () => chain,
  })
  return chain
}

vi.mock('@/lib/auth/server', () => ({
  getUser: async () => (state.authUserId ? { id: state.authUserId } : null),
  resolveSession: async () => ({ user: state.authUserId ? { id: state.authUserId } : null }),
  getSession: async () => null,
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'users') {
        const lookup = {
          select: (cols: string) => {
            if (cols !== VIEWER_COLUMNS) { state.reads.push(`admin.users.select(${cols})`); return recorder('admin.users') }
            return { eq: () => ({ maybeSingle: async () => (state.viewerLookupFails ? { data: null, error: { message: 'down' } } : { data: state.viewerRow, error: null }) }) }
          },
        }
        return new Proxy(lookup, { get: (target, key) => (key in target ? (target as Record<string | symbol, unknown>)[key] : (state.reads.push(`admin.users.${String(key)}`), recorder('admin.users'))) })
      }
      if (table === 'role_permissions') {
        // the one read the page guard makes for a moderator: `roleHasPermission` (select allowed, role = moderator, permission_key = key, maybeSingle)
        let key = ''
        const c: Record<string, unknown> = {}
        c.select = () => c
        c.eq = (column: string, value: string) => { if (column === 'permission_key') key = value; return c }
        c.maybeSingle = async () => {
          state.keyReads.push(key)
          if (state.keyReadThrows) throw new Error('down')
          if (state.keyReadFails) return { data: null, error: { code: 'XX000', message: 'down' } }
          return { data: state.moderatorKeys.has(key) ? { allowed: true } : null, error: null }
        }
        return c
      }
      state.reads.push(`admin.from(${table})`)
      return recorder(`admin.${table}`)
    },
    rpc: () => { state.reads.push('admin.rpc'); return recorder('admin.rpc') },
    auth: { admin: recorder('admin.auth.admin') },
  }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => { state.reads.push(`session.from(${table})`); return recorder(`session.${table}`) },
    rpc: () => { state.reads.push('session.rpc'); return recorder('session.rpc') },
    auth: { getUser: async () => ({ data: { user: state.authUserId ? { id: state.authUserId } : null } }) },
  }),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [], set: () => undefined }),
  headers: async () => ({ get: () => null }),
}))
vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => undefined,
}))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))

const ADMIN_ROOT = join(process.cwd(), 'src', 'app', 'admin')

function pageFiles(dir = ADMIN_ROOT, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) pageFiles(full, out)
    else if (entry.name === 'page.tsx') out.push(full)
  }
  return out.sort()
}

const relative = (file: string) => file.slice(process.cwd().length + 1).split('\\').join('/')

/** the text of a function from the line that opens its body to the end of the file: enough to read its first statements */
function bodyAfter(text: string, signature: RegExp): string | null {
  const match = signature.exec(text)
  if (!match) return null
  const rest = text.slice(match.index)
  const open = rest.search(/\)\s*(?::\s*[^{]+)?\{\n/)
  if (open < 0) return null
  return rest.slice(open + rest.slice(open).indexOf('{\n') + 2)
}

const firstAwait = (body: string) => {
  const at = body.indexOf('await ')
  return at < 0 ? null : body.slice(at, body.indexOf('\n', at)).trim()
}

/**
 * Task 1007: the first await is `requireStaffPage(` with the access of the page: a key of `ADMIN_PAGES`, `{ adminOnly: true }`, or `{ landing: true }` in `src/app/admin/page.tsx`
 * only (stricter than the bare call it replaces; never loosened).
 */
function namesAccess(first: string | null, file: string): boolean {
  const m = /^await requireStaffPage\(\{ (?:page: '(page\.[a-z_]+)'|(adminOnly): true|(landing): true) \}\)$/.exec(first ?? '')
  if (!m) return false
  if (m[1]) return (ADMIN_PAGE_KEYS as readonly string[]).includes(m[1])
  if (m[3]) return relative(file) === 'src/app/admin/page.tsx'
  return true
}

const outcome = async (run: () => unknown) => {
  try { await run(); return 'returned' } catch (e) {
    const digest = String((e as { digest?: string }).digest ?? '')
    if (digest.startsWith('NEXT_REDIRECT')) return 'redirect'
    if (digest.includes('404')) return 'notFound'
    return `threw ${(e as Error).message}`
  }
}

const person = (role: string, status = 'active') => { state.authUserId = `u-${role}`; state.viewerRow = { role, status, suspended_until: null, deleted_at: null } }

describe('staffPage', () => {
  it('[SEC-X-SRV-ADMINPAGE-GUARD] no admin page or metadata reads for a non-staff viewer', async () => {
    const files = pageFiles()
    expect(files.length, 'the scanner found the admin pages').toBeGreaterThanOrEqual(20)

    // 1. every page and every generateMetadata awaits the guard first
    const offenders: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      if (!/import \{[^}]*\brequireStaffPage\b[^}]*\} from '@\/lib\/auth\/staff'/.test(text)) offenders.push(`${relative(file)}: does not import requireStaffPage`)
      const body = bodyAfter(text, /export default (?:async )?function \w+\s*\(/)
      if (!body) offenders.push(`${relative(file)}: no default export function found`)
      else if (!namesAccess(firstAwait(body), file)) offenders.push(`${relative(file)}: the first await of the page is ${firstAwait(body)}`)
      const meta = bodyAfter(text, /export (?:async )?function generateMetadata\s*\(/)
      if (meta && !namesAccess(firstAwait(meta), file)) offenders.push(`${relative(file)}: the first await of generateMetadata is ${firstAwait(meta)}`)
    }
    expect(offenders, offenders.join('\n')).toEqual([])

    // 2. every page and metadata function really refuses, before any read, for each viewer that must not get in
    const VIEWERS: Array<[string, () => void, 'redirect' | 'notFound']> = [
      ['a guest', () => { state.authUserId = null }, 'redirect'],
      ['a plain user', () => { state.authUserId = 'u-user'; state.viewerRow = { role: 'user', status: 'active', suspended_until: null, deleted_at: null } }, 'notFound'],
      ['an agent', () => { state.authUserId = 'u-agent'; state.viewerRow = { role: 'agent', status: 'active', suspended_until: null, deleted_at: null } }, 'notFound'],
      ['a blocked moderator', () => { state.authUserId = 'u-mod'; state.viewerRow = { role: 'moderator', status: 'blocked', suspended_until: null, deleted_at: null } }, 'redirect'],
      ['a deleted administrator', () => { state.authUserId = 'u-adm'; state.viewerRow = { role: 'admin', status: 'active', suspended_until: null, deleted_at: '2026-01-01T00:00:00Z' } }, 'redirect'],
      ['a failed role lookup', () => { state.authUserId = 'u-lookup'; state.viewerLookupFails = true }, 'notFound'],
    ]
    const props = { params: Promise.resolve({ id: '00000000-0000-4000-8000-0000000000aa' }), searchParams: Promise.resolve({}) }
    const failures: string[] = []
    for (const file of files) {
      const mod = (await import(/* @vite-ignore */ file)) as { default: (p: unknown) => unknown; generateMetadata?: (p: unknown) => unknown }
      for (const [label, arrange, expected] of VIEWERS) {
        for (const [name, run] of [['page', () => mod.default(props)], ['generateMetadata', () => mod.generateMetadata?.(props)]] as const) {
          if (name === 'generateMetadata' && !mod.generateMetadata) continue
          state.reads = []; state.authUserId = null; state.viewerRow = null; state.viewerLookupFails = false
          arrange()
          const result = await outcome(run)
          if (result !== expected) failures.push(`${relative(file)} ${name} for ${label}: ${result}, expected ${expected}`)
          if (state.reads.length) failures.push(`${relative(file)} ${name} for ${label}: read ${state.reads.join(', ')}`)
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  }, 240_000)   // the test imports every admin page: on a loaded machine (the whole suite in parallel) the default 60 s timed out once

  it('an active administrator and an active moderator pass the guard, and it returns who they are (the control)', async () => {
    const { requireStaffPage } = await import('../staff')
    for (const role of ['admin', 'moderator']) {
      state.authUserId = `u-${role}`
      state.viewerRow = { role, status: 'active', suspended_until: null, deleted_at: null }
      state.viewerLookupFails = false
      await expect(requireStaffPage({ landing: true })).resolves.toEqual({ userId: `u-${role}`, role })
    }
    // a suspension that has ended gives access back, as everywhere else
    state.authUserId = 'u-mod'
    state.viewerRow = { role: 'moderator', status: 'blocked', suspended_until: new Date(Date.now() - 60_000).toISOString(), deleted_at: null }
    await expect(requireStaffPage({ landing: true })).resolves.toEqual({ userId: 'u-mod', role: 'moderator' })
  })

  // ── Task 1007 AC2: the guard follows the switch ─────────────────────────────────────────────────────────────────────────────────
  const KEYED = ADMIN_PAGES.filter((p) => p.key !== 'page.dashboard')

  it.each(KEYED.map((p) => [p.key] as const))('[SEC-1007-PAGE-DENY] %s: a moderator needs the key, read at this call; a failed read, a user and an agent get notFound; an administrator needs no row', async (key) => {
    const { requireStaffPage } = await import('../staff')
    const guard = () => requireStaffPage({ page: key })

    // a moderator WITHOUT the key (another key on is no help): notFound, the key is the only read
    person('moderator')
    state.moderatorKeys = new Set(ADMIN_PAGE_KEYS.filter((k) => k !== key))
    expect(await outcome(guard), `${key} off`).toBe('notFound')
    expect(state.keyReads, 'the key is read at this call').toEqual([key])
    expect(state.reads, 'nothing else was read').toEqual([])

    // the same moderator WITH the key (switched on between the two calls: nothing is cached)
    state.keyReads = []
    state.moderatorKeys = new Set([key])
    await expect(guard()).resolves.toEqual({ userId: 'u-moderator', role: 'moderator' })
    expect(state.keyReads).toEqual([key])

    // a failed key read, and a read that throws, deny
    for (const failure of ['keyReadFails', 'keyReadThrows'] as const) {
      state[failure] = true
      expect(await outcome(guard), `${key}: ${failure}`).toBe('notFound')
      state[failure] = false
    }

    // an administrator holds every key: no row is read
    state.keyReads = []
    person('admin')
    state.moderatorKeys = new Set()
    await expect(guard()).resolves.toEqual({ userId: 'u-admin', role: 'admin' })
    expect(state.keyReads, 'an administrator needs no row').toEqual([])

    // a user and an agent
    for (const role of ['user', 'agent']) {
      person(role)
      state.moderatorKeys = new Set([key])
      expect(await outcome(guard), `${key}: ${role}`).toBe('notFound')
    }
    expect(state.keyReads, 'a user or an agent reads no key').toEqual([])

    // a guest is sent to sign-in
    state.authUserId = null
    expect(await outcome(guard), `${key}: guest`).toBe('redirect')
  })

  it('[SEC-1007-PAGE-DENY] adminOnly: a moderator gets notFound whatever is switched on; an administrator opens it', async () => {
    const { requireStaffPage } = await import('../staff')
    person('moderator')
    state.moderatorKeys = new Set(ADMIN_PAGE_KEYS)
    expect(await outcome(() => requireStaffPage({ adminOnly: true }))).toBe('notFound')
    expect(state.keyReads, 'an administrator-only page reads no key').toEqual([])
    person('admin')
    await expect(requireStaffPage({ adminOnly: true })).resolves.toEqual({ userId: 'u-admin', role: 'admin' })
    for (const role of ['user', 'agent']) { person(role); expect(await outcome(() => requireStaffPage({ adminOnly: true })), role).toBe('notFound') }
    state.authUserId = null
    expect(await outcome(() => requireStaffPage({ adminOnly: true }))).toBe('redirect')
  })

  it('[SEC-1007-PAGE-DENY] landing: the role only; a moderator with no key passes it (the page reads the keys itself); a user, an agent and a guest do not', async () => {
    const { requireStaffPage } = await import('../staff')
    person('moderator')
    state.moderatorKeys = new Set()
    await expect(requireStaffPage({ landing: true })).resolves.toEqual({ userId: 'u-moderator', role: 'moderator' })
    expect(state.keyReads, 'landing reads no key').toEqual([])
    for (const role of ['user', 'agent']) { person(role); expect(await outcome(() => requireStaffPage({ landing: true })), role).toBe('notFound') }
    state.authUserId = null
    expect(await outcome(() => requireStaffPage({ landing: true }))).toBe('redirect')
  })

  it('[SEC-1007-PAGE-DENY] the real pages: a moderator with every switch off gets notFound from each, with no read but the key', async () => {
    const files = pageFiles().filter((f) => relative(f) !== 'src/app/admin/page.tsx')
    const props = { params: Promise.resolve({ id: '00000000-0000-4000-8000-0000000000aa' }), searchParams: Promise.resolve({}) }
    const failures: string[] = []
    for (const file of files) {
      const mod = (await import(/* @vite-ignore */ file)) as { default: (p: unknown) => unknown; generateMetadata?: (p: unknown) => unknown }
      for (const [name, run] of [['page', () => mod.default(props)], ['generateMetadata', () => mod.generateMetadata?.(props)]] as const) {
        if (name === 'generateMetadata' && !mod.generateMetadata) continue
        state.reads = []; state.keyReads = []
        person('moderator')
        state.moderatorKeys = new Set()   // every page switch is off
        const result = await outcome(run)
        if (result !== 'notFound') failures.push(`${relative(file)} ${name} for a moderator with no key: ${result}`)
        if (state.reads.length) failures.push(`${relative(file)} ${name}: read ${state.reads.join(', ')}`)
        if (state.keyReads.length > 1) failures.push(`${relative(file)} ${name}: read the key ${state.keyReads.length} times`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  }, 240_000)

  beforeEach(() => {
    state.authUserId = null
    state.viewerRow = null
    state.viewerLookupFails = false
    state.reads = []
    state.moderatorKeys = new Set()
    state.keyReads = []
    state.keyReadFails = false
    state.keyReadThrows = false
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
})
