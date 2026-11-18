// @vitest-environment node
/**
 * Task 986: every e-mail template renders through the real `render` of `@react-email/render`, user text reaches the HTML as escaped text, and the
 * deprecated React Email umbrella package is gone from the code, the manifest and the lockfile.
 *
 *  - AC1: each template renders to an HTML document that holds the value passed to it.
 *  - AC2: markup typed by a user (`name`, `listingTitle`) appears escaped, never as a tag.
 *  - AC3: no file under `src/` names the deprecated package; `package.json` and `package-lock.json` do not hold it.
 *  - AC5 (manifest part): no `email` preview script; `react-email` and `@react-email/render` are exact production dependencies.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { render } from '@react-email/render'
import { InactivityFinalEmail } from '../InactivityFinalEmail'
import { InactivityWarningEmail } from '../InactivityWarningEmail'
import { MagicLinkEmail } from '../MagicLinkEmail'
import { PasswordChangedEmail } from '../PasswordChangedEmail'
import { ReauthEmail } from '../ReauthEmail'
import { RecoveryEmail } from '../RecoveryEmail'
import { ReporterNotificationEmail } from '../ReporterNotificationEmail'
import { VerifyEmail } from '../VerifyEmail'

const ROOT = process.cwd()
const LINK = 'https://lero.al/auth/confirm?token_hash=abc123&type=signup'
/** the same link as the HTML holds it: the "&" of the query string is written as the entity "&amp;" in an attribute and in text */
const LINK_HTML = 'https://lero.al/auth/confirm?token_hash=abc123&amp;type=signup'
const OTP = '482913'
const LOCALES = ['sq', 'en', 'uk', 'it'] as const
const HOSTILE = '<img src=x onerror=alert(1)>'
const HOSTILE_ESCAPED = '&lt;img src=x onerror=alert(1)&gt;'

const count = (html: string, needle: string) => html.split(needle).length - 1

function expectDocument(html: string, locale: string) {
  expect(html.startsWith('<!DOCTYPE html')).toBe(true)
  expect(html).toMatch(new RegExp(`<html[^>]* lang="${locale}"`))
  expect(html).toContain('</html>')
  // the footer that BaseEmail wraps around every template
  expect(html).toContain('https://lero.al/help')
}

describe('AC1: each template renders through the real render() to a document that holds its value', () => {
  const linkTemplates = [
    ['VerifyEmail', (locale: string) => <VerifyEmail confirmUrl={LINK} locale={locale} />],
    ['RecoveryEmail', (locale: string) => <RecoveryEmail resetUrl={LINK} locale={locale} />],
    ['MagicLinkEmail', (locale: string) => <MagicLinkEmail signInUrl={LINK} locale={locale} />],
    ['InactivityWarningEmail', (locale: string) => <InactivityWarningEmail signInUrl={LINK} locale={locale} />],
    ['InactivityFinalEmail', (locale: string) => <InactivityFinalEmail signInUrl={LINK} locale={locale} />],
  ] as const

  describe.each(linkTemplates)('%s', (_name, build) => {
    it.each(LOCALES)('locale %s: the link is the button target and the fallback text', async (locale) => {
      const html = await render(build(locale))
      expectDocument(html, locale)
      expect(html).toContain(`href="${LINK_HTML}"`)
      // the fallback line shows the same address as text, so the link is present twice
      expect(count(html, LINK_HTML)).toBe(2)
    })
  })

  it.each(LOCALES)('ReauthEmail locale %s: the code is in the document', async (locale) => {
    const html = await render(<ReauthEmail otp={OTP} locale={locale} />)
    expectDocument(html, locale)
    expect(html).toContain(`>${OTP}</p>`)
  })

  it('PasswordChangedEmail: the name is in the greeting and the date is in the Tirana time zone', async () => {
    const html = await render(<PasswordChangedEmail name="Ana" changedAt={new Date('2026-03-01T10:30:00Z')} />)
    expectDocument(html, 'sq')
    expect(html).toContain('Përshëndetje, Ana!')
    // 10:30 UTC is 11:30 in Europe/Tirane in March
    expect(html).toContain('11:30')
  })

  it('PasswordChangedEmail: without a name the greeting is the plain one', async () => {
    const html = await render(<PasswordChangedEmail name={null} changedAt={new Date('2026-03-01T10:30:00Z')} />)
    expect(html).toContain('Përshëndetje!')
    expect(html).not.toContain('Përshëndetje, ')
  })

  it.each(LOCALES)('ReporterNotificationEmail locale %s: the listing title is in the document', async (locale) => {
    const html = await render(<ReporterNotificationEmail status="resolved" listingTitle="Flat in Tirana" locale={locale} />)
    expectDocument(html, locale)
    expect(html).toContain('Flat in Tirana')
  })

  it('ReporterNotificationEmail: without a title no listing line is rendered', async () => {
    const html = await render(<ReporterNotificationEmail status="dismissed" locale="en" />)
    expectDocument(html, 'en')
    expect(html).not.toContain('Listing:')
  })
})

