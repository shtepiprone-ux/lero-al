'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { removeUserAvatar } from '@/modules/admin/actions'

const MAX_SOURCE_BYTES = 10 * 1024 * 1024  // 10 MB — source before crop
const MIN_DIM = 256
const VALID_MIME = ['image/jpeg', 'image/png', 'image/webp']

export interface UseAdminAvatarUploadArgs {
  userId: string | null
  avatarUrl: string | null
  mode: 'view' | 'edit' | 'create'
  onAvatarChange: (url: string | null) => void
  onBlobReady?: (blob: Blob | null) => void
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

/**
 * Task 893 (R3a) — every piece of state and every handler of the admin avatar flow (checks, crop, upload, remove,
 * blob-URL cleanup, the `[AvatarFlow]` logs), moved out of `AdminUserAvatar` unchanged so the legacy markup
 * (`/cabinet`'s `ProfileTab`) and the new `AdminUserAvatarField` share one implementation. It returns what the
 * markup reads.
 */
export function useAdminAvatarUpload({ userId, avatarUrl, mode, onAvatarChange, onBlobReady }: UseAdminAvatarUploadArgs) {
  const tc = useTranslations('cabinet')
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
    console.log('[AvatarFlow] crop_blob_created', { mime: blob.type, size: blob.size, width: 256, height: 256 }) // design-tokens-allow: width: 256 — console.log payload field describing the cropped blob's pixel size, not a style value // design-tokens-allow: height: 256 — console.log payload field describing the cropped blob's pixel size, not a style value

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

  return {
    inputRef,
    uploading,
    removing,
    error,
    currentUrl,
    cropSrc,
    canEdit,
    handleFileChange,
    handleCropConfirm,
    handleCropCancel,
    handleRemove,
  }
}
