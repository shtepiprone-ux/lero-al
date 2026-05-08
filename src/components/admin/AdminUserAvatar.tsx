'use client'

import { useRef, useState } from 'react'
import { UserCircle2, Camera, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadUserAvatar, removeUserAvatar } from '@/modules/admin/actions'

interface Props {
  userId: string | null   // null in create mode — no upload until user is saved
  avatarUrl: string | null
  mode: 'view' | 'edit' | 'create'
  onAvatarChange: (url: string | null) => void
}

export function AdminUserAvatar({ userId, avatarUrl, mode, onAvatarChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(avatarUrl)

  const canEdit = mode === 'edit' && userId !== null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    e.target.value = ''
    setError(null)

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) { setError('Тільки JPG, PNG або WEBP'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Максимальний розмір — 5 МБ'); return }

    setUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    const result = await uploadUserAvatar(userId, fd)
    setUploading(false)

    if (result.error) { setError(result.error); return }
    if (result.url) { setCurrentUrl(result.url); onAvatarChange(result.url) }
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
            <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
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

      {mode === 'create' && (
        <p className="text-xs text-muted-foreground text-center max-w-[120px]">
          Аватар можна додати після збереження
        </p>
      )}

      {error && <p className="text-xs text-destructive text-center max-w-[120px]">{error}</p>}

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
