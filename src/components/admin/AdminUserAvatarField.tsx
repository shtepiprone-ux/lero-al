'use client'

import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useAdminAvatarUpload } from '@/components/admin/useAdminAvatarUpload'
import { AdminUserAvatarFieldView } from '@/components/admin/AdminUserAvatarFieldView'

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

/**
 * Container of the admin avatar field (Task 893, R3b). Same props as the legacy `AdminUserAvatar`; the upload
 * state and handlers are `useAdminAvatarUpload` (R3a), the markup is `AdminUserAvatarFieldView`, and the crop
 * modal (already Mantine) is rendered here while a source image is being cropped.
 */
export function AdminUserAvatarField({ userId, avatarUrl, mode, onAvatarChange, onBlobReady, showRemove = true }: Props) {
  const tc = useTranslations('cabinet')
  const tco = useTranslations('common')
  const {
    inputRef, uploading, removing, error, currentUrl, cropSrc, canEdit,
    handleFileChange, handleCropConfirm, handleCropCancel, handleRemove,
  } = useAdminAvatarUpload({ userId, avatarUrl, mode, onAvatarChange, onBlobReady })

  return (
    <>
      <AdminUserAvatarFieldView
        imageUrl={currentUrl}
        canEdit={canEdit}
        busy={uploading || removing}
        showRemove={showRemove}
        showOptionalHint={mode === 'create' && !currentUrl}
        error={error}
        inputRef={inputRef}
        onPick={() => inputRef.current?.click()}
        onFileChange={handleFileChange}
        onRemove={handleRemove}
      />
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
    </>
  )
}
