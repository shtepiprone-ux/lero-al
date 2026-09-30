import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineFormSectionStack, MantineFormSection } from '@/design-system/mantine/patterns/MantineFormSectionStack';
import { Button, Stack, TextInput } from '@mantine/core';
import { StoryPageGutter } from '@/stories/_StoryPageGutter';

const meta: Meta<typeof MantineFormSectionStack> = {
  title: 'Patterns/Mantine/FormSectionStack',
  component: MantineFormSectionStack,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Stacked form sections (`MantineFormSection`: TailAdmin §6l bordered card, 16px / 500 header with a divider) with action buttons. Full-width on mobile. Viewport and locale switched via Storybook toolbar.' } },
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
    return (
      <StoryPageGutter>
        <MantineFormSectionStack {...makeArgs(l)} />
      </StoryPageGutter>
    );
  },
};

// Task 893 — one `MantineFormSection` on its own (the section card the admin user profile composes),
// with a trailing header action. Fluid: no width is set here (GR-3b).
export const Section: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <StoryPageGutter>
        <MantineFormSection
          title={storyT(l, 'storybook.mantine.form_section_contact')}
          headerAction={<Button variant="outline" color="gray">{storyT(l, 'storybook.mantine.action_save')}</Button>}
        >
          <Stack gap="sm">
            <TextInput label={storyT(l, 'storybook.mantine.form_name')} />
            <TextInput label={storyT(l, 'storybook.mantine.form_email')} type="email" />
          </Stack>
        </MantineFormSection>
      </StoryPageGutter>
    );
  },
};
