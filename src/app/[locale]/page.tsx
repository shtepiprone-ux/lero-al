import { getTranslations, getLocale } from 'next-intl/server'
import { Title, Text, Box, Stack, Group } from '@mantine/core'
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
    <Stack gap={0}>

      {/* ── Hero ── */}
      <Box component="section" bg="var(--primary)" pos="relative" py={{ base: '4rem', md: '6rem' }}>
        <Box className="container-wide" pos="relative" style={{ zIndex: 10 }}>
          <Box maw={768} mx="auto" ta="center" mb={40}>
            <Title order={1} c="white" fw={700} lh={1.25} fz={{ base: '1.875rem', sm: '2.25rem', md: '3rem' }} mb="md">
              {t('hero_title')}
            </Title>
            <Text c="white" fw={700} fz={{ base: '1.25rem', sm: '1.375rem' }} maw={576} mx="auto">
              {t('hero_subtitle')}
            </Text>
          </Box>
          <HeroSearchClient />
        </Box>
      </Box>

      {/* ── Featured listings ── */}
      <Box component="section" className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_600px]">
        <Box className="container-wide">
          <FeaturedListings favoriteIds={favoriteIds} />
        </Box>
      </Box>

      {/* ── Latest listings ── */}
      <Box component="section" className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_500px]">
        <Box className="container-wide">
          <Group justify="space-between" align="center" wrap="nowrap" mb="xl">
            <Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}>{tl('latest')}</Title>
            <ViewAllLink href={`/${locale}/listings`} label={tl('view_all')} />
          </Group>
          <LatestListings favoriteIds={favoriteIds} />
        </Box>
      </Box>

      {/* ── Popular locations — section wrapper + heading live inside PopularLocations (J.2);
          component returns null when no featured locations, hiding the entire section. */}
      <PopularLocations />

      {/* ── How it works ── */}
      <Box component="section" className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_340px]">
        <Box className="container-wide">
          <HowItWorksSteps
            heading={t('how_it_works')}
            steps={[
              { title: t('step1_title'), desc: t('step1_desc') },
              { title: t('step2_title'), desc: t('step2_desc') },
              { title: t('step3_title'), desc: t('step3_desc') },
            ]}
          />
        </Box>
      </Box>

      {/* ── Agent CTA ── */}
      <Box component="section" className="py-12 md:py-16 2xl:py-20 bg-gradient-to-br from-primary/10 to-primary/5 [content-visibility:auto] [contain-intrinsic-size:auto_280px]">
        <Box className="container-wide">
          <Box maw={672} mx="auto" ta="center">
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
          </Box>
        </Box>
      </Box>

    </Stack>
  )
}
