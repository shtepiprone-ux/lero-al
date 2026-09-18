'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FolderOpen, Folder } from 'lucide-react'
import { toast } from '@/lib/toast'
import { ActionIcon, Button as MantineButton, Checkbox, Loader, Stack, Text, TextInput, Flex, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns'
import {
  getCollectionsWithMembership,
  createCollection,
  addToCollection,
  removeFromCollection,
} from '@/modules/listings/actions/collectionActions'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { cn } from '@/lib/utils'
import type { CollectionWithCount } from '@/types/database'
import styles from './SaveToCollectionButton.module.css'

interface Props {
  listingId: string
  /** Pass 'icon' to render only the folder icon (for overlay on listing cards). */
  variant?: 'icon' | 'default'
  className?: string
  /** Canonical button size for default variant. Has no effect on icon variant. */
  size?: 'default' | 'lg' | 'xl'
}

// Task 654: default-variant (pill) size → Mantine Button size, governing padding-x/font-size only.
// theme.ts's project-wide Button `styles.root` sets `minHeight: '2.75rem'` (44px) UNCONDITIONALLY
// on every Button instance, so this pill renders at 44px on all breakpoints, matching the adjacent
// action-row buttons (Task 653). 'default'/'xl' are unexercised by any current consumer. Task 837
// R2 (2026-09-17) deleted the sibling `FavoriteButton.tsx` pill this comment used to cross-reference
// (it had zero production consumers) — this file's own pill is untouched and stays live.
const PILL_SIZE_MAP = { default: 'xs', lg: 'sm', xl: 'md' } as const

export function SaveToCollectionButton({ listingId, variant = 'icon', className, size }: Props) {
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

  // Task 654: trigger control — legacy shadcn `Button` → canonical Mantine `ActionIcon`/`Button`,
  // mirroring FavoriteButton.tsx's (Task 653) prop-choice pattern. `commonProps` carries the
  // identical `type`/`onClick`/`aria-label`/`className` for both shapes.
  const icon = <FolderOpen size={theme.other.iconSize.standard} />

  const commonProps = {
    type: 'button' as const,
    onClick: handleTriggerClick,
    'aria-label': t('save_to'),
    className: cn(styles.control, className),
  }

  return (
    <>
      {variant === 'icon' ? (
        // Icon shape — the only current consumer is FavoritesShell.tsx's per-card hover overlay
        // (Task 809 Revision 1: FavoritesShell no longer passes an external className — the frosted
        // overlay chrome now lives entirely in this component's own CSS module, not a consumer prop).
        // The background/radius were originally raw Tailwind classes; those become inert once the
        // trigger is a Mantine ActionIcon (Mantine's own `background`/`border-radius` CSS is
        // unlayered and unconditionally set —
        // confirmed via `node_modules/@mantine/core/styles.css`'s `.mantine-ActionIcon-root` rule —
        // so it always beats a layered Tailwind utility class for the same property). `radius="0.75rem"`
        // reproduces the exact `rounded-lg` value via a canonical Mantine prop — NOT Mantine's own
        // theme `radius="lg"` token (8px, `theme.ts` line 198): this project's `globals.css` `@theme`
        // overrides Tailwind's `--radius-lg` to the legacy shadcn `--radius` (0.75rem = 12px, see
        // `globals.css:92,399`), a different token than Mantine's `theme.radius.lg` — same
        // Task-652/R8 finding, re-verified here (Revision 1, 2026-07-21).
        // `SaveToCollectionButton.module.css`'s `[data-shape='icon']` rule reproduces the exact
        // `bg-card/80`/`hover:bg-card` resting/hover background (same technique + same token values
        // as FavoriteButton.module.css, Task 653) so the overlay's frosted-white look is unchanged.
        // `size={28}` matches the legacy `icon-sm` (`size-7` = 1.75rem = 28px) exactly.
        <ActionIcon {...commonProps} data-shape="icon" variant="subtle" size={theme.other.iconSize.feature} radius="0.75rem" /* design-tokens-allow: radius="0.75rem" — reproduces legacy shadcn rounded-lg (globals.css --radius), not Mantine's own theme.radius.lg token; Task 652/654 provenance above */>
          {icon}
        </ActionIcon>
      ) : (
        // Default shape — the pill used in ListingContact.tsx's action row. `variant="default"`,
        // `radius="1.125rem"`, `bd="1px solid var(--border)"` are the EXACT prop values Task 653
        // used for the adjacent FavoriteButton pill, so both action-row pills render with matching
        // height (44px, via theme.ts's project-wide Button `styles.root.minHeight` — the R1/R2
        // row-unification goal), radius, and border.
        <MantineButton
          {...commonProps}
          variant="default"
          size={PILL_SIZE_MAP[size ?? 'default']}
          radius="1.125rem" /* design-tokens-allow: radius="1.125rem" — exact value Task 653 set for the sibling FavoriteButton pill, no theme.radius token matches it; provenance above */
          bd="1px solid var(--border)"
        >
          {icon}
          <Text span ml={4} inherit>{t('save_to')}</Text>
        </MantineButton>
      )}

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
              <Flex gap="xs" pt="sm" style={{ borderTop: '1px solid var(--border)' }}>
                <TextInput
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={t('name_placeholder')}
                  maxLength={100}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                  disabled={isCreating}
                  size="xs"
                  style={{ flex: 1 }}
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
