import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminUsersTable } from './AdminUsersTable'
import { FIXTURE_USERS, FIXTURE_VERIFIED_AGENTS } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminUsersTable> = {
  title: 'Admin/AdminUsersTable',
  component: AdminUsersTable,
  tags: ['autodocs'],
  args: {
    users: FIXTURE_USERS,
    total: FIXTURE_USERS.length,
    page: 1,
    perPage: 25,
    activeRole: 'all',
    activeStatus: '',
    searchQuery: '',
    activeTab: 'all',
    verifiedAgents: FIXTURE_VERIFIED_AGENTS,
  },
}
export default meta
type Story = StoryObj<typeof AdminUsersTable>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const VerifiedTab: Story = {
  args: { activeTab: 'verified', users: [FIXTURE_USERS[0]], total: 1 },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocationRequests: Story = {
  args: { locationRequestFilter: true, users: [FIXTURE_USERS[1]], total: 1 },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
