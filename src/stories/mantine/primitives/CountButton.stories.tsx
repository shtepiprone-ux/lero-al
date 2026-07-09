import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineCountButton } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 554/556/566/567 precedent) — the rendered-assert
 * harness's `--mantine-only` gate only gives standing enforcement to stories under this exact
 * prefix.
 *
 * `MantineCountButton` (Task 567 round-2, Fix 3): count renders inline in the Button's
 * `rightSection` (like a `leftSection` icon), never as an absolute corner badge — the round-1
 * corner-badge approach was genuinely clipped by Mantine `Button`'s own `overflow:hidden` root.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/CountButton',
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
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              with count — filled brand, count inline in rightSection (white pill, brand text)
            </Text>
            <MantineCountButton count={3} onClick={() => {}}>
              {t('count_button_label')}
            </MantineCountButton>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              no count (0 / undefined) — renders exactly like a plain Button, no badge
            </Text>
            <MantineCountButton count={0} onClick={() => {}}>
              {t('count_button_label')}
            </MantineCountButton>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              with count — default (bordered) variant, count inline
            </Text>
            <MantineCountButton variant="default" count={7} onClick={() => {}}>
              {t('count_button_label')}
            </MantineCountButton>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
