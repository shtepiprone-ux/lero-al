import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer border-t bg-surface-2">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href={`/${locale}`} className="font-bold text-xl w-fit">
              <span className="text-primary">Shtepi</span>
              <span className="text-foreground">.al</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
              {t('tagline')}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('navigation')}
            </p>
            <nav className="flex flex-col gap-2.5" aria-label={t('navigation')}>
              <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                {t('home')}
              </Link>
              <Link href={`/${locale}/listings`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                {t('listings')}
              </Link>
              <Link href={`/${locale}/listings/create`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                {t('add_listing')}
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('information')}
            </p>
            <nav className="flex flex-col gap-2.5" aria-label={t('information')}>
              <Link href={`/${locale}/about`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                {t('about')}
              </Link>
              <Link href={`/${locale}/privacy-policy`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                {t('privacy')}
              </Link>
              <Link href={`/${locale}/terms-of-service`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                {t('terms')}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} Shtepi.al — {t('all_rights')}
          </p>
          <div className="flex items-center gap-5">
            <span className="text-xs text-muted-foreground hidden sm:block">{t('follow_us')}:</span>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Facebook"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
