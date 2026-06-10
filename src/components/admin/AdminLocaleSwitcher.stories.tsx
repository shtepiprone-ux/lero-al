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

export const MobileBottomSheet: Story = {
  parameters: {
    docs: { description: { story: '@320: language menu opens as a full-width bottom sheet — edge-to-edge, drag handle, items >=44px. Use locale toolbar.' } }
  },
  render: () => (
    <div className="p-4 max-w-xs">
      <AdminLocaleSwitcher defaultOpen />
    </div>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
