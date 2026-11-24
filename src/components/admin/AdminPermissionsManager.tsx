'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { AdminPermissionsView } from '@/components/admin/AdminPermissionsView'
import { toast } from '@/lib/toast'
import {
  setModeratorPermission,
  type PermissionData,
  type PermissionEvent,
} from '@/modules/admin/actions/permissions'
import { PERMISSION_KEYS } from '@/lib/auth/permissionKeys'
import { ADMIN_PAGE_KEYS, type AccessKey } from '@/lib/auth/adminPages'

interface Props {
  permissions: Record<AccessKey, PermissionData>
  events: PermissionEvent[] | null
}

export function AdminPermissionsManager({ permissions: initial, events }: Props) {
  const t = useTranslations('admin.permissions')
  const [permissions, setPermissions] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState<AccessKey | null>(null)

  function handleToggle(key: AccessKey, value: boolean) {
    setSaving(key)
    startTransition(async () => {
      const result = await setModeratorPermission(key, value)
      if (result.noOp) {
        toast.info(t(value ? 'already_granted' : 'not_granted'))
      } else if (result.error === 'forbidden') {
        toast.error(t('error_forbidden'))
      } else if (result.error) {
        toast.error(t('error_transient'))
      } else {
        setPermissions(prev => ({
          ...prev,
          [key]: { ...prev[key], allowed: value },
        }))
        toast.success(t('save_success'))
      }
      setSaving(null)
    })
  }

  // the actions and the admin pages are counted separately (Task 1007)
  const allowedCount = PERMISSION_KEYS.filter(k => permissions[k].allowed).length
  const allowedPagesCount = ADMIN_PAGE_KEYS.filter(k => permissions[k].allowed).length

  return (
    <AdminPermissionsView
      permissions={permissions}
      events={events}
      allowedCount={allowedCount}
      allowedPagesCount={allowedPagesCount}
      savingKey={saving && pending ? saving : null}
      onToggle={handleToggle}
    />
  )
}
