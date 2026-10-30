// Task 927 review 4: which Supabase Auth grants the project's CAPTCHA protection refuses without a token, and whether a service-role verify client passes.
// Reads .env.local; prints no URL, ref, key or password. Run: node docs/sessions/evidence/task927/review-4/rv4-01-captcha-probe.mjs
import fs from 'node:fs'
import os from 'node:os'
import { createServerClient } from '@supabase/ssr'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => /^[A-Z_0-9]+=/.test(l)).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')] }))
const url = env.NEXT_PUBLIC_SUPABASE_URL, anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, sr = env.SUPABASE_SERVICE_ROLE_KEY
console.log(`platform: ${process.platform} ${os.release()}`)
console.log(`node: ${process.version}`)
console.log(`cwd: ${process.cwd()}`)
console.log('command: node docs/sessions/evidence/task927/review-4/rv4-01-captcha-probe.mjs')
console.log(`date: ${new Date().toISOString()}`)
const line = (label, error) => console.log(`${label}: ${error ? `${error.code ?? error.error_code ?? ''} ${error.message ?? error.msg ?? ''}`.trim() : 'session ok'}`)

async function grant(label, type, body, headers) {
  const r = await fetch(`${url}/auth/v1/token?grant_type=${type}`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json()
  console.log(`${label}: ${r.status} ${j.error_code ?? j.code ?? ''} ${j.msg ?? j.error_description ?? j.message ?? (j.access_token ? 'session ok' : '')}`.replace(/\s+/g, ' ').trim())
}
const nobody = { email: 'zz_probe_nobody@example.invalid', password: 'x-not-a-password' }
await grant('anon password grant, admin account, no captcha token', 'password', { email: env.HYDRATION_ADMIN_EMAIL, password: env.HYDRATION_ADMIN_PASSWORD }, { apikey: anon })
await grant('anon password grant, agent1 account, no captcha token', 'password', { email: env.HYDRATION_AGENT1_EMAIL, password: env.HYDRATION_AGENT1_PASSWORD }, { apikey: anon })
await grant('anon password grant, a bogus captcha token', 'password', { ...nobody, gotrue_meta_security: { captcha_token: 'bogus' } }, { apikey: anon })
await grant('anon id_token grant, no captcha token', 'id_token', { provider: 'google', id_token: 'x.y.z', nonce: 'n' }, { apikey: anon })
await grant('anon refresh_token grant, no captcha token', 'refresh_token', { refresh_token: 'bogus' }, { apikey: anon })
await grant('service-role password grant, unknown account', 'password', nobody, { apikey: sr, authorization: `Bearer ${sr}` })

const verifyClient = key => createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => {} } })
for (const [label, key] of [['ssr verify client, anon key', anon], ['ssr verify client, service-role key', sr]]) {
  const c = verifyClient(key)
  line(`${label}, unknown account`, (await c.auth.signInWithPassword(nobody)).error)
  const ok = await c.auth.signInWithPassword({ email: env.HYDRATION_ADMIN_EMAIL, password: env.HYDRATION_ADMIN_PASSWORD })
  line(`${label}, admin account with its password`, ok.error)
  if (!ok.error) line(`${label}, signOut local of the verify session`, (await c.auth.signOut({ scope: 'local' })).error)
}
console.log('exit code: 0')
