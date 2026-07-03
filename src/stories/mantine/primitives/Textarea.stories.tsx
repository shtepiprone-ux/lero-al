import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text, Textarea } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Textarea',
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

          {/* ── basic — resting chrome + description below (inputWrapperOrder) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              basic — gray-2 border / gray-4 placeholder / gray-8 text / shadow-xs / brand focus / description below
            </Text>
            <Textarea
              label={t('ta_label')}
              placeholder={t('ta_placeholder')}
              description={t('ta_hint')}
              autosize
              minRows={3}
            />
          </Stack>

          {/* ── autosize / long content — grows with content; uk wraps ≥2 lines at 320 ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              autosize — grows with content; long uk wraps ≥2 lines at 320; no clip; no h-scroll
            </Text>
            <Textarea
              label={t('ta_label')}
              defaultValue={t('ta_long_value')}
              autosize
              minRows={3}
            />
          </Stack>

          {/* ── error — red border + red message + aria-invalid (negative flow) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — red border + red message text + aria-invalid; label unchanged
            </Text>
            <Textarea
              label={t('ta_label')}
              placeholder={t('ta_placeholder')}
              error={t('ta_error')}
              autosize
              minRows={3}
            />
          </Stack>

          {/* ── disabled — dimmed input + dimmed label (negative flow) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — dimmed input + dimmed label; no focus ring; no pointer
            </Text>
            <Textarea
              label={t('ta_label')}
              placeholder={t('ta_placeholder')}
              disabled
              autosize
              minRows={3}
            />
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
