import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations } from 'next-intl'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

// Task 857 R46 — canonical facts panel of a dialog (docs §23.7). GR-3a: CREATE — no Story imports a detail list
// (searched `src/stories/**` for MantineDetailList / label-value rows: `MantineDataTableToCards` meta rows live inside
// a table card and have no panel). GR-3b: fluid, no width or viewport pin. GR-3d: no gutter of its own, so every
// export wraps in `StoryPageGutter`. Labels and values are the existing `admin.listings` translations (labelled
// fixture); the long value is a real long translation, so the wrap is proved at 320 in the Cyrillic locale. Locale and
// viewport come from the Storybook toolbar.
const meta: Meta<typeof MantineDetailList> = {
  title: 'Patterns/Mantine/DetailList',
  component: MantineDetailList,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Labelled fields (Task 859 R78, GR-3j): each field is its label (12px gray-500) with its complete value below it (14px/500) at every width. `panel` (default) is the tinted facts panel of a dialog (§23.7); `plain` is the same fields inside a record card. A long value wraps and the field grows.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MantineDetailList>

function DetailListDemo({ rows, variant }: { rows: 1 | 4; variant?: 'panel' | 'plain' }) {
  const t = useTranslations('admin.listings')
  const items = [
    { label: t('visibility_label'), value: <MantineBadge variant="status" entity="listingVisibility" value="visible">{t('visibility_visible')}</MantineBadge> },
    { label: t('col_agent'), value: t('premium_dialog_title') },
    { label: t('col_status'), value: t('premium_error_db_schema') },
    { label: t('premium_badge'), value: t('premium_inactive') },
  ]
  return (
    <StoryPageGutter>
      <MantineDetailList items={rows === 1 ? items.slice(3) : items} variant={variant} />
    </StoryPageGutter>
  )
}

// Four rows: a badge value, a short value, a long wrapping value, a state string.
export const Default: Story = { render: () => <DetailListDemo rows={4} /> }

// One row.
export const SingleRow: Story = { render: () => <DetailListDemo rows={1} /> }

// `variant="plain"` (Task 859 R78): the same items without the panel, as inside a record card.
export const Plain: Story = { render: () => <DetailListDemo rows={4} variant="plain" /> }
