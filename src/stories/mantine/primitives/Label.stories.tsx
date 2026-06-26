import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Stack, Text, TextInput } from '@mantine/core'
import { storyT } from '../../_storyI18n'

const meta: Meta = {
  title: 'Mantine/Primitives/Label',
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

          {/* ── Required (default, no asterisk) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              required (default) — 14px/fw500/gray-7 label; no asterisk even when required prop is set
            </Text>
            <TextInput
              label={t('label_email')}
              required
            />
          </Stack>

          {/* ── Optional (marked, full reference pattern) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              optional — label + quieter suffix + placeholder + 12px gray-5 description hint (owner reference)
            </Text>
            <TextInput
              label={<>{t('label_job_title')} <Text span c="gray.5" fz="sm" fw={400}>{t('label_optional')}</Text></>}
              placeholder={t('label_job_placeholder')}
              description={t('label_job_hint')}
            />
          </Stack>

          {/* ── Long label wrap (negative) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label — wraps to ≥2 lines at 320; no clip; no h-scroll (sq/en/uk/it)
            </Text>
            <TextInput
              label={t('label_long')}
            />
          </Stack>

          {/* ── Disabled control (negative) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — label dimmed consistently with input; no bright label over greyed field
            </Text>
            <TextInput
              label={t('label_email')}
              disabled
            />
          </Stack>

        </Stack>
      </Box>
    )
  },
}
