/**
 * InactivityFinalEmail — 12-month inactivity final notice (Epic D.5 / Task 124).
 *
 * Sent by the daily cron job (/api/cron/inactivity) immediately after an account
 * is auto-deactivated (soft-deleted) due to 12 months of inactivity.
 * Informs the user and provides a 90-day window to restore by signing in.
 *
 * Locale strings are inline (sq/en/uk/it) — cron has no request context.
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
    subject: 'Lero.al — Llogaria juaj u çaktivizua',
    heading: 'Llogaria juaj u çaktivizua',
    body: 'Llogaria juaj Lero.al u çaktivizua automatikisht për shkak të joaktivitetit prej 12 muajsh. Të dhënat tuaja mbahen për 90 ditë. Nëse identifikoheni brenda kësaj periudhe, llogaria do të restaurohet automatikisht.',
    button: 'Restauroni llogarinë',
    fallbackLabel: 'Ose ngjisnin këtë link:',
    notice: 'Pas 90 ditëve pa hyrje, të dhënat mund të fshihen përgjithmonë. Nëse nuk dëshironi ta restauroni, nuk keni nevojë të ndërmerrni asnjë veprim.',
  },
  en: {
    subject: 'Lero.al — Your account has been deactivated',
    heading: 'Your account has been deactivated',
    body: 'Your Lero.al account was automatically deactivated after 12 months of inactivity. Your data is kept for 90 days. If you sign in within this period, your account will be automatically restored.',
    button: 'Restore my account',
    fallbackLabel: 'Or paste this link in your browser:',
    notice: 'After 90 days without signing in, your data may be permanently deleted. If you do not wish to restore your account, no action is needed.',
  },
  uk: {
    subject: 'Lero.al — Ваш обліковий запис деактивовано',
    heading: 'Ваш обліковий запис деактивовано',
    body: 'Ваш обліковий запис Lero.al було автоматично деактивовано через 12 місяців бездіяльності. Ваші дані зберігаються протягом 90 днів. Якщо ви увійдете протягом цього часу, обліковий запис буде відновлено автоматично.',
    button: 'Відновити обліковий запис',
    fallbackLabel: 'Або вставте це посилання у браузер:',
    notice: 'Після 90 днів без входу ваші дані можуть бути остаточно видалені. Якщо ви не хочете відновлювати обліковий запис, жодних дій не потрібно.',
  },
  it: {
    subject: 'Lero.al — Il tuo account è stato disattivato',
    heading: 'Il tuo account è stato disattivato',
    body: 'Il tuo account Lero.al è stato automaticamente disattivato dopo 12 mesi di inattività. I tuoi dati vengono conservati per 90 giorni. Se accedi entro questo periodo, il tuo account verrà ripristinato automaticamente.',
    button: 'Ripristina il mio account',
    fallbackLabel: 'Oppure incolla questo link nel browser:',
    notice: 'Dopo 90 giorni senza accesso, i tuoi dati potrebbero essere eliminati definitivamente. Se non desideri ripristinare l\'account, non è necessaria alcuna azione.',
  },
}

export function getInactivityFinalEmailStrings(locale: string) {
  return STRINGS[locale] ?? STRINGS.en
}

interface InactivityFinalEmailProps {
  signInUrl: string
  locale?: string
  preview?: string
}

export function InactivityFinalEmail({ signInUrl, locale = 'sq', preview }: InactivityFinalEmailProps) {
  const s = getInactivityFinalEmailStrings(locale)

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
