'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Alert, Button, Center, Loader, PasswordInput, Stack, Text, ThemeIcon, Title, useMantineTheme } from '@mantine/core'
import { MantineAuthCard, PasswordRequirementsHint } from '@/design-system/mantine/patterns'
import { VARIANT_COLORS } from '@/design-system/mantine/notificationVariants'

export type ResetPasswordPageState = 'loading' | 'form' | 'success' | 'expired'

export interface ResetPasswordViewProps {
  pageState: ResetPasswordPageState
  password: string
  errorKey: string | null
  submitting: boolean
  allMet: boolean
  passwordVisible: boolean
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onVisibilityChange: (visible: boolean) => void
  onSubmit: (event: FormEvent) => void
  onRequestNew: () => void
  onGoLogin: () => void
}

/**
 * Presentational View for the password-reset page (Task 873, Container/Presentational split of
 * `ResetPasswordClient`). No hooks, network, router or Supabase — every state transition is
 * decided by the container and handed down as props. Card chrome and PasswordInput composition
 * follow AuthSheet's canonical register-view pattern (F4): no success/error ring on the field,
 * `PasswordRequirementsHint` carries validity feedback alone.
 */
export function ResetPasswordView({
  pageState,
  password,
  errorKey,
  submitting,
  allMet,
  passwordVisible,
  onPasswordChange,
  onVisibilityChange,
  onSubmit,
  onRequestNew,
  onGoLogin,
}: ResetPasswordViewProps) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  if (pageState === 'loading') {
    return (
      <Center mih="60vh">
        <Loader color="brand" size="lg" />
      </Center>
    )
  }

  if (pageState === 'expired') {
    return (
      <Center mih="60vh" p="md">
        <MantineAuthCard>
          <Stack align="center" gap="md" ta="center">
            <ThemeIcon size="hero" radius="xl" color={VARIANT_COLORS.error} variant="light">
              <XCircle size={theme.other.iconSize.feature} aria-hidden="true" />
            </ThemeIcon>
            <Title order={1} size="h3">{t('reset_password_expired_title')}</Title>
            <Text size="sm" c="dimmed">{t('reset_password_expired_body')}</Text>
            <Button fullWidth variant="outline" onClick={onRequestNew}>
              {t('reset_password_request_new')}
            </Button>
          </Stack>
        </MantineAuthCard>
      </Center>
    )
  }

  if (pageState === 'success') {
    return (
      <Center mih="60vh" p="md">
        <MantineAuthCard>
          <Stack align="center" gap="md" ta="center">
            <ThemeIcon size="hero" radius="xl" color={VARIANT_COLORS.success} variant="light">
              <CheckCircle2 size={theme.other.iconSize.feature} aria-hidden="true" />
            </ThemeIcon>
            <Title order={1} size="h3">{t('reset_password_success_title')}</Title>
            <Text size="sm" c="dimmed">{t('reset_password_success_body')}</Text>
            <Button fullWidth onClick={onGoLogin}>
              {t('reset_password_go_login')}
            </Button>
          </Stack>
        </MantineAuthCard>
      </Center>
    )
  }

  return (
    <Center mih="60vh" p="md">
      <MantineAuthCard>
        <Stack gap="md" component="form" onSubmit={onSubmit}>
          <Title order={1} size="h3">{t('reset_password_title')}</Title>

          {errorKey && (
            <Alert color="red">{t(errorKey as Parameters<typeof t>[0])}</Alert>
          )}

          <Stack gap="compact">
            <PasswordInput
              id="new-password"
              label={t('reset_password_new_label')}
              value={password}
              onChange={onPasswordChange}
              required
              autoComplete="new-password"
              autoFocus
              visible={passwordVisible}
              onVisibilityChange={onVisibilityChange}
              visibilityToggleButtonProps={{ 'aria-label': passwordVisible ? tc('hide_password') : tc('show_password') }}
            />
            <PasswordRequirementsHint value={password} />
          </Stack>

          <Button type="submit" fullWidth loading={submitting} disabled={submitting || !allMet} mt="xs">
            {t('reset_password_submit')}
          </Button>
        </Stack>
      </MantineAuthCard>
    </Center>
  )
}
