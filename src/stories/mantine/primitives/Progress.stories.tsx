import type { Meta, StoryObj } from '@storybook/react'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineProgress } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Progress',
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

          {/* 1 — resting: §6 Progress row — gray-200 pill track, brand fill, no label */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              resting (bare) — §6 Progress: gray-200 pill track / brand fill, aria-label only (no visible label)
            </Text>
            <MantineProgress value={45} aria-label={t('progress_label_storage')} />
          </Stack>

          {/* 2 — with label + value: label left, value right, above the bar */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              label + value — label left / value right, above the bar; both update with value
            </Text>
            <MantineProgress value={72} label={t('progress_label_storage')} showValue />
          </Stack>

          {/* 3 — sizes sm/md/lg/xl — 8/12/16/20px track+fill height */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              sizes — sm=8px / md=12px (default) / lg=16px / xl=20px
            </Text>
            <Stack gap="sm">
              <MantineProgress value={30} size="sm" aria-label={`${t('progress_label_storage')} sm`} />
              <MantineProgress value={30} size="md" aria-label={`${t('progress_label_storage')} md`} />
              <MantineProgress value={30} size="lg" aria-label={`${t('progress_label_storage')} lg`} />
              <MantineProgress value={30} size="xl" aria-label={`${t('progress_label_storage')} xl`} />
            </Stack>
          </Stack>

          {/* 4 — transition: two static values side by side (0→X fill), proves the same component
              renders correctly at both ends of its range, not just one snapshot */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              transition (two values) — fill grows from value to value; static snapshots at 20% and 80%
            </Text>
            <Stack gap="sm">
              <MantineProgress value={20} label={t('progress_label_upload')} showValue />
              <MantineProgress value={80} label={t('progress_label_upload')} showValue />
            </Stack>
          </Stack>

          {/* 5 — negative: value=0 → empty track, no crash */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              value=0 — empty track, no visible fill, no crash
            </Text>
            <MantineProgress value={0} label={t('progress_label_upload')} showValue />
          </Stack>

          {/* 6 — negative: value=100 → fully filled */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              value=100 — track fully filled
            </Text>
            <MantineProgress value={100} label={t('progress_label_upload')} showValue />
          </Stack>

          {/* 7 — negative: out-of-range clamped to [0,100], no overflow past the track */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              out-of-range (value=150 and value=-30) — clamped to [0,100], no overflow past the track
            </Text>
            <Stack gap="sm">
              <MantineProgress value={150} label={t('progress_label_upload')} showValue />
              <MantineProgress value={-30} label={t('progress_label_upload')} showValue />
            </Stack>
          </Stack>

          {/* 8 — negative: long sq/uk/it label wraps, never clips, no h-scroll at 320 */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label — wraps in the label row, never clips, no h-scroll at 320
            </Text>
            <MantineProgress value={55} label={t('progress_label_long')} showValue />
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
