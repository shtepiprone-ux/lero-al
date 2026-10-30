// @vitest-environment node
/**
 * Security (Task 923 Revision 7, findings S3 / S6): company records.
 *  - creation is open (agent registration happens before a session), so the name is checked, the duplicate lookup asks for ONE name with wildcards escaped,
 *    and only a NEW company gets the grant to set its first logo (a stranger must not be able to change an existing agency's logo);
 *  - renaming and deleting are for admin / moderator only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/uploads/uploadGrant', () => ({ createUploadGrant: (kind: string, id: string) => `grant:${kind}:${id}` }))
const likePatterns: string[] = []

import { createCompanyAction, deleteCompanyAction, updateCompanyAction } from '../actions'

beforeEach(() => {
  db = createFakeDb({
    companies: [{ id: 'c1', name: 'Nova Real Estate' }],
    // active accounts, and the key a moderator needs (Task 923 R44, R71 (k), R75): `checkStaff()` reads the actor's own row and the key at each check
    users: [{ id: 'adm', role: 'admin', status: 'active' }, { id: 'mod', role: 'moderator', status: 'active' }, { id: 'usr', role: 'user', status: 'active' }, { id: 'agt', role: 'agent', status: 'active' }],
    role_permissions: [{ role: 'moderator', permission_key: 'companies.manage', allowed: true }],
  })
  currentUser = null
  likePatterns.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
  // the fake has no ilike: a case-insensitive exact-ish lookup that records the pattern it was given
  const real = db.client.from
  db.client.from = ((t: string) => {
    const chain = real(t) as Record<string, unknown>
    if (t === 'companies') {
      let pattern: string | null = null
      chain.ilike = (_c: string, p: string) => { pattern = p; likePatterns.push(p); return chain }
      const run = chain.limit as (n: number) => unknown
      chain.limit = (n: number) => {
        if (pattern === null) return run(n)
        const wanted = pattern.replace(/\\([%_\\])/g, '$1').toLowerCase()
        const rows = db.tables.companies.filter((c) => /[%_]/.test(pattern!.replace(/\\[%_\\]/g, '')) ? false : String(c.name).toLowerCase() === wanted)
        return Promise.resolve({ data: rows, error: null })
      }
    }
    return chain
  }) as never
})

describe('createCompanyAction (open to a visitor)', () => {
  it('creates a new company and returns the grant for ITS logo', async () => {
    const res = await createCompanyAction('  Alba Homes  ')
    expect(res.id).toBeDefined()
    expect(res.logoGrant).toBe(`grant:company-logo:${res.id}`)
    expect(db.tables.companies.at(-1)?.name).toBe('Alba Homes')
  })

  it('an existing name (any case, any spacing around) returns that company as a duplicate and NO grant', async () => {
    for (const name of ['Nova Real Estate', 'nova real estate', '  NOVA REAL ESTATE  ']) {
      const res = await createCompanyAction(name)
      expect(res).toEqual({ id: 'c1', duplicate: true })
      expect(res.logoGrant).toBeUndefined()
    }
    expect(db.tables.companies).toHaveLength(1)
  })

  it('wildcards in the name are escaped before they reach the lookup, so "%" does not match every company', async () => {
    const res = await createCompanyAction('%%')
    expect(res.duplicate).toBeUndefined()
    expect(likePatterns[0]).toBe('\\%\\%')
    const underscore = await createCompanyAction('N_va Real Estate')
    expect(underscore.duplicate).toBeUndefined()
  })

  it.each([[''], [' '], ['a'], [undefined], [null], [5], [{}], [['Nova']]])('refuses the name %j', async (name) => {
    expect(await createCompanyAction(name as never)).toEqual({ error: 'company_name_too_short' })
    expect(db.tables.companies).toHaveLength(1)
  })

  it('refuses a name over 120 characters and accepts exactly 120', async () => {
    expect(await createCompanyAction('x'.repeat(121))).toEqual({ error: 'company_name_too_long' })
    expect((await createCompanyAction('y'.repeat(120))).id).toBeDefined()
  })

  it('a race (unique violation) returns the company that won, with no grant', async () => {
    const real = db.client.from
    let inserted = false
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'companies' && !inserted) {
        c.insert = () => { inserted = true; db.tables.companies.push({ id: 'winner', name: 'Race Co' }); return { select: () => ({ single: async () => ({ data: null, error: { code: '23505', message: 'dup' } }) }) } }
      }
      return c
    }) as never
    const res = await createCompanyAction('Race Co')
    expect(res).toEqual({ id: 'winner', duplicate: true })
  })

  it('another database error is "save_failed" with no grant', async () => {
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'companies') c.insert = () => ({ select: () => ({ single: async () => ({ data: null, error: { code: 'XX', message: 'boom' } }) }) })
      return c
    }) as never
    expect(await createCompanyAction('Brand New Co')).toEqual({ error: 'save_failed' })
  })
})

describe('rename and delete: staff only', () => {
  const calls: [string, () => Promise<{ error?: string }>][] = [
    ['updateCompanyAction', () => updateCompanyAction('c1', 'Renamed Co')],
    ['deleteCompanyAction', () => deleteCompanyAction('c1')],
  ]

  it.each(calls)('%s is refused for an anonymous caller', async (_n, call) => {
    expect(await call()).toEqual({ error: 'unauthorized' })
    expect(db.tables.companies).toEqual([{ id: 'c1', name: 'Nova Real Estate' }])
  })

  // a session whose profile row is missing is a guest for `requireViewer()` (a "zombie" session), so it gets the guest's answer
  describe.each([['a plain user', 'usr', 'forbidden'], ['an agent', 'agt', 'forbidden'], ['a person with no profile', 'ghost', 'unauthorized']])('%s', (_l, id, error) => {
    beforeEach(() => { currentUser = { id } })
    it.each(calls)('%s is refused and nothing changes', async (_n, call) => {
      expect(await call()).toEqual({ error })
      expect(db.tables.companies).toEqual([{ id: 'c1', name: 'Nova Real Estate' }])
    })
  })

  describe.each([['an admin', 'adm'], ['a moderator', 'mod']])('%s', (_l, id) => {
    beforeEach(() => { currentUser = { id } })

    it('renames, trimmed', async () => {
      expect(await updateCompanyAction('c1', '  Renamed Co ')).toEqual({})
      expect(db.tables.companies[0].name).toBe('Renamed Co')
    })

    it.each([[''], ['a'], ['x'.repeat(121)]])('refuses the name %j', async (name) => {
      expect((await updateCompanyAction('c1', name)).error).toMatch(/company_name_too_/)
      expect(db.tables.companies[0].name).toBe('Nova Real Estate')
    })

    it('deletes only the named company', async () => {
      db.tables.companies.push({ id: 'c2', name: 'Other' })
      expect(await deleteCompanyAction('c1')).toEqual({})
      expect(db.tables.companies.map((c) => c.id)).toEqual(['c2'])
    })
  })
})
