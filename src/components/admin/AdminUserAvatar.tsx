'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { UserCircle2, Camera, Trash2, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { removeUserAvatar } from '@/modules/admin/actions'
import { AppImage } from '@/components/ui/AppImage'

const MAX_SOURCE_BYTES = 10 * 1024 * 1024  // 10 MB — source before crop
const MIN_DIM = 256
const VALID_MIME = ['image/jpeg', 'image/png', 'image/webp']

const AvatarCropModal = dynamic(
  () => import('@/components/shared/AvatarCropModal').then(m => m.AvatarCropModal),
  { ssr: false },
)

interface Props {
  userId: string | null
  avatarUrl: string | null
  mode: 'view' | 'edit' | 'create'
  onAvatarChange: (url: string | null) => void
  onBlobReady?: (blob: Blob | null) => void
  /** Hide the remove-avatar button. Use for non-admin contexts where removal requires a different action. */
  showRemove?: boolean
}

async function validateSourceImage(file: File): Promise<{ w: number; h: number; error?: 'unreadable' }> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ w: 0, h: 0, error: 'unreadable' }) }
    img.src = url
  })
}

export function AdminUserAvatar({ userId, avatarUrl, mode, onAvatarChange, onBlobReady, showRemove = true }: Props) {
  const tc = useTranslations('cabinet')
  const tco = useTranslations('common')
  const tu = useTranslations('admin.users')
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(avatarUrl)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const blobUrlRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentUrl?.startsWith('blob:')) blobUrlRef.current = currentUrl
    else blobUrlRef.current = null
  }, [currentUrl])
  useEffect(() => () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current) }, [])

  const canEdit = mode === 'create' || (mode === 'edit' && userId !== null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (mode === 'edit' && !userId) return
    e.target.value = ''
    setError(null)

    if (!VALID_MIME.includes(file.type)) { setError(tc('avatar_error_type')); return }
    if (file.size > MAX_SOURCE_BYTES) { setError(tc('avatar_error_size')); return }
    const { w, h, error: imgError } = await validateSourceImage(file)
    if (imgError === 'unreadable') { setError(tc('avatar_error_unreadable')); return }
    if (w < MIN_DIM || h < MIN_DIM) { setError(tc('avatar_error_too_small')); return }

    console.log('[AvatarFlow] file_selected', { route: window.location.pathname, mode, mime: file.type, size: file.size, dimensions: `${w}×${h}` })
    setCropSrc(URL.createObjectURL(file))
    console.log('[AvatarFlow] crop_modal_open', { mode })
  }

  async function handleCropConfirm(blob: Blob): Promise<void> {
    console.log('[AvatarFlow] crop_save_clicked', { mode })
    console.log('[AvatarFlow] crop_blob_created', { mime: blob.type, size: blob.size, width: 256, height: 256 })

    if (mode === 'create') {
      const previewUrl = URL.createObjectURL(blob)
      if (currentUrl?.startsWith('blob:')) URL.revokeObjectURL(currentUrl)
      const src = cropSrc
      setCropSrc(null)
      setCurrentUrl(previewUrl)
      onAvatarChange(previewUrl)
      onBlobReady?.(blob)
      if (src) URL.revokeObjectURL(src)
      console.log('[AvatarFlow] avatar_state_updated', { mode: 'create', pendingBlob: true })
      return
    }

    if (!userId) return
    setUploading(true)
    console.log('[AvatarFlow] upload_started', { route: window.location.pathname, mode, hasUserId: true, endpoint: '/api/upload-avatar' })

    try {
      const fd = new FormData()
      fd.append('avatar', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
      fd.append('userId', userId)
      console.log('[AvatarFlow] upload_request_sent', { userId })

      const res = await fetch('/api/upload-avatar', { method: 'POST', body: fd })
      const result = await res.json() as { url?: string; error?: string }
      console.log('[AvatarFlow] upload_response_received', { success: !result.error, payload: result })

      if (result.error) {
        toast.error(tc('avatar_upload_error'))
        console.log('[AvatarFlow] upload_failed', { reason: result.error })
        return
      }

      const src = cropSrc
      setCropSrc(null)
      setCurrentUrl(result.url ?? null)
      onAvatarChange(result.url ?? null)
      if (src) URL.revokeObjectURL(src)
      console.log('[AvatarFlow] avatar_state_updated', { avatarUrl: result.url, mode: 'edit' })
    } catch (err) {
      console.log('[AvatarFlow] upload_exception', { error: String(err), stack: err instanceof Error ? err.stack : undefined })
      toast.error(tc('avatar_upload_error'))
    } finally {
      setUploading(false)
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setError(null)
  }

  async function handleRemove() {
    if (mode === 'create') {
      if (currentUrl?.startsWith('blob:')) URL.revokeObjectURL(currentUrl)
      setCurrentUrl(null); onAvatarChange(null); onBlobReady?.(null)
      return
    }
    if (!userId) return
    setRemoving(true); setError(null)
    const result = await removeUserAvatar(userId)
    setRemoving(false)
    if (result.error) { setError(tc('error_deleting')); return }
    setCurrentUrl(null); onAvatarChange(null)
  }

  return (
    <div data-testid="admin-user-avatar" className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          className={`h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center ${canEdit ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''}`}
          onClick={canEdit ? () => inputRef.current?.click() : undefined}
          title={canEdit ? tu('avatar_click_to_change') : undefined}
        >
          {currentUrl ? (
            <AppImage
              variant="listing-thumb"
              src={currentUrl}
              alt={tu('avatar_preview_alt')}
            />
          ) : (
            <UserCircle2 className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        {(uploading || removing) && (
          <div className="absolute inset-0 flex items-center justify-center bg-overlay/30 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        {canEdit && !uploading && !removing && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors p-0"
            title={tu('avatar_upload_photo')}
          >
            <Camera className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-2 max-sm:w-full">
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2 rounded-lg"
            onClick={() => inputRef.current?.click()} disabled={uploading || removing}>
            {currentUrl ? tc('avatar_replace') : tc('avatar_upload')}
          </Button>
          {showRemove && currentUrl && (
            <Button type="button" variant="ghost" size="sm"
              className="h-7 text-xs px-2 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={handleRemove} disabled={uploading || removing}>
              <Trash2 className="h-3 w-3 mr-1" /> {tc('avatar_remove')}
            </Button>
          )}
        </div>
      )}

      {canEdit && (
        <p className="text-2xs text-muted-foreground text-center max-w-[130px] leading-tight"> {/* design-tokens-allow: max-w-[130px] — 130px off-grid (130/4=32.5, no integer spacing utility) */}
          {tc('avatar_hint')}
        </p>
      )}
      {mode === 'create' && !currentUrl && (
        <p className="text-2xs text-muted-foreground text-center max-w-[130px] leading-tight"> {/* design-tokens-allow: max-w-[130px] — 130px off-grid (130/4=32.5, no integer spacing utility) */}
          {tu('avatar_optional_hint')}
        </p>
      )}
      {error && <p className="text-xs text-destructive text-center max-w-35">{error}</p>}

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          title={tc('avatar_crop_title')}
          hint={tc('avatar_crop_hint')}
          zoomLabel={tc('avatar_zoom_label')}
          cancelLabel={tco('cancel')}
          saveLabel={tco('save')}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
