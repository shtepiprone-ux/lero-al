/**
 * ReauthEmail — reauthentication OTP email template.
 *
 * Wraps BaseEmail. Used by the Supabase Send Email Hook (Epic D.6 / Task 122)
 * which intercepts Supabase's "reauthentication" auth emails and sends this
 * branded version instead.
 *
 * Unlike other auth emails, reauthentication uses a short OTP code (not a
 * clickable link). The user enters the code in the app to confirm their identity.
 *
 * Locale strings are inline (sq/en/uk/it) — emails render server-side outside
 * next-intl context. Same pattern as VerifyEmail.tsx.
 */
import {
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseEmail, BRAND_ACCENT } from './BaseEmail'

// ── Locale strings ────────────────────────────────────────────────────────────

const STRINGS: Record<string, {
  subject: string
  heading: string
  body: string
  label: string
  expiry: string
  ignore: string
}> = {
  sq: {
    subject: 'Kodi juaj i verifikimit — Lero.al',
    heading: 'Verifikoni identitetin tuaj',
    body: 'Ky kod i verifikimit kërkohet për të konfirmuar identitetin tuaj. Vendoseni në aplikacion kur të kërkohet.',
    label: 'Kodi juaj:',
    expiry: 'Ky kod skadon pas 10 minutave.',
    ignore: 'Nëse nuk keni kërkuar këtë kod, mund ta injoroni këtë email.',
  },
  en: {
    subject: 'Your verification code — Lero.al',
    heading: 'Verify your identity',
    body: 'Use this verification code to confirm your identity. Enter it in the app when prompted.',
    label: 'Your code:',
    expiry: 'This code expires in 10 minutes.',
    ignore: 'If you did not request this code, you can safely ignore this email.',
  },
  uk: {
    subject: 'Ваш код підтвердження — Lero.al',
    heading: 'Підтвердіть вашу особу',
    body: 'Використайте цей код для підтвердження вашої особи. Введіть його в застосунку, коли з\'явиться запит.',
    label: 'Ваш код:',
    expiry: 'Цей код дійсний протягом 10 хвилин.',
    ignore: 'Якщо ви не запитували цей код, просто проігноруйте цей лист.',
  },
  it: {
    subject: 'Il tuo codice di verifica — Lero.al',
    heading: 'Verifica la tua identità',
    body: 'Usa questo codice di verifica per confermare la tua identità. Inseriscilo nell\'app quando richiesto.',
    label: 'Il tuo codice:',
    expiry: 'Questo codice scade in 10 minuti.',
    ignore: 'Se non hai richiesto questo codice, puoi ignorare questa email.',
  },
}

export function getReauthEmailStrings(locale: string) {
  return STRINGS[locale] ?? STRINGS.en
}

// ── Template ──────────────────────────────────────────────────────────────────

interface ReauthEmailProps {
  otp: string
  locale?: string
  preview?: string
}

export function ReauthEmail({ otp, locale = 'sq', preview }: ReauthEmailProps) {
  const s = getReauthEmailStrings(locale)

  return (
    <BaseEmail preview={preview ?? s.heading} locale={locale}>
      {/* Heading + body */}
      <Section style={contentSection}>
        <Text style={heading}>{s.heading}</Text>
        <Text style={bodyText}>{s.body}</Text>
      </Section>

      {/* OTP display */}
      <Section style={otpSection}>
        <Text style={otpLabel}>{s.label}</Text>
        <Text style={otpCode}>{otp}</Text>
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

const otpSection: React.CSSProperties = {
  padding: '28px 48px 4px',
}

const otpLabel: React.CSSProperties = {
  fontSize: 13,
  color: '#71717a',
  margin: '0 0 12px',
}

const otpCode: React.CSSProperties = {
  fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
  fontSize: 36,
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: BRAND_ACCENT,
  backgroundColor: '#fdf1f0',
  border: '1px solid #f7d7d3',
  borderRadius: 10,
  padding: '16px 24px',
  textAlign: 'center',
  margin: 0,
}

const noticeSection: React.CSSProperties = {
  padding: '28px 48px 36px',
}

const notice: React.CSSProperties = {
  fontSize: 13,
  lineHeight: '1.6',
  color: '#a1a1aa',
  margin: 0,
}
