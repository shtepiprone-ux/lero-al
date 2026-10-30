// @vitest-environment node
/**
 * Notifications: the service-role writer is not a public endpoint (Task 923 Revision 7, finding S1) and the two public actions are scoped to the caller.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const inserted: unknown[] = []
let insertError: unknown = null
const updates: { values: unknown; filters: [string, unknown][] }[] = []
// the signed-in person's own row, read by the real `requireViewer()` (Task 923 R44)
let viewerRow: Record<string, unknown> | null = { role: 'user', status: 'active', suspended_until: null, deleted_at: null }
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'u1' }) }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === 'users' ? viewerRow : null, error: null }) }) }),
      insert: (row: unknown) => { inserted.push({ table, row }); return Promise.resolve({ error: insertError }) },
    }),
  }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      update: (values: unknown) => {
        const rec = { values, filters: [] as [string, unknown][] }
        updates.push(rec)
        const chain: Record<string, unknown> = {}
        chain.eq = (c: string, v: unknown) => { rec.filters.push([c, v]); return chain }
        chain.then = (resolve: (v: unknown) => void) => resolve({ error: null })
        return chain
      },
    }),
  }),
}))

import { createNotification } from '../createNotification'
import { markAllNotificationsRead, markNotificationRead } from '../mutations'

const read = (f: string) => readFileSync(join(process.cwd(), 'src/modules/notifications/lib', f), 'utf8')

beforeEach(() => { inserted.length = 0; updates.length = 0; insertError = null; viewerRow = { role: 'user', status: 'active', suspended_until: null, deleted_at: null } })

describe('the writer is server-only and not a Server Action', () => {
  it('createNotification.ts has no "use server" directive and imports server-only', () => {
    const src = read('createNotification.ts')
    expect(src).not.toMatch(/^\s*['"]use server['"]/m)
    expect(src).toMatch(/import ['"]server-only['"]/)
  })

  it('mutations.ts ("use server") exports only the two actions a person runs on their own notifications', () => {
    const src = read('mutations.ts')
    expect(src).toMatch(/^\s*['"]use server['"]/m)
    const exported = [...src.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map((m) => m[1]).sort()
    expect(exported).toEqual(['markAllNotificationsRead', 'markNotificationRead'])
    expect(src).not.toContain('createAdminClient')
  })
})

describe('createNotification', () => {
  it('inserts one row for the given user with optional fields as null', async () => {
    await createNotification({ userId: 'u1', type: 'support_reply' as never, title: 'T', body: 'B' })
    expect(inserted).toEqual([{ table: 'notifications', row: { user_id: 'u1', type: 'support_reply', title: 'T', body: 'B', link: null, template_id: null, template_params: null } }])
  })

  it('passes the link, template id and params through', async () => {
    await createNotification({ userId: 'u1', type: 'support_reply' as never, title: 'T', body: 'B', link: '/en/cabinet', templateId: 'tpl', templateParams: { n: 1 } })
    expect(inserted[0]).toMatchObject({ row: { link: '/en/cabinet', template_id: 'tpl', template_params: { n: 1 } } })
  })

  it('a database error is logged and does not throw (the caller\'s own work has already succeeded)', async () => {
    insertError = { message: 'boom' }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(createNotification({ userId: 'u1', type: 'support_reply' as never, title: 'T', body: 'B' })).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('the actions a person runs on their own notifications', () => {
  it('a blocked, deactivated, deleted or missing account changes nothing, whatever its role (Task 923 R44)', async () => {
    for (const row of [{ role: 'agent', status: 'blocked', suspended_until: null, deleted_at: null }, { role: 'admin', status: 'inactive', suspended_until: null, deleted_at: null }, { role: 'user', status: 'active', suspended_until: null, deleted_at: '2026-10-01' }, null]) {
      viewerRow = row
      await markNotificationRead('n-1')
      await markAllNotificationsRead()
    }
    expect(updates).toEqual([])
  })

  it('markNotificationRead updates one row by id and only an unread one, through the caller\'s own client', async () => {
    await markNotificationRead('n-1')
    expect(updates).toHaveLength(1)
    expect(updates[0].values).toEqual({ is_read: true })
    expect(updates[0].filters).toEqual([['id', 'n-1'], ['is_read', false]])
  })

  it('markAllNotificationsRead touches only unread rows (row-level security limits them to the caller)', async () => {
    await markAllNotificationsRead()
    expect(updates[0].filters).toEqual([['is_read', false]])
  })
})

// Task 923 R38 (case SEC-S01-SRV-DENY): the contract names this test exactly, at the top level of the file.
it('[SEC-S01-SRV-DENY] createNotification is not reachable as a public Server Action', async () => {
  const { readdirSync } = await import('node:fs')
  const writer = read('createNotification.ts')
  expect(writer).not.toMatch(/^\s*['"]use server['"]/m)
  expect(writer).toMatch(/import ['"]server-only['"]/)
  // no module that carries a use server directive exports the writer or re-exports it
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(path); continue }
      if (!/\.[cm]?[jt]sx?$/.test(entry.name) || /\.test\.|\.stories\./.test(entry.name) || path.includes('__tests__')) continue
      const text = readFileSync(path, 'utf8')
      const exportsIt = /export\s+(?:async\s+)?(?:function|const)\s+createNotification\b|export\s*\{[^}]*\bcreateNotification\b|export\s*\*\s*from\s*['"][^'"]*createNotification/.test(text)
      if (/^\s*['"]use server['"]/m.test(text) && exportsIt) offenders.push(path)
    }
  }
  walk(join(process.cwd(), 'src'))
  expect(offenders, `use server modules that export createNotification: ${offenders.join(', ')}`).toEqual([])
})
