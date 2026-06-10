import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminExchangeProvidersManager } from './AdminExchangeProvidersManager'
import { FIXTURE_PROVIDERS } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminExchangeProvidersManager> = {
  title: 'Admin/AdminExchangeProvidersManager',
  component: AdminExchangeProvidersManager,
  tags: ['autodocs'],
  args: { initialProviders: FIXTURE_PROVIDERS },
}
export default meta
type Story = StoryObj<typeof AdminExchangeProvidersManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
