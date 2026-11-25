import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { loadInquiryReplies } from '../inquiryReplies'

/**
 * Task 1034 AC1: the loader reads `replied_by_name` and never asks PostgREST for the embed `users!replied_by` (`contact_inquiry_replies.replied_by` references
 * `auth.users`, so the embed answers PGRST200). The database double answers PGRST200 to any select containing `!` and rows otherwise.
 */

const ROWS = [
  { id: 'r1', inquiry_id: 'i1', body: 'First answer', created_at: '2026-11-01T10:00:00Z', replied_by: 'u1', replied_by_name: 'Ana Staff', direction: 'outbound', from_email: null, attachments: [] },
  { id: 'r2', inquiry_id: 'i1', body: 'Second answer', created_at: '2026-11-02T10:00:00Z', replied_by: 'u2', replied_by_name: null, direction: 'outbound', from_email: null, attachments: [] },
]

interface Calls { selects: string[]; filters: Array<[string, unknown]>; orders: Array<[string, unknown]>; tables: string[] }

function makeDb(failWith?: { code: string; message: string }) {
  const calls: Calls = { selects: [], filters: [], orders: [], tables: [] }
  const finish = (select: string) => {
    if (failWith || select.includes('!')) {
      return { data: null, error: failWith ?? { code: 'PGRST200', message: 'Could not find a relationship between contact_inquiry_replies and users' } }
    }
    return { data: ROWS, error: null }
  }
  const db = {
    from(table: string) {
      calls.tables.push(table)
      let select = ''
      const builder = {
        select(columns: string) { select = columns; calls.selects.push(columns); return builder },
        in(column: string, values: unknown) { calls.filters.push([column, values]); return builder },
        order(column: string, options: unknown) { calls.orders.push([column, options]); return Promise.resolve(finish(select)) },
      }
      return builder
    },
  }
  return { db: db as unknown as SupabaseClient, calls }
}

let errorSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => { errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => { errorSpy.mockRestore() })

describe('loadInquiryReplies', () => {
  it('returns every reply with the sender name from replied_by_name and asks for no embed', async () => {
    const { db, calls } = makeDb()
    const replies = await loadInquiryReplies(db, ['i1'])

    expect(replies).toEqual([
      { id: 'r1', inquiry_id: 'i1', body: 'First answer', created_at: '2026-11-01T10:00:00Z', replied_by: 'u1', replier: { name: 'Ana Staff' }, direction: 'outbound', from_email: null, attachments: [] },
      { id: 'r2', inquiry_id: 'i1', body: 'Second answer', created_at: '2026-11-02T10:00:00Z', replied_by: 'u2', replier: null, direction: 'outbound', from_email: null, attachments: [] },
    ])
    expect(calls.tables).toEqual(['contact_inquiry_replies'])
    expect(calls.selects).toEqual(['id, inquiry_id, body, created_at, replied_by, replied_by_name, direction, from_email, attachments'])
    expect(calls.selects[0]).not.toContain('!')
    expect(calls.filters).toEqual([['inquiry_id', ['i1']]])
    expect(calls.orders).toEqual([['created_at', { ascending: true }]])
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('returns [] and logs one line with the error code only when the read fails', async () => {
    const { db } = makeDb({ code: 'XX000', message: 'secret body "Dear Ana" ana@example.com' })
    const replies = await loadInquiryReplies(db, ['i1'])

    expect(replies).toEqual([])
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('[admin-inquiries] the replies were not loaded', { code: 'XX000' })
    const logged = JSON.stringify(errorSpy.mock.calls)
    expect(logged).not.toContain('Dear Ana')
    expect(logged).not.toContain('ana@example.com')
    expect(logged).not.toContain('Ana Staff')
  })

  it('makes no query for no ids', async () => {
    const { db, calls } = makeDb()
    const replies = await loadInquiryReplies(db, [])

    expect(replies).toEqual([])
    expect(calls.tables).toEqual([])
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
