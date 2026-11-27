import { getLocale, getTranslations } from 'next-intl/server'
import { getSetting, getSettings, getFooterContent } from '@/modules/admin/lib/settings'
import { FOOTER_SETTING_KEYS, isSwitchOn } from '@/modules/admin/lib/settingKeys'
import type { FooterLink } from '@/types/database'
import { FooterView } from './FooterView'

/**
 * Footer container — resolves settings, DB-driven footer content, and i18n fallbacks, then
 * renders the presentational `FooterView` (Mantine primitives). Data logic lives here; all
 * markup lives in `FooterView`.
 *
 * Task 989 (O989-1): the admin "Footer" page is the one source. The brand is the brand title of the page's language (the site name when it is empty); the text,
 * the phone, the two e-mails and each social link are shown when filled and switched on. A failed read of the contacts drops them, never the footer.
 */
export async function Footer() {
  const locale = await getLocale()
  const [t, siteName, footerData, shared] = await Promise.all([
    getTranslations('nav'),
    getSetting('site_name', 'Lero.al'),
    getFooterContent(locale).catch(() => null),
    // inside `then`, so a throw of any kind becomes an empty result: the contacts drop, the footer stays (Task 989, T4)
    Promise.resolve().then(() => getSettings(FOOTER_SETTING_KEYS)).catch((): Record<string, string> => ({})),
  ])

  const year = new Date().getFullYear()
  const brandName = footerData?.brand_title?.trim() || siteName
  const [brand, tld] = brandName.includes('.')
    ? [brandName.split('.')[0], '.' + brandName.split('.').slice(1).join('.')]
    : [brandName, '']

  // Per-field fallback: DB value if non-empty, else i18n / hardcoded
  const tagline     = isSwitchOn(shared.footer_show_text) ? (footerData?.tagline || t('tagline')) : ''
  const navTitle    = footerData?.nav_section_title    || t('navigation')
  const infoTitle   = footerData?.info_section_title   || t('information')
  const socialTitle = footerData?.social_section_title || t('follow_us')
  const copyrightTmpl = footerData?.copyright_template  || `© {year} ${siteName} — ${t('all_rights')}`
  const copyright   = copyrightTmpl.replaceAll('{year}', String(year))

  const fallback = (id: string, label: string, url: string, order: number): FooterLink => ({
    id, label, url, enabled: true, order,
  })

  const dbNav    = (footerData?.nav_links    ?? []).filter(l => l.enabled)
  const dbInfo   = (footerData?.info_links   ?? []).filter(l => l.enabled)
  // Task 989: a social link is shown when filled and switched on; the built-in links stand only for a footer that could not be read
  const dbSocial = (footerData?.social_links ?? []).filter(l => l.enabled && typeof l.url === 'string' && l.url.trim() !== '')

  const navLinks = dbNav.length > 0 ? dbNav : [
    fallback('nav-home', t('home'), '/', 0),
    fallback('nav-listings', t('listings'), '/listings', 1),
    fallback('nav-add', t('add_listing'), '/listings/create', 2),
  ]

  const infoLinks = dbInfo.length > 0 ? dbInfo : [
    fallback('info-about', t('about'), '/about', 0),
    fallback('info-contact', t('contacts'), '/contact', 1),
    fallback('info-privacy', t('privacy'), '/privacy-policy', 2),
    fallback('info-terms', t('terms'), '/terms-of-service', 3),
  ]

  const socialLinks = footerData ? dbSocial : [
    fallback('social-facebook', 'Facebook', 'https://facebook.com', 0),
    fallback('social-instagram', 'Instagram', 'https://instagram.com', 1),
  ]

  const contact = (key: string, show: string) => isSwitchOn(shared[show]) ? (shared[key] ?? '').trim() : ''

  return (
    <FooterView
      brand={brand}
      tld={tld}
      tagline={tagline}
      navTitle={navTitle}
      infoTitle={infoTitle}
      socialTitle={socialTitle}
      navLinks={navLinks}
      infoLinks={infoLinks}
      socialLinks={socialLinks}
      contactsTitle={t('contacts')}
      phone={contact('contact_phone', 'footer_show_phone')}
      emailSupport={contact('contact_email', 'footer_show_email_support')}
      emailSales={contact('contact_email_sales', 'footer_show_email_sales')}
      copyright={copyright}
      locale={locale}
    />
  )
}
