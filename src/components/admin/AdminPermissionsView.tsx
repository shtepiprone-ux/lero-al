'use client'

import { Fragment } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { Alert, Badge, Box, Divider, Group, Stack, Switch, Text, useMantineTheme } from '@mantine/core'
import { ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react'
import { MantineFormSection } from '@/design-system/mantine/patterns'
import { PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissionKeys'
import type { PermissionData, PermissionEvent } from '@/modules/admin/actions/permissions'

export interface AdminPermissionsViewProps {
  permissions: Record<PermissionKey, PermissionData>
  /** `null` = the audit read failed (shows the "unavailable" alert). */
  events: PermissionEvent[] | null
  allowedCount: number
  /** The key whose save is in flight; its switch is disabled. */
  savingKey: PermissionKey | null
  onToggle: (key: PermissionKey, value: boolean) => void
}

/**
 * Presentational `/admin/permissions` body (Task 892): count badge, the administrator note, the moderator
 * permission matrix with live switches, the audit log and the footer note, each section on the canonical
 * `MantineFormSection` card. State, the server action and toasts live in `AdminPermissionsManager`.
 */
export function AdminPermissionsView({
  permissions,
  events,
  allowedCount,
  savingKey,
  onToggle,
}: AdminPermissionsViewProps) {
  const t = useTranslations('admin.permissions')
  const format = useFormatter()
  const { iconSize } = useMantineTheme().other

  return (
    <Stack gap="xl" data-testid="admin-permissions-manager">
      <Group>
        <Badge
          variant="outline"
          color="gray"
          leftSection={
            <Box c="green" display="flex">
              <ShieldCheck size={iconSize.badge} />
            </Box>
          }
        >
          {t('allowed_count', { count: allowedCount, total: PERMISSION_KEYS.length })}
        </Badge>
      </Group>

      <MantineFormSection title={t('admin_section_title')}>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <Box c="green" display="flex">
            <ShieldCheck size={iconSize.standard} />
          </Box>
          <Text size="sm" c="dimmed">
            {t('admin_full_access')}
          </Text>
        </Group>
      </MantineFormSection>

      <MantineFormSection
        title={t('column_permission')}
        headerAction={
          <Text size="xs" c="dimmed" fw={600}>
            {t('column_allowed')}
          </Text>
        }
      >
        <Stack gap="md">
          {PERMISSION_KEYS.map((key, index) => {
            const { allowed, updated_at, updated_by_name } = permissions[key]
            const keySlug = key.replace('.', '_')
            return (
              <Fragment key={key}>
                {index > 0 && <Divider />}
                <Group
                  justify="space-between"
                  wrap="nowrap"
                  align="flex-start"
                  data-testid={`perm-row-${keySlug}`}
                >
                  <Stack gap={0} miw={0}>
                    <Text size="sm" fw={500}>
                      {t(`keys.${keySlug}`)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t(`descriptions.${keySlug}`)}
                    </Text>
                    <Text size="xs" c="dimmed" ff="monospace">
                      {key}
                    </Text>
                    {updated_at && (
                      <Text size="xs" c="dimmed">
                        {t('column_last_updated')}:{' '}
                        {format.dateTime(new Date(updated_at), { dateStyle: 'medium' })}
                        {updated_by_name && (
                          <>
                            {' '}
                            {t('audit_by')} {updated_by_name}
                          </>
                        )}
                      </Text>
                    )}
                  </Stack>
                  <Group gap="xs" wrap="nowrap">
                    <Box c={allowed ? 'green' : 'dimmed'} display="flex">
                      {allowed ? (
                        <ShieldCheck size={iconSize.standard} />
                      ) : (
                        <ShieldX size={iconSize.standard} />
                      )}
                    </Box>
                    <Switch
                      checked={allowed}
                      onChange={e => onToggle(key, e.currentTarget.checked)}
                      disabled={savingKey === key}
                      aria-label={t(`keys.${keySlug}`)}
                    />
                  </Group>
                </Group>
              </Fragment>
            )
          })}
        </Stack>
      </MantineFormSection>

      <MantineFormSection title={t('audit_title')}>
        {events === null ? (
          <Alert
            color="yellow"
            variant="light"
            icon={<AlertTriangle size={iconSize.standard} />}
          >
            {t('audit_unavailable')}
          </Alert>
        ) : events.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t('audit_empty')}
          </Text>
        ) : (
          <Stack gap="md">
            {events.map((ev, index) => {
              const keySlug = ev.permission_key.replace('.', '_')
              return (
                <Fragment key={ev.id}>
                  {index > 0 && <Divider />}
                  <Group align="flex-start" wrap="nowrap" gap="sm">
                    <Box c={ev.new_allowed ? 'green' : 'dimmed'} display="flex">
                      {ev.new_allowed ? (
                        <ShieldCheck size={iconSize.standard} />
                      ) : (
                        <ShieldX size={iconSize.standard} />
                      )}
                    </Box>
                    <Stack gap={0} miw={0}>
                      <Text size="sm" fw={500}>
                        {t(`keys.${keySlug}`)}{' '}
                        <Text span c={ev.new_allowed ? 'green' : 'dimmed'}>
                          {t(ev.new_allowed ? 'audit_grant' : 'audit_revoke')}
                        </Text>
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t('audit_by')} {ev.actor_name ?? t('audit_unknown_actor')} ·{' '}
                        {format.dateTime(new Date(ev.created_at), { dateStyle: 'medium', timeStyle: 'short' })}
                      </Text>
                    </Stack>
                  </Group>
                </Fragment>
              )
            })}
          </Stack>
        )}
      </MantineFormSection>

      <Text size="xs" c="dimmed">
        {t('admin_note')}
      </Text>
    </Stack>
  )
}
