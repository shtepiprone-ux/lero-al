/**
 * Task 989 AC3: the footer shows what the admin "Footer" page holds. The brand title of the page's language (the site name when it is empty), the footer text, the
 * phone, the support and sales e-mails and each social link are shown when filled and switched on, and hidden when switched off or empty (O989-1, 2026-11-19:
 * "if the admin turns off 'Contact phone', it stops being displayed on the site in the footer"). `SEC-989-FOOTER-LINK-DENY`: a stored `javascript:` social link, an
 * e-mail with `?cc=` and a phone with letters are checked again before output and are not rendered as links. The container is called and its element rendered.
 */
import React from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const data = vi.hoisted(() => ({
  settings: {} as Record<string, string>,
  settingsFail: false,
  footer: null as unknown,
}))

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async () => (key: string) => `t:${key}`,
}))
vi.mock('@/lib/navigation/ClientLink', () => ({
  ClientLink: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(function ClientLink(props, ref) { return <a ref={ref} {...props} /> }),
}))
vi.mock('@/modules/admin/lib/settings', () => ({
  getSetting: async (key: string, fallback: string) => data.settings[key] ?? fallback,
  getSettings: async (keys: string[]) => {
    if (data.settingsFail) throw new Error('db down')
    return Object.fromEntries(keys.filter((key) => key in data.settings).map((key) => [key, data.settings[key]]))
  },
  getFooterContent: async () => data.footer,
}))

import { Footer } from '../Footer'

const social = (id: string, label: string, url: string, enabled = true) => ({ id, label, url, enabled, order: 0 })
const ROW = {
  locale: 'en',
  brand_title: 'Lero Homes',
  tagline: 'Homes in Albania',
  nav_section_title: 'Navigation',
  nav_links: [social('n1', 'Listings', '/listings')],
  info_section_title: 'Information',
  info_links: [social('i1', 'About', '/about')],
  social_section_title: 'Follow us',
  social_links: [social('s1', 'Facebook', 'https://www.facebook.com/lero.al'), social('s2', 'Instagram', 'https://www.instagram.com/lero.al')],
  copyright_template: '© {year} Lero.al',
}
const ALL_ON = {
  site_name: 'Lero.al',
  contact_phone: '+355 69 123 4567',
  contact_email: 'support@lero.al',
  contact_email_sales: 'sales@lero.al',
}

async function renderFooter() {
  const element = await Footer()
  return render(<MantineProvider theme={theme} env="test">{element}</MantineProvider>)
}
const link = (name: string) => screen.queryByRole('link', { name }) as HTMLAnchorElement | null

beforeAll(() => setViewport(1024))
beforeEach(() => {
  data.settings = { ...ALL_ON }
  data.settingsFail = false
  data.footer = { ...ROW }
})
afterEach(cleanup)

