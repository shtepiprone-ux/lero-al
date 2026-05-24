'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Shield, ShieldCheck, ShieldX } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { setModeratorPermission } from '@/modules/admin/actions/permissions'
import { PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissionKeys'

interface Props {
  permissions: Record<PermissionKey, boolean>
}

export function AdminPermissionsManager({ permissions: initial }: Props) {
  const t = useTranslations('admin.permissions')
  const [permissions, setPermissions] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState<PermissionKey | null>(null)

  function handleToggle(key: PermissionKey, value: boolean) {
    setSaving(key)
    startTransition(async () => {
      const result = await setModeratorPermission(key, value)
      if (result.error) {
        toast.error(t('save_error'))
      } else {
        setPermissions(prev => ({ ...prev, [key]: value }))
        toast.success(t('save_success'))
      }
      setSaving(null)
    })
  }

  const allowedCount = PERMISSION_KEYS.filter(k => permissions[k]).length

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <h1 className="text-xl font-semibold">{t('title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          {t('allowed_count', { count: allowedCount, total: PERMISSION_KEYS.length })}
        </Badge>
      </div>

      <div className="rounded-xl border divide-y overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] items-center px-4 py-2.5 bg-muted/40">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('column_permission')}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('column_allowed')}
          </span>
        </div>

        {PERMISSION_KEYS.map(key => {
          const allowed = permissions[key]
          const isSaving = saving === key && pending
          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_auto] items-center px-4 py-3.5 gap-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium leading-snug">
                  {t(`keys.${key.replace('.', '_')}`)}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{key}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {allowed ? (
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <ShieldX className="h-4 w-4 text-muted-foreground/50" />
                )}
                <Switch
                  checked={allowed}
                  onCheckedChange={v => handleToggle(key, v)}
                  disabled={isSaving}
                  aria-label={t(`keys.${key.replace('.', '_')}`)}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">{t('admin_note')}</p>
    </div>
  )
}
