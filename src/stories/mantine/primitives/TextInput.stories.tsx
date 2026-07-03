import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text, TextInput } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/TextInput',
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

          {/* ── basic — resting chrome + required (no asterisk) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              basic — gray-2 border / gray-4 placeholder / gray-8 text / shadow-xs / brand focus / required = no asterisk
            </Text>
            <TextInput
              label={t('label_email')}
              placeholder={t('ti_placeholder')}
              required
            />
          </Stack>

          {/* ── label + description — hint renders BELOW the input ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              label + description — hint renders BELOW the input (inputWrapperOrder: label/input/description/error)
            </Text>
            <TextInput
              label={t('label_job_title')}
              placeholder={t('label_job_placeholder')}
              description={t('label_job_hint')}
            />
          </Stack>

          {/* ── optional — (optional) suffix + placeholder + description below ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              optional — quiet (optional) suffix + placeholder + description-below (owner reference pattern)
            </Text>
            <TextInput
              label={
                <>
                  {t('label_job_title')}{' '}
                  <Text span c="gray.5" fz="sm" fw={400}>{t('label_optional')}</Text>
                </>
              }
              placeholder={t('label_job_placeholder')}
              description={t('label_job_hint')}
            />
          </Stack>

          {/* ── error — red border + red message + aria-invalid (negative flow) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — red border + red message text + aria-invalid; label unchanged
            </Text>
            <TextInput
              label={t('label_email')}
              placeholder={t('ti_placeholder')}
              required
              error={t('ti_error')}
            />
          </Stack>

          {/* ── disabled — dimmed input + dimmed label (negative flow) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — dimmed input + dimmed label; no focus ring; no pointer
            </Text>
            <TextInput
              label={t('label_email')}
              placeholder={t('ti_placeholder')}
              disabled
            />
          </Stack>

          {/* ── long label (negative flow) — wraps ≥2 lines at 320; no clip; no h-scroll ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label — wraps to ≥2 lines at 320; no clip; no h-scroll at any locale (sq/en/uk/it)
            </Text>
            <TextInput
              label={t('label_long')}
              placeholder={t('ti_name_placeholder')}
            />
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
