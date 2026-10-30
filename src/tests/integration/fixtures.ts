/**
 * Synthetic fixtures for the real-boundary suites: users with REAL Supabase Auth sessions (password sign-in through a service-role caller, which Supabase's CAPTCHA protection lets through; the session then lives in an anon-key client), listings, and a clean-up that
 * is VERIFIED — a query that fails is "unknown", never "zero left". Everything a run creates carries the per-run prefix `zz_synth_<run>`; the clean-up only
 * touches rows the run itself created (by id or by that prefix) and never an existing person, listing or media file.
 *
 * service_role is used here to PREPARE and CLEAN (and by the production code under test, which is how it runs in production); every authorization check in the
 * tests goes through a real user session or a real anonymous client.
 */
import { randomBytes } from 'node:crypto'
import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { escapeLike } from '@/lib/postgrest/escape'
import { loadIntegrationEnv } from './environment'

export interface SyntheticUser {
  id: string
  email: string
  password: string
  /** A client holding this user's real session (its access token). */
  client: SupabaseClient
  accessToken: string
  refreshToken: string
}

export interface CleanupResult { verified: boolean; remaining: number; errors: string[] }

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

export function createRun() {
  const env = loadIntegrationEnv()
  const RUN = `zz_synth_${Date.now().toString(36)}${randomBytes(2).toString('hex')}`
  // The prefix contains `_`, which LIKE reads as "any character": the pattern is escaped, so a clean-up deletes only rows that really start with this run's prefix.
  const RUN_LIKE = `${escapeLike(RUN)}%`
  const admin = createClient(env.url, env.serviceKey, clientOptions)
  const anonymousClient = () => createClient(env.url, env.anonKey, clientOptions)
  const userIds = new Set<string>()
  const listingIds = new Set<string>()
  const strongPassword = () => `Zz!${randomBytes(12).toString('base64url')}9a`

  async function signIn(email: string, password: string) {
    // Supabase's CAPTCHA protection refuses a password sign-in without a token and lets a service-role caller through (Task 923 R154); the session is then held by an anon-key client
    const caller = createClient(env.url, env.serviceKey, clientOptions)
    const result = await caller.auth.signInWithPassword({ email, password })
    const client = anonymousClient()
    if (result.data.session) {
      const { access_token, refresh_token } = result.data.session
      const held = await client.auth.setSession({ access_token, refresh_token })
      if (held.error) throw new Error('fixture: could not hold the session of a synthetic user')
    }
    return { client, result }
  }

  async function makeUser(tag: string, options: { role?: 'user' | 'agent' | 'moderator' | 'admin'; status?: 'active' | 'blocked' | 'inactive' } = {}): Promise<SyntheticUser> {
    const email = `${RUN}_${tag}@example.com`
    const password = strongPassword()
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: `${RUN} ${tag}` } })
    if (created.error || !created.data.user) throw new Error(`fixture: could not create user ${tag}`)
    const id = created.data.user.id
    userIds.add(id)
    // the sign-up trigger creates the profile row; wait for it, then set the synthetic details (roles are set by service_role, like the admin panel does)
    for (let i = 0; i < 40; i++) {
      const row = await admin.from('users').select('id').eq('id', id).maybeSingle()
      if (row.data) break
      await new Promise(resolveWait => setTimeout(resolveWait, 250))
    }
    const phone = `+3556${Math.floor(1e7 + Math.random() * 8e7)}`
    // eslint-disable-next-line no-restricted-syntax -- user status (fixture preparation by service_role), not listing status
    const prepared = await admin.from('users').update({ phone, whatsapp: phone, ...(options.role ? { role: options.role } : {}), ...(options.status ? { status: options.status } : {}) }).eq('id', id)
    if (prepared.error) throw new Error(`fixture: could not prepare user ${tag}`)
    const { client, result } = await signIn(email, password)
    if (result.error || !result.data.session) throw new Error(`fixture: could not sign in user ${tag}`)
    return { id, email, password, client, accessToken: result.data.session.access_token, refreshToken: result.data.session.refresh_token }
  }

  async function makeListing(ownerId: string, status: 'active' | 'pending' | 'inactive' | 'sold' | 'rented' | 'archived' | 'expired', tag: string) {
    const inserted = await admin.from('listings')
      .insert({ user_id: ownerId, slug: `${RUN}-${tag}`, title: `${RUN} ${tag}`, price: 1000, listing_type: 'sale', property_type: 'apartment', status })
      .select('id, slug, status, expires_at').single()
    if (inserted.error || !inserted.data) throw new Error(`fixture: could not create listing ${tag}`)
    listingIds.add(inserted.data.id)
    return inserted.data as { id: string; slug: string; status: string; expires_at: string | null }
  }

  /** An existing location (configuration data, not personal) for forms that need one. */
  async function anyLocationId(): Promise<number> {
    const row = await admin.from('locations').select('id').limit(1).maybeSingle()
    if (row.error || !row.data) throw new Error('fixture: no location available')
    return row.data.id as number
  }

  async function cleanup(): Promise<CleanupResult> {
    const errors: string[] = []
    const step = async (label: string, run: () => PromiseLike<{ error: { message: string } | null }>) => {
      try { const { error } = await run(); if (error) errors.push(`${label}: ${error.message.slice(0, 80)}`) } catch (e) { errors.push(`${label}: ${(e as Error).message.slice(0, 80)}`) }
    }
    const none = ['00000000-0000-0000-0000-000000000000']
    const uids = userIds.size ? [...userIds] : none
    const lids = listingIds.size ? [...listingIds] : none

    // anything of this run that was created but not tracked (a failure half-way)
    const strays = await admin.from('listings').select('id').like('slug', RUN_LIKE)
    if (strays.error) errors.push(`list listings: ${strays.error.message.slice(0, 80)}`)
    else for (const row of strays.data ?? []) listingIds.add(row.id)
    for (let page = 1; page <= 10; page++) {
      const list = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (list.error) { errors.push(`list users: ${list.error.message.slice(0, 80)}`); break }
      list.data.users.filter(u => (u.email ?? '').startsWith(RUN)).forEach(u => userIds.add(u.id))
      if (list.data.users.length < 200) break
    }
    const allUsers = [...userIds], allListings = [...listingIds]

    await step('inquiries', () => admin.from('listing_inquiries').delete().like('name', RUN_LIKE))
    if (allListings.length) {
      await step('contact events', () => admin.from('listing_contact_events').delete().in('listing_id', allListings))
      await step('views', () => admin.from('listing_views').delete().in('listing_id', allListings))
    }
    if (allUsers.length) {
      await step('contact reveals', () => admin.from('listing_contact_reveals').delete().in('viewer_id', allUsers))
      await step('notifications', () => admin.from('notifications').delete().in('user_id', allUsers))
      await step('status history', () => admin.from('user_status_history').delete().in('user_id', allUsers))
    }
    if (allListings.length) await step('listings', () => admin.from('listings').delete().in('id', allListings))
    // A person who acted on another one (an administrator who blocked a user) is referenced by a NO ACTION key of the other person's rows (user_change_log.changed_by),
    // which go with THAT person: such an account can only be deleted after the ones it acted on, so a refused delete is retried once the others are gone.
    let toDelete = allUsers
    for (let pass = 0; pass < 3 && toDelete.length; pass++) {
      const refused: string[] = []
      for (const id of toDelete) {
        try { const { error } = await admin.auth.admin.deleteUser(id); if (error && error.status !== 404 && error.code !== 'user_not_found') refused.push(id) } catch { refused.push(id) }   // a person the test already deleted is gone, not a failure
      }
      toDelete = refused
    }
    for (const id of toDelete) await step('delete user', () => admin.auth.admin.deleteUser(id))      // still refused after the retries: reported as an error

    // verification: an ERROR in a check is a failure ("unknown"), never "zero left"
    let remaining = 0
    const count = async (label: string, run: () => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) => {
      try {
        const { data, error } = await run()
        if (error) { errors.push(`verify ${label}: ${error.message.slice(0, 80)}`); return }
        remaining += (data ?? []).length
      } catch (e) { errors.push(`verify ${label}: ${(e as Error).message.slice(0, 80)}`) }
    }
    await count('users', () => admin.from('users').select('id').in('id', allUsers.length ? allUsers : none))
    await count('listings', () => admin.from('listings').select('id').like('slug', RUN_LIKE))
    await count('inquiries', () => admin.from('listing_inquiries').select('id').like('name', RUN_LIKE))
    await count('notifications', () => admin.from('notifications').select('id').in('user_id', uids))
    await count('contact events', () => admin.from('listing_contact_events').select('id').in('listing_id', lids))
    await count('contact reveals', () => admin.from('listing_contact_reveals').select('id').in('viewer_id', allUsers.length ? allUsers : none))
    for (let page = 1; page <= 10; page++) {
      const list = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (list.error) { errors.push(`verify auth users: ${list.error.message.slice(0, 80)}`); break }
      remaining += list.data.users.filter(u => (u.email ?? '').startsWith(RUN)).length
      if (list.data.users.length < 200) break
    }
    return { verified: errors.length === 0 && remaining === 0, remaining, errors }
  }

  return { RUN, env, admin, anonymousClient, signIn, makeUser, makeListing, anyLocationId, cleanup }
}

export type Run = ReturnType<typeof createRun>
