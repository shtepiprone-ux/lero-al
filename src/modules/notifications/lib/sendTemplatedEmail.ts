/**
 * sendTemplatedEmail — DB-driven email sending helper (Epic D.2 / Task 123).
 *
 * Loads an email_templates row by key + recipient locale (via resolveUserLocale),
 * falls back to 'sq' if no row exists for the resolved locale, interpolates
 * {{variable}} placeholders, wraps the inner HTML in the brand frame, and
 * sends via the canonical sendEmail() helper.
 *
 * Admin-edited templates store the INNER HTML only. This function wraps it in
 * a branded frame consistent with BaseEmail so every admin email has the same
 * header, footer, and colour strip as code-first transactional emails.
 *
 * Usage (future tasks E.4, F.3, C.4):
 *   await sendTemplatedEmail({
 *     key: 'saved_search_alert',
 *     to: 'user@example.com',
 *     userId: user.id,
 *     variables: { userName: 'Ana', listingTitle: 'Apartment in Tirana' },
 *   })
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from './emails/send'
import type { EmailTemplate } from '@/types/database'

const BRAND_ACCENT = '#EC5447'

function brandEmailLayout(innerHtml: string, locale: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lero.al</title>
</head>
<body style="margin:0;padding:32px 16px;background:#f4f4f5;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border:1px solid #ececec;border-radius:14px;overflow:hidden;">
        <!-- coral strip -->
        <tr><td style="height:3px;background:${BRAND_ACCENT};padding:0;font-size:0;line-height:0;"></td></tr>
        <!-- logo -->
        <tr><td style="padding:38px 48px 0;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:28px;padding-right:9px;">
              <div style="display:inline-block;width:28px;height:28px;background:${BRAND_ACCENT};border-radius:7px;color:#ffffff;font-size:15px;font-weight:600;text-align:center;line-height:28px;">L</div>
            </td>
            <td>
              <span style="font-size:17px;font-weight:500;letter-spacing:-0.2px;color:#18181b;">Lero<span style="color:${BRAND_ACCENT}">.al</span></span>
            </td>
          </tr></table>
        </td></tr>
        <!-- inner content (admin-edited) -->
        <tr><td style="padding:32px 48px;">
          ${innerHtml}
        </td></tr>
        <!-- footer -->
        <tr><td style="border-top:1px solid #f0f0f0;padding:24px 48px 36px;background:#fafafa;">
          <p style="font-size:13px;font-weight:500;color:#3f3f46;margin:0;">Lero<span style="color:${BRAND_ACCENT}">.al</span></p>
          <p style="font-size:12px;color:#a1a1aa;margin:4px 0 0;">Real estate marketplace for Albania</p>
          <p style="font-size:12px;color:#a1a1aa;margin:14px 0 0;">
            <a href="https://lero.al/help" style="color:#71717a;text-decoration:none;">Help center</a>
            &nbsp;·&nbsp;
            <a href="https://lero.al/privacy" style="color:#71717a;text-decoration:none;">Privacy</a>
            &nbsp;·&nbsp;
            © ${year} Lero.al
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`)
}

interface SendTemplatedEmailOptions {
  key: string
  to: string
  userId: string
  variables?: Record<string, string>
}

export async function sendTemplatedEmail({
  key,
  to,
  variables = {},
}: SendTemplatedEmailOptions): Promise<{ error?: string }> {
  const db = createAdminClient()
  // Albanian-only policy (Task 251, 2026-05-25): always send in sq regardless of user preference.
  // If the sq row is missing the caller receives template_not_found — do NOT silently fall back
  // to another locale, as that would defeat the policy.
  const { data } = await db
    .from('email_templates')
    .select('*')
    .eq('key', key)
    .eq('locale', 'sq')
    .eq('is_active', true)
    .single()
  const template = data as EmailTemplate | null

  if (!template) {
    console.warn(`[sendTemplatedEmail] No active sq template found: key="${key}"`)
    return { error: 'template_not_found' }
  }

  const subject = interpolate(template.subject, variables)
  const innerHtml = interpolate(template.html_body, variables)
  const html = brandEmailLayout(innerHtml, template.locale)

  return sendEmail({ to, subject, html })
}
