'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslations } from 'next-intl'
import { ActionIcon, Button, Card, Group, Input, SimpleGrid, Stack, Text, useMantineTheme } from '@mantine/core'
import { AppImage } from '@/design-system/media/AppImage'
import {
  ImagePlus, Star, ChevronUp, ChevronDown, Camera,
} from 'lucide-react'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'
import { MantineDeleteIconButton } from '@/design-system/mantine/patterns/MantineDeleteIconButton'
import { MantineProgress } from '@/design-system/mantine/patterns/MantineProgress'
import { toast } from '@/lib/toast'
import type { CloudinaryWidgetConfig } from '@/modules/listings/lib/cloudinaryWidgetConfig'
import { ACCEPTED_INPUT_TYPES } from '@/modules/listings/lib/photoPipeline'
import { createUploadQueue, type PendingPhoto } from '@/modules/listings/lib/uploadQueue'
import type { UploadFailure } from '@/modules/listings/lib/uploadFailure'

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
  /** The listing being edited, when there is one: its photos go into the listing owner's folder `<owner>/listings/<uuid>/`; without it into `<you>/listings/<uuid>/` (the server decides, never the browser). */
  listingId?: string
  /** No longer read (Task 1038: photos go to R2, not through the Cloudinary widget); the page still passes it until Task 1043 retires the chain. */
  cloudinary?: CloudinaryWidgetConfig
  maxImages?: number
  /** The form is being saved (Task 957 Revision 2, R2-7): the upload button and every photo control are disabled, so the photos cannot change after the payload was read. */
  disabled?: boolean
  /** Stories only: tiles drawn as if they were in the queue (processing, uploading, failed); nothing is uploaded. */
  pendingPreview?: readonly PendingPhoto[]
}

/** The text of each reason a photo is not uploaded (Task 957 Revision 3, owner decision O997-2): one `listing.upload_error_<kind>` per `UploadFailure`, in four locales. */
const FAILURE_MESSAGE_KEY = {
  session: 'upload_error_session',
  forbidden: 'upload_error_forbidden',
  rate_limited: 'upload_error_rate_limited',
  rate_limited_day: 'upload_error_rate_limited_day',
  not_configured: 'upload_error_not_configured',
  unavailable: 'upload_error_unavailable',
  network: 'upload_error_network',
  too_large: 'upload_error_too_large',
  format: 'upload_error_format',
  rejected: 'upload_error_rejected',
  provider_busy: 'upload_error_provider_busy',
  failed: 'upload_error_failed',
  processing: 'upload_error_processing',
} as const satisfies Record<UploadFailure, string>

