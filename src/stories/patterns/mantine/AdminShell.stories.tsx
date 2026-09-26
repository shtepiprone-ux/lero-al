import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { within, userEvent } from 'storybook/test';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { AdminShell } from '@/components/admin/AdminShell';

// Task 852 R3/R7/GR-3a — canonical Mantine story for the migrated `AdminShell` (direct import
// per 16c), composing the real `AdminHeader`/`AdminSidebar` through the extended
// `MantineAppShellFoundation`. Pathname mocked via the Storybook Next.js navigation parameter
// (dashboard route active). `DrawerOpen` reaches the open state with a real burger click — the
// drawer is uncontrolled (`useDisclosure` inside `AdminShell`), so there is no prop to force it.
const meta: Meta<typeof AdminShell> = {
  title: 'Patterns/Mantine/AdminShell',
  component: AdminShell,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin' } },
  },
  args: {
    siteName: 'Lero.al',
  },
};
export default meta;
type Story = StoryObj<typeof AdminShell>;

export const Default: Story = {
  render: (args, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <AdminShell {...args}>
        <Box p="xl">{storyT(l, 'storybook.mantine.page_title_dashboard')}</Box>
      </AdminShell>
    );
  },
};

export const DrawerOpen: Story = {
  render: (args, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <AdminShell {...args}>
        <Box p="xl">{storyT(l, 'storybook.mantine.page_title_dashboard')}</Box>
      </AdminShell>
    );
  },
  play: async ({ canvasElement, globals }) => {
    // Task 852 R14/F4 — the burger's accessible name is localised (`admin.mobile_header.aria_open`);
    // an English-only regex never matches the burger in sq/uk/it, so the drawer never opens there.
    // Task 852 R19 (review 3) — width now comes only from the toolbar (R18 removed the viewport
    // pin), so this story can render at any width, including >= 1024 where the burger is
    // `hiddenFrom="lg"` and the navbar is already permanently visible. Below 1024 this opens the
    // drawer, as before; open state below 1024 (toolbar width) — at >= 1024 the navbar is permanent.
    const l = (globals?.locale as string) ?? 'en';
    const burgerLabel = storyT(l, 'admin.mobile_header.aria_open');
    const canvas = within(canvasElement);
    const burger = canvas.queryByRole('button', { name: burgerLabel });
    if (!burger) return;
    await userEvent.click(burger);
  },
};
