import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within, userEvent } from 'storybook/test'
import { Button } from '@mantine/core'
import { AuthSheet } from '@/modules/auth/components/AuthSheet'
import { CaptchaWidget } from '@/components/auth/CaptchaWidget'
import { MantineStoryShell } from '../../mantine/_MantineStoryShell'
import { storyT } from '../../_storyI18n'
import enMessages from '../../../../messages/en.json'
import sqMessages from '../../../../messages/sq.json'
import ukMessages from '../../../../messages/uk.json'
import itMessages from '../../../../messages/it.json'

// Task 757 (§15.1a) — canonical Story for the real production AuthSheet. Statically imports
// and renders src/modules/auth/components/AuthSheet.tsx directly (not MantineAuthFormPattern,
// which is a separate, unused demo composition with no captcha/phone/agent-flow/forgot-password
// — evaluated during 757's implementation and found not to cover this component's real tree).
//
// AuthSheet is always mounted `opened` here (not behind a click) because that is the content
// this Story exists to prove; Drawer.stories.tsx's own click-to-open convention is for proving
// the trigger + closed/resting state, which is not the point of this Story.
//
// `useLocations`/`useCompanies` (mounted only in the register-agent view) call real Supabase
// queries; in this environment they resolve to an empty array (caught, logged, non-fatal —
// see the hooks' own `.catch(console.error)`) rather than fabricated data, so RegisterAgent
// renders its own genuine empty-location/empty-company state, not a mocked one.

const AUTH_MESSAGES: Record<string, { auth: Record<string, string>; common: Record<string, string> }> = {
  en: enMessages as never,
  sq: sqMessages as never,
  uk: ukMessages as never,
  it: itMessages as never,
}

function authT(locale: string, ns: 'auth' | 'common', key: string): string {
  return AUTH_MESSAGES[locale]?.[ns]?.[key] ?? AUTH_MESSAGES.en[ns][key]
}

const meta: Meta<typeof AuthSheet> = {
  title: 'Patterns/Mantine/AuthSheet',
  component: AuthSheet,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The real production auth drawer (login / registration / password recovery), mounted on every page via Header.tsx. Each story opens directly into the named view.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AuthSheet>

export const Login: Story = {
  render: () => (
    <MantineStoryShell>
      <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
      <AuthSheet key="login" open onOpenChange={() => {}} initialView="login" />
    </MantineStoryShell>
  ),
}

// Task 927 Amendment 5 — the returning person's view: a sheet opened on `login` for a remembered Google account opens on Welcome back. The account is a labelled synthetic fixture.
export const WelcomeBack: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
        <AuthSheet
          key={`welcome-back-${locale}`}
          open
          onOpenChange={() => {}}
          initialView="login"
          googleAccount={{
            sub: '000000000000000000001',
            name: storyT(locale, 'storybook.mantine.google_welcome_demo_name'),
            maskedEmail: storyT(locale, 'storybook.mantine.google_welcome_demo_email'),
            picture: null,
          }}
          onForgetGoogleAccount={() => {}}
        />
      </MantineStoryShell>
    )
  },
}

export const Register: Story = {
  render: () => (
    <MantineStoryShell>
      <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
      <AuthSheet key="register" open onOpenChange={() => {}} initialView="register" />
    </MantineStoryShell>
  ),
}

/**
 * Task 926 (D1, D2) — the agent sign-up only PICKS a company: no add-company option or panel, and the owner's note sits below the picker as its field description.
 * The play function asserts, in every locale, that the note is the `aria-describedby` target of the company input, that it follows the input, that the input is
 * named by the picker label, and that no add control (a "+" button, a logo file chooser) renders.
 */
export const RegisterAgent: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
        <AuthSheet key={`register-agent-${locale}`} open onOpenChange={() => {}} initialView="register-agent" />
      </MantineStoryShell>
    )
  },
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const doc = canvasElement.ownerDocument
    const canvas = within(doc.body)
    const note = await canvas.findByText(authT(locale, 'auth', 'company_not_found_hint'))
    const input = await canvas.findByLabelText(authT(locale, 'auth', 'company'))
    await expect(note.id).not.toBe('')
    await expect(input).toHaveAttribute('aria-describedby', note.id)
    await expect(Boolean(input.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    await expect(canvas.queryByRole('button', { name: /^\+\s*\p{L}/u })).toBeNull()
    await expect(doc.querySelector('input[type="file"]')).toBeNull()
  },
}

export const ForgotPassword: Story = {
  render: () => (
    <MantineStoryShell>
      <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
      <AuthSheet key="forgot-password" open onOpenChange={() => {}} initialView="forgot-password" />
    </MantineStoryShell>
  ),
}

