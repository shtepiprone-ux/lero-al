'use client'

import { useTranslations } from 'next-intl'
import { UserCircle2, Camera, Trash2, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { AppImage } from '@/design-system/media/AppImage'
import { cn } from '@/lib/utils'
import { useAdminAvatarUpload } from '@/components/admin/useAdminAvatarUpload'
import styles from './AdminUserAvatar.module.css'

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

export function AdminUserAvatar({ userId, avatarUrl, mode, onAvatarChange, onBlobReady, showRemove = true }: Props) {
  const tc = useTranslations('cabinet')
  const tco = useTranslations('common')
  const tu = useTranslations('admin.users')
  // Task 893 (R3a): state and handlers live in the shared hook; the markup below is unchanged.
  const {
    inputRef, uploading, removing, error, currentUrl, cropSrc, canEdit,
    handleFileChange, handleCropConfirm, handleCropCancel, handleRemove,
  } = useAdminAvatarUpload({ userId, avatarUrl, mode, onAvatarChange, onBlobReady })

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
          <div className={cn(styles.spinnerOverlay, 'absolute inset-0 flex items-center justify-center rounded-full')}>
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
