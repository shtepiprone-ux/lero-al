import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminCurrenciesManager } from './AdminCurrenciesManager'
import { FIXTURE_CURRENCIES } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminCurrenciesManager> = {
  title: 'Admin/AdminCurrenciesManager',
  component: AdminCurrenciesManager,
  tags: ['autodocs'],
  args: { initialCurrencies: FIXTURE_CURRENCIES },
}
export default meta
type Story = StoryObj<typeof AdminCurrenciesManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
