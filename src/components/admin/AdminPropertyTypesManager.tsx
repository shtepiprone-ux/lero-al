'use client'

import { useState, useTransition, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminSearchInput } from '@/components/admin/AdminSearchInput'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/shared/RelativeTime'
import {
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
  togglePropertyTypeActive,
  type PropertyTypeInput,
} from '@/modules/admin/actions/propertyTypes'
import type { DBPropertyType } from '@/types/database'

// ── Form dialog ───────────────────────────────────────────────────────────────

function buildSlug(nameSq: string): string {
  return nameSq
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
}

interface FormDialogProps {
  initial?: DBPropertyType | null
  onClose: () => void
  onSaved: (pt: DBPropertyType) => void
}

function PropertyTypeFormDialog({ initial, onClose, onSaved }: FormDialogProps) {
  const t = useTranslations('admin.property_types')
  const [isPending, startTransition] = useTransition()

  const [nameSq, setNameSq] = useState(initial?.name_sq ?? '')
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '')
  const [nameUk, setNameUk] = useState(initial?.name_uk ?? '')
  const [nameIt, setNameIt] = useState(initial?.name_it ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 99)
  const [slugManual, setSlugManual] = useState(!!initial)

  function handleNameSqChange(v: string) {
    setNameSq(v)
    if (!slugManual) setSlug(buildSlug(v))
  }

  function handleSubmit() {
    if (!nameSq.trim()) { toast.error(t('error_name_required')); return }

    const input: PropertyTypeInput = {
      slug: slug || buildSlug(nameSq),
      name_sq: nameSq,
      name_en: nameEn,
      name_uk: nameUk,
      name_it: nameIt,
      sort_order: sortOrder,
    }

    startTransition(async () => {
      const result = initial
        ? await updatePropertyType(initial.id, input)
        : await createPropertyType(input)

      if (result.code === 'duplicate_slug') {
        toast.error(t('error_slug_duplicate'))
        return
      }
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(initial ? t('success_updated') : t('success_created'))
      // Build a synthetic updated row for optimistic update
      const updated: DBPropertyType = {
        id: (('id' in result ? result.id : undefined) ?? initial?.id ?? 0) as number,
        slug: input.slug ?? '',
        name_sq: input.name_sq,
        name_en: input.name_en,
        name_uk: input.name_uk,
        name_it: input.name_it,
        is_active: initial?.is_active ?? true,
        sort_order: input.sort_order ?? 99,
        created_at: initial?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      onSaved(updated)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b">
          <p className="font-semibold">{initial ? t('edit') : t('new')}</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {/* Localized names */}
          {([['name_sq', nameSq, setNameSq, handleNameSqChange], ['name_en', nameEn, setNameEn, null], ['name_uk', nameUk, setNameUk, null], ['name_it', nameIt, setNameIt, null]] as [string, string, (v: string) => void, null | ((v: string) => void)][]).map(([key, val, setter, special]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label className="text-sm">{t(key as 'name_sq')}</Label>
              <Input
                value={val}
                onChange={e => (special ?? setter)(e.target.value)}
                className="h-9 rounded-xl"
                required={key === 'name_sq'}
              />
            </div>
          ))}

          {/* Slug */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">{t('slug_label')}</Label>
            <Input
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true) }}
              className="h-9 rounded-xl font-mono text-xs"
              placeholder={buildSlug(nameSq) || 'auto'}
            />
            <p className="text-xs text-muted-foreground">{t('slug_hint')}</p>
          </div>

          {/* Sort order */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">{t('sort_order')}</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(Number(e.target.value))}
              className="h-9 rounded-xl w-28"
              min={0}
              max={999}
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            {t('cancel')}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending} className="gap-1.5">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Delete dialog ──────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  pt: DBPropertyType
  onClose: () => void
  onDeleted: (id: number) => void
}

function DeleteDialog({ pt, onClose, onDeleted }: DeleteDialogProps) {
  const t = useTranslations('admin.property_types')
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePropertyType(pt.id)
      if (result.code === 'has_listings') {
        toast.error(t('delete_blocked', { count: result.listingCount ?? 0 }))
        onClose()
        return
      }
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t('success_deleted'))
      onDeleted(pt.id)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-sm p-6">
        <p className="font-semibold mb-1">{t('delete_confirm')}</p>
        <p className="text-sm text-muted-foreground mb-5">{pt.name_sq} <span className="font-mono text-xs text-muted-foreground/60">({pt.slug})</span></p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>{t('cancel')}</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            {t('delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main manager ───────────────────────────────────────────────────────────────

interface Props {
  initialTypes: DBPropertyType[]
  searchQuery: string
}

export function AdminPropertyTypesManager({ initialTypes, searchQuery }: Props) {
  const t = useTranslations('admin.property_types')
  const [types, setTypes] = useState(initialTypes)
  const [editTarget, setEditTarget] = useState<DBPropertyType | null | 'new'>()
  const [deleteTarget, setDeleteTarget] = useState<DBPropertyType | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return types
    return types.filter(pt =>
      pt.slug.includes(q) ||
      pt.name_sq.toLowerCase().includes(q) ||
      (pt.name_en?.toLowerCase() ?? '').includes(q) ||
      (pt.name_uk?.toLowerCase() ?? '').includes(q) ||
      (pt.name_it?.toLowerCase() ?? '').includes(q)
    )
  }, [types, searchQuery])

  function handleSaved(updated: DBPropertyType) {
    setTypes(prev => {
      const idx = prev.findIndex(p => p.id === updated.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = updated
        return next
      }
      return [...prev, updated]
    })
  }

  function handleDeleted(id: number) {
    setTypes(prev => prev.filter(p => p.id !== id))
  }

  function handleToggleActive(pt: DBPropertyType) {
    const newActive = !pt.is_active
    // Optimistic update
    setTypes(prev => prev.map(p => p.id === pt.id ? { ...p, is_active: newActive } : p))
    startTransition(async () => {
      const result = await togglePropertyTypeActive(pt.id, newActive)
      if (result.error) {
        toast.error(result.error)
        setTypes(prev => prev.map(p => p.id === pt.id ? { ...p, is_active: !newActive } : p))
      }
    })
  }

  return (
    <>
      {/* Form dialog */}
      {editTarget !== undefined && (
        <PropertyTypeFormDialog
          initial={editTarget === 'new' ? null : editTarget as DBPropertyType}
          onClose={() => setEditTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteDialog
          pt={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <AdminSearchInput
          value={searchQuery}
          placeholder={t('search_placeholder')}
          className="flex-1 max-w-xs"
        />
        <Button size="sm" className="gap-1.5" onClick={() => setEditTarget('new')}>
          <Plus className="h-4 w-4" />
          {t('new')}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">ID</th>
                  <th className="px-5 py-3 text-left">Slug</th>
                  <th className="px-5 py-3 text-left">SQ</th>
                  <th className="px-5 py-3 text-left">EN / UK / IT</th>
                  <th className="px-5 py-3 text-left">{t('sort_order')}</th>
                  <th className="px-5 py-3 text-left">{t('is_active')}</th>
                  <th className="px-5 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(pt => (
                  <tr key={pt.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground text-xs">{pt.id}</td>
                    <td className="px-5 py-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{pt.slug}</code>
                    </td>
                    {/* SQ name — primary click affordance → opens edit (K.1 canonical) */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditTarget(pt)}
                          className="font-medium truncate max-w-[140px] hover:text-primary transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                        >
                          {pt.name_sq}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(pt)}
                          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        {pt.name_en && <span>{pt.name_en}</span>}
                        {pt.name_uk && <span>{pt.name_uk}</span>}
                        {pt.name_it && <span>{pt.name_it}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{pt.sort_order}</td>
                    {/* is_active — inline toggle (clickable badge, no separate Actions column) */}
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(pt)}
                        disabled={isPending}
                        title={pt.is_active ? t('deactivate') : t('activate')}
                        className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                      >
                        <Badge variant={pt.is_active ? 'success' : 'neutral'} className="text-xs cursor-pointer hover:opacity-80 transition-opacity">
                          {pt.is_active ? t('is_active') : t('deactivate')}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      <RelativeTime date={pt.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
