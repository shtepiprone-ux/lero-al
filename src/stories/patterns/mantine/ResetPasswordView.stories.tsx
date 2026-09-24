import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { ResetPasswordView, type ResetPasswordViewProps } from '@/modules/auth/components/ResetPasswordView';
import { allPasswordRulesMet } from '@/lib/passwordRules';

/**
 * Task 873 — presentational View for the password-reset page (Container/Presentational split of
 * `ResetPasswordClient`). Card chrome via `MantineAuthCard`; no success/error ring on the field —
 * `PasswordRequirementsHint` alone carries validity feedback (F4). Viewport and locale switched
 * via the Storybook toolbar; `auth.*` strings come from the global next-intl decorator.
 */
const meta: Meta<typeof ResetPasswordView> = {
  title: 'Patterns/Mantine/ResetPasswordView',
  component: ResetPasswordView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Password-reset page states, migrated onto MantineAuthCard. The form states are interactive — type to see the hint react.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ResetPasswordView>;

function FormDemo({
  initialPassword = '',
  errorKey = null,
  submitting = false,
}: {
  initialPassword?: string
  errorKey?: string | null
  submitting?: boolean
}) {
  const [password, setPassword] = useState(initialPassword);
  const [visible, setVisible] = useState(false);
  const props: ResetPasswordViewProps = {
    pageState: 'form',
    password,
    errorKey,
    submitting,
    allMet: allPasswordRulesMet(password),
    passwordVisible: visible,
    onPasswordChange: e => setPassword(e.target.value),
    onVisibilityChange: setVisible,
    onSubmit: e => e.preventDefault(),
    onRequestNew: () => {},
    onGoLogin: () => {},
  };
  return <ResetPasswordView {...props} />;
}

export const Loading: Story = {
  render: () => (
    <ResetPasswordView
      pageState="loading"
      password=""
      errorKey={null}
      submitting={false}
      allMet={false}
      passwordVisible={false}
      onPasswordChange={() => {}}
      onVisibilityChange={() => {}}
      onSubmit={e => e.preventDefault()}
      onRequestNew={() => {}}
      onGoLogin={() => {}}
    />
  ),
};

export const Expired: Story = {
  render: () => (
    <ResetPasswordView
      pageState="expired"
      password=""
      errorKey={null}
      submitting={false}
      allMet={false}
      passwordVisible={false}
      onPasswordChange={() => {}}
      onVisibilityChange={() => {}}
      onSubmit={e => e.preventDefault()}
      onRequestNew={() => {}}
      onGoLogin={() => {}}
    />
  ),
};

export const Success: Story = {
  render: () => (
    <ResetPasswordView
      pageState="success"
      password=""
      errorKey={null}
      submitting={false}
      allMet={false}
      passwordVisible={false}
      onPasswordChange={() => {}}
      onVisibilityChange={() => {}}
      onSubmit={e => e.preventDefault()}
      onRequestNew={() => {}}
      onGoLogin={() => {}}
    />
  ),
};

export const FormEmpty: Story = {
  render: () => <FormDemo />,
};

export const FormPartial: Story = {
  render: () => <FormDemo initialPassword="Abc" />,
};

export const FormAllMet: Story = {
  render: () => <FormDemo initialPassword="Sample123!" />,
};

export const FormError: Story = {
  render: () => <FormDemo initialPassword="Sample123!" errorKey="reset_password_error_generic" />,
};

export const FormSubmitting: Story = {
  render: () => <FormDemo initialPassword="Sample123!" submitting />,
};
