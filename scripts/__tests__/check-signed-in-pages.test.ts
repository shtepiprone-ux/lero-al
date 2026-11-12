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

import { ROLES, ROUTES, WIDTHS, checkRouteTable, installReadOnlyGuard, judgeVisit, listPages, resolveTemplate, runCheck } from '../check-signed-in-pages.mjs'

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
}

function setup(options: Setup = {}) {
  const calls = { createRun: 0, makeUser: [] as string[], makeListing: [] as string[], cleanup: 0, cookies: 0, visited: [] as string[], opened: [] as string[] }
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
  const run = () => runCheck({ createRun, launchBrowser, buildCookies, routes: ROUTES, pages: listPages(REPO), log })
  return { calls, logs, run }
}

// ── AC3 ──────────────────────────────────────────────────────────────────────

describe('AC3 — the route table covers every signed-in page, for every role', () => {
  it('the real table matches the pages of the repository: 27 pages (22 admin, 2 cabinet, favorites, listings/create, listings/[slug]/edit)', () => {
    const pages = listPages(REPO)
    expect(pages).toHaveLength(27)
    expect(pages.filter(page => page.startsWith('src/app/admin/'))).toHaveLength(22)
    expect(checkRouteTable(ROUTES, pages)).toEqual([])
    expect((ROUTES as Row[]).filter(row => row.path.includes('{')).map(row => row.path).sort()).toEqual([
      '/admin/listings/{listingId}/preview', '/admin/users/{userId}', '/sq/listings/{listingSlug}/edit',
    ])
  })

  it('every row states an expected result for each of admin, moderator, agent and user', () => {
    expect(ROLES).toEqual(['admin', 'moderator', 'agent', 'user'])
    for (const row of ROUTES as Row[]) {
      for (const role of ROLES) expect(['page', 'redirect', 'not-found'], `${row.path} / ${role}`).toContain(row.expect[role]?.kind)
    }
  })

  it('a page.tsx that is not in the table is named and fails', () => {
    const problems = checkRouteTable(ROUTES, [...listPages(REPO), 'src/app/admin/brand-new/page.tsx'])
    expect(problems).toEqual(['page missing from the route table: src/app/admin/brand-new/page.tsx'])
  })

  it('a row with no expectation for a role fails and names the role', () => {
    const rows = (ROUTES as Row[]).map((row, index) => (index === 0 ? { ...row, expect: { ...row.expect, moderator: undefined } } : row))
    const problems = checkRouteTable(rows, listPages(REPO))
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('moderator')
    expect(problems[0]).toContain((ROUTES as Row[])[0].path)
  })

  it('a row whose page no longer exists, and a page listed twice, fail', () => {
    const rows = [...(ROUTES as Row[]), { ...(ROUTES as Row[])[0], page: 'src/app/admin/gone/page.tsx', path: '/admin/gone' }, (ROUTES as Row[])[1]]
    const problems = checkRouteTable(rows, listPages(REPO))
    expect(problems.some(problem => problem.includes('src/app/admin/gone/page.tsx') && problem.includes('no page'))).toBe(true)
    expect(problems.some(problem => problem.includes('twice'))).toBe(true)
  })

  it('the step fails on a missing page before any user is created', async () => {
    const env = setup()
    const result = await runCheck({
      createRun: () => { env.calls.createRun++; throw new Error('must not be reached') },
      launchBrowser: async () => { throw new Error('must not be reached') },
      buildCookies: async () => [],
      routes: ROUTES,
      pages: [...listPages(REPO), 'src/app/admin/brand-new/page.tsx'],
      log: line => env.logs.push(line),
    })
    expect(result.ok).toBe(false)
    expect(env.calls.createRun).toBe(0)
    expect(env.logs.join('\n')).toContain('src/app/admin/brand-new/page.tsx')
  })
})

// ── AC2 ──────────────────────────────────────────────────────────────────────

