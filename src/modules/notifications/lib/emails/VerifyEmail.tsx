/**
 * VerifyEmail — signup email verification template.
 *
 * Wraps BaseEmail. Used by the Supabase Send Email Hook (Epic D.6 / Task 122)
 * which intercepts Supabase's built-in "Confirm signup" emails and sends this
 * branded version instead.
 *
 * NOTE (Task 120): This template is NOT wired for delivery yet — D.6 does that.
 * Until D.6 ships, Supabase sends its own built-in confirmation email.
 * Sending this template in parallel would deliver TWO emails to new users.
 * See docs/sessions/2026-05-20-task-120-email-verification.md for the full plan.
 *
 * Locale strings are inline (sq/en/uk/it) — emails render server-side outside
 * next-intl context. Follow the same pattern as emailChange.ts.
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
    subject: 'Konfirmoni adresën tuaj të emailit',
    heading: 'Konfirmoni emailin tuaj',
    body: 'Faleminderit që u regjistruat në Lero.al. Konfirmoni adresën tuaj të emailit për të aktivizuar llogarinë tuaj dhe filluar të eksploroni listimet në të gjithë Shqipërinë.',
    button: 'Konfirmo adresën e emailit',
    fallbackLabel: 'Ose ngjisnin këtë link në shfletuesin tuaj:',
    expiry: 'Ky link skadon pas 24 orësh.',
    ignore: 'Nëse nuk keni krijuar llogari në Lero.al, mund ta injoroni këtë email.',
  },
  en: {
    subject: 'Confirm your email address',
    heading: 'Confirm your email',
    body: 'Thanks for signing up for Lero.al. Confirm your email address to activate your account and start exploring listings across Albania.',
    button: 'Confirm email address',
    fallbackLabel: 'Or paste this link into your browser:',
    expiry: 'This link expires in 24 hours.',
    ignore: 'If you didn\'t create a Lero.al account, you can safely ignore this email.',
  },
  uk: {
    subject: 'Підтвердіть вашу електронну адресу',
    heading: 'Підтвердіть ваш email',
    body: 'Дякуємо за реєстрацію на Lero.al. Підтвердіть вашу електронну адресу для активації облікового запису та перегляду оголошень по всій Албанії.',
    button: 'Підтвердити електронну адресу',
    fallbackLabel: 'Або вставте це посилання у браузер:',
    expiry: 'Це посилання дійсне протягом 24 годин.',
    ignore: 'Якщо ви не створювали обліковий запис на Lero.al, просто проігноруйте цей лист.',
  },
  it: {
    subject: 'Conferma il tuo indirizzo email',
    heading: 'Conferma la tua email',
    body: 'Grazie per esserti registrato su Lero.al. Conferma il tuo indirizzo email per attivare il tuo account e iniziare a esplorare gli annunci in tutta l\'Albania.',
    button: 'Conferma indirizzo email',
    fallbackLabel: 'Oppure incolla questo link nel tuo browser:',
    expiry: 'Questo link scade in 24 ore.',
    ignore: 'Se non hai creato un account su Lero.al, puoi ignorare questa email.',
  },
}

export function getVerifyEmailStrings(locale: string) {
  return STRINGS[locale] ?? STRINGS.en
}

// ── Template ──────────────────────────────────────────────────────────────────

interface VerifyEmailProps {
  confirmUrl: string
  locale?: string
  preview?: string
}

export function VerifyEmail({ confirmUrl, locale = 'sq', preview }: VerifyEmailProps) {
  const s = getVerifyEmailStrings(locale)

  return (
    <BaseEmail preview={preview ?? s.heading} locale={locale}>
      {/* Heading + body */}
      <Section style={contentSection}>
        <Text style={heading}>{s.heading}</Text>
        <Text style={bodyText}>{s.body}</Text>
      </Section>

      {/* CTA */}
      <Section style={ctaSection}>
        <Link href={confirmUrl} style={ctaButton}>{s.button}</Link>
      </Section>

      {/* Fallback URL */}
      <Section style={fallbackSection}>
        <Text style={fallbackLabel}>{s.fallbackLabel}</Text>
        <Text style={fallbackUrl}>{confirmUrl}</Text>
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
