'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { ActionIcon, Badge, Button, Flex, Group, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import {
  MantineDataTableToCards,
  MantineModal,
  type CardConfig,
  type TableColumn,
} from '@/design-system/mantine/patterns'
import type { DBExchangeProvider } from '@/types/database'

export interface AdminExchangeProvidersViewProps {
  providers: DBExchangeProvider[]
  isPending: boolean
  deleteTarget: DBExchangeProvider | null
  onNew: () => void
  onEdit: (p: DBExchangeProvider) => void
  onToggle: (p: DBExchangeProvider) => void
  onRequestDelete: (p: DBExchangeProvider) => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  /** Slot for the create/edit dialog (rendered by the container). */
  formSlot?: ReactNode
}

// `MantineDataTableToCards` needs a string `id`; the original provider is kept for the callbacks.
interface ProviderRow {
  id: string
  provider: DBExchangeProvider
}

/**
 * Presentational View for the exchange-provider manager (Task 874, Container/Presentational split of
 * `AdminExchangeProvidersManager`). No hooks beyond `useTranslations` / `useMantineTheme`, no server
 * action, no `toast`. The list renders through the canonical `MantineDataTableToCards` (table from
 * `md`, cards below 768px) and the delete confirmation through `MantineModal`. Edit opens from the provider
 * name and the edit icon (the legacy whole-row click is not part of the canonical pattern).
 */
export function AdminExchangeProvidersView({
  providers,
  isPending,
  deleteTarget,
  onNew,
  onEdit,
  onToggle,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  formSlot,
}: AdminExchangeProvidersViewProps) {
  const t = useTranslations('admin.currency.providers')
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  const rows: ProviderRow[] = providers.map(provider => ({ id: String(provider.id), provider }))

  function nameButton(p: DBExchangeProvider) {
    return (
      <UnstyledButton onClick={() => onEdit(p)}>
        <Text size="sm" fw={500} c="gray.7" ta="left">{p.name}</Text>
      </UnstyledButton>
    )
  }

  function modeBadge(p: DBExchangeProvider) {
    return <Badge variant="light" color="gray" size="sm">{t(`mode_${p.mode}`)}</Badge>
  }

  function statusBadge(p: DBExchangeProvider) {
    return (
      <Badge variant="light" color={p.is_enabled ? 'green' : 'gray'} size="sm">
        {p.is_enabled ? t('is_enabled') : t('disable')}
      </Badge>
    )
  }

  function actionIcons(p: DBExchangeProvider, touch: boolean) {
    const touchProps = touch ? { mih: theme.other.touchTarget, miw: theme.other.touchTarget } : {}
    const toggleLabel = p.is_enabled ? t('disable') : t('enable')
    return (
      <Group gap="xs" wrap="nowrap" justify="flex-end">
        <ActionIcon
          variant="subtle"
          size="sm"
          color={p.is_enabled ? 'green' : 'gray'}
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={() => onToggle(p)}
          {...touchProps}
        >
          {p.is_enabled
            ? <ToggleRight size={theme.other.iconSize.compact} />
            : <ToggleLeft size={theme.other.iconSize.compact} />}
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          size="sm"
          aria-label={t('edit')}
          title={t('edit')}
          onClick={() => onEdit(p)}
          {...touchProps}
        >
          <Pencil size={theme.other.iconSize.compact} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          size="sm"
          color="red"
          aria-label={t('delete')}
          title={t('delete')}
          onClick={() => onRequestDelete(p)}
          {...touchProps}
        >
          <Trash2 size={theme.other.iconSize.compact} />
        </ActionIcon>
      </Group>
    )
  }

  const columns: TableColumn<ProviderRow>[] = [
    {
      key: 'name',
      label: t('name'),
      // §7.3 (a)/(b): the name wraps at the table-title token width; the endpoint is its dimmed meta line.
      width: theme.other.layout.tableTitleColumnWidth,
      wrap: true,
      render: r => (
        <Stack gap="micro" align="flex-start">
          {nameButton(r.provider)}
          {r.provider.endpoint_url && (
            <Text size="xs" c="dimmed" ff="monospace" truncate="end" maw="100%">{r.provider.endpoint_url}</Text>
          )}
        </Stack>
      ),
    },
    { key: 'priority', label: t('priority'), render: r => <Text size="sm" c="gray.7">{r.provider.priority}</Text> },
    {
      key: 'mode',
      label: t('mode'),
      // §7.3 (b): mode and enabled stacked in one cell.
      render: r => (
        <Stack gap="tight" align="flex-start">
          {modeBadge(r.provider)}
          {statusBadge(r.provider)}
        </Stack>
      ),
    },
    {
      key: 'notes',
      label: t('notes'),
      visibleFrom: 'xl',
      render: r => <Text size="xs" c="dimmed">{r.provider.notes ?? '—'}</Text>,
    },
    { key: 'actions', label: '', align: 'right', render: r => actionIcons(r.provider, false) },
  ]

  const card: CardConfig<ProviderRow> = {
    actions: r => actionIcons(r.provider, true),
    title: r => nameButton(r.provider),
    badge: r => statusBadge(r.provider),
    meta: [
      { label: t('mode'), value: r => modeBadge(r.provider) },
      { label: t('priority'), value: r => <Text size="sm" c="gray.7">{r.provider.priority}</Text> },
      {
        label: t('endpoint'),
        value: r => r.provider.endpoint_url
          ? <Text size="xs" c="dimmed" ff="monospace" truncate="end">{r.provider.endpoint_url}</Text>
          : null,
      },
      {
        label: t('notes'),
        value: r => r.provider.notes
          ? <Text size="xs" c="dimmed" truncate="end">{r.provider.notes}</Text>
          : null,
      },
    ],
  }

  return (
    <Stack gap="md" data-testid="admin-exchange-providers-manager">
      <Flex justify={{ base: 'stretch', sm: 'flex-end' }}>
        <Button
          w={{ base: '100%', sm: 'auto' }}
          leftSection={<Plus size={theme.other.iconSize.compact} />}
          loading={isPending}
          onClick={onNew}
        >
          {t('new')}
        </Button>
      </Flex>

      <MantineDataTableToCards<ProviderRow>
        columns={columns}
        rows={rows}
        emptyLabel={t('empty')}
        card={card}
        cardsBelow="md"
      />

      <MantineModal
        opened={deleteTarget !== null}
        onClose={onCancelDelete}
        title={t('delete_confirm')}
        footer={
          <Flex
            direction={{ base: 'column-reverse', sm: 'row' }}
            gap="sm"
            justify={{ base: 'stretch', sm: 'flex-end' }}
          >
            <Button
              variant="outline"
              color="gray"
              w={{ base: '100%', sm: 'auto' }}
              disabled={isPending}
              onClick={onCancelDelete}
            >
              {tc('cancel')}
            </Button>
            <Button
              color="red"
              w={{ base: '100%', sm: 'auto' }}
              loading={isPending}
              onClick={onConfirmDelete}
            >
              {tc('delete')}
            </Button>
          </Flex>
        }
      >
        <Text size="sm" c="gray.7">{deleteTarget?.name}</Text>
      </MantineModal>

      {formSlot}
    </Stack>
  )
}
