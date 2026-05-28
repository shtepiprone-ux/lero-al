/**
 * POST /api/auth-email-hook
 *
 * Supabase Send Email Hook target — receives all Supabase auth email events
 * and delivers branded React Email templates via Resend instead of Supabase's
 * built-in emails.
 *
 * Architecture: Option B (Next.js API route on Vercel).
 * Rationale: app deploys to Vercel; no supabase/functions infrastructure exists;
 * project already has 9 API routes; Next route is simpler to deploy and debug.
 *
 * Security: Supabase signs Send Email Hook requests with the Standard Webhooks
 * spec (https://www.standardwebhooks.com), verified here with the official
 * `standardwebhooks` library. Secret format: "v1,whsec_<base64>" from the
 * Supabase dashboard (env var SUPABASE_EMAIL_HOOK_SECRET). The signature covers
 * "{id}.{timestamp}.{body}" and the library also enforces a timestamp tolerance
 * (replay protection). If the secret is not set, verification is skipped
 * (local dev only).
 *
 * Action-type → template map:
 *   signup          → VerifyEmail   (to user.email)
 *   invite          → VerifyEmail   (to user.email, treated as signup confirmation)
 *   recovery        → RecoveryEmail (to user.email)
 *   magiclink       → MagicLinkEmail (to user.email)
 *   email_change    → inline email-change verify HTML (to user.new_email)
 *   reauthentication → ReauthEmail  (to user.email, shows OTP code)
 *
 * Register in Supabase Dashboard → Authentication → Hooks → Send Email Hook:
 *   URL: https://lero.al/api/auth-email-hook
 *   Secret: value of SUPABASE_EMAIL_HOOK_SECRET
 *
 * Epic D.6 / Task 122
 */

import { Webhook } from 'standardwebhooks'
import { NextRequest, NextResponse } from 'next/server'
import * as React from 'react'

import { sendEmail } from '@/modules/notifications/lib/emails/send'
import { VerifyEmail, getVerifyEmailStrings } from '@/modules/notifications/lib/emails/VerifyEmail'
import { RecoveryEmail, getRecoveryEmailStrings } from '@/modules/notifications/lib/emails/RecoveryEmail'
import { MagicLinkEmail, getMagicLinkEmailStrings } from '@/modules/notifications/lib/emails/MagicLinkEmail'
import { ReauthEmail, getReauthEmailStrings } from '@/modules/notifications/lib/emails/ReauthEmail'

// ── Types ─────────────────────────────────────────────────────────────────────

type EmailActionType =
  | 'signup'
  | 'invite'
  | 'recovery'
  | 'magiclink'
  | 'email_change'
  | 'reauthentication'

interface HookUser {
  id: string
  email: string
  new_email?: string | null
}

interface HookEmailData {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: EmailActionType
  site_url: string
  token_new?: string
  token_hash_new?: string
}

interface HookPayload {
  user: HookUser
  email_data: HookEmailData
}

// ── Inline strings for email_change (sent to new_email) ───────────────────────
// Follows the same inline-STRINGS pattern as emailChange.ts.

const EMAIL_CHANGE_STRINGS: Record<string, {
  subject: string
  greeting: string
  body: string
  button: string
  expiry: string
  ignore: string
}> = {
  sq: {
    subject: 'Konfirmoni adresën tuaj të re të emailit',
    greeting: 'Përshëndetje,',
    body: 'Keni kërkuar ndryshimin e adresës suaj të emailit. Klikoni butonin më poshtë për ta konfirmuar adresën tuaj të re.',
    button: 'Konfirmo emailin e ri',
    expiry: 'Ky link është i vlefshëm për 24 orë.',
    ignore: 'Nëse nuk keni kërkuar këtë ndryshim, mund ta injoroni këtë email.',
  },
  en: {
    subject: 'Confirm your new email address',
    greeting: 'Hello,',
    body: 'You requested to change your email address. Click the button below to confirm your new email address.',
    button: 'Confirm new email',
    expiry: 'This link is valid for 24 hours.',
    ignore: 'If you did not request this change, you can safely ignore this email.',
  },
  uk: {
    subject: 'Підтвердіть нову електронну адресу',
    greeting: 'Вітаємо,',
    body: 'Ви надіслали запит на зміну вашої електронної адреси. Натисніть кнопку нижче, щоб підтвердити нову адресу.',
    button: 'Підтвердити новий email',
    expiry: 'Це посилання дійсне протягом 24 годин.',
    ignore: 'Якщо ви не надсилали цей запит, просто проігноруйте цей лист.',
  },
  it: {
    subject: 'Conferma il tuo nuovo indirizzo email',
    greeting: 'Ciao,',
    body: 'Hai richiesto di cambiare il tuo indirizzo email. Clicca il pulsante qui sotto per confermare il tuo nuovo indirizzo.',
    button: 'Conferma nuovo email',
    expiry: 'Questo link è valido per 24 ore.',
    ignore: 'Se non hai richiesto questa modifica, puoi ignorare questa email.',
  },
}

