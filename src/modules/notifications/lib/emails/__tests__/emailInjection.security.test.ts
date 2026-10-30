// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S22): HTML e-mail injection.
 *
 * The listing-inquiry and contact-form e-mails put the sender's NAME and E-MAIL (and the contact subject) into the HTML body unescaped. Anyone can submit those
 * forms, so a visitor could place a link, an image or a form into a message that arrives from OUR domain, addressed to a listing owner or to our staff: a ready-made
 * phishing message. Every value a person typed must reach the HTML as text.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sent: { html?: string; subject?: string; to?: string; replyTo?: string }[] = []
vi.mock('../send', () => ({ sendEmail: vi.fn(async (a: { html?: string }) => { sent.push(a); return { id: 'x' } }) }))

import { sendContactInquiryNotification, sendContactInquiryReply } from '../contactInquiry'
import { sendListingInquiryNotification } from '../listingInquiry'

const LINK = '<a href="https://evil.example/login">Verify your account</a>'
const IMG = '<img src="https://evil.example/track.gif">'
const SCRIPT = '<script>alert(document.cookie)</script>'
const QUOTE = '" onmouseover="alert(1)'

const htmlOf = () => sent[0].html ?? ''
/** the markup that must never come out of a value a person typed */
const injected = (html: string) => /<a href="https:\/\/evil\.example|<img src="https:\/\/evil\.example|<script>alert|" onmouseover=/.test(html)

beforeEach(() => { sent.length = 0 })

describe('sendListingInquiryNotification (to a listing owner)', () => {
  const call = (over: Partial<Parameters<typeof sendListingInquiryNotification>[0]>) => sendListingInquiryNotification({
    to: 'owner@example.com', replyTo: 'visitor@example.com', listingTitle: 'Flat', name: 'Alba', email: 'alba@example.com', message: 'Hello', locale: 'en', ...over,
  })

  it.each([['name', LINK], ['name', IMG], ['name', SCRIPT], ['name', QUOTE], ['email', LINK], ['email', IMG], ['listingTitle', LINK], ['listingTitle', SCRIPT], ['message', LINK], ['message', SCRIPT]])('a hostile %s (%s) reaches the HTML as text', async (field, value) => {
    await call({ [field]: value })
    expect(injected(htmlOf())).toBe(false)
    expect(/&lt;|&quot;/.test(htmlOf())).toBe(true)
  })

  it('an ordinary inquiry still shows the name, the address and the message', async () => {
    await call({ name: 'Alba Krasniqi', email: 'alba@example.com', message: 'Is it available?' })
    for (const text of ['Alba Krasniqi', 'alba@example.com', 'Is it available?']) expect(htmlOf()).toContain(text)
  })

  it('a name with an ampersand and an apostrophe is shown correctly', async () => {
    await call({ name: "Tom & Jerry O'Neil" })
    expect(htmlOf()).toContain('Tom &amp; Jerry O&#39;Neil')
  })
})

describe('sendContactInquiryNotification (to our staff)', () => {
  const call = (over: Partial<Parameters<typeof sendContactInquiryNotification>[0]>) => sendContactInquiryNotification({
    to: 'support@lero.al', replyTo: 'visitor@example.com', name: 'Alba', email: 'alba@example.com', topic: 'general', displaySubject: 'General question', message: 'Hello', locale: 'en', ...over,
  })

  it.each([['name', LINK], ['name', SCRIPT], ['name', QUOTE], ['email', LINK], ['email', IMG], ['displaySubject', LINK], ['displaySubject', SCRIPT], ['message', LINK]])('a hostile %s (%s) reaches the HTML as text', async (field, value) => {
    await call({ [field]: value })
    expect(injected(htmlOf())).toBe(false)
  })

  it('the topic is not a way in either', async () => {
    await call({ topic: LINK })
    expect(injected(htmlOf())).toBe(false)
  })

  it('an ordinary message still shows its parts', async () => {
    await call({ name: 'Alba', email: 'alba@example.com', displaySubject: 'Partnership', message: 'Line one\nLine two' })
    expect(htmlOf()).toContain('Alba')
    expect(htmlOf()).toContain('Partnership')
    expect(htmlOf()).toContain('Line one<br />Line two')
  })
})

describe('sendContactInquiryReply (staff to a visitor)', () => {
  it('the staff reply text reaches the HTML as text', async () => {
    await sendContactInquiryReply({ to: 'visitor@example.com', fromMailbox: 'support@lero.al', displaySubject: 'Re', replyBody: `${LINK}\n${SCRIPT}`, locale: 'en' })
    expect(injected(htmlOf())).toBe(false)
  })
})

// Task 923 R38 (case SEC-S22-SRV-DENY)
it('[SEC-S22-SRV-DENY] Typed values of contact and listing inquiries are escaped in the e-mail HTML', async () => {
  await sendListingInquiryNotification({
    to: 'owner@example.com', replyTo: 'visitor@example.com', listingTitle: 'Flat', name: LINK, email: IMG, message: SCRIPT, locale: 'en',
  })
  expect(injected(htmlOf())).toBe(false)
  expect(htmlOf()).toContain('&lt;a href=')              // the typed text is in the body, as text
  await sendListingInquiryNotification({ to: 'owner@example.com', replyTo: 'visitor@example.com', listingTitle: 'Flat', name: 'Alba Krasniqi', email: 'alba@example.com', message: 'Is it available?', locale: 'en' })
  expect(sent[1].html).toContain('Alba Krasniqi')         // the control: an ordinary inquiry is shown as typed
})
