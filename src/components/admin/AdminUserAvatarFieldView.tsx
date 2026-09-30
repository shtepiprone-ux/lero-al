'use client'

import type { ChangeEvent, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { ActionIcon, Avatar, Box, Button, Loader, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import { Camera, Trash2, UserCircle2 } from 'lucide-react'
import { AppImage } from '@/design-system/media/AppImage'

export interface AdminUserAvatarFieldViewProps {
  /** The avatar (a URL, or a `blob:` preview while a create-mode upload is pending); `null` shows the placeholder. */
  imageUrl: string | null
  /** Edit or create with an owner id: the avatar, the camera and the replace/remove buttons are interactive. */
  canEdit: boolean
  /** Uploading or removing: a `Loader` replaces the image and every control is disabled. */
  busy: boolean
  showRemove: boolean
  /** Create mode, no image yet: show the "optional, can be added after creation" hint. */
  showOptionalHint: boolean
  error: string | null
  inputRef: RefObject<HTMLInputElement | null>
  onPick: () => void
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}

/**
 * Presentational View of the admin avatar field (Task 893, R3b; Container/Presentational split — the container
 * `AdminUserAvatarField` owns the upload state through `useAdminAvatarUpload` and the crop modal). Composes the
 * Mantine `Avatar` (pill radius, `xl`), a camera `ActionIcon`, and `Button`s. The column is `min-content` wide,
 * so the two hints wrap inside the avatar/button column instead of setting its width.
 */
export function AdminUserAvatarFieldView({
  imageUrl,
  canEdit,
  busy,
  showRemove,
  showOptionalHint,
  error,
  inputRef,
  onPick,
  onFileChange,
  onRemove,
}: AdminUserAvatarFieldViewProps) {
  const tc = useTranslations('cabinet')
  const tu = useTranslations('admin.users')
  const theme = useMantineTheme()

  const avatar = (
    <Avatar size="xl" color="gray">
      {busy ? (
        <Loader size="sm" />
      ) : imageUrl ? (
        <AppImage variant="listing-thumb" src={imageUrl} alt={tu('avatar_preview_alt')} />
      ) : (
        <UserCircle2 size={theme.other.iconSize.hero} />
      )}
    </Avatar>
  )

  return (
    <Stack data-testid="admin-user-avatar" align="center" gap="xs" w="min-content">
      <Box pos="relative">
        {canEdit ? (
          <UnstyledButton type="button" aria-label={tu('avatar_click_to_change')} disabled={busy} onClick={onPick}>
            {avatar}
          </UnstyledButton>
        ) : (
          avatar
        )}
        {canEdit && !busy && (
          <ActionIcon
            type="button"
            variant="filled"
            color="brand"
            radius="pill"
            pos="absolute"
            bottom={0}
            right={0}
            aria-label={tu('avatar_upload_photo')}
            onClick={onPick}
          >
            <Camera size={theme.other.iconSize.compact} />
          </ActionIcon>
        )}
      </Box>

      {canEdit && (
        <Stack gap="xs" align="stretch" w="100%">
          <Button type="button" variant="default" size="sm" disabled={busy} onClick={onPick}>
            {imageUrl ? tc('avatar_replace') : tc('avatar_upload')}
          </Button>
          {showRemove && imageUrl && (
            <Button
              type="button"
              variant="subtle"
              color="red"
              size="sm"
              leftSection={<Trash2 size={theme.other.iconSize.compact} />}
              disabled={busy}
              onClick={onRemove}
            >
              {tc('avatar_remove')}
            </Button>
          )}
        </Stack>
      )}

      {canEdit && (
        <Text size="xs" c="dimmed" ta="center">
          {tc('avatar_hint')}
        </Text>
      )}
      {showOptionalHint && (
        <Text size="xs" c="dimmed" ta="center">
          {tu('avatar_optional_hint')}
        </Text>
      )}
      {error && (
        <Text size="xs" c="red" ta="center">
          {error}
        </Text>
      )}

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" hidden onChange={onFileChange} />
    </Stack>
  )
}
