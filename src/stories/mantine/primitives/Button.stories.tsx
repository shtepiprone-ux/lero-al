import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Button, Group, Stack, Text } from '@mantine/core'
import { Save } from 'lucide-react'
import { storyT } from '../../_storyI18n'

const meta: Meta = {
  title: 'Mantine/Primitives/Button',
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
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        <Stack gap="xl">

          {/* ── Variants ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              variants — filled · default · subtle · light(red) · transparent
            </Text>
            <Group gap="sm" wrap="wrap">
              <Button variant="filled" color="brand">
                {t('button_variant_filled')}
              </Button>
              <Button variant="default">
                {t('button_variant_default')}
              </Button>
              <Button variant="subtle">
                {t('button_variant_subtle')}
              </Button>
              <Button variant="light" color="red">
                {t('button_variant_light_red')}
              </Button>
              <Button variant="transparent">
                {t('button_variant_transparent')}
              </Button>
            </Group>
          </Stack>

          {/* ── Sizes: xs and sm only (NOT md — density rule) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              sizes — xs · sm (no md per density rule)
            </Text>
            <Group gap="sm" align="center">
              <Button size="xs">
                {t('button_xs')}
              </Button>
              <Button size="sm">
                {t('button_sm')}
              </Button>
            </Group>
          </Stack>

          {/* ── With leading icon (leftSection, lucide-react) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              with leading icon (leftSection)
            </Text>
            <Button
              variant="filled"
              color="brand"
              leftSection={<Save size={16} aria-hidden />}
            >
              {t('button_save_changes')}
            </Button>
          </Stack>

          {/* ── Full-width <640 (P0 mobile gate) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              full-width — fills container at all viewports (fullWidth prop)
            </Text>
            <Button variant="filled" color="brand" fullWidth>
              {t('button_add_listing')}
            </Button>
          </Stack>

          {/* ── Disabled (negative flow) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — dimmed, no pointer, no hover
            </Text>
            <Group gap="sm" wrap="wrap">
              <Button variant="filled" color="brand" disabled>
                {t('button_save_changes')}
              </Button>
              <Button variant="default" disabled>
                {t('button_cancel')}
              </Button>
            </Group>
          </Stack>

          {/* ── Loading (negative flow) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              loading — Mantine loader shown, height unchanged (44px)
            </Text>
            <Button variant="filled" color="brand" loading>
              {t('button_saving')}
            </Button>
          </Stack>

          {/* ── Long uk label — whitespace-normal, ≥44px, no clip at 320 (negative flow) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label — whitespace-normal break-words, stays ≥44px, no clip at 320
            </Text>
            <Button
              variant="filled"
              color="brand"
              fullWidth
              styles={{ root: { whiteSpace: 'normal', wordBreak: 'break-word' } }}
            >
              {t('button_save_changes')}
            </Button>
          </Stack>

        </Stack>
      </Box>
    )
  },
}
