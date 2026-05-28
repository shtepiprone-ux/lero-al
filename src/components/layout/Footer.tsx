import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { getSetting } from '@/modules/admin/lib/settings'
import { getFooterContent } from '@/modules/admin/actions/footer'
import type { FooterLink } from '@/types/database'

// Resolve a link URL: internal paths get locale prefix; external used as-is.
function resolveHref(url: string, locale: string): string {
  if (!url) return '#'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `/${locale}${url.startsWith('/') ? url : '/' + url}`
}

function isExternal(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

function FooterLink_({ link, locale }: { link: FooterLink; locale: string }) {
  const href = resolveHref(link.url, locale)
  const ext = isExternal(link.url)
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </Link>
  )
}

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

  return (
    <footer className="site-footer border-t bg-surface-2 pb-14 md:pb-0">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href={`/${locale}`} className="font-bold text-xl w-fit">
              <span className="text-primary">{brand}</span>
              <span className="text-foreground">{tld}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
              {tagline}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {navTitle}
            </p>
            <nav className="flex flex-col gap-2.5" aria-label={navTitle}>
              {hasNavLinks ? (
                navLinks.map(link => (
                  <FooterLink_ key={link.id} link={link} locale={locale} />
                ))
              ) : (
                <>
                  <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{t('home')}</Link>
                  <Link href={`/${locale}/listings`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{t('listings')}</Link>
                  <Link href={`/${locale}/listings/create`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{t('add_listing')}</Link>
                </>
              )}
            </nav>
          </div>

          {/* Information */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {infoTitle}
            </p>
            <nav className="flex flex-col gap-2.5" aria-label={infoTitle}>
              {hasInfoLinks ? (
                infoLinks.map(link => (
                  <FooterLink_ key={link.id} link={link} locale={locale} />
                ))
              ) : (
                <>
                  <Link href={`/${locale}/about`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{t('about')}</Link>
                  <Link href={`/${locale}/contact`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{t('contacts')}</Link>
                  <Link href={`/${locale}/privacy-policy`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{t('privacy')}</Link>
                  <Link href={`/${locale}/terms-of-service`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{t('terms')}</Link>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{copyright}</p>
          <div className="flex items-center gap-5">
            <span className="text-xs text-muted-foreground hidden sm:block">{socialTitle}:</span>
            {hasSocialLinks ? (
              socialLinks.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))
            ) : (
              <>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">Facebook</a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">Instagram</a>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
