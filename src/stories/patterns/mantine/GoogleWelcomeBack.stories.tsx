import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'
import { Alert } from '@mantine/core'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { GoogleWelcomeBack } from '@/components/auth/GoogleWelcomeBack'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../../mantine/_MantineStoryShell'

// Task 927 Amendment 5 — canonical Story for the returning person's view of the sign-in sheet. Google draws its own button in the `googleControl` (owner decision D2), as in the
// deletion Story's ready section; the credential handler and both exits are labelled no-ops: the Story never signs anyone in. The fixture account is synthetic.

const FIXTURE_SUB = '000000000000000000001'

const meta: Meta<typeof GoogleWelcomeBack> = {
  title: 'Patterns/Mantine/GoogleWelcomeBack',
  component: GoogleWelcomeBack,
  parameters: {
    docs: {
      description: {
        component:
          'The returning person\'s view of the sign-in sheet: the Google account this device remembers (avatar, name, masked e-mail), Google\'s standard button, "Forget this account" and "More sign-in options".',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof GoogleWelcomeBack>

function welcomeBack(locale: string, options: { nameKey: string; picture: string | null; alerts?: ReactNode }) {
  return (
    <MantineStoryShell>
      <GoogleWelcomeBack
        name={storyT(locale, `storybook.mantine.${options.nameKey}`)}
        maskedEmail={storyT(locale, 'storybook.mantine.google_welcome_demo_email')}
        picture={options.picture}
        alerts={options.alerts}
        googleControl={<GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} loginHint={FIXTURE_SUB} onCredential={async () => {}} />}
        onForget={() => {}}
        onMoreOptions={() => {}}
      />
    </MantineStoryShell>
  )
}

export const Initials: Story = {
  render: (_args, context) => welcomeBack((context?.globals?.locale as string) ?? 'en', { nameKey: 'google_welcome_demo_name', picture: null }),
}

export const Picture: Story = {
  render: (_args, context) => welcomeBack((context?.globals?.locale as string) ?? 'en', { nameKey: 'google_welcome_demo_name', picture: '/og-default.png' }),
}

export const LongName: Story = {
  render: (_args, context) => welcomeBack((context?.globals?.locale as string) ?? 'en', { nameKey: 'google_welcome_demo_long_name', picture: null }),
}

// The sheet's two alert looks above the identity block: the session-lost notice, then the wrong-credentials error.
export const WithAlerts: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return welcomeBack(locale, {
      nameKey: 'google_welcome_demo_name',
      picture: null,
      alerts: (
        <>
          <Alert color="blueLight">{storyT(locale, 'auth.session_recovery_message')}</Alert>
          <Alert color="red">{storyT(locale, 'auth.error_invalid_credentials')}</Alert>
        </>
      ),
    })
  },
}
