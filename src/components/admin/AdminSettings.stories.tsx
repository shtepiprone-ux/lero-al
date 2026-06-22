import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminSettings } from './AdminSettings'
import { FIXTURE_SETTINGS } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminSettings> = {
  title: 'Admin/AdminSettings',
  component: AdminSettings,
  tags: ['autodocs'],
  args: { initialSettings: FIXTURE_SETTINGS },
}
export default meta
type Story = StoryObj<typeof AdminSettings>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
