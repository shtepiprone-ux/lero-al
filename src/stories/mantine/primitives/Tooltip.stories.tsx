import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Group, Text, ActionIcon } from '@mantine/core'
import { Info } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineTooltip } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Tooltip',
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

          {/* 1 — standard info tooltip: hover/focus ≥640 anchored §6k tooltip; tap <640
              opens the full-width bottom sheet with the label. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              standard info tooltip — hover/focus (≥640) shows the anchored §6k tooltip; tap (&lt;640) opens the full-width bottom sheet with the label
            </Text>
            <MantineTooltip label={t('tooltip_label')}>
              <ActionIcon
                variant="default"
                aria-label={t('tooltip_trigger_aria')}
                mih="2.75rem"
                miw="2.75rem"
              >
                <Info size={16} />
              </ActionIcon>
            </MantineTooltip>
          </Stack>

          {/* 2 — long-uk label: proves wrap inside the full-width sheet at 320 (no clip,
              no h-scroll) and a sane max-width on the ≥640 anchored tooltip. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long-uk label — wraps inside the full-width sheet at 320 (no clip, no h-scroll); ≥640 tooltip wraps within max-width
            </Text>
            <MantineTooltip label={t('tooltip_long_label')}>
              <ActionIcon
                variant="default"
                aria-label={t('tooltip_trigger_aria')}
                mih="2.75rem"
                miw="2.75rem"
              >
                <Info size={16} />
              </ActionIcon>
            </MantineTooltip>
          </Stack>

          {/* 3 — placement variants: proves ALL FOUR desktop positions (Top · Right ·
              Bottom · Left, owner feedback 2026-07-02 — right/left were missing) while
              <640 STILL collapses to the SAME bottom sheet for every one (position
              has no effect there). Top is already proven by section 1's default. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              placement variants (top · right · bottom · left) — ≥640 anchors on the corresponding side; &lt;640 STILL the SAME full-width bottom sheet for every trigger (position ignored)
            </Text>
            {/* justify="space-between" + full width: the `right`-anchored trigger needs
                room to its right and the `left`-anchored trigger needs room to its left
                for Floating-UI to actually render them there instead of auto-flipping
                when space is insufficient (Task 526 — verified via rendered
                measurement, not assumed; a single flex-end/flex-start group starves
                one side or the other). */}
            <Group gap="md" justify="space-between" w="100%">
              <MantineTooltip label={t('tooltip_label')} position="top">
                <ActionIcon
                  variant="default"
                  aria-label={t('tooltip_trigger_aria')}
                  mih="2.75rem"
                  miw="2.75rem"
                >
                  <Info size={16} />
                </ActionIcon>
              </MantineTooltip>
              <MantineTooltip label={t('tooltip_label')} position="right">
                <ActionIcon
                  variant="default"
                  aria-label={t('tooltip_right_trigger_aria')}
                  mih="2.75rem"
                  miw="2.75rem"
                >
                  <Info size={16} />
                </ActionIcon>
              </MantineTooltip>
              <MantineTooltip label={t('tooltip_label')} position="bottom">
                <ActionIcon
                  variant="default"
                  aria-label={t('tooltip_bottom_trigger_aria')}
                  mih="2.75rem"
                  miw="2.75rem"
                >
                  <Info size={16} />
                </ActionIcon>
              </MantineTooltip>
              <MantineTooltip label={t('tooltip_label')} position="left">
                <ActionIcon
                  variant="default"
                  aria-label={t('tooltip_left_trigger_aria')}
                  mih="2.75rem"
                  miw="2.75rem"
                >
                  <Info size={16} />
                </ActionIcon>
              </MantineTooltip>
            </Group>
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
