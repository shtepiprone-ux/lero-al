import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineAppShellFoundation } from '@/design-system/mantine/patterns';

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
  children: <div style={{ padding: '2rem' }}>{storyT(l, 'storybook.mantine.page_title_dashboard')}</div>,
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineAppShellFoundation {...makeArgs(l)} />;
  },
};
