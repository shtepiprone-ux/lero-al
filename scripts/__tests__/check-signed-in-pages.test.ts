// @vitest-environment node
/**
 * Task 965 — scripts/check-signed-in-pages.mjs
 *
 * AC2 The walk fails on each defect it exists for: a status of 500, a page error, a hydration message, an unexpected redirect, a row with no session. Revision 1: every page is
 *     opened at 1280 and at 390, each width a row of its own; a hydration message at 390 only fails that row; a moderator with no session fails the run.
 * AC3 A page missing from the route table fails, and every role has a row for it.
 * AC5 The walk sends no write: a non-GET request is aborted and counted.
 * AC6 The walk's users and listing are removed after the run, when it passes and when it fails, and a clean-up that leaves rows fails the step.
 *
 * The browser, the sign-in fixtures and the cookie builder are handed to `runCheck`, so every case runs here without a server, a database or a Chromium.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

import { ROLES, ROUTES, WIDTHS, checkRouteTable, installReadOnlyGuard, judgeVisit, listPages, readModeratorPageKeys, resolveTemplate, runCheck } from '../check-signed-in-pages.mjs'
import { ADMIN_PAGES } from '../../src/lib/auth/adminPages'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const ACCESS = 'access-token-secret-0001'
const REFRESH = 'refresh-token-secret-0001'
const PASSWORD = 'password-secret-0001'
const COOKIE = 'cookie-secret-value-0001'

type Role = (typeof ROLES)[number]
interface Observed { status: number | null; finalPath: string | null; pageErrors: string[]; consoleErrors: string[]; navigationError: string | null; blockedWrites: number; blockedList?: string[] }
type Expectation = { kind: 'page' } | { kind: 'redirect'; to: string } | { kind: 'not-found' }
interface Row { page: string; path: string; expect: Record<Role, Expectation> }

const PARAMS = { userId: 'user-1', listingId: 'listing-1', listingSlug: 'zz-slug' }

/** What a correct build answers for this role and path, read from the route table itself. */
function correctObservation(role: Role, requested: string): Observed {
  const row = (ROUTES as Row[]).find(candidate => resolveTemplate(candidate.path, PARAMS) === requested)
  if (!row) throw new Error(`test: no row for ${requested}`)
  const expectation = row.expect[role]
  const base = { pageErrors: [], consoleErrors: [], navigationError: null, blockedWrites: 0 }
  if (expectation.kind === 'page') return { ...base, status: 200, finalPath: requested }
  if (expectation.kind === 'redirect') return { ...base, status: 200, finalPath: resolveTemplate(expectation.to, PARAMS) }
  return { ...base, status: 404, finalPath: requested }
}

interface Setup {
  /** Change what a visit observes (by role and requested path); defaults to the correct observation. */
  observe?: (role: Role, requested: string, correct: Observed, width: number) => Observed
  cleanupResult?: { verified: boolean; remaining: number; errors: string[] } | 'throws'
  makeUserFails?: Role
  launchFails?: boolean
  visitThrows?: boolean
  createRunThrows?: boolean
  /** The page keys the moderator's switches hold in `role_permissions` (Task 1007); every key of `ADMIN_PAGES` when absent: what the route table states. */
  moderatorKeys?: string[]
  /** The read of the switches fails. */
  readThrows?: boolean
}

const ALL_KEYS: string[] = ADMIN_PAGES.map(page => page.key)

