import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminListingsTable } from './AdminListingsTable'
import { FIXTURE_LISTINGS } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminListingsTable> = {
  title: 'Admin/AdminListingsTable',
  component: AdminListingsTable,
  tags: ['autodocs'],
  args: {
    listings: FIXTURE_LISTINGS,
    total: FIXTURE_LISTINGS.length,
    page: 1,
    perPage: 25,
    activeStatus: '',
    searchQuery: '',
    activeTab: 'all',
  },
}
export default meta
type Story = StoryObj<typeof AdminListingsTable>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const FilteredPending: Story = {
  args: {
    listings: FIXTURE_LISTINGS.filter(l => l.status === 'pending'),
    total: 1,
    activeStatus: 'pending',
  },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
