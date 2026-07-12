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
 * Only the LOGGED-IN fixture is rendered open. A naive attempt to also render a second,
 * simultaneously-opened logged-out `MobileNavDrawer` was tried and empirically confirmed to
 * reproduce the exact Task 578/585 defect class: two independent, uncontrolled overlays anchored
 * to the same screen position (both `MantineDrawer`s render at `position:fixed; right:0` on
 * desktop, and both as full-width bottom sheets on mobile) — the second-mounted one completely
 * hides the first, at every breakpoint. Resolved the same way Task 585 resolved `UserMenu`: render
 * ONE open fixture (logged-in — the superset: user header + full nav + destructive Logout) and
 * verify the logged-out branch (nav + Login/Register/Register-as-agent) by code inspection of
 * `MobileNavDrawer.tsx`'s `{user ? … : …}` conditionals, not by forking the primitive or stacking
 * a second open overlay.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/MobileNavDrawer',
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
        <Text size="xs" c="gray.5" fw={500} mb="md">
          {t('mobile_nav_drawer_caption')}
        </Text>
        <MobileNavDrawer
          opened
          onClose={() => {}}
          user={{ name: 'Alba Krasniqi', avatar_url: null }}
          locale={locale}
          onNavigate={() => {}}
          onOpenAuth={() => {}}
          onLogout={() => {}}
        />
      </MantineStoryShell>
    )
  },
}
