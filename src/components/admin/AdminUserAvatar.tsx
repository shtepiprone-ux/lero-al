'use client'

import { useRef, useState, useEffect } from 'react'
import { UserCircle2, Camera, Trash2, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadUserAvatar, removeUserAvatar } from '@/modules/admin/actions'
import { AppImage } from '@/components/ui/AppImage'

const MAX_SOURCE_BYTES = 10 * 1024 * 1024  // 10 MB — source file before crop
const MIN_DIM = 256
const VALID_MIME = ['image/jpeg', 'image/png', 'image/webp']

// Lazy crop modal — chunk loads only when user picks a file
const AvatarCropModal = dynamic(
  () => import('@/components/shared/AvatarCropModal').then(m => m.AvatarCropModal),
  { ssr: false },
)

interface Props {
  userId: string | null
  avatarUrl: string | null
  mode: 'view' | 'edit' | 'create'
  onAvatarChange: (url: string | null) => void
  // Create mode: called with the cropped Blob so the parent can upload it after
  // user creation. Called with null when the pending avatar is cleared.
  onBlobReady?: (blob: Blob | null) => void
}

async function validateSourceImage(file: File): Promise<{ w: number; h: number; error?: 'unreadable' }> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ w: 0, h: 0, error: 'unreadable' })
    }
    img.src = url
  })
}

