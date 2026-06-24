import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineResponsiveActionFooter } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineResponsiveActionFooter> = {
  title: 'Patterns/Mantine/ResponsiveActionFooter',
  component: MantineResponsiveActionFooter,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Sticky action footer. Full-width stacked buttons on mobile, row on desktop. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineResponsiveActionFooter>;

const makeArgs = (l = 'en') => ({
  actions: [
    { label: storyT(l, 'storybook.mantine.action_save'), variant: 'filled' as const, color: 'brand' },
    { label: storyT(l, 'storybook.mantine.action_cancel'), variant: 'outline' as const },
    { label: storyT(l, 'storybook.mantine.action_delete'), variant: 'light' as const, color: 'red' },
  ],
  sticky: false,
  borderTop: true,
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box style={{ minHeight: '200px', position: 'relative' }}>
        <MantineResponsiveActionFooter {...makeArgs(l)} />
      </Box>
    );
  },
};
