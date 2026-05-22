'use client'

import { useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { AppImage } from '@/components/ui/AppImage'
import { CldUploadWidget } from 'next-cloudinary'
import type { CloudinaryUploadWidgetResults } from 'next-cloudinary'
import {
  ImagePlus, Trash2, Star, ChevronUp, ChevronDown, Camera,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const MAX_IMAGES = 20

export interface ListingImage {
  url: string
  public_id: string
  is_cover: boolean
  order: number
}

interface Props {
  images: ListingImage[]
  onChange: (images: ListingImage[]) => void
  uploadPreset: string
  /** Cloudinary folder path for new uploads. See docs/integrations.md §Cloudinary folder tree.
   *  Create: `<userId>/listings`  |  Edit: `<userId>/listings/<listingId>` */
  uploadFolder: string
  maxImages?: number
  disabled?: boolean
}

export function ImageUpload({ images, onChange, uploadPreset, uploadFolder, maxImages = MAX_IMAGES, disabled }: Props) {
  const t = useTranslations('listing')

  const canUploadMore = images.length < maxImages

  // Refs to fix stale closure: each upload session snapshots the base images
  // and accumulates new ones without depending on the React render cycle.
  const sessionBaseRef = useRef<ListingImage[]>([])
  const sessionNewRef = useRef<ListingImage[]>([])
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const handleUpload = useCallback((result: CloudinaryUploadWidgetResults) => {
    if (result.event !== 'success' || !result.info || typeof result.info === 'string') return
    const info = result.info
    const total = sessionBaseRef.current.length + sessionNewRef.current.length
    const newImage: ListingImage = {
      url: info.secure_url,
      public_id: info.public_id,
      is_cover: total === 0,
      order: total,
    }
    sessionNewRef.current = [...sessionNewRef.current, newImage]
    onChangeRef.current([...sessionBaseRef.current, ...sessionNewRef.current])
  }, [])

  function setCover(publicId: string) {
    onChange(images.map(img => ({ ...img, is_cover: img.public_id === publicId })))
  }

  function remove(publicId: string) {
    const updated = images
      .filter(img => img.public_id !== publicId)
      .map((img, i) => ({ ...img, order: i }))

    // if we removed the cover, assign to first remaining
    const hasCover = updated.some(img => img.is_cover)
    if (!hasCover && updated.length > 0) updated[0].is_cover = true

    onChange(updated)
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...images]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next.map((img, i) => ({ ...img, order: i })))
  }

  function moveDown(index: number) {
    if (index === images.length - 1) return
    const next = [...images]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next.map((img, i) => ({ ...img, order: i })))
  }

  return (
    <div className="image-upload flex flex-col gap-4">

      {/* Grid of uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, index) => (
            // AppImage owns the aspect-[4/3] container; extra classes go via className
            <AppImage
              key={img.public_id}
              variant="upload"
              src={img.url}
              alt=""
              className={cn(
                'group rounded-xl border-2 transition-colors',
                img.is_cover ? 'border-primary' : 'border-transparent',
              )}
            >
              {/* Cover badge */}
              {img.is_cover && (
                <Badge variant="default" className="absolute top-2 left-2 text-[10px] px-1.5 py-0 h-5 gap-1">
                  <Star className="h-2.5 w-2.5" />
                  {t('cover_photo')}
                </Badge>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-overlay/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                {/* Top row: set cover */}
                <div className="flex justify-end">
                  {!img.is_cover && (
                    <button
                      type="button"
                      onClick={() => setCover(img.public_id)}
                      aria-label={t('set_as_cover')}
                      className="h-7 w-7 rounded-lg bg-card/90 hover:bg-card flex items-center justify-center transition-colors"
                    >
                      <Star className="h-3.5 w-3.5 text-primary" />
                    </button>
                  )}
                </div>

                {/* Bottom row: reorder + delete */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      aria-label={t('reorder_up')}
                      className="h-7 w-7 rounded-lg bg-card/90 hover:bg-card flex items-center justify-center disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === images.length - 1}
                      aria-label={t('reorder_down')}
                      className="h-7 w-7 rounded-lg bg-card/90 hover:bg-card flex items-center justify-center disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(img.public_id)}
                    aria-label={t('remove_photo')}
                    className="h-7 w-7 rounded-lg bg-destructive/90 hover:bg-destructive flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                  </button>
                </div>
              </div>

              {/* Order number */}
              <span className="absolute bottom-2 left-2 h-5 w-5 rounded-full bg-overlay/60 text-overlay-foreground text-[10px] font-bold flex items-center justify-center">
                {index + 1}
              </span>
            </AppImage>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canUploadMore && !disabled && (
        <CldUploadWidget
          uploadPreset={uploadPreset}
          options={{
            maxFiles: maxImages - images.length,
            multiple: true,
            resourceType: 'image',
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
            maxFileSize: 10_000_000, // 10 MB
            cropping: false,
            folder: uploadFolder,
          }}
          onSuccess={handleUpload}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => {
                sessionBaseRef.current = images
                sessionNewRef.current = []
                open()
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border',
                'text-muted-foreground hover:border-primary/50 hover:text-primary',
                'transition-colors cursor-pointer w-full',
                images.length === 0 ? 'py-16' : 'py-8',
              )}
            >
              {images.length === 0 ? (
                <>
                  <Camera className="h-10 w-10 opacity-40" />
                  <div className="text-center">
                    <p className="font-medium text-sm">{t('upload_photos')}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {t('photos_hint', { max: maxImages })}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('add_more_photos')}</span>
                  <span className="text-xs opacity-60">({images.length}/{maxImages})</span>
                </div>
              )}
            </button>
          )}
        </CldUploadWidget>
      )}

      {/* Max reached message */}
      {!canUploadMore && (
        <p className="text-xs text-muted-foreground text-center py-2">
          {t('photos_hint', { max: maxImages })}
        </p>
      )}
    </div>
  )
}
