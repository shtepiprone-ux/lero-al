import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineSelect } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Select',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    const options = [
      { value: 'apartment', label: t('sel_option_apartment') },
      { value: 'house',     label: t('sel_option_house') },
      { value: 'commercial', label: t('sel_option_commercial') },
      { value: 'land',      label: t('sel_option_land') },
    ]

    return (
      <MantineStoryShell>
        <Stack gap="xl">

          {/* 1 — resting: §6d chrome (gray-2 border / shadow-xs / brand focus / 44px); responsive by default */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              resting — §6d chrome: gray-2 border / shadow-xs / brand focus / gray-4 placeholder / 44px; full-width &lt;640, anchored ≥640
            </Text>
            <MantineSelect
              label={t('sel_label')}
              placeholder={t('sel_placeholder')}
              description={t('sel_hint')}
              data={options}
            />
          </Stack>

          {/* 2 — error: red-6 border / no shadow; data-error state */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — red-6 border / no shadow; error message wraps at 320 in all 4 locales
            </Text>
            <MantineSelect
              label={t('sel_label')}
              placeholder={t('sel_placeholder')}
              data={options}
              error={t('sel_error')}
            />
          </Stack>

          {/* 3 — disabled: whole control faded (§6e); no focus ring; at <640 tap is a no-op */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — whole control faded (label + field + chevron → opacity 0.5); no focus ring; tap is a no-op at any width
            </Text>
            <MantineSelect
              label={t('sel_label')}
              placeholder={t('sel_placeholder')}
              data={options}
              disabled
            />
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
