import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Radio, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Radio',
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

          {/* 1 — unchecked: gray-3 border / 16px circle / label gray-7 / ≥44px tap row */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              unchecked — gray-3 border / 16px circle / rounded-full / label gray-7 / ≥44px tap row
            </Text>
            <Radio value="a" label={t('rb_label')} />
          </Stack>

          {/* 2 — checked: brand-7 fill + white 8px center dot */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              checked — brand-7 fill + white 8px center dot; label unchanged
            </Text>
            <Radio.Group defaultValue="b">
              <Radio value="b" label={t('rb_label')} />
            </Radio.Group>
          </Stack>

          {/* 3 — focus: keyboard focus ring (brand) — Tab to the radio to see */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              focus — keyboard focus ring (brand, :focus-visible); no ring on mouse click
            </Text>
            <Radio value="c" label={t('rb_label')} />
          </Stack>

          {/* 4 — error: red-6 border + ring; checked+error → brand border wins */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — red-6 border + ring (unchecked); checked+error → brand border wins (no red on filled circle)
            </Text>
            <Radio value="d1" label={t('rb_label')} error={t('rb_error')} />
            <Radio.Group defaultValue="d2">
              <Radio value="d2" label={t('rb_label')} error={t('rb_error')} />
            </Radio.Group>
          </Stack>

          {/* 5 — disabled: whole control faded — circle + label → opacity 0.5 (§6g) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — whole control faded (circle + label → opacity 0.5); not-allowed; no focus ring
            </Text>
            <Radio value="e1" label={t('rb_label')} disabled />
            <Radio.Group defaultValue="e2">
              <Radio value="e2" label={t('rb_label')} disabled />
            </Radio.Group>
          </Stack>

          {/* 6 — long label: wraps ≥2 lines at 320; no clip / no h-scroll */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label — wraps to ≥2 lines at 320; no clip / no h-scroll at any locale (sq/en/uk/it)
            </Text>
            <Radio value="f" label={t('rb_long_label')} />
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
