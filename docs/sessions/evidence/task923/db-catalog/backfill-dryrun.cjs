/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// READ-ONLY dry-run for owner decision D9 (2026-10-17): which accounts are already blocked / inactive / suspended in `public.users` but are NOT banned in Supabase Auth?
// Reads only: `users(id,status,suspended_until,deleted_at)` and the Auth ban state of those accounts. Writes NOTHING. Prints COUNTS only: no id, e-mail, name or phone.
// The corrective backfill (accountAccess.syncAccountAccess for each listed account) is a separate step that needs the owner's explicit go-ahead.
// Rule used for "should be banned" = !accountHasAccess(status, suspended_until): status blocked/inactive, or a suspension that has not ended.
// Only the two named API variables are read from .env.local (no PostgreSQL driver is needed here); nothing is printed.
const env = {}
for (const line of require('fs').readFileSync('C:/Claude_Code_Projects/lero-al/.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=(.*)$/.exec(line)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { createClient } = require('C:/Claude_Code_Projects/lero-al/node_modules/@supabase/supabase-js')
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })

const shouldBeBanned = (u, now) => {
  if (u.status === 'blocked' || u.status === 'inactive') {
    if (u.status === 'blocked' && u.suspended_until && new Date(u.suspended_until).getTime() <= now) return false     // a suspension that already ended
    return true
  }
  return false
}

;(async () => {
  const now = Date.now()
  const rows = []
  for (let from = 0; ; from += 1000) {
    const page = await svc.from('users').select('id,status,suspended_until,deleted_at').range(from, from + 999)
    if (page.error) { console.log('UNKNOWN: could not read users:', page.error.code || 'error'); process.exitCode = 2; return }
    rows.push(...page.data)
    if (page.data.length < 1000) break
  }
  const targets = rows.filter((u) => shouldBeBanned(u, now))
  let banned = 0, notBanned = 0, unknown = 0, missingInAuth = 0
  for (const u of targets) {
    const r = await svc.auth.admin.getUserById(u.id)
    if (r.error || !r.data?.user) { if (r.error?.status === 404) missingInAuth++; else unknown++; continue }
    const until = r.data.user.banned_until
    if (until && new Date(until).getTime() > now) banned++; else notBanned++
  }
  const byStatus = (s) => rows.filter((u) => u.status === s).length
  console.log('accounts in public.users:                       ', rows.length)
  console.log('  active / blocked / inactive / other:          ', byStatus('active'), '/', byStatus('blocked'), '/', byStatus('inactive'), '/', rows.length - byStatus('active') - byStatus('blocked') - byStatus('inactive'))
  console.log('should be banned (blocked, inactive, or suspended): ', targets.length)
  console.log('  already banned in Auth:                       ', banned)
  console.log('  NOT banned in Auth (the backfill would ban):  ', notBanned)
  console.log('  no Auth user (nothing to ban):                ', missingInAuth)
  console.log('  could not be read (unknown, not counted as ok):', unknown)
  process.exitCode = unknown ? 2 : 0
})().catch((e) => { console.log('FAILED:', String(e.message).slice(0, 120)); process.exitCode = 2 })
