// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S33): the price-change and saved-search e-mails put the TITLE OF A LISTING into an HTML template and send it to people who
 * did not write it. A title is typed by the listing's author, so it is text, never markup.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
const sent: { to: string; subject: string; html: string }[] = []
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))
vi.mock('../emails/send', () => ({ sendEmail: async (p: { to: string; subject: string; html: string }) => { sent.push(p); return { id: 'm1' } } }))
vi.spyOn(console, 'warn').mockImplementation(() => {})

import { sendTemplatedEmail } from '../sendTemplatedEmail'

const TEMPLATE = { key: 'price_change_alert', locale: 'sq', is_active: true, subject: 'Çmimi: {{listingTitle}}', html_body: '<p>Ndryshim: <b>{{listingTitle}}</b> nga {{oldPrice}} në {{newPrice}}</p><a href="{{listingUrl}}">Shiko</a>' }

beforeEach(() => {
  // the English row comes first, so a lookup that forgets to ask for Albanian finds the wrong one
  db = createFakeDb({ email_templates: [{ ...TEMPLATE, locale: 'en', html_body: '<p>EN</p>' }, TEMPLATE, { ...TEMPLATE, key: 'off', is_active: false }] })
  sent.length = 0
})

describe('variables are text, the template is HTML', () => {
  it('a listing title with markup is shown as text and cannot add a link, a script or an attribute', async () => {
    const title = '<a href="https://evil.example/login">Verify your account</a><script>alert(1)</script>" onmouseover="x'
    await sendTemplatedEmail({ key: 'price_change_alert', to: 'ana@example.com', userId: 'u1', variables: { listingTitle: title, oldPrice: '100', newPrice: '90', listingUrl: 'https://lero.al/sq/listings/a' } })
    const html = sent[0].html
    expect(html).not.toContain('evil.example/login">')
    expect(html).not.toContain('<script>')
    expect(html).not.toMatch(/<a href="https:\/\/evil/)
    expect(html).toContain('&lt;a href=&quot;https://evil.example/login&quot;&gt;Verify your account&lt;/a&gt;')
    expect(html.match(/<a /g)).toHaveLength(3) // the template's own link plus the two fixed footer links
  })

  it('the template\'s own markup is kept', async () => {
    await sendTemplatedEmail({ key: 'price_change_alert', to: 'a@x.com', userId: 'u', variables: { listingTitle: 'Flat', oldPrice: '1', newPrice: '2', listingUrl: 'https://lero.al/a?x=1&y=2' } })
    expect(sent[0].html).toContain('<p>Ndryshim: <b>Flat</b> nga 1 në 2</p>')
    expect(sent[0].html).toContain('<a href="https://lero.al/a?x=1&amp;y=2">Shiko</a>')
  })

  it('the subject is plain text: the raw title, not entities', async () => {
    await sendTemplatedEmail({ key: 'price_change_alert', to: 'a@x.com', userId: 'u', variables: { listingTitle: 'Flat & garden <2>', oldPrice: '1', newPrice: '2', listingUrl: 'u' } })
    expect(sent[0].subject).toBe('Çmimi: Flat & garden <2>')
  })

  it('a value that looks like a placeholder is not expanded a second time', async () => {
    await sendTemplatedEmail({ key: 'price_change_alert', to: 'a@x.com', userId: 'u', variables: { listingTitle: '{{newPrice}}', oldPrice: '1', newPrice: 'SECRET', listingUrl: 'u' } })
    expect(sent[0].html).toContain('<b>{{newPrice}}</b>')
    expect(sent[0].html).not.toContain('<b>SECRET</b>')
  })

  it('a placeholder without a value stays visible instead of printing "undefined"', async () => {
    await sendTemplatedEmail({ key: 'price_change_alert', to: 'a@x.com', userId: 'u', variables: { listingTitle: 'Flat' } })
    expect(sent[0].html).toContain('{{oldPrice}}')
    expect(sent[0].html).not.toContain('undefined')
  })
})

describe('template lookup and sending', () => {
  it('always uses the Albanian active template', async () => {
    await sendTemplatedEmail({ key: 'price_change_alert', to: 'a@x.com', userId: 'u', variables: { listingTitle: 'Flat' } })
    expect(sent[0].html).toContain('Ndryshim')
    expect(sent[0].html).not.toContain('<p>EN</p>')
    expect(sent[0].html).toContain('<html lang="sq">')
  })

  it.each([['missing'], ['off']])('a %s template sends nothing and says so', async (key) => {
    expect(await sendTemplatedEmail({ key, to: 'a@x.com', userId: 'u' })).toEqual({ error: 'template_not_found' })
    expect(sent).toEqual([])
  })

  it('wraps the content in the brand frame and sends to the given address', async () => {
    await sendTemplatedEmail({ key: 'price_change_alert', to: 'ana@example.com', userId: 'u', variables: { listingTitle: 'Flat' } })
    expect(sent[0].to).toBe('ana@example.com')
    expect(sent[0].html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(sent[0].html).toContain(`© ${new Date().getFullYear()} Lero.al`)
  })
})

// Task 923 R38 (case SEC-S33-SRV-DENY)
it('[SEC-S33-SRV-DENY] Template variables are escaped in the HTML body and the subject stays plain text', async () => {
  const title = '<a href="https://evil.example/login">Verify</a><script>alert(1)</script>'
  await sendTemplatedEmail({ key: 'price_change_alert', to: 'ana@example.com', userId: 'u1', variables: { listingTitle: title, oldPrice: '100', newPrice: '90', listingUrl: 'https://lero.al/sq/listings/a' } })
  expect(sent[0].html).not.toContain('<script>')
  expect(sent[0].html).not.toMatch(/<a href="https:\/\/evil/)
  expect(sent[0].html).toContain('&lt;a href=')
  await sendTemplatedEmail({ key: 'price_change_alert', to: 'a@x.com', userId: 'u', variables: { listingTitle: 'Flat & garden <2>', oldPrice: '1', newPrice: '2', listingUrl: 'u' } })
  expect(sent[1].subject).toBe('Çmimi: Flat & garden <2>')           // the subject is the raw text, not entities
})