/**
 * Client-side validation branch — no network call, stable/reproducible.
 * A plain empty-form submit is intercepted by the browser's own native HTML5 `required`
 * constraint validation before AuthSheet's own `handleSubmit` ever runs (verified directly
 * against the real app during this task's rendered-evidence capture — the same reason the
 * error Alert never actually appears from a bare empty-submit click). To reach the REAL
 * `error_email_invalid` code path, the email is filled with a string that satisfies the
 * browser's native `type="email"` pattern (so native validation lets the submit proceed) but
 * fails AuthSheet's own stricter `EMAIL_RE` (which requires a dotted TLD) — genuinely
 * exercising the component's own validation logic, not a fabricated error state.
 */
export const LoginValidationError: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
        <AuthSheet key={`login-error-${locale}`} open onOpenChange={() => {}} initialView="login" />
      </MantineStoryShell>
    )
  },
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const doc = canvasElement.ownerDocument
    const canvas = within(doc.body)
    // Matched to the real ids AuthSheet.tsx sets on these two inputs (`login-email` /
    // `login-password`) — direct id lookup, not a label/role query, since Mantine's
    // TextInput/PasswordInput label association isn't guaranteed to satisfy
    // testing-library's `findByLabelText` in every rendering context.
    const emailInput = doc.getElementById('login-email') as HTMLInputElement
    const passwordInput = doc.getElementById('login-password') as HTMLInputElement
    await userEvent.type(emailInput, 'a@b')
    await userEvent.type(passwordInput, 'x')
    const submit = await canvas.findByRole('button', { name: authT(locale, 'auth', 'login') })
    await userEvent.click(submit)
  },
}

/**
 * Task 991 (O991-2) — a blocked person who signs in with the right password reads that the account is blocked, with a link to support, instead of "wrong e-mail or password".
 * The real sheet is driven by its own `play`: the sign-in is the Storybook Supabase stub, which answers `user_banned` for the one synthetic address below, and the sheet then asks the
 * explain action (also a Storybook stub, `.storybook/stubs/auth-explain-refused-sign-in.ts`), which says `blocked: true` for it. No Story-only prop exists in production code.
 */
export const LoginBlocked: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
        <AuthSheet key={`login-blocked-${locale}`} open onOpenChange={() => {}} initialView="login" />
      </MantineStoryShell>
    )
  },
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const doc = canvasElement.ownerDocument
    const canvas = within(doc.body)
    await userEvent.type(doc.getElementById('login-email') as HTMLInputElement, 'blocked@example.com')
    await userEvent.type(doc.getElementById('login-password') as HTMLInputElement, 'x')
    await userEvent.click(await canvas.findByRole('button', { name: authT(locale, 'auth', 'login') }))
    const link = await canvas.findByRole('link', { name: authT(locale, 'auth', 'error_account_blocked_contact') })
    await expect(link).toHaveAttribute('href', `/${locale}/contact`)
    // the alert that holds the link: without a Google client id the sheet also shows the Google notice as an alert (the CI build has none)
    await expect(link.closest('[role="alert"]')).toHaveTextContent(authT(locale, 'auth', 'error_account_blocked'))
  },
}

/**
 * Task 991 (O991-1) — the registration success view, with the neutral text that is true for every address ("check your e-mail"). The real sheet is driven by its own `play`; the sign-up answer is the
 * Storybook stub of the auth actions (`.storybook/stubs/auth-captcha-actions.ts`).
 */
export const RegisterSuccess: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
        <AuthSheet key={`register-success-${locale}`} open onOpenChange={() => {}} initialView="register" />
      </MantineStoryShell>
    )
  },
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const doc = canvasElement.ownerDocument
    const canvas = within(doc.body)
    await userEvent.type(doc.getElementById('reg-name') as HTMLInputElement, 'Alba Hoxha')
    await userEvent.type(doc.getElementById('reg-email') as HTMLInputElement, 'alba@example.com')
    await userEvent.type(doc.getElementById('reg-password') as HTMLInputElement, 'Str0ng!Passw0rd')
    await userEvent.click(await canvas.findByRole('button', { name: authT(locale, 'auth', 'register') }))
    await expect(await canvas.findByText(authT(locale, 'auth', 'register_success_title'))).toBeVisible()
    await expect(canvas.getByText(authT(locale, 'auth', 'register_success_body'))).toBeVisible()
  },
}

/**
 * Task 872 (§17.2, D81-2) — the real production `CaptchaWidget`, rendered standalone (not
 * through `AuthSheet`, which already renders it inside its Register/RegisterAgent/ForgotPassword
 * views above). GR-1 container-exempt Header/NotificationBell still need this component enrolled
 * with its own direct-import Story to close the census FAIL on `CaptchaWidget.tsx`.
 */
export const Captcha: Story = {
  render: () => (
    <MantineStoryShell>
      <CaptchaWidget onSuccess={() => {}} onError={() => {}} onExpire={() => {}} />
    </MantineStoryShell>
  ),
}
