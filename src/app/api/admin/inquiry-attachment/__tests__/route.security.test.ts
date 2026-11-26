// @vitest-environment node
/**
 * Security (Task 1047 AC2): GET /api/admin/inquiry-attachment hands staff one stored attachment of a received mail through a five-minute signed address of the private mail bucket.
 *  - SEC-1047-ATTACHMENT-DENY: anonymous 401; a plain user and an agent 403; a moderator without `page.inquiries_support` on a support inquiry, without `page.inquiries_sales` on a sales one
 *    403; a reply of another inquiry, an index past the list, a row without `key`, a key under another inquiry 404; none of them reaches R2.
 *  - SEC-1047-ATTACHMENT-ALLOW: an administrator, and a moderator with the page key of the inquiry's mailbox, get 302 to the signed address with `Cache-Control: no-store` and
 *    `Referrer-Policy: no-referrer`.
 *  - a malformed or extra query parameter is 400 before any read; a failed read and a failed signature are 500; no log line holds a key, an address or a URL.
 * The route, the staff guard (`checkStaff`) and the permission read are real; the doubles are the session (`requireViewer`), the database (in memory) and the signer of the mail bucket.
 * Every value is synthetic.
 */
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

type Viewer = { ok: true; userId: string; role: string } | { ok: false; reason: 'unauthenticated' | 'lookup_failed' }
const state = vi.hoisted(() => ({
  viewer: { ok: false, reason: 'unauthenticated' } as { ok: true; userId: string; role: string } | { ok: false; reason: 'unauthenticated' | 'lookup_failed' },
  /** the read of this table fails */
  failRead: null as string | null,
  /** the tables read, in order */
  reads: [] as string[],
  presigned: [] as string[],
  failPresign: false,
}))

vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => state.viewer }))

let db = createFakeDb()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => {
      state.reads.push(t)
      if (state.failRead === t) {
        const failing: Record<string, unknown> = {}
        for (const k of ['select', 'eq']) failing[k] = () => failing
        failing.maybeSingle = async () => ({ data: null, error: { code: 'XX000', message: 'MARKER-READ' } })
        failing.single = failing.maybeSingle
        return failing
      }
      return db.client.from(t)
    },
  }),
}))

vi.mock('@/lib/media/r2', () => ({
  presignMailGet: vi.fn(async (key: string) => {
    state.presigned.push(key)
    if (state.failPresign) throw new Error(`MARKER-PRESIGN ${key}`)
    return `https://0123456789abcdef.r2.cloudflarestorage.com/lero-test-mail/${key}?X-Amz-Expires=300&X-Amz-Signature=deadbeef`
  }),
}))

import { GET } from '../route'

const SUPPORT = '3f1c2a54-9d0e-4c43-8d7a-0e5b1a6c7d21'
const SALES = '5b2d3c65-0e1f-4d54-9e8b-1f6c2b7d8e32'
const REPLY = '7d4f5e87-2a3b-4f76-8a0d-3b8e4d9f0a54'
const SALES_REPLY = '8e5a6f98-3b4c-4a87-9b1e-4c9f5e0a1b65'
const FILE = (inquiry: string, n: number) => `mail/${inquiry}/0f8e4c1a-2b3d-4e5f-9a6b-7c8d9e0f1a2${n}`

const ADMIN: Viewer = { ok: true, userId: 'u-admin', role: 'admin' }
const MODERATOR: Viewer = { ok: true, userId: 'u-mod', role: 'moderator' }

function seed(moderatorKeys: string[] = []) {
  db = createFakeDb({
    contact_inquiries: [
      {
        id: SUPPORT, target_mailbox: 'support@lero.al', attachments: [
          { filename: 'photo.png', size: 10, content_type: 'image/png', key: FILE(SUPPORT, 0), preview: true },
          { filename: 'old.pdf', size: 10, content_type: 'application/pdf' },
          { filename: 'crafted.pdf', size: 10, content_type: 'application/pdf', key: FILE(SALES, 1), preview: true },
          { filename: 'not-a-uuid.pdf', size: 10, content_type: 'application/pdf', key: `mail/${SUPPORT}/plan.pdf`, preview: true },
          { filename: 'other-bucket.pdf', size: 10, content_type: 'application/pdf', key: `inbound/${SUPPORT}/0f8e4c1a-2b3d-4e5f-9a6b-7c8d9e0f1a2b`, preview: true },
        ],
      },
      { id: SALES, target_mailbox: 'sales@lero.al', attachments: [{ filename: 'offer.pdf', size: 10, content_type: 'application/pdf', key: FILE(SALES, 0), preview: true }] },
    ],
    contact_inquiry_replies: [
      { id: REPLY, inquiry_id: SUPPORT, attachments: [{ filename: 'id.jpg', size: 10, content_type: 'image/jpeg', key: FILE(SUPPORT, 5), preview: true }] },
      { id: SALES_REPLY, inquiry_id: SALES, attachments: [{ filename: 'sales.jpg', size: 10, content_type: 'image/jpeg', key: FILE(SALES, 6), preview: true }] },
    ],
    role_permissions: moderatorKeys.map((key) => ({ role: 'moderator', permission_key: key, allowed: true })),
  })
}

