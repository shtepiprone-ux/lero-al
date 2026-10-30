import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Info } from 'lucide-react'
import { UserIcon } from '@solar-icons/react/broken'
import { Text, Button, TextInput, Textarea, useMantineTheme } from '@mantine/core'
import { storyT } from '../../_storyI18n'
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'
import { MantineRadioCardGroup, MantineRadioCardOption } from '@/design-system/mantine/patterns/MantineRadioCardOption'
import { MantineNavRowList } from '@/design-system/mantine/patterns/MantineNavRowList'
import { MantineDeleteConfirmModal, DELETE_CONFIRM_WORD } from '@/design-system/mantine/patterns/MantineDeleteConfirmModal'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { MantineStoryShell, MantineStorySection, MantineStoryStack } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Modal',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

function ModalStandardSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_standard')}>
      <Button variant="default" onClick={() => setOpened(true)}>{t('modal_trigger_open')}</Button>
      <MantineModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('modal_title')}
        footer={
          <MantineDialogFooter
            secondary={<Button variant="default" onClick={() => setOpened(false)}>{t('modal_cancel')}</Button>}
            primary={<Button onClick={() => setOpened(false)}>{t('modal_confirm')}</Button>}
          />
        }
      >
        {/* No outer Box — MantineModal supplies the content gutter (Task 520); the body is plain text (R62). */}
        <Text>{t('modal_body')}</Text>
      </MantineModal>
    </MantineStorySection>
  )
}

function ModalLongSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_long')}>
      <Button variant="default" onClick={() => setOpened(true)}>{t('modal_long_trigger')}</Button>
      <MantineModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('modal_title')}
      >
        {/* No outer Box — MantineModal supplies the content gutter (Task 520); plain paragraphs, spaced by the section (R62). */}
        <MantineDialogSection>
          {t('modal_long_body').split('\n\n').map((paragraph) => (
            <Text key={paragraph.slice(0, 24)}>{paragraph}</Text>
          ))}
        </MantineDialogSection>
      </MantineModal>
    </MantineStorySection>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <MantineStoryStack>
          <ModalStandardSection locale={locale} />
          <ModalLongSection locale={locale} />
        </MantineStoryStack>
      </MantineStoryShell>
    )
  },
}

// Task 857 R44 — the canonical dialog anatomy (docs §23.7): `structured` adds the icon tile, the title and a muted
// description, a round close button (desktop; the sheet has none), full-bleed dividers under the header and above the
// footer, and sections that own their spacing. Default above stays the unstructured contract, byte for byte.
function ModalStructuredSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const theme = useMantineTheme()
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_structured')}>
      <Button variant="default" onClick={() => setOpened(true)}>{t('modal_trigger_open')}</Button>
      <MantineModal
        structured
        opened={opened}
        onClose={() => setOpened(false)}
        icon={<Info size={theme.other.iconSize.standard} />}
        title={t('modal_title')}
        description={t('modal_body')}
        footer={
          <MantineDialogFooter
            secondary={<Button variant="default" onClick={() => setOpened(false)}>{t('modal_cancel')}</Button>}
            primary={<Button onClick={() => setOpened(false)}>{t('modal_confirm')}</Button>}
          />
        }
      >
        <MantineDialogSections>
          <MantineDialogSection title={t('modal_title')} description={t('modal_body')}>
            <Text>{t('modal_long_trigger')}</Text>
          </MantineDialogSection>
          <MantineDialogSection title={t('modal_long_trigger')}>
            <Text>{t('modal_body')}</Text>
          </MantineDialogSection>
        </MantineDialogSections>
      </MantineModal>
    </MantineStorySection>
  )
}

export const Structured: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <ModalStructuredSection locale={locale} />
      </MantineStoryShell>
    )
  },
}

// Task 859 Revision 2 (R28) — the three dialog variants every Modal consumer composes from (docs §23.6/§23.7). Each is
// a structured `MantineModal` built only from the canonical parts: `MantineDialogSections`, `MantineDetailList`,
// `MantineNavRowList`, `Radio.Card`, `MantineDialogFooter` and canonical fields (and `MantineDeleteConfirmModal`).

