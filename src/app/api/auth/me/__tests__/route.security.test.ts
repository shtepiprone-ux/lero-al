// @vitest-environment node
/**
 * Task 927: the session endpoint a browser asks right after a Google sign-in. The auth controller signs a browser out when this answers `user: null`, so it must
 * return the profile for an Auth-validated session whose profile row exists and gives access, and answer everything else as a guest. The REAL `GET` of
 * `/api/auth/me`, the REAL `requireViewer` and the REAL `accountHasAccess` run; `getUser`, `resolveSession` and the service-role client are explicit I/O doubles.
 */
import { beforeEach, expect, it, vi } from 'vitest'

const io = vi.hoisted(() => ({
  getUser: vi.fn(),
  resolveSession: vi.fn(),
  row: null as null | Record<string, unknown>,
  readError: null as null | { message: string },
  reads: [] as string[],
}))

vi.mock('@/lib/auth/server', () => ({ getUser: () => io.getUser(), resolveSession: () => io.resolveSession() }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: string) => ({
          maybeSingle: async () => { io.reads.push(`${table}:${columns}:${column}=${value}`); return { data: io.readError ? null : io.row, error: io.readError } },
        }),
      }),
    }),
  }),
}))

import { GET } from '../route'

const ID = '7d1c9e0a-5b2f-4a3e-8c6d-0f1e2d3c4b5a'
const PROFILE = { id: ID, name: 'zz synthetic google person', role: 'user', user_type: 'private', is_verified: false }
const activeRow = (extra: Record<string, unknown> = {}) => ({ role: 'user', status: 'active', suspended_until: null, deleted_at: null, ...extra })

beforeEach(() => {
  io.getUser.mockReset(); io.resolveSession.mockReset()
  io.row = null; io.readError = null; io.reads = []
  io.getUser.mockResolvedValue({ id: ID })
  io.resolveSession.mockResolvedValue({ user: PROFILE })
})

it('[SEC-927-SRV-ALLOW] the session endpoint returns the profile of a signed-in Google account whose profile is active', async () => {
  io.row = activeRow()
  const response = await GET()
  expect(response.status).toBe(200)
  expect(await response.json()).toStrictEqual({ user: PROFILE })
  expect(io.reads, 'the profile that gives access is read for this Auth user only').toEqual([`users:role, status, suspended_until, deleted_at:id=${ID}`])
  expect(io.resolveSession).toHaveBeenCalledTimes(1)
})

it('[SEC-927-SRV-DENY] the session endpoint answers a Google session without a usable profile as a guest', async () => {
  for (const [label, row] of [
    ['no profile row', null],
    ['a deleted profile', activeRow({ deleted_at: '2026-10-01T00:00:00Z' })],
    ['a blocked profile', activeRow({ status: 'blocked' })],
  ] as const) {
    io.resolveSession.mockClear()
    io.row = row
    const response = await GET()
    expect(response.status, label).toBe(200)
    expect(await response.json(), label).toStrictEqual({ user: null })
    expect(io.resolveSession, label).not.toHaveBeenCalled()
  }
})

it('[SEC-927-SRV-ERR] the session endpoint answers a failed Auth or profile lookup as a guest', async () => {
  io.getUser.mockRejectedValue(new Error('auth is down: zz-secret-detail'))
  const authDown = await GET()
  expect(authDown.status).toBe(200)
  expect(JSON.stringify(await authDown.json()), 'no message or stack of the failure in the body').toBe('{"user":null}')
  expect(io.resolveSession).not.toHaveBeenCalled()

  io.getUser.mockResolvedValue({ id: ID })
  io.row = activeRow()
  io.readError = { message: 'relation "users" does not exist: zz-secret-detail' }
  const profileDown = await GET()
  expect(profileDown.status).toBe(200)
  expect(JSON.stringify(await profileDown.json())).toBe('{"user":null}')
  expect(io.resolveSession).not.toHaveBeenCalled()
})
