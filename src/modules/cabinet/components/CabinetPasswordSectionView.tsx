'use client'

import type { ChangeEvent, FormEvent, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { Alert, Button, PasswordInput, Stack, Text } from '@mantine/core'
import { PasswordRequirementsHint } from '@/design-system/mantine/patterns'

// Task 873 §16.3 — a literal object here fails `tsc` (TS2769: 'component' does not exist in type
// 'InputDescriptionProps & DataAttributes') because Mantine's PasswordInput factory infers
// descriptionProps' type from the literal shape passed at each call site; a module-level constant
// with a stable inferred type passes. Required so the hint's <Stack> root renders as a <div>
// description, not Mantine's default <p> (the hint contains a nested <p> and <ul> — invalid inside
// a <p>, and a React hydration error).
const hintDescriptionProps = { component: 'div' }

export interface CabinetPasswordSectionViewProps {
  currentPassword: string
  newPassword: string
  errorKey: string | null
  isSamePassword: boolean
  submitting: boolean
  submitDisabled: boolean
  currentPasswordVisible: boolean
  newPasswordVisible: boolean
  currentInputRef: RefObject<HTMLInputElement | null>
  newInputRef: RefObject<HTMLInputElement | null>
  onCurrentPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onNewPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onCurrentVisibilityChange: (visible: boolean) => void
  onNewVisibilityChange: (visible: boolean) => void
  onSubmit: (event: FormEvent) => void
}

/**
 * Presentational View for the cabinet password-change section (Task 873, Container/Presentational
 * split of `CabinetPasswordSection`). No hooks, network or router — every value, error and ref
 * comes from the container. No success/error ring on the new-password field (F4): the hint alone
 * carries validity feedback. The hint is the new-password field's Mantine `description` (owner
 * D81-5, §16.3): it stays linked via `aria-describedby`, which Mantine now owns.
 */
export function CabinetPasswordSectionView({
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
  onCurrentPasswordChange,
  onNewPasswordChange,
  onCurrentVisibilityChange,
  onNewVisibilityChange,
  onSubmit,
}: CabinetPasswordSectionViewProps) {
  const t = useTranslations('cabinet')
  const tc = useTranslations('common')

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">{t('password_section_title')}</Text>

      <Stack gap="md" component="form" onSubmit={onSubmit}>
        {errorKey && (
          <Alert color="red" role="alert">{t(errorKey as Parameters<typeof t>[0])}</Alert>
        )}

        {isSamePassword && !errorKey && (
          <Alert color="red" role="alert">{t('password_error_same')}</Alert>
        )}

        <PasswordInput
          ref={currentInputRef}
          id="cabinet-current-password"
          label={t('password_current_label')}
          value={currentPassword}
          onChange={onCurrentPasswordChange}
          required
          autoComplete="current-password"
          visible={currentPasswordVisible}
          onVisibilityChange={onCurrentVisibilityChange}
          visibilityToggleButtonProps={{ 'aria-label': currentPasswordVisible ? tc('hide_password') : tc('show_password') }}
        />

        <PasswordInput
          ref={newInputRef}
          id="cabinet-new-password"
          label={t('password_new_label')}
          value={newPassword}
          onChange={onNewPasswordChange}
          required
          autoComplete="new-password"
          visible={newPasswordVisible}
          onVisibilityChange={onNewVisibilityChange}
          visibilityToggleButtonProps={{ 'aria-label': newPasswordVisible ? tc('hide_password') : tc('show_password') }}
          description={<PasswordRequirementsHint value={newPassword} />}
          descriptionProps={hintDescriptionProps}
          inputWrapperOrder={['label', 'input', 'description', 'error']}
        />

        <Button type="submit" fullWidth loading={submitting} disabled={submitDisabled}>
          {t('password_submit')}
        </Button>
      </Stack>
    </Stack>
  )
}
