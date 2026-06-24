import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Center, Stack } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineAuthFormPattern } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineAuthFormPattern> = {
  title: 'Patterns/Mantine/AuthFormPattern',
  component: MantineAuthFormPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Auth form (login + register). Full-width on mobile, max-400 centered on desktop. Both modes shown in Default. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineAuthFormPattern>;

const makeLoginArgs = (l = 'en') => ({
  mode: 'login' as const,
  title: storyT(l, 'storybook.mantine.auth_login_title'),
  emailLabel: storyT(l, 'storybook.mantine.auth_email'),
  passwordLabel: storyT(l, 'storybook.mantine.auth_password'),
  submitLabel: storyT(l, 'storybook.mantine.auth_submit_login'),
  switchLabel: storyT(l, 'storybook.mantine.auth_switch_to_register'),
  switchLinkLabel: storyT(l, 'storybook.mantine.auth_switch_link_register'),
});

const makeRegisterArgs = (l = 'en') => ({
  mode: 'register' as const,
  title: storyT(l, 'storybook.mantine.auth_register_title'),
  emailLabel: storyT(l, 'storybook.mantine.auth_email'),
  passwordLabel: storyT(l, 'storybook.mantine.auth_password'),
  nameLabel: storyT(l, 'storybook.mantine.auth_name'),
  submitLabel: storyT(l, 'storybook.mantine.auth_submit_register'),
  switchLabel: storyT(l, 'storybook.mantine.auth_switch_to_login'),
  switchLinkLabel: storyT(l, 'storybook.mantine.auth_switch_link_login'),
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Stack gap="xl" p="md">
        <Center p="xl">
          <MantineAuthFormPattern {...makeLoginArgs(l)} />
        </Center>
        <Center p="xl">
          <MantineAuthFormPattern {...makeRegisterArgs(l)} />
        </Center>
      </Stack>
    );
  },
};
