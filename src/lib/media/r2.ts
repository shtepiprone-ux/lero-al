import 'server-only'
import { AwsClient, AwsV4Signer } from 'aws4fetch'

/**
 * The server's Cloudflare R2 client (Task 1038). R2 speaks the S3 protocol; `aws4fetch` signs every call with AWS Signature V4 using the `R2_*` variables of the server environment.
 * This module is the only code that reads them. It makes calls to `R2_ENDPOINT` only, for keys it has checked (`assertKey`), so an address that comes from a browser can never
 * make the server call another host (Server_Side_Request_Forgery_Prevention).
 *
 * Cloudflare (read 2026-11-25): a presigned URL supports GET, HEAD, PUT and DELETE, expires in 1 second to 7 days, and cannot be used with a custom domain, so the PUT goes to the
 * S3 endpoint and the photos are read from the public address of the bucket (`R2_PUBLIC_URL`); a signed `Content-Type` that differs from the one the browser sends is refused with
 * `SignatureDoesNotMatch`; the region is `auto`.
 *
 * Two stores (Task 1046, owner decision O1046-1): `'listing'`, the public bucket of listing photos (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`), and `'mail'`, the private
 * bucket of received mail (`R2_MAIL_ACCESS_KEY_ID`, `R2_MAIL_SECRET_ACCESS_KEY`, `R2_MAIL_BUCKET_NAME`, a token for that bucket only); both on `R2_ENDPOINT`. A store never reads the
 * other store's variables, so one token never reaches the other bucket (Key_Management: one key, one purpose).
 */

/** what the browser sends, and what the CDN keeps (owner decision O1038-5): a visitor's browser keeps a photo an hour, the CDN a year until a purge */
export const CACHE_CONTROL = 'public, max-age=3600, s-maxage=31536000'
/** how long a presigned PUT address is valid: long enough for one photo on a slow phone, short enough that a leaked address is of little use */
export const PRESIGN_EXPIRES_SECONDS = 300
/** how long a presigned GET address of a stored mail attachment is valid (Task 1047): the staff route redirects to it at once, so a leaked address is of little use */
export const MAIL_GET_EXPIRES_SECONDS = 300
/** every stored mail attachment: no shared cache keeps it, and a browser keeps no copy (Web_Cache_Security) */
const MAIL_CACHE_CONTROL = 'private, no-store'

/** the server has no complete R2 configuration: nothing is signed or called */
export class R2ConfigError extends Error {
  constructor() {
    super('R2 is not configured')
    this.name = 'R2ConfigError'
  }
}

function value(name: string): string {
  const text = process.env[name]
  if (!text) throw new R2ConfigError()
  return text
}

/** an object of the mail bucket is longer than the caller's limit; its bytes were not kept */
export class R2TooLargeError extends Error {
  constructor() {
    super('R2 object too large')
    this.name = 'R2TooLargeError'
  }
}

type Store = 'listing' | 'mail'

const VARIABLES = {
  listing: { accessKeyId: 'R2_ACCESS_KEY_ID', secretAccessKey: 'R2_SECRET_ACCESS_KEY', bucket: 'R2_BUCKET_NAME' },
  mail: { accessKeyId: 'R2_MAIL_ACCESS_KEY_ID', secretAccessKey: 'R2_MAIL_SECRET_ACCESS_KEY', bucket: 'R2_MAIL_BUCKET_NAME' },
} as const

function settings(store: Store) {
  const names = VARIABLES[store]
  const endpoint = new URL(value('R2_ENDPOINT'))
  if (endpoint.protocol !== 'https:') throw new R2ConfigError()
  return { accessKeyId: value(names.accessKeyId), secretAccessKey: value(names.secretAccessKey), origin: endpoint.origin, bucket: value(names.bucket) }
}

/** the key rule: letters, digits, `.`, `_`, `-` in segments joined by one `/`; no empty, `.` or `..` segment, no leading slash, no query, fragment, backslash or percent sign */
const KEY = /^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/