function setup(options: Setup = {}) {
  const calls = { createRun: 0, makeUser: [] as string[], makeListing: [] as string[], cleanup: 0, cookies: 0, visited: [] as string[], opened: [] as string[], events: [] as string[] }
  const logs: string[] = []
  const createRun = () => {
    calls.createRun++
    if (options.createRunThrows) throw new Error('Refusing to run: set SECURITY_TEST_TARGET=development.')
    return {
      makeUser: async (tag: string, config: { role?: string } = {}) => {
        calls.makeUser.push(`${tag}:${config.role ?? 'user'}`)
        if (options.makeUserFails && tag.endsWith(options.makeUserFails)) throw new Error('fixture: could not sign in user')
        return { id: tag === 'walk_user' ? PARAMS.userId : `id-${tag}`, email: `${tag}@example.com`, password: PASSWORD, accessToken: ACCESS, refreshToken: REFRESH, client: {} }
      },
      makeListing: async (ownerId: string, status: string) => { calls.makeListing.push(`${ownerId}:${status}`); return { id: PARAMS.listingId, slug: PARAMS.listingSlug, status, expires_at: null } },
      cleanup: async () => {
        calls.cleanup++
        if (options.cleanupResult === 'throws') throw new Error('network down')
        return options.cleanupResult ?? { verified: true, remaining: 0, errors: [] }
      },
    }
  }
  const launchBrowser = async () => {
    if (options.launchFails) throw new Error('browser did not start')
    return {
      openSession: async (role: Role) => {
        calls.opened.push(role)
        return {
          visit: async (requested: string, width: number) => {
            calls.visited.push(`${role} ${requested} @${width}`)
            calls.events.push(`visit ${role} ${requested}`)
            if (options.visitThrows) throw new Error('page.goto: Timeout 60000ms exceeded.')
            const correct = correctObservation(role, requested)
            return options.observe ? options.observe(role, requested, correct, width) : correct
          },
          blocked: () => [] as string[],
          close: async () => {},
        }
      },
      close: async () => {},
    }
  }
  const buildCookies = async () => { calls.cookies++; return [{ name: 'sb-test-auth-token', value: COOKIE }] }
  const log = (line: string) => { logs.push(line) }
  const readModeratorPageKeys = async () => {
    calls.events.push('read')
    if (options.readThrows) throw new Error('role_permissions: the read failed')
    return options.moderatorKeys ?? ALL_KEYS
  }
  const run = () => runCheck({ createRun, launchBrowser, buildCookies, readModeratorPageKeys, routes: ROUTES, pages: listPages(REPO), log })
  return { calls, logs, run }
}

// ── AC3 ──────────────────────────────────────────────────────────────────────

describe('AC3 — the route table covers every signed-in page, for every role', () => {
  it('the real table matches the pages of the repository: 27 pages (22 admin, 2 cabinet, favorites, listings/create, listings/[slug]/edit)', () => {
    const pages = listPages(REPO)
    expect(pages).toHaveLength(27)
    expect(pages.filter(page => page.startsWith('src/app/[locale]/admin/'))).toHaveLength(22)
    expect(checkRouteTable(ROUTES, pages)).toEqual([])
    expect((ROUTES as Row[]).filter(row => row.path.includes('{')).map(row => row.path).sort()).toEqual([
      '/sq/admin/listings/{listingId}/preview', '/sq/admin/users/{userId}', '/sq/listings/{listingSlug}/edit',
    ])
  })

  it('every row states an expected result for each of admin, moderator, agent and user', () => {
    expect(ROLES).toEqual(['admin', 'moderator', 'agent', 'user'])
    for (const row of ROUTES as Row[]) {
      for (const role of ROLES) expect(['page', 'redirect', 'not-found'], `${row.path} / ${role}`).toContain(row.expect[role]?.kind)
    }
  })

  it('a page.tsx that is not in the table is named and fails', () => {
    const problems = checkRouteTable(ROUTES, [...listPages(REPO), 'src/app/[locale]/admin/brand-new/page.tsx'])
    expect(problems).toEqual(['page missing from the route table: src/app/[locale]/admin/brand-new/page.tsx'])
  })

  it('a row with no expectation for a role fails and names the role', () => {
    const rows = (ROUTES as Row[]).map((row, index) => (index === 0 ? { ...row, expect: { ...row.expect, moderator: undefined } } : row))
    const problems = checkRouteTable(rows, listPages(REPO))
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('moderator')
    expect(problems[0]).toContain((ROUTES as Row[])[0].path)
  })

  it('a row whose page no longer exists, and a page listed twice, fail', () => {
    const rows = [...(ROUTES as Row[]), { ...(ROUTES as Row[])[0], page: 'src/app/[locale]/admin/gone/page.tsx', path: '/sq/admin/gone' }, (ROUTES as Row[])[1]]
    const problems = checkRouteTable(rows, listPages(REPO))
    expect(problems.some(problem => problem.includes('src/app/[locale]/admin/gone/page.tsx') && problem.includes('no page'))).toBe(true)
    expect(problems.some(problem => problem.includes('twice'))).toBe(true)
  })

  it('the step fails on a missing page before any user is created', async () => {
    const env = setup()
    const result = await runCheck({
      createRun: () => { env.calls.createRun++; throw new Error('must not be reached') },
      launchBrowser: async () => { throw new Error('must not be reached') },
      buildCookies: async () => [],
      routes: ROUTES,
      pages: [...listPages(REPO), 'src/app/[locale]/admin/brand-new/page.tsx'],
      log: line => env.logs.push(line),
    })
    expect(result.ok).toBe(false)
    expect(env.calls.createRun).toBe(0)
    expect(env.logs.join('\n')).toContain('src/app/[locale]/admin/brand-new/page.tsx')
  })
})

