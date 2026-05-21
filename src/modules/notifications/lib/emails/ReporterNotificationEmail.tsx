/**
 * ReporterNotificationEmail — informs a reporter of the outcome of their listing
 * report (resolved → action taken; dismissed → no violation found).
 *
 * Sent by updateReportStatusAction when a moderator/admin transitions a report
 * to 'resolved' or 'dismissed'. Code-first React Email on BaseEmail, inline
 * STRINGS sq/en/uk/it, locale resolved via resolveUserLocale.
 *
 * Epic C.4 / Task 125
 */

import { Section, Text } from '@react-email/components'
import * as React from 'react'
import { BaseEmail } from './BaseEmail'

// ── Locale strings ────────────────────────────────────────────────────────────

const STRINGS: Record<string, Record<'resolved' | 'dismissed', {
  subject: string
  heading: string
  body: string
  notice: string
}>> = {
  sq: {
    resolved: {
      subject: 'Raporti juaj u zgjidh — Lero.al',
      heading: 'Raporti juaj u shqyrtua',
      body: 'Faleminderit për raportimin tuaj. Ne kemi shqyrtuar ankesën dhe kemi ndërmarrë hapat e nevojshëm. Angazhimi juaj ndihmon komunitetin Lero.al të jetë i sigurt.',
      notice: 'Nëse keni pyetje shtesë, mund të na kontaktoni nëpërmjet faqes sonë të ndihmës.',
    },
    dismissed: {
      subject: 'Raporti juaj u rishikua — Lero.al',
      heading: 'Raporti juaj u rishikua',
      body: 'Faleminderit për raportimin tuaj. Pas shqyrtimit të kujdesshëm, nuk kemi gjetur shkelje të rregullave tona për listimin e raportuar.',
      notice: 'Nëse besoni se ky vendim nuk është i drejtë, mund të na kontaktoni dhe do t\'ju ndihmojmë.',
    },
  },
  en: {
    resolved: {
      subject: 'Your report has been resolved — Lero.al',
      heading: 'Your report has been resolved',
      body: 'Thank you for your report. We have reviewed the complaint and taken the necessary steps. Your contribution helps keep the Lero.al community safe.',
      notice: 'If you have further questions, you can reach us through our help centre.',
    },
    dismissed: {
      subject: 'Your report has been reviewed — Lero.al',
      heading: 'Your report has been reviewed',
      body: 'Thank you for your report. After careful review, we did not find a violation of our guidelines for the reported listing.',
      notice: 'If you believe this decision is incorrect, please contact us and we will be happy to help.',
    },
  },
  uk: {
    resolved: {
      subject: 'Ваш звіт вирішено — Lero.al',
      heading: 'Ваш звіт розглянуто',
      body: 'Дякуємо за ваш звіт. Ми розглянули скаргу і вжили необхідних заходів. Ваша участь допомагає зберегти безпеку спільноти Lero.al.',
      notice: 'Якщо у вас є додаткові питання, ви можете зв\'язатися з нами через наш центр допомоги.',
    },
    dismissed: {
      subject: 'Ваш звіт розглянуто — Lero.al',
      heading: 'Ваш звіт розглянуто',
      body: 'Дякуємо за ваш звіт. Після ретельного розгляду ми не виявили порушень наших правил щодо зазначеного оголошення.',
      notice: 'Якщо ви вважаєте це рішення неправильним, будь ласка, зв\'яжіться з нами — ми з радістю допоможемо.',
    },
  },
  it: {
    resolved: {
      subject: 'La tua segnalazione è stata risolta — Lero.al',
      heading: 'La tua segnalazione è stata esaminata',
      body: 'Grazie per la tua segnalazione. Abbiamo esaminato il reclamo e adottato le misure necessarie. Il tuo contributo aiuta a mantenere sicura la comunità di Lero.al.',
      notice: 'Per ulteriori domande, puoi contattarci tramite il nostro centro assistenza.',
    },
    dismissed: {
      subject: 'La tua segnalazione è stata esaminata — Lero.al',
      heading: 'La tua segnalazione è stata esaminata',
      body: 'Grazie per la tua segnalazione. Dopo un\'attenta revisione, non abbiamo riscontrato violazioni delle nostre linee guida per l\'annuncio segnalato.',
      notice: 'Se ritieni che questa decisione sia errata, ti invitiamo a contattarci e saremo lieti di aiutarti.',
    },
  },
}

export function getReporterNotificationEmailStrings(
  locale: string,
  status: 'resolved' | 'dismissed',
) {
  return (STRINGS[locale] ?? STRINGS.en)[status]
}

// ── Template ──────────────────────────────────────────────────────────────────

interface ReporterNotificationEmailProps {
  status: 'resolved' | 'dismissed'
  listingTitle?: string
  locale?: string
  preview?: string
}

export function ReporterNotificationEmail({
  status,
  listingTitle,
  locale = 'sq',
  preview,
}: ReporterNotificationEmailProps) {
  const s = getReporterNotificationEmailStrings(locale, status)

  return (
    <BaseEmail preview={preview ?? s.heading} locale={locale}>
      <Section style={contentSection}>
        <Text style={heading}>{s.heading}</Text>
        {listingTitle && (
          <Text style={listingLine}>
            {locale === 'sq' ? 'Listimi:' :
             locale === 'uk' ? 'Оголошення:' :
             locale === 'it' ? 'Annuncio:' : 'Listing:'}{' '}
            <span style={listingName}>{listingTitle}</span>
          </Text>
        )}
        <Text style={bodyText}>{s.body}</Text>
      </Section>

      <Section style={noticeSection}>
        <Text style={notice}>{s.notice}</Text>
      </Section>
    </BaseEmail>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const contentSection: React.CSSProperties = { padding: '32px 48px 8px' }

const heading: React.CSSProperties = {
  fontSize: 28, fontWeight: 500, letterSpacing: '-0.5px',
  lineHeight: '1.25', color: '#18181b', margin: 0,
}

const listingLine: React.CSSProperties = {
  fontSize: 13, lineHeight: '1.6', color: '#71717a', margin: '12px 0 0',
}

const listingName: React.CSSProperties = {
  fontWeight: 500, color: '#3f3f46',
}

const bodyText: React.CSSProperties = {
  fontSize: 16, lineHeight: '1.65', color: '#52525b', margin: '16px 0 0',
}

const noticeSection: React.CSSProperties = { padding: '22px 48px 36px' }

const notice: React.CSSProperties = {
  fontSize: 13, lineHeight: '1.6', color: '#a1a1aa', margin: 0,
}
