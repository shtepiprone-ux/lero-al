/**
 * Email templates and sender for the email-change flow.
 *
 * Sends two emails: verification link to the new address + security notice
 * to the old address. Both are plain-text-fallback-friendly and mobile-responsive.
 *
 * Locale strings are inline (sq/en/uk/it) — emails render server-side outside
 * the next-intl context. This is the canonical pattern for all code-first
 * transactional emails (see docs/integrations.md § Email Template Architecture).
 *
 * NOTE: HTML is hand-crafted here (not a React Email component) because the
 * email-change flow predates the React Email foundation. Converting it to a
 * BaseEmail-wrapped component is deferred to a future cleanup task — the
 * required outcome is routing through the shared send helper, which is done.
 */
import { sendEmail } from './send'

// ── Locale strings ────────────────────────────────────────────────────────────

const STRINGS: Record<string, {
  verifySubject: string
  verifyButton: string
  verifyGreeting: string
  verifyBody: string
  verifyExpiry: string
  verifyIgnore: string
  securitySubject: string
  securityGreeting: string
  securityBody: string
  securityAdvice: string
}> = {
  sq: {
    verifySubject: 'Konfirmoni adresën tuaj të re të emailit',
    verifyButton: 'Konfirmo emailin e ri',
    verifyGreeting: 'Përshëndetje,',
    verifyBody: 'Keni kërkuar ndryshimin e adresës tuaj të emailit. Klikoni butonin më poshtë për ta konfirmuar adresën tuaj të re.',
    verifyExpiry: 'Ky link është i vlefshëm për 24 orë.',
    verifyIgnore: 'Nëse nuk keni kërkuar këtë ndryshim, mund ta injoroni këtë email.',
    securitySubject: 'Njoftim sigurie: Email po ndryshohet',
    securityGreeting: 'Përshëndetje,',
    securityBody: 'Dikush ka kërkuar ndryshimin e adresës së emailit të lidhur me llogarinë tuaj.',
    securityAdvice: 'Nëse nuk e keni bërë ju këtë ndryshim, ju rekomandojmë të ndryshoni fjalëkalimin tuaj menjëherë.',
  },
  en: {
    verifySubject: 'Confirm your new email address',
    verifyButton: 'Confirm new email',
    verifyGreeting: 'Hello,',
    verifyBody: 'You requested to change your email address. Click the button below to confirm your new email address.',
    verifyExpiry: 'This link is valid for 24 hours.',
    verifyIgnore: 'If you did not request this change, you can safely ignore this email.',
    securitySubject: 'Security notice: Email change requested',
    securityGreeting: 'Hello,',
    securityBody: 'Someone has requested to change the email address associated with your account.',
    securityAdvice: 'If this was not you, we recommend changing your password immediately.',
  },
  uk: {
    verifySubject: 'Підтвердіть нову електронну адресу',
    verifyButton: 'Підтвердити новий email',
    verifyGreeting: 'Вітаємо,',
    verifyBody: 'Ви надіслали запит на зміну вашої електронної адреси. Натисніть кнопку нижче, щоб підтвердити нову адресу.',
    verifyExpiry: 'Це посилання дійсне протягом 24 годин.',
    verifyIgnore: 'Якщо ви не надсилали цей запит, просто проігноруйте цей лист.',
    securitySubject: 'Сповіщення безпеки: запит на зміну email',
    securityGreeting: 'Вітаємо,',
    securityBody: 'Хтось надіслав запит на зміну електронної адреси вашого облікового запису.',
    securityAdvice: 'Якщо це були не ви, рекомендуємо негайно змінити пароль.',
  },
  it: {
    verifySubject: 'Conferma il tuo nuovo indirizzo email',
    verifyButton: 'Conferma nuovo email',
    verifyGreeting: 'Ciao,',
    verifyBody: 'Hai richiesto di cambiare il tuo indirizzo email. Clicca il pulsante qui sotto per confermare il tuo nuovo indirizzo.',
    verifyExpiry: 'Questo link è valido per 24 ore.',
    verifyIgnore: 'Se non hai richiesto questa modifica, puoi ignorare questa email.',
    securitySubject: 'Avviso di sicurezza: richiesta cambio email',
    securityGreeting: 'Ciao,',
    securityBody: 'Qualcuno ha richiesto di modificare l\'indirizzo email associato al tuo account.',
    securityAdvice: 'Se non sei stato tu, ti consigliamo di cambiare immediatamente la password.',
  },
}