// Detail: facts, a choice, and navigation rows; the footer pair is Cancel + the one primary. The single choice is
// `Radio.Card` options through `MantineRadioCardOption`, the one owner of an option's content (Task 859 R63), the same
// options `TicketDetailDialogView` and `PremiumDialogView` render.
function ModalDetailSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const [status, setStatus] = useState('pending')
  const theme = useMantineTheme()
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
  const statuses = ['active', 'pending', 'archived']

  return (
    <MantineStorySection label={t('modal_caption_detail')}>
      <Button variant="default" onClick={() => setOpened(true)}>{t('modal_trigger_open')}</Button>
      <MantineModal
        structured
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('modal_title')}
        description={t('modal_body')}
        footer={
          <MantineDialogFooter
            secondary={<Button variant="default" onClick={() => setOpened(false)}>{t('modal_cancel')}</Button>}
            primary={<Button onClick={() => setOpened(false)}>{t('modal_confirm')}</Button>}
          />
        }
      >
        <MantineDialogSections>
          <MantineDialogSection title={t('form_section_details')}>
            <MantineDetailList
              items={[
                { label: t('form_name'), value: t('avatar_demo_name') },
                { label: t('form_email'), value: t('label_email') },
                {
                  label: t('admin_table_col_status'),
                  value: <MantineBadge variant="status" entity="listing" value="active">{t('admin_status_active')}</MantineBadge>,
                },
              ]}
            />
          </MantineDialogSection>
          <MantineDialogSection title={t('admin_table_col_status')}>
            <MantineRadioCardGroup value={status} onChange={setStatus}>
              {statuses.map(key => (
                <MantineRadioCardOption key={key} value={key} label={t(`admin_status_${key}`)} />
              ))}
            </MantineRadioCardGroup>
          </MantineDialogSection>
          <MantineDialogSection>
            <MantineNavRowList
              items={[{
                key: 'profile',
                icon: <UserIcon size={theme.other.iconSize.standard} aria-hidden="true" />,
                label: t('avatar_demo_name'),
                description: t('label_email'),
                href: '#',
              }]}
            />
          </MantineDialogSection>
        </MantineDialogSections>
      </MantineModal>
    </MantineStorySection>
  )
}

export const Detail: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <ModalDetailSection locale={locale} />
      </MantineStoryShell>
    )
  },
}

// Form: the fields grouped in sections, then the footer pair (Cancel + the one primary).
function ModalFormSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_form')}>
      <Button variant="default" onClick={() => setOpened(true)}>{t('modal_trigger_open')}</Button>
      <MantineModal
        structured
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('modal_title')}
        footer={
          <MantineDialogFooter
            secondary={<Button variant="default" onClick={() => setOpened(false)}>{t('modal_cancel')}</Button>}
            primary={<Button onClick={() => setOpened(false)}>{t('modal_confirm')}</Button>}
          />
        }
      >
        <MantineDialogSections>
          <MantineDialogSection title={t('form_section_contact')}>
            <TextInput label={t('form_name')} />
            <TextInput label={t('form_email')} />
          </MantineDialogSection>
          <MantineDialogSection title={t('form_section_details')}>
            <Textarea label={t('form_message')} autosize minRows={3} />
          </MantineDialogSection>
        </MantineDialogSections>
      </MantineModal>
    </MantineStorySection>
  )
}

export const Form: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <ModalFormSection locale={locale} />
      </MantineStoryShell>
    )
  },
}

// DeleteConfirm: the one confirmation step of a destructive action. The primary is red and shows `loading` while the
// (labelled demo) action runs; Cancel, the close button and Esc all close it.
function ModalDeleteConfirmSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const [loading, setLoading] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_delete')}>
      <Button variant="default" onClick={() => setOpened(true)}>{t('action_delete')}</Button>
      <MantineDeleteConfirmModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('dialog_confirm_title')}
        message={t('dialog_confirm_body')}
        confirmLabel={t('action_delete')}
        cancelLabel={t('action_cancel')}
        loading={loading}
        onConfirm={() => {
          setLoading(true)
          window.setTimeout(() => {
            setLoading(false)
            setOpened(false)
          }, 1500)
        }}
      />
    </MantineStorySection>
  )
}

export const DeleteConfirm: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <ModalDeleteConfirmSection locale={locale} />
      </MantineStoryShell>
    )
  },
}

// DeleteConfirmTyped (Task 923 R46, owner decision D34): the same confirmation with `typedConfirm`. The red primary stays disabled until the person has
// typed the word (any case, trimmed); the field is empty each time the dialog opens. The label is the cabinet's own locale-backed text.
function ModalDeleteConfirmTypedSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const [loading, setLoading] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_delete')}>
      <Button variant="default" onClick={() => setOpened(true)}>{t('action_delete')}</Button>
      <MantineDeleteConfirmModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('dialog_confirm_title')}
        message={t('dialog_confirm_body')}
        confirmLabel={t('action_delete')}
        cancelLabel={t('action_cancel')}
        loading={loading}
        typedConfirm={{ word: DELETE_CONFIRM_WORD, label: storyT(locale, 'cabinet.delete_account_type_confirm') }}
        onConfirm={() => {
          setLoading(true)
          window.setTimeout(() => {
            setLoading(false)
            setOpened(false)
          }, 1500)
        }}
      />
    </MantineStorySection>
  )
}

export const DeleteConfirmTyped: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <ModalDeleteConfirmTypedSection locale={locale} />
      </MantineStoryShell>
    )
  },
}

