'use client'

import { useRef, useState } from 'react'
import { UserCircle2, Camera, Trash2, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
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

export function AdminUserAvatar({ userId, avatarUrl, mode, onAvatarChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(avatarUrl)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const canEdit = mode === 'edit' && userId !== null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    e.target.value = ''
    setError(null)

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

    setCropSrc(URL.createObjectURL(file))
  }

  async function handleCropConfirm(blob: Blob) {
    if (!userId) return
    setUploading(true)
    const fd = new FormData()
    fd.append('avatar', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
    const result = await uploadUserAvatar(userId, fd)
    setUploading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    URL.revokeObjectURL(cropSrc!)
    setCropSrc(null)
    if (result.url) { setCurrentUrl(result.url); onAvatarChange(result.url) }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setError(null)
  }

  async function handleRemove() {
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
            <AppImage
              src={currentUrl}
              variant="avatar"
              alt="Avatar"
              priority={false}
            />
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

      {mode === 'create' && (
        <p className="text-xs text-muted-foreground text-center max-w-[120px]">
          Аватар можна додати після збереження
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
          uploading={uploading}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
