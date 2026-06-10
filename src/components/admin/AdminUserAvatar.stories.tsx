import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminUserAvatar } from './AdminUserAvatar'

const meta: Meta<typeof AdminUserAvatar> = {
  title: 'Admin/AdminUserAvatar',
  component: AdminUserAvatar,
  tags: ['autodocs'],
  args: {
    userId: 'usr-001',
    avatarUrl: null,
    mode: 'view',
    onAvatarChange: () => {},
    onBlobReady: () => {},
    showRemove: false,
  },
}
export default meta
type Story = StoryObj<typeof AdminUserAvatar>

export const ViewPlaceholder: Story = {
  args: { mode: 'view', avatarUrl: null },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const EditMode: Story = {
  args: { mode: 'edit', avatarUrl: null, showRemove: true },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const CreateMode: Story = {
  args: { mode: 'create', userId: null, avatarUrl: null },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  args: { mode: 'edit', avatarUrl: null, showRemove: true },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
