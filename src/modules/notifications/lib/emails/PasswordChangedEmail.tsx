/**
 * PasswordChangedEmail — security notification sent after a successful password change.
 *
 * sq-only per Task 251 (Albanian-only outbound email policy).
 * Triggered by: cabinet password-change (Task 273) + recovery flow (Task 157/121).
 * NOT a Supabase-initiated auth email — sent directly by our server code after
 * auth.updateUser({ password }) succeeds.
 */
import { Section, Text, Link } from '@react-email/components'
import * as React from 'react'
import { BaseEmail, BRAND_ACCENT } from './BaseEmail'

interface PasswordChangedEmailProps {
  name?: string | null
  changedAt: Date
}

export function PasswordChangedEmail({ name, changedAt }: PasswordChangedEmailProps) {
  const greeting = name ? `Përshëndetje, ${name}!` : 'Përshëndetje!'

  const dateStr = new Intl.DateTimeFormat('sq-AL', {
    timeZone: 'Europe/Tirane',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(changedAt)

  const timeStr = new Intl.DateTimeFormat('sq-AL', {
    timeZone: 'Europe/Tirane',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(changedAt)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'
  const forgotPasswordUrl = `${siteUrl}/sq/auth/forgot-password`

  return (
    <BaseEmail preview="Fjalëkalimi juaj në Lero.al është ndryshuar" locale="sq">
      <Section style={contentSection}>
        <Text style={heading}>Fjalëkalimi i ndryshuar</Text>

        <Text style={bodyText}>{greeting}</Text>

        <Text style={bodyText}>
          Fjalëkalimi i llogarisë suaj në Lero.al sapo është ndryshuar nga {dateStr} në orën {timeStr} (ora e Tiranës).
        </Text>

        <Text style={bodyText}>
          Nëse keni qenë ju, mund ta injoroni këtë email — gjithçka është në rregull.
        </Text>

        <Text style={bodyText}>
          Nëse NUK ishit ju, dikush mund të ketë akses te llogaria juaj. Klikoni më poshtë për të rivendosur menjëherë fjalëkalimin dhe për të dalë nga të gjitha pajisjet:
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Link href={forgotPasswordUrl} style={ctaButton}>Rivendos fjalëkalimin</Link>
      </Section>

      <Section style={noticeSection}>
        <Text style={notice}>
          Për ndihmë, kontaktoni: support@lero.al
        </Text>
        <Text style={notice}>Ekipi i Lero.al</Text>
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

const noticeSection: React.CSSProperties = {
  padding: '22px 48px 36px',
}

const notice: React.CSSProperties = {
  fontSize: 13,
  lineHeight: '1.6',
  color: '#a1a1aa',
  margin: '0 0 4px',
}
