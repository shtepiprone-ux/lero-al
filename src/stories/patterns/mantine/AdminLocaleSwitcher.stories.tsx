import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box, useMantineTheme } from '@mantine/core';
import { AdminLocaleSwitcher } from '@/components/admin/AdminLocaleSwitcher';

// Task 852 R6/R7/GR-3a — canonical Mantine story for the migrated `AdminLocaleSwitcher` (direct
// import per 16c). `Pending` uses `pendingOverride` (Storybook-only knob, never passed in
// production) rather than invoking the real `setAdminLocale` server action.
// Task 852 R30/GR-3b/D852-1 — the decorator reproduces `MantineAppShellFoundation`'s real width
// contract (R27): this switcher sits in the sidebar footer, 100% wide below `sm` (640, the
// `Drawer`'s own mobile size) and `appShellNavbarWidth` (240px) from `sm` up — whether still a
// `Drawer` (640–1023) or the fixed `AppShell.Navbar` (>= `navbarBreakpoint="lg"`). No `lg` key.
const meta: Meta<typeof AdminLocaleSwitcher> = {
  title: 'Patterns/Mantine/AdminLocaleSwitcher',
  component: AdminLocaleSwitcher,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      const theme = useMantineTheme();
      return (
        <Box w={{ base: '100%', sm: theme.other.layout.appShellNavbarWidth }} p="sm">
          <Story />
        </Box>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof AdminLocaleSwitcher>;

export const Idle: Story = {};

export const Pending: Story = {
  args: { pendingOverride: true },
};
