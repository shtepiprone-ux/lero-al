import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminPropertyTypesManager } from './AdminPropertyTypesManager'
import { FIXTURE_PROPERTY_TYPES } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminPropertyTypesManager> = {
  title: 'Admin/AdminPropertyTypesManager',
  component: AdminPropertyTypesManager,
  tags: ['autodocs'],
  args: { initialTypes: FIXTURE_PROPERTY_TYPES, searchQuery: '' },
}
export default meta
type Story = StoryObj<typeof AdminPropertyTypesManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
