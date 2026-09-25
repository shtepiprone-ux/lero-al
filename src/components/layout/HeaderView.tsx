'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'
import { ActionIcon, Anchor, Box, Button, Divider, Flex, Group, Text, useMantineTheme } from '@mantine/core'
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'
import { HeaderActions } from '@/components/layout/HeaderActions'
import { UserMenu } from '@/components/layout/UserMenu'
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer'
import type { AuthView } from '@/modules/auth/components/AuthSheet'

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
      <Button
        component={Link}
        href={`/${locale}`}
        variant="transparent"
        onClick={onNavigate}
      >
        {t('home')}
      </Button>
      <Button
        component={Link}
        href={`/${locale}/listings`}
        variant="transparent"
        onClick={onNavigate}
      >
        {t('listings')}
      </Button>
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
  /** True while the sign-out transition is pending (Task 876): shows a Mantine `loading` state on
   *  the UserMenu trigger and the mobile hamburger, while the header itself keeps its signed-in layout. */
  isSigningOut?: boolean
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
  isSigningOut,
  mobileOpen,
  onOpenMobile,
  onCloseMobile,
  notificationSlot,
  authSheetSlot,
}: HeaderViewProps) {
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  return (
    <Box component="header" className="site-header" pos="sticky" top={0} w="100%" bg="white" style={{ zIndex: theme.other.zIndex.siteHeader }}>
      {/* Task 590 (owner 2026-07-13) / D30, Task 879 (D81-7): flex-wrap below the `xs1` (390px)
          theme breakpoint — the right cluster's natural width (LocaleSwitcher + Favorites +
          notification bell + hamburger, all icon-only/compact controls) sits at an exact 0px-margin
          fit alongside the logo at 320px in production (no active overflow, but no safety buffer
          either); 390px+ already measures a comfortable fit, so the wrap is scoped narrowly to
          <390 only rather than the standard `sm` (640px) breakpoint. Wrapping the logo alone onto
          row 1 and the full control cluster onto row 2 below 390px gives real breathing room
          instead of a knife-edge fit; ≥390px keeps the original single-row h-16 layout byte-for-byte
          (measured 0px overflow margin at 390 itself, comfortable margin above it). */}
      <Flex
        className="container-wide"
        wrap={{ base: 'wrap', xs1: 'nowrap' }}
        align="center"
        justify="space-between"
        gap="xs"
        py={{ base: 'xs', xs1: 0 }}
        h={{ base: 'auto', xs1: theme.other.boxSize.siteHeaderBar }}
      >
        {/* Logo */}
        <Anchor component={Link} href={`/${locale}`} underline="never" fz="xl" fw={700} lh={theme.other.lineHeight.siteWordmark}>
          <Group component="span" gap="tight" wrap="nowrap">
            <Text span inherit c="brand">Lero</Text>
            <Text span inherit c="gray.8">.al</Text>
          </Group>
        </Anchor>

        {/* Desktop nav — `visibleFrom="md"` replaces `hidden md:flex`. */}
        <Group gap={0} wrap="nowrap" visibleFrom="md">
          <NavLinks />
        </Group>

        {/* Right side — <390px (owner 2026-07-13): once this cluster wraps to its own row, it
            spans the full row width and distributes its controls edge-to-edge (`justify-between`)
            instead of clustering left; ≥390px reverts to the original compact inline `gap-2` row
            sharing the line with the logo (byte-identical to pre-Task-590 at that width). */}
        <Flex
          align="center"
          gap="xs"
          w={{ base: '100%', xs1: 'auto' }}
          justify={{ base: 'space-between', xs1: 'flex-start' }}
        >
          {/* Language switcher — the ONE canonical adaptive LocaleSwitcher at all breakpoints
              (Task 577): its MantineDropdownMenu is already adaptive (anchored menu ≥640,
              full-width bottom sheet <640), so the previous separate mobile combobox was a
              redundant parallel implementation — deleted. Compact `EN ⌄` trigger sits inline
              next to the other compact header controls (documented icon/compact exemption,
              clause 11 — unchanged from how the removed combobox trigger was exempted). */}
          <LocaleSwitcher onSwitch={onSwitchLocale} />

          {/* Trailing cluster — Task 787 (owner mobile top-bar contract, 2026-09-04): notifications,
              Favorites and the burger must sit GROUPED beside each other, Favorites nearest the
              burger, below `md`. Below the bar's own 390px wrap point the right side is
              `width:100%; justify-content:space-between` (Task 590, unchanged) so it can spread a
              two-item row (locale switcher vs. everything else) full-width for breathing room; with
              the individual controls as DIRECT right-side children that same space-between would
              spread every control evenly (measured ~37px gaps at 375px, not the ~8px `gap` token),
              scattering Favorites away from the burger. Wrapping notifications/Favorites/UserMenu/
              burger/drawer in ONE inner group turns them into a single flex item, so the right
              side's space-between spreads only [locale switcher] vs. [this cluster] and the
              cluster's own `gap="xs"` (same token role as the right side, R7: no new token) keeps
              its members tightly adjacent at every width. */}
          <Group gap="xs" wrap="nowrap">
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
                `visibleFrom="md"` replaces `hidden md:flex`. */}
            {user && (
              <Group gap="xs" wrap="nowrap" visibleFrom="md">
                <UserMenu
                  user={user}
                  locale={locale}
                  onNavigate={onNavigate}
                  onOpenAdmin={onOpenAdmin}
                  onLogout={onLogout}
                  isSigningOut={isSigningOut}
                />
              </Group>
            )}

            {/* Mobile hamburger — icon-only trigger (clause-11 documented exemption), mirrors the
                canonical icon-only ActionIcon reference in DropdownMenu.stories.tsx block 3
                (variant="default", 2.75rem/44px min touch target). */}
            <ActionIcon
              variant="default"
              aria-label={tc('aria_open_menu')}
              hiddenFrom="md"
              mih={theme.other.touchTarget}
              miw={theme.other.touchTarget}
              onClick={onOpenMobile}
              loading={isSigningOut}
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
        </Flex>
      </Flex>

      <Divider />

      {authSheetSlot}
    </Box>
  )
}
