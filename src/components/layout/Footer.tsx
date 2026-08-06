import { getLocale, getTranslations } from 'next-intl/server'
import { getSetting } from '@/modules/admin/lib/settings'
import { getFooterContent } from '@/modules/admin/actions/footer'
import type { FooterLink } from '@/types/database'
import { FooterView } from './FooterView'

/**
 * Footer container — resolves settings, DB-driven footer content, and i18n fallbacks, then
 * renders the presentational `FooterView` (Mantine primitives). Data logic lives here; all
 * markup lives in `FooterView`.
 */
export async function Footer() {
  const locale = await getLocale()
  const [t, siteName, footerData] = await Promise.all([
    getTranslations('nav'),
    getSetting('site_name', 'Lero.al'),
    getFooterContent(locale).catch(() => null),
  ])

  const year = new Date().getFullYear()
  const [brand, tld] = siteName.includes('.')
    ? [siteName.split('.')[0], '.' + siteName.split('.').slice(1).join('.')]
    : [siteName, '']

  // Per-field fallback: DB value if non-empty, else i18n / hardcoded
  const tagline     = footerData?.tagline              || t('tagline')
  const navTitle    = footerData?.nav_section_title    || t('navigation')
  const infoTitle   = footerData?.info_section_title   || t('information')
  const socialTitle = footerData?.social_section_title || t('follow_us')
  const copyrightTmpl = footerData?.copyright_template  || `© {year} ${siteName} — ${t('all_rights')}`
  const copyright   = copyrightTmpl.replace('{year}', String(year))

  const fallback = (id: string, label: string, url: string, order: number): FooterLink => ({
    id, label, url, enabled: true, order,
  })

  const dbNav    = (footerData?.nav_links    ?? []).filter(l => l.enabled)
  const dbInfo   = (footerData?.info_links   ?? []).filter(l => l.enabled)
  const dbSocial = (footerData?.social_links ?? []).filter(l => l.enabled)

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

  const socialLinks = dbSocial.length > 0 ? dbSocial : [
    fallback('social-facebook', 'Facebook', 'https://facebook.com', 0),
    fallback('social-instagram', 'Instagram', 'https://instagram.com', 1),
  ]

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
      copyright={copyright}
      locale={locale}
    />
  )
}
