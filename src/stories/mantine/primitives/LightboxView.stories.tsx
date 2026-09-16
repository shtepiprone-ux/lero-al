import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Stack, Text, Button } from '@mantine/core'
import { within, userEvent } from 'storybook/test'
import { storyT } from '../../_storyI18n'
import { LightboxView } from '@/modules/listings/components/LightboxView'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (same rendered-gate rationale as `HeaderView`/`HeaderActions`
 * — `scripts/check-stories-rendered.mjs --mantine-only` gives permanent, standing enforcement to
 * stories under this exact prefix). `LightboxView` is the Task 612 presentational-primitive split
 * of `ListingGallery`'s lightbox overlay (Container/Presentational split gate,
 * `docs/component-rules.md`).
 *
 * Split-gate proof: `LightboxView` receives images/activeIndex/labels/handlers ENTIRELY via
 * props — zero data/network hooks, zero `useTranslations` (labels are resolved by the
 * container). Both fixtures below are plain local `useState`, no hook mock, no `.storybook`
 * alias, no live Supabase.
 *
 * `LightboxView` IS in the harness's overlay open-trigger set (it renders a Mantine `Modal`) — both
 * `Default` sections use a trigger `Button`, matching the `Modal.stories.tsx` convention
 * (`ModalStandardSection`/`ModalLongSection`); `Default`'s own `play` clicks the multi-image
 * trigger so the rendered gate captures the desktop thumbnail strip and dark nav open. `SwipeTrackMode`
 * renders already-opened (`opened` always `true`) at the `mobile390` viewport — no interaction
 * needed to prove the swipe track and pagination rail.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/LightboxView',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

// R31 (kickoff §19) — a deterministic, local (no network) SVG data URI per fixture photo, so
// AC30/AC37's "identical media-frame rect regardless of the photo's own intrinsic ratio" is
// measured against two REAL, decoded, different aspect ratios (a `naturalWidth`/`naturalHeight`
// the harness can read back) rather than three same-ratio remote Unsplash URLs whose load state
// was never verified. `width`/`height` here are fixture image DATA — the deterministic content of
// a labelled Storybook fixture, not a layout dimension prop or a Tailwind utility (R2/AC2 exempts
// fixture data, same rationale as this file's own `counter` digit-string precedent above).
function fixtureSvg(width: number, height: number, label: string, fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${fill}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(Math.min(width, height) / 10)}" fill="#fff">${label} ${width}x${height}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// R35 (kickoff §19) — padding colors past index 1, so the multi-image fixture's total photo count
// (24) exceeds the measured 18-photo threshold at which the relocated desktop thumbnail strip
// (R25's `max-w-5xl` wrapper, `justify-center overflow-x-auto`) would strand its own leading
// thumbnails if a fix were needed. Fixture data (a labelled color/index list), not a layout value.
const EXTRA_FIXTURE_COLORS = [
  '#2f855a', '#805ad5', '#dd6b20', '#2c7a7b', '#b83280', '#4a5568', '#2b6cb0', '#742a2a',
  '#22543d', '#553c9a', '#c05621', '#285e61', '#97266d', '#1a202c', '#2a4365', '#9c4221',
  '#234e52', '#44337a', '#702459', '#276749', '#c05621', '#2c5282',
]

const DEMO_IMAGES = [
  { url: fixtureSvg(1200, 675, 'Landscape', '#2b6cb0') }, // index 0 — landscape, R31
  { url: fixtureSvg(675, 1200, 'Portrait', '#c53030') }, // index 1 — portrait, R31
  ...EXTRA_FIXTURE_COLORS.map((color, i) => ({ url: fixtureSvg(1200, 675, `Photo ${i + 3}`, color) })), // R35
]

function LightboxMultiImageSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        {t('lightbox_caption_multi')}
      </Text>
      <Button variant="default" onClick={() => { setActiveIndex(0); setOpened(true) }}>
        {t('lightbox_trigger_multi')}
      </Button>
      <LightboxView
        opened={opened}
        images={DEMO_IMAGES}
        activeIndex={activeIndex}
        title={t('lightbox_alt_title')}
        labels={{
          close: t('lightbox_close'),
          prev: t('lightbox_prev'),
          next: t('lightbox_next'),
          // No i18n key: the real container (`ListingGallery.tsx`) formats this as a plain
          // `${index} / ${total}` numeric string too — no translatable words, matching
          // production behavior exactly (not a hardcode-gate violation — pure digits/slash).
          counter: (index, total) => `${index} / ${total}`,
        }}
        onClose={() => setOpened(false)}
        onPrev={() => setActiveIndex(i => (i - 1 + DEMO_IMAGES.length) % DEMO_IMAGES.length)}
        onNext={() => setActiveIndex(i => (i + 1) % DEMO_IMAGES.length)}
        onSelect={setActiveIndex}
      />
    </Stack>
  )
}

function LightboxSingleImageSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
  const singleImage = [DEMO_IMAGES[0]]

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        {t('lightbox_caption_single')}
      </Text>
      <Button variant="default" onClick={() => setOpened(true)}>
        {t('lightbox_trigger_single')}
      </Button>
      <LightboxView
        opened={opened}
        images={singleImage}
        activeIndex={0}
        title={t('lightbox_alt_title')}
        labels={{
          close: t('lightbox_close'),
          prev: t('lightbox_prev'),
          next: t('lightbox_next'),
          // No i18n key: the real container (`ListingGallery.tsx`) formats this as a plain
          // `${index} / ${total}` numeric string too — no translatable words, matching
          // production behavior exactly (not a hardcode-gate violation — pure digits/slash).
          counter: (index, total) => `${index} / ${total}`,
        }}
        onClose={() => setOpened(false)}
        onPrev={() => {}}
        onNext={() => {}}
        onSelect={() => {}}
      />
    </Stack>
  )
}

function LightboxMobileSwipeSection({ locale }: { locale: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        {t('lightbox_caption_multi')}
      </Text>
      <LightboxView
        opened
        images={DEMO_IMAGES}
        activeIndex={activeIndex}
        title={t('lightbox_alt_title')}
        labels={{
          close: t('lightbox_close'),
          prev: t('lightbox_prev'),
          next: t('lightbox_next'),
          counter: (index, total) => `${index} / ${total}`,
        }}
        onClose={() => {}}
        onPrev={() => setActiveIndex(i => (i - 1 + DEMO_IMAGES.length) % DEMO_IMAGES.length)}
        onNext={() => setActiveIndex(i => (i + 1) % DEMO_IMAGES.length)}
        onSelect={setActiveIndex}
      />
    </Stack>
  )
}

export const Default: Story = {
  play: async ({ canvasElement, globals }) => {
    const locale = (globals?.locale as string) ?? 'en'
    const triggerLabel = storyT(locale, 'storybook.mantine.lightbox_trigger_multi')
    const canvas = within(canvasElement)
    const trigger = await canvas.findByRole('button', { name: triggerLabel })
    await userEvent.click(trigger)
  },
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <LightboxMultiImageSection locale={locale} />
          <LightboxSingleImageSection locale={locale} />
        </Stack>
      </MantineStoryShell>
    )
  },
}

// Mobile-only proof — the changed states desktop-width `Default` cannot reach: the swipe/drag/
// arrow-key track, the pagination rail (not a thumbnail strip), the square desktop thumbnail strip
// is absent by design, and `tone="dark"` nav is likewise absent below `sm` (mobile browses by
// gesture, not arrows). `opened` is always true — no interaction needed to render these states.
export const SwipeTrackMode: Story = {
  globals: { viewport: { value: 'mobile390', isRotated: false } },
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <LightboxMobileSwipeSection locale={locale} />
      </MantineStoryShell>
    )
  },
}
