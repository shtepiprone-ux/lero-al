/**
 * Staff notification email for a new contact inquiry.
 *
 * To = target staff mailbox (routed by topic), Reply-To = submitter's email.
 * Staff can hit reply to respond directly to the inquirer.
 *
 * Locale strings are inline (sq/en/uk/it) — same pattern as emailChange.ts.
 */
import { BRAND_PRIMARY } from '@/design-system/brand'
import { sendEmail } from './send'

const STRINGS: Record<string, {
  subject: (topic: string) => string
  heading: string
  body: string
  nameLabel: string
  emailLabel: string
  topicLabel: string
  messageLabel: string
  replyHint: string
}> = {
  sq: {
    subject: (topic) => `Mesazh i ri nga formulari i kontaktit — ${topic}`,
    heading: 'Mesazh i ri nga faqja',
    body: 'Keni marrë një mesazh të ri nëpërmjet formularit të kontaktit në Lero.al:',
    nameLabel: 'Emri',
    emailLabel: 'Email',
    topicLabel: 'Tema',
    messageLabel: 'Mesazhi',
    replyHint: 'Për të përgjigjur, klikoni "Përgjigju" — emaili juaj do të shkojë drejtpërdrejt tek dërguesi.',
  },
  en: {
    subject: (topic) => `New contact inquiry — ${topic}`,
    heading: 'New message from the website',
    body: 'You have received a new message via the contact form on Lero.al:',
    nameLabel: 'Name',
    emailLabel: 'Email',
    topicLabel: 'Topic',
    messageLabel: 'Message',
    replyHint: 'To reply, click "Reply" — your email will go directly to the sender.',
  },
  uk: {
    subject: (topic) => `Нове повідомлення з форми зворотного зв'язку — ${topic}`,
    heading: 'Нове повідомлення з сайту',
    body: 'Ви отримали нове повідомлення через форму зворотного зв\'язку на Lero.al:',
    nameLabel: 'Ім\'я',
    emailLabel: 'Email',
    topicLabel: 'Тема',
    messageLabel: 'Повідомлення',
    replyHint: 'Щоб відповісти, натисніть «Відповісти» — ваш лист надійде безпосередньо відправнику.',
  },
  it: {
    subject: (topic) => `Nuovo messaggio dal modulo di contatto — ${topic}`,
    heading: 'Nuovo messaggio dal sito',
    body: 'Hai ricevuto un nuovo messaggio tramite il modulo di contatto su Lero.al:',
    nameLabel: 'Nome',
    emailLabel: 'Email',
    topicLabel: 'Argomento',
    messageLabel: 'Messaggio',
    replyHint: 'Per rispondere, clicca "Rispondi" — la tua email andrà direttamente al mittente.',
  },
}

function getStrings(locale: string) {
  return STRINGS[locale] ?? STRINGS.en
}

