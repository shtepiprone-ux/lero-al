import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { BADGE_STATUS_REGISTRY, type BadgeStatusEntity } from '@/design-system/mantine/badgeTones'
import { MantineBadge, type MantineBadgeProps } from '@/design-system/mantine/patterns/MantineBadge'
import { MantineStoryShell, MantineStorySection, MantineStoryStack } from '../_MantineStoryShell'

// Task 859 Revision 7 (R49/R50, owner decision D78-26): the canonical badge is `MantineBadge`, the one component that
// renders a Mantine `Badge`. Its meaning (entity + value, or a semantic tone) lives in `badgeTones.ts`; its one look is
// the `Badge` theme entry (pill, solid fill at the colour's index-7 stop, white text, 12px/500), the same as the
// `ListingCard` Story and on every other surface. `Default` shows the tones, the sizes and the counts (a badge is text only, D78-29);
// `Statuses` shows every registry entity x every value with its label. Every caption is a locale key, and the
// captioned sections come from the Story-chrome owner (`MantineStorySection`), so this Story writes no presentation
// (Task 859 Revision 8, R56).
const meta: Meta = {
  title: 'Mantine/Primitives/Badge',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <MantineStoryStack>
          {/* Semantic tones (the `tone` variant) */}
          <MantineStorySection label={t('admin_table_col_status')}>
            <MantineBadge variant="tone" tone="success">{t('admin_status_active')}</MantineBadge>
            <MantineBadge variant="tone" tone="warning">{t('admin_status_pending')}</MantineBadge>
            <MantineBadge variant="tone" tone="danger">{t('badge_blocked')}</MantineBadge>
            <MantineBadge variant="tone" tone="neutral">{t('admin_status_archived')}</MantineBadge>
            <MantineBadge variant="tone" tone="brand">{t('badge_brand')}</MantineBadge>
            <MantineBadge variant="tone" tone="info">{t('badge_info')}</MantineBadge>
            <MantineBadge variant="tone" tone="purple">{t('badge_purple')}</MantineBadge>
            <MantineBadge variant="tone" tone="sale">{t('badge_sale')}</MantineBadge>
          </MantineStorySection>

          {/* Size comparison: xs / sm (theme default) / lg */}
          <MantineStorySection label={t('badge_caption_sizes')}>
            <MantineBadge variant="tone" tone="success" size="xs">{t('admin_status_active')}</MantineBadge>
            <MantineBadge variant="tone" tone="success" size="sm">{t('admin_status_active')}</MantineBadge>
            <MantineBadge variant="tone" tone="success" size="lg">{t('admin_status_active')}</MantineBadge>
          </MantineStorySection>

          {/* Negative flow: long uk label ("Заблокований") — no clip at 320px */}
          <MantineStorySection label={t('badge_caption_long_label')}>
            <MantineBadge variant="tone" tone="danger">{t('badge_blocked')}</MantineBadge>
            <MantineBadge variant="tone" tone="warning">{t('admin_status_pending')}</MantineBadge>
            <MantineBadge variant="tone" tone="neutral">{t('admin_status_archived')}</MantineBadge>
          </MantineStorySection>

          {/* The `count` variant: a number, optionally round (Mantine's native counter), on its host's emphasis. */}
          <MantineStorySection label={t('badge_caption_counts')}>
            <MantineBadge variant="count">3</MantineBadge>
            <MantineBadge variant="count" circle>3</MantineBadge>
            <MantineBadge variant="count" emphasis="neutral">3</MantineBadge>
            <MantineBadge variant="count" emphasis="neutral" circle>3</MantineBadge>
          </MantineStorySection>

          {/* count emphasis="onBrand" sits inside a filled brand Button (MantineCountButton). */}
          <MantineStorySection label={t('badge_caption_counts_on_brand')}>
            <Button rightSection={<MantineBadge variant="count" emphasis="onBrand" circle>3</MantineBadge>}>
              {t('badge_brand')}
            </Button>
          </MantineStorySection>
        </MantineStoryStack>
      </MantineStoryShell>
    )
  },
}

// Every status entity of the registry x every value, with its translated label (`labelKey` is a root message key).
export const Statuses: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <MantineStoryStack>
          {(Object.keys(BADGE_STATUS_REGISTRY) as BadgeStatusEntity[]).map(entity => (
            <MantineStorySection key={entity} label={storyT(locale, `storybook.mantine.badge_entity_${entity}`)}>
              {Object.entries(BADGE_STATUS_REGISTRY[entity]).map(([value, entry]) => (
                <MantineBadge
                  key={value}
                  {...({ variant: 'status', entity, value } as MantineBadgeProps)}
                  data-testid={`badge-${entity}-${value}`}
                >
                  {storyT(locale, entry.labelKey)}
                </MantineBadge>
              ))}
            </MantineStorySection>
          ))}
        </MantineStoryStack>
      </MantineStoryShell>
    )
  },
}
