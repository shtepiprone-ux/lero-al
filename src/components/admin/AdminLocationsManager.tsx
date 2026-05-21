'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Combobox } from '@/components/shared/Combobox'
import { createLocation, updateLocation, deleteLocation, toggleLocationFeatured } from '@/modules/admin/actions'
import { AppImage } from '@/components/ui/AppImage'

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export interface Location {
  id: number; name_al: string; name_en?: string | null; type: string; slug?: string; parent_id?: number | null;
  image_url?: string | null; is_featured?: boolean; display_order?: number
}

function LocationModal({
  location, parents, onClose, onDone,
}: {
  location?: Location; parents: Location[]; onClose: () => void; onDone: () => void
}) {
  const t = useTranslations('admin.locations')
  const [nameAl, setNameAl] = useState(location?.name_al ?? '')
  const [nameEn, setNameEn] = useState(location?.name_en ?? '')
  const [type, setType] = useState(location?.type ?? 'city')
  const [slug, setSlug] = useState(location?.slug ?? '')
  const [parentId, setParentId] = useState<string>(location?.parent_id ? String(location.parent_id) : '')
  const [imageUrl, setImageUrl] = useState(location?.image_url ?? '')
  const [displayOrder, setDisplayOrder] = useState(location?.display_order ?? 99)
  const [saving, setSaving] = useState(false)

  const isCity = type === 'city'

  const typeOptions = useMemo(() => [
    { value: 'region',   label: t('type_region') },
    { value: 'city',     label: t('type_city') },
    { value: 'village',  label: t('type_village') },
    { value: 'district', label: t('type_district') },
  ], [t])

  const parentOptions = useMemo(() => {
    const labelMap: Record<string, string> = {
      region: t('type_region'),
      city: t('type_city'),
      village: t('type_village'),
      district: t('type_district'),
    }
    return parents
      .filter(p => p.id !== location?.id)
      .map(p => ({
        value: String(p.id),
        label: p.name_al,
        description: labelMap[p.type] ?? p.type,
      }))
  }, [parents, location?.id, t])

  async function handleSave() {
    if (!nameAl.trim()) return
    setSaving(true)
    const data = {
      name_al: nameAl.trim(),
      name_en: nameEn.trim() || undefined,
      type,
      slug: slug.trim() || toSlug(nameAl),
      parent_id: parentId ? Number(parentId) : null,
      ...(isCity && { image_url: imageUrl.trim() || null, display_order: displayOrder }),
    }
    const result = location
      ? await updateLocation(location.id, data)
      : await createLocation(data)

    setSaving(false)

    if (result.error) {
      toast.error(t('error_save_failed'))
      return
    }
    toast.success(location ? t('success_updated') : t('success_created'))
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        <h3 className="font-bold text-base">{location ? t('edit_title') : t('add_title')}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('name_al_label')} *</Label>
            <Input
              value={nameAl}
              onChange={e => { setNameAl(e.target.value); if (!location) setSlug(toSlug(e.target.value)) }}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('name_en_label')}</Label>
            <Input value={nameEn} onChange={e => setNameEn(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('type_label')}</Label>
            <Combobox
              options={typeOptions}
              value={type}
              onChange={v => { if (v) setType(v) }}
              variant="button"
              size="sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('slug_label')}</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} className="h-10 rounded-xl font-mono text-xs" />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label className="text-xs">{t('parent_label')}</Label>
            <Combobox
              options={parentOptions}
              value={parentId}
              onChange={setParentId}
              placeholder={t('no_parent')}
              portal
            />
          </div>

          {isCity && (
            <>
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label className="text-xs">{t('image_url_label')}</Label>
                <Input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="h-10 rounded-xl font-mono text-xs"
                />
                {imageUrl && (
                  <AppImage
                    variant="listing-thumb"
                    src={imageUrl}
                    alt=""
                    className="h-20 mt-1 rounded-xl"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">{t('display_order_label')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={displayOrder}
                  onChange={e => setDisplayOrder(Number(e.target.value))}
                  className="h-10 rounded-xl"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl">{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !nameAl.trim()} className="flex-1 h-10 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface Props { locations: Location[]; parents: Location[]; activeType: string }

export function AdminLocationsManager({ locations: init, parents, activeType }: Props) {
  const t = useTranslations('admin.locations')
  const router = useRouter()
  const [, startTransition] = useTransition()
  const tc = useTranslations('common')
  const [modal, setModal] = useState<'create' | Location | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [items, setItems] = useState(init)

  // Re-sync from server after router.refresh() delivers new props.
  useEffect(() => { setItems(init) }, [init])

  const typeLabels: Record<string, string> = {
    region: t('type_region'),
    city: t('type_city'),
    village: t('type_village'),
    district: t('type_district'),
  }

  const typeFilters: [string, string][] = [
    ['', t('filter_all')],
    ['region', t('type_region')],
    ['city', t('type_city')],
    ['village', t('type_village')],
    ['district', t('type_district')],
  ]

  function openCreate() { setModal('create') }
  function openEdit(loc: Location) { setModal(loc) }

  function handleDone() {
    setModal(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    startTransition(async () => {
      const result = await deleteLocation(deleteTarget.id)
      setDeletingId(null)
      if (result.error) { toast.error(result.error); return }
      toast.success(t('success_deleted'))
      setItems(prev => prev.filter(l => l.id !== deleteTarget!.id))
      setDeleteTarget(null)
    })
  }

  function handleToggleFeatured(loc: Location) {
    setTogglingId(loc.id)
    startTransition(async () => {
      await toggleLocationFeatured(loc.id, !loc.is_featured)
      setItems(prev => prev.map(l => l.id === loc.id ? { ...l, is_featured: !l.is_featured } : l))
      setTogglingId(null)
    })
  }

  return (
    <>
      {modal && (
        <LocationModal
          location={modal === 'create' ? undefined : modal as Location}
          parents={parents}
          onClose={() => setModal(null)}
          onDone={handleDone}
        />
      )}

      {/* Delete confirmation dialog — replaces window.confirm() */}
      {deleteTarget && (
        <Dialog open onOpenChange={v => !v && setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('delete_confirm')}</DialogTitle>
              <DialogDescription>{deleteTarget.name_al}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={!!deletingId}>
                {tc('cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={!!deletingId} className="gap-1.5">
                {!!deletingId && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
                {tc('delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map(([key, label]) => (
              <a
                key={key}
                href={`/admin/locations${key ? `?type=${key}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activeType === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
          <Button onClick={openCreate} className="gap-2 rounded-xl h-9">
            <Plus className="h-4 w-4" />
            {t('add_btn')}
          </Button>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('name_al_label')}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('name_en_label')}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('type_label')}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t('featured_col')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">{t('nothing_found')}</td></tr>
              ) : items.map((l) => (
                <tr key={l.id} className={`hover:bg-muted/20 transition-colors ${deletingId === l.id ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{l.id}</td>
                  {/* Name — primary click affordance → opens edit (K.1 canonical) */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(l)}
                        className="font-medium hover:text-primary transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                        disabled={deletingId === l.id}
                      >
                        {l.name_al}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(l)}
                        className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        title={tc('delete')}
                        disabled={deletingId === l.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{l.name_en ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {typeLabels[l.type] ?? l.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    {l.type === 'city' && (
                      togglingId === l.id
                        ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        : (
                          <button
                            onClick={() => handleToggleFeatured(l)}
                            title={t('featured_toggle_title')}
                            className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-colors ${
                              l.is_featured
                                ? 'border-badge-premium/40 text-badge-premium hover:bg-badge-premium/10'
                                : 'border-border text-muted-foreground hover:border-badge-premium/40'
                            }`}
                          >
                            <Star className={`h-3.5 w-3.5 ${l.is_featured ? 'fill-current' : ''}`} />
                          </button>
                        )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
