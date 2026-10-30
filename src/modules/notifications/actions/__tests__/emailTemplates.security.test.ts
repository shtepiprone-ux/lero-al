// @vitest-environment node
/**
 * Security (Task 923 Revision 7): e-mail templates are HTML that is sent from our own address to our users.
 *  - an administrator or moderator may write one; ONLY an administrator may delete;
 *  - what is stored is checked at runtime: a plain key, one of the four languages, a subject, a body of sane size, a list of placeholder names;
 *  - the person who saved it is the one in the session, not one the caller names.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))

import { deleteEmailTemplateGroupAction, deleteEmailTemplateLocaleAction, upsertEmailTemplateAction } from '../emailTemplates'

const T = { key: ' Price Change Alert ', locale: 'sq' as const, subject: ' Çmimi ', html_body: '<p>{{listingTitle}}</p>', variables: ['listingTitle', 'oldPrice'], is_active: true }

function failing(table: string, op: 'upsert' | 'delete') {
  const real = db.client.from
  db.client.from = ((t: string) => {
    const c = real(t) as Record<string, unknown>
    if (t === table) {
      const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error: { message: 'boom' } }) : chain), apply: () => chain })
      c[op] = () => chain
    }
    return c
  }) as never
}

beforeEach(() => {
  db = createFakeDb({
    // active accounts, and the key a moderator needs to write a template (Task 923 R44, R71 (k), R75): `checkStaff()` reads the actor's own row and the key at each check
    users: [{ id: 'adm', role: 'admin', status: 'active' }, { id: 'mod', role: 'moderator', status: 'active' }, { id: 'usr', role: 'user', status: 'active' }, { id: 'agt', role: 'agent', status: 'active' }],
    role_permissions: [{ role: 'moderator', permission_key: 'email_templates.manage', allowed: true }],
    email_templates: [{ id: 't1', key: 'a', locale: 'sq' }, { id: 't2', key: 'a', locale: 'en' }, { id: 't3', key: 'b', locale: 'sq' }],
  })
  currentUser = { id: 'adm' }
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('upsertEmailTemplateAction', () => {
  it.each([['an administrator', 'adm'], ['a moderator', 'mod']])('%s saves a template; the key is normalised and the author is the session\'s user', async (_l, id) => {
    currentUser = { id }
    const res = await upsertEmailTemplateAction(T)
    expect(res.error).toBeUndefined()
    expect(db.tables.email_templates.at(-1)).toMatchObject({ key: 'price_change_alert', locale: 'sq', subject: 'Çmimi', html_body: '<p>{{listingTitle}}</p>', is_active: true, updated_by: id })
  })

  it('saving the same key and language again updates one row', async () => {
    await upsertEmailTemplateAction(T)
    await upsertEmailTemplateAction({ ...T, subject: 'New' })
    expect(db.tables.email_templates.filter((t) => t.key === 'price_change_alert' && t.locale === 'sq')).toHaveLength(1)
  })

  // a session whose profile row is missing is a guest for `requireViewer()` (a "zombie" session), so it gets the guest's answer
  it.each([['an anonymous caller', null, 'unauthorized'], ['a plain user', { id: 'usr' }, 'forbidden'], ['an agent', { id: 'agt' }, 'forbidden'], ['someone with no profile', { id: 'ghost' }, 'unauthorized']])('%s is refused and nothing is saved', async (_l, who, error) => {
    currentUser = who
    expect(await upsertEmailTemplateAction(T)).toEqual({ error })
    expect(db.tables.email_templates).toHaveLength(3)
  })

  it.each([
    ['an empty key', { key: ' ' }], ['a key with a slash', { key: 'a/b' }], ['a key with markup', { key: '<b>x</b>' }], ['a key over 64 characters', { key: 'k'.repeat(65) }], ['no key', { key: undefined }],
    ['a language that does not exist', { locale: 'xx' }], ['a language in capitals', { locale: 'SQ' }], ['an empty subject', { subject: '  ' }], ['a subject over 300 characters', { subject: 's'.repeat(301) }],
    ['a body that is not text', { html_body: { a: 1 } }], ['a body over 200 000 characters', { html_body: 'x'.repeat(200_001) }],
    ['variables that are not a list', { variables: 'a,b' }], ['a variable with a space', { variables: ['a b'] }], ['a variable that is not text', { variables: [5] }], ['more than 50 variables', { variables: Array.from({ length: 51 }, (_, i) => `v${i}`) }],
    ['a state that is not true / false', { is_active: 'yes' }],
  ])('refuses %s and saves nothing', async (_l, patch) => {
    expect(await upsertEmailTemplateAction({ ...T, ...patch } as never)).toEqual({ error: 'validation' })
    expect(db.tables.email_templates).toHaveLength(3)
  })

  it('accepts a body of exactly 200 000 characters and 50 variables', async () => {
    const res = await upsertEmailTemplateAction({ ...T, html_body: 'x'.repeat(200_000), variables: Array.from({ length: 50 }, (_, i) => `v${i}`) })
    expect(res.error).toBeUndefined()
  })

  it('refuses nothing at all', async () => {
    expect(await upsertEmailTemplateAction(undefined as never)).toEqual({ error: 'validation' })
  })

  it('a database failure is "save_failed"', async () => {
    failing('email_templates', 'upsert')
    expect(await upsertEmailTemplateAction(T)).toEqual({ error: 'save_failed' })
  })
})

describe('deleting templates is for administrators only', () => {
  const calls: [string, () => Promise<{ error?: string }>][] = [
    ['deleteEmailTemplateGroupAction', () => deleteEmailTemplateGroupAction('a')],
    ['deleteEmailTemplateLocaleAction', () => deleteEmailTemplateLocaleAction('t3')],
  ]

  describe.each([['a moderator', { id: 'mod' }, 'forbidden'], ['a plain user', { id: 'usr' }, 'forbidden'], ['an anonymous caller', null, 'unauthorized']])('%s', (_l, who, error) => {
    beforeEach(() => { currentUser = who })
    it.each(calls)('%s is refused', async (_n, call) => {
      expect(await call()).toEqual({ error })
      expect(db.tables.email_templates).toHaveLength(3)
    })
  })

  it('an administrator deletes every language of a key, and only that key', async () => {
    expect(await deleteEmailTemplateGroupAction('a')).toEqual({})
    expect(db.tables.email_templates.map((t) => t.id)).toEqual(['t3'])
  })

  it('an administrator deletes one language by id, and only that one', async () => {
    expect(await deleteEmailTemplateLocaleAction('t2')).toEqual({})
    expect(db.tables.email_templates.map((t) => t.id)).toEqual(['t1', 't3'])
  })

  it('a database failure is "delete_failed"', async () => {
    failing('email_templates', 'delete')
    expect(await deleteEmailTemplateGroupAction('a')).toEqual({ error: 'delete_failed' })
    expect(await deleteEmailTemplateLocaleAction('t1')).toEqual({ error: 'delete_failed' })
  })
})
