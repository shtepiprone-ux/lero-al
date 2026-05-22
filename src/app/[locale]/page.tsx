import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { Search, Home, Phone, Building2, MapPin, TrendingUp, Users } from 'lucide-react'
import { HeroSearchClient } from '@/components/shared/HeroSearchClient'
import { FeaturedListings } from '@/modules/listings/components/FeaturedListings'
import { LatestListings } from '@/modules/listings/components/LatestListings'
import { PopularLocations } from '@/modules/locations/components/PopularLocations'
import { getSiteStats } from '@/modules/listings/lib/queries'
import { formatCount } from '@/lib/formatters'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const t = await getTranslations('home')
  const tl = await getTranslations('listing')
  const locale = await getLocale()

  const stats = await getSiteStats().catch(() => ({ listings: 0, cities: 0 }))

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950 text-primary-foreground py-16 md:py-24">
        <div className="container-wide relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
              {t('hero_title')}
            </h1>
            <p className="text-base sm:text-lg text-primary-foreground/80 max-w-xl mx-auto">
              {t('hero_subtitle')}
            </p>
          </div>
          <HeroSearchClient />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-primary-foreground/20">
            <div className="flex flex-col items-center py-5 px-4 text-center">
              <span className="text-2xl font-bold">{formatCount(stats.listings, locale)}+</span>
              <span className="text-sm text-primary-foreground/80 flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                {t('stats_listings')}
              </span>
            </div>
            <div className="flex flex-col items-center py-5 px-4 text-center">
              <span className="text-2xl font-bold">{stats.cities}+</span>
              <span className="text-sm text-primary-foreground/80 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                {t('stats_cities')}
              </span>
            </div>
            <div className="hidden md:flex flex-col items-center py-5 px-4 text-center">
              <span className="text-2xl font-bold">100+</span>
              <span className="text-sm text-primary-foreground/80 flex items-center gap-1 mt-0.5">
                <Users className="h-3.5 w-3.5" />
                {t('stats_agents')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_600px]">
        <div className="container-wide">
          <FeaturedListings />
        </div>
      </section>

      {/* ── Latest listings ── */}
      <section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_500px]">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">{tl('latest')}</h2>
            <Link
              href={`/${locale}/listings`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              {tl('view_all')}
            </Link>
          </div>
          <LatestListings />
        </div>
      </section>

      {/* ── Popular locations — section wrapper + heading live inside PopularLocations (J.2);
          component returns null when no featured locations, hiding the entire section. */}
      <PopularLocations />

      {/* ── How it works ── */}
      <section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_340px]">
        <div className="container-wide">
          <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold text-center mb-10">{t('how_it_works')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { Icon: Search, title: t('step1_title'), desc: t('step1_desc'), num: '1' },
              { Icon: Home, title: t('step2_title'), desc: t('step2_desc'), num: '2' },
              { Icon: Phone, title: t('step3_title'), desc: t('step3_desc'), num: '3' },
            ].map(step => (
              <div key={step.num} className="flex flex-col items-center text-center gap-3">
                <div className="relative h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <step.Icon className="h-6 w-6 text-primary" />
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent CTA ── */}
      <section className="py-12 md:py-16 2xl:py-20 bg-gradient-to-br from-primary/10 to-primary/5 [content-visibility:auto] [contain-intrinsic-size:auto_280px]">
        <div className="container-wide">
          <div className="max-w-2xl mx-auto text-center">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-3">{t('agent_cta_title')}</h2>
            <p className="text-muted-foreground mb-6">{t('agent_cta_desc')}</p>
            <Link
              href={`/${locale}/auth/register?type=agent`}
              className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
              data-track="register"
            >
              <Building2 className="h-5 w-5" />
              {t('agent_cta_button')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
