import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * A short-lived capability that lets ONE caller upload ONE file for ONE record (Task 923 Revision 7, findings S3 / S6).
 *
 * Agent registration creates the agency before the person has a session, and the logo is uploaded straight after. The upload route used to accept any request
 * that named a company id (no session, service-role client), so anyone could replace any company's logo. Now `createCompanyAction` returns a grant bound to the
 * NEW company's id and a deadline, signed with a key only the server holds, and the route accepts it (or a staff session) and nothing else. A duplicate (an agency
 * that already existed) gets no grant, so a stranger cannot change an existing agency's logo by registering with its name.
 *
 * Format: `<expiresAtMs>.<hex hmac>` over `kind|id|expiresAtMs`. The key is derived from the service-role key (never sent to a client); the comparison is constant-time.
 */
export type GrantKind = 'company-logo'

export const GRANT_TTL_MS = 15 * 60 * 1000

function key(): string {
  const root = process.env.UPLOAD_GRANT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!root) throw new Error('upload_grant_secret_missing')
  return root
}

function sign(kind: GrantKind, id: string, expiresAt: number): string {
  return createHmac('sha256', key()).update(`upload-grant|v1|${kind}|${id}|${expiresAt}`).digest('hex')
}

export function createUploadGrant(kind: GrantKind, id: string, now = Date.now(), ttlMs = GRANT_TTL_MS): string {
  const expiresAt = now + ttlMs
  return `${expiresAt}.${sign(kind, id, expiresAt)}`
}

export function verifyUploadGrant(kind: GrantKind, id: string, token: string | null | undefined, now = Date.now()): boolean {
  if (!token || typeof token !== 'string' || token.length > 200) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const expiresAt = Number(token.slice(0, dot))
  if (!Number.isSafeInteger(expiresAt) || expiresAt < now) return false
  const given = Buffer.from(token.slice(dot + 1), 'utf8')
  const expected = Buffer.from(sign(kind, id, expiresAt), 'utf8')
  return given.length === expected.length && timingSafeEqual(given, expected)
}
