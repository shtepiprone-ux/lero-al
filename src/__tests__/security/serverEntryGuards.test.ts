// @vitest-environment node
/**
 * Server entry points must authenticate or say why they are public (Task 923 Revision 7, owner 2026-10-17: the tests must also catch the weak places through which
 * user data can be stolen).
 *
 * Why this is a test and not a review note: every exported async function of a `'use server'` file is a public HTTP endpoint (Next.js builds one for it), whatever the
 * UI does, and every `route.ts` handler is a public URL. A function that uses the service-role client (it bypasses row-level security) with no session check lets
 * an anonymous caller read or write any user's data. This scanner reads the TypeScript syntax tree of every such file and requires, for each exported entry point,
 * EITHER a visible guard (a session or permission check, or a secret / signature check for a machine caller) in its body or in a same-file helper it calls, OR an
 * entry in the allowlist below with the reason it is public by design. A new unguarded endpoint fails CI until someone writes that reason.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { hasDirective } from './directives'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name === 'node_modules' || name === '__tests__') continue; walk(p, acc) } else acc.push(p)
  }
  return acc
}
const rel = (p: string) => relative(ROOT, p).split('\\').join('/')
const files = walk(SRC).filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f)).map((f) => ({ file: rel(f), text: readFileSync(f, 'utf8') }))

/** names whose call in a body is a session / permission / secret / signature check */
const GUARD_NAMES = [
  'getUser', 'getSession', 'resolveSession', 'getCurrentUser', 'requireUser', 'requireAuth', 'requireViewer', 'currentUser',
  'assertPermission', 'assertAdminAccess', 'assertAdmin', 'assertAdminOrMod', 'hasPermission', 'requirePermission', 'requireAdmin',
  'verifyOtp', 'exchangeCodeForSession',
  'timingSafeEqual', 'verifyCronSecret', 'verifyCronRequest', 'verifyHookSignature', 'verifyUploadGrant', 'getStaffRole',
  // the one staff guard of `@/lib/auth/staff` (Task 923 R71 (k)), and the guard of the admin pages
  'checkStaff', 'requireStaffPage',
]
const GUARD_RE = new RegExp(`\\b(${GUARD_NAMES.join('|')})\\b|auth\\.getUser|CRON_SECRET|x-hook-signature`, 'i')

type Entry = { file: string; name: string; guarded: boolean; usesServiceRole: boolean }

function entries(file: string, text: string): Entry[] {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const isRoute = /\/route\.tsx?$/.test(file)
  const useServer = hasDirective(text, 'use server')
  if (!isRoute && !useServer) return []

  const fns = new Map<string, ts.Node>()
  const exported: { name: string; node: ts.Node }[] = []
  const hasExport = (n: ts.Node) => !!(ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
  sf.forEachChild((n) => {
    if (ts.isFunctionDeclaration(n) && n.name) {
      fns.set(n.name.text, n)
      if (hasExport(n)) exported.push({ name: n.name.text, node: n })
    } else if (ts.isVariableStatement(n)) {
      for (const d of n.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
          fns.set(d.name.text, d.initializer)
          if (hasExport(n)) exported.push({ name: d.name.text, node: d.initializer })
        }
      }
    }
  })
  // a guard named only in a comment is not a guard: judge the code, not the prose
  const bodyText = (n: ts.Node) => n.getText(sf).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1')
  // a same-file helper is a guard when its own body calls a guard name
  const guardHelpers = new Set([...fns].filter(([, n]) => GUARD_RE.test(bodyText(n))).map(([k]) => k))
  const out: Entry[] = []
  for (const { name, node } of exported) {
    if (isRoute && !/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(name)) continue
    const b = bodyText(node)
    const calls = [...guardHelpers].some((h) => new RegExp(`\\b${h}\\s*\\(`).test(b))
    out.push({ file, name, guarded: GUARD_RE.test(b) || calls, usesServiceRole: /createAdminClient|SERVICE_ROLE|createServiceClient/.test(b) })
  }
  return out
}

