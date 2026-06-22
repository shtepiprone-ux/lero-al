import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminSupportManager, UserCard } from './AdminSupportManager'
import { FIXTURE_TICKETS, FIXTURE_TICKET_EVENTS } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminSupportManager> = {
  title: 'Admin/AdminSupportManager',
  component: AdminSupportManager,
  tags: ['autodocs'],
  args: { tickets: FIXTURE_TICKETS, events: FIXTURE_TICKET_EVENTS },
}
export default meta
type Story = StoryObj<typeof AdminSupportManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const EmptyState: Story = {
  args: { tickets: [], events: [] },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── Task 320 QA: UserCard status-badge namespace fix (Bucket 1) ────────────────
// Renders UserCard directly with each user_status value so the status badge's
// translated label (admin.users.user_status_active/blocked/inactive) is visible
// without needing the live user-search dialog (searchUsersForPicker requires DB).
const STATUS_USERS: Record<string, { id: string; name: string; last_name: string; phone: string | null; role: string; status: string; company_name: string | null }> = {
  active: { id: 'a1a1a1a1-0000-0000-0000-000000000001', name: 'Agim', last_name: 'Krasniqi', phone: '+355691234567', role: 'agent', status: 'active', company_name: null },
  blocked: { id: 'b2b2b2b2-0000-0000-0000-000000000002', name: 'Blerina', last_name: 'Hoxha', phone: null, role: 'user', status: 'blocked', company_name: null },
  inactive: { id: 'c3c3c3c3-0000-0000-0000-000000000003', name: 'Driton', last_name: 'Berisha', phone: '+355697654321', role: 'moderator', status: 'inactive', company_name: 'Berisha Real Estate' },
}

export const UserCardStatusBadges: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-2 max-w-sm">
      {Object.values(STATUS_USERS).map(user => (
        <UserCard key={user.id} user={user} onClear={() => {}} />
      ))}
    </div>
  ),
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

