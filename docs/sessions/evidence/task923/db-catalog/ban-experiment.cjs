/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Synthetic-user experiment: what does a Supabase Auth ban actually stop? (dev database; own synthetic user only; cleaned up)
const crypto = require('crypto')
const { env, scrub } = require('./lib.cjs')
const { createClient } = require('C:/Claude_Code_Projects/lero-al/node_modules/@supabase/supabase-js')
const o = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, o)
const mk = () => createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, o)
const RUN = 'zz_synth_ban_' + Date.now().toString(36)
const say = (k, v) => console.log(k.padEnd(58), scrub(v))
;(async () => {
  let id
  try {
    const email = `${RUN}@example.com`, password = 'Zz!' + crypto.randomBytes(12).toString('base64url') + '9a'
    const cu = await svc.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: RUN } })
    if (cu.error) throw new Error(cu.error.message)
    id = cu.data.user.id
    for (let i = 0; i < 20; i++) { const r = await svc.from('users').select('id').eq('id', id).maybeSingle(); if (r.data) break; await new Promise((r) => setTimeout(r, 250)) }
    const c = mk()
    const si = await c.auth.signInWithPassword({ email, password })
    const access = si.data.session.access_token, refresh = si.data.session.refresh_token
    say('before ban: sign-in', si.error ? 'ERROR' : 'ok')
    const ban = await svc.auth.admin.updateUserById(id, { ban_duration: '876000h' })
    say('ban applied (876000h)', ban.error ? 'ERROR ' + ban.error.message : 'ok; banned_until=' + String(ban.data.user.banned_until).slice(0, 10))
    const si2 = await mk().auth.signInWithPassword({ email, password })
    say('password sign-in while banned', si2.error ? `refused: ${si2.error.status} ${si2.error.code || ''} ${si2.error.message}` : 'ALLOWED')
    const rf = await mk().auth.refreshSession({ refresh_token: refresh })
    say('refresh token while banned', rf.error ? `refused: ${rf.error.status} ${rf.error.code || ''} ${rf.error.message}` : 'ALLOWED')
    const gu = await mk().auth.getUser(access)
    say('auth.getUser(old access token) while banned', gu.error ? `refused: ${gu.error.status} ${gu.error.code || ''} ${gu.error.message}` : 'ALLOWED (user returned)')
    const rest = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { ...o, global: { headers: { Authorization: `Bearer ${access}` } } })
    const rr = await rest.from('users').select('id,status').eq('id', id)
    say('REST read with the old access token while banned', rr.error ? 'refused ' + rr.error.code : `ALLOWED rows=${(rr.data || []).length}`)
    const ru = await rest.from('users').update({ name: RUN + ' changed' }).eq('id', id).select('id')
    say('REST write with the old access token while banned', ru.error ? 'refused ' + ru.error.code : `ALLOWED rows=${(ru.data || []).length}`)
    const un = await svc.auth.admin.updateUserById(id, { ban_duration: 'none' })
    say('unban (ban_duration none)', un.error ? 'ERROR ' + un.error.message : 'ok; banned_until=' + un.data.user.banned_until)
    const si3 = await mk().auth.signInWithPassword({ email, password })
    say('password sign-in after unban', si3.error ? 'REFUSED ' + si3.error.message : 'ok')
    const exp = JSON.parse(Buffer.from(access.split('.')[1], 'base64url').toString())
    say('access-token lifetime (seconds)', String(exp.exp - exp.iat))
  } catch (e) { console.log('ERROR', scrub(e.message)) }
  finally {
    if (id) { const d = await svc.auth.admin.deleteUser(id); const left = await svc.from('users').select('id').eq('id', id); say('cleanup', d.error || left.error ? 'ERROR' : `deleted; profile rows left=${(left.data || []).length}`) }
  }
})()
