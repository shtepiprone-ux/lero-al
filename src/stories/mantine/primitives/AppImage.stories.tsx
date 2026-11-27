import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AspectRatio, Box, Group, SimpleGrid, Stack, Text, useMantineTheme } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { AppImage, type ImageVariant } from '@/design-system/media/AppImage'
import { MediaPlaceholder } from '@/design-system/media/MediaPlaceholder'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (same rendered-gate rationale as `LightboxView`/`HeaderView`
 * — `scripts/check-stories-rendered.mjs --mantine-only` gives standing enforcement to stories
 * under this exact prefix, and `check:story-coverage`/`check:rendered-scope` recognise the same
 * prefix as canonical). Task 813: `AppImage` is the project's canonical `<img>` render site
 * (Cloudinary srcset, LQIP blur-up, React 19 `preload`, `imageGuard`/predictive preloading — see
 * `src/design-system/media/AppImage.tsx`'s own header) — not a Mantine component internally, but
 * governed the same way every other enrolled primitive is. This is its own canonical Story
 * (GR-3): no prior Story imported this component by its own path.
 *
 * Demo images are plain Unsplash URLs, not Cloudinary — `insertTransform`/`buildSrcset` are
 * no-ops for a non-Cloudinary `src` (see `appImageConfig.ts`), so these sections render the raw
 * `<img>` with no srcset/LQIP. That is the correct, existing fallback behaviour for a non-
 * Cloudinary source, not a story-only stub.
 *
 * Task 813 R17 Revision 4 (owner decision 2026-09-11, kickoff §5.5): no section below sizes
 * through a numeric literal in any unit, in a Mantine sizing prop or a `style` object — a prior
 * revision re-expressed the same rejected literal pixel values as a Mantine size-prop string,
 * which is still a hardcode by the same rule. Every section now sizes either from a
 * `SimpleGrid`/`Group` layout's own
 * column count (`listing`, `gallery-main`, `avatar` — counts, not dimensions) or from the
 * project's registered `theme.other.boxSize.galleryThumb` token (`gallery-strip` and the no-src
 * square — see `src/design-system/mantine/theme.ts` for the exact value and its provenance
 * comment). `useMantineTheme()` is called from a small local component, not the top-level story
 * `render` callback, matching this file's own hook-discipline precedent
 * (`CountButton.stories.tsx`'s `SlidersIcon`/`FilterTriggerBoundaryStates`).
 */
const meta: Meta = {
  title: 'Mantine/Primitives/AppImage',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const DEMO_SRC = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80'

// Task 886 R25: a relative path `storybook-static` answers with 404, so the <img> fails with no
// network dependency and exercises `AppImage`'s failed-load branch.
const MISSING_SRC = '/__missing-photo__.jpg'

/** Frame kinds (shared by both exports): `listing` owns its aspect ratio; the thumb variants are
 * token-sized squares in a non-stretching `Group`; the fill-parent variants sit in an `AspectRatio`. */
const PLACEHOLDER_VARIANTS: ReadonlyArray<{ variant: ImageVariant; frame: 'self' | 'thumb' | 'wide' }> = [
  { variant: 'listing', frame: 'self' },
  { variant: 'listing-thumb', frame: 'thumb' },
  { variant: 'gallery-main', frame: 'wide' },
  { variant: 'gallery-side', frame: 'wide' },
  { variant: 'gallery-strip', frame: 'thumb' },
  { variant: 'lightbox', frame: 'wide' },
]

/** One variant's frame, shared by `Default` and `Placeholder` (Task 886 R39) so both exports have the same
 * grid and the same cell count per variant row; only the `sources` differ. */
function VariantCases({
  variant,
  frame,
  alt,
  sources,
  priority = false,
}: {
  variant: ImageVariant
  frame: 'self' | 'thumb' | 'wide'
  alt: string
  sources: Array<string | null>
  priority?: boolean
}) {
  const theme = useMantineTheme()
  if (frame === 'thumb') {
    // Production parent: `GalleryThumbnailButton.tsx:32` sizes the thumb with this same
    // `theme.other.boxSize.galleryThumb` token (GR-3b: the Story reproduces the parent's contract).
    return (
      <Group gap="xs">
        {sources.map((src, i) => (
          <AspectRatio key={`${src ?? 'null'}-${i}`} ratio={1} w={theme.other.boxSize.galleryThumb}>
            <AppImage src={src} alt={alt} variant={variant} />
          </AspectRatio>
        ))}
      </Group>
    )
  }
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      {sources.map((src, i) =>
        frame === 'self' ? (
          <AppImage key={`${src ?? 'null'}-${i}`} src={src} alt={alt} variant={variant} priority={priority} />
        ) : (
          <AspectRatio key={`${src ?? 'null'}-${i}`} ratio={16 / 9}>
            <AppImage src={src} alt={alt} variant={variant} />
          </AspectRatio>
        ),
      )}
    </SimpleGrid>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const alt = storyT(locale, 'storybook.mantine.appimage_alt')

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {PLACEHOLDER_VARIANTS.map(({ variant, frame }) => (
            <Stack key={variant} gap="xs">
              <Text size="xs" c="gray.5" fw={500}>
                {variant} — two photos
              </Text>
              <VariantCases variant={variant} frame={frame} alt={alt} sources={[DEMO_SRC, DEMO_SRC]} priority={variant === 'listing'} />
            </Stack>
          ))}

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              avatar / square / circular
            </Text>
            <SimpleGrid cols={{ base: 4, sm: 6 }}>
              <AppImage src={DEMO_SRC} alt={alt} variant="avatar" />
            </SimpleGrid>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}

/**
 * Task 886 R25 (owner O83-1, 2026-09-30): the canonical photo placeholder — a grey field with a
 * picture glyph — for every variant that opts in, in both triggering states: no `src` and a `src`
 * that fails to load. Ends with the standalone `MediaPlaceholder` (GR-3: its own Story imports it).
 */
export const Placeholder: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const alt = storyT(locale, 'storybook.mantine.appimage_alt')

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {PLACEHOLDER_VARIANTS.map(({ variant, frame }) => (
            <Stack key={variant} gap="xs">
              <Text size="xs" c="gray.5" fw={500}>
                {variant} — no src, then a failed load
              </Text>
              <VariantCases variant={variant} frame={frame} alt={alt} sources={[null, MISSING_SRC]} />
            </Stack>
          ))}

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              MediaPlaceholder — standalone
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {/* MediaPlaceholder fills its positioned parent, as AppImage's `.frame` provides. Mantine's
                  AspectRatio sizes its CHILD (not its root), so the positioned Box is that child: it gets the
                  16:9 height and is the placeholder's offsetParent (Task 886 R31). */}
              <AspectRatio ratio={16 / 9}>
                <Box pos="relative">
                  <MediaPlaceholder iconSize="hero" label={alt} />
                </Box>
              </AspectRatio>
            </SimpleGrid>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
