import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminEmailTemplatesManager } from './AdminEmailTemplatesManager'
import { FIXTURE_EMAIL_TEMPLATES } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminEmailTemplatesManager> = {
  title: 'Admin/AdminEmailTemplatesManager',
  component: AdminEmailTemplatesManager,
  tags: ['autodocs'],
  args: { templates: FIXTURE_EMAIL_TEMPLATES, isAdmin: true },
}
export default meta
type Story = StoryObj<typeof AdminEmailTemplatesManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
