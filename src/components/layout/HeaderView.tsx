'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'
import { ActionIcon, Anchor, Box, Group, Text, useMantineTheme } from '@mantine/core'
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'
import { HeaderActions } from '@/components/layout/HeaderActions'
import { UserMenu } from '@/components/layout/UserMenu'
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer'
import type { AuthView } from '@/modules/auth/components/AuthSheet'
import { cn } from '@/lib/utils'
import styles from './HeaderView.module.css'

// ── NavLinks ──────────────────────────────────────────────────────────────────
//
// Defined at module level (NOT inside HeaderView's render body) so that React sees
// a stable component type across renders. Defining it inside the render body
// creates a new function reference on every render, causing React to see a
// different component type during hydration vs SSR — this shifts the fiber ID
// counter and breaks Base UI's useId()-generated IDs (hydration mismatch).
//
// onNavigate is provided for the mobile sheet usage (closes the drawer).
// Desktop nav omits it — setMobileOpen(false) is a no-op when sheet is closed.

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('nav')
  const locale = useLocale()
  return (
    <>
      <Anchor
        unstyled
        component={Link}
        href={`/${locale}`}
        className={styles.navLink}
        onClick={onNavigate}
      >
        {t('home')}
      </Anchor>
      <Anchor
        unstyled
        component={Link}
        href={`/${locale}/listings`}
        className={styles.navLink}
        onClick={onNavigate}
      >
        {t('listings')}
      </Anchor>
    </>
  )
}

export interface HeaderViewProps {
  isAuthenticated: boolean
  /** Superset of MobileNavDrawer's `user` shape (adds `role`, required by UserMenu — both sub-primitives are unchanged, this just satisfies both contracts with the one object the container already holds). */
  user: { name: string | null; avatar_url: string | null; role: string } | null
  locale: string
  onOpenAuth: (view: AuthView) => void
  onSwitchLocale: (newLocale: string) => void
  onNavigate: (path: string) => void
  onOpenAdmin: () => void
  onLogout: () => void
  mobileOpen: boolean
  onOpenMobile: () => void
  onCloseMobile: () => void
  /** NotificationBell — container-owned (own hooks + dynamic ssr:false); forwarded as-is to HeaderActions. */
  notificationSlot?: ReactNode
  /** AuthSheet — container-owned (owns authOpen/authView state + the AUTH_SHEET_EVENT listener). */
  authSheetSlot?: ReactNode
}

