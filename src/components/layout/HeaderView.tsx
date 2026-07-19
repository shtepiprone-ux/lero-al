'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'
import { ActionIcon, Anchor, Box, Group, Text } from '@mantine/core'
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
      <Anchor
        unstyled
        component={Link}
        href={`/${locale}`}
        className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        onClick={onNavigate}
      >
        {t('home')}
      </Anchor>
      <Anchor
        unstyled
        component={Link}
        href={`/${locale}/listings`}
        className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
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

  return (
    <Box component="header" className="site-header sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Task 590 (owner 2026-07-13): flex-wrap below a custom 390px breakpoint — the right
          cluster's natural width (LocaleSwitcher + Favorites + notification bell + hamburger, all
          icon-only/compact controls) sits at an exact 0px-margin fit alongside the logo at 320px
          in production (no active overflow, but no safety buffer either); 390px+ already measures
          a comfortable fit, so the wrap is scoped narrowly to <390 only (owner 2026-07-13) rather
          than the standard `sm` (640px) breakpoint. Wrapping the logo alone onto row 1 and the full
          control cluster onto row 2 below 390px gives real breathing room instead of a knife-edge
          fit; ≥390px keeps the original single-row h-16 layout byte-for-byte (measured 0px overflow
          margin at 390 itself, comfortable margin above it). `min-[390px]:` is Tailwind's arbitrary-
          value variant syntax (no custom breakpoint added to tailwind config — a one-off inline
          value, not a new named scale entry). */}
      {/* Task 629: every Group/Anchor/Text below is `unstyled` — @mantine/core/styles.css ships with
          no `@layer` wrapper (verified: zero `@layer` in the package's compiled CSS), so its own
          classes (flex/gap/justify-content on Group, color/font-size/font-weight/text-decoration on
          Anchor/Text) are unlayered and win over ANY Tailwind `@layer utilities` class regardless of
          source order — the opposite of the "Tailwind overrides Mantine" assumption documented in
          docs/mantine-responsive-design-system.md §4. `unstyled` strips each primitive's own CSS
          module class, handing 100% of styling back to the verbatim Tailwind classNames below (the
          only way to keep this chrome byte-for-byte identical). `Box` (the `<header>` wrapper above)
          needs no `unstyled` — it ships zero baked CSS of its own. */}
      <Group unstyled className="container-wide flex flex-wrap min-[390px]:flex-nowrap items-center justify-between gap-2 py-2 min-[390px]:h-16 min-[390px]:py-0">
        {/* Logo */}
        <Anchor unstyled component={Link} href={`/${locale}`} className="flex items-center gap-1 font-bold text-xl">
          <Text unstyled component="span" className="text-primary">Lero</Text>
          <Text unstyled component="span" className="text-foreground">.al</Text>
        </Anchor>

        {/* Desktop nav — `visibleFrom="md"` replaces `hidden md:flex` (Box-level mechanism, unaffected
            by `unstyled`); `flex` is explicit in className since `unstyled` removes Group's own
            `display:flex` default. */}
        <Group unstyled visibleFrom="md" className="flex items-center gap-6">
          <NavLinks />
        </Group>

        {/* Right side — <390px (owner 2026-07-13): once this cluster wraps to its own row, it
            spans the full row width and distributes its controls edge-to-edge (`justify-between`)
            instead of clustering left; ≥390px reverts to the original compact inline `gap-2` row
            sharing the line with the logo (byte-identical to pre-Task-590 at that width). */}
        <Group unstyled className="flex items-center w-full justify-between gap-2 min-[390px]:w-auto min-[390px]:justify-start">
          {/* Language switcher — the ONE canonical adaptive LocaleSwitcher at all breakpoints
              (Task 577): its MantineDropdownMenu is already adaptive (anchored menu ≥640,
              full-width bottom sheet <640), so the previous separate mobile combobox was a
              redundant parallel implementation — deleted. Compact `EN ⌄` trigger sits inline
              next to the other compact header controls (documented icon/compact exemption,
              clause 11 — unchanged from how the removed combobox trigger was exempted). */}
          <LocaleSwitcher onSwitch={onSwitchLocale} />

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
              `visibleFrom="md"` replaces `hidden md:flex`; `flex` is explicit since `unstyled`
              removes Group's own `display:flex` default (see the container-row comment above). */}
          {user && (
            <Group unstyled visibleFrom="md" className="flex items-center gap-2">
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
              (variant="default", 2.75rem/44px min touch target) */}
          <ActionIcon
            variant="default"
            aria-label={tc('aria_open_menu')}
            hiddenFrom="md"
            mih="2.75rem"
            miw="2.75rem"
            onClick={onOpenMobile}
          >
            <Menu className="h-5 w-5" />
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

      {authSheetSlot}
    </Box>
  )
}
