import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminPermissionsManager } from './AdminPermissionsManager'
import { PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissionKeys'
import type { PermissionData, PermissionEvent } from '@/modules/admin/actions/permissions'

const FIXTURE_PERMISSIONS: Record<PermissionKey, PermissionData> = Object.fromEntries(
  PERMISSION_KEYS.map(k => [k, { allowed: false, updated_at: null, updated_by_name: null }]),
) as Record<PermissionKey, PermissionData>

FIXTURE_PERMISSIONS['reports.manage'] = { allowed: true, updated_at: '2026-06-18T10:00:00Z', updated_by_name: 'Admin User' }
FIXTURE_PERMISSIONS['listings.delete'] = { allowed: true, updated_at: '2026-06-17T08:00:00Z', updated_by_name: 'Admin User' }

const FIXTURE_EVENTS: PermissionEvent[] = [
  {
    id: 'ev-1',
    role: 'moderator',
    permission_key: 'reports.manage',
    old_allowed: false,
    new_allowed: true,
    actor_user_id: 'admin-1',
    actor_name: 'Admin User',
    created_at: '2026-06-18T10:00:00Z',
  },
]

const meta: Meta<typeof AdminPermissionsManager> = {
  title: 'Admin/AdminPermissionsManager',
  component: AdminPermissionsManager,
  tags: ['autodocs'],
  args: { permissions: FIXTURE_PERMISSIONS, events: FIXTURE_EVENTS },
}
export default meta
type Story = StoryObj<typeof AdminPermissionsManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

