import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AspectRatio, Group, SimpleGrid, Stack, Text, useMantineTheme } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { AppImage } from '@/design-system/media/AppImage'
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

/** The `gallery-strip / thumbnail row` section — a non-stretching row (`Group`, never a
 * `SimpleGrid` whose columns divide the container, which is what produced the Revision 3 stretch
 * at wide viewports). Each cell is a canonical Mantine square sized by the registered token. */
function GalleryStripRow({ src, alt }: { src: string; alt: string }) {
  const theme = useMantineTheme()
  return (
    <Group gap="xs">
      {[0, 1, 2, 3].map((i) => (
        <AspectRatio key={i} ratio={1} w={theme.other.boxSize.galleryThumb}>
          <AppImage src={src} alt={alt} variant="gallery-strip" />
        </AspectRatio>
      ))}
    </Group>
  )
}

/** The negative-flow (`src=null`) square — same token, same canonical square, per the owner
 * decision that this cell is "the same defect" as the gallery-strip row and fixed with it. */
function NoSrcSquare({ alt, naLabel }: { alt: string; naLabel: string }) {
  const theme = useMantineTheme()
  return (
    <AspectRatio ratio={1} w={theme.other.boxSize.galleryThumb}>
      <AppImage src={null} alt={alt} variant="listing-thumb">
        <Text size="xs" c="gray.5" ta="center">
          {naLabel}
        </Text>
      </AppImage>
    </AspectRatio>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const alt = storyT(locale, 'storybook.mantine.appimage_alt')

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              listing / 4:3 / priority
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <AppImage src={DEMO_SRC} alt={alt} variant="listing" priority />
            </SimpleGrid>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              gallery-main / fill-parent / hover-brightness
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <AspectRatio ratio={16 / 9}>
                <AppImage src={DEMO_SRC} alt={alt} variant="gallery-main" />
              </AspectRatio>
            </SimpleGrid>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              avatar / square / circular
            </Text>
            <SimpleGrid cols={{ base: 4, sm: 6 }}>
              <AppImage src={DEMO_SRC} alt={alt} variant="avatar" />
            </SimpleGrid>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              gallery-strip / thumbnail row
            </Text>
            <GalleryStripRow src={DEMO_SRC} alt={alt} />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              negative flow — no src (container-only, no crash)
            </Text>
            <NoSrcSquare alt={alt} naLabel="n/a" />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
