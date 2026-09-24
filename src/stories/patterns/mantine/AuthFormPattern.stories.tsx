import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Center, Stack, Text, Title } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineAuthFormPattern, MantineAuthCard } from '@/design-system/mantine/patterns/MantineAuthFormPattern';

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

// The card chrome extracted for reuse by the password-reset and cabinet-password-change auth
// Views (Task 873) — proven here with generic content reusing existing storybook.mantine.* keys
// (§8 out-of-scope: no new locale key), since MantineAuthFormPattern's own Default story above
// already proves the card with the login/register form content.
export const AuthCard: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Center p="xl">
        <MantineAuthCard>
          <Stack gap="md">
            <Title order={2} size="h3" ta="center">
              {storyT(l, 'storybook.mantine.auth_login_title')}
            </Title>
            <Text size="sm" ta="center" c="dimmed">
              {storyT(l, 'storybook.mantine.ta_hint')}
            </Text>
          </Stack>
        </MantineAuthCard>
      </Center>
    );
  },
};
