'use client'

import { Fragment } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { Alert, Box, Divider, Group, Stack, Switch, Text, useMantineTheme } from '@mantine/core'
import { ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react'
import { MantineFormSection } from '@/design-system/mantine/patterns'
import { PERMISSION_KEYS } from '@/lib/auth/permissionKeys'
import { ADMIN_PAGES, ADMIN_PAGE_KEYS, type AccessKey } from '@/lib/auth/adminPages'
import type { PermissionData, PermissionEvent } from '@/modules/admin/actions/permissions'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'

export interface AdminPermissionsViewProps {
  permissions: Record<AccessKey, PermissionData>
  /** `null` = the audit read failed (shows the "unavailable" alert). */
  events: PermissionEvent[] | null
  /** The action keys that are on (counted over `PERMISSION_KEYS`). */
  allowedCount: number
  /** The admin pages that are on (counted over `ADMIN_PAGE_KEYS`), shown apart from the actions (Task 1007). */
  allowedPagesCount: number
  /** The key whose save is in flight; its switch is disabled. */
  savingKey: AccessKey | null
  onToggle: (key: AccessKey, value: boolean) => void
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
  allowedPagesCount,
  savingKey,
  onToggle,
}: AdminPermissionsViewProps) {
  const t = useTranslations('admin.permissions')
  const tSidebar = useTranslations('admin.sidebar')
  const format = useFormatter()
  const { iconSize } = useMantineTheme().other

  // the audit log names an action key by its permission label and a page key by its sidebar label (Task 1007)
  const labelOfKey = (key: string) => {
    const page = ADMIN_PAGES.find(p => p.key === key)
    return page ? tSidebar(page.labelKey) : t(`keys.${key.replace('.', '_')}`)
  }

  return (
    <Stack gap="xl" data-testid="admin-permissions-manager">
      <Group>
        <MantineBadge variant="tone" tone="neutral" outline>
          {t('allowed_count', { count: allowedCount, total: PERMISSION_KEYS.length })}
        </MantineBadge>
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

      <MantineFormSection
        title={t('pages_section_title')}
        headerAction={
          <MantineBadge variant="tone" tone="neutral" outline>
            {t('allowed_count', { count: allowedPagesCount, total: ADMIN_PAGE_KEYS.length })}
          </MantineBadge>
        }
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('pages_section_description')}
          </Text>
          {ADMIN_PAGES.map(page => {
            const { allowed, updated_at, updated_by_name } = permissions[page.key]
            const keySlug = page.key.replace('.', '_')
            const label = tSidebar(page.labelKey)
            return (
              <Fragment key={page.key}>
                <Divider />
                <Group
                  justify="space-between"
                  wrap="nowrap"
                  align="flex-start"
                  data-testid={`perm-row-${keySlug}`}
                >
                  <Stack gap={0} miw={0}>
                    <Text size="sm" fw={500}>
                      {label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {page.paths[0]}
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
                      onChange={e => onToggle(page.key, e.currentTarget.checked)}
                      disabled={savingKey === page.key}
                      aria-label={label}
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
                        {labelOfKey(ev.permission_key)}{' '}
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