// ── AC2 ──────────────────────────────────────────────────────────────────────

const GOOD: Observed = { status: 200, finalPath: '/sq/admin/reports', pageErrors: [], consoleErrors: [], navigationError: null, blockedWrites: 0 }
const REPORTS_ROW = (ROUTES as Row[]).find(row => row.path === '/sq/admin/reports') as Row
const judge = (observed: Partial<Observed>, role: Role = 'admin') => judgeVisit({ row: REPORTS_ROW, role, params: PARAMS, observed: { ...GOOD, ...observed } }) as string[]

describe('AC2 — each defect the walk exists for fails the row', () => {
  it('a clean page passes', () => {
    expect(judge({})).toEqual([])
  })

  it('a status of 500 or more fails, a 404 where the page was expected fails too', () => {
    expect(judge({ status: 500 }).join(' ')).toContain('status 500')
    expect(judge({ status: 503 }).join(' ')).toContain('status 503')
    expect(judge({ status: 404 }).join(' ')).toContain('status 404')
  })

  it('a page error fails and its text is kept', () => {
    const failures = judge({ pageErrors: ['TypeError: x is not a function'] })
    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('page error')
    expect(failures[0]).toContain('TypeError: x is not a function')
  })

  it.each([
    'Hydration failed because the server rendered HTML didn\'t match the client.',
    'Uncaught Error: Minified React error #418; visit https://react.dev/errors/418 for the full message',
    'Minified React error #423; visit https://react.dev/errors/423',
    'In HTML, <p> cannot be a descendant of <p>. This will cause a hydration error.',
    'Warning: Text content did not match. Server: "a" Client: "b"',
    'There was an error while hydrating but React was able to recover by instead client rendering the entire root.',
  ])('a hydration message in the console fails: %s', message => {
    const failures = judge({ consoleErrors: [message] })
    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('hydration')
  })

  it('a console error that is not hydration (a failed image) does not fail', () => {
    expect(judge({ consoleErrors: ['Failed to load resource: the server responded with a status of 404 ()'] })).toEqual([])
  })

  it('an unexpected redirect fails and names both paths: the sign-in page instead of the page', () => {
    const failures = judge({ finalPath: '/en/auth/login' })
    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('unexpected redirect')
    expect(failures[0]).toContain('/sq/admin/reports')
    expect(failures[0]).toContain('/en/auth/login')
  })

  it('a page where the role should have been sent away fails, and a redirect to the wrong place fails', () => {
    // a plain user must not see an admin page (the authorization regression this walk exists for)
    const asUser = judge({ finalPath: '/sq/admin/reports' }, 'user')
    expect(asUser.join(' ')).toContain('unexpected redirect')
    const away = judge({ finalPath: '/somewhere-else' }, 'user')
    expect(away.join(' ')).toContain('/somewhere-else')
    // the expected redirect passes
    expect(judge({ finalPath: '/sq' }, 'user')).toEqual([])
  })

  it('a navigation that threw fails', () => {
    expect(judge({ status: null, finalPath: null, navigationError: 'page.goto: Timeout 60000ms exceeded.' }).join(' ')).toContain('navigation')
  })

  it('the expected not-found passes only as a 404 on the requested path', () => {
    const permissions = (ROUTES as Row[]).find(row => row.path === '/sq/admin/permissions') as Row
    const ask = (observed: Partial<Observed>) => judgeVisit({ row: permissions, role: 'moderator', params: PARAMS, observed: { ...GOOD, finalPath: '/sq/admin/permissions', ...observed } }) as string[]
    expect(ask({ status: 404 })).toEqual([])
    expect(ask({ status: 200 }).join(' ')).toContain('status 200')
  })

  it('a row whose role has no session fails every row of that role and nothing is visited for it', async () => {
    const env = setup({ makeUserFails: 'agent' })
    const result = await env.run()
    expect(result.ok).toBe(false)
    expect(env.calls.opened).not.toContain('agent')
    const agentRows = (result.rows as { role: string; failures: string[] }[]).filter(row => row.role === 'agent')
    expect(agentRows).toHaveLength((ROUTES as Row[]).length * WIDTHS.length)
    for (const row of agentRows) expect(row.failures.join(' ')).toContain('no session')
    // the other roles were still walked, and the clean-up ran
    expect(env.calls.opened.sort()).toEqual(['admin', 'moderator', 'user'])
    expect(env.calls.cleanup).toBe(1)
  })

  // Review 1 F2: a moderator with no session leaves the agent's listing in place, so no other row fails for it. The run fails only because the no-session rows themselves count as failed.
  it.each(ROLES)('role %s with no session fails the run on its own rows, whatever the other roles do', async role => {
    const env = setup({ makeUserFails: role })
    const result = await env.run()
    expect(result.ok).toBe(false)
    const rows = result.rows as { role: string; ok: boolean; failures: string[] }[]
    const own = rows.filter(row => row.role === role)
    expect(own).toHaveLength((ROUTES as Row[]).length * WIDTHS.length)
    for (const row of own) {
      expect(row.ok).toBe(false)
      expect(row.failures.join(' ')).toContain(`no session for ${role}`)
    }
    // an admin or a moderator owns nothing the other roles' pages need, so every other row still passes: the run fails on the no-session rows alone
    if (role === 'admin' || role === 'moderator') for (const row of rows.filter(candidate => candidate.role !== role)) expect(row.ok).toBe(true)
    expect(env.logs.join('\n')).toContain(`${role}: ${(ROUTES as Row[]).length * WIDTHS.length} rows, 0 passed`)
  })

  it('a clean walk passes with one row per page, role and width, counted per role', async () => {
    const env = setup()
    const result = await env.run()
    expect(result.ok).toBe(true)
    expect(WIDTHS).toEqual([1280, 390])
    expect(result.rows).toHaveLength((ROUTES as Row[]).length * 4 * 2)
    expect(result.rows).toHaveLength(216)
    const perRole = (ROUTES as Row[]).length * 2
    for (const role of ROLES) expect(env.logs.join('\n')).toContain(`${role}: ${perRole} rows, ${perRole} passed`)
    expect(env.logs).toContain('signed-in pages: 216 rows passed')
    // every page is opened at both widths, 1280 first, then 390
    expect(env.calls.visited.filter(visit => visit.startsWith('admin /sq/admin/reports '))).toEqual(['admin /sq/admin/reports @1280', 'admin /sq/admin/reports @390'])
    expect(env.calls.makeUser).toEqual(['walk_admin:admin', 'walk_moderator:moderator', 'walk_agent:agent', 'walk_user:user'])
    expect(env.calls.makeListing).toEqual(['id-walk_agent:active'])
  })

  it('a hydration message on one row fails the run and the row is named in the log', async () => {
    const env = setup({
      observe: (role, requested, correct) => (role === 'moderator' && requested === '/sq/admin/support' ? { ...correct, consoleErrors: ['Minified React error #418; visit https://react.dev/errors/418'] } : correct),
    })
    const result = await env.run()
    expect(result.ok).toBe(false)
    const failing = env.logs.filter(line => line.startsWith('FAIL'))
    expect(failing).toHaveLength(2) // the row at each of the two widths
    for (const line of failing) {
      expect(line).toContain('moderator')
      expect(line).toContain('/sq/admin/support')
    }
  })

  // Review 1 F4: a first render that depends on the width (cards and sheets below 640) is only seen at the phone width.
  it('a hydration message at 390 only fails exactly that row: the 1280 row of the same page passes', async () => {
    const env = setup({
      observe: (role, requested, correct, width) => (role === 'admin' && requested === '/sq/admin/reports' && width === 390
        ? { ...correct, consoleErrors: ['Minified React error #418; visit https://react.dev/errors/418'] }
        : correct),
    })
    const result = await env.run()
    expect(result.ok).toBe(false)
    const rows = result.rows as { role: string; path: string; width: number; ok: boolean; failures: string[] }[]
    const failing = rows.filter(row => !row.ok)
    expect(failing).toHaveLength(1)
    expect(failing[0]).toMatchObject({ role: 'admin', path: '/sq/admin/reports', width: 390 })
    expect(failing[0].failures.join(' ')).toContain('hydration')
    expect(rows.find(row => row.role === 'admin' && row.path === '/sq/admin/reports' && row.width === 1280)?.ok).toBe(true)
    const lines = env.logs.filter(line => line.startsWith('FAIL'))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('admin')
    expect(lines[0]).toContain('/sq/admin/reports')
    expect(lines[0]).toContain('390')
    expect(env.logs.join('\n')).toContain(`admin: ${(ROUTES as Row[]).length * 2} rows, ${(ROUTES as Row[]).length * 2 - 1} passed`)
  })

  it('a 500 and an unexpected redirect at 390 each fail only their own row', async () => {
    const env = setup({
      observe: (role, requested, correct, width) => {
        if (role === 'user' && requested === '/sq/favorites' && width === 390) return { ...correct, status: 500 }
        if (role === 'agent' && requested === '/sq/cabinet' && width === 390) return { ...correct, finalPath: '/en/auth/login' }
        return correct
      },
    })
    const result = await env.run()
    expect(result.ok).toBe(false)
    const rows = result.rows as { role: string; path: string; width: number; ok: boolean }[]
    expect(rows.filter(row => !row.ok).map(row => `${row.role} ${row.path} @${row.width}`).sort()).toEqual(['agent /sq/cabinet @390', 'user /sq/favorites @390'])
  })

  it('no token, password or cookie value reaches the log', async () => {
    const env = setup({ observe: (_role, _requested, correct) => ({ ...correct, pageErrors: [`failed with access_token=${ACCESS} and ${REFRESH} and ${PASSWORD} and ${COOKIE}`] }) })
    await env.run()
    const text = env.logs.join('\n')
    for (const secret of [ACCESS, REFRESH, PASSWORD, COOKIE]) expect(text).not.toContain(secret)
  })
})

