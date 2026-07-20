import { getTranslations, getLocale } from 'next-intl/server'
import { Title, Text, Box } from '@mantine/core'
import { Building2 } from 'lucide-react'
import { HeroSearchClient } from '@/components/shared/HeroSearchClient'
import { FeaturedListings } from '@/modules/listings/components/FeaturedListings'
import { LatestListings } from '@/modules/listings/components/LatestListings'
import { PopularLocations } from '@/modules/locations/components/PopularLocations'
import { createClient } from '@/lib/supabase/server'
import { loadUserFavoriteListingIds } from '@/modules/listings/lib/loadUserFavoriteListingIds'
import { AgentCtaButton } from '@/components/shared/AgentCtaButton'
import { ViewAllLink } from '@/components/shared/ViewAllLink'
import { HowItWorksSteps } from '@/components/shared/HowItWorksSteps'

export default async function HomePage() {
  const t = await getTranslations('home')
  const tl = await getTranslations('listing')
  const locale = await getLocale()

  const supabase = await createClient()
  const favoriteIds = await loadUserFavoriteListingIds(supabase)

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950 text-primary-foreground py-16 md:py-24">
        <div className="container-wide relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Title order={1} c="white" fw={700} lh={1.25} fz={{ base: '1.875rem', sm: '2.25rem', md: '3rem' }} mb="md">
              {t('hero_title')}
            </Title>
            <Text c="white" opacity={0.8} fz={{ base: '1rem', sm: '1.125rem' }} maw={576} mx="auto">
              {t('hero_subtitle')}
            </Text>
          </div>
          <HeroSearchClient />
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_600px]">
        <div className="container-wide">
          <FeaturedListings favoriteIds={favoriteIds} />
        </div>
      </section>

      {/* ── Latest listings ── */}
      <section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_500px]">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-6">
            <Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}>{tl('latest')}</Title>
            <ViewAllLink href={`/${locale}/listings`} label={tl('view_all')} />
          </div>
          <LatestListings favoriteIds={favoriteIds} />
        </div>
      </section>

      {/* ── Popular locations — section wrapper + heading live inside PopularLocations (J.2);
          component returns null when no featured locations, hiding the entire section. */}
      <PopularLocations />

      {/* ── How it works ── */}
      <section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_340px]">
        <div className="container-wide">
          <HowItWorksSteps
            heading={t('how_it_works')}
            steps={[
              { title: t('step1_title'), desc: t('step1_desc') },
              { title: t('step2_title'), desc: t('step2_desc') },
              { title: t('step3_title'), desc: t('step3_desc') },
            ]}
          />
        </div>
      </section>

      {/* ── Agent CTA ── */}
      <section className="py-12 md:py-16 2xl:py-20 bg-gradient-to-br from-primary/10 to-primary/5 [content-visibility:auto] [contain-intrinsic-size:auto_280px]">
        <div className="container-wide">
          <div className="max-w-2xl mx-auto text-center">
            <Box ta="center" mb="md">
              <Building2 size={48} color="var(--mantine-color-brand-7)" />
            </Box>
            <Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }} mb="sm">
              {t('agent_cta_title')}
            </Title>
            <Text c="dimmed" mb="xl">{t('agent_cta_desc')}</Text>
            <AgentCtaButton
              href={`/${locale}/auth/register?type=agent`}
              label={t('agent_cta_button')}
            />
          </div>
        </div>
      </section>

    </div>
  )
}
