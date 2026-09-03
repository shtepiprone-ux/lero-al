import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Group, Stack, Text, ThemeIcon, useMantineTheme } from '@mantine/core'
import { Star } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

// Task 782, Phase 1 (AC1/AC2) — the standalone canonical proof for `theme.other.iconSize`,
// `theme.other.boxSize`, and the 4 project `ThemeIcon` sizes above/outside Mantine's own native
// scale (`decorative`/`hero`/`spotlight`/`colossal` — see theme.ts's `ThemeIcon` component block).
// This story renders every key at its rendered size with its name, BEFORE any consumer in Phase 2
// is converted — the UI-hierarchy gate this task's own kickoff requires (§7.1).
const meta: Meta = {
  title: 'Mantine/Primitives/DimensionTokens',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

function IconSizeRow({ name, px }: { name: string; px: number }) {
  return (
    <Group gap="sm" align="center" wrap="nowrap" data-testid={`icon-size-${name}`} data-expected-px={px}>
      <Box w={80} style={{ flexShrink: 0 }}>
        <Text size="xs" c="gray.6" fw={500}>{name}</Text>
      </Box>
      <Star size={px} color="var(--mantine-color-brand-7)" data-testid={`icon-size-${name}-svg`} />
      <Text size="xs" c="gray.5">{px}px</Text>
    </Group>
  )
}

function BoxSizeRow({ name, rem, px }: { name: string; rem: string; px: number }) {
  return (
    <Stack gap={4} data-testid={`box-size-${name}`} data-expected-px={px}>
      <Text size="xs" c="gray.6" fw={500}>{name} — {rem} ({px}px)</Text>
      <Box
        maw={rem}
        h={24}
        bg="var(--mantine-color-brand-1)"
        bd="1px solid var(--mantine-color-brand-4)"
        data-testid={`box-size-${name}-box`}
      />
    </Stack>
  )
}

function ThemeIconRow({ name, px }: { name: string; px: number }) {
  return (
    <Group gap="sm" align="center" wrap="nowrap" data-testid={`ti-size-${name}`} data-expected-px={px}>
      <Box w={100} style={{ flexShrink: 0 }}>
        <Text size="xs" c="gray.6" fw={500}>{name}</Text>
      </Box>
      <ThemeIcon size={name} radius="xl" color="brand" variant="light" data-testid={`ti-size-${name}-icon`}>
        <Star size={16} />
      </ThemeIcon>
      <Text size="xs" c="gray.5">{px}px</Text>
    </Group>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, key)

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="sm" fw={600}>{t('storybook.mantine.dimension_tokens_icon_heading')}</Text>
            <IconSizePreview />
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={600}>{t('storybook.mantine.dimension_tokens_box_heading')}</Text>
            <BoxSizePreview />
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={600}>{t('storybook.mantine.dimension_tokens_themeicon_heading')}</Text>
            <ThemeIconPreview />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}

function IconSizePreview() {
  const theme = useMantineTheme()
  const entries = Object.entries(theme.other.iconSize) as [string, number][]
  return (
    <Stack gap="xs">
      {entries.map(([name, px]) => (
        <IconSizeRow key={name} name={name} px={px} />
      ))}
    </Stack>
  )
}

function BoxSizePreview() {
  const theme = useMantineTheme()
  const PX_BY_KEY: Record<string, number> = {
    statusDot: 8,
    thumbnail: 112,
    truncateLabel: 120,
    dropdownPanel: 220,
    compactTrigger: 280,
    emptyState: 360,
    prose: 576,
    ctaSection: 672,
    content: 768,
  }
  const entries = Object.entries(theme.other.boxSize) as [string, string][]
  return (
    <Stack gap="sm">
      {entries.map(([name, rem]) => (
        <BoxSizeRow key={name} name={name} rem={rem} px={PX_BY_KEY[name]} />
      ))}
    </Stack>
  )
}

function ThemeIconPreview() {
  const theme = useMantineTheme()
  const rows: Array<{ name: string; px: number }> = [
    { name: 'decorative', px: theme.other.iconSize.decorative },
    { name: 'hero', px: theme.other.iconSize.hero },
    { name: 'spotlight', px: theme.other.iconSize.spotlight },
    { name: 'colossal', px: theme.other.iconSize.colossal },
  ]
  return (
    <Stack gap="xs">
      {rows.map((r) => (
        <ThemeIconRow key={r.name} name={r.name} px={r.px} />
      ))}
    </Stack>
  )
}
