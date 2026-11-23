'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ActionIcon, Button, Card, Group, Input, SimpleGrid, Stack, useMantineTheme } from '@mantine/core'
import { AppImage } from '@/design-system/media/AppImage'
import { CldUploadWidget } from 'next-cloudinary'
import type { CloudinaryUploadWidgetResults } from 'next-cloudinary'
import {
  ImagePlus, Star, ChevronUp, ChevronDown, Camera, AlertTriangle,
} from 'lucide-react'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'
import { MantineDeleteIconButton } from '@/design-system/mantine/patterns/MantineDeleteIconButton'
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns/MantineEmptyLoadingErrorState'
import { toast } from '@/lib/toast'
import { canBuildUploadWidget, type CloudinaryWidgetConfig } from '@/modules/listings/lib/cloudinaryWidgetConfig'
import { classifySignatureRefusal, classifyWidgetError, type UploadFailure } from '@/modules/listings/lib/uploadFailure'

const MAX_IMAGES = 20

/** The route that signs one upload (Task 957): the folder, the `public_id`, `overwrite=false` and the preset are chosen there, never in the browser. */
const SIGNATURE_ROUTE = '/api/listings/upload-signature'

export interface ListingImage {
  url: string
  public_id: string
  is_cover: boolean
  order: number
}

interface Props {
  images: ListingImage[]
  onChange: (images: ListingImage[]) => void
  /** The listing being edited, when there is one: its photos are signed into the listing owner's folder `<owner>/listings/<listingId>`; without it into `<you>/listings`. */
  listingId?: string
  /**
   * The API key (not the secret) and the cloud name, read by the page on the server (`getCloudinaryWidgetConfig`). `getUploadWidgetOptions` needs both when the widget is created,
   * before any signature is asked for (`node_modules/@cloudinary-util/url-loader/dist/index.js:1590-1602`); when one is empty no widget is built and the section says so. Never a preset.
   */
  cloudinary: CloudinaryWidgetConfig
  maxImages?: number
  /** The form is being saved (Task 957 Revision 2, R2-7): the upload button and every photo control are disabled, so the photos cannot change after the payload was read. */
  disabled?: boolean
}

/** What the widget takes from the server's answer; every other key is dropped. */
interface SignedUpload {
  signature: string
  apiKey: string
  uploadSignatureTimestamp: number
  uploadPreset: string
  folder: string
  publicId: string
  overwrite: boolean
  tags: string[]
  context: string
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
} as const satisfies Record<UploadFailure, string>

function pickSigned(body: unknown): SignedUpload | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  if (
    typeof b.signature !== 'string' || b.signature === '' || typeof b.apiKey !== 'string' || typeof b.uploadSignatureTimestamp !== 'number'
    || typeof b.uploadPreset !== 'string' || typeof b.folder !== 'string' || typeof b.publicId !== 'string' || typeof b.overwrite !== 'boolean'
    || !Array.isArray(b.tags) || !b.tags.every((tag) => typeof tag === 'string') || typeof b.context !== 'string'
  ) return null
  return {
    signature: b.signature, apiKey: b.apiKey, uploadSignatureTimestamp: b.uploadSignatureTimestamp, uploadPreset: b.uploadPreset,
    folder: b.folder, publicId: b.publicId, overwrite: b.overwrite, tags: b.tags as string[], context: b.context,
  }
}

/** One signature for one photo; a failure names its reason: no session, not your listing, which limit and when to try again, the server not set up, the server failing, or no connection at all. */
async function requestSignature(listingId: string | undefined): Promise<{ signed: SignedUpload } | { failure: UploadFailure }> {
  try {
    const res = await fetch(SIGNATURE_ROUTE, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingId ? { listingId } : {}),
    })
    if (!res.ok) {
      const body: unknown = await res.json().catch(() => null)
      const code = typeof body === 'object' && body !== null && typeof (body as { error?: unknown }).error === 'string' ? (body as { error: string }).error : undefined
      const retryAfter = Number(res.headers?.get?.('Retry-After'))
      return { failure: classifySignatureRefusal(res.status, code, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined) }
    }
    const signed = pickSigned(await res.json())
    return signed ? { signed } : { failure: 'unavailable' }
  } catch {
    return { failure: 'network' }   // fetch itself threw (no answer) or the answer was not JSON
  }
}

/**
 * `getUploadWidgetOptions` treats the upload as signed only when it is given a function `uploadSignature`; with none it demands a public preset
 * (`url-loader/dist/index.js:1590-1607`), which this form no longer has. This function is that marker: it never signs. Every upload takes its signature from
 * `prepareUploadParams`, which asks the server route; if the widget ever asked this function instead, it is answered with an error and never with a signature.
 */
function refuseBrowserSignature(callback: (signature: string | null, error?: Error) => void) {
  callback(null, new Error('Listing photos are signed by the server only'))
}

