'use client'

import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Alert, Anchor, Button, Group, PasswordInput, Stack, Text, TextInput, useMantineTheme } from '@mantine/core'
import { Info } from 'lucide-react'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'

// The form validates the address itself (the container's `EMAIL_RE` check and its localized text), so the browser's own bubble must not pre-empt it. `Stack` types no
// `noValidate`, and a module-level constant with a stable inferred type passes where the literal attribute fails `tsc` (the same shape as the sibling `hintDescriptionProps`).
const formAttributes = { noValidate: true }

export interface CabinetEmailChangeSectionViewProps {
  currentEmail: string
  /** the address that waits for its confirmation link; `null` when none waits */
  pendingEmail: string | null
  newEmail: string
  password: string
  passwordVisible: boolean
  /** how the person proves who they are: the current password, or a new Google sign-in; `null` while unknown (the password field shows) */
  method: 'password' | 'google' | null
  sending: boolean
  submitDisabled: boolean
  /** a display text, already localized by the container */
  error: string | null
  googleControl: ReactNode | null
  onNewEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordVisibilityChange: (visible: boolean) => void
  onSubmit: (event: FormEvent) => void
  onResend: () => void
}

/**
 * Presentational View for the cabinet e-mail change section (Task 923 R83, Container/Presentational split of `CabinetEmailChangeSection`). No hooks besides
 * `useTranslations`, no network, no router: every value, error and handler comes from the container. The look is the sibling `CabinetPasswordSectionView`'s: one
 * `Stack gap="md"`, a 600-weight small title, the canonical red `Alert` for a refusal and a full-width `Button`. The current address is a `MantineDetailList` field; an address
 * that waits for its link is the canonical info `Alert` with the resend action under it.
 */
export function CabinetEmailChangeSectionView({
  currentEmail,
  pendingEmail,
  newEmail,
  password,
  passwordVisible,
  method,
  sending,
  submitDisabled,
  error,
  googleControl,
  onNewEmailChange,
  onPasswordChange,
  onPasswordVisibilityChange,
  onSubmit,
  onResend,
}: CabinetEmailChangeSectionViewProps) {
  const t = useTranslations('cabinet')
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">{t('email_section_title')}</Text>

      {currentEmail && (
        <MantineDetailList variant="plain" items={[{ label: t('email_current_label'), value: currentEmail }]} />
      )}

      {pendingEmail ? (
        <>
          <Alert color="blueLight" icon={<Info size={theme.other!.iconSize!.roomy} />} title={t('email_change_pending_title')}>
            {t('email_change_pending', { email: pendingEmail })}
          </Alert>

          {error && (
            <Alert color="red" role="alert">{error}</Alert>
          )}

          <Group>
            <Anchor component="button" type="button" size="sm" onClick={onResend} disabled={sending}>
              {sending ? tc('loading') : t('email_change_resend')}
            </Anchor>
          </Group>
        </>
      ) : (
        <Stack gap="md" component="form" onSubmit={onSubmit} {...formAttributes}>
          {error && (
            <Alert color="red" role="alert">{error}</Alert>
          )}

          <TextInput
            type="email"
            label={t('email_new_label')}
            description={t('email_change_hint')}
            value={newEmail}
            onChange={onNewEmailChange}
            required
            autoComplete="email"
          />

          {method !== 'google' && (
            <PasswordInput
              id="cabinet-email-change-password"
              label={t('password_current_label')}
              value={password}
              onChange={onPasswordChange}
              autoComplete="current-password"
              visible={passwordVisible}
              onVisibilityChange={onPasswordVisibilityChange}
              visibilityToggleButtonProps={{ 'aria-label': passwordVisible ? tc('hide_password') : tc('show_password') }}
            />
          )}

          <Button type="submit" fullWidth loading={sending} disabled={submitDisabled}>
            {t('email_change_submit')}
          </Button>
        </Stack>
      )}

      {googleControl}
    </Stack>
  )
}