const ALL: Entry[] = files.flatMap((f) => entries(f.file, f.text))

/**
 * Entry points that are public ON PURPOSE. Each needs the reason; "it is only called from our UI" is not a reason (anyone can call it directly).
 * `signed` = authorised by a capability the caller must hold (an upload grant), not by a session.
 */
const PUBLIC_BY_DESIGN: Record<string, string> = {
  'src/app/api/exchange-rate/route.ts#GET': 'public read of published exchange rates (no user data); cached for an hour',
  'src/app/api/listings/route.ts#GET': 'public read of publicly visible listings through the row-level-security client (applyPublicVisibility)',
  'src/app/api/property-types/route.ts#GET': 'public read of the property-type catalogue (no user data)',
  'src/app/api/listings/[slug]/view/route.ts#POST': 'anonymous view counter for a publicly visible listing; deduplicated by a one-way hash; bots filtered',
  'src/app/api/auth/me/route.ts#GET': 'returns the caller\'s own session profile or null (resolveSession is the check)',
  'src/modules/auth/actions/recovery.ts#logPasswordRecoveryRequest': 'writes one structured log line (hashed e-mail) when someone asks for a recovery e-mail; no data is read or sent',
  'src/modules/companies/actions.ts#createCompanyAction': 'agent registration creates the agency before there is a session (see the finding S6: bounded and rate limited)',
  'src/modules/contacts/actions/index.ts#submitContactInquiry': 'public contact form: it must work without a session; it validates its input and is rate limited per sender',
  'src/modules/auth/actions/captcha.ts#signUpWithCaptcha': 'sign-up has no session by definition; the captcha token is verified server-side before Supabase is called',
  'src/modules/auth/actions/captcha.ts#requestPasswordResetWithCaptcha': 'a password-reset request has no session by definition; the captcha token is verified server-side first and the answer is neutral',
  'src/modules/cabinet/actions/index.ts#consumeEmailChangeToken': 'authorised by the one-time secret token in the e-mailed link (only its SHA-256 is stored); it works from any device',
  'src/modules/notifications/lib/mutations.ts#markNotificationRead': `runs on the caller own database client, so row-level security limits the update to the caller own notifications (docs/rls-rules.md)`,
  'src/modules/notifications/lib/mutations.ts#markAllNotificationsRead': `runs on the caller own database client, so row-level security limits the update to the caller own notifications (docs/rls-rules.md)`,
}

describe('every server entry point authenticates or is public by design', () => {
  it('finds the entry points (the scanner is not empty)', () => {
    expect(ALL.length).toBeGreaterThan(40)
    expect(ALL.some((e) => e.file.endsWith('/route.ts'))).toBe(true)
    expect(ALL.some((e) => e.file.includes('/actions/'))).toBe(true)
  })

  it('no unguarded entry point is missing from the allowlist', () => {
    const unguarded = ALL.filter((e) => !e.guarded).map((e) => `${e.file}#${e.name}`).filter((id) => !(id in PUBLIC_BY_DESIGN))
    expect(unguarded, `these server entry points have no visible session / permission / secret check and no reason to be public:\n${unguarded.join('\n')}`).toEqual([])
  })

  it('the allowlist names only entry points that exist (a renamed or deleted entry point leaves the list)', () => {
    const ids = new Set(ALL.map((e) => `${e.file}#${e.name}`))
    const stale = Object.keys(PUBLIC_BY_DESIGN).filter((id) => !ids.has(id))
    expect(stale, `allowlist entries without an entry point: ${stale.join(', ')}`).toEqual([])
  })

  it('every allowlist reason is a real sentence', () => {
    for (const [id, reason] of Object.entries(PUBLIC_BY_DESIGN)) expect(reason.length, id).toBeGreaterThan(25)
  })

  it('a service-role entry point that is public is on the allowlist AND says how it is bounded', () => {
    const risky = ALL.filter((e) => !e.guarded && e.usesServiceRole).map((e) => `${e.file}#${e.name}`)
    for (const id of risky) expect(PUBLIC_BY_DESIGN[id], id).toBeDefined()
  })
})

