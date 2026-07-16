import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Stack, Text, Button } from '@mantine/core'
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
 * `LightboxView` IS in the harness's overlay open-trigger set (it renders a Mantine `Modal`) —
 * both sections below use a trigger `Button` + `play`-free manual open via `onClick`, matching
 * the `Modal.stories.tsx` convention (`ModalStandardSection`/`ModalLongSection`).
 */
const meta: Meta = {
  title: 'Mantine/Primitives/LightboxView',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const DEMO_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80' },
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

export const Default: Story = {
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