function assertKey(key: string): void {
  if (typeof key !== 'string' || key.length === 0 || key.length > 1024 || !KEY.test(key) || key.split('/').some((segment) => segment === '.' || segment === '..')) {
    throw new Error('R2 key refused')
  }
}

function objectUrl(key: string, store: Store): { url: string; settings: ReturnType<typeof settings> } {
  assertKey(key)
  const s = settings(store)
  return { url: `${s.origin}/${s.bucket}/${key}`, settings: s }
}

function client(s: ReturnType<typeof settings>): AwsClient {
  return new AwsClient({ accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey, service: 's3', region: 'auto', retries: 2 })
}

/**
 * A presigned PUT address for one object, valid `PRESIGN_EXPIRES_SECONDS`. `Content-Type`, `Content-Length` and `Cache-Control` are SIGNED headers, so R2 accepts the upload only when the
 * browser sends exactly this type, exactly this many bytes and this cache policy; a browser sets `Content-Length` itself from the blob it sends.
 */
export async function presignPut(key: string, contentType: string, contentLength: number): Promise<string> {
  if (contentType !== 'image/webp' && contentType !== 'image/jpeg') throw new Error('R2 content type refused')
  if (!Number.isSafeInteger(contentLength) || contentLength < 1) throw new Error('R2 content length refused')
  const { url, settings: s } = objectUrl(key, 'listing')
  const address = new URL(url)
  address.searchParams.set('X-Amz-Expires', String(PRESIGN_EXPIRES_SECONDS))
  const signer = new AwsV4Signer({
    method: 'PUT',
    url: address.toString(),
    headers: { 'Content-Type': contentType, 'Content-Length': String(contentLength), 'Cache-Control': CACHE_CONTROL },
    accessKeyId: s.accessKeyId,
    secretAccessKey: s.secretAccessKey,
    service: 's3',
    region: 'auto',
    signQuery: true,
    allHeaders: true,   // `aws4fetch` leaves `Content-Type` and `Content-Length` unsigned unless asked
  })
  return (await signer.sign()).url.toString()
}

