// @vitest-environment node
/**
 * Security (Task 923 Revision 7, findings S22 / S34): the messages that carry text a stranger typed — the contact form, an inquiry about a listing, an e-mail change.
 * Every such value is shown as TEXT (never as markup, a link or an attribute), the reply goes to the person who wrote it, the staff reply uses the mailbox of its
 * topic, and a failed send is reported, not thrown.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Sent = { to: string; subject: string; html?: string; replyTo?: string; from?: string; react?: { props: Record<string, unknown> } }
const sent: Sent[] = []
let sendResult: { id?: string; error?: string } = { id: 'm1' }
vi.mock('../send', () => ({ sendEmail: async (p: Sent) => { sent.push(p); return sendResult } }))
vi.spyOn(console, 'error').mockImplementation(() => {})

import { sendContactInquiryNotification, sendContactInquiryReply } from '../contactInquiry'
import { sendListingInquiryNotification } from '../listingInquiry'
import { sendEmailChangeEmails } from '../emailChange'
import { sendPasswordChangedEmail } from '../passwordChanged'

const HOSTILE = '<a href="https://evil.example/login">Verify your account</a><img src=x onerror=alert(1)>" onmouseover="x'
const ESCAPED_LINK = '&lt;a href=&quot;https://evil.example/login&quot;&gt;Verify your account&lt;/a&gt;'
const noMarkup = (html: string) => {
  expect(html).not.toContain('<a href="https://evil.example')
  expect(html).not.toContain('<img src=x')
  expect(html).not.toContain('<script')
  expect(html).toContain(ESCAPED_LINK)
}

beforeEach(() => { sent.length = 0; sendResult = { id: 'm1' } })

describe('contact inquiry to staff', () => {
  const opts = { to: 'support@lero.al', replyTo: 'visitor@example.com', name: 'Visitor', email: 'visitor@example.com', topic: 'general', displaySubject: 'Help', message: 'Hello\nthere' }

  it('goes to the staff mailbox and replies to the visitor', async () => {
    expect(await sendContactInquiryNotification(opts)).toEqual({ ok: true, id: 'm1' })
    expect(sent[0]).toMatchObject({ to: 'support@lero.al', replyTo: 'visitor@example.com' })
    expect(sent[0].html).toContain('Hello<br />there')
  })

  it('every field the visitor typed is text', async () => {
    await sendContactInquiryNotification({ ...opts, name: HOSTILE, email: HOSTILE, displaySubject: HOSTILE, message: HOSTILE })
    noMarkup(sent[0].html!)
    expect(sent[0].html!.split(ESCAPED_LINK).length - 1).toBe(4)
  })

  it.each([['sq', 'Mesazh i ri nga formulari'], ['en', 'New contact inquiry'], ['uk', 'Нове повідомлення'], ['it', 'Nuovo messaggio'], ['xx', 'New contact inquiry']])('locale %s: subject starts with %s', async (locale, start) => {
    await sendContactInquiryNotification({ ...opts, locale })
    expect(sent[0].subject.startsWith(start)).toBe(true)
    expect(sent[0].subject.endsWith('Help')).toBe(true)
  })

  it('defaults to Albanian', async () => {
    await sendContactInquiryNotification(opts)
    expect(sent[0].subject.startsWith('Mesazh i ri nga formulari')).toBe(true)
  })

  it('a failed send is reported with its reason', async () => {
    sendResult = { error: 'transient' }
    expect(await sendContactInquiryNotification(opts)).toEqual({ ok: false, reason: 'transient' })
  })
})

describe('staff reply to the visitor', () => {
  const opts = { to: 'visitor@example.com', fromMailbox: 'support@lero.al', displaySubject: 'Help', replyBody: 'We fixed it.\nThanks' }

  it('is sent from the topic\'s mailbox and replies go back to it', async () => {
    expect(await sendContactInquiryReply(opts)).toEqual({ ok: true, id: 'm1' })
    expect(sent[0]).toMatchObject({ from: 'Lero.al <support@lero.al>', replyTo: 'support@lero.al', to: 'visitor@example.com' })
    expect(sent[0].html).toContain('We fixed it.<br />Thanks')
  })

  it('the reply body is text', async () => {
    await sendContactInquiryReply({ ...opts, replyBody: HOSTILE })
    noMarkup(sent[0].html!)
  })

  it.each([['sq', 'Përgjigje ndaj kërkesës suaj'], ['en', 'Reply to your inquiry'], ['uk', 'Відповідь на ваш запит'], ['it', 'Risposta alla tua richiesta'], ['xx', 'Reply to your inquiry']])('locale %s', async (locale, start) => {
    await sendContactInquiryReply({ ...opts, locale })
    expect(sent[0].subject.startsWith(start)).toBe(true)
  })

  it('a failed send is reported', async () => {
    sendResult = { error: 'unverified_sender' }
    expect(await sendContactInquiryReply(opts)).toEqual({ ok: false, reason: 'unverified_sender' })
  })
})

describe('listing inquiry to the owner', () => {
  const opts = { to: 'owner@example.com', replyTo: 'buyer@example.com', listingTitle: 'Flat in Tirana', name: 'Buyer', email: 'buyer@example.com', message: 'Is it free?\nCall me' }

  it('goes to the owner and replies to the buyer', async () => {
    expect(await sendListingInquiryNotification(opts)).toEqual({ ok: true, id: 'm1' })
    expect(sent[0]).toMatchObject({ to: 'owner@example.com', replyTo: 'buyer@example.com' })
    expect(sent[0].subject).toContain('Flat in Tirana')
    expect(sent[0].html).toContain('Is it free?<br />Call me')
  })

  it('the buyer\'s name, e-mail, message and the listing title are all text', async () => {
    await sendListingInquiryNotification({ ...opts, listingTitle: HOSTILE, name: HOSTILE, email: HOSTILE, message: HOSTILE })
    noMarkup(sent[0].html!)
    expect(sent[0].html!.split(ESCAPED_LINK).length - 1).toBe(4)
  })

  it.each(['sq', 'en', 'uk', 'it', 'xx'])('locale %s sends', async (locale) => {
    expect((await sendListingInquiryNotification({ ...opts, locale })).ok).toBe(true)
  })

  it('a failed send is reported', async () => {
    sendResult = { error: 'send_failed' }
    expect(await sendListingInquiryNotification(opts)).toEqual({ ok: false, reason: 'send_failed' })
  })
})

describe('e-mail change messages', () => {
  const opts = { userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com', verificationUrl: 'https://lero.al/sq/auth/confirm-email?token=abc', locale: 'en' }

  it('sends the verification link to the NEW address and the warning to the OLD one, in Albanian whatever locale is asked', async () => {
    await sendEmailChangeEmails(opts)
    const toNew = sent.find((m) => m.to === 'new@example.com')!
    const toOld = sent.find((m) => m.to === 'old@example.com')!
    expect(toNew.html).toContain('href="https://lero.al/sq/auth/confirm-email?token=abc"')
    expect(toNew.html).not.toContain('old@example.com')
    expect(toOld.html).toContain('old@example.com')
    expect(toOld.html).toContain('new@example.com')
    expect(toOld.html).not.toContain('token=abc')
    expect(toNew.subject).not.toBe(toOld.subject)
  })

  it('the addresses and the device hint are text', async () => {
    await sendEmailChangeEmails({ ...opts, oldEmail: HOSTILE, newEmail: HOSTILE, ip: HOSTILE })
    // (the recipients are unsafe addresses, so the real sendEmail refuses them; the body must not carry markup either way)
    expect(sent).toHaveLength(2)
    for (const m of sent) {
      expect(m.html).not.toContain('<a href="https://evil.example')
      expect(m.html).not.toContain('<img src=x')
    }
    const warning = sent.find((m) => m.html!.includes('Verify your account'))!
    expect(warning.html!.split(ESCAPED_LINK).length - 1).toBe(3) // old address, new address, device hint
  })

  it('the verification link is escaped inside the attribute and the visible text', async () => {
    await sendEmailChangeEmails({ ...opts, verificationUrl: 'https://lero.al/x?a=1&b="><script>1</script>' })
    const toNew = sent.find((m) => m.to === 'new@example.com')!
    expect(toNew.html).not.toContain('<script>')
    expect(toNew.html).toContain('a=1&amp;b=&quot;&gt;&lt;script&gt;')
  })

  it.each([
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17) Mobile Safari', 'Mobile'],
    ['Mozilla/5.0 (iPad) Tablet', 'Tablet'],
    ['Mozilla/5.0 (Windows NT 10.0) Chrome', 'Desktop'],
  ])('the browser %j shows as %s', async (userAgent, label) => {
    await sendEmailChangeEmails({ ...opts, ip: '203.0.113.5', userAgent })
    const toOld = sent.find((m) => m.to === 'old@example.com')!
    expect(toOld.html).toContain(`203.0.113.5 · ${label}`)
  })

  it('without an address or browser there is no device row', async () => {
    await sendEmailChangeEmails(opts)
    const toOld = sent.find((m) => m.to === 'old@example.com')!
    expect(toOld.html).not.toContain('Pajisja')
    expect(toOld.html).not.toContain(' · ')
  })

  it('a failed send does not throw', async () => {
    sendResult = { error: 'transient' }
    await expect(sendEmailChangeEmails(opts)).resolves.toBeUndefined()
  })
})

describe('password changed message', () => {
  it('without a recipient nothing is sent', async () => {
    expect(await sendPasswordChangedEmail({ to: '' })).toEqual({ error: 'missing_content' })
    expect(sent).toEqual([])
  })

  it('goes to the recipient in Albanian with the name and time', async () => {
    const changedAt = new Date('2026-10-17T10:00:00Z')
    expect(await sendPasswordChangedEmail({ to: 'ana@example.com', name: 'Ana', changedAt })).toEqual({ id: 'm1' })
    expect(sent[0].to).toBe('ana@example.com')
    expect(sent[0].subject).toBe('Fjalëkalimi juaj në Lero.al është ndryshuar')
    expect(sent[0].react?.props).toMatchObject({ name: 'Ana', changedAt })
  })

  it('a missing name is passed as null', async () => {
    await sendPasswordChangedEmail({ to: 'ana@example.com' })
    expect(sent[0].react?.props.name).toBeNull()
  })

  it('a failed send is returned, not thrown', async () => {
    sendResult = { error: 'transient' }
    expect(await sendPasswordChangedEmail({ to: 'ana@example.com' })).toEqual({ error: 'transient' })
  })
})
