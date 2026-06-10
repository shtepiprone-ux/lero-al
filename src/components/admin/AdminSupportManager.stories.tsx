import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminSupportManager } from './AdminSupportManager'
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

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768', isRotated: false } },
}

export const EmptyState: Story = {
  args: { tickets: [], events: [] },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
