/**
 * MagicLinkEmail — passwordless sign-in link email template.
 *
 * Wraps BaseEmail. Used by the Supabase Send Email Hook (Epic D.6 / Task 122)
 * which intercepts Supabase's "magiclink" auth emails and sends this branded
 * version instead.
 *
 * Locale strings are inline (sq/en/uk/it) — emails render server-side outside
 * next-intl context. Same pattern as VerifyEmail.tsx.
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
    subject: 'Lidhja juaj e hyrjes në Lero.al',
    heading: 'Hyni në Lero.al',
    body: 'Klikoni butonin më poshtë për t\'u identifikuar pa fjalëkalim. Ky link mund të përdoret vetëm një herë.',
    button: 'Hyni me link magjik',
    fallbackLabel: 'Ose ngjisnin këtë link në shfletuesin tuaj:',
    expiry: 'Ky link skadon pas 1 ore.',
    ignore: 'Nëse nuk keni kërkuar hyrje në Lero.al, mund ta injoroni këtë email.',
  },
  en: {
    subject: 'Your sign-in link for Lero.al',
    heading: 'Sign in to Lero.al',
    body: 'Click the button below to sign in without a password. This link can only be used once.',
    button: 'Sign in with magic link',
    fallbackLabel: 'Or paste this link into your browser:',
    expiry: 'This link expires in 1 hour.',
    ignore: 'If you did not request a sign-in link for Lero.al, you can safely ignore this email.',
  },
  uk: {
    subject: 'Ваше посилання для входу на Lero.al',
    heading: 'Увійдіть на Lero.al',
    body: 'Натисніть кнопку нижче, щоб увійти без пароля. Це посилання можна використати лише один раз.',
    button: 'Увійти з магічним посиланням',
    fallbackLabel: 'Або вставте це посилання у браузер:',
    expiry: 'Це посилання дійсне протягом 1 години.',
    ignore: 'Якщо ви не запитували посилання для входу на Lero.al, просто проігноруйте цей лист.',
  },
  it: {
    subject: 'Il tuo link di accesso a Lero.al',
    heading: 'Accedi a Lero.al',
    body: 'Clicca il pulsante qui sotto per accedere senza password. Questo link può essere utilizzato una sola volta.',
    button: 'Accedi con link magico',
    fallbackLabel: 'Oppure incolla questo link nel tuo browser:',
    expiry: 'Questo link scade in 1 ora.',
    ignore: 'Se non hai richiesto un link di accesso a Lero.al, puoi ignorare questa email.',
  },
}

export function getMagicLinkEmailStrings(locale: string) {
  return STRINGS[locale] ?? STRINGS.en
}

// ── Template ──────────────────────────────────────────────────────────────────

interface MagicLinkEmailProps {
  signInUrl: string
  locale?: string
  preview?: string
}

export function MagicLinkEmail({ signInUrl, locale = 'sq', preview }: MagicLinkEmailProps) {
  const s = getMagicLinkEmailStrings(locale)

  return (
    <BaseEmail preview={preview ?? s.heading} locale={locale}>
      {/* Heading + body */}
      <Section style={contentSection}>
        <Text style={heading}>{s.heading}</Text>
        <Text style={bodyText}>{s.body}</Text>
      </Section>

      {/* CTA */}
      <Section style={ctaSection}>
        <Link href={signInUrl} style={ctaButton}>{s.button}</Link>
      </Section>

      {/* Fallback URL */}
      <Section style={fallbackSection}>
        <Text style={fallbackLabel}>{s.fallbackLabel}</Text>
        <Text style={fallbackUrl}>{signInUrl}</Text>
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
