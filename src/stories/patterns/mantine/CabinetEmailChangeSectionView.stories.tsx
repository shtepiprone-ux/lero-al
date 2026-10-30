import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { CabinetEmailChangeSectionView, type CabinetEmailChangeSectionViewProps } from '@/modules/cabinet/components/CabinetEmailChangeSectionView';
import { emailChangeErrorText } from '@/modules/cabinet/lib/emailChangeErrors';
import { MantineStoryShell } from '../../mantine/_MantineStoryShell';

/**
 * Task 923 R83 — presentational View for the cabinet e-mail change section (Container/Presentational split of `CabinetEmailChangeSection`).
 * Interactive — type to see the action wait for the address and the current password. Viewport and locale switched via the Storybook toolbar;
 * `cabinet.*` strings come from the global next-intl decorator and the refusal texts from `emailChangeErrorText` (the Server Action's own table).
 * Fixture addresses use the reserved example domains.
 */
const meta: Meta<typeof CabinetEmailChangeSectionView> = {
  title: 'Patterns/Mantine/CabinetEmailChangeSectionView',
  component: CabinetEmailChangeSectionView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Cabinet e-mail change section states: current address, waiting notice with resend, the form with or without the password field, refusals and the Google confirmation.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof CabinetEmailChangeSectionView>;

const CURRENT_EMAIL = 'alba.krasniqi@example.com';
const NEW_EMAIL = 'alba.k@example.org';
// 64 characters each, to prove that a long address wraps inside the word
const LONG_CURRENT_EMAIL = 'alba.krasniqi.has.a.very.long.address.that.must.wrap@example.com';
const LONG_PENDING_EMAIL = 'alba.krasniqi.now.a.very.long.address.that.must.wrap@example.com';
const PASSWORD = 'Sample-Passw0rd!';

interface DemoProps {
  currentEmail?: string
  pendingEmail?: string | null
  initialNewEmail?: string
  initialPassword?: string
  method?: CabinetEmailChangeSectionViewProps['method']
  sending?: boolean
  /** a key of the Server Action's refusal table (`emailChangeErrors.ts`) */
  serverErrorKey?: string
  /** the container's own answer to an address that does not look like one */
  invalidAddress?: boolean
  googleRequired?: boolean
}

function Demo({
  currentEmail = CURRENT_EMAIL,
  pendingEmail = null,
  initialNewEmail = '',
  initialPassword = '',
  method = 'password',
  sending = false,
  serverErrorKey,
  invalidAddress = false,
  googleRequired = false,
}: DemoProps) {
  const t = useTranslations('cabinet');
  const locale = useLocale();
  const [newEmail, setNewEmail] = useState(initialNewEmail);
  const [password, setPassword] = useState(initialPassword);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const submitDisabled = !newEmail.trim() || (method !== 'google' && password === '') || sending;
  const error = invalidAddress ? t('error_email_invalid') : serverErrorKey ? emailChangeErrorText(serverErrorKey, locale) : null;
  const props: CabinetEmailChangeSectionViewProps = {
    currentEmail,
    pendingEmail,
    newEmail,
    password,
    passwordVisible,
    method,
    sending,
    submitDisabled,
    error,
    // no client ID: the deterministic unavailable state of Google's slot, without a request to Google
    googleControl: googleRequired ? <GoogleSignInButton clientId={undefined} purpose="reauth" onCredential={async () => {}} /> : null,
    onNewEmailChange: e => setNewEmail(e.target.value),
    onPasswordChange: e => setPassword(e.target.value),
    onPasswordVisibilityChange: setPasswordVisible,
    onSubmit: e => e.preventDefault(),
    onResend: () => {},
  };
  return (
    <MantineStoryShell>
      <CabinetEmailChangeSectionView {...props} />
    </MantineStoryShell>
  );
}

export const WithPassword: Story = {
  render: () => <Demo />,
};

export const ReadyToSubmit: Story = {
  render: () => <Demo initialNewEmail={NEW_EMAIL} initialPassword={PASSWORD} />,
};

export const GoogleOnly: Story = {
  render: () => <Demo method="google" initialNewEmail={NEW_EMAIL} />,
};

export const WrongPassword: Story = {
  render: () => <Demo initialNewEmail={NEW_EMAIL} initialPassword="Wrong-Passw0rd!" serverErrorKey="invalid_password" />,
};

export const GoogleRequired: Story = {
  render: () => <Demo method="google" initialNewEmail={NEW_EMAIL} serverErrorKey="reauth_required" googleRequired />,
};

export const Sending: Story = {
  render: () => <Demo initialNewEmail={NEW_EMAIL} initialPassword={PASSWORD} sending />,
};

export const InvalidAddress: Story = {
  render: () => <Demo initialNewEmail="alba.k@example" initialPassword={PASSWORD} invalidAddress />,
};

export const LimitReached: Story = {
  render: () => <Demo initialNewEmail={NEW_EMAIL} initialPassword={PASSWORD} serverErrorKey="rate_limit" />,
};

export const WaitingForConfirmation: Story = {
  render: () => <Demo pendingEmail={NEW_EMAIL} />,
};

export const Resending: Story = {
  render: () => <Demo pendingEmail={NEW_EMAIL} sending />,
};

export const LongAddress: Story = {
  render: () => <Demo currentEmail={LONG_CURRENT_EMAIL} pendingEmail={LONG_PENDING_EMAIL} />,
};
