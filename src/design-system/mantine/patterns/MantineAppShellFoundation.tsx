'use client'

import {
  AppShell,
  Burger,
  Drawer,
  Group,
  NavLink,
  Text,
  Avatar,
  Stack,
  Box,
  getBreakpointValue,
  rem,
  useMantineTheme,
  useMatches,
  type AppShellProps,
  type MantineColor,
  type MantineBreakpoint,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { drawerFlexColumnStyles } from './MantineDrawer'

export interface AppShellNavItem {
  label: string
  href: string
  active?: boolean
}

export interface MantineAppShellFoundationProps {
  siteName: string
  /** Ignored when `navbarContent` is supplied. */
  navItems?: AppShellNavItem[]
  /** Ignored when `headerContent` is supplied. */
  userName?: string
  /** Ignored when `headerContent` is supplied. */
  burgerAriaLabel?: string
  children?: React.ReactNode
  /** Header block-size. Defaults to `theme.other.layout.appShellHeaderHeight` (Task 852). */
  headerHeight?: number
  /** Breakpoint at which the navbar collapses to a burger-toggled overlay. Default `'sm'`. */
  navbarBreakpoint?: MantineBreakpoint
  /** Replaces the default header row when present (Task 852 — e.g. AdminHeader). Task 852 R23/GR-3b:
   * must fill the header height and centre vertically (e.g. `Group h="100%"`). */
  headerContent?: React.ReactNode
  /** Replaces the default `navItems` nav list when present (Task 852 — e.g. AdminSidebar). */
  navbarContent?: React.ReactNode
  /** `AppShell.Main` background color. */
  mainBg?: MantineColor
  /** Controlled navbar-open state (Task 852 — lets a consumer coordinate its own header/navbar slots). */
  opened?: boolean
  onToggle?: () => void
  /** `AppShell.Main` padding. Defaults to `'md'` (Task 852 R13 — a consumer with its own page
   * containers, e.g. `AdminShell`, passes `0` so its children keep their existing padding). */
  padding?: AppShellProps['padding']
  /** Task 852 R27 — accessible label for the below-breakpoint `Drawer`'s close button (D852-1). */
  drawerCloseLabel?: string
}

/**
 * Canonical AppShell pattern — responsive side-nav + header.
 *
 * Task 852 R27/D852-1: below `navbarBreakpoint` the navigation lives in a Mantine `Drawer`
 * (100% wide below `sm`, `appShellNavbarWidth` wide from `sm` up to `navbarBreakpoint`), opened by
 * the header's `Burger`. At/above `navbarBreakpoint`, `AppShell.Navbar` is the fixed, always-visible
 * sidebar. The two never render the same content at once (R28).
 *
 * Touch targets: NavLink min-h defaults to `theme.other.touchTarget`.
 */
export function MantineAppShellFoundation({
  siteName,
  navItems = [],
  userName = '',
  burgerAriaLabel = '',
  children,
  headerHeight,
  navbarBreakpoint = 'sm',
  headerContent,
  navbarContent,
  mainBg,
  opened: openedProp,
  onToggle,
  padding = 'md',
  drawerCloseLabel = '',
}: MantineAppShellFoundationProps) {
  const theme = useMantineTheme()
  const [openedState, { toggle: toggleState }] = useDisclosure()
  const opened = openedProp ?? openedState
  const toggle = onToggle ?? toggleState

  // Task 852 R27/D852-1 — below `navbarBreakpoint` the navigation lives in a `Drawer`, not in
  // `AppShell.Navbar` (which stays fully collapsed there); above it, it is the fixed, always-visible
  // sidebar. `Drawer`'s own focus-trap/Escape/overlay-click-close/focus-return handle R29's
  // requirements natively — no hand-built equivalent is needed here any more.
  const collapseBreakpointPx = getBreakpointValue(navbarBreakpoint, theme.breakpoints)
  const belowNavbarBreakpoint = useMediaQuery(`(max-width: ${collapseBreakpointPx - 0.1}px)`) ?? false
  const drawerSize = useMatches({ base: '100%', sm: rem(theme.other.layout.appShellNavbarWidth) })

  const navContent = navbarContent ?? (
    <>
      <Stack gap={4}>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            label={item.label}
            active={item.active}
            component="a"
            href={item.href}
            onClick={() => toggle()}
            styles={{ root: { borderRadius: 'var(--mantine-radius-md)', minHeight: theme.other.touchTarget } }}
          />
        ))}
      </Stack>
      <Box
        mt="auto"
        visibleFrom={navbarBreakpoint}
        style={{ borderTop: `${theme.other.borderWidth.hairline} solid var(--mantine-color-gray-2)`, paddingTop: 'var(--mantine-spacing-sm)' }}
      >
        <Group gap="xs" px="xs">
          <Avatar size="sm" radius="xl" color="brand" />
          <Text size="sm">{userName}</Text>
        </Group>
      </Box>
    </>
  )

  return (
    <>
      <AppShell
        header={{ height: headerHeight ?? theme.other.layout.appShellHeaderHeight }}
        navbar={{
          width: theme.other.layout.appShellNavbarWidth,
          breakpoint: navbarBreakpoint,
          collapsed: { mobile: true },
        }}
        padding={padding}
      >
        <AppShell.Header>
          {headerContent ?? (
            <Group h="100%" px="md" justify="space-between">
              <Group>
                <Burger
                  opened={opened}
                  onClick={toggle}
                  hiddenFrom={navbarBreakpoint}
                  size="sm"
                  aria-label={burgerAriaLabel}
                />
                <Text fw={700} size="lg" c="brand">
                  {siteName}
                </Text>
              </Group>
              <Group gap="xs" visibleFrom={navbarBreakpoint}>
                <Avatar size="sm" radius="xl" color="brand" />
                <Text size="sm">{userName}</Text>
              </Group>
            </Group>
          )}
        </AppShell.Header>

        <AppShell.Navbar p="sm">
          {/* Task 852 R28 — mounted here only at/above `navbarBreakpoint`; below it, the identical
              content mounts in the `Drawer` instead, never both, so there is exactly one instance. */}
          {!belowNavbarBreakpoint && <Box h="100%">{navContent}</Box>}
        </AppShell.Navbar>

        <AppShell.Main bg={mainBg}>
          {children}
        </AppShell.Main>
      </AppShell>

      {/* Task 852 R27/D852-1 — the navigation drawer, mounted only below `navbarBreakpoint` (R28:
          `AppShell.Navbar` already owns `navContent` at/above it — this must not also mount it, or
          `[data-testid="admin-sidebar"]` would exist twice). `keepMounted` on the `Drawer` itself
          keeps that single instance stable across open/close (`display:none` while closed) instead
          of unmounting/remounting it every toggle. `ModalBase` defaults already provide R29's
          contract: `trapFocus`, `closeOnEscape`, `closeOnClickOutside` and `returnFocus` are all
          `true`. */}
      {belowNavbarBreakpoint && (
        <Drawer
          opened={opened}
          onClose={toggle}
          keepMounted
          position="left"
          padding="sm"
          size={drawerSize}
          withCloseButton
          closeButtonProps={{ 'aria-label': drawerCloseLabel }}
          // Task 852 R32/G1 — bound the body (shared with `MantineDrawer`'s Task 567 Fix 4 rule) so
          // `navContent`'s `h="100%"` resolves against a real height instead of growing to its full
          // content: `AdminSidebar`'s own `ScrollArea` scrolls the nav, and its footer stays pinned
          // in view. `body` carries no `padding`, so the `padding="sm"` prop above still applies.
          styles={drawerFlexColumnStyles}
        >
          {navContent}
        </Drawer>
      )}
    </>
  )
}
