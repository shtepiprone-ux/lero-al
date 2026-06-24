import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantinePageHeaderWithActions } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantinePageHeaderWithActions> = {
  title: 'Patterns/Mantine/PageHeaderWithActions',
  component: MantinePageHeaderWithActions,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Page header with title + action buttons. Full-width on mobile, row on desktop. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantinePageHeaderWithActions>;

const makeArgs = (l = 'en') => ({
  title: storyT(l, 'storybook.mantine.page_title_listings'),
  subtitle: storyT(l, 'storybook.mantine.empty_description'),
  actions: [
    { label: storyT(l, 'storybook.mantine.action_add_new'), variant: 'filled' as const, color: 'brand' },
    { label: storyT(l, 'storybook.mantine.action_export'), variant: 'outline' as const },
    { label: storyT(l, 'storybook.mantine.action_filter'), variant: 'light' as const },
  ],
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantinePageHeaderWithActions {...makeArgs(l)} />;
  },
};
