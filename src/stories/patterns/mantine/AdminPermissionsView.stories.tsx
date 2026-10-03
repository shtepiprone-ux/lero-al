import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminPermissionsView } from '@/components/admin/AdminPermissionsView'
import { PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissionKeys'
import type { PermissionData, PermissionEvent } from '@/modules/admin/actions/permissions'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { withAdminShell } from '@/stories/_StoryAdminShell'

/**
 * Task 892 — the Story moved here from `Admin/AdminPermissionsManager` (legacy component, pinned viewport). It renders
 * the real `AdminPermissionsView`; the container `AdminPermissionsManager` owns only state, the server action and toasts
 * and is proven by this Story (GR-1 container exemption). Viewport and locale come from the Storybook toolbar.
 *
 * GR-3b (Task 857): every export renders inside the real `AdminShell` and the route's `AdminPageFrame`
 * (`width="panel" gutter="xl" centered={false}`, `src/app/admin/permissions/page.tsx`); GR-3d: the frame is the
 * page gutter.
 */
const NONE_ALLOWED = Object.fromEntries(
  PERMISSION_KEYS.map(k => [k, { allowed: false, updated_at: null, updated_by_name: null }]),
) as Record<PermissionKey, PermissionData>

const ALL_ALLOWED = Object.fromEntries(
  PERMISSION_KEYS.map(k => [k, { allowed: true, updated_at: '2026-06-18T10:00:00Z', updated_by_name: 'Admin User' }]),
) as Record<PermissionKey, PermissionData>

const FIXTURE_PERMISSIONS: Record<PermissionKey, PermissionData> = {
  ...NONE_ALLOWED,
  'reports.manage': { allowed: true, updated_at: '2026-06-18T10:00:00Z', updated_by_name: 'Admin User' },
  'listings.delete': { allowed: true, updated_at: '2026-06-17T08:00:00Z', updated_by_name: 'Admin User' },
}

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

const meta: Meta<typeof AdminPermissionsView> = {
  title: 'Patterns/Mantine/AdminPermissionsView',
  component: AdminPermissionsView,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin/permissions' } },
    docs: {
      description: {
        component:
          'Admin moderator-permissions body on Mantine: count badge, administrator note, permission matrix with switches, audit log. Viewport and locale via toolbar.',
      },
    },
  },
  args: {
    permissions: FIXTURE_PERMISSIONS,
    events: FIXTURE_EVENTS,
    allowedCount: 2,
    savingKey: null,
    onToggle: () => {},
  },
}
export default meta
type Story = StoryObj<typeof AdminPermissionsView>

const render: Story['render'] = (args) => (
  <AdminPageFrame width="panel" gutter="xl" centered={false}>
    <AdminPermissionsView {...args} />
  </AdminPageFrame>
)

export const Default: Story = { render }

export const AllAllowed: Story = {
  args: { permissions: ALL_ALLOWED, allowedCount: PERMISSION_KEYS.length },
  render,
}

export const Saving: Story = { args: { savingKey: 'reports.manage' }, render }

export const AuditEmpty: Story = { args: { events: [] }, render }

export const AuditUnavailable: Story = { args: { events: null }, render }
