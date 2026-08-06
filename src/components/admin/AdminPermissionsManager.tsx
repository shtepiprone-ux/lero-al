'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { Shield, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import {
  setModeratorPermission,
  type PermissionData,
  type PermissionEvent,
} from '@/modules/admin/actions/permissions'
import { PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissionKeys'

interface Props {
  permissions: Record<PermissionKey, PermissionData>
  events: PermissionEvent[] | null
}

export function AdminPermissionsManager({ permissions: initial, events }: Props) {
  const t = useTranslations('admin.permissions')
  const format = useFormatter()
  const [permissions, setPermissions] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState<PermissionKey | null>(null)

  function handleToggle(key: PermissionKey, value: boolean) {
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

  const allowedCount = PERMISSION_KEYS.filter(k => permissions[k].allowed).length

  return (
    <div data-testid="admin-permissions-manager" className="flex flex-col gap-6 p-6 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <h1 className="text-xl font-semibold">{t('title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
          {t('allowed_count', { count: allowedCount, total: PERMISSION_KEYS.length })}
        </Badge>
      </div>

      {/* Admin section — display only, not in DB */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('admin_section_title')}
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <ShieldCheck className="h-4 w-4 text-status-success shrink-0" />
          <span className="text-sm text-muted-foreground">{t('admin_full_access')}</span>
        </div>
      </div>

      {/* Moderator permission matrix */}
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
          const { allowed, updated_at, updated_by_name } = permissions[key]
          const isSaving = saving === key && pending
          const keySlug = key.replace('.', '_')
          return (
            <div
              key={key}
              data-testid={`perm-row-${keySlug}`}
              className="grid grid-cols-[1fr_auto] items-center px-4 py-3.5 gap-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium leading-snug">
                  {t(`keys.${keySlug}`)}
                </span>
                <span className="text-xs text-muted-foreground leading-snug">
                  {t(`descriptions.${keySlug}`)}
                </span>
                <span className="text-xs text-muted-foreground/60 font-mono mt-0.5">{key}</span>
                {updated_at && (
                  <span className="text-xs text-muted-foreground/50 mt-0.5">
                    {t('column_last_updated')}:{' '}
                    {format.dateTime(new Date(updated_at), { dateStyle: 'medium' })}
                    {updated_by_name && (
                      <>
                        {' '}
                        {t('audit_by')} {updated_by_name}
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {allowed ? (
                  <ShieldCheck className="h-4 w-4 text-status-success" />
                ) : (
                  <ShieldX className="h-4 w-4 text-muted-foreground/50" />
                )}
                <Switch
                  checked={allowed}
                  onCheckedChange={v => handleToggle(key, v)}
                  disabled={isSaving}
                  aria-label={t(`keys.${keySlug}`)}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Audit events section */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('audit_title')}
          </span>
        </div>

        {events === null ? (
          <div className="flex items-center gap-2 px-4 py-3.5 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-status-warning shrink-0" />
            {t('audit_unavailable')}
          </div>
        ) : events.length === 0 ? (
          <div className="px-4 py-3.5 text-sm text-muted-foreground">{t('audit_empty')}</div>
        ) : (
          <div className="divide-y">
            {events.map(ev => {
              const keySlug = ev.permission_key.replace('.', '_')
              return (
                <div key={ev.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <div className="mt-0.5 shrink-0">
                    {ev.new_allowed ? (
                      <ShieldCheck className="h-4 w-4 text-status-success" />
                    ) : (
                      <ShieldX className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium">
                      {t(`keys.${keySlug}`)}{' '}
                      <span
                        className={
                          ev.new_allowed ? 'text-status-success' : 'text-muted-foreground'
                        }
                      >
                        {t(ev.new_allowed ? 'audit_grant' : 'audit_revoke')}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('audit_by')}{' '}
                      {ev.actor_name ?? t('audit_unknown_actor')}{' '}
                      ·{' '}
                      {format.dateTime(new Date(ev.created_at), {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{t('admin_note')}</p>
    </div>
  )
}
