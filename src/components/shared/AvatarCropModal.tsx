'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

// ── Canvas crop helper ────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function cropImageToBlob(src: string, pixelCrop: Area): Promise<Blob> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 256, 256)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => { if (blob) resolve(blob); else reject(new Error('toBlob returned null')) },
      'image/jpeg',
      0.92,
    )
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
//
// onConfirm: async — the modal awaits the full upload before resetting its
// loading state. The parent MUST resolve (not reject) on upload error and
// handle error display itself (toast, inline), so the modal stays open for
// retry. Parent resolves on success after clearing cropSrc — the modal then
// unmounts naturally.

export interface AvatarCropModalProps {
  imageSrc: string
  title: string
  hint: string
  zoomLabel: string
  cancelLabel: string
  saveLabel: string
  onConfirm: (blob: Blob) => Promise<void>
  onCancel: () => void
}

export function AvatarCropModal({
  imageSrc, title, hint, zoomLabel, cancelLabel, saveLabel,
  onConfirm, onCancel,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleSave() {
    if (!croppedAreaPixels || saving) return
    setSaving(true)
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels)
      // Await the full upload. Parent resolves on both success and error,
      // handling its own error display. On success the parent clears cropSrc,
      // unmounting this modal. On error the modal stays open for retry.
      await onConfirm(blob)
    } catch {
      // cropImageToBlob failed (canvas unavailable, toBlob null, etc.) — rare.
      // Parent-level errors are always caught by the parent and resolve normally.
    } finally {
      // Always reset: handles the unmounted-component case silently in React 18+.
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving) onCancel() }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Crop area — react-easy-crop fills the relative container */}
          <div
            className="relative h-72 w-full rounded-xl overflow-hidden bg-muted"
            role="application"
            aria-label="Avatar crop area; drag to position"
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              minZoom={1}
              maxZoom={3}
              restrictPosition
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={false}
            />
          </div>

          {/* Zoom slider */}
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            aria-label={zoomLabel}
            className="w-full cursor-pointer accent-primary"
          />

          {/* Hint text */}
          <p className="text-xs text-muted-foreground text-center">{hint}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
