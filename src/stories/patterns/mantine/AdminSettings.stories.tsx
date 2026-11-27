import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminSettings } from '@/components/admin/AdminSettings'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { withAdminShell } from '@/stories/_StoryAdminShell'
import { FIXTURE_SETTINGS } from '@/stories/fixtures/admin.fixtures'

// Task 989 — the `/admin/settings` form on Mantine (GR-3a: the legacy `Admin/AdminSettings` Story was deleted). Four tabs in one swiping row: General (site name),
// Brand (logo and favicon addresses, the colour note), SEO (the title and description of each language, the OG image, the archive noindex days) and Localization
// (the default language and the language list). The Footer tab left: its fields are on the admin "Footer" page. Switch the tabs in the canvas; the save button calls
// the real action, which a Story cannot reach. `FIXTURE_SETTINGS` is labelled fixture data; viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof AdminSettings> = {
  title: 'Patterns/Mantine/AdminSettings',
  component: AdminSettings,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/en/admin/settings' } },
  },
  args: { initialSettings: FIXTURE_SETTINGS },
}
export default meta
type Story = StoryObj<typeof AdminSettings>

export const Default: Story = {
  render: (args) => (
    <AdminPageFrame>
      <AdminSettings {...args} />
    </AdminPageFrame>
  ),
}

/** every value empty: the form of a fresh project */
export const Empty: Story = {
  args: { initialSettings: Object.fromEntries(Object.keys(FIXTURE_SETTINGS).map((key) => [key, ''])) },
  render: (args) => (
    <AdminPageFrame>
      <AdminSettings {...args} />
    </AdminPageFrame>
  ),
}