describe('no "use server" file exports a server-only writer', () => {
  it('createNotification (service-role insert of any text for any user) is not a Server Action', () => {
    const offenders = files.filter((f) => hasDirective(f.text, 'use server') && /export\s+(async\s+)?function\s+createNotification\b/.test(f.text)).map((f) => f.file)
    expect(offenders).toEqual([])
  })

  it('a "use server" file does not export a function that takes the CALLER\'s identity as an argument (finding S28: `actor` with a role let anyone act as an administrator)', () => {
    const trusting: string[] = []
    for (const f of files.filter((x) => hasDirective(x.text, 'use server'))) {
      for (const m of f.text.matchAll(/export\s+async\s+function\s+(\w+)\s*\(([^)]*)\)/g)) {
        if (/\bactor\b/.test(m[2])) trusting.push(`${f.file}#${m[1]}`)
      }
    }
    expect(trusting, 'who is calling must come from the session, never from an argument of a public endpoint').toEqual([])
  })

  it('a "use server" file does not export a function that takes a user id AND a message body (a notification / e-mail relay)', () => {
    const relay: string[] = []
    for (const f of files.filter((x) => hasDirective(x.text, 'use server'))) {
      for (const m of f.text.matchAll(/export\s+async\s+function\s+(\w+)\s*\(([^)]*)\)/g)) {
        const params = m[2]
        if (/\buserId\b/.test(params) && /\b(body|message|html|text)\b/.test(params)) relay.push(`${f.file}#${m[1]}`)
      }
    }
    expect(relay).toEqual([])
  })

  it('[SEC-X-SRV-CONTACT-ENTRY] only the contact gateway reaches a contact number or records a contact event', () => {
    expect(contactEntryOffenders(files)).toEqual([])
    // the positive control: the gateway is there, and it is the one file that names the function that takes the caller
    expect(files.filter((f) => f.text.includes('get_listing_owner_contact_as')).map((f) => f.file)).toEqual([CONTACT_GATEWAY])
    expect(files.some((f) => f.file === CONTACT_GATEWAY && hasDirective(f.text, 'use server'))).toBe(true)
  })
})

/**
 * The paths to a listing owner's contact number or to a contact event that must not exist besides the gateway (Task 923 R111 (d), SEC-X-SRV-CONTACT-ENTRY): a "use server" file
 * that exports the contact-event writer (a public endpoint that writes analytics rows), any file other than the gateway that names `get_listing_owner_contact_as` (the function
 * that takes the caller's id), and any call of the old session-path function `get_listing_owner_contact` (it is a session-callable function until hardening v8b).
 */
