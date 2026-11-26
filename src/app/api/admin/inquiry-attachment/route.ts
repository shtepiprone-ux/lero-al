import { NextResponse, type NextRequest } from 'next/server'
import { checkStaff } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { presignMailGet } from '@/lib/media/r2'
import type { InquiryAttachment } from '@/types/database'

// GET /api/admin/inquiry-attachment?inquiry=<uuid>&n=<0-19>[&reply=<uuid>] (Task 1047)
//
// Opens one stored attachment of a received mail for staff who may see that inquiry: a redirect to a five-minute signed GET of the private mail bucket. The browser names the
// inquiry, the reply and the index only; the key comes from the row and must sit under `mail/<that inquiry>/`. In this order: the staff role (401, 403), the query (400), the rows
// (500, 404), the page key of the inquiry's mailbox (403, the pages' split: a mailbox containing "sales" is the sales page), the key (404, no R2 call), the signature (500).
// Log lines carry the outcome code only: never a key, an address or an id.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const INDEX = /^(?:[0-9]|1[0-9])$/
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const PARAMETERS = new Set(['inquiry', 'n', 'reply'])

function refuse(status: 400 | 401 | 403 | 404 | 500, error: string): NextResponse {
  if (status === 500) console.error('[inquiry-attachment]', { outcome: error })
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** the query, when it is exactly `inquiry`, `n` and an optional `reply`, each once and of its pattern; else null */
function readQuery(params: URLSearchParams): { inquiry: string; n: number; reply: string | null } | null {
  const names = [...params.keys()]
  if (names.some((name) => !PARAMETERS.has(name)) || new Set(names).size !== names.length) return null
  const inquiry = params.get('inquiry')
  const n = params.get('n')
  const reply = params.get('reply')
  if (inquiry === null || !UUID.test(inquiry) || n === null || !INDEX.test(n) || (reply !== null && !UUID.test(reply))) return null
  return { inquiry, n: Number(n), reply }
}

export async function GET(request: NextRequest) {
  const staff = await checkStaff()
  if (!staff.ok) return refuse(staff.reason === 'unauthenticated' ? 401 : 403, staff.reason)

  const query = readQuery(request.nextUrl.searchParams)
  if (!query) return refuse(400, 'invalid_query')

  const db = createAdminClient()
  const inquiry = await db.from('contact_inquiries').select('id, target_mailbox, attachments').eq('id', query.inquiry).maybeSingle()
  if (inquiry.error) return refuse(500, 'read_failed')
  if (!inquiry.data) return refuse(404, 'not_found')
  let attachments: unknown = inquiry.data.attachments
  if (query.reply !== null) {
    // the reply is read by its id AND its inquiry: a reply of another conversation is not found
    const reply = await db.from('contact_inquiry_replies').select('attachments').eq('id', query.reply).eq('inquiry_id', query.inquiry).maybeSingle()
    if (reply.error) return refuse(500, 'read_failed')
    if (!reply.data) return refuse(404, 'not_found')
    attachments = reply.data.attachments
  }

  const mailbox = typeof inquiry.data.target_mailbox === 'string' ? inquiry.data.target_mailbox : ''
  const allowed = await checkStaff({ permission: /sales/i.test(mailbox) ? 'page.inquiries_sales' : 'page.inquiries_support' })
  if (!allowed.ok) return refuse(403, 'forbidden')

  const file = Array.isArray(attachments) ? (attachments[query.n] as InquiryAttachment | undefined) : undefined
  const key = file?.key
  const prefix = `mail/${query.inquiry}/`
  if (typeof key !== 'string' || !key.startsWith(prefix) || !UUID_V4.test(key.slice(prefix.length))) return refuse(404, 'not_found')

  let location: string
  try {
    location = await presignMailGet(key)
  } catch {
    return refuse(500, 'presign_failed')
  }
  return new NextResponse(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
}
