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
import { MantineHomeSection } from '@/design-system/mantine/patterns'
import { SECTION_HEADING_FZ } from '@/design-system/mantine/typography'

export default async function HomePage() {
  const t = await getTranslations('home')
  const tl = await getTranslations('listing')
  const locale = await getLocale()

  const supabase = await createClient()
  const favoriteIds = await loadUserFavoriteListingIds(supabase)

  return (
    <Stack gap={0}>

      {/* ── Hero ── */}
      <Box component="section" bg="var(--hero-bg)" pos="relative" py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}>
        <Box className="container-wide">
          <Box maw={768} mx="auto" ta="center" mb={40}>
            <Title order={1} c="white" fw={700} lh={1.25} fz={{ base: 'var(--text-3xl)', sm: 'var(--text-4xl)', md: 'var(--text-5xl)' }} mb="md">
              {t('hero_title')}
            </Title>
            <Text c="white" fw={700} fz={{ base: 'var(--text-xl)', sm: 'var(--text-2xl)' }} maw={576} mx="auto">
              {t('hero_subtitle')}
            </Text>
          </Box>
          <HeroSearchClient />
        </Box>
      </Box>

      {/* ── Featured listings ── */}
      <MantineHomeSection variant="muted" containIntrinsicSize="auto 600px">
        <FeaturedListings favoriteIds={favoriteIds} />
      </MantineHomeSection>

      {/* ── Latest listings ── */}
      <MantineHomeSection containIntrinsicSize="auto 500px">
        <Group justify="space-between" align="center" wrap="nowrap" mb="xl">
          <Title order={2} fw={700} fz={SECTION_HEADING_FZ}>{tl('latest')}</Title>
          <ViewAllLink href={`/${locale}/listings`} label={tl('view_all')} />
        </Group>
        <LatestListings favoriteIds={favoriteIds} />
      </MantineHomeSection>

      {/* ── Popular locations — section wrapper + heading live inside PopularLocations (J.2);
          component returns null when no featured locations, hiding the entire section. */}
      <PopularLocations />

      {/* ── How it works ── */}
      <MantineHomeSection containIntrinsicSize="auto 340px">
        <HowItWorksSteps
          heading={t('how_it_works')}
          steps={[
            { title: t('step1_title'), desc: t('step1_desc') },
            { title: t('step2_title'), desc: t('step2_desc') },
            { title: t('step3_title'), desc: t('step3_desc') },
          ]}
        />
      </MantineHomeSection>

      {/* ── Agent CTA ── */}
      <MantineHomeSection variant="brandFade" containIntrinsicSize="auto 280px">
        <Box maw={672} mx="auto" ta="center">
          <Box ta="center" mb="md">
            <Building2 size={48} color="var(--mantine-color-brand-7)" />
          </Box>
          <Title order={2} fw={700} fz={SECTION_HEADING_FZ} mb="sm">
            {t('agent_cta_title')}
          </Title>
          <Text c="dimmed" mb="xl">{t('agent_cta_desc')}</Text>
          <AgentCtaButton
            href={`/${locale}/auth/register?type=agent`}
            label={t('agent_cta_button')}
          />
        </Box>
      </MantineHomeSection>

    </Stack>
  )
}
