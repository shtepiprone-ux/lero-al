import type { Meta, StoryObj } from '@storybook/react'
import { Slider, RangeSlider, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Slider',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="xl">

          {/* 1 — single: §6q brand fill / gray-100 empty track, fixed defaultValue=40 (determinate,
              byte-stable — no drag simulation in the static rendered-gate screenshot). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('slider_single_caption')}</Text>
            <Slider defaultValue={40} />
          </Stack>

          {/* 2 — range: RangeSlider, two thumbs, filled band sits between them (§6q). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('slider_range_caption')}</Text>
            <RangeSlider defaultValue={[20, 70]} />
          </Stack>

          {/* 3 — disabled: §6q whole-control dim (slider-chrome.css) — track AND thumb dim TOGETHER
              via opacity on the single trackContainer ancestor; thumb stays visible (not vanished,
              Mantine's own display:none default is overridden) so the dim is verifiable on the thumb,
              not only the track (§6e/§6f/§6g/§6h "verifying only the track is a review failure"). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('slider_disabled_caption')}</Text>
            <Slider defaultValue={60} disabled />
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
