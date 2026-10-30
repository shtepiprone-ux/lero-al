// @vitest-environment node
/**
 * Security (Task 923 R139, D85, D86): a staff viewer who opens the admin page of a user who is missing or deleted lands on the Users list with a notice, never on the 404 page.
 *  - SEC-X-SRV-ADMIN-USER-GONE: no `users` row  -> redirect('/admin/users?notice=user_gone'), nothing else of that id is read.
 *  - SEC-X-SRV-ADMIN-USER-DELETED: a row with `deleted_at` -> the same redirect, none of the row's data is read further or returned.
 *  - SEC-X-SRV-ADMIN-USER-QUERY-ERROR: the lookup fails -> the same redirect, no account data shown.
 *  - SEC-X-SRV-ADMIN-USER-PRESENT: an existing, undeleted account still renders its profile (preservation).
 * The real page runs. The staff guard (`requireStaffPage` resolves: with the real one a page-render test fails outside a request scope), the admin client, `requireViewer`,
 * `hasPermission`, `next-intl/server` and `next/navigation` are doubles; the guard's own order is proved by staffPage.security.test.ts (SEC-X-SRV-ADMINPAGE-GUARD).
 * The `next/navigation` double throws like the real one, so a page that calls `notFound()` or `redirect()` is told apart by what was called. Every id and row is synthetic.
 * Task 923 R149 (F21): the `users` double answers as PostgREST does (`single()` on no row is the PGRST116 error, `maybeSingle()` is no row and no error), so an absent account that
 * the page logs as a failed query is caught: GONE asserts nothing is logged, QUERY-ERROR asserts a real failure still is.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Failure = { message: string }

/** what PostgREST answers to `.single()` when no row matches (measured on the approved project, Task 923 Review 56: code PGRST116) */
const PGRST116 = { code: 'PGRST116', details: 'The result contains 0 rows', hint: null, message: 'Cannot coerce the result to a single JSON object' }

const state = vi.hoisted(() => ({
  /** the account row the lookup finds, or null when there is none */
  row: null as Record<string, unknown> | null,
  /** the failure the lookup answers with, or null */
  failure: null as { message: string } | null,
  /** every table the page asked the admin client for */
  tables: [] as string[],
  /** every Auth admin lookup */
  authLookups: [] as string[],
  /** the city and village list the `locations` lookup answers (Task 923 R175) */
  cities: [] as Record<string, unknown>[],
  /** the region list the `locations` lookup answers (Task 923 R175) */
  regions: [] as Record<string, unknown>[],
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

class Redirected extends Error {
  constructor(readonly url: string) { super(`REDIRECT ${url}`) }
}
class NotFound extends Error {
  constructor() { super('NOT_FOUND') }
}

vi.mock('next/navigation', () => ({
  redirect: (url: string) => { state.redirect(url); throw new Redirected(url) },
  notFound: () => { state.notFound(); throw new NotFound() },
}))
// only the guard is replaced; the rest of the module is imported by the profile component's admin actions
vi.mock('@/lib/auth/staff', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/auth/staff')>()),
  requireStaffPage: async () => ({ userId: 'u-admin', role: 'admin' }),
}))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: 'u-admin', role: 'admin' }) }))
vi.mock('@/lib/auth/permissions', () => ({ hasPermission: async () => true }))
vi.mock('next-intl/server', () => ({ getLocale: async () => 'en', getTranslations: async () => (key: string) => key }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      state.tables.push(table)
      // A narrow chainable stand-in: only the calls the page makes are supported, anything else throws.
      // The `users` lookup answers as PostgREST does: `single()` answers the failure if one is set, else the row, else the no-row error; `maybeSingle()` answers the failure if one is set, else the row or null with no error.
      let lookup: 'single' | 'maybeSingle' | null = null
      const usersAnswer = () => {
        if (lookup === null) throw new Error('the users lookup ended without single() or maybeSingle()')
        if (state.failure) return { data: null, error: state.failure }
        if (state.row) return { data: state.row, error: null }
        return lookup === 'single' ? { data: null, error: PGRST116 } : { data: null, error: null }
      }
      const chain: Record<string, unknown> = {}
      const supported = table === 'users' ? ['select', 'eq'] : ['select', 'eq', 'in', 'order', 'limit']
      for (const method of supported) chain[method] = () => chain
      // Task 923 R175: the city list is asked with `in('type', …)`, the region list with `eq('type', 'region')`
      let locationsList: Record<string, unknown>[] = []
      if (table === 'locations') {
        chain.in = () => { locationsList = state.cities; return chain }
        chain.eq = () => { locationsList = state.regions; return chain }
      }
      if (table === 'users') {
        chain.single = () => { lookup = 'single'; return chain }
        chain.maybeSingle = () => { lookup = 'maybeSingle'; return chain }
      }
      chain.then = (resolve: (value: unknown) => void) => resolve(
        table === 'users' ? usersAnswer() : table === 'locations' ? { data: locationsList, error: null } : { data: [], error: null },
      )
      return new Proxy(chain, {
        get: (target, key) => {
          if (typeof key === 'string' && !(key in target)) throw new Error(`unsupported admin client call ${table}.${key}`)
          return target[key as string]
        },
      })
    },
    auth: { admin: { getUserById: async (id: string) => { state.authLookups.push(id); return { data: { user: null } } } } },
  }),
}))

