import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 578/585 precedent): the rendered-assert harness only
 * gives PERMANENT, standing enforcement under `--mantine-only` to stories whose title matches
 * this exact prefix.
 *
 * `MobileNavDrawer` is NOT in the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set, so the
 * harness will NOT auto-click it open — this story renders it `opened` directly (no trigger, per
 * the primitive's controlled API — the hamburger trigger stays container-owned in `Header.tsx`).
 *
 * Only ONE fixture is rendered open per page load. A naive attempt to render two
 * simultaneously-opened `MobileNavDrawer`s (logged-in + logged-out) was tried and empirically
 * confirmed to reproduce the exact Task 578/585 defect class: two independent, uncontrolled
 * overlays anchored to the same screen position (both `MantineDrawer`s render at
 * `position:fixed; right:0` on desktop, and both as full-width bottom sheets on mobile) — the
 * second-mounted one completely hides the first, at every breakpoint. Resolved the same way
 * Task 585 resolved `UserMenu`: exactly one open `MobileNavDrawer` per render, its auth state
 * controlled by the `loggedIn` arg (default `true`, the superset: user header + full nav +
 * destructive Logout) — Task 755 added this arg so the logged-out branch (nav +
 * Login/Register/Register-as-agent) can be captured as rendered evidence on a SEPARATE page
 * load (`&args=loggedIn:false`), not just verified by code inspection.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/MobileNavDrawer',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
  args: { loggedIn: true },
  argTypes: { loggedIn: { control: 'boolean' } },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
    const loggedIn = (args as { loggedIn?: boolean }).loggedIn ?? true

    return (
      <MantineStoryShell>
        <Text size="xs" c="gray.5" fw={500} mb="md">
          {t('mobile_nav_drawer_caption')}
        </Text>
        <MobileNavDrawer
          opened
          onClose={() => {}}
          user={loggedIn ? { name: 'Alba Krasniqi', avatar_url: null } : null}
          locale={locale}
          onNavigate={() => {}}
          onOpenAuth={() => {}}
          onLogout={() => {}}
        />
      </MantineStoryShell>
    )
  },
}