export function AdminUserAvatar({ userId, avatarUrl, mode, onAvatarChange, onBlobReady }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(avatarUrl)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  // Track any active blob preview URL so we can revoke it on unmount.
  const blobUrlRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentUrl?.startsWith('blob:')) blobUrlRef.current = currentUrl
    else blobUrlRef.current = null
  }, [currentUrl])
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  // Editable in edit mode (with a real userId) OR in create mode (before userId exists)
  const canEdit = mode === 'create' || (mode === 'edit' && userId !== null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (mode === 'edit' && !userId) return  // edit always needs a userId
    e.target.value = ''
    setError(null)

    console.log('[AvatarFlow] file_selected', {
      route: window.location.pathname,
      mode,
      mime: file.type,
      size: file.size,
    })

    if (!VALID_MIME.includes(file.type)) {
      setError('Тільки JPG, PNG або WEBP')
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError('Максимальний розмір файлу — 10 МБ')
      return
    }
    const { w, h, error: imgError } = await validateSourceImage(file)
    if (imgError === 'unreadable') {
      setError('Не вдалося прочитати це зображення')
      return
    }
    if (w < MIN_DIM || h < MIN_DIM) {
      setError(`Зображення занадто мале — мінімум ${MIN_DIM}×${MIN_DIM} пікселів`)
      return
    }

    console.log('[AvatarFlow] file_selected', {
      route: window.location.pathname,
      mode,
      mime: file.type,
      size: file.size,
      dimensions: `${w}×${h}`,
    })

    setCropSrc(URL.createObjectURL(file))
    console.log('[AvatarFlow] crop_modal_open', { mode })
  }

  async function handleCropConfirm(blob: Blob): Promise<void> {
    console.log('[AvatarFlow] crop_save_clicked', { mode })
    console.log('[AvatarFlow] crop_blob_created', {
      mime: blob.type,
      size: blob.size,
    })

    if (mode === 'create') {
      // Create mode: no userId yet — store blob for upload after user creation.
      // Show a local blob preview so the admin can see what they selected.
      const previewUrl = URL.createObjectURL(blob)
      if (currentUrl?.startsWith('blob:')) URL.revokeObjectURL(currentUrl)
      const src = cropSrc
      setCropSrc(null)       // unmounts modal
      setCurrentUrl(previewUrl)
      onAvatarChange(previewUrl)
      onBlobReady?.(blob)
      if (src) URL.revokeObjectURL(src)
      console.log('[AvatarFlow] avatar_state_updated', {
        avatarUrl: 'blob:preview',
        previewUrl: 'blob:preview',
        pendingBlob: true,
        mode: 'create',
      })
      console.log('[AvatarFlow] modal_close_requested', { reason: 'create_preview_ready' })
      return
    }

    // Edit mode: upload immediately
    if (!userId) return
    setUploading(true)
    console.log('[AvatarFlow] upload_started', {
      route: window.location.pathname,
      mode,
      hasUserId: !!userId,
      endpoint: 'uploadUserAvatar',
    })
    try {
      const fd = new FormData()
      fd.append('avatar', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
      console.log('[AvatarFlow] upload_request_sent', { userId })
      const result = await uploadUserAvatar(userId, fd)
      console.log('[AvatarFlow] upload_response_received', {
        success: !result.error,
        payload: result,
      })
      if (result.error) {
        // BUG FIX: use toast so the error is visible ABOVE the open crop modal.
        // Previously setError() showed text below the avatar — invisible while modal is open.
        toast.error(result.error)
        return  // modal stays open for retry
      }
      const src = cropSrc
      setCropSrc(null)       // unmounts modal
      setCurrentUrl(result.url ?? null)
      onAvatarChange(result.url ?? null)
      if (src) URL.revokeObjectURL(src)
      console.log('[AvatarFlow] avatar_state_updated', {
        avatarUrl: result.url,
        previewUrl: null,
        pendingBlob: false,
        mode: 'edit',
      })
      console.log('[AvatarFlow] modal_close_requested', { reason: 'upload_success' })
    } catch (err) {
      console.log('[AvatarFlow] upload_exception', {
        error: String(err),
        stack: err instanceof Error ? err.stack : undefined,
        mode,
        userId,
      })
      // BUG FIX: toast — visible above the open modal (was setError: invisible)
      toast.error('Помилка завантаження аватара')
    } finally {
      setUploading(false)
    }
  }

  function handleCropCancel() {
    console.log('[AvatarFlow] modal_unmounted', { reason: 'cancel' })
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setError(null)
  }

  async function handleRemove() {
    if (mode === 'create') {
      // Create mode: revoke preview blob and clear pending avatar
      if (currentUrl?.startsWith('blob:')) URL.revokeObjectURL(currentUrl)
      setCurrentUrl(null)
      onAvatarChange(null)
      onBlobReady?.(null)
      return
    }

    if (!userId) return
    setRemoving(true)
    setError(null)
    const result = await removeUserAvatar(userId)
    setRemoving(false)
    if (result.error) { setError(result.error); return }
    setCurrentUrl(null)
    onAvatarChange(null)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          className={`h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center ${
            canEdit ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''
          }`}
          onClick={canEdit ? () => inputRef.current?.click() : undefined}
          title={canEdit ? 'Клікніть щоб змінити' : undefined}
        >
          {currentUrl ? (
            currentUrl.startsWith('blob:')
              ? <img src={currentUrl} alt="Avatar preview" className="w-full h-full object-cover" />
              : <AppImage src={currentUrl} variant="avatar" alt="Avatar" priority={false} />
          ) : (
            <UserCircle2 className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        {(uploading || removing) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        {canEdit && !uploading && !removing && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            title="Завантажити фото"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2 rounded-lg"
            onClick={() => inputRef.current?.click()} disabled={uploading || removing}>
            {currentUrl ? 'Замінити' : 'Завантажити'}
          </Button>
          {currentUrl && (
            <Button type="button" variant="ghost" size="sm"
              className="h-7 text-xs px-2 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={handleRemove} disabled={uploading || removing}>
              <Trash2 className="h-3 w-3 mr-1" /> Видалити
            </Button>
          )}
        </div>
      )}

      {canEdit && (
        <p className="text-[10px] text-muted-foreground text-center max-w-[130px] leading-tight">
          JPG / PNG / WEBP — буде обрізано до квадрата
        </p>
      )}

      {mode === 'create' && !currentUrl && (
        <p className="text-[10px] text-muted-foreground text-center max-w-[130px] leading-tight">
          Необов&apos;язково — можна додати після створення
        </p>
      )}

      {error && <p className="text-xs text-destructive text-center max-w-[140px]">{error}</p>}

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          title="Обрізання аватара"
          hint="Перетягніть фото для позиціонування. Стисніть або прокрутіть для збільшення."
          zoomLabel="Масштаб"
          cancelLabel="Скасувати"
          saveLabel="Зберегти"
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
