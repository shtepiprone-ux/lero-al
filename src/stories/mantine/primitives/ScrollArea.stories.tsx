import type { Meta, StoryObj } from '@storybook/react'
import { ScrollArea, Stack, Group, Text, Box } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/ScrollArea',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const VERTICAL_ITEM_COUNT = 10
const HORIZONTAL_ITEM_COUNT = 8

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="xl">

          {/* 1 — vertical: §6p 6px gray-200 pill thumb, fixed h=180 box, content taller than the box —
              scrollbars="y" keeps this demo single-axis; type="always" forces the thumb to paint for
              the static rendered-gate screenshot (no hover simulation in headless capture). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('scrollarea_vertical_caption')}</Text>
            <ScrollArea h={180} w="100%" type="always" scrollbars="y">
              <Stack gap="sm" p="sm">
                {Array.from({ length: VERTICAL_ITEM_COUNT }, (_, i) => (
                  <Text key={i} size="sm" c="gray.7">{t('scrollarea_vertical_item')} {i + 1}</Text>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>

          {/* 2 — horizontal: root is w="100%" (constrained to the story column, never intrinsic-width)
              so the row of fixed-width chips — wider than any viewport down to 320px — scrolls INSIDE
              the ScrollArea viewport only. This is the gate-safety nuance (mobile <640 full-width gate):
              the internal overflow must never leak into document-level horizontal scroll. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('scrollarea_horizontal_caption')}</Text>
            <ScrollArea w="100%" type="always" scrollbars="x">
              <Group gap="sm" wrap="nowrap" p="sm">
                {Array.from({ length: HORIZONTAL_ITEM_COUNT }, (_, i) => (
                  <Box
                    key={i}
                    miw={140}
                    h={80}
                    bg="gray.1"
                    bd="1px solid var(--mantine-color-gray-2)"
                    bdrs="lg"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <Text size="sm" c="gray.7">{t('scrollarea_horizontal_item')} {i + 1}</Text>
                  </Box>
                ))}
              </Group>
            </ScrollArea>
          </Stack>

          {/* 3 — negative: content shorter than the box — Mantine only paints a scrollbar/thumb when
              scrollHeight/scrollWidth exceeds the client box, so no phantom thumb renders here. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('scrollarea_empty_caption')}</Text>
            <ScrollArea h={80} w="100%" type="always" scrollbars="y">
              <Box p="sm">
                <Text size="sm" c="gray.7">{t('scrollarea_empty_content')}</Text>
              </Box>
            </ScrollArea>
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
