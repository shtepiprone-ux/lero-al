// @vitest-environment node
/**
 * Companies (Task 923 Revision 7, findings S3 / S6): `createCompanyAction` is public by design (registration has no session), so it must be bounded, must not
 * hand out a way to change an EXISTING company, and the staff actions must refuse everyone else.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

let sessionUser: { id: string } | null = null
vi.mock('@/lib/auth/server', () => ({ getUser: async () => sessionUser }))

type Call = { table: string; method: string; args: unknown[] }
const calls: Call[] = []
let existingRows: { id: string; name: string }[] = []
let existingSequence: { id: string; name: string }[][] = []
let insertResult: { data: { id: string } | null; error: { code?: string } | null } = { data: { id: 'new-company-id' }, error: null }
let role: string | null = null
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const rec = (method: string) => (...args: unknown[]) => { calls.push({ table, method, args }); return chain }
      const chain: Record<string, unknown> = {}
      for (const m of ['select', 'ilike', 'limit', 'update', 'delete', 'eq']) chain[m] = rec(m)
      chain.insert = (...args: unknown[]) => { calls.push({ table, method: 'insert', args }); return chain }
      chain.single = async () => (table === 'users' ? { data: role ? { role } : null } : insertResult)
      // the caller's own row, read by the real `requireViewer()` (Task 923 R44)
      // a moderator reaches the company tools only with the key (Task 923 R75): the permission row says it is on
      chain.maybeSingle = async () => ({ data: table === 'role_permissions' ? { allowed: true } : table === 'users' && role ? { role, status: 'active', suspended_until: null, deleted_at: null } : null, error: null })
      chain.then = (resolve: (v: unknown) => void) => resolve({ data: existingSequence.length ? existingSequence.shift() : existingRows, error: null })
      return chain
    },
  }),
}))

import { verifyUploadGrant } from '@/lib/uploads/uploadGrant'
import { createCompanyAction, deleteCompanyAction, updateCompanyAction } from '../actions'

beforeEach(() => {
  calls.length = 0
  existingRows = []
  existingSequence = []
  insertResult = { data: { id: 'new-company-id' }, error: null }
  sessionUser = null
  role = null
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-for-tests'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('createCompanyAction (public: agent registration)', () => {
  it('creates a new company and returns a grant for THAT company only', async () => {
    const res = await createCompanyAction('Nova Real Estate')
    expect(res.id).toBe('new-company-id')
    expect(res.duplicate).toBeUndefined()
    expect(verifyUploadGrant('company-logo', 'new-company-id', res.logoGrant)).toBe(true)
    expect(verifyUploadGrant('company-logo', 'another-company', res.logoGrant)).toBe(false)
  })

  it('an existing name returns its id as a duplicate and NO grant (a stranger cannot change an existing agency)', async () => {
    existingRows = [{ id: 'existing-1', name: 'Nova Real Estate' }]
    const res = await createCompanyAction('nova real estate')
    expect(res).toEqual({ id: 'existing-1', duplicate: true })
    expect(res.logoGrant).toBeUndefined()
    expect(calls.some((c) => c.method === 'insert')).toBe(false)
  })

  it('looks the name up in the database with a bounded query, never reading the whole table', async () => {
    await createCompanyAction('Nova')
    const select = calls.find((c) => c.method === 'select')
    expect(select).toBeDefined()
    expect(calls.some((c) => c.method === 'ilike')).toBe(true)
    expect(calls.find((c) => c.method === 'limit')?.args[0]).toBeLessThanOrEqual(10)
  })

  it('a percent sign or underscore in the name is searched literally, so one name cannot match many companies', async () => {
    await createCompanyAction('A%B_C')
    const pattern = calls.find((c) => c.method === 'ilike')?.args[1] as string
    expect(pattern).toBe(String.raw`A\%B\_C`)
  })

  it('a name that only LOOKS like another one (the database wildcard matched more) is not treated as a duplicate', async () => {
    existingRows = [{ id: 'other', name: 'Nova Real Estate Group' }]
    const res = await createCompanyAction('Nova Real Estate')
    expect(res.duplicate).toBeUndefined()
    expect(res.id).toBe('new-company-id')
  })

  it('a unique-violation race resolves to the company that won it', async () => {
    existingSequence = [[], [{ id: 'winner', name: 'Race Co' }]] // nothing at the first look-up, the winner at the retry
    insertResult = { data: null, error: { code: '23505' } }
    expect(await createCompanyAction('Race Co')).toEqual({ id: 'winner', duplicate: true })
  })

  it('a unique violation with no winner found is reported as a save error', async () => {
    insertResult = { data: null, error: { code: '23505' } }
    expect(await createCompanyAction('Race Co')).toEqual({ error: 'save_failed' })
  })

  it.each([['', 'company_name_too_short'], [' a ', 'company_name_too_short'], ['x'.repeat(121), 'company_name_too_long']])('refuses the name %j', async (name, error) => {
    expect(await createCompanyAction(name)).toEqual({ error })
    expect(calls).toEqual([])
  })

  it('refuses a name that is not a string', async () => {
    expect(await createCompanyAction(undefined as unknown as string)).toEqual({ error: 'company_name_too_short' })
    expect(await createCompanyAction({ $ne: '' } as unknown as string)).toEqual({ error: 'company_name_too_short' })
  })

  it('a database error is reported as a code, with no database detail', async () => {
    insertResult = { data: null, error: { code: 'XX000' } }
    expect(await createCompanyAction('Fail Co')).toEqual({ error: 'save_failed' })
  })
})

describe('staff-only company actions', () => {
  it.each([
    ['update', () => updateCompanyAction('c1', 'New name')],
    ['delete', () => deleteCompanyAction('c1')],
  ])('%s refuses an anonymous caller and changes nothing', async (_n, run) => {
    expect(await run()).toEqual({ error: 'unauthorized' })
    expect(calls.some((c) => ['update', 'delete'].includes(c.method))).toBe(false)
  })

  it.each(['user', 'agent', 'private'])('refuses a signed-in %s', async (r) => {
    sessionUser = { id: 'u1' }
    role = r
    expect(await updateCompanyAction('c1', 'New name')).toEqual({ error: 'forbidden' })
    expect(await deleteCompanyAction('c1')).toEqual({ error: 'forbidden' })
    expect(calls.some((c) => ['update', 'delete'].includes(c.method))).toBe(false)
  })

  it.each(['admin', 'moderator'])('lets a %s change a company', async (r) => {
    sessionUser = { id: 's1' }
    role = r
    expect(await updateCompanyAction('c1', 'New name')).toEqual({})
    expect(calls.some((c) => c.method === 'update')).toBe(true)
  })

  it('update validates the new name', async () => {
    sessionUser = { id: 's1' }
    role = 'admin'
    expect(await updateCompanyAction('c1', ' ')).toEqual({ error: 'company_name_too_short' })
    expect(await updateCompanyAction('c1', 'x'.repeat(121))).toEqual({ error: 'company_name_too_long' })
  })
})

// Task 923 R38 (case SEC-S06-SRV-DENY)
it('[SEC-S06-SRV-DENY] createCompanyAction never returns other companies and finds a duplicate by a bounded lookup', async () => {
  existingRows = [{ id: 'c-1', name: 'Nova' }]
  const res = await createCompanyAction('100%_real')
  expect(JSON.stringify(res)).not.toContain('Nova')                                     // no list of companies in the answer
  const lookup = calls.filter((c) => c.table === 'companies' && c.method === 'ilike')
  expect(lookup.length).toBeGreaterThan(0)
  expect(String(lookup[0].args[1])).toBe(String.raw`100\%\_real`)                              // the wildcards are escaped
  expect(calls.some((c) => c.table === 'companies' && c.method === 'limit')).toBe(true)  // one bounded query, never the whole table
  existingRows = [{ id: 'c-1', name: 'Nova' }]
  const dup = await createCompanyAction('Nova')
  expect(JSON.stringify(dup)).not.toContain('grant')                                    // an existing company hands no upload grant to the caller
})
