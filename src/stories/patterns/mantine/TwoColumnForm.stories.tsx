import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineTwoColumnForm } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineTwoColumnForm> = {
  title: 'Patterns/Mantine/TwoColumnForm',
  component: MantineTwoColumnForm,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Responsive 2-column form (SimpleGrid cols 1→2). Single column on mobile, two on sm+. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineTwoColumnForm>;

const makeArgs = (l = 'en') => ({
  title: storyT(l, 'storybook.mantine.form_section_details'),
  fields: [
    { name: 'name', type: 'text' as const, label: storyT(l, 'storybook.mantine.form_name') },
    { name: 'email', type: 'email' as const, label: storyT(l, 'storybook.mantine.form_email') },
    { name: 'phone', type: 'tel' as const, label: storyT(l, 'storybook.mantine.form_phone') },
    { name: 'address', type: 'text' as const, label: storyT(l, 'storybook.mantine.form_address') },
    { name: 'message', type: 'textarea' as const, label: storyT(l, 'storybook.mantine.form_message'), fullWidth: true },
  ],
  submitLabel: storyT(l, 'storybook.mantine.action_submit'),
  cancelLabel: storyT(l, 'storybook.mantine.action_cancel'),
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineTwoColumnForm {...makeArgs(l)} />;
  },
};
