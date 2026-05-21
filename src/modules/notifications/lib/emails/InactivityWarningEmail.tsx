/**
 * InactivityWarningEmail — 3-month inactivity warning template (Epic D.5 / Task 124).
 *
 * Sent by the daily cron job (/api/cron/inactivity) when a user has not signed in
 * for 3 months. Warns that the account will be deactivated at 12 months.
 *
 * Locale strings are inline (sq/en/uk/it) — cron has no request context.
 * Locale resolved via resolveUserLocale(userId) → preferred_locale → sq.
 */
import { Section, Text, Link } from '@react-email/components'
import * as React from 'react'
import { BaseEmail, BRAND_ACCENT } from './BaseEmail'

const STRINGS: Record<string, {
  subject: string
  heading: string
  body: string
  button: string
  fallbackLabel: string
  notice: string
}> = {
  sq: {
    subject: 'Lero.al — Llogaria juaj është joaktive',
    heading: 'Mungoni në Lero.al',
    body: 'Nuk keni hyrë në llogarinë tuaj Lero.al prej 3 muajsh. Nëse nuk identifikoheni brenda 9 muajve të ardhshëm, llogaria juaj do të çaktivizohet automatikisht.',
    button: 'Hyni tani',
    fallbackLabel: 'Ose ngjisnin këtë link:',
    notice: 'Ky email u dërgua sepse keni qenë joaktiv/e për 3 muaj. Nëse dëshironi të mbani llogarinë, mjafton të identifikoheni.',
  },
  en: {
    subject: 'Lero.al — Your account is inactive',
    heading: 'We miss you on Lero.al',
    body: 'You haven\'t signed in to your Lero.al account for 3 months. If you don\'t sign in within the next 9 months, your account will be automatically deactivated.',
    button: 'Sign in now',
    fallbackLabel: 'Or paste this link in your browser:',
    notice: 'This email was sent because your account has been inactive for 3 months. Simply sign in to keep your account active.',
  },
  uk: {
    subject: 'Lero.al — Ваш обліковий запис неактивний',
    heading: 'Ми скучили за вами на Lero.al',
    body: 'Ви не входили до свого облікового запису Lero.al протягом 3 місяців. Якщо ви не увійдете протягом наступних 9 місяців, ваш обліковий запис буде автоматично деактивовано.',
    button: 'Увійти зараз',
    fallbackLabel: 'Або вставте це посилання у браузер:',
    notice: 'Цей лист надіслано, оскільки ваш обліковий запис неактивний протягом 3 місяців. Просто увійдіть, щоб зберегти його.',
  },
  it: {
    subject: 'Lero.al — Il tuo account è inattivo',
    heading: 'Ci manchi su Lero.al',
    body: 'Non accedi al tuo account Lero.al da 3 mesi. Se non accedi entro i prossimi 9 mesi, il tuo account verrà disattivato automaticamente.',
    button: 'Accedi ora',
    fallbackLabel: 'Oppure incolla questo link nel browser:',
    notice: 'Questa email è stata inviata perché il tuo account è inattivo da 3 mesi. Basta accedere per mantenerlo attivo.',
  },
}

export function getInactivityWarningEmailStrings(locale: string) {
  return STRINGS[locale] ?? STRINGS.en
}

interface InactivityWarningEmailProps {
  signInUrl: string
  locale?: string
  preview?: string
}

export function InactivityWarningEmail({ signInUrl, locale = 'sq', preview }: InactivityWarningEmailProps) {
  const s = getInactivityWarningEmailStrings(locale)

  return (
    <BaseEmail preview={preview ?? s.heading} locale={locale}>
      <Section style={contentSection}>
        <Text style={heading}>{s.heading}</Text>
        <Text style={bodyText}>{s.body}</Text>
      </Section>

      <Section style={ctaSection}>
        <Link href={signInUrl} style={ctaButton}>{s.button}</Link>
      </Section>

      <Section style={fallbackSection}>
        <Text style={fallbackLabel}>{s.fallbackLabel}</Text>
        <Text style={fallbackUrl}>{signInUrl}</Text>
      </Section>

      <Section style={noticeSection}>
        <Text style={notice}>{s.notice}</Text>
      </Section>
    </BaseEmail>
  )
}

const contentSection: React.CSSProperties = { padding: '32px 48px 8px' }
const heading: React.CSSProperties = { fontSize: 28, fontWeight: 500, letterSpacing: '-0.5px', lineHeight: '1.25', color: '#18181b', margin: 0 }
const bodyText: React.CSSProperties = { fontSize: 16, lineHeight: '1.65', color: '#52525b', margin: '16px 0 0' }
const ctaSection: React.CSSProperties = { padding: '28px 48px 4px' }
const ctaButton: React.CSSProperties = { display: 'block', textAlign: 'center', backgroundColor: BRAND_ACCENT, color: '#ffffff', fontSize: 15, fontWeight: 500, textDecoration: 'none', padding: '14px 24px', borderRadius: 10 }
const fallbackSection: React.CSSProperties = { padding: '20px 48px 0' }
const fallbackLabel: React.CSSProperties = { fontSize: 13, lineHeight: '1.6', color: '#71717a', margin: '0 0 8px' }
const fallbackUrl: React.CSSProperties = { fontFamily: "ui-monospace,'SF Mono',Menlo,monospace", fontSize: 12, color: '#3f3f46', backgroundColor: '#fdf1f0', border: '1px solid #f7d7d3', borderRadius: 8, padding: '10px 12px', wordBreak: 'break-all', margin: 0 }
const noticeSection: React.CSSProperties = { padding: '22px 48px 36px' }
const notice: React.CSSProperties = { fontSize: 13, lineHeight: '1.6', color: '#a1a1aa', margin: 0 }
