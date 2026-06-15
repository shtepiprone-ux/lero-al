/**
 * Owner notification email for a new listing inquiry (Epic BB / Task 243, Path A).
 *
 * To = listing owner's email (resolved server-side), Reply-To = inquirer's email.
 * Owner can hit reply to respond directly to the inquirer.
 *
 * Locale strings are inline (sq/en/uk/it) — same pattern as contactInquiry.ts.
 * Locale defaults to 'sq' (Task 251 — outbound notification language policy).
 */
import { sendEmail } from './send'

const STRINGS: Record<string, {
  subject: (listingTitle: string) => string
  heading: string
  body: string
  listingLabel: string
  nameLabel: string
  emailLabel: string
  messageLabel: string
  replyHint: string
}> = {
  sq: {
    subject: (listingTitle) => `Mesazh i ri për shpalljen tuaj — ${listingTitle}`,
    heading: 'Mesazh i ri për shpalljen tuaj',
    body: 'Dikush ka dërguar një mesazh në lidhje me shpalljen tuaj në Lero.al:',
    listingLabel: 'Shpallja',
    nameLabel: 'Emri',
    emailLabel: 'Email',
    messageLabel: 'Mesazhi',
    replyHint: 'Për të përgjigjur, klikoni "Përgjigju" — emaili juaj do të shkojë drejtpërdrejt tek dërguesi.',
  },
  en: {
    subject: (listingTitle) => `New message about your listing — ${listingTitle}`,
    heading: 'New message about your listing',
    body: 'Someone has sent a message about your listing on Lero.al:',
    listingLabel: 'Listing',
    nameLabel: 'Name',
    emailLabel: 'Email',
    messageLabel: 'Message',
    replyHint: 'To reply, click "Reply" — your email will go directly to the sender.',
  },
  uk: {
    subject: (listingTitle) => `Нове повідомлення щодо вашого оголошення — ${listingTitle}`,
    heading: 'Нове повідомлення щодо вашого оголошення',
    body: 'Хтось надіслав повідомлення щодо вашого оголошення на Lero.al:',
    listingLabel: 'Оголошення',
    nameLabel: 'Ім\'я',
    emailLabel: 'Email',
    messageLabel: 'Повідомлення',
    replyHint: 'Щоб відповісти, натисніть «Відповісти» — ваш лист надійде безпосередньо відправнику.',
  },
  it: {
    subject: (listingTitle) => `Nuovo messaggio sul tuo annuncio — ${listingTitle}`,
    heading: 'Nuovo messaggio sul tuo annuncio',
    body: 'Qualcuno ha inviato un messaggio riguardo al tuo annuncio su Lero.al:',
    listingLabel: 'Annuncio',
    nameLabel: 'Nome',
    emailLabel: 'Email',
    messageLabel: 'Messaggio',
    replyHint: 'Per rispondere, clicca "Rispondi" — la tua email andrà direttamente al mittente.',
  },
}

function getStrings(locale: string) {
  return STRINGS[locale] ?? STRINGS.en
}

function buildHtml(opts: {
  listingTitle: string
  name: string
  email: string
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
  const safeListingTitle = opts.listingTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

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
          <div style="font-size:22px;font-weight:700;color:#EC5447;margin-bottom:8px;">Lero.al</div>
          <h2 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 16px;">${s.heading}</h2>
          <p style="font-size:14px;color:#71717a;margin:0 0 24px;">${s.body}</p>
          <table style="background:#f4f4f5;border-radius:8px;padding:16px;width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="font-size:12px;color:#71717a;padding:4px 0;width:30%;">${s.listingLabel}:</td>
              <td style="font-size:14px;color:#18181b;font-weight:500;">${safeListingTitle}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#71717a;padding:4px 0;">${s.nameLabel}:</td>
              <td style="font-size:14px;color:#18181b;font-weight:500;">${opts.name}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#71717a;padding:4px 0;">${s.emailLabel}:</td>
              <td style="font-size:14px;color:#18181b;font-weight:500;">${opts.email}</td>
            </tr>
          </table>
          <div style="margin-bottom:16px;">
            <p style="font-size:12px;color:#71717a;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">${s.messageLabel}</p>
            <div style="background:#f9f9fb;border-left:3px solid #EC5447;padding:16px;border-radius:0 6px 6px 0;font-size:14px;color:#27272a;line-height:1.7;">
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

export async function sendListingInquiryNotification(opts: {
  to: string
  replyTo: string
  listingTitle: string
  name: string
  email: string
  message: string
  locale?: string
}): Promise<{ ok: true; id?: string } | { ok: false; reason: string }> {
  const locale = opts.locale ?? 'sq'
  const s = getStrings(locale)

  const result = await sendEmail({
    to: opts.to,
    subject: s.subject(opts.listingTitle),
    replyTo: opts.replyTo,
    html: buildHtml({
      listingTitle: opts.listingTitle,
      name: opts.name,
      email: opts.email,
      message: opts.message,
      locale,
    }),
  })

  if (result.error) {
    console.error('[listing-inquiry] Failed to send owner notification', {
      to: opts.to,
      error: result.error,
    })
    return { ok: false, reason: result.error }
  }

  return { ok: true, id: result.id }
}