const GOOD: Observed = { status: 200, finalPath: '/admin/reports', pageErrors: [], consoleErrors: [], navigationError: null, blockedWrites: 0 }
const REPORTS_ROW = (ROUTES as Row[]).find(row => row.path === '/admin/reports') as Row
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
    expect(failures[0]).toContain('/admin/reports')
    expect(failures[0]).toContain('/en/auth/login')
  })

  it('a page where the role should have been sent away fails, and a redirect to the wrong place fails', () => {
    // a plain user must not see an admin page (the authorization regression this walk exists for)
    const asUser = judge({ finalPath: '/admin/reports' }, 'user')
    expect(asUser.join(' ')).toContain('unexpected redirect')
    const away = judge({ finalPath: '/somewhere-else' }, 'user')
    expect(away.join(' ')).toContain('/somewhere-else')
    // the expected redirect passes
    expect(judge({ finalPath: '/en' }, 'user')).toEqual([])
  })

  it('a navigation that threw fails', () => {
    expect(judge({ status: null, finalPath: null, navigationError: 'page.goto: Timeout 60000ms exceeded.' }).join(' ')).toContain('navigation')
  })

  it('the expected not-found passes only as a 404 on the requested path', () => {
    const permissions = (ROUTES as Row[]).find(row => row.path === '/admin/permissions') as Row
    const ask = (observed: Partial<Observed>) => judgeVisit({ row: permissions, role: 'moderator', params: PARAMS, observed: { ...GOOD, finalPath: '/admin/permissions', ...observed } }) as string[]
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
    expect(env.calls.visited.filter(visit => visit.startsWith('admin /admin/reports '))).toEqual(['admin /admin/reports @1280', 'admin /admin/reports @390'])
    expect(env.calls.makeUser).toEqual(['walk_admin:admin', 'walk_moderator:moderator', 'walk_agent:agent', 'walk_user:user'])
    expect(env.calls.makeListing).toEqual(['id-walk_agent:active'])
  })

  it('a hydration message on one row fails the run and the row is named in the log', async () => {
    const env = setup({
      observe: (role, requested, correct) => (role === 'moderator' && requested === '/admin/support' ? { ...correct, consoleErrors: ['Minified React error #418; visit https://react.dev/errors/418'] } : correct),
    })
    const result = await env.run()
    expect(result.ok).toBe(false)
    const failing = env.logs.filter(line => line.startsWith('FAIL'))
    expect(failing).toHaveLength(2) // the row at each of the two widths
    for (const line of failing) {
      expect(line).toContain('moderator')
      expect(line).toContain('/admin/support')
    }
  })

  // Review 1 F4: a first render that depends on the width (cards and sheets below 640) is only seen at the phone width.
  it('a hydration message at 390 only fails exactly that row: the 1280 row of the same page passes', async () => {
    const env = setup({
      observe: (role, requested, correct, width) => (role === 'admin' && requested === '/admin/reports' && width === 390
        ? { ...correct, consoleErrors: ['Minified React error #418; visit https://react.dev/errors/418'] }
        : correct),
    })
    const result = await env.run()
    expect(result.ok).toBe(false)
    const rows = result.rows as { role: string; path: string; width: number; ok: boolean; failures: string[] }[]
    const failing = rows.filter(row => !row.ok)
    expect(failing).toHaveLength(1)
    expect(failing[0]).toMatchObject({ role: 'admin', path: '/admin/reports', width: 390 })
    expect(failing[0].failures.join(' ')).toContain('hydration')
    expect(rows.find(row => row.role === 'admin' && row.path === '/admin/reports' && row.width === 1280)?.ok).toBe(true)
    const lines = env.logs.filter(line => line.startsWith('FAIL'))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('admin')
    expect(lines[0]).toContain('/admin/reports')
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
    const env = setup({ observe: (role, requested, correct) => (role === 'admin' && requested === '/admin' ? { ...correct, blockedWrites: 2, blockedList: ['POST /api/presence', 'POST /api/presence'] } : correct) })
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
