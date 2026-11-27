/**
 * Task 989 Revision 3 (Review 4 F12): the admin "Footer" page checks the viewer first, then hands the editor what `getAllFooterContent` read. The staff guard
 * (`requireStaffPage` resolves: with the real one a page-render test fails outside a request scope), `getAdminLocale`, `next-intl/server` and the read are doubles,
 * as in `src/app/[locale]/admin/users/__tests__/adminUsersNotice.security.test.tsx`; the page's element tree is read without rendering it.
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminFooterManager } from '@/components/admin/AdminFooterManager'
import AdminFooterPage from '../page'

const calls: string[] = []
const read = {
  data: { sq: null, en: null, uk: null, it: null } as Record<string, unknown>,
  shared: { contact_phone: '+355 69 000 0000', footer_show_phone: 'true' } as Record<string, string> | undefined,
  initialized: true,
  error: undefined as string | undefined,
}

vi.mock('@/lib/auth/staff', () => ({
  requireStaffPage: vi.fn(async (options: unknown) => { calls.push(`requireStaffPage ${JSON.stringify(options)}`); return { userId: 'u-admin', role: 'admin' } }),
}))
vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => 'en' }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/modules/admin/actions/footer', () => ({
  getAllFooterContent: vi.fn(async () => { calls.push('getAllFooterContent'); return read }),
  saveFooterShared: vi.fn(),
  upsertFooterContent: vi.fn(),
}))

/** the first element of the tree whose type is `type` */
function find(node: unknown, type: unknown): React.ReactElement<Record<string, unknown>> | null {
  if (Array.isArray(node)) {
    for (const child of node) { const hit = find(child, type); if (hit) return hit }
    return null
  }
  if (!React.isValidElement(node)) return null
  if (node.type === type) return node as React.ReactElement<Record<string, unknown>>
  return find((node.props as { children?: unknown }).children, type)
}

beforeEach(() => {
  calls.length = 0
  read.data = { sq: null, en: null, uk: null, it: null }
  read.shared = { contact_phone: '+355 69 000 0000', footer_show_phone: 'true' }
  read.initialized = true
  read.error = undefined
})

describe('AdminFooterPage', () => {
  it('hands the editor the rows, the shared block and the state that getAllFooterContent read', async () => {
    const manager = find(await AdminFooterPage(), AdminFooterManager)
    expect(manager).not.toBeNull()
    expect(manager!.props.initialData).toBe(read.data)
    expect(manager!.props.initialShared).toBe(read.shared)
    expect(manager!.props.initialized).toBe(true)
    expect(manager!.props.serverError).toBeUndefined()
  })

  it('a refused or failed read reaches the editor as its error, not initialized', async () => {
    read.data = {}
    read.shared = undefined
    read.initialized = false
    read.error = 'forbidden'
    const manager = find(await AdminFooterPage(), AdminFooterManager)
    expect(manager!.props.initialData).toEqual({})
    expect(manager!.props.initialShared).toBeUndefined()
    expect(manager!.props.initialized).toBe(false)
    expect(manager!.props.serverError).toBe('forbidden')
  })

  it('checks the viewer as an administrator before the read', async () => {
    await AdminFooterPage()
    expect(calls).toEqual(['requireStaffPage {"adminOnly":true}', 'getAllFooterContent'])
  })
})