/** the length and type R2 holds for a key, or null when there is no such object; any other answer throws (an unreadable bucket is never read as "missing") */
export async function headObject(key: string): Promise<{ contentLength: number; contentType: string | null } | null> {
  const { url, settings: s } = objectUrl(key, 'listing')
  const res = await client(s).fetch(url, { method: 'HEAD' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`R2 HEAD failed: ${res.status}`)
  const length = Number(res.headers.get('content-length'))
  return { contentLength: Number.isFinite(length) ? length : 0, contentType: res.headers.get('content-type') }
}

/** the first `length` bytes of an object (a ranged GET), to read what the file really is */
export async function readHead(key: string, length: number): Promise<Uint8Array> {
  if (!Number.isSafeInteger(length) || length < 1 || length > 4096) throw new Error('R2 range refused')
  const { url, settings: s } = objectUrl(key, 'listing')
  const res = await client(s).fetch(url, { method: 'GET', headers: { Range: `bytes=0-${length - 1}` } })
  if (res.status !== 200 && res.status !== 206) throw new Error(`R2 GET failed: ${res.status}`)
  return new Uint8Array(await res.arrayBuffer()).slice(0, length)
}

async function deleteIn(store: Store, keys: readonly string[]): Promise<void> {
  const calls = keys.map((key) => ({ key, ...objectUrl(key, store) }))
  const outcomes = await Promise.allSettled(calls.map(async ({ url, settings: s }) => {
    const res = await client(s).fetch(url, { method: 'DELETE' })
    if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE failed: ${res.status}`)
  }))
  const failed = outcomes.filter((outcome) => outcome.status === 'rejected').length
  if (failed > 0) throw new Error(`R2 DELETE failed for ${failed} of ${keys.length} objects`)
}

/** deletes the objects of the listing bucket; one that is already gone is not a failure, any other failure throws after every delete was tried */
export async function deleteObjects(keys: readonly string[]): Promise<void> {
  await deleteIn('listing', keys)
}

/** deletes the objects of the mail bucket, as `deleteObjects` does for the listing bucket */
export async function deleteMailObjects(keys: readonly string[]): Promise<void> {
  await deleteIn('mail', keys)
}

/**
 * Stores one attachment of a received mail in the mail bucket (Task 1047). Cloudflare does not list the `response-content-*` overrides of GetObject, so the type and the disposition
 * the browser gets are fixed here, at PUT time; `Cache-Control: private, no-store` goes with them. A non-2xx answer throws.
 */
export async function putMailObject(key: string, bytes: Uint8Array<ArrayBuffer>, options: { contentType: string; contentDisposition: string }): Promise<void> {
  const { url, settings: s } = objectUrl(key, 'mail')
  const res = await client(s).fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': options.contentType, 'Content-Disposition': options.contentDisposition, 'Cache-Control': MAIL_CACHE_CONTROL },
    body: bytes,
  })
  if (!res.ok) throw new Error(`R2 PUT failed: ${res.status}`)
}

/** A presigned GET address for one object of the mail bucket, valid `MAIL_GET_EXPIRES_SECONDS` (Task 1047): only the staff route hands it out, after its own checks. */
export async function presignMailGet(key: string): Promise<string> {
  const { url, settings: s } = objectUrl(key, 'mail')
  const address = new URL(url)
  address.searchParams.set('X-Amz-Expires', String(MAIL_GET_EXPIRES_SECONDS))
  const signer = new AwsV4Signer({
    method: 'GET',
    url: address.toString(),
    accessKeyId: s.accessKeyId,
    secretAccessKey: s.secretAccessKey,
    service: 's3',
    region: 'auto',
    signQuery: true,
  })
  return (await signer.sign()).url.toString()
}

/**
 * The bytes of an object of the mail bucket, or null when there is no such object; any other answer throws. A declared length above `maxBytes` throws `R2TooLargeError` before the
 * body is read, and a body that grows past `maxBytes` throws it as soon as it does, so no more than `maxBytes` bytes are ever kept.
 */
export async function getMailObject(key: string, maxBytes: number): Promise<Uint8Array | null> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('R2 limit refused')
  const { url, settings: s } = objectUrl(key, 'mail')
  const res = await client(s).fetch(url, { method: 'GET' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`R2 GET failed: ${res.status}`)
  const declared = Number(res.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel()
    throw new R2TooLargeError()
  }
  if (!res.body) return new Uint8Array(0)
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    total += read.value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new R2TooLargeError()
    }
    chunks.push(read.value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

function publicOrigin(): string {
  const base = new URL(value('R2_PUBLIC_URL'))
  if (base.protocol !== 'https:') throw new R2ConfigError()
  return base.origin
}

/** the public address of an object: the bucket's custom domain and the key */
export function publicUrl(key: string): string {
  assertKey(key)
  return `${publicOrigin()}/${key}`
}

/**
 * The key of an address on the public host of the bucket, or null for anything else: another host, a scheme other than https, a port, credentials, a query, a fragment, a backslash, an
 * encoded dot or separator, a `.` or `..` segment, an empty segment. The text is judged as written (the URL parser would fold a `..` segment away and hide it).
 */
export function keyFromPublicUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return null
  if (/[?#\\]|%2e|%2f|%5c/i.test(raw)) return null
  let origin: string
  let url: URL
  try {
    origin = publicOrigin()
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.origin !== origin || url.username || url.password || raw !== `${origin}${url.pathname}`) return null
  const key = url.pathname.slice(1)
  try {
    assertKey(key)
  } catch {
    return null
  }
  return key
}