function buildHtml(opts: {
  name: string
  email: string
  topic: string
  displaySubject: string
  message: string
  locale: string
}): string {
  const s = getStrings(opts.locale)
  const year = new Date().getFullYear()
  const safeMessage = opts.message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lero.al</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:40px 32px;border:1px solid #e4e4e7;">
        <tr><td>
          <div style="font-size:22px;font-weight:700;color:${BRAND_PRIMARY};margin-bottom:8px;">Lero.al</div>
          <h2 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 16px;">${s.heading}</h2>
          <p style="font-size:14px;color:#71717a;margin:0 0 24px;">${s.body}</p>
          <table style="background:#f4f4f5;border-radius:8px;padding:16px;width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="font-size:12px;color:#71717a;padding:4px 0;width:30%;">${s.nameLabel}:</td>
              <td style="font-size:14px;color:#18181b;font-weight:500;">${opts.name}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#71717a;padding:4px 0;">${s.emailLabel}:</td>
              <td style="font-size:14px;color:#18181b;font-weight:500;">${opts.email}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#71717a;padding:4px 0;">${s.topicLabel}:</td>
              <td style="font-size:14px;color:#18181b;">${opts.displaySubject}</td>
            </tr>
          </table>
          <div style="margin-bottom:16px;">
            <p style="font-size:12px;color:#71717a;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">${s.messageLabel}</p>
            <div style="background:#f9f9fb;border-left:3px solid ${BRAND_PRIMARY};padding:16px;border-radius:0 6px 6px 0;font-size:14px;color:#27272a;line-height:1.7;">
              ${safeMessage}
            </div>
          </div>
          <p style="font-size:13px;color:#71717a;border-top:1px solid #e4e4e7;padding-top:16px;margin:0;">${s.replyHint}</p>
          <div style="margin-top:32px;border-top:1px solid #e4e4e7;padding-top:16px;font-size:12px;color:#a1a1aa;">
            © ${year} Lero.al
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendContactInquiryNotification(opts: {
  to: string
  replyTo: string
  name: string
  email: string
  topic: string
  displaySubject: string
  message: string
  locale?: string
}): Promise<{ ok: true; id?: string } | { ok: false; reason: string }> {
  const locale = opts.locale ?? 'sq'
  const s = getStrings(locale)

  const result = await sendEmail({
    to: opts.to,
    subject: s.subject(opts.displaySubject),
    replyTo: opts.replyTo,
    html: buildHtml({
      name: opts.name,
      email: opts.email,
      topic: opts.topic,
      displaySubject: opts.displaySubject,
      message: opts.message,
      locale,
    }),
  })

  if (result.error) {
    console.error('[contact-inquiry] Failed to send staff notification', {
      to: opts.to,
      topic: opts.topic,
      error: result.error,
    })
    return { ok: false, reason: result.error }
  }

  return { ok: true, id: result.id }
}

// ── Staff reply to user ───────────────────────────────────────────────────────

const REPLY_STRINGS: Record<string, {
  subject: (topic: string) => string
  heading: string
  body: string
  replyHint: string
}> = {
  sq: {
    subject: (topic) => `Përgjigje ndaj kërkesës suaj — ${topic}`,
    heading: 'Kemi marrë mesazhin tuaj',
    body: 'Ekipi ynë i mbështetjes ju dërgon këtë përgjigje ndaj kërkesës tuaj:',
    replyHint: 'Nëse keni pyetje të mëtejshme, mund të përgjigjeni drejtpërdrejt ndaj këtij emaili.',
  },
  en: {
    subject: (topic) => `Reply to your inquiry — ${topic}`,
    heading: 'We\'ve received your message',
    body: 'Our support team has sent you the following reply:',
    replyHint: 'If you have further questions, you can reply directly to this email.',
  },
  uk: {
    subject: (topic) => `Відповідь на ваш запит — ${topic}`,
    heading: 'Ми отримали ваше повідомлення',
    body: 'Наша команда підтримки надсилає вам таку відповідь:',
    replyHint: 'Якщо у вас виникнуть додаткові запитання, ви можете відповісти безпосередньо на цей лист.',
  },
  it: {
    subject: (topic) => `Risposta alla tua richiesta — ${topic}`,
    heading: 'Abbiamo ricevuto il tuo messaggio',
    body: 'Il nostro team di supporto ti ha inviato la seguente risposta:',
    replyHint: 'Se hai ulteriori domande, puoi rispondere direttamente a questa email.',
  },
}

function getReplyStrings(locale: string) {
  return REPLY_STRINGS[locale] ?? REPLY_STRINGS.en
}

function buildReplyHtml(opts: {
  replyBody: string
  displaySubject: string
  fromMailbox: string
  locale: string
}): string {
  const s = getReplyStrings(opts.locale)
  const year = new Date().getFullYear()
  const safeBody = opts.replyBody
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lero.al</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:40px 32px;border:1px solid #e4e4e7;">
        <tr><td>
          <div style="font-size:22px;font-weight:700;color:${BRAND_PRIMARY};margin-bottom:8px;">Lero.al</div>
          <h2 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 12px;">${s.heading}</h2>
          <p style="font-size:14px;color:#71717a;margin:0 0 20px;">${s.body}</p>
          <div style="background:#f9f9fb;border-left:3px solid ${BRAND_PRIMARY};padding:16px;border-radius:0 6px 6px 0;font-size:14px;color:#27272a;line-height:1.7;margin-bottom:24px;">
            ${safeBody}
          </div>
          <p style="font-size:13px;color:#71717a;border-top:1px solid #e4e4e7;padding-top:16px;margin:0;">${s.replyHint}</p>
          <div style="margin-top:32px;border-top:1px solid #e4e4e7;padding-top:16px;font-size:12px;color:#a1a1aa;">
            © ${year} Lero.al
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendContactInquiryReply(opts: {
  to: string
  fromMailbox: string
  displaySubject: string
  replyBody: string
  locale?: string
}): Promise<{ ok: true; id?: string } | { ok: false; reason: string }> {
  const locale = opts.locale ?? 'sq'
  const s = getReplyStrings(locale)

  const result = await sendEmail({
    from: `Lero.al <${opts.fromMailbox}>`,
    to: opts.to,
    replyTo: opts.fromMailbox,
    subject: s.subject(opts.displaySubject),
    html: buildReplyHtml({
      replyBody: opts.replyBody,
      displaySubject: opts.displaySubject,
      fromMailbox: opts.fromMailbox,
      locale,
    }),
  })

  if (result.error) {
    console.error('[contact-inquiry] Failed to send reply email', {
      to: opts.to,
      error: result.error,
    })
    return { ok: false, reason: result.error }
  }

  return { ok: true, id: result.id }
}
