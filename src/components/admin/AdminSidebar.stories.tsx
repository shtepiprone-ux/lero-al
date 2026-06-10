import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminSidebar } from './AdminSidebar'

const meta: Meta<typeof AdminSidebar> = {
  title: 'Admin/AdminSidebar',
  component: AdminSidebar,
  tags: ['autodocs'],
  args: {
    siteName: 'Lero.al',
    mobileOpen: false,
    onMobileOpenChange: () => {},
  },
}
export default meta
type Story = StoryObj<typeof AdminSidebar>

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const MobileDrawerOpen: Story = {
  args: { mobileOpen: true },
  globals: { viewport: { value: 'mobile390', isRotated: false } },
}

export const LocaleStress: Story = {
  args: { mobileOpen: true },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
