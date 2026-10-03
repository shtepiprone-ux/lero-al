import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations } from 'next-intl'
import { ExternalLink, Eye, Star } from 'lucide-react'
import { useMantineTheme } from '@mantine/core'
import { MantineNavRowList } from '@/design-system/mantine/patterns/MantineNavRowList'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

// Task 857 R47 — canonical navigation rows of a dialog (docs §23.7). GR-3a: CREATE — no Story imports a navigation
// row list (searched `src/stories/**` for MantineNavRowList and list-of-links patterns: `MantineDashboardWorkList` is a
// dashboard card list). GR-3b: fluid, no width or viewport pin. GR-3d: no gutter of its own, so every export wraps in
// `StoryPageGutter`. The rows are the preview dialog's real navigation (`admin.listings` translations); the hrefs
// are labelled fixture. Locale and viewport come from the Storybook toolbar.
const meta: Meta<typeof MantineNavRowList> = {
  title: 'Patterns/Mantine/NavRowList',
  component: MantineNavRowList,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Navigation rows of a dialog (§23.7): full-width rows in one bordered list — icon tile, label, optional description and a trailing chevron (an arrow for an external link). Each row is at least 56px tall, has a hover tint and a visible focus ring, and sits on its own line (GR-3e).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MantineNavRowList>

function NavRowListDemo() {
  const t = useTranslations('admin.listings')
  const theme = useMantineTheme()
  const iconSize = theme.other.iconSize.standard
  return (
    <StoryPageGutter>
      <MantineNavRowList
        items={[
          { key: 'view', icon: <Eye size={iconSize} />, label: t('btn_view'), href: '/admin/listings/fixture/preview' },
          { key: 'public', icon: <ExternalLink size={iconSize} />, label: t('btn_open_public'), href: '/listings/fixture', external: true },
          { key: 'premium', icon: <Star size={iconSize} />, label: t('premium_manage'), description: t('premium_inactive'), onClick: () => {} },
        ]}
      />
    </StoryPageGutter>
  )
}

// A link row, an external-link row (opens in a new tab, arrow) and a button row with a description.
export const Default: Story = { render: () => <NavRowListDemo /> }
