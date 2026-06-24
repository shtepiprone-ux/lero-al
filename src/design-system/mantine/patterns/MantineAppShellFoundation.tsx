'use client'

import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Avatar,
  Stack,
  Box,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

export interface AppShellNavItem {
  label: string
  href: string
  active?: boolean
}

export interface MantineAppShellFoundationProps {
  siteName: string
  navItems: AppShellNavItem[]
  userName: string
  burgerAriaLabel: string
  children?: React.ReactNode
}

/**
 * Canonical AppShell pattern — responsive side-nav + header.
 *
 * Mobile (<sm / 640px): navbar collapses; Burger button in header opens it.
 * Tablet (sm+): navbar is visible by default in a side rail.
 * Desktop (lg+): navbar always visible.
 *
 * Responsive API: AppShell.navbar.breakpoint = 'sm' collapses at <640px.
 * Touch targets: NavLink min-h defaults to 44px via Mantine size="md".
 */
export function MantineAppShellFoundation({
  siteName,
  navItems,
  userName,
  burgerAriaLabel,
  children,
}: MantineAppShellFoundationProps) {
  const [opened, { toggle }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label={burgerAriaLabel}
            />
            <Text fw={700} size="lg" c="brand">
              {siteName}
            </Text>
          </Group>
          <Group gap="xs" visibleFrom="sm">
            <Avatar size="sm" radius="xl" color="brand" />
            <Text size="sm">{userName}</Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap={4}>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              label={item.label}
              active={item.active}
              component="a"
              href={item.href}
              onClick={() => toggle()}
              styles={{ root: { borderRadius: 'var(--mantine-radius-md)', minHeight: '2.75rem' } }}
            />
          ))}
        </Stack>
        <Box
          mt="auto"
          visibleFrom="sm"
          style={{ borderTop: '1px solid var(--mantine-color-gray-2)', paddingTop: 'var(--mantine-spacing-sm)' }}
        >
          <Group gap="xs" px="xs">
            <Avatar size="sm" radius="xl" color="brand" />
            <Text size="sm">{userName}</Text>
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  )
}
