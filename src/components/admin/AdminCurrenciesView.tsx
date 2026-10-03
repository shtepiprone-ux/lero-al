'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search } from 'lucide-react'
import { Badge, Button, Flex, Group, Stack, Text, TextInput, UnstyledButton, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { CurrencyDetailDialogView } from '@/components/admin/CurrencyDetailDialogView'
import { RelativeTime } from '@/components/shared/RelativeTime'
import type { DBCurrency } from '@/types/database'

export interface AdminCurrenciesViewProps {
  /** Already filtered by the container's search query. */
  currencies: DBCurrency[]
  query: string
  onQueryChange: (query: string) => void
  isPending: boolean
  onNew: () => void
  detailTarget: DBCurrency | null
  onOpenDetail: (c: DBCurrency) => void
  onCloseDetail: () => void
  onDetailEdit: () => void
  onDetailToggleActive: () => void
  onDetailSetDefault: () => void
  onDetailDelete: () => void
  deleteTarget: DBCurrency | null
  onCancelDelete: () => void
  onConfirmDelete: () => void
  /** Slot for the create/edit dialog (rendered by the container). */
  formSlot?: ReactNode
}

/**
 * Presentational View for the currency list (Task 877, Container/Presentational split of
 * `AdminCurrenciesManager`). No server action, no `toast`, no hook beyond `useTranslations` /
 * `useMantineTheme`. The list renders through the shared `AdminTable` adapter (canonical
 * `MantineDataTableToCards`), the delete confirmation through `MantineModal`, and the row detail through
 * `CurrencyDetailDialogView`. Badges follow TailAdmin §6: default = brand light, active/inactive = green/gray.
 */
export function AdminCurrenciesView({
  currencies,
  query,
  onQueryChange,
  isPending,
  onNew,
  detailTarget,
  onOpenDetail,
  onCloseDetail,
  onDetailEdit,
  onDetailToggleActive,
  onDetailSetDefault,
  onDetailDelete,
  deleteTarget,
  onCancelDelete,
  onConfirmDelete,
  formSlot,
}: AdminCurrenciesViewProps) {
  const t = useTranslations('admin.currency.currencies')
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  function statusBadges(c: DBCurrency) {
    return (
      <Group gap="xs" wrap="wrap">
        {c.is_default && <Badge size="sm" variant="light" color="brand">{t('default_badge')}</Badge>}
        <Badge size="sm" variant="light" color={c.is_active ? 'green' : 'gray'}>
          {c.is_active ? t('is_active') : t('deactivate')}
        </Badge>
      </Group>
    )
  }

  const columns: AdminTableColumn<DBCurrency>[] = [
    {
      key: 'code',
      header: t('code'),
      cell: c => (
        <UnstyledButton
          aria-label={c.code}
          onClick={e => {
            e.stopPropagation()
            onOpenDetail(c)
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" fw={600} ff="monospace" c="gray.7">{c.code}</Text>
            <Text size="sm" c="dimmed">{c.symbol}</Text>
          </Group>
        </UnstyledButton>
      ),
    },
    { key: 'name', header: t('name_en'), cell: c => <Text size="sm" c="gray.7">{c.name_en || c.name_sq}</Text> },
    { key: 'is_active', header: t('is_active'), cell: c => statusBadges(c) },
    {
      key: 'last_updated',
      header: t('last_updated'),
      visibility: 'lg',
      cell: c => (
        <Text size="xs" c="dimmed">
          <RelativeTime date={c.updated_at} />
        </Text>
      ),
    },
  ]

  return (
    <Stack gap="md" data-testid="admin-currencies-manager">
      <Flex direction={{ base: 'column', sm: 'row' }} gap="sm">
        <TextInput
          flex={1}
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={t('search_placeholder')}
          leftSection={<Search size={theme.other.iconSize.compact} />}
        />
        <Button
          w={{ base: '100%', sm: 'auto' }}
          leftSection={<Plus size={theme.other.iconSize.compact} />}
          loading={isPending}
          onClick={onNew}
        >
          {t('new')}
        </Button>
      </Flex>

      <AdminTable
        rows={currencies}
        columns={columns}
        rowKey={c => String(c.id)}
        onRowClick={onOpenDetail}
        emptyState={t('empty')}
        cardRow={c => ({
          title: <Text component="span" size="sm" fw={600} ff="monospace">{c.code}</Text>,
          subtitle: <Text component="span" size="sm" c="dimmed">{c.symbol} · {c.name_en || c.name_sq}</Text>,
          meta: statusBadges(c),
        })}
      />

      <MantineModal
        opened={deleteTarget !== null}
        onClose={onCancelDelete}
        title={t('delete_confirm')}
        footer={
          <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap="sm" justify={{ base: 'stretch', sm: 'flex-end' }}>
            <Button variant="outline" color="gray" w={{ base: '100%', sm: 'auto' }} disabled={isPending} onClick={onCancelDelete}>
              {tc('cancel')}
            </Button>
            <Button color="red" w={{ base: '100%', sm: 'auto' }} loading={isPending} onClick={onConfirmDelete}>
              {tc('delete')}
            </Button>
          </Flex>
        }
      >
        <Text size="sm" c="gray.7">
          {deleteTarget ? `${deleteTarget.code} — ${deleteTarget.name_en || deleteTarget.name_sq}` : null}
        </Text>
      </MantineModal>

      {detailTarget && (
        <CurrencyDetailDialogView
          currency={detailTarget}
          onClose={onCloseDetail}
          onEdit={onDetailEdit}
          onToggleActive={onDetailToggleActive}
          onSetDefault={onDetailSetDefault}
          onDelete={onDetailDelete}
        />
      )}

      {formSlot}
    </Stack>
  )
}