// ── AC5 ──────────────────────────────────────────────────────────────────────

// A fake query token, built from parts so the secret scan does not read a key in the source (as Task 970 built its fixture).
const QUERY_TOKEN = ['abcd', 'efgh', '12345'].join('')

function fakeContext() {
  const state: { handler?: (route: unknown) => Promise<void> | void } = {}
  const context = { route: async (_pattern: string, handler: (route: unknown) => Promise<void> | void) => { state.handler = handler } }
  const send = async (method: string, url = `http://127.0.0.1:3000/admin/reports?token=${QUERY_TOKEN}`) => {
    const route = { request: () => ({ method: () => method, url: () => url }), abort: vi.fn(async () => {}), continue: vi.fn(async () => {}) }
    await state.handler?.(route)
    return route
  }
  return { context, send }
}

describe('AC5 — the walk sends no write', () => {
  it.each(['GET', 'HEAD', 'OPTIONS'])('%s goes through', async method => {
    const { context, send } = fakeContext()
    const guard = await installReadOnlyGuard(context)
    const route = await send(method)
    expect(route.continue).toHaveBeenCalledTimes(1)
    expect(route.abort).not.toHaveBeenCalled()
    expect(guard.blocked()).toEqual([])
  })

  it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'post'])('%s is aborted and counted', async method => {
    const { context, send } = fakeContext()
    const guard = await installReadOnlyGuard(context)
    const route = await send(method)
    expect(route.abort).toHaveBeenCalledTimes(1)
    expect(route.continue).not.toHaveBeenCalled()
    expect(guard.blocked()).toHaveLength(1)
  })

  it('the count grows with each write, and a query string never reaches the list', async () => {
    const { context, send } = fakeContext()
    const guard = await installReadOnlyGuard(context)
    await send('POST')
    await send('DELETE', `http://127.0.0.1:3000/api/x?access_token=${QUERY_TOKEN}`)
    expect(guard.blocked()).toHaveLength(2)
    expect(guard.blocked().join(' ')).not.toContain(QUERY_TOKEN)
  })

  it('the walk reports the writes it aborted, by method and path', async () => {
    const env = setup({ observe: (role, requested, correct) => (role === 'admin' && requested === '/sq/admin' ? { ...correct, blockedWrites: 2, blockedList: ['POST /api/presence', 'POST /api/presence'] } : correct) })
    const result = await env.run()
    expect(result.ok).toBe(true)
    expect(result.blockedWrites).toBe(4)
    expect(env.logs.join('\n')).toContain('4 write requests aborted')
    expect(env.logs).toContain('  POST /api/presence x4')
  })
})

