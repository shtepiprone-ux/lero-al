/**
 * RecoveryEmail — password / login recovery email template.
 *
 * Wraps BaseEmail. Used by the Supabase Send Email Hook (Epic D.6 / Task 122)
 * which intercepts Supabase's built-in "Password recovery" emails and sends this
 * branded version instead.
 *
 * NOTE (Task 121): This template is NOT wired for delivery yet — D.6 does that.
 * Until D.6 ships, Supabase sends its own built-in recovery email when
 * supabase.auth.resetPasswordForEmail() is called. Sending this template in
 * parallel would deliver TWO emails per recovery request. D.6 wires this template
 * to the Send Email Hook which intercepts Supabase's auth email dispatch, making
 * this template the sole delivery path. See docs/sessions/2026-05-21-task-121-password-recovery.md.
 *
 * Locale strings are inline (sq/en/uk/it) — emails render server-side outside
 * next-intl context. Follow the same pattern as VerifyEmail.tsx.
 */
import {
  Section,
  Text,
  Link,
} from '@react-email/components'
import * as React from 'react'
import { BaseEmail, BRAND_ACCENT } from './BaseEmail'

// ── Locale strings ────────────────────────────────────────────────────────────

const STRINGS: Record<string, {
  subject: string
  heading: string
  body: string
  button: string
  fallbackLabel: string
  expiry: string
  ignore: string
}> = {
  sq: {
    subject: 'Rivendos fjalëkalimin tuaj',
    heading: 'Rivendosni fjalëkalimin',
    body: 'Kemi marrë një kërkesë për të rivendosur fjalëkalimin e llogarisë suaj në Lero.al. Klikoni butonin më poshtë për të caktuar një fjalëkalim të ri. Nëse nuk keni bërë këtë kërkesë, mund ta injoroni këtë email.',
    button: 'Rivendos fjalëkalimin',
    fallbackLabel: 'Ose ngjisnin këtë link në shfletuesin tuaj:',
    expiry: 'Ky link skadon pas 1 ore.',
    ignore: 'Nëse nuk keni kërkuar rivendosje fjalëkalimi, llogaria juaj mbetet e sigurt dhe nuk keni nevojë të ndërmerrni asnjë veprim.',
  },
  en: {
    subject: 'Reset your password',
    heading: 'Reset your password',
    body: 'We received a request to reset the password for your Lero.al account. Click the button below to set a new password. If you didn\'t make this request, you can safely ignore this email.',
    button: 'Reset password',
    fallbackLabel: 'Or paste this link into your browser:',
    expiry: 'This link expires in 1 hour.',
    ignore: 'If you didn\'t request a password reset, your account is safe and no action is needed.',
  },
  uk: {
    subject: 'Скидання пароля',
    heading: 'Скиньте пароль',
    body: 'Ми отримали запит на скидання пароля для вашого облікового запису Lero.al. Натисніть кнопку нижче, щоб встановити новий пароль. Якщо ви не надсилали цей запит, просто проігноруйте цей лист.',
    button: 'Скинути пароль',
    fallbackLabel: 'Або вставте це посилання у браузер:',
    expiry: 'Це посилання дійсне протягом 1 години.',
    ignore: 'Якщо ви не запитували скидання пароля, ваш обліковий запис у безпеці й жодних дій не потрібно.',
  },
  it: {
    subject: 'Reimposta la tua password',
    heading: 'Reimposta la tua password',
    body: 'Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account Lero.al. Clicca il pulsante qui sotto per impostare una nuova password. Se non hai fatto questa richiesta, puoi ignorare questa email.',
    button: 'Reimposta password',
    fallbackLabel: 'Oppure incolla questo link nel tuo browser:',
    expiry: 'Questo link scade in 1 ora.',
    ignore: 'Se non hai richiesto la reimpostazione della password, il tuo account è al sicuro e non è necessaria alcuna azione.',
  },
}

export function getRecoveryEmailStrings(locale: string) {
  return STRINGS[locale] ?? STRINGS.en
}

// ── Template ──────────────────────────────────────────────────────────────────

interface RecoveryEmailProps {
  resetUrl: string
  locale?: string
  preview?: string
}

export function RecoveryEmail({ resetUrl, locale = 'sq', preview }: RecoveryEmailProps) {
  const s = getRecoveryEmailStrings(locale)

  return (
    <BaseEmail preview={preview ?? s.heading} locale={locale}>
      {/* Heading + body */}
      <Section style={contentSection}>
        <Text style={heading}>{s.heading}</Text>
        <Text style={bodyText}>{s.body}</Text>
      </Section>

      {/* CTA */}
      <Section style={ctaSection}>
        <Link href={resetUrl} style={ctaButton}>{s.button}</Link>
      </Section>

      {/* Fallback URL */}
      <Section style={fallbackSection}>
        <Text style={fallbackLabel}>{s.fallbackLabel}</Text>
        <Text style={fallbackUrl}>{resetUrl}</Text>
      </Section>

      {/* Expiry + ignore */}
      <Section style={noticeSection}>
        <Text style={notice}>{s.expiry} {s.ignore}</Text>
      </Section>
    </BaseEmail>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const contentSection: React.CSSProperties = {
  padding: '32px 48px 8px',
}

const heading: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 500,
  letterSpacing: '-0.5px',
  lineHeight: '1.25',
  color: '#18181b',
  margin: 0,
}

const bodyText: React.CSSProperties = {
  fontSize: 16,
  lineHeight: '1.65',
  color: '#52525b',
  margin: '16px 0 0',
}

const ctaSection: React.CSSProperties = {
  padding: '28px 48px 4px',
}

const ctaButton: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  backgroundColor: BRAND_ACCENT,
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 500,
  textDecoration: 'none',
  padding: '14px 24px',
  borderRadius: 10,
}

const fallbackSection: React.CSSProperties = {
  padding: '20px 48px 0',
}

const fallbackLabel: React.CSSProperties = {
  fontSize: 13,
  lineHeight: '1.6',
  color: '#71717a',
  margin: '0 0 8px',
}

const fallbackUrl: React.CSSProperties = {
  fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
  fontSize: 12,
  color: '#3f3f46',
  backgroundColor: '#fdf1f0',
  border: '1px solid #f7d7d3',
  borderRadius: 8,
  padding: '10px 12px',
  wordBreak: 'break-all',
  margin: 0,
}

const noticeSection: React.CSSProperties = {
  padding: '22px 48px 36px',
}

const notice: React.CSSProperties = {
  fontSize: 13,
  lineHeight: '1.6',
  color: '#a1a1aa',
  margin: 0,
}