export function HeaderView({
  isAuthenticated,
  user,
  locale,
  onOpenAuth,
  onSwitchLocale,
  onNavigate,
  onOpenAdmin,
  onLogout,
  mobileOpen,
  onOpenMobile,
  onCloseMobile,
  notificationSlot,
  authSheetSlot,
}: HeaderViewProps) {
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  return (
    <Box component="header" className={cn('site-header', styles.header)}>
      {/* Task 590 (owner 2026-07-13): flex-wrap below a custom 390px breakpoint — the right
          cluster's natural width (LocaleSwitcher + Favorites + notification bell + hamburger, all
          icon-only/compact controls) sits at an exact 0px-margin fit alongside the logo at 320px
          in production (no active overflow, but no safety buffer either); 390px+ already measures
          a comfortable fit, so the wrap is scoped narrowly to <390 only (owner 2026-07-13) rather
          than the standard `sm` (640px) breakpoint. Wrapping the logo alone onto row 1 and the full
          control cluster onto row 2 below 390px gives real breathing room instead of a knife-edge
          fit; ≥390px keeps the original single-row h-16 layout byte-for-byte (measured 0px overflow
          margin at 390 itself, comfortable margin above it). Task 706 (D30) moved this breakpoint
          from a Tailwind arbitrary-value utility into this module's own
          `@media (min-width: 390px)` rule (`HeaderView.module.css`) — still a one-off inline value,
          not a new named scale entry in the Mantine theme (§5.3 A3). */}
      {/* Task 629: every Group/Anchor/Text below is `unstyled` — @mantine/core/styles.css ships with
          no `@layer` wrapper (verified: zero `@layer` in the package's compiled CSS), so its own
          classes (flex/gap/justify-content on Group, color/font-size/font-weight/text-decoration on
          Anchor/Text) are unlayered and win over ANY Tailwind `@layer utilities` class regardless of
          source order — the opposite of the "Tailwind overrides Mantine" assumption documented in
          docs/mantine-responsive-design-system.md §4. `unstyled` strips each primitive's own CSS
          module class, handing 100% of styling back to the classes below (Task 706: `HeaderView.
          module.css`, same mechanism as the prior verbatim Tailwind classNames it replaces — the
          only way to keep this chrome byte-for-byte identical). `Box` (the `<header>` wrapper above)
          needs no `unstyled` — it ships zero baked CSS of its own. */}
      <Group unstyled className={cn('container-wide', styles.bar)}>
        {/* Logo */}
        <Anchor unstyled component={Link} href={`/${locale}`} className={styles.logo}>
          <Text unstyled component="span" className={styles.brandPrimary}>Lero</Text>
          <Text unstyled component="span" className={styles.brandForeground}>.al</Text>
        </Anchor>

        {/* Desktop nav — `visibleFrom="md"` replaces `hidden md:flex` (Box-level mechanism, unaffected
            by `unstyled`); `display:flex` is explicit in the module since `unstyled` removes Group's own
            `display:flex` default. */}
        <Group unstyled visibleFrom="md" className={styles.desktopNav}>
          <NavLinks />
        </Group>

        {/* Right side — <390px (owner 2026-07-13): once this cluster wraps to its own row, it
            spans the full row width and distributes its controls edge-to-edge (`justify-between`)
            instead of clustering left; ≥390px reverts to the original compact inline `gap-2` row
            sharing the line with the logo (byte-identical to pre-Task-590 at that width). */}
        <Group unstyled className={styles.rightCluster}>
          {/* Language switcher — the ONE canonical adaptive LocaleSwitcher at all breakpoints
              (Task 577): its MantineDropdownMenu is already adaptive (anchored menu ≥640,
              full-width bottom sheet <640), so the previous separate mobile combobox was a
              redundant parallel implementation — deleted. Compact `EN ⌄` trigger sits inline
              next to the other compact header controls (documented icon/compact exemption,
              clause 11 — unchanged from how the removed combobox trigger was exempted). */}
          <LocaleSwitcher onSwitch={onSwitchLocale} />

          {/* Trailing cluster — Task 787 (owner mobile top-bar contract, 2026-09-04): notifications,
              Favorites and the burger must sit GROUPED beside each other, Favorites nearest the
              burger, below `md`. Below the `.bar`'s own 390px wrap point `.rightCluster` is
              `width:100%; justify-content:space-between` (Task 590, unchanged) so it can spread a
              two-item row (locale switcher vs. everything else) full-width for breathing room; with
              the individual controls as DIRECT `.rightCluster` children that same space-between
              spread every control evenly (measured ~37px gaps at 375px, not the ~8px `gap` token),
              scattering Favorites away from the burger. Wrapping notifications/Favorites/UserMenu/
              burger/drawer in ONE inner group turns them into a single flex item, so
              `.rightCluster`'s space-between spreads only [locale switcher] vs. [this cluster] and
              the cluster's own `.trailingCluster` gap (same `--homepage-runtime-space-2` token as
              `.rightCluster`, R7: no new token) keeps its members tightly adjacent at every width. */}
          <Group unstyled className={styles.trailingCluster}>
            {/* Favorites + notification-bell slot + guest login/register — HeaderActions primitive
                (Task 575). NotificationBell stays container-owned (own hooks, dynamic ssr:false)
                and is passed as a slot — never hook-called inside the primitive. */}
            <HeaderActions
              isAuthenticated={isAuthenticated}
              favoritesHref={`/${locale}/favorites`}
              onOpenAuth={onOpenAuth}
              notificationSlot={notificationSlot}
            />

            {/* User menu — desktop, authenticated only (guest login/register live in HeaderActions).
                `visibleFrom="md"` replaces `hidden md:flex`; `display:flex` is explicit in the module
                since `unstyled` removes Group's own `display:flex` default (see the container-row
                comment above). */}
            {user && (
              <Group unstyled visibleFrom="md" className={styles.userMenuSlot}>
                <UserMenu
                  user={user}
                  locale={locale}
                  onNavigate={onNavigate}
                  onOpenAdmin={onOpenAdmin}
                  onLogout={onLogout}
                />
              </Group>
            )}

            {/* Mobile hamburger — icon-only trigger (clause-11 documented exemption), mirrors the
                canonical icon-only ActionIcon reference in DropdownMenu.stories.tsx block 3
                (variant="default", 2.75rem/44px min touch target). `size={20}` replaces the prior
                `h-5 w-5` Tailwind className (Task 706 §5.2): lucide's own `size` prop writes the SVG
                `width`/`height` attributes directly (20/20) and was measured to produce the identical
                20px computed box as the CSS class it replaces — "prop before module" (§3.7). */}
            <ActionIcon
              variant="default"
              aria-label={tc('aria_open_menu')}
              hiddenFrom="md"
              mih={theme.other.touchTarget}
              miw={theme.other.touchTarget}
              onClick={onOpenMobile}
            >
              <Menu size={theme.other.iconSize.roomy} />
            </ActionIcon>
            <MobileNavDrawer
              opened={mobileOpen}
              onClose={onCloseMobile}
              user={user}
              locale={locale}
              onNavigate={onNavigate}
              onOpenAuth={onOpenAuth}
              onLogout={onLogout}
            />
          </Group>
        </Group>
      </Group>

      {authSheetSlot}
    </Box>
  )
}
