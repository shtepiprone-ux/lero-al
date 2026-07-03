import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Switch, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Switch',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
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

          {/* 1 — unchecked: neutral-300 track / white thumb left / label gray-7 / ≥44px row */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              unchecked — neutral-300 track / white thumb at rest-left / label gray-7 / ≥44px tap row
            </Text>
            <Switch label={t('sw_label')} />
          </Stack>

          {/* 2 — checked: brand-7 track fill + white thumb slid right */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              checked — brand-7 (#EC5447) track fill + white thumb slid right; label unchanged
            </Text>
            <Switch label={t('sw_label')} defaultChecked />
          </Stack>

          {/* 3 — focus: keyboard focus ring (brand, :focus-visible) — Tab to the switch to see */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              focus — keyboard focus ring (brand, :focus-visible); no ring on mouse click
            </Text>
            <Switch label={t('sw_label')} />
          </Stack>

          {/* 4 — error: red-6 border-sim + ring (unchecked); checked+error → brand fill keeps */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — red-6 inset border + ring (unchecked); checked+error → brand fill retained (no red ring)
            </Text>
            <Switch label={t('sw_label')} error={t('sw_error')} />
            <Switch label={t('sw_label')} defaultChecked error={t('sw_error')} />
          </Stack>

          {/* 5 — disabled: whole control faded — track + thumb + label → opacity 0.5 (§6h) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — whole control faded (track + thumb + label → opacity 0.5); not-allowed; no focus ring
            </Text>
            <Switch label={t('sw_label')} disabled />
            <Switch label={t('sw_label')} defaultChecked disabled />
          </Stack>

          {/* 6 — long label: wraps ≥2 lines at 320; no clip / no h-scroll */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label — wraps to ≥2 lines at 320; no clip / no h-scroll at any locale (sq/en/uk/it)
            </Text>
            <Switch label={t('sw_long_label')} />
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
