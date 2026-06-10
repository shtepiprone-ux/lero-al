import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminLocaleSwitcher } from './AdminLocaleSwitcher'

const meta: Meta<typeof AdminLocaleSwitcher> = {
  title: 'Admin/AdminLocaleSwitcher',
  component: AdminLocaleSwitcher,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof AdminLocaleSwitcher>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
