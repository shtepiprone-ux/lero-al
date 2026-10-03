import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations } from 'next-intl'
import { Badge } from '@mantine/core'
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
          'Facts panel of a dialog (§23.7): a tinted panel, one row per fact, the label on the left (14px dimmed) and the value on the right (14px/500). A long value wraps under its own column and never overflows the panel.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MantineDetailList>

function DetailListDemo({ rows }: { rows: 1 | 4 }) {
  const t = useTranslations('admin.listings')
  const items = [
    { label: t('visibility_label'), value: <Badge variant="light" size="sm" color="green">{t('visibility_visible')}</Badge> },
    { label: t('col_agent'), value: t('premium_dialog_title') },
    { label: t('col_status'), value: t('premium_error_db_schema') },
    { label: t('premium_badge'), value: t('premium_inactive') },
  ]
  return (
    <StoryPageGutter>
      <MantineDetailList items={rows === 1 ? items.slice(3) : items} />
    </StoryPageGutter>
  )
}

// Four rows: a badge value, a short value, a long wrapping value, a state string.
export const Default: Story = { render: () => <DetailListDemo rows={4} /> }

// One row.
export const SingleRow: Story = { render: () => <DetailListDemo rows={1} /> }
