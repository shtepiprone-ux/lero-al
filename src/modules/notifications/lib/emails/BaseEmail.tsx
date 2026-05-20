/**
 * BaseEmail — shared layout for all Lero.al transactional emails.
 *
 * Implements the approved design reference (tasks/Epics/Epic_D_email_design_reference.html):
 * top 3px coral strip, logo tile + wordmark, content slot, faint-grey footer.
 *
 * Brand accent lives in ONE constant (BRAND_ACCENT = #EC5447).
 * For WCAG AA on smaller body text use BRAND_AA (#BD4339).
 */
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Preview,
  Hr,
} from '@react-email/components'
import * as React from 'react'

export const BRAND_ACCENT = '#EC5447'
export const BRAND_AA = '#BD4339'

interface BaseEmailProps {
  preview?: string
  locale?: string
  children: React.ReactNode
}

export function BaseEmail({ preview, locale = 'sq', children }: BaseEmailProps) {
  return (
    <Html lang={locale}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      {preview && <Preview>{preview}</Preview>}
      <Body style={body}>
        <Container style={container}>
          {/* 3px coral accent strip */}
          <Section style={strip} />

          {/* Logo header */}
          <Section style={logoSection}>
            <Row>
              <Column style={{ width: 28, paddingRight: 9 }}>
                <div style={logoTile}>L</div>
              </Column>
              <Column>
                <span style={wordmark}>
                  Lero<span style={{ color: BRAND_ACCENT }}>.al</span>
                </span>
              </Column>
            </Row>
          </Section>

          {/* Content slot — wraps template-specific sections */}
          {children}

          {/* Footer */}
          <Hr style={{ borderColor: '#f0f0f0', margin: 0 }} />
          <Section style={footerSection}>
            <Text style={footerBrand}>
              Lero<span style={{ color: BRAND_ACCENT }}>.al</span>
            </Text>
            <Text style={footerSub}>Real estate marketplace for Albania</Text>
            <Text style={footerLinks}>
              <Link href="https://lero.al/help" style={footerLink}>Help center</Link>
              <span style={{ color: '#d4d4d8' }}>&nbsp;·&nbsp;</span>
              <Link href="https://lero.al/privacy" style={footerLink}>Privacy</Link>
              <span style={{ color: '#d4d4d8' }}>&nbsp;·&nbsp;</span>
              <span>© {new Date().getFullYear()} Lero.al</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  margin: 0,
  padding: '32px 16px',
  backgroundColor: '#f4f4f5',
  fontFamily: "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
}

const container: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  backgroundColor: '#ffffff',
  border: '1px solid #ececec',
  borderRadius: 14,
  overflow: 'hidden',
}

const strip: React.CSSProperties = {
  height: 3,
  backgroundColor: BRAND_ACCENT,
  padding: 0,
  margin: 0,
}

const logoSection: React.CSSProperties = {
  padding: '38px 48px 0',
}

const logoTile: React.CSSProperties = {
  display: 'inline-block',
  width: 28,
  height: 28,
  backgroundColor: BRAND_ACCENT,
  borderRadius: 7,
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 600,
  textAlign: 'center',
  lineHeight: '28px',
}

const wordmark: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 500,
  letterSpacing: '-0.2px',
  color: '#18181b',
}

const footerSection: React.CSSProperties = {
  padding: '24px 48px 36px',
  backgroundColor: '#fafafa',
}

const footerBrand: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#3f3f46',
  margin: 0,
}

const footerSub: React.CSSProperties = {
  fontSize: 12,
  lineHeight: '1.6',
  color: '#a1a1aa',
  margin: '4px 0 0',
}

const footerLinks: React.CSSProperties = {
  fontSize: 12,
  lineHeight: '1.6',
  color: '#a1a1aa',
  margin: '14px 0 0',
}

const footerLink: React.CSSProperties = {
  color: '#71717a',
  textDecoration: 'none',
}
