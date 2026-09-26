import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 576, canonical Mantine story location gate —
 * same rationale as `HeaderActions`/`FiltersPanelShell`/`PhoneField`): the rendered-assert
 * harness only gives PERMANENT, standing enforcement under `--mantine-only` to stories whose
 * title matches this exact prefix.
 *
 * `LocaleSwitcher` is not in the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set (that
 * set matches on `DropdownMenu`, not `LocaleSwitcher`, as the title's last segment), so it
 * renders the closed trigger — consistent with every other non-overlay-titled Mantine primitive
 * story (`HeaderActions`, `FiltersPanelShell`). The menu-open interaction itself is already
 * covered by `Mantine/Primitives/DropdownMenu`'s own story.
 *
 * Task 852 R22/GR-3b — the `fullWidth` demo's wrapper has no fixed width: `fullWidth` means "fills
 * its container", and `LocaleSwitcher` has no single production parent width to reproduce here (it
 * is consumed both by the admin sidebar footer and the public header), so the demo container stays
 * fluid rather than hardcoding one caller's width.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/LocaleSwitcher',
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
              {t('locale_switcher_default_caption')}
            </Text>
            <LocaleSwitcher onSwitch={() => {}} />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('locale_switcher_showlabel_caption')}
            </Text>
            <LocaleSwitcher onSwitch={() => {}} showLabel />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('locale_switcher_pending_caption')}
            </Text>
            <LocaleSwitcher onSwitch={() => {}} isPending />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('locale_switcher_fullwidth_caption')}
            </Text>
            <Stack>
              <LocaleSwitcher onSwitch={() => {}} showLabel fullWidth />
            </Stack>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
