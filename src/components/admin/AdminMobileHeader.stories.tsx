import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminMobileHeader } from './AdminMobileHeader'

const meta: Meta<typeof AdminMobileHeader> = {
  title: 'Admin/AdminMobileHeader',
  component: AdminMobileHeader,
  tags: ['autodocs'],
  args: { onOpen: () => {} },
}
export default meta
type Story = StoryObj<typeof AdminMobileHeader>

export const Default: Story = {
  globals: { viewport: { value: 'mobile390', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
