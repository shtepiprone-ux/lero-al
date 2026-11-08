// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S17): the admin READ actions.
 *
 * Every exported function of a `'use server'` file is a public endpoint. The admin catalogue getters return admin catalogue data. Both must answer an anonymous caller and a
 * plain user with NOTHING and must not even query the database for them.
 * (Finding S16, the exchange-provider getter that returned every provider's `api_key`, is closed by removing the provider screen, its actions and its table code:
 * Task 923 R100, R78 (a); `exchangeProvidersRemoved.security.test.ts` proves nothing reads or writes the table any more.)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({ getUser: (...a: unknown[]) => mockGetUser(...a) }))

let role: string | null = null
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: role ? { role } : null }) }) }) }),
  })),
}))

const adminQueries: string[] = []
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => {
      // the caller's own row, read by the real `requireViewer()` (Task 923 R44): not a data query, so it is not counted
      if (table === 'users') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: role ? { role, status: 'active', suspended_until: null, deleted_at: null } : null, error: null }) }) }) }
      }
      adminQueries.push(table)
      const rows = [{ id: 1, code: 'EUR', slug: 'flat' }]
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.order = () => chain
      chain.then = (resolve: (v: unknown) => void) => resolve({ data: rows, error: null })
      return chain
    },
  })),
}))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), updateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }))

import { getAllCurrenciesAdmin } from '../currencies'
import { getAllPropertyTypesAdmin } from '../propertyTypes'

const GETTERS: [string, () => Promise<unknown[]>][] = [
  ['getAllCurrenciesAdmin', getAllCurrenciesAdmin as () => Promise<unknown[]>],
  ['getAllPropertyTypesAdmin', getAllPropertyTypesAdmin as () => Promise<unknown[]>],
]

beforeEach(() => { mockGetUser.mockReset(); adminQueries.length = 0; role = null })

describe.each(GETTERS)('%s', (_name, call) => {
  it('gives an anonymous caller nothing and does not query the database', async () => {
    mockGetUser.mockResolvedValue(null)
    expect(await call()).toEqual([])
    expect(adminQueries).toEqual([])
  })

  it('gives a signed-in plain user nothing and does not query the database', async () => {
    mockGetUser.mockResolvedValue({ id: 'u1' })
    role = 'user'
    expect(await call()).toEqual([])
    expect(adminQueries).toEqual([])
  })

  it('gives an agent nothing', async () => {
    mockGetUser.mockResolvedValue({ id: 'u2' })
    role = 'agent'
    expect(await call()).toEqual([])
  })

  it('gives an administrator the rows', async () => {
    mockGetUser.mockResolvedValue({ id: 'a1' })
    role = 'admin'
    const rows = await call()
    expect(rows.length).toBe(1)
    expect(adminQueries.length).toBe(1)
  })
})
