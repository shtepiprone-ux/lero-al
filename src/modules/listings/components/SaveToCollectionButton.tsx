'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FolderOpen, Folder } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button as MantineButton, Checkbox, Divider, Loader, Stack, Text, TextInput, Flex, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns'
import {
  getCollectionsWithMembership,
  createCollection,
  addToCollection,
  removeFromCollection,
} from '@/modules/listings/actions/collectionActions'
import { useAuth } from '@/modules/auth/context/AuthContext'
import type { CollectionWithCount } from '@/types/database'

interface Props {
  listingId: string
}

export function SaveToCollectionButton({ listingId }: Props) {
  const t = useTranslations('collections')
  const theme = useMantineTheme()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collections, setCollections] = useState<CollectionWithCount[]>([])
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  if (!user) return null

  async function handleOpen() {
    setOpen(true)
    setLoading(true)
    const result = await getCollectionsWithMembership(listingId)
    setCollections(result.collections)
    setMemberIds(new Set(result.memberIds))
    setLoading(false)
  }

  function handleTriggerClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    handleOpen()
  }

  function toggleCollection(col: CollectionWithCount) {
    const isMember = memberIds.has(col.id)
    startTransition(async () => {
      const result = isMember
        ? await removeFromCollection(col.id, listingId)
        : await addToCollection(col.id, listingId)

      if ('error' in result) {
        toast.error(t('error_generic'))
        return
      }

      setMemberIds(prev => {
        const next = new Set(prev)
        if (isMember) next.delete(col.id)
        else next.add(col.id)
        return next
      })
      toast.success(isMember ? t('removed') : t('added'))
    })
  }

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed || isCreating) return
    setIsCreating(true)
    const result = await createCollection(trimmed)
    if ('error' in result) {
      toast.error(t('error_generic'))
      setIsCreating(false)
      return
    }
    // Add the listing to the newly created collection in one flow
    const addResult = await addToCollection(result.collection.id, listingId)
    if ('error' in addResult) {
      // Collection created but listing not added — show collection with item_count: 0
      setCollections(prev => [{ ...result.collection, item_count: 0 }, ...prev])
      setNewName('')
      setIsCreating(false)
      toast.warning(t('error_add_after_create'))
      return
    }
    setCollections(prev => [{ ...result.collection, item_count: 1 }, ...prev])
    setMemberIds(prev => new Set([...prev, result.collection.id]))
    setNewName('')
    setIsCreating(false)
    toast.success(t('created'))
  }

  // Task 886 R35 (owner O83-1): one shape only — the canonical Mantine secondary CTA, the same shape
  // as the sibling contact-card buttons (`variant="default" fullWidth leftSection`), with the theme's own
  // size/radius/border. Save-to-collection lives only on the listing-detail page, never on cards.
  return (
    <>
      <MantineButton
        type="button"
        onClick={handleTriggerClick}
        aria-label={t('save_to')}
        variant="default"
        fullWidth
        leftSection={<FolderOpen size={theme.other.iconSize.standard} />}
      >
        {t('save_to')}
      </MantineButton>

      <MantineModal
        opened={open}
        onClose={() => setOpen(false)}
        title={t('save_to')}
      >
        <Stack gap="sm" onClick={e => e.stopPropagation()}>
          {loading ? (
            <Flex justify="center" align="center" py="xl">
              <Loader color="gray" size="sm" />
            </Flex>
          ) : (
            <>
              {collections.length === 0 ? (
                <Stack align="center" gap="xs" pt="sm" pb="xs">
                  <Folder size={theme.other.iconSize.feature} color="var(--mantine-color-gray-6)" />
                  <Text size="sm" c="dimmed">{t('no_collections')}</Text>
                </Stack>
              ) : (
                <Stack gap="xs">
                  {collections.map(col => {
                    const isMember = memberIds.has(col.id)
                    return (
                      <Checkbox
                        key={col.id}
                        checked={isMember}
                        onChange={() => toggleCollection(col)}
                        disabled={isPending}
                        label={
                          <Stack gap={0}>
                            <Text size="sm" fw={500} truncate>{col.name}</Text>
                            <Text size="xs" c="dimmed">{t('item_count', { count: col.item_count })}</Text>
                          </Stack>
                        }
                      />
                    )
                  })}
                </Stack>
              )}

              {/* Inline create-and-add — always visible, no extra dialog */}
              <Divider />
              <Flex gap="xs">
                <TextInput
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={t('name_placeholder')}
                  maxLength={100}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                  disabled={isCreating}
                  size="xs"
                  flex={1}
                />
                <MantineButton
                  type="button"
                  size="xs"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                  w={{ base: 'auto' }}
                >
                  {isCreating
                    ? <Loader size={theme.other.iconSize.compact} color="white" />
                    : t('create')
                  }
                </MantineButton>
              </Flex>
            </>
          )}
        </Stack>
      </MantineModal>
    </>
  )
}
