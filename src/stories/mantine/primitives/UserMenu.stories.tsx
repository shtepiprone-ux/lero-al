import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { within, userEvent } from 'storybook/test'
import { storyT } from '../../_storyI18n'
import { UserMenu } from '@/components/layout/UserMenu'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 578, canonical Mantine story location gate —
 * same rationale as `HeaderActions`/`LocaleSwitcher`/`FiltersPanelShell`): the rendered-assert
 * harness only gives PERMANENT, standing enforcement under `--mantine-only` to stories whose
 * title matches this exact prefix.
 *
 * `UserMenu` is NOT in the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set (that set
 * matches on `DropdownMenu`, not `UserMenu`, as the title's last segment), so the harness will
 * NOT auto-click it open — the `play` function below opens both fixtures itself (Storybook runs
 * `play` automatically as part of the normal render lifecycle, before the harness's screenshot),
 * mirroring the `AdminLocaleSwitcher.stories.tsx` `MobileBottomSheet` precedent (Task 576).
 */
const meta: Meta = {
  title: 'Mantine/Primitives/UserMenu',
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
              {t('user_menu_regular_caption')}
            </Text>
            <UserMenu
              user={{ name: 'Alba Krasniqi', avatar_url: null, role: 'user' }}
              locale={locale}
              onNavigate={() => {}}
              onOpenAdmin={() => {}}
              onLogout={() => {}}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('user_menu_admin_caption')}
            </Text>
            <UserMenu
              user={{ name: 'Driton Berisha', avatar_url: null, role: 'admin' }}
              locale={locale}
              onNavigate={() => {}}
              onOpenAdmin={() => {}}
              onLogout={() => {}}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
  play: async ({ canvasElement }) => {
    if (window.innerWidth < 640) return
    const canvas = within(canvasElement)
    // Open ONLY the admin fixture — two independent uncontrolled MantineDropdownMenus both left
    // open overlap on desktop (Task 585). The admin menu is the differentiating proof (Dashboard
    // item); the regular fixture's trigger stays closed and fully visible. The regular menu's
    // no-Admin-item role gate is a plain `role === 'admin'|'moderator'` conditional in
    // UserMenu.tsx, verified by code inspection (not by a second open dropdown).
    const adminTrigger = await canvas.findByRole('button', { name: /Driton Berisha/ })
    await userEvent.click(adminTrigger)
  },
}
