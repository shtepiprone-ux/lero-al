import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { GoogleSignInSlot } from '@/components/auth/GoogleSignInSlot'
import { MantineStoryShell } from '../../mantine/_MantineStoryShell'

// Task 927 — canonical Story for the Google slot of the sign-in sheet. The button is our own (owner decision D25): the theme's `default` Button with Google's own "G", drawn with the
// page, so every state below is the real production markup.

const meta: Meta<typeof GoogleSignInSlot> = {
  title: 'Patterns/Mantine/GoogleSignInSlot',
  component: GoogleSignInSlot,
  parameters: {
    docs: {
      description: {
        component:
          'The Google slot of the sign-in sheet. The button is our own: the theme\'s default Button with Google\'s "G", so it looks like the sheet\'s other secondary buttons and never changes in view. A click opens Google\'s window; the slot shows the button, the button loading while that window is open, a red notice when the browser blocked the window or Google\'s window did not finish, and the sheet\'s red error alert when Google sign-in is unavailable.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof GoogleSignInSlot>

export const Ready: Story = {
  render: () => (
    <MantineStoryShell>
      <GoogleSignInSlot status="ready" onClick={() => {}} />
    </MantineStoryShell>
  ),
}

// Google's window is open: the button shows its own loading state.
export const Pending: Story = {
  render: () => (
    <MantineStoryShell>
      <GoogleSignInSlot status="pending" onClick={() => {}} />
    </MantineStoryShell>
  ),
}

// The browser refused Google's window: the red notice above the button.
export const PopupBlocked: Story = {
  render: () => (
    <MantineStoryShell>
      <GoogleSignInSlot status="ready" notice="popup_blocked" onClick={() => {}} />
    </MantineStoryShell>
  ),
}

// Google's window ended with an error or no answer: the red notice above the button.
export const Failed: Story = {
  render: () => (
    <MantineStoryShell>
      <GoogleSignInSlot status="ready" notice="failed" onClick={() => {}} />
    </MantineStoryShell>
  ),
}

export const Unavailable: Story = {
  render: () => (
    <MantineStoryShell>
      <GoogleSignInSlot status="unavailable" onClick={() => {}} />
    </MantineStoryShell>
  ),
}

// The cabinet's re-confirmation (Task 927): a Google-only account has no password to fall back to, so the text does not send the person to one.
export const UnavailableReauth: Story = {
  render: () => (
    <MantineStoryShell>
      <GoogleSignInSlot status="unavailable" purpose="reauth" onClick={() => {}} />
    </MantineStoryShell>
  ),
}
