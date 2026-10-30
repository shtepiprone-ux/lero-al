// Task 923 Revision 51 (Sonnet executor, 2026-10-25), AC151 r51-04: the body of the real-boundary probe, run by r51-04-probe.mjs through vitest (never run on its own). After
// review-58/rv58-05-session-client-global-probe.mjs, with the REAL `changeCabinetPassword` of src/modules/cabinet/actions/index.ts instead of the hand-built clients.
// REAL: the action, `src/lib/supabase/server.ts` (the request's session client: anon key, the request's cookies, a writing `setAll`), `src/lib/auth/server.ts`, the verify client
// (service-role key, no-op `setAll`), the admin client, Supabase Auth and the database of the approved development project.
// DOUBLES: `next/headers` (it gives the browser session's cookie and records every cookie write), the two mail senders (recording sink, nothing is sent), and a recording wrapper
// of `fetch` that notes the access token of every password/refresh grant (so the check's own session is known) and the answer of every /auth/v1/logout request.
// One synthetic `zz_synth_` user (no fixture sign-in: exactly two sessions are issued before the call), deleted at the end; the clean-up is verified.
// Prints no URL, ref, key, token or password.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { createRun } from '@/tests/integration/fixtures'

const browser = vi.hoisted(() => ({ jar: new Map(), writes: [] }))
const sink = vi.hoisted(() => ({ notices: [] }))
vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    getAll: () => [...browser.jar].map(([name, value]) => ({ name, value })),
    set: (name, value, options) => {
      browser.writes.push({ name, empty: value === '', maxAge: options?.maxAge ?? null })
      if (value === '' || options?.maxAge === 0) browser.jar.delete(name)
      else browser.jar.set(name, value)
    },
  }),
}))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async (args) => { sink.notices.push(String(args?.to ?? '').split('@')[1] ?? '') } }))

import { changeCabinetPassword } from '@/modules/cabinet/actions'

const lines = []
const say = (line) => { lines.push(line); console.log(`PROBE| ${line}`) }
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

let run
let ref = ''
const issued = []
const logouts = []
const realFetch = globalThis.fetch

beforeAll(() => {
  run = createRun()
  ref = new URL(run.env.url).hostname.split('.')[0]
  globalThis.fetch = async (input, init) => {
    const response = await realFetch(input, init)
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    let path = ''
    try { const u = new URL(href); path = u.pathname + u.search } catch { /* not a URL */ }
    if (/^\/auth\/v1\/token\?grant_type=(password|refresh_token)/.test(path) && response.ok) {
      try { const body = await response.clone().json(); if (body.access_token) issued.push(body.access_token) } catch { /* not JSON */ }
    }
    if (path.startsWith('/auth/v1/logout')) {
      let code = ''
      try { const body = await response.clone().json(); code = body.error_code ?? body.code ?? '' } catch { code = 'empty body' }
      logouts.push(`${init?.method ?? 'GET'} ${path} -> ${response.status} ${code}`)
    }
    return response
  }
})

afterAll(async () => {
  globalThis.fetch = realFetch
  const result = await run.cleanup()
  say(`clean-up: ${JSON.stringify(result)}`)
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
  process.stdout.write(`PROBE-LINES-JSON ${JSON.stringify(lines)}\n`)
})

const aliveToken = async (token) => {
  const { error } = await createClient(run.env.url, run.env.anonKey, options).auth.getUser(token)
  return error ? 'ended' : 'alive'
}