// ── AC6 ──────────────────────────────────────────────────────────────────────

describe('AC6 — the walk removes what it created, pass or fail', () => {
  it('cleans up after a passing walk and prints the result', async () => {
    const env = setup()
    const result = await env.run()
    expect(result.ok).toBe(true)
    expect(env.calls.cleanup).toBe(1)
    expect(env.logs.join('\n')).toContain('clean-up: verified, 0 rows left')
  })

  it('cleans up after a walk with a failing row', async () => {
    const env = setup({ observe: (_role, _requested, correct) => ({ ...correct, status: 500 }) })
    const result = await env.run()
    expect(result.ok).toBe(false)
    expect(env.calls.cleanup).toBe(1)
  })

  it('cleans up when a visit throws', async () => {
    const env = setup({ visitThrows: true })
    const result = await env.run()
    expect(result.ok).toBe(false)
    expect(env.calls.cleanup).toBe(1)
  })

  it('cleans up when the browser does not start', async () => {
    const env = setup({ launchFails: true })
    const result = await env.run()
    expect(result.ok).toBe(false)
    expect(env.calls.makeUser).toHaveLength(4)
    expect(env.calls.cleanup).toBe(1)
    expect(env.logs.join('\n')).toContain('browser did not start')
  })

  it('cleans up when one user could not be signed in (the others were created)', async () => {
    const env = setup({ makeUserFails: 'moderator' })
    await env.run()
    expect(env.calls.cleanup).toBe(1)
  })

  it('fails the step when the clean-up leaves rows, even though every row passed', async () => {
    const env = setup({ cleanupResult: { verified: false, remaining: 2, errors: [] } })
    const result = await env.run()
    expect(result.rows.every((row: { failures: string[] }) => row.failures.length === 0)).toBe(true)
    expect(result.ok).toBe(false)
    expect(env.logs.join('\n')).toContain('clean-up: NOT verified, 2 rows left')
  })

  it('fails the step when the clean-up could not verify (an error is unknown, never zero)', async () => {
    const env = setup({ cleanupResult: { verified: false, remaining: 0, errors: ['verify users: timeout'] } })
    const result = await env.run()
    expect(result.ok).toBe(false)
    expect(env.logs.join('\n')).toContain('verify users: timeout')
  })

  it('fails the step when the clean-up itself throws', async () => {
    const env = setup({ cleanupResult: 'throws' })
    const result = await env.run()
    expect(result.ok).toBe(false)
    expect(env.logs.join('\n')).toContain('clean-up: NOT verified')
  })

  it('does not run against another target: a refused run creates nothing and fails', async () => {
    const env = setup({ createRunThrows: true })
    const result = await env.run()
    expect(result.ok).toBe(false)
    expect(env.calls.makeUser).toEqual([])
    expect(env.logs.join('\n')).toContain('SECURITY_TEST_TARGET=development')
  })
})

