import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box, useMantineTheme } from '@mantine/core';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

// Task 852 R4/R7/GR-3a — canonical Mantine story for the migrated `AdminSidebar` (direct import
// per 16c). Pathname is mocked via the Storybook Next.js navigation parameter — one export per nav
// group so each group's active/highlighted state is reachable without a play-function interaction.
// Locale/viewport (uk long-label stress, 320px) are toolbar-driven, per the owner matrix.
// Task 852 R30/GR-3b/D852-1 — the decorator reproduces `MantineAppShellFoundation`'s real width
// contract (R27): below `sm` (640) the navigation is a 100%-wide `Drawer`; from `sm` up — whether
// still a `Drawer` (640–1023) or the fixed `AppShell.Navbar` (>= `navbarBreakpoint="lg"`) — it is
// `appShellNavbarWidth` (240px). No `lg` key: the sidebar is 240px wide from `sm` up either way.
// Task 852 review-8 (owner report) — `p="sm"` reproduces the SAME production edge-spacing contract:
// `AdminSidebar` (`navContent`) is mounted directly inside `AppShell.Navbar p="sm"` (>= breakpoint)
// or `Drawer padding="sm"` (below it) in `MantineAppShellFoundation.tsx`, never bare against the
// container edge. `AdminLocaleSwitcher.stories.tsx`'s decorator already carries this; this file had
// dropped it.
const meta: Meta<typeof AdminSidebar> = {
  title: 'Patterns/Mantine/AdminSidebar',
  component: AdminSidebar,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
  args: {
    siteName: 'Lero.al',
    onNavigate: () => {},
  },
  decorators: [
    (Story) => {
      const theme = useMantineTheme();
      return (
        <Box w={{ base: '100%', sm: theme.other.layout.appShellNavbarWidth }} h="100dvh" p="sm">
          <Story />
        </Box>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof AdminSidebar>;

export const Default: Story = {
  parameters: { nextjs: { navigation: { pathname: '/admin' } } },
};

export const ManagementActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/admin/listings' } } },
};

export const ContentActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/admin/locations' } } },
};

export const SystemActive: Story = {
  parameters: { nextjs: { navigation: { pathname: '/admin/settings' } } },
};