const call = (query: string) => GET(new NextRequest(`http://localhost/api/admin/inquiry-attachment?${query}`))

let logs: ReturnType<typeof vi.spyOn>[] = []
beforeEach(() => {
  seed()
  state.viewer = { ok: false, reason: 'unauthenticated' }
  state.failRead = null
  state.reads.length = 0
  state.presigned.length = 0
  state.failPresign = false
  logs = (['log', 'info', 'warn', 'error'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}))
})
afterEach(() => {
  // no log line, of any outcome, holds a key, an address or a URL
  const logged = JSON.stringify(logs.map((spy) => spy.mock.calls))
  for (const secret of ['mail/', 'http', 'r2.cloudflarestorage', 'X-Amz', 'MARKER-PRESIGN', SUPPORT, SALES]) expect(logged).not.toContain(secret)
  vi.restoreAllMocks()
})

const inquiryRead = () => state.reads.filter((t) => t.startsWith('contact_'))

describe('SEC-1047-ATTACHMENT-DENY', () => {
  it('[SEC-1047-ATTACHMENT-DENY] an anonymous caller gets 401 before any read', async () => {
    const res = await call(`inquiry=${SUPPORT}&n=0`)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthenticated' })
    expect(state.reads).toEqual([])
    expect(state.presigned).toEqual([])
  })

  it.each([['a plain user', 'user'], ['an agent', 'agent'], ['an account without a role', null]])('[SEC-1047-ATTACHMENT-DENY] %s gets 403 before any read', async (_l, role) => {
    state.viewer = { ok: true, userId: 'u-1', role: role as string }
    const res = await call(`inquiry=${SUPPORT}&n=0`)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'forbidden' })
    expect(inquiryRead()).toEqual([])
    expect(state.presigned).toEqual([])
  })

  it('[SEC-1047-ATTACHMENT-DENY] a failed account lookup is 403', async () => {
    state.viewer = { ok: false, reason: 'lookup_failed' }
    expect((await call(`inquiry=${SUPPORT}&n=0`)).status).toBe(403)
    expect(state.presigned).toEqual([])
  })

  it('[SEC-1047-ATTACHMENT-DENY] a moderator without page.inquiries_support gets 403 on a support inquiry and its reply (holding the sales key)', async () => {
    seed(['page.inquiries_sales'])
    state.viewer = MODERATOR
    expect((await call(`inquiry=${SUPPORT}&n=0`)).status).toBe(403)
    expect((await call(`inquiry=${SUPPORT}&n=0&reply=${REPLY}`)).status).toBe(403)
    expect(state.presigned).toEqual([])
  })

  it('[SEC-1047-ATTACHMENT-DENY] a moderator without page.inquiries_sales gets 403 on a sales inquiry and its reply (holding the support key)', async () => {
    seed(['page.inquiries_support'])
    state.viewer = MODERATOR
    expect((await call(`inquiry=${SALES}&n=0`)).status).toBe(403)
    expect((await call(`inquiry=${SALES}&n=0&reply=${SALES_REPLY}`)).status).toBe(403)
    expect(state.presigned).toEqual([])
  })

  it('[SEC-1047-ATTACHMENT-DENY] a moderator with no key at all gets 403', async () => {
    state.viewer = MODERATOR
    expect((await call(`inquiry=${SUPPORT}&n=0`)).status).toBe(403)
    expect(state.presigned).toEqual([])
  })

  it.each([
    ['a reply of another inquiry', `inquiry=${SUPPORT}&n=0&reply=${SALES_REPLY}`],
    ['a reply that does not exist', `inquiry=${SUPPORT}&n=0&reply=9f6b7a09-4c5d-4b98-8c2f-5d0a6f1b2c76`],
    ['an inquiry that does not exist', 'inquiry=9f6b7a09-4c5d-4b98-8c2f-5d0a6f1b2c76&n=0'],
    ['an index past the list', `inquiry=${SUPPORT}&n=5`],
    ['an index past the list of a reply', `inquiry=${SUPPORT}&n=1&reply=${REPLY}`],
    ['a row without key', `inquiry=${SUPPORT}&n=1`],
    ['a key under another inquiry', `inquiry=${SUPPORT}&n=2`],
    ['a key whose name is not a uuid v4', `inquiry=${SUPPORT}&n=3`],
    ['a key outside mail/', `inquiry=${SUPPORT}&n=4`],
  ])('[SEC-1047-ATTACHMENT-DENY] %s is 404 and nothing is signed (an administrator asks)', async (_l, query) => {
    state.viewer = ADMIN
    const res = await call(query)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'not_found' })
    expect(state.presigned).toEqual([])
  })

  it('[SEC-1047-ATTACHMENT-DENY] the reply is read by its id AND its inquiry', async () => {
    state.viewer = ADMIN
    await call(`inquiry=${SUPPORT}&n=0&reply=${REPLY}`)
    const replyRead = db.log.find((entry) => entry.table === 'contact_inquiry_replies')
    expect(replyRead?.filters).toEqual(expect.arrayContaining([['id', 'eq', REPLY], ['inquiry_id', 'eq', SUPPORT]]))
  })
})

