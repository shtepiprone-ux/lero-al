import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'
import { FIXTURE_USERS, FIXTURE_VERIFIED_AGENTS } from '@/stories/fixtures/admin.fixtures'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { withAdminShell } from '@/stories/_StoryAdminShell'

/**
 * Task 896 — the Story moved here from `Admin/AdminUsersTable` (Task 483 / MM.1), which was canonical only through
 * the exact-title enrolment hatch the owner rejected for new use (2026-09-17). Viewport and locale come from the
 * Storybook toolbar; component-internal i18n is resolved by the `withLocale` global decorator.
 *
 * GR-3b/§7.3 (Task 857): every export renders inside the real `AdminShell` and the route's `AdminPageFrame`
 * (`width="shell" gutter="xl"`, `src/app/admin/users/page.tsx`), so the tables have their production card width;
 * GR-3d: the frame is the page gutter.
 */
const meta: Meta<typeof AdminUsersTable> = {
  title: 'Patterns/Mantine/AdminUsersTable',
  component: AdminUsersTable,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin/users' } },
    docs: {
      description: {
        component:
          'Admin users surface on Mantine. Cards <40em, table ≥40em. Verify/revoke, filters, pagination, 4-locale. Viewport and locale via toolbar.',
      },
    },
  },
  args: {
    users: FIXTURE_USERS,
    total: FIXTURE_USERS.length,
    page: 1,
    perPage: 25,
    activeRole: '',
    activeStatus: '',
    searchQuery: '',
    activeTab: 'all',
    verifiedAgents: FIXTURE_VERIFIED_AGENTS,
  },
}
export default meta
type Story = StoryObj<typeof AdminUsersTable>

const render: Story['render'] = (args) => (
  <AdminPageFrame width="shell" gutter="xl">
    <AdminUsersTable {...args} />
  </AdminPageFrame>
)

export const Default: Story = { render }

export const VerifiedTab: Story = { args: { activeTab: 'verified' }, render }

export const Empty: Story = { args: { users: [], total: 0 }, render }

export const LocationFilter: Story = { args: { locationRequestFilter: true }, render }