describe('Task 989 AC3 — the footer follows the Footer page', () => {
  it('the brand is the brand title of the page\'s language', async () => {
    await renderFooter()
    expect(screen.getByText('Lero Homes')).toBeInTheDocument()
  })

  it('an empty brand title gives the site name', async () => {
    data.footer = { ...ROW, brand_title: '' }
    await renderFooter()
    expect(screen.getByText('Lero')).toBeInTheDocument()
    expect(screen.getByText('.al')).toBeInTheDocument()
  })

  it('every filled element is shown when its switch is on, and an absent switch is on', async () => {
    await renderFooter()
    expect(screen.getByText('Homes in Albania')).toBeInTheDocument()
    expect(link('+355 69 123 4567')?.getAttribute('href')).toBe('tel:+355691234567')
    expect(link('support@lero.al')?.getAttribute('href')).toBe('mailto:support@lero.al')
    expect(link('sales@lero.al')?.getAttribute('href')).toBe('mailto:sales@lero.al')
    expect(link('Facebook')?.getAttribute('href')).toBe('https://www.facebook.com/lero.al')
    expect(link('Instagram')?.getAttribute('href')).toBe('https://www.instagram.com/lero.al')
  })

  it('the switches "true" show and "false" hide each element', async () => {
    data.settings = { ...ALL_ON, footer_show_phone: 'false', footer_show_email_support: 'true', footer_show_email_sales: 'false', footer_show_text: 'false' }
    await renderFooter()
    expect(screen.queryByText('+355 69 123 4567')).toBeNull()
    expect(link('support@lero.al')).not.toBeNull()
    expect(screen.queryByText('sales@lero.al')).toBeNull()
    expect(screen.queryByText('Homes in Albania')).toBeNull()
  })

  it('a social link switched off is not shown, and all switched off shows none', async () => {
    data.footer = { ...ROW, social_links: [social('s1', 'Facebook', 'https://www.facebook.com/lero.al', false), social('s2', 'Instagram', 'https://www.instagram.com/lero.al')] }
    await renderFooter()
    expect(screen.queryByText('Facebook')).toBeNull()
    expect(link('Instagram')).not.toBeNull()
    cleanup()
    data.footer = { ...ROW, social_links: [social('s1', 'Facebook', 'https://www.facebook.com/lero.al', false), social('s2', 'Instagram', 'https://www.instagram.com/lero.al', false)] }
    await renderFooter()
    expect(screen.queryByText('Facebook')).toBeNull()
    expect(screen.queryByText('Instagram')).toBeNull()
  })

  it('an empty contact or social address is not shown, and with no contact at all there is no contacts column', async () => {
    data.settings = { site_name: 'Lero.al', contact_phone: '', contact_email: '  ', contact_email_sales: '' }
    data.footer = { ...ROW, social_links: [social('s1', 'Facebook', ''), { id: 's2', label: 'No address', enabled: true, order: 1 }] }
    await renderFooter()
    expect(screen.queryByText('t:contacts')).toBeNull()
    expect(screen.queryByText('Facebook')).toBeNull()
    expect(screen.queryByText('No address')).toBeNull()
    expect(screen.queryAllByRole('link').filter((a) => /^(tel|mailto):/.test(a.getAttribute('href') ?? ''))).toEqual([])
  })

  it('a failed read of the settings drops the contacts and keeps the rest of the footer', async () => {
    data.settingsFail = true
    await renderFooter()
    expect(screen.queryByText('t:contacts')).toBeNull()
    expect(screen.getByText('Lero Homes')).toBeInTheDocument()
    expect(link('Facebook')).not.toBeNull()
  })
})

describe('[SEC-989-FOOTER-LINK-DENY] stored values are checked again before output', () => {
  it('a javascript: social link is not a link', async () => {
    data.footer = { ...ROW, social_links: [social('s1', 'Evil', 'javascript:alert(1)'), social('s2', 'Tabbed', 'java\tscript:alert(1)')] }
    await renderFooter()
    expect(link('Evil')).toBeNull()
    expect(link('Tabbed')).toBeNull()
    expect(screen.queryAllByRole('link').some((a) => /script:/i.test(a.getAttribute('href') ?? ''))).toBe(false)
  })

  it('an e-mail with ?cc= or a line break and a phone with letters or a scheme are not rendered as links', async () => {
    for (const [phone, email] of [
      ['+355 call me', 'support@lero.al?cc=victim@example.com'],
      ['javascript:alert(1)', 'support@lero.al\nBcc: victim@example.com'],
      ['tel:+355691234567', 'a@b.al,c@d.al'],
    ]) {
      data.settings = { ...ALL_ON, contact_phone: phone, contact_email: email, contact_email_sales: email }
      await renderFooter()
      const hrefs = screen.queryAllByRole('link').map((a) => a.getAttribute('href') ?? '')
      expect(hrefs.filter((href) => /^(tel|mailto|javascript):/i.test(href)), `${phone} / ${email}`).toEqual([])
      cleanup()
    }
  })
})
