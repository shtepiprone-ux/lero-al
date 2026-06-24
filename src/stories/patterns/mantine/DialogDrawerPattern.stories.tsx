import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineDialogDrawerPattern } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineDialogDrawerPattern> = {
  title: 'Patterns/Mantine/DialogDrawerPattern',
  component: MantineDialogDrawerPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Modal on desktop, P0-compliant bottom Drawer on mobile (<640). Trigger full-width on mobile, stacked actions in Drawer. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDialogDrawerPattern>;

const makeArgs = (l = 'en') => ({
  triggerLabel: storyT(l, 'storybook.mantine.action_edit'),
  title: storyT(l, 'storybook.mantine.dialog_confirm_title'),
  body: storyT(l, 'storybook.mantine.dialog_confirm_body'),
  confirmLabel: storyT(l, 'storybook.mantine.action_submit'),
  cancelLabel: storyT(l, 'storybook.mantine.action_cancel'),
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineDialogDrawerPattern {...makeArgs(l)} />;
  },
};
