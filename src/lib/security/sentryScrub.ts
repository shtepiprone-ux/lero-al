/**
 * Removes credentials from an error report, a streamed span and a log before it leaves for Sentry (Task 923 Revision 7, finding S57; Task 923 R66 (j)).
 *
 * The three Sentry configurations used to set `sendDefaultPii: true`, which attaches the request's headers and cookies to every report. The cookies of a signed-in person
 * carry their Supabase access and refresh tokens, and the address of a sign-in / recovery link carries a one-time token; a report that holds them in a third party's
 * database is a way to take over an account. Since R66 (j) default PII is not collected in all three configurations (`sendDefaultPii: false`; since Sentry 11, which removed that
 * option, the `dataCollection` baseline `SENTRY_DATA_COLLECTION` below), and this module also walks the places where the
 * application itself puts data (`extra`, `contexts`, the exception values, the spans, the breadcrumbs, the tags and the log attributes) at any depth: a value under a key
 * that names a credential is replaced, and a text that holds a credential parameter is blanked, also when the text is percent-encoded.
 */
const SENSITIVE_HEADERS = new Set(['cookie', 'set-cookie', 'authorization', 'proxy-authorization', 'x-api-key', 'apikey', 'x-supabase-auth', 'x-csrf-token'])
/** object keys whose value is a credential, wherever they sit in the report (compared in lower case) */
const SENSITIVE_KEYS = new Set(['token', 'access_token', 'refresh_token', 'token_hash', 'password', 'code', 'secret', 'authorization', 'cookie', 'apikey', 'id_token', 'new_password', 'api_key', 'code_verifier'])
const SENSITIVE_PARAM = /((?:^|[?&#;])(?:access_token|refresh_token|id_token|token|token_hash|code|code_verifier|apikey|api_key|password|new_password|secret|key)=)[^&#;\s]*/gi
/** the unambiguous credential names inside free text (a log line, an error message, JSON written into a string): `name=value`, `name: value`, `"name":"value"` */
const FREE_TEXT_PARAM = /(["']?\b(?:access_token|refresh_token|id_token|token_hash|code_verifier|api_key|apikey|new_password|password|secret|authorization)["']?\s*[=:]\s*["']?)[^\s"'&;,}]+/gi
const REDACTED = '[redacted]'
const MAX_DEPTH = 20

const denied = () => ({ deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] })

/**
 * What the three Sentry configurations collect (Task 987). Sentry 11 removed `sendDefaultPii`, and an unset `dataCollection` collects cookies, request bodies, database values,
 * queue arguments and the IP address. This is the baseline that the Sentry 11 migration guide (MIGRATION.md, "If you want to keep the v10 default behavior") names for keeping the v10
 * default, which `sendDefaultPii: false` was; it is set in all three configurations.
 */
export const SENTRY_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: denied(), response: denied() },
  httpBodies: [],
  urlQueryParams: denied(),
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
}

function blank(text: string): string {
  return text.replace(SENSITIVE_PARAM, `$1${REDACTED}`).replace(FREE_TEXT_PARAM, `$1${REDACTED}`)
}

/** the text with up to two layers of percent-encoding removed, or the text itself when it does not decode */
function decoded(text: string): string {
  let out = text
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(out)
      if (next === out) break
      out = next
    } catch {
      break
    }
  }
  return out
}

function scrubText(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const plain = decoded(value)
  // a credential that is only visible once the text is decoded (`%26token_hash%3D…`): the decoded, blanked text replaces it
  if (plain !== value) {
    const blankedPlain = blank(plain)
    if (blankedPlain !== plain) return blankedPlain
  }
  return blank(value)
}

/** walks an object or array in place: a credential key gets the redaction, every text is scrubbed, anything else is left as it is */
function scrubDeep(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (typeof value === 'string') return scrubText(value)
  if (value === null || typeof value !== 'object' || depth > MAX_DEPTH || seen.has(value)) return value
  seen.add(value)
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = scrubDeep(value[i], seen, depth + 1)
    return value
  }
  const record = value as Record<string, unknown>
  for (const key of Object.keys(record)) {
    record[key] = isCredentialKey(key) && record[key] !== undefined && record[key] !== null ? REDACTED : scrubDeep(record[key], seen, depth + 1)
  }
  return value
}

