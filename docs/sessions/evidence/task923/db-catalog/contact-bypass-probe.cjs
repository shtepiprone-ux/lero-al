/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Probe: can the three contact methods be reached WITHOUT the server action / the future Turnstile check? (dev database, synthetic rows only)
//   node contact-bypass-probe.cjs --i-confirm-dev-database
// Reports facts; exit 1 when a direct path exists (VULN) or the clean-up is not verified.
const crypto = require('crypto')
const { env, scrub } = require('./lib.cjs')
const { createClient } = require('C:/Claude_Code_Projects/lero-al/node_modules/@supabase/supabase-js')
if (!process.argv.includes('--i-confirm-dev-database')) { console.log('pass --i-confirm-dev-database'); process.exit(2) }
const o = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, o)
const mk = () => createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, o)
const RUN = 'zz_synth_cp_' + Date.now().toString(36)
const out = []
const users = new Set(), listings = new Set()
const say = (id, vuln, what, observed) => { out.push({ id, vuln }); console.log(`${vuln ? 'VULN' : ' ok '} ${id} ${what} | ${scrub(observed)}`) }
const brief = (r) => (r.error ? `error ${r.error.code || ''} ${String(r.error.message).slice(0, 80)}` : `rows=${Array.isArray(r.data) ? r.data.length : r.data ? 1 : 0}`)
const took = (r) => !r.error && (Array.isArray(r.data) ? r.data.length > 0 : !!r.data)
async function mkUser(tag, role) {
  const email = `${RUN}_${tag}@example.com`, password = 'Zz!' + crypto.randomBytes(12).toString('base64url') + '9a'
  const cu = await svc.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: `${RUN} ${tag}` } })
  if (cu.error) throw new Error('createUser: ' + cu.error.message)
  const id = cu.data.user.id; users.add(id)
  for (let i = 0; i < 24; i++) { const r = await svc.from('users').select('id').eq('id', id).maybeSingle(); if (r.data) break; await new Promise((x) => setTimeout(x, 250)) }
  const phone = '+3556' + Math.floor(1e7 + Math.random() * 8e7)
  const up = await svc.from('users').update({ phone, whatsapp: phone, ...(role ? { role } : {}) }).eq('id', id)
  if (up.error) throw new Error('prepare: ' + up.error.message)
  const client = mk(); const si = await client.auth.signInWithPassword({ email, password })
  if (si.error) throw new Error('sign-in: ' + si.error.message)
  return { id, phone, client }
}
;(async () => {
  let fatal = null
  try {
    const A = await mkUser('a'), B = await mkUser('b'), C = await mkUser('c_admin', 'admin'), M = await mkUser('m_mod', 'moderator')
    const L = await svc.from('listings').insert({ user_id: B.id, slug: `${RUN}-l`, title: `${RUN} l`, price: 1, listing_type: 'sale', property_type: 'apartment', status: 'active' }).select('id').single()
    if (L.error) throw new Error('listing: ' + L.error.message); listings.add(L.data.id)
    const an = mk()
    const row = (who) => ({ listing_id: L.data.id, listing_owner_id: B.id, name: `${RUN} ${who}`, email: 'probe@example.com', message: `${RUN} direct insert by ${who} — must not be possible`, requester_ip: null, status: 'new' })

    // 1. the message path: a row in listing_inquiries without the Server Action (no check, no e-mail, no notification would run)
    for (const [id, who, cl] of [['D01', 'anonymous', an], ['D02', 'signed-in user', A.client], ['D03', 'moderator', M.client], ['D04', 'administrator', C.client]]) {
      const r = await cl.from('listing_inquiries').insert(row(who)).select('id')
      say(id, took(r), `${who} INSERTs into listing_inquiries directly`, brief(r))
    }
    // 2. contact events (analytics of the WhatsApp tap) and notifications (the owner's bell)
    let r = await an.from('listing_contact_events').insert({ listing_id: L.data.id, listing_owner_id: B.id, channel: 'whatsapp', source: 'listing_detail_contact_card' }).select('id')
    say('D05', took(r), 'anonymous INSERTs into listing_contact_events', brief(r))
    r = await A.client.from('listing_contact_events').insert({ listing_id: L.data.id, listing_owner_id: B.id, channel: 'whatsapp', source: 'listing_detail_contact_card' }).select('id')
    say('D06', took(r), 'signed-in user INSERTs into listing_contact_events', brief(r))
    r = await A.client.from('notifications').insert({ user_id: B.id, type: 'new_message', title: `${RUN} forged`, body: 'forged' }).select('id')
    say('D07', took(r), 'signed-in user INSERTs a notification for the owner', brief(r))
    r = await C.client.from('notifications').insert({ user_id: B.id, type: 'new_message', title: `${RUN} forged`, body: 'forged' }).select('id')
    say('D08', took(r), 'administrator INSERTs a notification for the owner', brief(r))
    // 3. the call / WhatsApp path: the database function itself (the Server Action is only one caller)
    r = await an.rpc('get_listing_owner_contact', { listing_id_param: L.data.id })
    say('D09', !r.error, 'anonymous calls get_listing_owner_contact', brief(r))
    r = await A.client.rpc('get_listing_owner_contact', { listing_id_param: L.data.id })
    say('D10', !r.error && (r.data || []).length > 0, 'any signed-in account calls get_listing_owner_contact with its own token, no Server Action, no human check', r.error ? brief(r) : `phone returned: ${(r.data || [])[0] && (r.data || [])[0].phone === B.phone}`)
    r = await C.client.rpc('get_listing_owner_contact', { listing_id_param: L.data.id })
    say('D11', !r.error && (r.data || []).length > 0, 'an administrator calls get_listing_owner_contact directly', r.error ? brief(r) : 'returned')
    // 4. the owner phone is not readable from the table by other people
    r = await A.client.from('users').select('phone,whatsapp').eq('id', B.id)
    say('D12', took(r), 'signed-in user reads the owner phone from the users table', brief(r))
    r = await an.from('listings').select('*').eq('id', L.data.id).maybeSingle()
    const leak = r.data ? Object.keys(r.data).filter((k) => /phone|whatsapp|email|contact/i.test(k) && r.data[k]) : []
    say('D13', leak.length > 0, 'the public listing row carries a contact field with data', leak.length ? leak.join(',') : 'none')
    // 5. other routes in the schema that could send or reveal contact data
    const probe = await A.client.rpc('process_saved_search_notify', { p_now: new Date().toISOString() })
    say('D14', !probe.error, 'signed-in user calls process_saved_search_notify (a SECURITY DEFINER notifier)', brief(probe))
  } catch (e) { fatal = scrub(e.message); console.log('PROBE ERROR:', fatal) }
  // clean-up with every step checked
  const errs = []
  const chk = async (l, p) => { try { const r = await p; if (r && r.error) errs.push(l + ': ' + scrub(r.error.message)); return r } catch (e) { errs.push(l + ': ' + scrub(e.message)) } }
  const none = '00000000-0000-0000-0000-000000000000'
  const lids = [...listings], uids = [...users]
  await chk('inquiries', svc.from('listing_inquiries').delete().like('name', RUN + '%'))
  await chk('events', svc.from('listing_contact_events').delete().in('listing_id', lids.length ? lids : [none]))
  await chk('notifications', svc.from('notifications').delete().like('title', RUN + '%'))
  if (lids.length) await chk('listings', svc.from('listings').delete().in('id', lids))
  for (const u of uids) await chk('deleteUser', svc.auth.admin.deleteUser(u))
  const left = {}
  for (const [k, p] of [['inquiries', svc.from('listing_inquiries').select('id').like('name', RUN + '%')], ['notifications', svc.from('notifications').select('id').like('title', RUN + '%')], ['events', svc.from('listing_contact_events').select('id').in('listing_id', lids.length ? lids : [none])], ['listings', svc.from('listings').select('id').like('slug', RUN + '%')], ['users', svc.from('users').select('id').in('id', uids.length ? uids : [none])]]) {
    const r = await p; if (r.error) { errs.push('verify ' + k + ': ' + scrub(r.error.message)); left[k] = 'UNKNOWN' } else left[k] = (r.data || []).length
  }
  const clean = errs.length === 0 && Object.values(left).every((n) => n === 0)
  console.log(`cleanup: ${clean ? 'VERIFIED COMPLETE' : 'NOT VERIFIED'} left=${JSON.stringify(left)}`); errs.forEach((e) => console.log('  cleanup error:', e))
  const v = out.filter((x) => x.vuln)
  console.log(`\n${out.length} probes, ${v.length} direct paths: ${v.map((x) => x.id).join(' ') || 'none'}`)
  process.exit(fatal || !clean || v.length ? 1 : 0)
})()
