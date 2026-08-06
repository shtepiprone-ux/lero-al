import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Skeleton, Stack, Group, Text, Box } from '@mantine/core'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Skeleton',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    return (
      <MantineStoryShell>
        <Stack gap="xl">

          {/* 1 — text-line skeleton: §6n-LIVE gray-50 fill + gray-200 border, 12px radius, decreasing widths (paragraph shape) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              text lines — §6n-LIVE gray-50 pulse + gray-200 border, 12px radius, full-width at &lt;640
            </Text>
            <Stack gap="sm">
              <Skeleton height={12} width="100%" />
              <Skeleton height={12} width="100%" />
              <Skeleton height={12} width="60%" />
            </Stack>
          </Stack>

          {/* 2 — block/card skeleton: a large rectangular placeholder (e.g. an image/media slot) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              block — a media/card placeholder, full-width at &lt;640
            </Text>
            <Skeleton height={160} width="100%" />
          </Stack>

          {/* 3 — circle skeleton: avatar placeholder, intrinsic size, not full-width */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              circle — avatar placeholder, intrinsic size (not stretched full-width)
            </Text>
            <Skeleton height={48} circle />
          </Stack>

          {/* 4 — composite: a realistic card row (circle avatar + two text lines), the common
              "loading list item" shape */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              composite — card row: circle avatar + two text lines
            </Text>
            <Group gap="sm" wrap="nowrap" align="flex-start">
              <Skeleton height={40} circle />
              <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                <Skeleton height={12} width="50%" />
                <Skeleton height={10} width="80%" />
              </Stack>
            </Group>
          </Stack>

          {/* 5 — negative: visible={false} passthrough — renders the real children, not the
              placeholder (Mantine's own prop, verifying it still works through our chrome override) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              visible=false — passthrough: real content renders, no placeholder overlay
            </Text>
            <Skeleton visible={false}>
              <Box p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-lg)' }}>
                <Text size="sm" c="gray.8">real content — not a placeholder</Text>
              </Box>
            </Skeleton>
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