describe('r51-04', () => {
  it('the real changeCabinetPassword ends every session of the account and empties the browser cookie', async () => {
    const email = `${run.RUN}_r51@example.com`
    const password = `Zz!${randomBytes(12).toString('base64url')}9a`
    const next = `Zz!${randomBytes(12).toString('base64url')}7b`
    const created = await run.admin.auth.admin.createUser({ email, password, email_confirm: true })
    expect(created.error, 'the synthetic user was created').toBeNull()

    // the browser's session and a second one (a phone), granted by a service-role caller as the fixtures do (Supabase's CAPTCHA protection lets it through)
    const grant = async () => (await createClient(run.env.url, run.env.serviceKey, options).auth.signInWithPassword({ email, password })).data.session
    const browserSession = await grant()
    const secondSession = await grant()
    expect(browserSession && secondSession, 'both sessions were granted').toBeTruthy()
    const cookieName = `sb-${ref}-auth-token`
    browser.jar.set(cookieName, `base64-${Buffer.from(JSON.stringify(browserSession)).toString('base64url')}`)

    say(`before: sessions issued for the account ${issued.length}; browser ${await aliveToken(browserSession.access_token)}; second ${await aliveToken(secondSession.access_token)}; auth cookies in the jar ${browser.jar.size}`)
    expect(issued, 'exactly two sessions were issued before the call: the browser and a second one').toHaveLength(2)

    const answer = await changeCabinetPassword({ currentPassword: password, newPassword: next })
    say(`the real changeCabinetPassword answered ${JSON.stringify(answer)}`)
    say(`sessions issued for the account after the call ${issued.length} (the password check's own is the third)`)
    expect(answer).toEqual({ ok: true })
    expect(issued, 'the password check opened exactly one session of its own').toHaveLength(3)

    const states = []
    for (const [index, token] of issued.entries()) states.push(`${['browser', 'second', "the check's own"][index] ?? `session ${index + 1}`} ${await aliveToken(token)}`)
    say(`after: ${states.join('; ')}`)
    for (const state of states) expect(state, 'every session of the account is ended').toMatch(/ended$/)

    const writes = browser.writes.map((w) => `${w.name.replace(ref, '<ref>')} value ${w.empty ? 'empty' : 'set'} maxAge ${w.maxAge ?? 'none'}`)
    say(`cookie writes: ${writes.join('; ') || 'none'}; auth cookies left ${browser.jar.size}`)
    expect(browser.writes.some((w) => w.name === cookieName && w.empty && w.maxAge === 0), 'the auth cookie is written empty with maxAge 0').toBe(true)
    expect(browser.jar.size, 'no auth cookie is left').toBe(0)
    say(`/auth/v1/logout requests: ${logouts.join('; ') || 'none'}`)
    say(`mail sink: ${sink.notices.length} password-changed notice(s) recorded, nothing sent`)

    // control: the password HAS changed, the new one signs in and the old one does not
    const fresh = createClient(run.env.url, run.env.serviceKey, options)
    const withNew = await fresh.auth.signInWithPassword({ email, password: next })
    const withOld = await createClient(run.env.url, run.env.serviceKey, options).auth.signInWithPassword({ email, password })
    say(`control: the new password signs in ${withNew.error ? 'no' : 'yes'}; the old password signs in ${withOld.error ? 'no' : 'yes'}`)
    expect(withNew.error).toBeNull()
    expect(withOld.error).not.toBeNull()
  })

  // Added by the executor (not asked for by AC151): which step ends the sessions. The action updates the password through the admin API BEFORE it signs out. This control does the
  // admin password update ALONE on a second synthetic user with three live sessions and only observes which sessions are alive afterwards. It asserts nothing about the answer.
  it('control: what the admin password update alone does to the live sessions', async () => {
    const email = `${run.RUN}_r51c@example.com`
    const password = `Zz!${randomBytes(12).toString('base64url')}9a`
    const next = `Zz!${randomBytes(12).toString('base64url')}7b`
    const created = await run.admin.auth.admin.createUser({ email, password, email_confirm: true })
    expect(created.error, 'the control user was created').toBeNull()
    const grant = async () => (await createClient(run.env.url, run.env.serviceKey, options).auth.signInWithPassword({ email, password })).data.session
    const sessions = [await grant(), await grant(), await grant()]
    const names = ['browser', 'second', "third (stands for the check's own)"]
    const states = async () => { const out = []; for (const [i, s] of sessions.entries()) out.push(`${names[i]} ${await aliveToken(s.access_token)}`); return out.join('; ') }
    say(`control 2, before the admin password update: ${await states()}`)
    const updated = await run.admin.auth.admin.updateUserById(created.data.user.id, { password: next })
    say(`control 2: admin updateUserById ${updated.error ? updated.error.code ?? updated.error.message : 'ok'}`)
    say(`control 2, after the admin password update alone: ${await states()}`)
    expect(updated.error).toBeNull()
  })
})
