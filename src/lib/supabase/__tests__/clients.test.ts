// @vitest-environment node
/**
 * The three Supabase clients (Task 923 Revision 7).
 *  - admin: the service-role key. It must be refused when anything is missing, never be given a persisted session, and never appear in an error message;
 *  - server: the anon key with the request's cookies; a cookie write that fails in a Server Component is swallowed, not thrown;
 *  - browser: one client for the app's lifetime, with a lock that runs auth operations one after another and always passes on a real Error.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const created: { fn: string; args: unknown[] }[] = []
vi.mock('@supabase/supabase-js', () => ({ createClient: (...args: unknown[]) => { created.push({ fn: 'supabase-js', args }); return { kind: 'admin' } } }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => { created.push({ fn: 'server', args }); return { kind: 'server' } },
  createBrowserClient: (...args: unknown[]) => { created.push({ fn: 'browser', args }); return { kind: 'browser' } },
}))
const jar = { all: [{ name: 'sb', value: '1' }], set: vi.fn(), failSet: false }
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => jar.all, set: (...a: unknown[]) => { if (jar.failSet) throw new Error('read-only'); jar.set(...a) } }) }))

const ENV = { ...process.env }
beforeEach(() => {
  created.length = 0
  jar.set.mockClear()
  jar.failSet = false
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-SECRET'
})
afterEach(() => { process.env = { ...ENV } })

describe('createAdminClient', () => {
  it('builds the service-role client with no session kept and no token refresh', async () => {
    const { createAdminClient } = await import('../admin')
    createAdminClient()
    expect(created[0].args).toEqual(['https://x.supabase.co', 'service-role-SECRET', { auth: { autoRefreshToken: false, persistSession: false } }])
  })

  it.each([['NEXT_PUBLIC_SUPABASE_URL'], ['SUPABASE_SERVICE_ROLE_KEY']])('refuses to build without %s, and builds nothing', async (name) => {
    delete process.env[name]
    const { createAdminClient } = await import('../admin')
    expect(() => createAdminClient()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/)
    expect(created).toEqual([])
  })

  it('an empty key is treated as missing', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''
    const { createAdminClient } = await import('../admin')
    expect(() => createAdminClient()).toThrow()
  })

  it('the error message never contains the key', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const { createAdminClient } = await import('../admin')
    try { createAdminClient() } catch (e) { expect(String((e as Error).message)).not.toContain('service-role-SECRET') }
    expect.assertions(1)
  })

  it('never uses the anon key', async () => {
    const { createAdminClient } = await import('../admin')
    createAdminClient()
    expect(JSON.stringify(created[0].args)).not.toContain('anon-key')
  })
})

describe('server createClient', () => {
  async function build() {
    const { createClient } = await import('../server')
    await createClient()
    const [url, key, options] = created[0].args as [string, string, { cookies: { getAll: () => unknown; setAll: (c: unknown[]) => void } }]
    return { url, key, cookies: options.cookies }
  }

  it('uses the anon key (never the service-role key) and the request\'s cookies', async () => {
    const { url, key, cookies } = await build()
    expect(url).toBe('https://x.supabase.co')
    expect(key).toBe('anon-key')
    expect(JSON.stringify(created[0].args)).not.toContain('SECRET')
    expect(cookies.getAll()).toEqual(jar.all)
  })

  it('writes every refreshed cookie with its options unchanged', async () => {
    const { cookies } = await build()
    cookies.setAll([{ name: 'a', value: '1', options: { httpOnly: true, secure: true, sameSite: 'lax' } }, { name: 'b', value: '2', options: {} }])
    expect(jar.set.mock.calls).toEqual([['a', '1', { httpOnly: true, secure: true, sameSite: 'lax' }], ['b', '2', {}]])
  })

  it('a cookie write that fails (Server Component) is swallowed', async () => {
    const { cookies } = await build()
    jar.failSet = true
    expect(() => cookies.setAll([{ name: 'a', value: '1', options: {} }])).not.toThrow()
  })
})

describe('browser createClient', () => {
  async function load() {
    const mod = await import('../client')
    return mod.createClient
  }
  const lockOf = () => (created[0].args[2] as { auth: { lock: (n: string, t: number, fn: () => Promise<unknown>) => Promise<unknown> } }).auth.lock

  it('is a singleton: one client for the whole app', async () => {
    const createClient = await load()
    const a = createClient()
    const b = createClient()
    expect(a).toBe(b)
    expect(created).toHaveLength(1)
  })

  it('uses the anon key, never the service-role key', async () => {
    const createClient = await load()
    createClient()
    expect(created[0].args.slice(0, 2)).toEqual(['https://x.supabase.co', 'anon-key'])
    expect(JSON.stringify(created[0].args)).not.toContain('SECRET')
  })

  it('the lock runs auth operations strictly one after another', async () => {
    const createClient = await load()
    createClient()
    const lock = lockOf()
    const order: string[] = []
    let releaseFirst!: () => void
    const first = lock('x', 0, () => new Promise<string>((res) => { releaseFirst = () => { order.push('first done'); res('1') } }))
    const second = lock('x', 0, async () => { order.push('second start'); return '2' })
    await Promise.resolve()
    expect(order).toEqual([])
    releaseFirst()
    expect(await first).toBe('1')
    expect(await second).toBe('2')
    expect(order).toEqual(['first done', 'second start'])
  })

  it('a failed operation does not block the next one', async () => {
    const createClient = await load()
    createClient()
    const lock = lockOf()
    await expect(lock('x', 0, async () => { throw new Error('first failed') })).rejects.toThrow('first failed')
    expect(await lock('x', 0, async () => 'ok')).toBe('ok')
  })

  it.each([
    ['a string', 'refresh token not found', 'refresh token not found'],
    ['undefined', undefined, 'Auth lock operation failed: unknown'],
    ['null', null, 'Auth lock operation failed: unknown'],
    ['a plain object', { code: 1 }, 'Auth lock operation failed: [object Object]'],
  ])('a rejection with %s becomes an Error with a message', async (_label, raw, message) => {
    const createClient = await load()
    createClient()
    const err = await lockOf()('x', 0, () => Promise.reject(raw)).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toBe(message)
  })

  it('a real Error keeps its identity and stack', async () => {
    const createClient = await load()
    createClient()
    const original = new Error('real')
    const err = await lockOf()('x', 0, () => Promise.reject(original)).catch((e: unknown) => e)
    expect(err).toBe(original)
  })
})
