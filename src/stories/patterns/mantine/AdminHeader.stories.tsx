import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AdminHeader } from '@/components/admin/AdminHeader';

// Task 852 R5/R7/GR-3a — canonical Mantine story for the migrated `AdminHeader` (replaces the
// old mobile-only header row, direct import per 16c). Pathname is mocked via the Storybook Next.js
// navigation parameter (auto-mocked router, `@storybook/nextjs-vite`); no play-function
// interaction is required to reach either state.
const meta: Meta<typeof AdminHeader> = {
  title: 'Patterns/Mantine/AdminHeader',
  component: AdminHeader,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
  args: {
    opened: false,
    onOpen: () => {},
    siteName: 'Lero.al',
  },
};
export default meta;
type Story = StoryObj<typeof AdminHeader>;

export const Default: Story = {
  parameters: { nextjs: { navigation: { pathname: '/admin/listings' } } },
};

export const UnknownPath: Story = {
  parameters: { nextjs: { navigation: { pathname: '/admin/does-not-exist' } } },
};

export const DrawerOpen: Story = {
  args: { opened: true },
  parameters: { nextjs: { navigation: { pathname: '/admin' } } },
};
