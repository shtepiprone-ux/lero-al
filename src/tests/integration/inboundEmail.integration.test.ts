/**
 * Real-boundary control of Task 1044 AC9, on the REAL development database after task1044.sql:
 *  - SEC-1044-DB-CHECKS: `contact_inquiries.source` refuses a value other than form / email, `contact_inquiry_replies.direction` one other than outbound / inbound,
 *    and an inbound row with a staff author (`replied_by`) is refused (23514); the defaults keep a row written without the new columns a form inquiry and a staff reply;
 *  - SEC-1044-DB-UNIQUE: the unique index of each table refuses a second row with the same `message_id` (23505), and rows without one are not limited.
 * Every row is synthetic (its name carries the run prefix) and is removed in afterAll, replies first; the removal is verified.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRun, type Run } from '@/tests/integration/fixtures'

let run: Run
const inquiryIds: string[] = []

beforeAll(() => { run = createRun() })
afterAll(async () => {
  if (inquiryIds.length > 0) {
    await run.admin.from('contact_inquiry_replies').delete().in('inquiry_id', inquiryIds)
    await run.admin.from('contact_inquiries').delete().in('id', inquiryIds)
    const left = await run.admin.from('contact_inquiries').select('id').like('name', `${run.RUN}%`)
    expect(left.data ?? [], 'the synthetic inquiries of this run are removed').toEqual([])
  }
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

async function inquiry(tag: string, extra: Record<string, unknown> = {}) {
  const res = await run.admin.from('contact_inquiries').insert({
    topic: 'other', custom_subject: `${run.RUN} ${tag}`, name: `${run.RUN} ${tag}`, email: `${run.RUN}_${tag}@example.com`, message: 'Synthetic inquiry of the Task 1044 test.',
    target_mailbox: 'support@lero.al', status: 'new', ...extra,
  }).select('id, source, attachments').single()
  if (res.data) inquiryIds.push(res.data.id)
  return res
}

describe('task1044.sql on the real database', () => {
  it('[SEC-1044-DB-CHECKS] the checks refuse a wrong source, a wrong direction and an inbound row with a staff author; the defaults keep old writes valid', async () => {
    const plain = await inquiry('plain')
    expect(plain.error).toBeNull()
    expect(plain.data).toMatchObject({ source: 'form', attachments: [] })

    expect((await inquiry('bad-source', { source: 'web' })).error?.code).toBe('23514')
    expect((await inquiry('mail', { source: 'email', requester_ip: null })).error).toBeNull()

    const parent = plain.data!.id
    const staff = await run.makeUser('staff', { role: 'admin' })
    const reply = await run.admin.from('contact_inquiry_replies').insert({ inquiry_id: parent, replied_by: staff.id, body: 'Synthetic staff reply.' }).select('direction, attachments').single()
    expect(reply.error).toBeNull()
    expect(reply.data).toMatchObject({ direction: 'outbound', attachments: [] })

    const sideways = await run.admin.from('contact_inquiry_replies').insert({ inquiry_id: parent, direction: 'sideways', body: 'Synthetic.' })
    expect(sideways.error?.code).toBe('23514')
    const forged = await run.admin.from('contact_inquiry_replies').insert({ inquiry_id: parent, direction: 'inbound', replied_by: staff.id, from_email: 'a@example.com', body: 'Synthetic.' })
    expect(forged.error?.code).toBe('23514')
    const answer = await run.admin.from('contact_inquiry_replies').insert({ inquiry_id: parent, direction: 'inbound', from_email: 'a@example.com', body: 'Synthetic answer.' })
    expect(answer.error).toBeNull()
  })

  it('[SEC-1044-DB-UNIQUE] a second message_id is refused in each table; rows without one are not limited', async () => {
    const id = `<${run.RUN}-1@example.com>`
    expect((await inquiry('first', { source: 'email', message_id: id })).error).toBeNull()
    expect((await inquiry('second', { source: 'email', message_id: id })).error?.code).toBe('23505')
    expect((await inquiry('none-1')).error).toBeNull()
    expect((await inquiry('none-2')).error).toBeNull()

    const parent = inquiryIds[inquiryIds.length - 1]
    const replyId = `<${run.RUN}-2@example.com>`
    expect((await run.admin.from('contact_inquiry_replies').insert({ inquiry_id: parent, direction: 'inbound', from_email: 'a@example.com', body: 'Synthetic.', message_id: replyId })).error).toBeNull()
    expect((await run.admin.from('contact_inquiry_replies').insert({ inquiry_id: parent, direction: 'inbound', from_email: 'a@example.com', body: 'Synthetic.', message_id: replyId })).error?.code).toBe('23505')
  })
})