// ── Task 1007 (Review 3, F3): a moderator opens only the pages switched on ───────

type Seen = (role: Role, requested: string, correct: Observed) => Observed
type WalkRow = { role: string; path: string; width: number; ok: boolean; failures: string[] }

/** The row's path as the walk logs it (`{userId}` unresolved), and as the browser asks for it. */
const templateOf = (route: string): string => ((ROUTES as Row[]).find(row => row.page === `src/app/[locale]${route}/page.tsx`) as Row).path
const requestedOf = (route: string): string => resolveTemplate(templateOf(route), PARAMS)
/** Every address the keys of `ADMIN_PAGES` open, as the walk requests it. */
const KEYED = new Set(ADMIN_PAGES.flatMap(page => page.paths.map(requestedOf)))

/**
 * What a correct build answers a moderator when `allowed` are the page keys switched on: a keyed page that is off is the not-found page; `/admin` stays the page, or is the redirect
 * `landing` when the dashboard is off and another page is on. Written here from the Task 1007 rules, not from the walk's own function.
 */
function moderatorSees(allowed: string[], landing: string | null): Seen {
  const open = new Set(ADMIN_PAGES.filter(page => allowed.includes(page.key)).flatMap(page => page.paths.map(requestedOf)))
  return (role, requested, correct) => {
    if (role !== 'moderator') return correct
    if (requested === '/sq/admin') return landing ? { ...correct, status: 200, finalPath: landing } : correct
    return KEYED.has(requested) && !open.has(requested) ? { ...correct, status: 404, finalPath: requested } : correct
  }
}

const failedRows = (rows: unknown) => (rows as WalkRow[]).filter(row => !row.ok)
const label = (row: WalkRow) => `${row.role} ${row.path} @${row.width}`