// DeleteConfirmPassword (Task 923 R80, owner decision D54): the same confirmation with `passwordConfirm`, which replaces the typed word in the cabinet. The red primary
// stays disabled while the field is empty; the demo action (labelled) answers "wrong password" once so that the field's own error is shown. The second section is the
// account with no password, which types DELETE (Task 927 D17): `googleConfirm` is shown (the consumer shows it when the server asks for a new Google sign-in), with the typed field after it.
function ModalDeleteConfirmPasswordSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_delete_password')}>
      <Button
        variant="default"
        onClick={() => {
          setPassword('')
          setError(undefined)
          setOpened(true)
        }}
      >
        {t('action_delete')}
      </Button>
      <MantineDeleteConfirmModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('dialog_confirm_title')}
        message={t('dialog_confirm_body')}
        confirmLabel={t('action_delete')}
        cancelLabel={t('action_cancel')}
        loading={loading}
        passwordConfirm={{
          label: storyT(locale, 'cabinet.delete_account_password_confirm'),
          value: password,
          onChange: (value) => { setPassword(value); setError(undefined) },
          error,
          showLabel: storyT(locale, 'common.show_password'),
          hideLabel: storyT(locale, 'common.hide_password'),
        }}
        onConfirm={() => {
          setLoading(true)
          window.setTimeout(() => {
            setLoading(false)
            setError(storyT(locale, 'cabinet.password_error_invalid_current'))
          }, 800)
        }}
      />
    </MantineStorySection>
  )
}

// The field-error state (Task 923 R81 (d)): a wrong password with the cabinet's own localised text, shown through the public `passwordConfirm.error` prop. The value is a
// labelled fixture; the dialog opens with the error already shown (a wrong password was answered `invalid_password`).
function ModalDeleteConfirmPasswordErrorSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const [password, setPassword] = useState('')
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_delete_password_error')}>
      <Button
        variant="default"
        onClick={() => {
          setPassword('fixture-wrong-password')
          setOpened(true)
        }}
      >
        {t('action_delete')}
      </Button>
      <MantineDeleteConfirmModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('dialog_confirm_title')}
        message={t('dialog_confirm_body')}
        confirmLabel={t('action_delete')}
        cancelLabel={t('action_cancel')}
        passwordConfirm={{
          label: storyT(locale, 'cabinet.delete_account_password_confirm'),
          value: password,
          onChange: setPassword,
          error: storyT(locale, 'cabinet.password_error_invalid_current'),
          showLabel: storyT(locale, 'common.show_password'),
          hideLabel: storyT(locale, 'common.hide_password'),
        }}
        onConfirm={() => setOpened(false)}
      />
    </MantineStorySection>
  )
}

function ModalDeleteConfirmGoogleSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_delete_google_unavailable')}>
      <Button variant="default" onClick={() => setOpened(true)}>{t('action_delete')}</Button>
      <MantineDeleteConfirmModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('dialog_confirm_title')}
        message={t('dialog_confirm_body')}
        confirmLabel={t('action_delete')}
        cancelLabel={t('action_cancel')}
        googleConfirm={{
          message: storyT(locale, 'cabinet.delete_account_google_required'),
          // no client ID: the deterministic unavailable state, without a request to Google
          control: <GoogleSignInButton clientId={undefined} purpose="reauth" onCredential={async () => {}} />,
        }}
        typedConfirm={{ word: DELETE_CONFIRM_WORD, label: storyT(locale, 'cabinet.delete_account_type_confirm') }}
        onConfirm={() => setOpened(false)}
      />
    </MantineStorySection>
  )
}

// The same Google section with the client ID `AuthSheet.tsx` passes: Google draws its own button in the dialog (owner decision D2). The credential handler is a labelled
// no-op: the Story never signs anyone in.
function ModalDeleteConfirmGoogleReadySection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <MantineStorySection label={t('modal_caption_delete_google')}>
      <Button variant="default" onClick={() => setOpened(true)}>{t('action_delete')}</Button>
      <MantineDeleteConfirmModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('dialog_confirm_title')}
        message={t('dialog_confirm_body')}
        confirmLabel={t('action_delete')}
        cancelLabel={t('action_cancel')}
        googleConfirm={{
          message: storyT(locale, 'cabinet.delete_account_google_required'),
          control: <GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} purpose="reauth" onCredential={async () => {}} />,
        }}
        typedConfirm={{ word: DELETE_CONFIRM_WORD, label: storyT(locale, 'cabinet.delete_account_type_confirm') }}
        onConfirm={() => setOpened(false)}
      />
    </MantineStorySection>
  )
}

export const DeleteConfirmPassword: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <MantineStoryStack>
          <ModalDeleteConfirmPasswordSection locale={locale} />
          <ModalDeleteConfirmGoogleSection locale={locale} />
          <ModalDeleteConfirmPasswordErrorSection locale={locale} />
          <ModalDeleteConfirmGoogleReadySection locale={locale} />
        </MantineStoryStack>
      </MantineStoryShell>
    )
  },
}