export function ImageUpload({ images, onChange, listingId, cloudinary, maxImages = MAX_IMAGES, disabled = false }: Props) {
  const t = useTranslations('listing')
  const locale = useLocale()
  const theme = useMantineTheme()
  const icon = theme.other.iconSize

  const canUploadMore = images.length < maxImages

  // Refs to fix stale closure: each upload session snapshots the base images
  // and accumulates new ones without depending on the React render cycle.
  const sessionBaseRef = useRef<ListingImage[]>([])
  const sessionNewRef = useRef<ListingImage[]>([])
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const handleUpload = useCallback((result: CloudinaryUploadWidgetResults) => {
    if (result.event !== 'success' || !result.info || typeof result.info === 'string') return
    const info = result.info
    const total = sessionBaseRef.current.length + sessionNewRef.current.length
    const newImage: ListingImage = {
      url: info.secure_url,
      public_id: info.public_id,
      is_cover: total === 0,
      order: total,
    }
    sessionNewRef.current = [...sessionNewRef.current, newImage]
    onChangeRef.current([...sessionBaseRef.current, ...sessionNewRef.current])
  }, [])

  // The widget calls this once before each upload with the parameters it will send (a list when several files are queued): one signature is asked for each, and an upload that
  // cannot be signed is cancelled, never sent unsigned, and the person is told why in one message (the first refusal; Review 2 F10).
  const prepareUploadParams = useCallback(async (callback: (params: unknown) => void, params: unknown) => {
    const wanted = Array.isArray(params) ? params.length : 1
    const answers = await Promise.all(Array.from({ length: wanted }, () => requestSignature(listingId)))
    const refused = answers.find((answer): answer is { failure: UploadFailure } => 'failure' in answer)
    if (refused) {
      toast.error(t(FAILURE_MESSAGE_KEY[refused.failure]))
      callback({ cancel: true })
      return
    }
    const signed = answers.map((answer) => (answer as { signed: SignedUpload }).signed)
    callback(signed.length === 1 ? signed[0] : signed)
  }, [listingId, t])

  // An upload the photo service refused or that failed on the way: the person is told the reason, not a general message (the widget also shows its own line in its queue). The kind comes from
  // `classifyWidgetError`; nothing the service answered is shown.
  const handleWidgetError = useCallback((error: unknown) => {
    toast.error(t(FAILURE_MESSAGE_KEY[classifyWidgetError(error)]))
  }, [t])

  // The widget's own validation lines (a file larger than `maxFileSize`, a type outside `clientAllowedFormats`, too many files) in the language of the page: its `text` option keyed by `language`
  // (`uploader.errors.*` and `notifications.general_error`, read from the widget's default text file `https://widget.cloudinary.com/v2.0/global/text.json` on 2026-11-21; its own texts and
  // `{{size}}` / `{{allowed}}` placeholders). The guide (Cloudinary upload widget, Localization, read 2026-11-21 through a summary) says an element not specified uses the default of that file;
  // UNKNOWN: whether that default is English for a locale the widget has no built-in text for.
  const widgetText = {
    [locale]: {
      uploader: {
        errors: {
          file_too_large: t('upload_widget_file_too_large', { size: '{{size}}', allowed: '{{allowed}}' }),
          max_file_size: t('upload_widget_max_file_size'),
          allowed_formats: t('upload_widget_allowed_formats'),
          max_number_of_files: t('upload_widget_max_files'),
        },
      },
      notifications: { general_error: t('upload_widget_general_error') },
    },
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
  const triggerButton = (onClick?: () => void) => images.length === 0 ? (
    <Stack gap="xs">
      <Button type="button" variant="default" fullWidth onClick={onClick} disabled={disabled} leftSection={<Camera size={icon.roomy} />}>
        {t('upload_photos')}
      </Button>
      <Input.Description>{t('photos_hint', { max: maxImages })}</Input.Description>
    </Stack>
  ) : (
    <Button type="button" variant="default" fullWidth onClick={onClick} disabled={disabled} leftSection={<ImagePlus size={icon.roomy} />}>
      {t('add_more_photos')} ({images.length}/{maxImages})
    </Button>
  )

  return (
    <Stack gap="md" data-testid="image-upload">

      {/* Grid of uploaded images: two columns on a phone, three from 640px, four from 768px (the layout the form had) */}
      {images.length > 0 && (
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
        </SimpleGrid>
      )}

      {/* Upload button: the widget when it can be built, a disabled button while the form is saved, the error state when it cannot be built (Review 2 F5) */}
      {canUploadMore && disabled && triggerButton()}
      {canUploadMore && !disabled && !canBuildUploadWidget(cloudinary) && (
        <MantineEmptyLoadingErrorState
          state="error"
          icon={<AlertTriangle size={icon.standard} />}
          title={t('upload_unavailable_title')}
          description={t('upload_unavailable_description')}
        />
      )}
      {canUploadMore && !disabled && canBuildUploadWidget(cloudinary) && (
        <CldUploadWidget
          // `getCloudinaryConfig` ends with `Object.assign({ cloud: { …env }, url }, config)`, so a `cloud` given here REPLACES the one it built from the environment
          // (`next-cloudinary/dist/cloudinary-ef6def0a.esm.js:120-131`): the key and the cloud name are both named here, so neither is read from the environment
          config={{ cloud: { apiKey: cloudinary.apiKey, cloudName: cloudinary.cloudName } } as never}
          options={{
            maxFiles: maxImages - images.length,
            multiple: true,
            resourceType: 'image',
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
            maxFileSize: 10_000_000, // 10 MB
            cropping: false,
            uploadSignature: refuseBrowserSignature,
            prepareUploadParams,
            language: locale,
            text: widgetText,
          } as never}
          onSuccess={handleUpload}
          onError={handleWidgetError}
        >
          {({ open }) => {
            const openWidget = () => {
              sessionBaseRef.current = images
              sessionNewRef.current = []
              open()
            }
            return triggerButton(openWidget)
          }}
        </CldUploadWidget>
      )}

      {/* Max reached message */}
      {!canUploadMore && <Input.Description>{t('photos_hint', { max: maxImages })}</Input.Description>}
    </Stack>
  )
}
