import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { within, userEvent } from 'storybook/test'
import { storyT } from '../../_storyI18n'
import { MantineCopyIdButton } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 656) — the rendered-assert harness's
 * `--mantine-only` gate only gives standing enforcement to stories under this exact
 * prefix.
 *
 * `MantineCopyIdButton` owns the clipboard write + the Copy↔Check copied-state toggle
 * internally (Task 656 extraction from `ListingCard.tsx`). The "copied" section below is
 * reached by a real click in the `play` function (never a baked `defaultCopied`-style
 * prop — the component has none), matching the owner's real-user-gesture rule for any
 * story demonstrating a non-resting state (docs/mantine-responsive-design-system.md §8.2).
 */
const meta: Meta = {
  title: 'Mantine/Primitives/CopyIdButton',
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
              {t('copy_id_button_resting_caption')}
            </Text>
            <MantineCopyIdButton
              id="story-listing-001"
              label="#1234"
              copyLabel={t('copy_id_button_aria_copy')}
              copiedLabel={t('copy_id_button_aria_copied')}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('copy_id_button_copied_caption')}
            </Text>
            <MantineCopyIdButton
              id="story-listing-002"
              label="#5678"
              copyLabel={t('copy_id_button_aria_copy')}
              copiedLabel={t('copy_id_button_aria_copied')}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const buttons = await canvas.findAllByRole('button')
    // Click ONLY the second instance so both states render side by side — the first
    // stays resting, the second shows the real click → copied transition.
    await userEvent.click(buttons[1])
  },
}