/** the form's photo for an address the queue finished: the stored object's path is its stable key, the first photo is the cover */
function toListingImage(publicUrl: string, order: number): ListingImage {
  let publicId = publicUrl
  try {
    publicId = new URL(publicUrl).pathname.replace(/^\//, '')
  } catch {
    publicId = publicUrl
  }
  return { url: publicUrl, public_id: publicId, is_cover: order === 0, order }
}

export function ImageUpload({ images, onChange, listingId, maxImages = MAX_IMAGES, disabled = false, pendingPreview }: Props) {
  const t = useTranslations('listing')
  const theme = useMantineTheme()
  const icon = theme.other.iconSize
  const inputRef = useRef<HTMLInputElement>(null)

  // The photos the person chose are processed in the browser and uploaded straight to R2 by the queue (Task 1038); a finished photo joins `images`, a failed one stays as a tile with its reason.
  const [pending, setPending] = useState<readonly PendingPhoto[]>([])
  const [queue] = useState(() => createUploadQueue({ listingId, onChange: setPending }))
  const shown = pendingPreview ?? pending

  // Refs to fix stale closure: photos that finish between two renders accumulate on the latest list, not on the one of the last render.
  const imagesRef = useRef(images)
  const onChangeRef = useRef(onChange)
  const attachedRef = useRef(new Set<string>())
  useEffect(() => {
    imagesRef.current = images
    onChangeRef.current = onChange
  })

  useEffect(() => {
    // while the form is saved the photos cannot change: a photo that finishes then joins when the form is editable again
    if (disabled) return
    for (const photo of pending) {
      if (photo.state !== 'done' || !photo.publicUrl || attachedRef.current.has(photo.id)) continue
      attachedRef.current.add(photo.id)
      const next = [...imagesRef.current, toListingImage(photo.publicUrl, imagesRef.current.length)]
      imagesRef.current = next
      onChangeRef.current(next)
      queue.remove(photo.id)
    }
  }, [pending, disabled, queue])

  const used = images.length + shown.length
  const canUploadMore = used < maxImages

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? [])
    event.target.value = ''   // the same file can be chosen again
    if (chosen.length === 0) return
    const room = Math.max(0, maxImages - used)
    if (chosen.length > room) toast.error(t('upload_widget_max_files'))
    queue.add(chosen.slice(0, room))
  }

  function openFileChooser() {
    inputRef.current?.click()
  }

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

  // one trigger, one look: the empty state and the add-more state are the same default Button, its label the Button's own text; the hint sits under it as the limit message does
  const triggerButton = () => used === 0 ? (
    <Stack gap="xs">
      <Button type="button" variant="default" fullWidth onClick={disabled ? undefined : openFileChooser} disabled={disabled} leftSection={<Camera size={icon.roomy} />}>
        {t('upload_photos')}
      </Button>
      <Input.Description>{t('photos_hint', { max: maxImages })}</Input.Description>
    </Stack>
  ) : (
    <Button type="button" variant="default" fullWidth onClick={disabled ? undefined : openFileChooser} disabled={disabled} leftSection={<ImagePlus size={icon.roomy} />}>
      {t('add_more_photos')} ({used}/{maxImages})
    </Button>
  )

  return (
    <Stack gap="md" data-testid="image-upload">

      {/* Grid of photos: two columns on a phone, three from 640px, four from 768px (the layout the form had); the photos still being made or uploaded, or that failed, follow the stored ones */}
      {used > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {images.map((img, index) => {
            const n = index + 1
            return (
              // the theme owns the Card's radius and border colour (`withBorder` shows it) and, for the cover tile, the selected look (`variant="selected"`: the 2px primary border `main` drew,
              // Revision 3, F22); the cover mark is the canonical `photoMark` badge on the image; AppImage owns the 4:3 container
              <Card key={img.public_id} p={0} withBorder variant={img.is_cover ? 'selected' : undefined}>
                <AppImage variant="upload" src={img.url} alt="">
                  {/* on the photo, always visible (a phone has no hover): the number and the cover mark top left, both the same pill (owner, 2026-11-21: the number is the size of the Cover pill; a `circle`
                      badge keeps width == height and has none of the pill's padding and height (`theme.ts` Badge `styles`); the mark wraps under the number on a narrow tile), and top right the
                      set-as-cover control (a white chip with the star in the primary colour, none on the cover tile) and then delete (filled red), as `main` drew them (owner decisions O957-7, O957-8) */}
                  <Group pos="absolute" inset={0} p="xs" align="flex-start" justify="space-between" wrap="nowrap">
                    <Group gap="xs" align="flex-start" wrap="wrap" flex={1} miw={0}>
                      <MantineBadge variant="count">{n}</MantineBadge>
                      {img.is_cover && (
                        <MantineBadge variant="status" entity="photoMark" value="cover">
                          {t('cover_photo')}
                        </MantineBadge>
                      )}
                    </Group>
                    <Group gap="tight" wrap="nowrap" flex="none">
                      {!img.is_cover && (
                        <ActionIcon type="button" variant="white" size="lg" mih={theme.other.touchTarget} miw={theme.other.touchTarget} onClick={() => setCover(img.public_id)} disabled={disabled} aria-label={t('set_as_cover', { n })}>
                          <Star size={icon.compact} />
                        </ActionIcon>
                      )}
                      <MantineDeleteIconButton onMedia label={t('remove_photo', { n })} onClick={() => remove(img.public_id)} disabled={disabled} />
                    </Group>
                  </Group>
                </AppImage>

                {/* under the photo, one row on every tile at every width: order up and down, each half of the tile's width */}
                <Group grow gap="tight" wrap="nowrap" p="xs">
                  <ActionIcon type="button" variant="default" size="lg" mih={theme.other.touchTarget} miw={theme.other.touchTarget} onClick={() => moveUp(index)} disabled={disabled || index === 0} aria-label={t('reorder_up', { n })}>
                    <ChevronUp size={icon.compact} />
                  </ActionIcon>
                  <ActionIcon type="button" variant="default" size="lg" mih={theme.other.touchTarget} miw={theme.other.touchTarget} onClick={() => moveDown(index)} disabled={disabled || index === images.length - 1} aria-label={t('reorder_down', { n })}>
                    <ChevronDown size={icon.compact} />
                  </ActionIcon>
                </Group>
              </Card>
            )
          })}

          {/* a photo not stored yet: the number on the empty photo frame, and under it (number, then state text, then progress, then retry and remove, the order of the mobile record) what is happening */}
          {shown.map((photo, index) => {
            const n = images.length + index + 1
            return (
              <Card key={photo.id} p={0} withBorder data-testid="pending-photo" data-state={photo.state}>
                <AppImage variant="upload" src={null} alt="">
                  <Group pos="absolute" inset={0} p="xs" align="flex-start" justify="space-between" wrap="nowrap">
                    <MantineBadge variant="count">{n}</MantineBadge>
                    {photo.state === 'failed' && <MantineDeleteIconButton onMedia label={t('remove_photo', { n })} onClick={() => queue.remove(photo.id)} disabled={disabled} />}
                  </Group>
                </AppImage>
                <Stack gap="xs" p="xs">
                  {photo.state === 'processing' && <Text size="sm" role="status">{t('photo_state_processing', { n })}</Text>}
                  {photo.state === 'uploading' && (
                    <MantineProgress value={photo.progress} size="sm" label={t('photo_state_uploading', { n, percent: photo.progress })} />
                  )}
                  {photo.state === 'failed' && (
                    <>
                      <Text size="sm">{t('photo_state_failed', { n })}</Text>
                      <Input.Error role="alert">{t(FAILURE_MESSAGE_KEY[photo.failure ?? 'failed'])}</Input.Error>
                      <Button type="button" variant="default" fullWidth onClick={() => queue.retry(photo.id)} disabled={disabled}>
                        {t('photo_retry', { n })}
                      </Button>
                    </>
                  )}
                </Stack>
              </Card>
            )
          })}
        </SimpleGrid>
      )}

      {/* The file input: JPEG, PNG or WebP, several at once, up to the limit; the browser makes the two versions and uploads them (Task 1038) */}
      <input ref={inputRef} type="file" accept={ACCEPTED_INPUT_TYPES.join(',')} multiple hidden onChange={chooseFiles} data-testid="photo-file-input" />
      {canUploadMore && triggerButton()}

      {/* Max reached message */}
      {!canUploadMore && <Input.Description>{t('photos_hint', { max: maxImages })}</Input.Description>}
    </Stack>
  )
}
