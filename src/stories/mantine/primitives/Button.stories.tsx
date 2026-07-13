import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button, Group, Stack, Text } from '@mantine/core'
import { ArrowRight, LogOut, Save } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

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
      <MantineStoryShell>
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

          {/* ── Long label wrap (negative flow — theme default, no local override) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label — wraps to ≥2 lines at 320 via theme default; no clip; ≥44px (Task 502 fix)
            </Text>
            <Button
              variant="filled"
              color="brand"
              fullWidth
            >
              {t('button_long_label')}
            </Button>
          </Stack>

          {/* ── Link / tertiary (§6a-link) — no-icon, with-icon, destructive ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              link / tertiary (§6a-link) — transparent, no border, no hover fill
            </Text>
            <Group gap="sm" wrap="wrap">
              <Button variant="transparent">
                {t('button_link_no_icon')}
              </Button>
              <Button
                variant="transparent"
                leftSection={<ArrowRight size={16} aria-hidden />}
              >
                {t('button_link_with_icon')}
              </Button>
              <Button
                variant="transparent"
                color="red"
                leftSection={<LogOut size={16} aria-hidden />}
              >
                {t('button_link_destructive')}
              </Button>
            </Group>
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
