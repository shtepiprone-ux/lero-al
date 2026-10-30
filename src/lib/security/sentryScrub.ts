/**
 * Removes credentials from an error report, a transaction and a log before it leaves for Sentry (Task 923 Revision 7, finding S57; Task 923 R66 (j)).
 *
 * The three Sentry configurations used to set `sendDefaultPii: true`, which attaches the request's headers and cookies to every report. The cookies of a signed-in person
 * carry their Supabase access and refresh tokens, and the address of a sign-in / recovery link carries a one-time token; a report that holds them in a third party's
 * database is a way to take over an account. Since R66 (j) `sendDefaultPii` is false in all three configurations, and this module also walks the places where the
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
    record[key] = SENSITIVE_KEYS.has(key.toLowerCase()) && record[key] !== undefined && record[key] !== null ? REDACTED : scrubDeep(record[key], seen, depth + 1)
  }
  return value
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
