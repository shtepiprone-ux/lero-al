'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FolderPlus, Folder, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  createCollection,
  renameCollection,
  deleteCollection,
} from '@/modules/listings/actions/collectionActions'
import type { CollectionWithCount } from '@/types/database'

interface Props {
  initialCollections: CollectionWithCount[]
}

export function CollectionsSection({ initialCollections }: Props) {
  const t = useTranslations('collections')
  const tc = useTranslations('common')
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
        setCreateError(t('name_required'))
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
        setRenameError(t('name_required'))
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setCreateName(''); setCreateError(''); setCreateOpen(true) }}
          className="gap-1.5 rounded-xl"
        >
          <FolderPlus className="h-4 w-4 shrink-0" />
          {t('new')}
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center border rounded-2xl bg-muted/30">
          <Folder className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t('no_collections')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('no_collections_desc')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {collections.map(col => (
            <div
              key={col.id}
              className="flex items-center gap-3 p-3 rounded-xl border bg-card"
            >
              <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{col.name}</p>
                <p className="text-xs text-muted-foreground">{col.item_count}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openRename(col)}
                  aria-label={t('rename')}
                  className="rounded-lg"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openDelete(col)}
                  aria-label={t('delete')}
                  className="rounded-lg text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('new')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input
              value={createName}
              onChange={e => { setCreateName(e.target.value); setCreateError('') }}
              placeholder={t('name_placeholder')}
              maxLength={100}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              autoFocus
            />
            {createError && <p className="text-xs text-destructive">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isPending || !createName.trim()}>
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('rename')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input
              value={renameName}
              onChange={e => { setRenameName(e.target.value); setRenameError('') }}
              placeholder={t('new_name_placeholder')}
              maxLength={100}
              onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
              autoFocus
            />
            {renameError && <p className="text-xs text-destructive">{renameError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)} disabled={isPending}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleRename} disabled={isPending || !renameName.trim()}>
              {tc('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{t('delete_confirm')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>
              {tc('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