describe('the query is checked before any read', () => {
  it.each([
    ['no inquiry', 'n=0'],
    ['no index', `inquiry=${SUPPORT}`],
    ['an inquiry that is not a uuid', 'inquiry=inq-1&n=0'],
    ['an upper-case uuid', `inquiry=${SUPPORT.toUpperCase()}&n=0`],
    ['an index of 20', `inquiry=${SUPPORT}&n=20`],
    ['a negative index', `inquiry=${SUPPORT}&n=-1`],
    ['an index with a leading zero', `inquiry=${SUPPORT}&n=01`],
    ['an index with a space', `inquiry=${SUPPORT}&n=1%20`],
    ['a reply that is not a uuid', `inquiry=${SUPPORT}&n=0&reply=r1`],
    ['an empty reply', `inquiry=${SUPPORT}&n=0&reply=`],
    ['an extra parameter', `inquiry=${SUPPORT}&n=0&key=${encodeURIComponent(FILE(SUPPORT, 0))}`],
    ['a repeated parameter', `inquiry=${SUPPORT}&n=0&n=1`],
    ['a repeated inquiry', `inquiry=${SALES}&inquiry=${SUPPORT}&n=0`],
  ])('%s is 400 before any read', async (_l, query) => {
    state.viewer = ADMIN
    const res = await call(query)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_query' })
    expect(inquiryRead()).toEqual([])
    expect(state.presigned).toEqual([])
  })
})

describe('failures are 500, never a link', () => {
  it.each(['contact_inquiries', 'contact_inquiry_replies'])('a failed read of %s is 500', async (table) => {
    state.viewer = ADMIN
    state.failRead = table
    const res = await call(`inquiry=${SUPPORT}&n=0&reply=${REPLY}`)
    expect(res.status).toBe(500)
    expect(res.headers.get('location')).toBeNull()
    expect(state.presigned).toEqual([])
  })

  it('a failed signature is 500', async () => {
    state.viewer = ADMIN
    state.failPresign = true
    const res = await call(`inquiry=${SUPPORT}&n=0`)
    expect(res.status).toBe(500)
    expect(res.headers.get('location')).toBeNull()
  })

  it('a failed permission read is 403 (fail closed)', async () => {
    seed(['page.inquiries_support'])
    state.viewer = MODERATOR
    state.failRead = 'role_permissions'
    expect((await call(`inquiry=${SUPPORT}&n=0`)).status).toBe(403)
    expect(state.presigned).toEqual([])
  })
})

describe('SEC-1047-ATTACHMENT-ALLOW', () => {
  const expectRedirect = (res: Response, key: string) => {
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`https://0123456789abcdef.r2.cloudflarestorage.com/lero-test-mail/${key}?X-Amz-Expires=300&X-Amz-Signature=deadbeef`)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
  }

  it('[SEC-1047-ATTACHMENT-ALLOW] an administrator gets 302 to the signed address of the file of a support and a sales inquiry and of a reply', async () => {
    state.viewer = ADMIN
    expectRedirect(await call(`inquiry=${SUPPORT}&n=0`), FILE(SUPPORT, 0))
    expectRedirect(await call(`inquiry=${SALES}&n=0`), FILE(SALES, 0))
    expectRedirect(await call(`inquiry=${SUPPORT}&n=0&reply=${REPLY}`), FILE(SUPPORT, 5))
    expect(state.presigned).toEqual([FILE(SUPPORT, 0), FILE(SALES, 0), FILE(SUPPORT, 5)])
  })

  it('[SEC-1047-ATTACHMENT-ALLOW] a moderator with page.inquiries_support opens a support file; with page.inquiries_sales a sales file', async () => {
    state.viewer = MODERATOR
    seed(['page.inquiries_support'])
    expectRedirect(await call(`inquiry=${SUPPORT}&n=0&reply=${REPLY}`), FILE(SUPPORT, 5))
    seed(['page.inquiries_sales'])
    expectRedirect(await call(`inquiry=${SALES}&n=0`), FILE(SALES, 0))
    expectRedirect(await call(`inquiry=${SALES}&n=0&reply=${SALES_REPLY}`), FILE(SALES, 6))
  })
})