describe('Task 1007 — the moderator\'s expected result follows the page switches', () => {
  it('the route table states the pages as they are with the switch on, and Footer is for an administrator only (O1007-1)', () => {
    const footer = (ROUTES as Row[]).find(row => row.path === '/sq/admin/footer') as Row
    expect(footer.expect.moderator).toEqual({ kind: 'not-found' })
    expect(footer.expect.admin).toEqual({ kind: 'page' })
    for (const page of ADMIN_PAGES) expect((ROUTES as Row[]).filter(row => page.paths.some(route => row.page === `src/app/[locale]${route}/page.tsx`)), page.key).toHaveLength(page.paths.length)
  })

  it('Footer is not found for a moderator: the not-found page passes, a 200 fails', async () => {
    const passing = await setup().run()
    expect(passing.ok).toBe(true)
    const env = setup({ observe: (role, requested, correct) => (role === 'moderator' && requested === '/sq/admin/footer' ? { ...correct, status: 200, finalPath: requested } : correct) })
    const result = await env.run()
    expect(result.ok).toBe(false)
    expect(failedRows(result.rows).map(label).sort()).toEqual(['moderator /sq/admin/footer @1280', 'moderator /sq/admin/footer @390'])
    expect(failedRows(result.rows)[0].failures.join(' ')).toContain('status 200 where the not-found page was expected')
  })

  it('every switch on: the walk passes with the pages as the table states them', async () => {
    const result = await setup({ moderatorKeys: ALL_KEYS, observe: moderatorSees(ALL_KEYS, null) }).run()
    expect(result.ok).toBe(true)
  })

  const SWITCHABLE = ADMIN_PAGES.filter(page => page.key !== 'page.dashboard')

  it.each(SWITCHABLE.map(page => [page.key, page] as const))('%s switched off: every address of the key is the not-found page, and a 200 on any of them fails', async (_key, page) => {
    const keys = ALL_KEYS.filter(key => key !== page.key)
    const asked = page.paths.map(templateOf)
    expect(asked.length).toBeGreaterThan(0)
    const right = await setup({ moderatorKeys: keys, observe: moderatorSees(keys, null) }).run()
    expect(right.ok, failedRows(right.rows).map(label).join(', ')).toBe(true)
    // a build that still answers the page (the table's expectation of today) fails exactly the rows of this key, at both widths
    const wrong = await setup({ moderatorKeys: keys }).run()
    expect(wrong.ok).toBe(false)
    expect(failedRows(wrong.rows).map(label).sort()).toEqual(asked.flatMap(requested => WIDTHS.map(width => `moderator ${requested} @${width}`)).sort())
    expect(failedRows(wrong.rows)[0].failures.join(' ')).toContain('where the not-found page was expected')
  })

  it('a key switched on keeps the page: the page passes, and the not-found page on it fails', async () => {
    const keys = ['page.users']
    const right = await setup({ moderatorKeys: keys, observe: moderatorSees(keys, '/sq/admin/users') }).run()
    expect(right.ok, failedRows(right.rows).map(label).join(', ')).toBe(true)
    const hidden = await setup({ moderatorKeys: keys, observe: (role, requested, correct) => (role === 'moderator' && requested === '/sq/admin/users' ? { ...correct, status: 404, finalPath: requested } : moderatorSees(keys, '/sq/admin/users')(role, requested, correct)) }).run()
    expect(hidden.ok).toBe(false)
    expect(failedRows(hidden.rows).map(label).sort()).toEqual(['moderator /sq/admin/users @1280', 'moderator /sq/admin/users @390'])
  })

  describe('the landing /admin', () => {
    const observeLanding = (keys: string[], landing: string | null, at: Seen): Seen => (role, requested, correct) => (role === 'moderator' && requested === '/sq/admin' ? at(role, requested, correct) : moderatorSees(keys, landing)(role, requested, correct))
    const dashboardRows = (rows: unknown) => failedRows(rows).map(label).sort()

    it('with page.dashboard on the moderator gets the page, and a redirect to another page fails', async () => {
      const right = await setup({ moderatorKeys: ALL_KEYS, observe: moderatorSees(ALL_KEYS, null) }).run()
      expect(right.ok).toBe(true)
      const wrong = await setup({ moderatorKeys: ALL_KEYS, observe: observeLanding(ALL_KEYS, null, (_r, _q, correct) => ({ ...correct, finalPath: '/sq/admin/listings' })) }).run()
      expect(dashboardRows(wrong.rows)).toEqual(['moderator /sq/admin @1280', 'moderator /sq/admin @390'])
    })

    it('with page.dashboard off and others on the moderator is sent to the first path of the first key in ADMIN_PAGES order, never to /admin', async () => {
      const keys = ['page.reports', 'page.support']   // the database's order is not the sidebar's: support comes first
      const right = await setup({ moderatorKeys: keys, observe: moderatorSees(keys, '/sq/admin/support') }).run()
      expect(right.ok, failedRows(right.rows).map(label).join(', ')).toBe(true)
      for (const wrongTarget of ['/sq/admin/reports', '/sq/admin']) {
        const wrong = await setup({ moderatorKeys: keys, observe: observeLanding(keys, '/sq/admin/support', (_r, _q, correct) => ({ ...correct, status: 200, finalPath: wrongTarget })) }).run()
        expect(dashboardRows(wrong.rows), wrongTarget).toEqual(['moderator /sq/admin @1280', 'moderator /sq/admin @390'])
      }
      // the first key's FIRST path: page.inquiries_support opens /admin/inquiries/support, not the /admin/inquiries redirect
      const inquiries = ['page.inquiries_support']
      const first = await setup({ moderatorKeys: inquiries, observe: moderatorSees(inquiries, '/sq/admin/inquiries/support') }).run()
      expect(first.ok, failedRows(first.rows).map(label).join(', ')).toBe(true)
    })

    it('with no page on the moderator gets the page /admin (the no-pages state), every other page is not found, and a redirect fails', async () => {
      const right = await setup({ moderatorKeys: [], observe: moderatorSees([], null) }).run()
      expect(right.ok, failedRows(right.rows).map(label).join(', ')).toBe(true)
      const wrong = await setup({ moderatorKeys: [], observe: observeLanding([], null, (_r, _q, correct) => ({ ...correct, status: 200, finalPath: '/sq/admin/listings' })) }).run()
      expect(dashboardRows(wrong.rows)).toEqual(['moderator /sq/admin @1280', 'moderator /sq/admin @390'])
    })
  })

  it('the switches are read just before each moderator visit of a page with a key, and not for the other roles or the other pages', async () => {
    const env = setup()
    await env.run()
    const events = env.calls.events
    const moderatorVisits = events.map((event, index) => ({ event, index })).filter(({ event }) => event.startsWith('visit moderator '))
    expect(moderatorVisits).toHaveLength((ROUTES as Row[]).length * WIDTHS.length)
    const keyedVisits = moderatorVisits.filter(({ event }) => KEYED.has(event.replace('visit moderator ', '')))
    expect(keyedVisits.length).toBeGreaterThan(0)
    for (const { event, index } of keyedVisits) expect(events[index - 1], event).toBe('read')
    expect(events.filter(event => event === 'read')).toHaveLength(keyedVisits.length)
    // no read happens while another role is walked
    for (const [index, event] of events.entries()) if (event.startsWith('visit ') && !event.startsWith('visit moderator ')) expect(events[index - 1], event).not.toBe('read')
  })

  it('a failed read of the switches fails the moderator\'s rows of the pages with a key, and never passes them as on', async () => {
    const env = setup({ readThrows: true })
    const result = await env.run()
    expect(result.ok).toBe(false)
    const failed = failedRows(result.rows)
    expect(failed.length).toBeGreaterThan(0)
    for (const row of failed) {
      expect(row.role).toBe('moderator')
      expect(row.failures.join(' ')).toContain('the visit could not be made')
      expect(row.failures.join(' ')).toContain('the read failed')
    }
    expect(env.calls.cleanup).toBe(1)
  })

  it('the walk reads the switches of the moderator role for the page keys of ADMIN_PAGES, and writes nothing', async () => {
    const used: string[] = []
    const chain: Record<string, unknown> = {}
    const answer = { data: [{ permission_key: 'page.users' }, { permission_key: 'page.reports' }], error: null }
    for (const method of ['from', 'select', 'eq', 'in']) chain[method] = (...args: unknown[]) => { used.push(`${method} ${JSON.stringify(args)}`); return method === 'in' ? Promise.resolve(answer) : chain }
    const keys = await readModeratorPageKeys({ admin: chain })
    expect(keys).toEqual(['page.users', 'page.reports'])
    expect(used).toEqual([
      'from ["role_permissions"]',
      'select ["permission_key"]',
      'eq ["role","moderator"]',
      'eq ["allowed",true]',
      `in ${JSON.stringify(['permission_key', ALL_KEYS])}`,
    ])
    // the table is read through these four calls only: any other method on the client (insert, upsert, update, delete) is not defined on the double and would throw
    await expect(readModeratorPageKeys({ admin: { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ in: async () => ({ data: null, error: { code: '42501' } }) }) }) }) }) } })).rejects.toThrow('could not be read')
  })
})
