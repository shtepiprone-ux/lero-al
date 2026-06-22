import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminCompaniesManager } from './AdminCompaniesManager'
import { FIXTURE_COMPANIES } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminCompaniesManager> = {
  title: 'Admin/AdminCompaniesManager',
  component: AdminCompaniesManager,
  tags: ['autodocs'],
  args: { companies: FIXTURE_COMPANIES },
}
export default meta
type Story = StoryObj<typeof AdminCompaniesManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
