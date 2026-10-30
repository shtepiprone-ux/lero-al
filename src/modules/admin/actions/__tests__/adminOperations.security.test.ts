// @vitest-environment node
/**
 * Admin operations (Task 923 Revision 7): listings, locations, CMS pages, location requests, the user picker and support tickets.
 * Who may call each is proved in `staffActions.test.ts` and `userAdministration.security.test.ts`; here is WHAT they do and what they refuse. The permission
 * helpers are the real ones, the database is in memory.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
const paths: string[] = []
const tags: string[] = []
const transitions: { id: string; to: string; actor: Record<string, unknown> }[] = []
let transitionResult: { ok: true } | { ok: false; reason: string } = { ok: true }
const notifications: Record<string, unknown>[] = []
let failTable: { table: string; op: string; error: { code?: string; message: string } } | null = null

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => {
      const c = db.client.from(t) as Record<string, unknown>
      // PostgREST hands the deleted rows to `delete().select()`; the in-memory database answers an empty list. The action's zero-row check (Task 923 R71 (c)) reads that list,
      // so the double answers the rows the delete removed.
      const remove = c.delete as () => Record<string, unknown>
      c.delete = () => {
        const before = [...db.tables[t]]
        const chain = remove()
        const settle = chain.then as (resolve: (v: { data: unknown; error: unknown }) => void) => void
        chain.then = (resolve: (v: { data: unknown; error: unknown }) => void) => settle((result) => resolve({ ...result, data: before.filter((r) => !db.tables[t].includes(r)) }))
        return chain
      }
      if (failTable && failTable.table === t) {
        const { op, error } = failTable
        const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error }) : chain), apply: () => chain })
        c[op] = () => chain
      }
      return c
    },
    auth: { admin: {} },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => { paths.push(p) }, revalidateTag: (t: string) => { tags.push(t) }, unstable_cache: (fn: unknown) => fn }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async (n: Record<string, unknown>) => { notifications.push(n) } }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async (id: string, to: string, actor: Record<string, unknown>) => { transitions.push({ id, to, actor }); return transitionResult } }))

import {
  addLocation, approveLocationRequest, createLocation, createPage, createSupportTicket, deleteListing, deleteLocation, deletePage, rejectLocationRequest, searchUsersForPicker,
  setListingPremium, toggleListingPremium, toggleLocationFeatured, updateListingStatus, updateLocation, updatePage, updateTicketStatus,
} from '../index'

// the keys the acting moderator holds: since Task 923 R75 every action that admits a moderator names its key (`listings.moderate`, `support.manage`), read at each check
const PERMISSIONS = ['listings.set_premium', 'listings.delete', 'locations.manage', 'legal.manage', 'listings.moderate', 'support.manage']
const body = { sq: { title: 'Kushtet', body: '<p>Tekst</p>' } }
const UUID = '11111111-1111-4111-8111-111111111111'
const DELETED = '22222222-2222-4222-8222-222222222222'

beforeEach(() => {
  db = createFakeDb({
    users: [
      // the acting accounts are active: `checkStaff()` / `requireViewer()` (Task 923 R44, R71 (k)) read the actor's own row and refuse an account without access
      { id: 'adm', role: 'admin', name: 'Admin A', status: 'active' }, { id: 'mod', role: 'moderator', name: 'Mod M', status: 'active' }, { id: 'usr', role: 'user', status: 'active' },
      { id: UUID, role: 'user', name: 'Alba', last_name: 'Hoxha', phone: '+355691234567', status: 'active', company_name: 'Nova', location_request: 'Nowhere', deleted_at: null },
      { id: DELETED, role: 'user', name: 'Gone', deleted_at: '2026-01-01' },
    ],
    role_permissions: PERMISSIONS.map((permission_key) => ({ role: 'moderator', permission_key, allowed: true })),
    listings: [{ id: 'l1', slug: 'flat-1', is_premium: false }],
    locations: [{ id: 1, name_al: 'Tirana', type: 'city', slug: 'tirana', is_featured: false }],
    pages: [{ id: 1, slug: 'terms', title: 'Old', content: body, is_published: false }, { id: 2, slug: 'privacy', title: 'P', content: { sq: { title: 'P', body: '' } }, is_published: false }],
    support_tickets: [{ id: 't1', status: 'open', reported_user_id: UUID }, { id: 't2', status: 'open', reported_user_id: null }],
    support_ticket_events: [],
  })
  currentUser = { id: 'mod' }
  paths.length = 0
  tags.length = 0
  transitions.length = 0
  notifications.length = 0
  transitionResult = { ok: true }
  failTable = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('updateListingStatus', () => {
  it('hands the change to the transition gateway with the staff member as the actor and refreshes the list', async () => {
    expect(await updateListingStatus('l1', 'archived')).toEqual({})
    expect(transitions).toEqual([{ id: 'l1', to: 'archived', actor: { userId: 'mod', role: 'moderator', source: 'admin_panel' } }])
    expect(paths).toEqual(['/admin/listings'])
  })

  it('a refusal by the gateway is returned, logged unless it is "not_found", and nothing is refreshed', async () => {
    transitionResult = { ok: false, reason: 'invalid_transition' }
    expect(await updateListingStatus('l1', 'active')).toEqual({ error: 'invalid_transition' })
    expect(console.error).toHaveBeenCalledTimes(1)
    transitionResult = { ok: false, reason: 'not_found' }
    expect(await updateListingStatus('l1', 'active')).toEqual({ error: 'not_found' })
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(paths).toEqual([])
  })

  // `requireViewer()` treats a session whose profile row is missing as a guest (a "zombie" session), so the guard answers `unauthenticated` for it, as it does for no session
  it.each([['an anonymous caller', null, 'unauthenticated'], ['a plain user', { id: 'usr' }, 'forbidden'], ['someone with no profile', { id: 'ghost' }, 'unauthenticated']])('%s is refused before the gateway', async (_l, who, message) => {
    currentUser = who
    await expect(updateListingStatus('l1', 'archived')).rejects.toThrow(message)
    expect(transitions).toEqual([])
  })
})

describe('setListingPremium', () => {
  const NEXT_YEAR = new Date(Date.now() + 365 * 86_400_000).toISOString()

  it('switches the flag on with an end date and refreshes the admin lists and the public pages in every language', async () => {
    expect(await setListingPremium('l1', true, NEXT_YEAR)).toEqual({ ok: true })
    expect(db.tables.listings[0]).toMatchObject({ is_premium: true, premium_until: NEXT_YEAR })
    expect(paths).toEqual(expect.arrayContaining(['/admin/listings', '/admin/badges', '/sq/listings', '/en/listings/flat-1', '/uk/listings', '/it/listings/flat-1']))
    expect(paths).toHaveLength(2 + 8)
  })

  it('without an end date the old one is left alone; with null it is cleared', async () => {
    db.tables.listings[0].premium_until = NEXT_YEAR
    await setListingPremium('l1', false)
    expect(db.tables.listings[0]).toMatchObject({ is_premium: false, premium_until: NEXT_YEAR })
    await setListingPremium('l1', true, null)
    expect(db.tables.listings[0].premium_until).toBeNull()
  })

  it('an end date in the past is refused and nothing is written', async () => {
    expect(await setListingPremium('l1', true, '2020-01-01T00:00:00Z')).toEqual({ error: 'date_in_past' })
    expect(db.tables.listings[0].is_premium).toBe(false)
  })

  it('a listing that does not exist is "not_found"', async () => {
    expect(await setListingPremium('nope', true)).toEqual({ error: 'not_found' })
  })

  it('a database failure is "transient", or "db_missing_column" when the column is not there yet', async () => {
    failTable = { table: 'listings', op: 'update', error: { message: 'x' } }
    expect(await setListingPremium('l1', true)).toEqual({ error: 'transient' })
    failTable = { table: 'listings', op: 'update', error: { code: '42703', message: 'no column' } }
    expect(await setListingPremium('l1', true)).toEqual({ error: 'db_missing_column' })
    expect(paths).toEqual([])
  })

  it('a moderator without the permission is refused; toggling goes through the same rules', async () => {
    db.tables.role_permissions = []
    expect(await setListingPremium('l1', true)).toEqual({ error: 'forbidden' })
    expect(await toggleListingPremium('l1', true)).toEqual({ error: 'forbidden' })
    db.tables.role_permissions = PERMISSIONS.map((permission_key) => ({ role: 'moderator', permission_key, allowed: true }))
    expect(await toggleListingPremium('l1', true)).toEqual({ ok: true })
    expect(db.tables.listings[0].is_premium).toBe(true)
  })
})

describe('deleteListing', () => {
  it('deletes one listing and refreshes the counters and the public lists', async () => {
    db.tables.listings.push({ id: 'l2', slug: 'x' })
    await deleteListing('l1')
    expect(db.tables.listings.map((l) => l.id)).toEqual(['l2'])
    expect(tags).toEqual(['site-stats'])
    expect(paths).toEqual(['/admin/listings', '/sq/listings', '/en/listings', '/uk/listings', '/it/listings'])
  })

  it('a database failure deletes nothing and refreshes nothing', async () => {
    failTable = { table: 'listings', op: 'delete', error: { message: 'fk' } }
    await deleteListing('l1')
    expect(tags).toEqual([])
    expect(paths).toEqual([])
  })

  it('without the permission it throws and deletes nothing', async () => {
    db.tables.role_permissions = []
    await expect(deleteListing('l1')).rejects.toThrow('forbidden')
    expect(db.tables.listings).toHaveLength(1)
  })
})

describe('locations', () => {
  it('create, update, feature and delete each change one row and refresh the page', async () => {
    expect(await createLocation({ name_al: 'Durrës', type: 'city', slug: 'durres' })).toEqual({})
    expect(await updateLocation(1, { name_al: 'Tiranë' })).toEqual({})
    expect(await toggleLocationFeatured(1, true)).toEqual({})
    expect(db.tables.locations.find((l) => l.id === 1)).toMatchObject({ name_al: 'Tiranë', is_featured: true })
    expect(await deleteLocation(1)).toEqual({})
    expect(db.tables.locations.map((l) => l.name_al)).toEqual(['Durrës'])
    expect(paths).toEqual(Array(4).fill('/admin/locations'))
  })

  // Task 923 R71 (f), X14: this was a characterisation of the leak ("a database failure returns its message") and is now its regression: a failure is a stable code, never the database text
  it('a database failure returns a stable error code, never the database message, and refreshes nothing', async () => {
    for (const [op, call, code] of [
      ['insert', () => createLocation({ name_al: 'X', type: 'city', slug: 'x' }), 'create_failed'],
      ['update', () => updateLocation(1, { name_al: 'X' }), 'update_failed'],
      ['update', () => toggleLocationFeatured(1, true), 'update_failed'],
      ['delete', () => deleteLocation(1), 'delete_failed'],
    ] as const) {
      failTable = { table: 'locations', op, error: { message: `fail ${op}` } }
      const result = await call()
      expect(result).toEqual({ error: code })
      expect(JSON.stringify(result), 'the database message is not returned').not.toContain(`fail ${op}`)
    }
    expect(paths).toEqual([])
  })

  it('addLocation makes a city under its region with a unique, plain slug', async () => {
    const res = await addLocation({ name_al: 'Pogradec Qendër!', region_id: 7 })
    expect(res.id).toBeDefined()
    const row = db.tables.locations.at(-1)!
    expect(row).toMatchObject({ name_al: 'Pogradec Qendër!', type: 'city', parent_id: 7, region_id: 7 })
    // every character outside a-z and 0-9 (the ë too) becomes a hyphen
    expect(row.slug).toMatch(/^pogradec-qend-r-\d+$/)
  })

  it('addLocation reports a failure', async () => {
    failTable = { table: 'locations', op: 'insert', error: { message: 'x' } }
    expect(await addLocation({ name_al: 'X', region_id: 1 })).toEqual({ error: 'add_failed' })
  })

  it('approving a request sets the location and clears the request; rejecting only clears it', async () => {
    expect(await approveLocationRequest(UUID, 1)).toEqual({})
    expect(db.tables.users.find((u) => u.id === UUID)).toMatchObject({ location_id: 1, location_request: null })
    db.tables.users.find((u) => u.id === UUID)!.location_request = 'Again'
    expect(await rejectLocationRequest(UUID)).toEqual({})
    expect(db.tables.users.find((u) => u.id === UUID)).toMatchObject({ location_id: 1, location_request: null })
    expect(paths).toEqual(expect.arrayContaining([`/admin/users/${UUID}`, '/admin/users', '/admin']))
  })

  it('a failed request decision returns a key and refreshes nothing', async () => {
    failTable = { table: 'users', op: 'update', error: { message: 'x' } }
    expect(await approveLocationRequest(UUID, 1)).toEqual({ error: 'confirm_failed' })
    expect(await rejectLocationRequest(UUID)).toEqual({ error: 'reject_failed' })
    expect(paths).toEqual([])
  })
})

describe('CMS pages', () => {
  it('create stores the Albanian title of the content, and refreshes the list', async () => {
    expect(await createPage({ title: 'Fallback', slug: 'about-us', content: body as never, is_published: true })).toEqual({})
    expect(db.tables.pages.at(-1)).toMatchObject({ slug: 'about-us', title: 'Kushtet', is_published: true })
    expect(paths).toEqual(['/admin/pages'])
  })

  it('create falls back to the given title when the Albanian one is empty', async () => {
    await createPage({ title: 'Fallback', slug: 'about-us', content: { sq: { title: '', body: '<p>x</p>' } } as never, is_published: false })
    expect(db.tables.pages.at(-1)?.title).toBe('Fallback')
  })

  it.each([['Upper'], ['a/b'], ['with space'], [''], ['auth'], ['sq'], ['cabinet']])('create refuses the slug %j', async (slug) => {
    const res = await createPage({ title: 'T', slug, content: body as never, is_published: false })
    expect(res.error).toMatch(/^slug_/)
    expect(db.tables.pages).toHaveLength(2)
  })

  it('create reports a database failure', async () => {
    failTable = { table: 'pages', op: 'insert', error: { message: 'x' } }
    expect(await createPage({ title: 'T', slug: 'fine', content: body as never, is_published: false })).toEqual({ error: 'save_error' })
  })

  it('update writes the known fields, the Albanian title and the time, and refreshes', async () => {
    expect(await updatePage(1, { content: { sq: { title: 'New title', body: '<p>x</p>' } } as never, is_published: true })).toEqual({})
    expect(db.tables.pages[0]).toMatchObject({ title: 'New title', is_published: true })
    expect(db.tables.pages[0].updated_at).toBeDefined()
  })

  it('update refuses a slug that is not valid or is used by ANOTHER page, and accepts its own', async () => {
    expect((await updatePage(1, { slug: 'Bad Slug' })).error).toMatch(/^slug_/)
    expect(await updatePage(1, { slug: 'privacy' })).toEqual({ error: 'slug_already_used' })
    expect(await updatePage(1, { slug: 'terms' })).toEqual({})
  })

  it('publishing needs an Albanian body: the supplied one, or the stored one when none is supplied', async () => {
    expect(await updatePage(2, { is_published: true })).toEqual({ error: 'sq_body_required' })
    expect(await updatePage(2, { is_published: true, content: { sq: { title: 'P', body: '<p>now</p>' } } as never })).toEqual({})
    expect(await updatePage(1, { is_published: true })).toEqual({})
  })

  it('update reports a failure; delete removes one page, or reports a failure', async () => {
    failTable = { table: 'pages', op: 'update', error: { message: 'x' } }
    expect(await updatePage(1, { title: 'T' })).toEqual({ error: 'save_error' })
    failTable = { table: 'pages', op: 'delete', error: { message: 'x' } }
    expect(await deletePage(1)).toEqual({ error: 'delete_error' })
    failTable = null
    expect(await deletePage(1)).toEqual({})
    expect(db.tables.pages.map((p) => p.id)).toEqual([2])
  })

  it('without the legal permission nothing is written', async () => {
    db.tables.role_permissions = []
    await expect(createPage({ title: 'T', slug: 'fine', content: body as never, is_published: false })).rejects.toThrow('forbidden')
    await expect(updatePage(1, { title: 'T' })).rejects.toThrow('forbidden')
    await expect(deletePage(1)).rejects.toThrow('forbidden')
  })
})

describe('searchUsersForPicker', () => {
  it('a text shorter than two characters finds nobody and does not ask', async () => {
    expect(await searchUsersForPicker(' a ')).toEqual([])
    // the only reads are the guard's own (Task 923 R44, R75): the caller's row and the moderator's key; nothing is asked about any other person
    expect(db.log.filter((l) => l.table !== 'users' && l.table !== 'role_permissions')).toEqual([])
    expect(db.log.filter((l) => l.table === 'users').every((l) => l.filters.length === 1 && l.filters[0][0] === 'id' && l.filters[0][1] === 'eq' && l.filters[0][2] === 'mod')).toBe(true)
    expect(db.log.filter((l) => l.table === 'users' && l.filters.some((f) => f[1] === 'or'))).toEqual([])
  })

  it('a whole id finds exactly that person, and not a deleted one', async () => {
    expect((await searchUsersForPicker(UUID)).map((u) => u.id)).toEqual([UUID])
    expect(await searchUsersForPicker(DELETED)).toEqual([])
  })

  it('a text search asks for the text as a VALUE: a comma or a bracket cannot add a condition', async () => {
    await searchUsersForPicker('x,role.eq.admin')
    await searchUsersForPicker('a),and(id.neq.0')
    const asked = db.log.flatMap((l) => l.filters).filter((f) => f[1] === 'or').map((f) => f[2] as string)
    expect(asked).toEqual([
      'name.ilike."%x,role.eq.admin%",last_name.ilike."%x,role.eq.admin%",phone.ilike."%x,role.eq.admin%",company_name.ilike."%x,role.eq.admin%"',
      'name.ilike."%a),and(id.neq.0%",last_name.ilike."%a),and(id.neq.0%",phone.ilike."%a),and(id.neq.0%",company_name.ilike."%a),and(id.neq.0%"',
    ])
  })

  it('a wildcard in the text is a literal character', async () => {
    await searchUsersForPicker('%_')
    const asked = db.log.flatMap((l) => l.filters).filter((f) => f[1] === 'or').map((f) => f[2] as string)
    // `%` and `_` are made literal with a backslash, and the quoting doubles that backslash
    expect(asked[0]).toContain(`name.ilike."%${'\\\\'}%${'\\\\'}_%"`)
  })

  it('only staff may search', async () => {
    currentUser = { id: 'usr' }
    await expect(searchUsersForPicker('alba')).rejects.toThrow('forbidden')
  })
})

describe('support tickets', () => {
  const base = { ticketType: 'support', requesterUserId: UUID, subject: ' Help ', reason: ' Cannot log in ' }

  it('creates a support ticket for an existing person, records the event and refreshes the list', async () => {
    const res = await createSupportTicket(base)
    expect(res.id).toBeDefined()
    expect(db.tables.support_tickets.at(-1)).toMatchObject({ user_id: UUID, subject: 'Help', reason: 'Cannot log in', created_by_admin_id: 'mod', ticket_type: 'support', status: 'open' })
    expect(db.tables.support_ticket_events[0]).toMatchObject({ actor_user_id: 'mod', actor_role: 'moderator', event_type: 'created', new_status: 'open', note: 'Cannot log in' })
    expect(notifications).toEqual([])
    expect(paths).toEqual(['/admin/support'])
  })

  it('a complaint needs the reported person and a known complaint type, and the reported person is told', async () => {
    const complaint = { ...base, ticketType: 'user_complaint', reportedUserId: 'adm', complaintType: 'fraud_or_scam' }
    const res = await createSupportTicket(complaint)
    expect(res.id).toBeDefined()
    expect(db.tables.support_tickets.at(-1)).toMatchObject({ reported_user_id: 'adm', complaint_type: 'fraud_or_scam' })
    expect(notifications).toMatchObject([{ userId: 'adm', type: 'support_reply', templateId: 'support_created' }])
  })

  it.each([
    ['an unknown ticket type', { ticketType: 'chat' }, 'ticket_type_invalid'], ['a blank requester', { requesterUserId: '  ' }, 'requester_required'],
    ['a complaint with no reported person', { ticketType: 'user_complaint', complaintType: 'spam' }, 'reported_required'],
    ['a complaint with no type', { ticketType: 'user_complaint', reportedUserId: 'adm' }, 'complaint_type_required'],
    ['a complaint with an unknown type', { ticketType: 'user_complaint', reportedUserId: 'adm', complaintType: 'rude' }, 'complaint_type_invalid'],
    ['a blank subject', { subject: ' ' }, 'subject_required'], ['a blank reason', { reason: ' ' }, 'reason_required'],
    ['a requester who does not exist', { requesterUserId: 'nobody' }, 'requester_not_found'],
    ['a reported person who does not exist', { ticketType: 'user_complaint', reportedUserId: 'nobody', complaintType: 'spam' }, 'reported_not_found'],
  ])('refuses %s with "%s" and writes nothing', async (_l, patch, error) => {
    expect(await createSupportTicket({ ...base, ...patch })).toEqual({ error })
    expect(db.tables.support_tickets).toHaveLength(2)
    expect(notifications).toEqual([])
  })

  it('a database failure is "create_failed" and tells nobody', async () => {
    failTable = { table: 'support_tickets', op: 'insert', error: { message: 'x' } }
    expect(await createSupportTicket(base)).toEqual({ error: 'create_failed' })
    expect(notifications).toEqual([])
  })

  it('moves a ticket on, records who and why, and tells the reported person only when it is resolved or closed', async () => {
    expect(await updateTicketStatus('t1', 'in_progress', ' looking ')).toEqual({})
    expect(notifications).toEqual([])
    expect(await updateTicketStatus('t1', 'resolved')).toEqual({})
    expect(await updateTicketStatus('t1', 'closed')).toEqual({})
    expect(db.tables.support_tickets[0].status).toBe('closed')
    expect(db.tables.support_ticket_events.map((e) => [e.old_status, e.new_status, e.note])).toEqual([['open', 'in_progress', 'looking'], ['in_progress', 'resolved', null], ['resolved', 'closed', null]])
    expect(notifications.map((n) => n.templateId)).toEqual(['support_resolved', 'support_closed'])
  })

  it('the same status again changes nothing', async () => {
    expect(await updateTicketStatus('t1', 'open')).toEqual({})
    expect(db.tables.support_ticket_events).toEqual([])
  })

  it('a ticket with no reported person tells nobody', async () => {
    await updateTicketStatus('t2', 'resolved')
    expect(notifications).toEqual([])
  })

  it.each([[''], ['deleted'], ['OPEN'], [undefined as unknown as string]])('refuses the status %j before anything else', async (status) => {
    currentUser = null
    expect(await updateTicketStatus('t1', status)).toEqual({ error: 'invalid_status' })
  })

  it('an unknown ticket is "not_found"; a database failure is "update_failed"', async () => {
    expect(await updateTicketStatus('nope', 'closed')).toEqual({ error: 'not_found' })
    failTable = { table: 'support_tickets', op: 'update', error: { message: 'x' } }
    expect(await updateTicketStatus('t1', 'closed')).toEqual({ error: 'update_failed' })
  })
})
