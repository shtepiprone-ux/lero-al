import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from '@mantine/core'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { storyT } from '@/stories/_storyI18n'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

// Task 877 — the shared admin page header, a thin adapter over the canonical `MantineDashboardHeader`
// (GR-3a: CREATE — `AdminPageHeader` had no Story; it was exempt from coverage). Title `h4`/24px from
// `sm` (20px below), `gray.5` subtitle, `action` in the header's `actions` slot, `mb="xl"` below.
// Texts are the real `admin.currency` messages. Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof AdminPageHeader> = {
  title: 'Patterns/Mantine/AdminPageHeader',
  component: AdminPageHeader,
  decorators: [(StoryFn) => <StoryPageGutter><StoryFn /></StoryPageGutter>],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Adapter over `MantineDashboardHeader`: same `title` / `subtitle` / `action` props as the legacy header, so every admin page changes with the pattern.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminPageHeader>

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminPageHeader
        title={storyT(l, 'admin.currency.title')}
        subtitle={storyT(l, 'admin.currency.subtitle')}
      />
    )
  },
}

export const WithAction: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminPageHeader
        title={storyT(l, 'admin.currency.title')}
        subtitle={storyT(l, 'admin.currency.subtitle')}
        action={<Button>{storyT(l, 'admin.currency.currencies.new')}</Button>}
      />
    )
  },
}
