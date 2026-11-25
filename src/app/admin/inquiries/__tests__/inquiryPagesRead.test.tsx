// @vitest-environment node
/**
 * Task 1044 (Review 3 V14, the CI changed-line coverage of the two pages): the support and sales inquiry pages read the
 * received mail's columns and keep their mailbox scope.
 *  - each page selects `source` and `attachments` with the columns it read before, from `contact_inquiries`;
 *  - support keeps every mailbox but sales (`not ilike %sales%`), sales keeps only sales (`ilike %sales%`);
 *  - the rows and the loaded replies reach `AdminInquiriesManager` unchanged, with the page's mailbox scope.
 * The real pages run. The staff guard, the admin locale, `next-intl/server`, the admin client and the replies loader are
 * doubles (a page-render test cannot run the real guard outside a request scope; its order is proved by
 * staffPage.security.test.ts). Every row is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'

const state = vi.hoisted(() => ({
  tables: [] as string[],
  selects: [] as string[],
  filters: [] as Array<[string, string, string]>,
  rows: [] as Record<string, unknown>[],
  replies: [] as Record<string, unknown>[],
  loaded: [] as string[][],
}))

vi.mock('@/lib/auth/staff', () => ({ requireStaffPage: async () => ({ userId: 'u-admin', role: 'admin' }) }))
vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => 'en' }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/modules/contacts/lib/inquiryReplies', () => ({
  loadInquiryReplies: async (_db: unknown, ids: string[]) => { state.loaded.push(ids); return state.replies },
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      state.tables.push(table)
      const answer = { data: state.rows, count: state.rows.length }
      const chain = {
        select: (columns: string) => { state.selects.push(columns); return chain },
        not: (column: string, op: string, value: string) => { state.filters.push([column, `not ${op}`, value]); return chain },
        ilike: (column: string, value: string) => { state.filters.push([column, 'ilike', value]); return chain },
        order: () => chain,
        limit: async () => answer,
      }
      return chain
    },
  }),
}))

const COLUMNS = 'id, created_at, topic, custom_subject, name, email, message, target_mailbox, status, reply_count, handled_at, source, attachments'

/** the `AdminInquiriesManager` element of the page's tree */
function manager(tree: ReactElement): { inquiries: unknown; replies: unknown; mailboxScope: string } {
  const children = (tree.props as { children: ReactElement[] }).children
  return children[1].props as { inquiries: unknown; replies: unknown; mailboxScope: string }
}

beforeEach(() => {
  state.tables = []
  state.selects = []
  state.filters = []
  state.loaded = []
  state.rows = [
    { id: 'inq-1', source: 'email', attachments: [{ filename: 'kontrata.pdf', size: 96_256, content_type: 'application/pdf' }] },
    { id: 'inq-2', source: 'form', attachments: [] },
  ]
  state.replies = [{ id: 'rep-1', inquiry_id: 'inq-1', direction: 'inbound', from_email: 'ana@example.com', attachments: [] }]
})

describe('the inquiry pages read the received mail columns (Task 1044)', () => {
  it('support: selects source and attachments, keeps every mailbox but sales, and hands rows and replies to the manager', async () => {
    const { default: Page } = await import('../support/page')
    const tree = await Page()
    expect(state.tables).toEqual(['contact_inquiries'])
    expect(state.selects).toEqual([COLUMNS])
    expect(state.filters).toEqual([['target_mailbox', 'not ilike', '%sales%']])
    expect(state.loaded).toEqual([['inq-1', 'inq-2']])
    expect(manager(tree)).toMatchObject({ inquiries: state.rows, replies: state.replies, mailboxScope: 'support' })
  })

  it('sales: selects source and attachments, keeps only sales, and hands rows and replies to the manager', async () => {
    const { default: Page } = await import('../sales/page')
    const tree = await Page()
    expect(state.tables).toEqual(['contact_inquiries'])
    expect(state.selects).toEqual([COLUMNS])
    expect(state.filters).toEqual([['target_mailbox', 'ilike', '%sales%']])
    expect(state.loaded).toEqual([['inq-1', 'inq-2']])
    expect(manager(tree)).toMatchObject({ inquiries: state.rows, replies: state.replies, mailboxScope: 'sales' })
  })
})
