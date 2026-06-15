import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminUserProfile } from './AdminUserProfile'
import {
  FIXTURE_PROFILE_USER,
  FIXTURE_CITIES,
  FIXTURE_REGIONS,
  FIXTURE_CHANGE_LOG,
  FIXTURE_STATUS_HISTORY,
} from '@/stories/fixtures/admin.fixtures'

const meta: Meta = {
  title: 'Admin/AdminUserProfile',
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj

const sharedArgs = {
  user: FIXTURE_PROFILE_USER,
  email: 'arben@example.com',
  emailConfirmedAt: '2026-01-15T09:00:00Z',
  cities: FIXTURE_CITIES,
  regions: FIXTURE_REGIONS,
  changeLog: FIXTURE_CHANGE_LOG,
  statusHistory: FIXTURE_STATUS_HISTORY,
  isAdmin: true,
  canClearHistory: true,
}

export const Default: Story = {
  render: () => <AdminUserProfile {...sharedArgs} />,
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const Tablet: Story = {
  render: () => <AdminUserProfile {...sharedArgs} />,
  globals: { viewport: { value: 'tablet768', isRotated: false } },
}

export const CreateMode: Story = {
  render: () => (
    <AdminUserProfile
      user={null}
      email=""
      emailConfirmedAt={null}
      cities={FIXTURE_CITIES}
      regions={FIXTURE_REGIONS}
      changeLog={[]}
      statusHistory={[]}
      isAdmin={true}
      canClearHistory={true}
    />
  ),
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  render: () => <AdminUserProfile {...sharedArgs} />,
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
