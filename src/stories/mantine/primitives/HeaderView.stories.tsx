import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { HeaderView } from '@/components/layout/HeaderView'
import { MantineStoryShell } from '../_MantineStoryShell'
import { NotificationBellView } from '@/modules/notifications/components/NotificationBellView'
import { notificationRows } from '../../fixtures/notifications.fixture'

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
 * Task 878: `notificationSlot` now renders the real, presentational `NotificationBellView` (plain
 * `notifications`/`unreadCount`/`onRead` props, no data-fetching hook — same split-gate guarantee as
 * `HeaderView` itself) fed from the shared `notifications.fixture.ts` rows, replacing the previous
 * hand-made `ActionIcon` stand-in that rendered `variant="subtle"` with no `Indicator` and no popover
 * while production rendered `variant="default"` with both — the exact divergence the owner reported.
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
    const rows = notificationRows(locale)
    const realBell = (
      <NotificationBellView
        notifications={rows}
        unreadCount={rows.filter(row => !row.is_read).length}
        onRead={() => {}}
      />
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
              notificationSlot={realBell}
              authSheetSlot={null}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}

// Task 876 (GR-3a EXTEND — Mantine/Primitives/HeaderView): the sign-out pending state — the
// header keeps its signed-in layout while UserMenu's trigger and the mobile hamburger both show
// the native Mantine `loading` state (R3). Same authenticated fixture and real bell as `Default`
// (Task 878), so this proves only the added `isSigningOut` prop, not a new shell composition.
export const SigningOut: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
    const rows = notificationRows(locale)
    const realBell = (
      <NotificationBellView
        notifications={rows}
        unreadCount={rows.filter(row => !row.is_read).length}
        onRead={() => {}}
      />
    )

    return (
      <MantineStoryShell>
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
            isSigningOut
            mobileOpen={false}
            onOpenMobile={() => {}}
            onCloseMobile={() => {}}
            notificationSlot={realBell}
            authSheetSlot={null}
          />
        </Stack>
      </MantineStoryShell>
    )
  },
}
