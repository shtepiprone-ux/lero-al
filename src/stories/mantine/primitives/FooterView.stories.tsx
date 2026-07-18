import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { FooterView } from '@/components/layout/FooterView'
import { MantineStoryShell } from '../_MantineStoryShell'
import type { FooterLink } from '@/types/database'

/**
 * Title under `Mantine/Primitives/` (Task 623, same rationale as `HeaderView`): the
 * rendered-assert harness (`scripts/check-stories-rendered.mjs`) only gives PERMANENT,
 * standing enforcement under `--mantine-only` to stories whose title matches this exact
 * prefix. `FooterView` markup is still Tailwind (Phase 1 — mechanism moves to Mantine in
 * Phase 2), so this title is a gate-enrolment choice, not a taxonomy claim.
 *
 * Split-gate proof (docs/component-rules.md → "Container / Presentational Primitive
 * Split"): both fixtures below are PLAIN props — no `getSetting`/`getFooterContent` mock,
 * no `.storybook` module alias, no live Supabase. `FooterView` calls NO i18n hook at all
 * (Task 623 A1) — every string, including the internal nav-fallback labels, arrives
 * pre-resolved via props.
 *
 * Two fixtures per R4: `DB content` (all three link groups populated, social link
 * external) and `Fallback` (all three empty upstream → the container's hardcoded fallback
 * sets — nav renders through `FooterView`'s own internal `hasNavLinks=false` branch;
 * info/social render through the same fallback `FooterLink[]` the container would build).
 * The fallback fixture reuses the real `nav.*` message keys (the same keys the container's
 * fallback branch resolves via `getTranslations('nav')`), so it demonstrates the ACTUAL
 * production fallback copy, not a synthetic stand-in.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/FooterView',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
    const tNav = (key: string) => storyT(locale, `nav.${key}`)
    const year = new Date().getFullYear()
    const copyright = `© ${year} Lero.al — ${tNav('all_rights')}`

    const dbNavLinks: FooterLink[] = [
      { id: 'db-nav-1', label: t('footer_db_nav_link_1'), url: '/listings', enabled: true, order: 0 },
      { id: 'db-nav-2', label: t('footer_db_nav_link_2'), url: '/listings/create', enabled: true, order: 1 },
    ]
    const dbInfoLinks: FooterLink[] = [
      { id: 'db-info-1', label: t('footer_db_info_link_1'), url: '/about', enabled: true, order: 0 },
      { id: 'db-info-2', label: t('footer_db_info_link_2'), url: '/contact', enabled: true, order: 1 },
    ]
    const dbSocialLinks: FooterLink[] = [
      { id: 'db-social-1', label: t('footer_db_social_link_1'), url: 'https://facebook.com/lero.al', enabled: true, order: 0 },
    ]

    const fallbackInfoLinks: FooterLink[] = [
      { id: 'fallback-about', label: tNav('about'), url: '/about', enabled: true, order: 0 },
      { id: 'fallback-contact', label: tNav('contacts'), url: '/contact', enabled: true, order: 1 },
      { id: 'fallback-privacy', label: tNav('privacy'), url: '/privacy-policy', enabled: true, order: 2 },
      { id: 'fallback-terms', label: tNav('terms'), url: '/terms-of-service', enabled: true, order: 3 },
    ]
    const fallbackSocialLinks: FooterLink[] = [
      { id: 'fallback-facebook', label: 'Facebook', url: 'https://facebook.com', enabled: true, order: 0 },
      { id: 'fallback-instagram', label: 'Instagram', url: 'https://instagram.com', enabled: true, order: 1 },
    ]

    const navFallbackLabels = { home: tNav('home'), listings: tNav('listings'), addListing: tNav('add_listing') }

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('footer_view_caption_db')}
            </Text>
            <FooterView
              brand="Lero"
              tld=".al"
              tagline={t('footer_db_tagline')}
              navTitle={t('footer_db_nav_title')}
              infoTitle={t('footer_db_info_title')}
              socialTitle={t('footer_db_social_title')}
              hasNavLinks
              navLinks={dbNavLinks}
              navFallbackLabels={navFallbackLabels}
              infoLinks={dbInfoLinks}
              socialLinks={dbSocialLinks}
              copyright={copyright}
              locale={locale}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('footer_view_caption_fallback')}
            </Text>
            <FooterView
              brand="Lero"
              tld=".al"
              tagline={tNav('tagline')}
              navTitle={tNav('navigation')}
              infoTitle={tNav('information')}
              socialTitle={tNav('follow_us')}
              hasNavLinks={false}
              navLinks={[]}
              navFallbackLabels={navFallbackLabels}
              infoLinks={fallbackInfoLinks}
              socialLinks={fallbackSocialLinks}
              copyright={copyright}
              locale={locale}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
