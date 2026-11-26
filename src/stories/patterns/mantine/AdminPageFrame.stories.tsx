import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { storyT } from '@/stories/_storyI18n'
import { withAdminShell } from '@/stories/_StoryAdminShell'

// Task 857 R23 — the page wrapper every `/admin/*` route renders inside `AdminShell`. Task 1007 (owner decision O1007-2, 2026-11-24: "All pages in the admin must have the
// canonical width ... The width must be the full screen"): there is ONE frame, with no `width`, `gutter` or `centered` prop. It caps nothing: the page takes the whole width the
// shell leaves, with the breakpoint gutter (24px, 32px from 1024px). GR-3b: the export renders inside the real `AdminShell`, so the 240px navbar is the production one.
// GR-3d: the frame IS the page gutter, so there is no `StoryPageGutter`. The content is `AdminPageHeader` alone (data props only, no wrapper with a style prop); texts are the real
// `admin.currency` messages. Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof AdminPageFrame> = {
  title: 'Patterns/Mantine/AdminPageFrame',
  component: AdminPageFrame,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/en/admin/currency' } },
    docs: {
      description: {
        component:
          'Page wrapper of every admin route (the listing preview aside): full width, gutter `xl` (24px), `2xl` (32px) from `lg` (1024px). It takes no prop.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminPageFrame>

/** Every admin page: the whole width of the shell, the breakpoint gutter. */
export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminPageFrame>
        <AdminPageHeader title={storyT(l, 'admin.currency.title')} subtitle={storyT(l, 'admin.currency.subtitle')} />
      </AdminPageFrame>
    )
  },
}
