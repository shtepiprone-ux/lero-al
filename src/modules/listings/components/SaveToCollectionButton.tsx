'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FolderOpen, Folder, Check, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { ActionIcon, Button as MantineButton } from '@mantine/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
// Mirrors FavoriteButton.tsx's PILL_SIZE_MAP exactly (Task 653) — theme.ts's project-wide Button
// `styles.root` sets `minHeight: '2.75rem'` (44px) UNCONDITIONALLY on every Button instance, so the
// migrated pill renders at 44px on all breakpoints, unifying the ListingContact action row with the
// now-Mantine favorite pill (R1/R2). 'default'/'xl' are unexercised by any current consumer.
const PILL_SIZE_MAP = { default: 'xs', lg: 'sm', xl: 'md' } as const

export function SaveToCollectionButton({ listingId, variant = 'icon', className, size }: Props) {
  const t = useTranslations('collections')
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
  const icon = <FolderOpen className="h-4 w-4 shrink-0" />

  const commonProps = {
    type: 'button' as const,
    onClick: handleTriggerClick,
    'aria-label': t('save_to'),
    className: cn(styles.control, className),
  }

  return (
    <>
      {variant === 'icon' ? (
        // Icon shape — the only current consumer is FavoritesShell.tsx's per-card hover overlay,
        // which passes `className="bg-card/80 hover:bg-card shadow-sm rounded-lg"`. Those Tailwind
        // background/radius classes would become inert once the trigger is a Mantine ActionIcon
        // (Mantine's own `background`/`border-radius` CSS is unlayered and unconditionally set —
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
        <ActionIcon {...commonProps} data-shape="icon" variant="subtle" size={28} radius="0.75rem">
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
          radius="1.125rem"
          bd="1px solid var(--border)"
        >
          {icon}
          <span className="ml-1">{t('save_to')}</span>
        </MantineButton>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm" onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t('save_to')}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {collections.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-4 pb-2 gap-2 text-center">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('no_collections')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1 py-1">
                  {collections.map(col => {
                    const isMember = memberIds.has(col.id)
                    return (
                      <Button
                        key={col.id}
                        type="button"
                        variant="ghost"
                        onClick={() => toggleCollection(col)}
                        disabled={isPending}
                        className="flex items-center gap-3 px-3 py-2.5 h-auto rounded-xl hover:bg-muted transition-colors text-left w-full justify-start disabled:opacity-60"
                      >
                        <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${isMember ? 'bg-primary border-primary' : 'border-border'}`}>
                          {isMember && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium break-words">{col.name}</p>
                          <p className="text-xs text-muted-foreground">{t('item_count', { count: col.item_count })}</p>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              )}

              {/* Inline create-and-add — always visible, no extra dialog */}
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={t('name_placeholder')}
                  maxLength={100}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                  disabled={isCreating}
                  className="flex-1 h-8 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                  className="shrink-0 max-sm:w-auto"
                >
                  {isCreating
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : t('create')
                  }
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
