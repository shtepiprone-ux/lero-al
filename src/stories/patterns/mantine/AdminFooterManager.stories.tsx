import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminFooterManager } from '@/components/admin/AdminFooterManager'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { withAdminShell } from '@/stories/_StoryAdminShell'
import { FIXTURE_FOOTER_ROWS, FIXTURE_FOOTER_SHARED } from '@/stories/fixtures/admin.fixtures'

// Task 989 — the `/admin/footer` editor on Mantine, the one place for everything the footer shows (O989-3). Above the language tabs the shared block: the phone,
// the support and sales e-mails, each with its show switch on the label row, the footer-text switch and the social list for all languages (each link with its
// switch). Below, one tab per language: brand title, footer text, copyright, section titles, navigation and information links (an unknown internal link shows its
// error under the address). The save buttons call the real actions, which a Story cannot reach. Fixtures are labelled data; viewport and locale come from the toolbar.
const meta: Meta<typeof AdminFooterManager> = {
  title: 'Patterns/Mantine/AdminFooterManager',
  component: AdminFooterManager,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/en/admin/footer' } },
  },
  args: { initialData: FIXTURE_FOOTER_ROWS, initialShared: FIXTURE_FOOTER_SHARED, initialized: true },
}
export default meta
type Story = StoryObj<typeof AdminFooterManager>

const render: Story['render'] = (args) => (
  <AdminPageFrame>
    <AdminFooterManager {...args} />
  </AdminPageFrame>
)

/** the phone on, the support e-mail off, the sales e-mail empty; Facebook on, Instagram off */
export const Default: Story = { render }

/** nothing saved yet: empty contacts (every switch on) and no links */
export const Empty: Story = {
  args: { initialData: { sq: null, en: null, uk: null, it: null }, initialShared: {} },
  render,
}

/** the footer table is missing */
export const NotInitialized: Story = {
  args: { initialData: {}, initialShared: {}, initialized: false },
  render,
}

/** the viewer is not an administrator */
export const Forbidden: Story = {
  args: { initialData: {}, initialShared: {}, initialized: false, serverError: 'forbidden' },
  render,
}