const CONTACT_GATEWAY = 'src/modules/listings/actions/contactGateway.ts'
function contactEntryOffenders(list: { file: string; text: string }[]): string[] {
  const out: string[] = []
  for (const f of list) {
    if (hasDirective(f.text, 'use server') && /export\s+(?:async\s+)?(?:function|const)\s+trackListingContactEvent\b/.test(f.text)) out.push(`${f.file}: a "use server" file exports trackListingContactEvent`)
    if (f.file !== CONTACT_GATEWAY && f.text.includes('get_listing_owner_contact_as')) out.push(`${f.file}: names get_listing_owner_contact_as`)
    if (/\.rpc\(\s*['"`]get_listing_owner_contact['"`]/.test(f.text)) out.push(`${f.file}: calls rpc get_listing_owner_contact`)
  }
  return out
}

describe('the scanner itself (planted entry points)', () => {
  const scan = (file: string, src: string) => entries(file, src).map((e) => `${e.name}:${e.guarded ? 'guarded' : 'OPEN'}${e.usesServiceRole ? ':service' : ''}`)

  it('flags each planted way to a contact number or a contact event, and not the gateway', () => {
    expect(contactEntryOffenders([{ file: 'src/x/actions.ts', text: "'use server'\nexport async function trackListingContactEvent() { return 1 }" }])).toHaveLength(1)
    expect(contactEntryOffenders([{ file: 'src/x/actions.ts', text: "'use server'\nexport const trackListingContactEvent = async () => 1" }])).toHaveLength(1)
    expect(contactEntryOffenders([{ file: 'src/x/other.ts', text: "await db.rpc('get_listing_owner_contact_as', { p_caller: id })" }])).toHaveLength(1)
    expect(contactEntryOffenders([{ file: 'src/x/other.ts', text: "await supabase.rpc('get_listing_owner_contact', { listing_id_param: id })" }])).toHaveLength(1)
    expect(contactEntryOffenders([{ file: CONTACT_GATEWAY, text: "'use server'\nawait db.rpc('get_listing_owner_contact_as', { p_caller: id })" }])).toEqual([])
    // a server-only module may export the writer: it is not a public endpoint
    expect(contactEntryOffenders([{ file: 'src/x/events.ts', text: "import 'server-only'\nexport async function trackListingContactEvent() { return 1 }" }])).toEqual([])
  })

  it('flags an exported Server Action with no check, and sees its service-role use', () => {
    expect(scan('src/x/actions.ts', "'use server'\nimport { createAdminClient } from '@/lib/supabase/admin'\nexport async function wipe(id: string) { const db = createAdminClient(); await db.from('t').delete().eq('id', id) }"))
      .toEqual(['wipe:OPEN:service'])
  })

  it('accepts an action that checks the session in its own body', () => {
    expect(scan('src/x/actions.ts', "'use server'\nexport async function mine() { const u = await getUser(); if (!u) return; }")).toEqual(['mine:guarded'])
  })

  it('accepts requireViewer (signed-in, active person) as a guard, and still flags the same action without it', () => {
    expect(scan('src/x/actions.ts', "'use server'\nexport async function send() { const v = await requireViewer(); if (!v.ok) return }")).toEqual(['send:guarded'])
    expect(scan('src/x/actions.ts', "'use server'\nexport async function send() { return 1 }")).toEqual(['send:OPEN'])
  })

  it('accepts an action that calls a same-file helper which checks the session', () => {
    const src = "'use server'\nasync function assertStaff() { return await getUser() }\nexport async function edit() { await assertStaff() }"
    expect(scan('src/x/actions.ts', src)).toEqual(['edit:guarded'])
  })

  it('does not accept a helper that merely exists but is never called', () => {
    const src = "'use server'\nasync function assertStaff() { return await getUser() }\nexport async function edit() { return 1 }"
    expect(scan('src/x/actions.ts', src)).toEqual(['edit:OPEN'])
  })

  it('flags an arrow-function export and a route handler with no check', () => {
    expect(scan('src/x/actions.ts', "'use server'\nexport const send = async (to: string) => { return to }")).toEqual(['send:OPEN'])
    expect(scan('src/app/api/x/route.ts', 'export async function POST(req: Request) { return new Response() }')).toEqual(['POST:OPEN'])
  })

  it('accepts a route that verifies a cron secret and ignores a non-HTTP export of a route file', () => {
    expect(scan('src/app/api/x/route.ts', 'export const dynamic = 1\nexport const runtime = 2\nexport async function GET(r: Request) { const a = verifyCronRequest(r); return a }')).toEqual(['GET:guarded'])
  })

  it('ignores a plain module that is neither a Server Action file nor a route', () => {
    expect(scan('src/lib/x.ts', 'export async function anything() { return 1 }')).toEqual([])
  })

  it('does not take a mention in a comment for a check', () => {
    expect(scan('src/x/actions.ts', "'use server'\nexport async function edit() { /* TODO: add getUser later */ return 1 }")).toEqual(['edit:OPEN'])
    expect(scan('src/x/actions.ts', "'use server'\nexport async function edit() {\n  // TODO getUser\n  return 1\n}")).toEqual(['edit:OPEN'])
  })
})
