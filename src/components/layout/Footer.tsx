import { getLocale, getTranslations } from 'next-intl/server'
import { getSetting } from '@/modules/admin/lib/settings'
import { getFooterContent } from '@/modules/admin/actions/footer'
import { FooterView } from '@/components/layout/FooterView'
import type { FooterLink } from '@/types/database'

export async function Footer() {
  const [t, locale, siteName, footerData] = await Promise.all([
    getTranslations('nav'),
    getLocale(),
    getSetting('site_name', 'Lero.al'),
    getFooterContent(await getLocale()).catch(() => null),
  ])
  const year = new Date().getFullYear()
  const [brand, tld] = siteName.includes('.')
    ? [siteName.split('.')[0], '.' + siteName.split('.').slice(1).join('.')]
    : [siteName, '']

  // Per-field fallback: DB value if non-empty, else i18n / hardcoded
  const tagline         = footerData?.tagline              || t('tagline')
  const navTitle        = footerData?.nav_section_title    || t('navigation')
  const infoTitle       = footerData?.info_section_title   || t('information')
  const socialTitle     = footerData?.social_section_title || t('follow_us')
  const copyrightTmpl   = footerData?.copyright_template   || `© {year} ${siteName} — ${t('all_rights')}`
  const copyright       = copyrightTmpl.replace('{year}', String(year))

  const navLinks    = (footerData?.nav_links    ?? []).filter(l => l.enabled)
  const infoLinks   = (footerData?.info_links   ?? []).filter(l => l.enabled)
  const socialLinks = (footerData?.social_links ?? []).filter(l => l.enabled)

  // Hardcoded fallbacks when DB has no links yet
  const hasNavLinks    = navLinks.length > 0
  const hasInfoLinks   = infoLinks.length > 0
  const hasSocialLinks = socialLinks.length > 0

  const FALLBACK_INFO_LINKS: FooterLink[] = [
    { id: 'fallback-about',   label: t('about'),    url: '/about',            enabled: true, order: 0 },
    { id: 'fallback-contact', label: t('contacts'), url: '/contact',          enabled: true, order: 1 },
    { id: 'fallback-privacy', label: t('privacy'),  url: '/privacy-policy',   enabled: true, order: 2 },
    { id: 'fallback-terms',   label: t('terms'),    url: '/terms-of-service', enabled: true, order: 3 },
  ]
  const FALLBACK_SOCIAL_LINKS: FooterLink[] = [
    { id: 'fallback-facebook',  label: 'Facebook',  url: 'https://facebook.com',  enabled: true, order: 0 },
    { id: 'fallback-instagram', label: 'Instagram', url: 'https://instagram.com', enabled: true, order: 1 },
  ]

  return (
    <FooterView
      brand={brand}
      tld={tld}
      tagline={tagline}
      navTitle={navTitle}
      infoTitle={infoTitle}
      socialTitle={socialTitle}
      hasNavLinks={hasNavLinks}
      navLinks={navLinks}
      navFallbackLabels={{ home: t('home'), listings: t('listings'), addListing: t('add_listing') }}
      infoLinks={hasInfoLinks ? infoLinks : FALLBACK_INFO_LINKS}
      socialLinks={hasSocialLinks ? socialLinks : FALLBACK_SOCIAL_LINKS}
      copyright={copyright}
      locale={locale}
    />
  )
}
