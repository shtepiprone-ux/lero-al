import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { FIXTURE_USERS } from '@/stories/fixtures/admin.fixtures'
import { withAdminShell } from '@/stories/_StoryAdminShell'

/**
 * The route's real container (`AdminUsersTable`, Task 859 R52): it reads the URL (`useRouter`, `usePathname`, `useSearchParams`, mocked by the Next.js framework of
 * Storybook), owns the search debounce and the `toggleUserVerified` server action, and renders `AdminUsersTableView`. The view's own Story (`Patterns/Mantine/AdminUsersTable`)
 * holds the interactions with a harness; this Story proves that the container wires the view: the rows reach the screen, the filters show the URL's values, and the search
 * field holds what the URL says. It never presses verify or revoke, because that reaches the server action.
 */
const meta: Meta<typeof AdminUsersTable> = {
  title: 'Patterns/Mantine/AdminUsersTableContainer',
  component: AdminUsersTable,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin/users', query: { q: 'Marco' } } },
    docs: { description: { component: 'The route container of the admin users table. It owns the URL, the search debounce and the verify server action; the markup is `AdminUsersTableView`.' } },
  },
}
export default meta
type Story = StoryObj<typeof AdminUsersTable>

export const Default: Story = {
  render: () => (
    <AdminPageFrame width="shell">
      <AdminUsersTable users={FIXTURE_USERS} total={FIXTURE_USERS.length} page={1} perPage={25} activeRole="" activeStatus="" searchQuery="Marco" activeTab="all" verifiedAgents={[]} />
    </AdminPageFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect((await canvas.findAllByTestId('verify-btn')).length).toBeGreaterThan(0)
    await expect(canvas.getByTestId('users-search')).toHaveValue('Marco')
  },
}