function getStrings(locale: string) {
  return STRINGS[locale] ?? STRINGS.en
}

// ── HTML template ─────────────────────────────────────────────────────────────

function emailLayout(content: string): string {
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
          <div style="font-size:22px;font-weight:700;color:#EC5447;margin-bottom:24px;">Lero.al</div>
          ${content}
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;">
            © ${new Date().getFullYear()} Lero.al — lero.al
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function verificationHtml(s: ReturnType<typeof getStrings>, verificationUrl: string): string {
  return emailLayout(`
    <p style="font-size:16px;color:#18181b;margin:0 0 16px;">${s.verifyGreeting}</p>
    <p style="font-size:15px;color:#3f3f46;margin:0 0 24px;line-height:1.6;">${s.verifyBody}</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verificationUrl}" style="display:inline-block;background:#EC5447;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">${s.verifyButton}</a>
    </div>
    <p style="font-size:13px;color:#71717a;margin:0 0 8px;">${s.verifyExpiry}</p>
    <p style="font-size:13px;color:#71717a;margin:0;">${s.verifyIgnore}</p>
    <p style="font-size:12px;color:#a1a1aa;margin:16px 0 0;word-break:break-all;">
      ${verificationUrl}
    </p>
  `)
}

function securityHtml(s: ReturnType<typeof getStrings>, oldEmail: string, newEmail: string, timestamp: string, deviceHint: string): string {
  return emailLayout(`
    <p style="font-size:16px;color:#18181b;margin:0 0 16px;">${s.securityGreeting}</p>
    <p style="font-size:15px;color:#3f3f46;margin:0 0 24px;line-height:1.6;">${s.securityBody}</p>
    <table style="background:#f4f4f5;border-radius:8px;padding:16px;width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;">Current email:</td><td style="font-size:13px;color:#18181b;font-weight:500;">${oldEmail}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;">New email:</td><td style="font-size:13px;color:#18181b;font-weight:500;">${newEmail}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;">Time:</td><td style="font-size:13px;color:#18181b;">${timestamp}</td></tr>
      ${deviceHint ? `<tr><td style="font-size:13px;color:#71717a;padding:4px 0;">Device:</td><td style="font-size:13px;color:#18181b;">${deviceHint}</td></tr>` : ''}
    </table>
    <p style="font-size:14px;color:#ef4444;font-weight:500;margin:0;">${s.securityAdvice}</p>
  `)
}

// ── Sender ────────────────────────────────────────────────────────────────────

export async function sendEmailChangeEmails(opts: {
  userId: string
  oldEmail: string
  newEmail: string
  verificationUrl: string
  locale: string
  ip?: string
  userAgent?: string
}): Promise<void> {
  const s = getStrings(opts.locale)
  const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Tirana' })

  let deviceHint = ''
  if (opts.ip) deviceHint += opts.ip
  if (opts.userAgent) {
    const ua = opts.userAgent
    if (/mobile/i.test(ua)) deviceHint += (deviceHint ? ' · ' : '') + 'Mobile'
    else if (/tablet/i.test(ua)) deviceHint += (deviceHint ? ' · ' : '') + 'Tablet'
    else deviceHint += (deviceHint ? ' · ' : '') + 'Desktop'
  }

  const [verifyResult, securityResult] = await Promise.all([
    sendEmail({
      to: opts.newEmail,
      subject: s.verifySubject,
      html: verificationHtml(s, opts.verificationUrl),
    }),
    sendEmail({
      to: opts.oldEmail,
      subject: s.securitySubject,
      html: securityHtml(s, opts.oldEmail, opts.newEmail, timestamp, deviceHint),
    }),
  ])

  if (verifyResult.error) {
    console.error('[email-change] Failed to send verification email', { to: opts.newEmail })
  }
  if (securityResult.error) {
    console.error('[email-change] Failed to send security email', { to: opts.oldEmail })
  }
}
