import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Checkbox, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Checkbox',
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

          {/* 1 — unchecked: gray-3 border / 16px box / 4px radius / label gray-7 */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              unchecked — gray-3 border / 16px box / 4px radius / label gray-7 / ≥44px tap target
            </Text>
            <Checkbox label={t('cb_label')} />
          </Stack>

          {/* 2 — checked: brand-7 fill + white check mark */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              checked — brand-7 fill + white check mark; label unchanged
            </Text>
            <Checkbox label={t('cb_label')} defaultChecked />
          </Stack>

          {/* 3 — focus: keyboard focus ring (brand) — Tab to the checkbox to see */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              focus — keyboard focus ring (brand, :focus-visible); no ring on mouse click
            </Text>
            <Checkbox label={t('cb_label')} />
          </Stack>

          {/* 4 — error: red-6 border + ring; checked+error → brand border wins */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — red-6 border + ring (unchecked); checked+error → brand border wins (no red box)
            </Text>
            <Checkbox label={t('cb_label')} error={t('cb_error')} />
            <Checkbox label={t('cb_label')} error={t('cb_error')} defaultChecked />
          </Stack>

          {/* 5 — disabled: whole control faded — box + label → opacity 0.5 (§6f) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — whole control faded (box + label → opacity 0.5); not-allowed; no focus ring
            </Text>
            <Checkbox label={t('cb_label')} disabled />
            <Checkbox label={t('cb_label')} disabled defaultChecked />
          </Stack>

          {/* 6 — long label: wraps ≥2 lines at 320; no clip / no h-scroll */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label — wraps to ≥2 lines at 320; no clip / no h-scroll at any locale (sq/en/uk/it)
            </Text>
            <Checkbox label={t('cb_long_label')} />
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
