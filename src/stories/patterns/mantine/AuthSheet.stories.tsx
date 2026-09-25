import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, userEvent } from 'storybook/test'
import { Button } from '@mantine/core'
import { AuthSheet } from '@/modules/auth/components/AuthSheet'
import { CaptchaWidget } from '@/components/auth/CaptchaWidget'
import { MantineStoryShell } from '../../mantine/_MantineStoryShell'
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

export const Register: Story = {
  render: () => (
    <MantineStoryShell>
      <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
      <AuthSheet key="register" open onOpenChange={() => {}} initialView="register" />
    </MantineStoryShell>
  ),
}

export const RegisterAgent: Story = {
  render: () => (
    <MantineStoryShell>
      <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
      <AuthSheet key="register-agent" open onOpenChange={() => {}} initialView="register-agent" />
    </MantineStoryShell>
  ),
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

/** MantineAddItemPanel (Task 756, consumed unmodified) open inside the real register-agent form. */
export const RegisterAgentAddCompany: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
        <AuthSheet key={`register-agent-addcompany-${locale}`} open onOpenChange={() => {}} initialView="register-agent" />
      </MantineStoryShell>
    )
  },
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const canvas = within(canvasElement.ownerDocument.body)
    const addButton = await canvas.findByRole('button', { name: `+ ${authT(locale, 'auth', 'company_add_new')}` })
    await userEvent.click(addButton)
  },
}

/**
 * Task 879 (D81-7, R14) — the ONE consumer state no existing Story renders: the register-agent
 * company-logo tile with a real selected image (`AuthSheet.tsx`'s `logoPreview` branch, the
 * `Paper`+`Image` composition R10 migrated). Same render as `RegisterAgentAddCompany`; its `play`
 * additionally builds a tiny (32×32, well under the component's own 256×256/2MB limits) PNG
 * in-browser via `<canvas>.toBlob` — no fixture file — and feeds it into the real hidden
 * `<input type="file">`, exercising `handleLogoSelect`'s genuine dimension/size/type checks
 * against a real `File`, not a fabricated preview URL.
 */
export const RegisterAgentAddCompanyLogo: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <Button variant="default" disabled>trigger (Story opens the drawer directly)</Button>
        <AuthSheet key={`register-agent-addcompany-logo-${locale}`} open onOpenChange={() => {}} initialView="register-agent" />
      </MantineStoryShell>
    )
  },
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const doc = canvasElement.ownerDocument
    const win = doc.defaultView as (Window & typeof globalThis)
    const canvas = within(doc.body)
    const addButton = await canvas.findByRole('button', { name: `+ ${authT(locale, 'auth', 'company_add_new')}` })
    await userEvent.click(addButton)

    const logoCanvas = doc.createElement('canvas')
    logoCanvas.width = 32
    logoCanvas.height = 32
    const ctx = logoCanvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#4665ff'
      ctx.fillRect(0, 0, 32, 32)
    }
    const blob: Blob = await new Promise((resolve, reject) => {
      logoCanvas.toBlob(b => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))), 'image/png')
    })
    const file = new win.File([blob], 'logo.png', { type: 'image/png' })

    const fileInput = await canvas.findByRole('button', { name: authT(locale, 'common', 'choose_file') })
      .then(() => doc.querySelector('input[type="file"]') as HTMLInputElement)
    const dataTransfer = new win.DataTransfer()
    dataTransfer.items.add(file)
    Object.defineProperty(fileInput, 'files', { value: dataTransfer.files, configurable: true })
    fileInput.dispatchEvent(new win.Event('input', { bubbles: true }))
    fileInput.dispatchEvent(new win.Event('change', { bubbles: true }))

    // Wait for the preview <img> the successful selection renders (handleLogoSelect resolves
    // asynchronously via `Image.onload`).
    await canvas.findByAltText('logo preview')
  },
}
