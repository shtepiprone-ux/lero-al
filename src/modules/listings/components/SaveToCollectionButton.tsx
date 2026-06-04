'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FolderOpen, Folder, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import type { CollectionWithCount } from '@/types/database'

interface Props {
  listingId: string
  /** Pass 'icon' to render only the folder icon (for overlay on listing cards). */
  variant?: 'icon' | 'default'
  className?: string
  /** Canonical button size for default variant. Has no effect on icon variant. */
  size?: 'default' | 'lg' | 'xl'
}

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

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={variant === 'icon' ? 'icon-sm' : (size ?? 'sm')}
        onClick={e => { e.preventDefault(); e.stopPropagation(); handleOpen() }}
        aria-label={t('save_to')}
        className={className}
      >
        <FolderOpen className="h-4 w-4 shrink-0" />
        {variant === 'default' && <span className="ml-1">{t('save_to')}</span>}
      </Button>

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
