import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text, ActionIcon, useMantineTheme } from '@mantine/core'
import { Bell } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { HeaderActions } from '@/components/layout/HeaderActions'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 575 correction, owner 2026-07-11): the rendered-assert
 * harness (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing enforcement under
 * `--mantine-only` to stories whose title matches this exact prefix — same rationale as
 * `FiltersPanelShell`/`PhoneField`. `HeaderActions` is app-shell layout, not a design-system
 * primitive, but this title is a display-grouping choice for gate enforcement, not a taxonomy claim.
 *
 * `HeaderActions` is NOT in the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set, so it
 * renders inline with no auto-click needed — both fixture states are always visible for capture.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/HeaderActions',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
    const theme = useMantineTheme()

    // Placeholder standing in for the real NotificationBell (which owns its own hooks and is
    // dynamic ssr:false in the app) — the story only proves the slot is rendered, never hook-calls
    // the real bell (Sprint 44 plan STOP-AND-ASK #1).
    const bellPlaceholder = (
      <ActionIcon variant="subtle" mih={theme.other.touchTarget} miw={theme.other.touchTarget} aria-label={t('header_actions_bell_slot_aria')}>
        <Bell size={theme.other.iconSize.roomy} />
      </ActionIcon>
    )

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('header_actions_guest_caption')}
            </Text>
            <HeaderActions
              isAuthenticated={false}
              favoritesHref={`/${locale}/favorites`}
              onOpenAuth={() => {}}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('header_actions_authed_caption')}
            </Text>
            <HeaderActions
              isAuthenticated
              favoritesHref={`/${locale}/favorites`}
              onOpenAuth={() => {}}
              notificationSlot={bellPlaceholder}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
