import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Group, Radio, Stack, Text } from '@mantine/core'
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

          {/* 1 — unchecked: gray-3 border / 20px circle / label gray-7 / ≥44px tap row */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              unchecked — gray-3 border / 20px circle / rounded-full / label gray-7 / ≥44px tap row
            </Text>
            <Radio value="a" label={t('rb_label')} />
          </Stack>

          {/* 2 — checked: brand-7 fill + white 10px center dot */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              checked — brand-7 fill + white 10px center dot; label unchanged
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

// Task 857 R49 — `Radio.Card` + `Radio.Indicator` (docs §23.7 "A choice"): a bordered card per option. Radius, border and
// padding come from the theme `RadioCard` entry; the checked tint (brand-7 border, brand-0 background), the keyboard
// focus ring and the disabled fade come from `input-chrome.css`. The indicator is the canonical radio circle: 20px with a
// 10px dot (GR-3f) from the theme `RadioIndicator` entry — no size, colour or border override here.
export const Card: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="xl">

          {/* 1 — checked card, a card with a description, an unchecked card: Tab to a card to see the focus ring */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              card — checked: brand-7 border + brand-0 tint; with description; unchecked: gray-3 border; keyboard focus ring (brand, :focus-visible)
            </Text>
            <Radio.Group defaultValue="a">
              <Stack gap="xs">
                <Radio.Card value="a">
                  <Group wrap="nowrap" gap="sm">
                    <Radio.Indicator />
                    <Text component="span" fz="sm" fw={500}>{t('rb_label')}</Text>
                  </Group>
                </Radio.Card>
                <Radio.Card value="b">
                  <Group wrap="nowrap" align="flex-start" gap="sm">
                    <Radio.Indicator />
                    <Stack gap="tight">
                      <Text component="span" fz="sm" fw={500}>{t('rb_label')}</Text>
                      <Text component="span" fz="xs" c="dimmed">{t('modal_body')}</Text>
                    </Stack>
                  </Group>
                </Radio.Card>
                <Radio.Card value="c">
                  <Group wrap="nowrap" gap="sm">
                    <Radio.Indicator />
                    <Text component="span" fz="sm" fw={500}>{t('rb_long_label')}</Text>
                  </Group>
                </Radio.Card>
              </Stack>
            </Radio.Group>
          </Stack>

          {/* 2 — disabled: the whole card faded; a checked card keeps its brand fill and white dot under the fade (§6g) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              card, disabled — whole card faded (opacity 0.5); checked keeps brand-7 fill + white 10px dot; not-allowed; no focus ring
            </Text>
            <Radio.Group defaultValue="d1">
              <Stack gap="xs">
                <Radio.Card value="d1" disabled>
                  <Group wrap="nowrap" gap="sm">
                    <Radio.Indicator disabled />
                    <Text component="span" fz="sm" fw={500}>{t('rb_label')}</Text>
                  </Group>
                </Radio.Card>
                <Radio.Card value="d2" disabled>
                  <Group wrap="nowrap" gap="sm">
                    <Radio.Indicator disabled />
                    <Text component="span" fz="sm" fw={500}>{t('rb_label')}</Text>
                  </Group>
                </Radio.Card>
              </Stack>
            </Radio.Group>
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