/**
 * Sentry 11 sends a request or response header as the span attribute `http.request.header.<name>` / `http.response.header.<name>` (`@sentry/core` `httpHeadersToSpanAttributes`, lower-case
 * name). Such a key is judged as the header `<name>`: a credential header is redacted wherever the walk meets it, and a key that names a credential directly is redacted as before.
 */
const HEADER_ATTRIBUTE = /^http\.(?:request|response)\.header\.(.+)$/

function isCredentialKey(key: string): boolean {
  const lower = key.toLowerCase()
  if (SENSITIVE_KEYS.has(lower)) return true
  const header = HEADER_ATTRIBUTE.exec(lower)
  return header !== null && (SENSITIVE_HEADERS.has(header[1]) || SENSITIVE_KEYS.has(header[1]))
}

interface ReportLike {
  request?: {
    url?: string
    query_string?: unknown
    headers?: Record<string, unknown>
    cookies?: unknown
    data?: unknown
  }
  breadcrumbs?: { data?: Record<string, unknown>; message?: string }[]
}

/** the parts of an event that carry the application's own data; each one is walked at any depth */
const DEEP_PARTS = ['extra', 'contexts', 'exception', 'spans', 'tags', 'breadcrumbs'] as const

export function scrubSentryEvent<T extends ReportLike>(event: T): T {
  const request = event.request
  if (request) {
    delete request.cookies
    // a request body may hold a password or a token; it is not needed to find the fault
    delete request.data
    if (request.headers) {
      for (const name of Object.keys(request.headers)) {
        if (SENSITIVE_HEADERS.has(name.toLowerCase())) delete request.headers[name]
        else request.headers[name] = scrubText(request.headers[name])
      }
    }
    if (typeof request.url === 'string') request.url = scrubText(request.url) as string
    if (typeof request.query_string === 'string') request.query_string = scrubText(request.query_string)
    else if (request.query_string && typeof request.query_string === 'object') delete request.query_string
  }
  const record = event as unknown as Record<string, unknown>
  const seen = new WeakSet<object>()
  for (const part of DEEP_PARTS) if (record[part] !== undefined) record[part] = scrubDeep(record[part], seen, 0)
  for (const textPart of ['message', 'transaction'] as const) if (typeof record[textPart] === 'string') record[textPart] = scrubText(record[textPart])
  return event
}

interface LogLike {
  message?: unknown
  attributes?: Record<string, unknown>
}

/** the same for a log that is about to be sent (`beforeSendLog`): its message and its attributes */
export function scrubSentryLog<T extends LogLike>(log: T): T {
  const record = log as unknown as Record<string, unknown>
  const seen = new WeakSet<object>()
  if (typeof record.message === 'string') record.message = scrubText(record.message)
  if (record.attributes && typeof record.attributes === 'object') record.attributes = scrubDeep(record.attributes, seen, 0)
  return log
}

interface SpanLike {
  name?: unknown
  attributes?: Record<string, unknown>
  links?: { attributes?: Record<string, unknown> }[]
}

/**
 * The same for a streamed span that is about to be sent (`beforeSendSpan`, Task 987 Revision 1): Sentry 11 streams spans and ignores `beforeSendTransaction` then (MIGRATION.md,
 * "Replacing `beforeSendTransaction`"). The span's name, its attributes at any depth and the attributes of its links are scrubbed; the identifiers, the timestamps and the status stay.
 */
export function scrubSentrySpan<T extends SpanLike>(span: T): T {
  const record = span as unknown as Record<string, unknown>
  const seen = new WeakSet<object>()
  if (typeof record.name === 'string') record.name = scrubText(record.name)
  if (record.attributes && typeof record.attributes === 'object') record.attributes = scrubDeep(record.attributes, seen, 0)
  if (Array.isArray(record.links)) {
    for (const link of record.links as Record<string, unknown>[]) {
      if (link && typeof link === 'object' && link.attributes && typeof link.attributes === 'object') link.attributes = scrubDeep(link.attributes, seen, 0)
    }
  }
  return span
}