describe('AC2: markup typed by a user appears escaped, never as a tag', () => {
  it('PasswordChangedEmail: a name with an <img> tag is text', async () => {
    const html = await render(<PasswordChangedEmail name={HOSTILE} changedAt={new Date('2026-03-01T10:30:00Z')} />)
    expect(html).toContain(`Përshëndetje, ${HOSTILE_ESCAPED}!`)
    expect(html).not.toContain('<img')
    expect(html).not.toContain(HOSTILE)
  })

  it.each(LOCALES)('ReporterNotificationEmail locale %s: a listing title with an <img> tag is text', async (locale) => {
    const html = await render(<ReporterNotificationEmail status="resolved" listingTitle={HOSTILE} locale={locale} />)
    expect(html).toContain(HOSTILE_ESCAPED)
    expect(html).not.toContain('<img')
    expect(html).not.toContain(HOSTILE)
  })
})

describe('AC3 and AC5: the deprecated package is gone and the manifest is as the task states', () => {
  // the name is built from parts so that this file does not name the package in one piece
  const DEPRECATED = ['@react-email', 'components'].join('/')
  const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'])

  function sourceFiles(dir: string): string[] {
    const found: string[] = []
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) found.push(...sourceFiles(full))
      else if (SOURCE_EXTENSIONS.has(extname(entry))) found.push(full)
    }
    return found
  }

  it('no file under src/ names the deprecated package (import, require, dynamic import or mock)', () => {
    const files = sourceFiles(join(ROOT, 'src'))
    // the scan reaches the templates it is about, so an empty result is a result
    expect(files.some((file) => file.replace(/\\/g, '/').endsWith('src/modules/notifications/lib/emails/BaseEmail.tsx'))).toBe(true)
    const naming = files.filter((file) => {
      const text = readFileSync(file, 'utf8')
      return ["'", '"', '`'].some((quote) => text.includes(`${quote}${DEPRECATED}${quote}`))
    })
    expect(naming.map((file) => file.slice(ROOT.length + 1).replace(/\\/g, '/'))).toEqual([])
  })

  const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }

  it('package.json does not declare the deprecated package or the dead email preview script', () => {
    expect(manifest.dependencies[DEPRECATED]).toBeUndefined()
    expect(manifest.devDependencies[DEPRECATED]).toBeUndefined()
    expect(manifest.scripts.email).toBeUndefined()
  })

  it('react-email and @react-email/render are exact production dependencies', () => {
    expect(manifest.dependencies['react-email']).toBe('6.1.5')
    expect(manifest.dependencies['@react-email/render']).toBe('2.0.8')
    expect(manifest.devDependencies['react-email']).toBeUndefined()
  })

  it('package-lock.json holds no entry for the deprecated package', () => {
    const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json'), 'utf8')) as {
      packages: Record<string, { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>
    }
    expect(Object.keys(lock.packages).filter((key) => key.endsWith(`node_modules/${DEPRECATED}`))).toEqual([])
    // the root entry is the project's own manifest as the lockfile records it
    expect(lock.packages[''].dependencies?.['react-email']).toBeDefined()
    expect(lock.packages[''].dependencies?.[DEPRECATED]).toBeUndefined()
    expect(lock.packages[''].devDependencies?.[DEPRECATED]).toBeUndefined()
  })
})
