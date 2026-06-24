import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineFormSectionStack } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineFormSectionStack> = {
  title: 'Patterns/Mantine/FormSectionStack',
  component: MantineFormSectionStack,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Stacked form sections in Papers with action buttons. Full-width on mobile. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineFormSectionStack>;

const makeArgs = (l = 'en') => ({
  sections: [
    {
      title: storyT(l, 'storybook.mantine.form_section_contact'),
      fields: [
        { name: 'name', type: 'text' as const, label: storyT(l, 'storybook.mantine.form_name') },
        { name: 'email', type: 'email' as const, label: storyT(l, 'storybook.mantine.form_email') },
        { name: 'phone', type: 'tel' as const, label: storyT(l, 'storybook.mantine.form_phone') },
      ],
    },
    {
      title: storyT(l, 'storybook.mantine.form_section_details'),
      fields: [
        { name: 'message', type: 'textarea' as const, label: storyT(l, 'storybook.mantine.form_message') },
        { name: 'address', type: 'text' as const, label: storyT(l, 'storybook.mantine.form_address') },
      ],
    },
  ],
  submitLabel: storyT(l, 'storybook.mantine.action_save'),
  cancelLabel: storyT(l, 'storybook.mantine.action_cancel'),
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineFormSectionStack {...makeArgs(l)} />;
  },
};