const ID = '00000000-0000-4000-8000-0000000000bb'
const USER_GONE = '/admin/users?notice=user_gone'

/** a synthetic account row, as `select('*')` returns it */
const row = (over: Record<string, unknown> = {}) => ({
  id: ID, name: 'Zzsynth', last_name: 'Person', phone: '+355000000001', role: 'user', status: 'active',
  suspended_until: null, deleted_at: null, ...over,
})

async function openPage() {
  const { default: AdminUserProfilePage } = await import('../[id]/page')
  try {
    const element = await AdminUserProfilePage({ params: Promise.resolve({ id: ID }) })
    return { kind: 'returned' as const, element }
  } catch (e) {
    if (e instanceof Redirected) return { kind: 'redirect' as const, url: e.url }
    if (e instanceof NotFound) return { kind: 'notFound' as const }
    throw e
  }
}

/** the page may read the users row, the two location lists and nothing else of the account; the three reads below are the account's change log, status history and Auth record */
const profileReads = () => [
  ...state.tables.filter(t => t === 'user_change_log' || t === 'user_status_history'),
  ...state.authLookups,
]

beforeEach(() => {
  state.row = null
  state.failure = null
  state.tables = []
  state.authLookups = []
  state.cities = []
  state.regions = []
  state.redirect.mockClear()
  state.notFound.mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(console.error).mockClear()   // a spy that already exists keeps its calls: each case counts only its own
})

describe('AdminUserProfilePage', () => {
  it('[SEC-X-SRV-ADMIN-USER-GONE] a missing account opens the Users list', async () => {
    state.row = null
    const outcome = await openPage()
    expect(outcome, 'the list, not the 404 page').toEqual({ kind: 'redirect', url: USER_GONE })
    expect(state.redirect).toHaveBeenCalledTimes(1)
    expect(state.redirect).toHaveBeenCalledWith(USER_GONE)
    expect(state.notFound).not.toHaveBeenCalled()
    expect(profileReads()).toEqual([])
    expect(console.error, 'an absent account is not a failed query').not.toHaveBeenCalled()
  })

  it('[SEC-X-SRV-ADMIN-USER-DELETED] a deleted account opens the Users list', async () => {
    state.row = row({ deleted_at: '2026-10-01T00:00:00Z' })
    const outcome = await openPage()
    expect(outcome).toEqual({ kind: 'redirect', url: USER_GONE })
    expect(state.redirect).toHaveBeenCalledTimes(1)
    expect(state.redirect).toHaveBeenCalledWith(USER_GONE)
    expect(state.notFound).not.toHaveBeenCalled()
    expect(profileReads()).toEqual([])
    expect(JSON.stringify(outcome)).not.toContain('Zzsynth')
    expect(JSON.stringify(outcome)).not.toContain('+355000000001')
  })

  it('[SEC-X-SRV-ADMIN-USER-QUERY-ERROR] a failed lookup opens the Users list', async () => {
    const failure = { message: 'down' } satisfies Failure
    state.failure = failure
    const outcome = await openPage()
    expect(outcome).toEqual({ kind: 'redirect', url: USER_GONE })
    expect(state.redirect).toHaveBeenCalledTimes(1)
    expect(state.notFound).not.toHaveBeenCalled()
    expect(profileReads()).toEqual([])
    expect(console.error, 'a failed lookup is still logged').toHaveBeenCalledTimes(1)
    expect(console.error, 'a failed lookup is still logged').toHaveBeenCalledWith('AdminUserProfilePage: user query failed', expect.objectContaining({ error: failure, id: ID }))
  })

  it('[SEC-X-SRV-ADMIN-USER-PRESENT] an existing account still renders its profile', async () => {
    const present = row({ location_id: 151 })
    state.row = present
    state.cities = [
      { id: 1, name_al: 'Tirana', region_id: 1 },
      { id: 151, name_al: 'Adriatik - Durrës', region_id: null },
      { id: 9, name_al: 'Zzsynth', region_id: 7 },
    ]
    state.regions = [{ id: 1, name_al: 'Qarku i Tiranës' }]
    const outcome = await openPage()
    expect(outcome.kind).toBe('returned')
    expect(state.redirect).not.toHaveBeenCalled()
    expect(state.notFound).not.toHaveBeenCalled()
    const { AdminUserProfile } = await import('@/components/admin/AdminUserProfile')
    const frame = (outcome as { kind: 'returned'; element: { props: { children: { type: unknown; props: { user: unknown } } } } }).element
    expect(frame.props.children.type).toBe(AdminUserProfile)
    expect(frame.props.children.props.user).toEqual({ ...present, location: { id: 151, name_al: 'Adriatik - Durrës', region_id: null, parent: null } })
  })
})
