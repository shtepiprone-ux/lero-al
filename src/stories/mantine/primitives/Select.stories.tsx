import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Select, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'

const meta: Meta = {
  title: 'Mantine/Primitives/Select',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    const options = [
      { value: 'apartment', label: t('sel_option_apartment') },
      { value: 'house',     label: t('sel_option_house') },
      { value: 'commercial', label: t('sel_option_commercial') },
      { value: 'land',      label: t('sel_option_land') },
    ]

    return (
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        <Stack gap="xl">

          {/* 1 — basic: resting chrome / label / placeholder / description */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              basic — gray-2 border / shadow-xs / brand focus / gray-4 placeholder / 44px trigger / full-width ≤640
            </Text>
            <Select
              label={t('sel_label')}
              placeholder={t('sel_placeholder')}
              description={t('sel_hint')}
              data={options}
            />
          </Stack>

          {/* 2 — open state: dropdown anchored (desktop); dropdown bottom-sheet <640 = Batch C, pending */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              open state — anchored dropdown (desktop); ⚠️ dropdown bottom-sheet &lt;640 = Batch C, pending
            </Text>
            <Select
              label={t('sel_label')}
              placeholder={t('sel_placeholder')}
              data={options}
              defaultDropdownOpened
              comboboxProps={{ withinPortal: false }}
            />
          </Stack>

          {/* 3 — error: data-error on .mantine-Select-input → red-6 border / no shadow */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — data-error on .mantine-Select-input → red-6 border / no shadow; long uk option no clip@320
            </Text>
            <Select
              label={t('sel_label')}
              placeholder={t('sel_placeholder')}
              data={options}
              error={t('sel_error')}
            />
          </Stack>

          {/* 4 — disabled: whole control faded — label + field + chevron all at opacity 0.5 (§6e) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — whole control faded (label + field + chevron → opacity 0.5); transparent bg; not-allowed; no focus ring
            </Text>
            <Select
              label={t('sel_label')}
              placeholder={t('sel_placeholder')}
              data={options}
              disabled
            />
          </Stack>

        </Stack>
      </Box>
    )
  },
}
