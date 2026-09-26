import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box, Group, Text } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineAppShellFoundation } from '@/design-system/mantine/patterns/MantineAppShellFoundation';

const meta: Meta<typeof MantineAppShellFoundation> = {
  title: 'Patterns/Mantine/AppShellFoundation',
  component: MantineAppShellFoundation,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Mantine AppShell with responsive nav. Burger on mobile, fixed sidebar on desktop. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineAppShellFoundation>;

const makeArgs = (l = 'en') => ({
  siteName: 'Lero.al',
  navItems: [
    { href: '/', label: storyT(l, 'storybook.mantine.app_shell_nav_home') },
    { href: '/listings', label: storyT(l, 'storybook.mantine.app_shell_nav_listings') },
    { href: '/contact', label: storyT(l, 'storybook.mantine.app_shell_nav_contact') },
    { href: '/admin', label: storyT(l, 'storybook.mantine.app_shell_nav_admin') },
  ],
  userName: storyT(l, 'storybook.mantine.app_shell_user_name'),
  burgerAriaLabel: storyT(l, 'storybook.mantine.app_shell_burger_aria'),
  children: <Box p="xl">{storyT(l, 'storybook.mantine.page_title_dashboard')}</Box>,
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineAppShellFoundation {...makeArgs(l)} />;
  },
};

// Task 852 — proves the `headerContent`/`navbarContent` slot API (R2/AC2/AC6): a consumer supplying
// its own header/navbar renders through the same AppShell shell, unchanged from Default apart from
// the slotted content.
// Task 852 R23/GR-3b — the header slot fills the header height and centres its content vertically
// (`Group h="100%"`, the same contract `AdminHeader.tsx` follows), rather than a bare padded `<div>`.
export const WithSlots: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <MantineAppShellFoundation
        {...makeArgs(l)}
        headerContent={<Group h="100%" px="md"><Text fw={600}>{storyT(l, 'storybook.mantine.app_shell_nav_admin')}</Text></Group>}
        navbarContent={<Box p="xs"><Text>{storyT(l, 'storybook.mantine.app_shell_nav_admin')}</Text></Box>}
      />
    );
  },
};
