/**
 * Real-boundary control for the reply read of the admin inquiry pages (Task 1034 AC2), on the REAL development database.
 *  - SEC-1034-REPLIES-READ: `loadInquiryReplies` with the service role is accepted by PostgREST: no error is logged and a random inquiry id has no replies;
 *  - SEC-1034-REPLIES-EMBED: the old read, with the embed `replier:users!replied_by(name)`, is refused with PGRST200 (`contact_inquiry_replies.replied_by` references
 *    `auth.users`); this test fails if that relationship ever changes again.
 * No row is written. Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run } from '@/tests/integration/fixtures'
import { loadInquiryReplies } from '@/modules/contacts/lib/inquiryReplies'

let run: Run

beforeAll(() => { run = createRun() })
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})
afterEach(() => { vi.restoreAllMocks() })

describe('contact_inquiry_replies read of the admin inquiry pages', () => {
  it('[SEC-1034-REPLIES-READ] the loader read is accepted by the real database: no error log, no replies for a random inquiry id', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const replies = await loadInquiryReplies(run.admin, [randomUUID()])
    expect(replies).toEqual([])
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('[SEC-1034-REPLIES-EMBED] the old embed read with the same filter is refused with PGRST200', async () => {
    const old = await run.admin
      .from('contact_inquiry_replies')
      .select('id, inquiry_id, body, created_at, replied_by, replier:users!replied_by(name)')
      .in('inquiry_id', [randomUUID()])
      .order('created_at', { ascending: true })
    expect(old.error?.code).toBe('PGRST200')
  })
})
