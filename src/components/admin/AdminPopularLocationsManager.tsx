'use client'

import { useState, useTransition, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { Plus, Loader2, MapPin, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppImage } from '@/components/ui/AppImage'
import { Combobox } from '@/components/shared/Combobox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Location } from '@/types/database'
import {
  setLocationFeatured,
  setLocationUnfeatured,
} from '@/modules/locations/actions/popularLocationActions'

interface Props {
  featured: Location[]
  allCities: Location[]
}

// ── Photo upload helper ───────────────────────────────────────────────────────

async function uploadPhoto(locationId: number, file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append('photo', file)
  fd.append('locationId', String(locationId))
  try {
    const res = await fetch('/api/upload-popular-location-photo', { method: 'POST', body: fd })
    const data = await res.json() as { url?: string; error?: string }
    return data.url ?? null
  } catch {
    return null
  }
}

// ── Edit / Add Dialog ─────────────────────────────────────────────────────────

function LocationDialog({
  location,
  allCities,
  onClose,
  onDone,
}: {
  location?: Location
  allCities: Location[]
  onClose: () => void
  onDone: () => void
}) {
  const t = useTranslations('admin.popular_locations')
  const tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!location
  const unfeaturedCities = allCities.filter(c => !c.is_featured || c.id === location?.id)

  const [selectedId, setSelectedId] = useState<string>(location ? String(location.id) : '')
  const [displayOrder, setDisplayOrder] = useState(location?.display_order ?? 1)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const cityOptions = (isEdit ? allCities : unfeaturedCities).map(c => ({
    value: String(c.id),
    label: c.name_al + (c.name_en ? ` / ${c.name_en}` : ''),
  }))

  function handlePhotoSelect(file: File) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) { toast.error(t('photo_invalid_type')); return }
    if (file.size > 5 * 1024 * 1024) { toast.error(t('photo_too_large')); return }
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleSave() {
    const locId = Number(selectedId)
    if (!locId) { toast.error(t('pick_location_required')); return }

    startTransition(async () => {
      const result = await setLocationFeatured(locId, displayOrder)
      if (result.error) { toast.error(t('error_save_failed')); return }

      if (photoFile) {
        setUploading(true)
        const url = await uploadPhoto(locId, photoFile)
        setUploading(false)
        if (!url) toast.error(t('photo_upload_failed'))
      }

      toast.success(t('saved'))
      onDone()
    })
  }

  function handleRemove() {
    const locId = Number(selectedId)
    startTransition(async () => {
      const result = await setLocationUnfeatured(locId)
      if (result.error) { toast.error(t('error_remove_failed')); return }
      toast.success(t('removed'))
      onDone()
    })
  }

  if (showDeleteConfirm) {
    return (
      <Dialog open onOpenChange={open => { if (!open) setShowDeleteConfirm(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('remove_confirm_title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('remove_confirm_body')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isPending}>
              {tc('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isPending} className="gap-1.5">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('confirm_remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_dialog_title') : t('add_dialog_title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Location picker */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('pick_location')}</Label>
            <Combobox
              options={cityOptions}
              value={selectedId}
              onChange={setSelectedId}
              placeholder={t('pick_location')}
              disabled={isEdit}
            />
          </div>

          {/* Display order */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display-order">{t('display_order')}</Label>
            <Input
              id="display-order"
              type="number"
              min={1}
              value={displayOrder}
              onChange={e => setDisplayOrder(Number(e.target.value))}
              className="w-24"
            />
          </div>

          {/* Photo */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('photo')}</Label>
            <div className="flex items-center gap-3">
              {(photoPreview ?? (isEdit && location?.image_url)) && (
                <AppImage
                  variant="listing-thumb"
                  src={photoPreview ?? location?.image_url ?? ''}
                  alt=""
                  className="h-16 w-24 rounded-lg overflow-hidden shrink-0 object-cover"
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
                className="gap-1.5"
              >
                <ImagePlus className="h-4 w-4" />
                {t('upload_photo')}
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f) }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          {isEdit && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
            >
              {t('remove')}
            </Button>
          )}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending || uploading}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isPending || uploading} className="gap-1.5">
              {(isPending || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
              {tc('save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

export function AdminPopularLocationsManager({ featured, allCities }: Props) {
  const t = useTranslations('admin.popular_locations')
  const rows = featured
  const [addOpen, setAddOpen] = useState(false)
  const [editLocation, setEditLocation] = useState<Location | null>(null)

  function handleDone() {
    setAddOpen(false)
    setEditLocation(null)
    // Page will revalidate; reload to pick up new data
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header action */}
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t('add')}
        </Button>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t('no_locations')}</p>
      ) : (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{t('col_name')}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">{t('col_order')}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">{t('col_photo')}</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .slice()
                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map(loc => (
                  <tr
                    key={loc.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Clickable primary text → edit Dialog (§11 canonical) */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors text-left"
                        onClick={() => setEditLocation(loc)}
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{loc.name_al}</span>
                        {loc.name_en && (
                          <span className="text-muted-foreground font-normal hidden sm:inline">
                            / {loc.name_en}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      #{loc.display_order}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {loc.image_url ? (
                        <AppImage
                          variant="listing-thumb"
                          src={loc.image_url}
                          alt={loc.name_al}
                          className="h-10 w-16 rounded-md overflow-hidden object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      {addOpen && (
        <LocationDialog
          allCities={allCities}
          onClose={() => setAddOpen(false)}
          onDone={handleDone}
        />
      )}
      {editLocation && (
        <LocationDialog
          location={editLocation}
          allCities={allCities}
          onClose={() => setEditLocation(null)}
          onDone={handleDone}
        />
      )}
    </div>
  )
}
