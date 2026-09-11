'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FolderPlus, Folder, Pencil, Trash2 } from 'lucide-react'
import { Group, Stack, SimpleGrid, Paper, Text, Title, Button, ActionIcon, ThemeIcon, TextInput, Flex, useMantineTheme } from '@mantine/core'
import { toast } from '@/lib/toast'
import { MantineModal } from '@/design-system/mantine/patterns'
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns/MantineEmptyLoadingErrorState'
import {
  createCollection,
  renameCollection,
  deleteCollection,
} from '@/modules/listings/actions/collectionActions'
import type { CollectionWithCount } from '@/types/database'

const FULL_BELOW_SM = { base: '100%', sm: 'auto' } as const

interface Props {
  initialCollections: CollectionWithCount[]
}

export function CollectionsSection({ initialCollections }: Props) {
  const t = useTranslations('collections')
  const tc = useTranslations('common')
  const theme = useMantineTheme()
  const [collections, setCollections] = useState<CollectionWithCount[]>(initialCollections)
  const [isPending, startTransition] = useTransition()

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createError, setCreateError] = useState('')

  // Rename dialog
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<CollectionWithCount | null>(null)
  const [renameName, setRenameName] = useState('')
  const [renameError, setRenameError] = useState('')

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CollectionWithCount | null>(null)

  function openRename(col: CollectionWithCount) {
    setRenameTarget(col)
    setRenameName(col.name)
    setRenameError('')
    setRenameOpen(true)
  }

  function openDelete(col: CollectionWithCount) {
    setDeleteTarget(col)
    setDeleteOpen(true)
  }

  function handleCreate() {
    const name = createName.trim()
    if (!name) { setCreateError(t('name_required')); return }
    setCreateError('')

    startTransition(async () => {
      const result = await createCollection(name)
      if ('error' in result) {
        setCreateError(t('error_generic'))
        return
      }
      setCollections(prev => [result.collection, ...prev])
      setCreateName('')
      setCreateOpen(false)
      toast.success(t('created'))
    })
  }

  function handleRename() {
    const name = renameName.trim()
    if (!name) { setRenameError(t('name_required')); return }
    if (!renameTarget) return
    setRenameError('')

    startTransition(async () => {
      const result = await renameCollection(renameTarget.id, name)
      if ('error' in result) {
        setRenameError(t('error_generic'))
        return
      }
      setCollections(prev =>
        prev.map(c => c.id === renameTarget.id ? { ...c, name } : c)
      )
      setRenameOpen(false)
      toast.success(t('renamed'))
    })
  }

  function handleDelete() {
    if (!deleteTarget) return

    startTransition(async () => {
      const result = await deleteCollection(deleteTarget.id)
      if ('error' in result) {
        toast.error(t('error_generic'))
        return
      }
      setCollections(prev => prev.filter(c => c.id !== deleteTarget.id))
      setDeleteOpen(false)
      toast.success(t('deleted'))
    })
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" gap="xs" wrap="nowrap">
        <Title order={2} size="lg" fw={600}>{t('title')}</Title>
        <Button
          variant="outline"
          size="sm"
          leftSection={<FolderPlus size={theme.other.iconSize.standard} />}
          onClick={() => { setCreateName(''); setCreateError(''); setCreateOpen(true) }}
        >
          {t('new')}
        </Button>
      </Group>

      {collections.length === 0 ? (
        <MantineEmptyLoadingErrorState
          state="empty"
          title={t('no_collections')}
          description={t('no_collections_desc')}
          icon={<Folder size={theme.other.iconSize.decorative} />}
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="sm">
          {collections.map(col => (
            <Paper key={col.id} withBorder radius="lg" p="sm">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color="gray" size="lg" radius="md">
                  <Folder size={theme.other.iconSize.roomy} />
                </ThemeIcon>
                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={500} truncate>{col.name}</Text>
                  <Text size="xs" c="dimmed">{t('item_count', { count: col.item_count })}</Text>
                </Stack>
                <Group gap="tight" wrap="nowrap">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    radius="md"
                    onClick={() => openRename(col)}
                    aria-label={t('rename')}
                  >
                    <Pencil size={theme.other.iconSize.compact} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    radius="md"
                    onClick={() => openDelete(col)}
                    aria-label={t('delete')}
                  >
                    <Trash2 size={theme.other.iconSize.compact} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      {/* Create dialog */}
      <MantineModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('new')}
        footer={
          <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify={{ sm: 'flex-end' }} gap="xs">
            <Button variant="subtle" color="gray" w={FULL_BELOW_SM} onClick={() => setCreateOpen(false)} disabled={isPending}>
              {tc('cancel')}
            </Button>
            <Button w={FULL_BELOW_SM} onClick={handleCreate} disabled={isPending || !createName.trim()}>
              {t('create')}
            </Button>
          </Flex>
        }
      >
        <TextInput
          value={createName}
          onChange={e => { setCreateName(e.target.value); setCreateError('') }}
          placeholder={t('name_placeholder')}
          maxLength={100}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          error={createError || undefined}
          autoFocus
        />
      </MantineModal>

      {/* Rename dialog */}
      <MantineModal
        opened={renameOpen}
        onClose={() => setRenameOpen(false)}
        title={t('rename')}
        footer={
          <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify={{ sm: 'flex-end' }} gap="xs">
            <Button variant="subtle" color="gray" w={FULL_BELOW_SM} onClick={() => setRenameOpen(false)} disabled={isPending}>
              {tc('cancel')}
            </Button>
            <Button w={FULL_BELOW_SM} onClick={handleRename} disabled={isPending || !renameName.trim()}>
              {tc('save')}
            </Button>
          </Flex>
        }
      >
        <TextInput
          value={renameName}
          onChange={e => { setRenameName(e.target.value); setRenameError('') }}
          placeholder={t('new_name_placeholder')}
          maxLength={100}
          onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
          error={renameError || undefined}
          autoFocus
        />
      </MantineModal>

      {/* Delete confirm dialog */}
      <MantineModal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('delete')}
        footer={
          <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify={{ sm: 'flex-end' }} gap="xs">
            <Button variant="subtle" color="gray" w={FULL_BELOW_SM} onClick={() => setDeleteOpen(false)} disabled={isPending}>
              {tc('cancel')}
            </Button>
            <Button color="red" w={FULL_BELOW_SM} onClick={handleDelete} disabled={isPending}>
              {t('delete')}
            </Button>
          </Flex>
        }
      >
        <Text size="sm" c="dimmed">{t('delete_confirm')}</Text>
      </MantineModal>
    </Stack>
  )
}
