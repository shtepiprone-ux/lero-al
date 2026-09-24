import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef, useState } from 'react';
import { CabinetPasswordSectionView, type CabinetPasswordSectionViewProps } from '@/modules/cabinet/components/CabinetPasswordSectionView';
import { allPasswordRulesMet } from '@/lib/passwordRules';
import { MantineStoryShell } from '../../mantine/_MantineStoryShell';

/**
 * Task 873 — presentational View for the cabinet password-change section (Container/Presentational
 * split of `CabinetPasswordSection`). No success/error ring on the new-password field —
 * `PasswordRequirementsHint` alone carries validity feedback (F4). Viewport and locale switched
 * via the Storybook toolbar; `cabinet.*` strings come from the global next-intl decorator.
 */
const meta: Meta<typeof CabinetPasswordSectionView> = {
  title: 'Patterns/Mantine/CabinetPasswordSectionView',
  component: CabinetPasswordSectionView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Cabinet password-change section states. Interactive — type to see the hint and same-password alert react.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof CabinetPasswordSectionView>;

function Demo({
  initialCurrent = '',
  initialNew = '',
  errorKey = null,
  submitting = false,
  forceSubmitDisabled,
}: {
  initialCurrent?: string
  initialNew?: string
  errorKey?: string | null
  submitting?: boolean
  forceSubmitDisabled?: boolean
}) {
  const [currentPassword, setCurrentPassword] = useState(initialCurrent);
  const [newPassword, setNewPassword] = useState(initialNew);
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const currentInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const allMet = allPasswordRulesMet(newPassword);
  const isSamePassword = currentPassword.length > 0 && currentPassword === newPassword;
  const submitDisabled = forceSubmitDisabled ?? (submitting || !allMet || currentPassword.length === 0 || isSamePassword);
  const props: CabinetPasswordSectionViewProps = {
    currentPassword,
    newPassword,
    errorKey,
    isSamePassword,
    submitting,
    submitDisabled,
    currentPasswordVisible,
    newPasswordVisible,
    currentInputRef,
    newInputRef,
    onCurrentPasswordChange: e => setCurrentPassword(e.target.value),
    onNewPasswordChange: e => setNewPassword(e.target.value),
    onCurrentVisibilityChange: setCurrentPasswordVisible,
    onNewVisibilityChange: setNewPasswordVisible,
    onSubmit: e => e.preventDefault(),
  };
  return (
    <MantineStoryShell>
      <CabinetPasswordSectionView {...props} />
    </MantineStoryShell>
  );
}

export const Empty: Story = {
  render: () => <Demo />,
};

export const NewPartial: Story = {
  render: () => <Demo initialNew="Abc" />,
};

export const ReadyToSubmit: Story = {
  render: () => <Demo initialCurrent="OldPass123!" initialNew="Sample123!" />,
};

export const SamePassword: Story = {
  render: () => <Demo initialCurrent="Sample123!" initialNew="Sample123!" />,
};

export const ErrorInvalidCurrent: Story = {
  render: () => <Demo initialCurrent="Wrong123!" initialNew="Sample123!" errorKey="password_error_invalid_current" />,
};

export const RateLimited: Story = {
  render: () => <Demo initialCurrent="OldPass123!" initialNew="Sample123!" errorKey="password_error_rate_limited" forceSubmitDisabled />,
};

export const Submitting: Story = {
  render: () => <Demo initialCurrent="OldPass123!" initialNew="Sample123!" submitting />,
};
