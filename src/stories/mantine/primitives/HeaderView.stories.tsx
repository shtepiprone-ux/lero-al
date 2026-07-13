import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text, ActionIcon } from '@mantine/core'
import { Bell } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { HeaderView } from '@/components/layout/HeaderView'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 590, same rationale as `HeaderActions`/`FiltersPanelShell`):
 * the rendered-assert harness (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing
 * enforcement under `--mantine-only` to stories whose title matches this exact prefix. `HeaderView`
 * is app-shell layout, not a design-system primitive, but this title is a display-grouping choice for
 * gate enforcement, not a taxonomy claim.
 *
 * Split-gate proof (docs/component-rules.md → "Container / Presentational Primitive Split"): both
 * fixtures below are PLAIN props — no `useUser`/`useRouter` mock, no `.storybook` module alias, no
 * live Supabase. `HeaderView` only calls `useTranslations`/`useLocale` internally (i18n, allowed).
 *
 * `HeaderView` is NOT in the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set, so it renders
 * inline with no auto-click needed. Header bars are NOT overlays (unlike `MobileNavDrawer`'s Drawer/
 * `UserMenu`'s DropdownMenu), so stacking a guest AND an authenticated instance vertically is safe —
 * no overlay-collision risk (Task 578/585 lesson). Per the kickoff's STOP-AND-ASK guard: both fixtures
 * keep `mobileOpen=false` and a `null` `authSheetSlot` — the open-drawer/open-auth-sheet states are
 * already covered by `MobileNavDrawer.stories.tsx`/`AuthSheet` itself; this story only proves the
 * closed-state SHELL composition (logo · desktop-nav vs hamburger · right-cluster order), which is
 * exactly the gap that let Task 586 ship a hamburger next to the desktop UserMenu undetected.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/HeaderView',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    // Placeholder standing in for the real NotificationBell (own hooks, dynamic ssr:false in the
    // app) — same placeholder pattern as HeaderActions.stories.tsx; never hook-calls the real bell.
    const bellPlaceholder = (
      <ActionIcon variant="subtle" mih="2.75rem" miw="2.75rem" aria-label={t('header_actions_bell_slot_aria')}>
        <Bell className="size-5" />
      </ActionIcon>
    )

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('header_view_caption_guest')}
            </Text>
            <HeaderView
              isAuthenticated={false}
              user={null}
              locale={locale}
              onOpenAuth={() => {}}
              onSwitchLocale={() => {}}
              onNavigate={() => {}}
              onOpenAdmin={() => {}}
              onLogout={() => {}}
              mobileOpen={false}
              onOpenMobile={() => {}}
              onCloseMobile={() => {}}
              notificationSlot={undefined}
              authSheetSlot={null}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('header_view_caption_authed')}
            </Text>
            <HeaderView
              isAuthenticated
              user={{ name: 'Alba Krasniqi', avatar_url: null, role: 'user' }}
              locale={locale}
              onOpenAuth={() => {}}
              onSwitchLocale={() => {}}
              onNavigate={() => {}}
              onOpenAdmin={() => {}}
              onLogout={() => {}}
              mobileOpen={false}
              onOpenMobile={() => {}}
              onCloseMobile={() => {}}
              notificationSlot={bellPlaceholder}
              authSheetSlot={null}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