function getEmailChangeStrings(locale: string) {
  return EMAIL_CHANGE_STRINGS[locale] ?? EMAIL_CHANGE_STRINGS.en
}

function emailChangeHtml(s: ReturnType<typeof getEmailChangeStrings>, verifyUrl: string): string {
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
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ececec;">
        <tr><td style="height:3px;background:#EC5447;padding:0;"></td></tr>
        <tr><td style="padding:38px 48px 0;">
          <span style="font-size:17px;font-weight:500;color:#18181b;">Lero<span style="color:#EC5447">.al</span></span>
        </td></tr>
        <tr><td style="padding:32px 48px 8px;">
          <p style="font-size:16px;color:#18181b;margin:0 0 16px;">${s.greeting}</p>
          <p style="font-size:15px;color:#52525b;margin:0;line-height:1.65;">${s.body}</p>
        </td></tr>
        <tr><td style="padding:28px 48px 4px;">
          <a href="${verifyUrl}" style="display:block;text-align:center;background:#EC5447;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;padding:14px 24px;border-radius:10px;">${s.button}</a>
        </td></tr>
        <tr><td style="padding:20px 48px 0;">
          <p style="font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:12px;color:#3f3f46;background:#fdf1f0;border:1px solid #f7d7d3;border-radius:8px;padding:10px 12px;word-break:break-all;margin:0;">${verifyUrl}</p>
        </td></tr>
        <tr><td style="padding:22px 48px 36px;">
          <p style="font-size:13px;color:#a1a1aa;margin:0;">${s.expiry} ${s.ignore}</p>
        </td></tr>
        <tr><td style="border-top:1px solid #f0f0f0;padding:24px 48px 36px;background:#fafafa;">
          <p style="font-size:13px;font-weight:500;color:#3f3f46;margin:0;">Lero<span style="color:#EC5447">.al</span></p>
          <p style="font-size:12px;color:#a1a1aa;margin:4px 0 0;">Real estate marketplace for Albania</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Standard Webhooks verification (Supabase Send Email Hook) ─────────────────
// Supabase signs Send Email Hook requests per the Standard Webhooks spec. The
// dashboard secret is "v1,whsec_<base64>"; the standardwebhooks library expects
// the part after "v1," (it strips the "whsec_" prefix itself). Webhook.verify()
// checks the HMAC-SHA256 signature over "{id}.{timestamp}.{body}" AND the
// timestamp tolerance, throwing on any mismatch.

function verifyHookSignature(
  body: string,
  headers: Record<string, string>,
  secret: string,
): boolean {
  try {
    const wh = new Webhook(secret.replace(/^v1,/, ''))
    wh.verify(body, headers)
    return true
  } catch {
    return false
  }
}

// ── Action URL builder ─────────────────────────────────────────────────────────
// Routes the user through /auth/confirm (verifyOtp token-hash flow) so links
// work cross-device (no PKCE code_verifier cookie needed).
// Derives appOrigin + next from redirect_to (format: ${SITE_URL}/auth/callback?next=/${locale}/...).

function buildConfirmUrl(tokenHash: string, type: string, redirectTo: string): string {
  let appOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'
  let next = '/sq/auth/verified'
  try {
    const url = new URL(redirectTo)
    appOrigin = url.origin
    const nextParam = url.searchParams.get('next')
    if (nextParam) next = nextParam
  } catch {}
  const params = new URLSearchParams({ token_hash: tokenHash, type, next })
  return `${appOrigin}/auth/confirm?${params.toString()}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Verify the Standard Webhooks signature (Supabase Send Email Hook).
    // standardwebhooks indexes a plain object by lowercase header name and reads
    // webhook-id / webhook-timestamp / webhook-signature (svix-* are aliased).
    const secret = process.env.SUPABASE_EMAIL_HOOK_SECRET
    if (secret) {
      const headerObj: Record<string, string> = {}
      request.headers.forEach((value, key) => { headerObj[key.toLowerCase()] = value })
      if (!verifyHookSignature(rawBody, headerObj, secret)) {
        console.error('[auth-email-hook] signature verification failed')
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
      }
    }

    let payload: HookPayload
    try {
      payload = JSON.parse(rawBody) as HookPayload
    } catch {
      console.error('[auth-email-hook] Failed to parse payload')
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    }

    const { user, email_data } = payload
    const { token_hash, token, redirect_to, email_action_type } = email_data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

    // Albanian-only policy (Task 251, 2026-05-25): auth emails always in sq.
    const locale = 'sq'

    // For link-based emails (signup/invite/recovery/magiclink), build a confirm URL
    // that routes through our /auth/confirm route (verifyOtp token-hash flow).
    // email_change: the cabinet uses a fully custom flow (email_change_tokens table +
    // consumeEmailChangeToken + /[locale]/auth/confirm-email). Supabase-native email_change
    // events are not triggered in production (admin.updateUserById bypasses the hook).
    // The email_change case below is a safety net using the Supabase verify endpoint.
    const actionUrl = buildConfirmUrl(token_hash, email_action_type, redirect_to)

    switch (email_action_type) {
      case 'signup':
      case 'invite': {
        const s = getVerifyEmailStrings(locale)
        await sendEmail({
          to: user.email,
          subject: s.subject,
          react: React.createElement(VerifyEmail, { confirmUrl: actionUrl, locale }),
        })
        break
      }

      case 'recovery': {
        const s = getRecoveryEmailStrings(locale)
        await sendEmail({
          to: user.email,
          subject: s.subject,
          react: React.createElement(RecoveryEmail, { resetUrl: actionUrl, locale }),
        })
        break
      }

      case 'magiclink': {
        const s = getMagicLinkEmailStrings(locale)
        await sendEmail({
          to: user.email,
          subject: s.subject,
          react: React.createElement(MagicLinkEmail, { signInUrl: actionUrl, locale }),
        })
        break
      }

      case 'email_change': {
        // Cabinet uses a custom email-change flow; this Supabase-native case should not
        // fire in production. Keep pointing to Supabase verify as a safety net.
        const emailChangeParams = new URLSearchParams({ token: token_hash, type: 'email_change', redirect_to })
        const emailChangeUrl = `${supabaseUrl}/auth/v1/verify?${emailChangeParams.toString()}`
        const recipientEmail = user.new_email ?? user.email
        const s = getEmailChangeStrings(locale)
        await sendEmail({
          to: recipientEmail,
          subject: s.subject,
          html: emailChangeHtml(s, emailChangeUrl),
        })
        break
      }

      case 'reauthentication': {
        // OTP code — user enters it in the app; email_data.token is the code.
        const s = getReauthEmailStrings(locale)
        await sendEmail({
          to: user.email,
          subject: s.subject,
          react: React.createElement(ReauthEmail, { otp: token, locale }),
        })
        break
      }

      default: {
        console.warn('[auth-email-hook] Unhandled email_action_type:', email_action_type)
        // Return success so Supabase does not retry indefinitely for unknown types.
        break
      }
    }

    // Supabase expects an empty JSON object on success.
    return NextResponse.json({})
  } catch (err) {
    console.error('[auth-email-hook] Unhandled error:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
