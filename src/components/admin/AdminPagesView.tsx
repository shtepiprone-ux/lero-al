'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { ActionIcon, Alert, Badge, Button, Flex, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import {
  MantineDataTableToCards,
  MantineModal,
  type CardConfig,
  type TableColumn,
} from '@/design-system/mantine/patterns'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { getDisplayTitle } from '@/components/admin/adminPagesContent'
import type { Page } from '@/types/database'

export interface AdminPagesViewProps {
  pages: Page[]
  /** Locale of the public preview link (`/${activeLocale}/${slug}`). */
  activeLocale: string
  /** Legacy (non-`sq`-keyed) content exists: "new", edit and delete are disabled. */
  migrationPending: boolean
  /** Page whose delete is in flight: its delete action shows `loading`. */
  deletingId: number | null
  /** Page awaiting delete confirmation; `null` keeps the confirm closed. */
  deleteTarget: Page | null
  onNew: () => void
  onEdit: (page: Page) => void
  onRequestDelete: (page: Page) => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  /** Slot for the create/edit dialog (rendered by the container). */
  editorSlot?: ReactNode
}

// `MantineDataTableToCards` needs a string `id`; the original page is kept for the callbacks.
interface PageRow {
  id: string
  page: Page
}

/**
 * Presentational View of `/admin/pages` (Task 868, Container/Presentational split of
 * `AdminPagesManager`). No hooks beyond `useTranslations` / `useMantineTheme`, no server action, no
 * `toast`. The list renders through the canonical `MantineDataTableToCards` (table from `md`, cards
 * below 768px) and the delete confirmation through `MantineModal`.
 */
export function AdminPagesView({
  pages,
  activeLocale,
  migrationPending,
  deletingId,
  deleteTarget,
  onNew,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  editorSlot,
}: AdminPagesViewProps) {
  const t = useTranslations('admin.pages')
  const tLegal = useTranslations('admin.legal')
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  const rows: PageRow[] = pages.map(page => ({ id: String(page.id), page }))

  function statusBadge(p: Page) {
    return (
      <Badge variant="light" color={p.is_published ? 'green' : 'gray'} size="sm">
        {p.is_published ? t('status_published') : t('status_draft')}
      </Badge>
    )
  }

  function actionIcons(p: Page, touch: boolean) {
    const touchProps = touch ? { mih: theme.other.touchTarget, miw: theme.other.touchTarget } : {}
    return (
      <Group gap="xs" wrap="nowrap" justify="flex-end">
        {p.is_published && (
          <ActionIcon
            component="a"
            href={`/${activeLocale}/${p.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            size="sm"
            aria-label={t('preview_open')}
            title={t('preview_open')}
            {...touchProps}
          >
            <ExternalLink size={theme.other.iconSize.compact} />
          </ActionIcon>
        )}
        <ActionIcon
          variant="subtle"
          size="sm"
          aria-label={tc('edit')}
          title={tc('edit')}
          disabled={migrationPending}
          onClick={() => onEdit(p)}
          {...touchProps}
        >
          <Pencil size={theme.other.iconSize.compact} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          size="sm"
          color="red"
          aria-label={tc('delete')}
          title={tc('delete')}
          disabled={migrationPending}
          loading={deletingId === p.id}
          onClick={() => onRequestDelete(p)}
          {...touchProps}
        >
          <Trash2 size={theme.other.iconSize.compact} />
        </ActionIcon>
      </Group>
    )
  }

  const columns: TableColumn<PageRow>[] = [
    {
      key: 'title',
      label: t('col_title'),
      // §7.3 (a)/(b): the title wraps at the table-title token width, clamped to two lines; the slug is its meta line.
      width: theme.other.layout.tableTitleColumnWidth,
      wrap: true,
      render: r => (
        <Stack gap="micro">
          <Text size="sm" fw={500} c="gray.7" lineClamp={2}>{getDisplayTitle(r.page)}</Text>
          <Text size="xs" c="dimmed" ff="monospace" truncate="end">{r.page.slug}</Text>
        </Stack>
      ),
    },
    { key: 'status', label: t('col_status'), render: r => statusBadge(r.page) },
    {
      key: 'updated',
      label: t('col_updated'),
      visibleFrom: 'lg',
      render: r => <RelativeTime date={r.page.updated_at} />,
    },
    { key: 'actions', label: tLegal('col_actions'), align: 'right', render: r => actionIcons(r.page, false) },
  ]

  const card: CardConfig<PageRow> = {
    actions: r => actionIcons(r.page, true),
    title: r => <Text size="sm" fw={500} c="gray.7">{getDisplayTitle(r.page)}</Text>,
    badge: r => statusBadge(r.page),
    meta: [
      { label: t('col_slug'), value: r => <Text size="xs" c="dimmed" ff="monospace">{r.page.slug}</Text> },
      { label: t('col_updated'), value: r => <RelativeTime date={r.page.updated_at} /> },
    ],
  }

  const emptyLabel = (
    <Stack gap="md" align="center">
      <Text size="sm" c="dimmed">{tLegal('empty_text')}</Text>
      {!migrationPending && (
        <Button variant="outline" color="gray" leftSection={<Plus size={theme.other.iconSize.compact} />} onClick={onNew}>
          {tLegal('btn_add_first')}
        </Button>
      )}
    </Stack>
  )

  return (
    <Stack gap="md" data-testid="admin-pages-manager">
      {migrationPending && (
        <Alert
          color="yellow"
          variant="light"
          icon={<AlertTriangle size={theme.other.iconSize.standard} />}
        >
          {t('migration_pending_banner')}
        </Alert>
      )}

      <Flex justify={{ base: 'stretch', sm: 'flex-end' }}>
        <Button
          w={{ base: '100%', sm: 'auto' }}
          leftSection={<Plus size={theme.other.iconSize.compact} />}
          disabled={migrationPending}
          onClick={onNew}
        >
          {t('btn_new')}
        </Button>
      </Flex>

      <MantineDataTableToCards<PageRow>
        columns={columns}
        rows={rows}
        emptyLabel={emptyLabel}
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
            <Button variant="outline" color="gray" w={{ base: '100%', sm: 'auto' }} onClick={onCancelDelete}>
              {tc('cancel')}
            </Button>
            <Button color="red" w={{ base: '100%', sm: 'auto' }} onClick={onConfirmDelete}>
              {tc('delete')}
            </Button>
          </Flex>
        }
      >
        <Text size="sm" c="gray.7">{deleteTarget ? getDisplayTitle(deleteTarget) : null}</Text>
      </MantineModal>

      {editorSlot}
    </Stack>
  )
}
