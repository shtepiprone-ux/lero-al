'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Anchor, Avatar, Center, Stack, Text, useMantineTheme } from '@mantine/core'

interface GoogleWelcomeBackProps {
  name: string
  maskedEmail: string
  picture: string | null
  /** The container's Google button (Task 927 D25); the view only places it. */
  googleControl: ReactNode
  /** The sheet's own alerts, in their order: the session-lost notice, then the error. */
  alerts?: ReactNode
  onForget: () => void
  onMoreOptions: () => void
}

/**
 * The returning person's view of the sign-in sheet (Task 927 Amendment 5, owner decision D13): who this device remembers, Google's standard button, and the two exits —
 * forget the account, or choose another sign-in method. Stateless. The root keeps the login form's rhythm (`gap="md"`); the name and the masked e-mail wrap through the theme's `Text`.
 */
export function GoogleWelcomeBack({ name, maskedEmail, picture, googleControl, alerts, onForget, onMoreOptions }: GoogleWelcomeBackProps) {
  const t = useTranslations('auth')
  const theme = useMantineTheme()
  return (
    <Stack gap="md" pb="xl">
      {alerts}

      <Stack gap="xs" align="center">
        <Avatar src={picture ?? undefined} name={name} color="brand" size={theme.other.iconSize.colossal} aria-hidden />
        <Text fw={600} size="lg" ta="center">{name}</Text>
        <Text size="sm" c="dimmed" ta="center">{maskedEmail}</Text>
      </Stack>

      {googleControl}

      <Center>
        <Anchor component="button" type="button" size="sm" c="brand" onClick={onForget}>
          {t('welcome_back_forget')}
        </Anchor>
      </Center>

      <Text ta="center" size="sm" c="dimmed">
        {t('welcome_back_not_you')}{' '}
        <Anchor component="button" type="button" size="sm" c="brand" onClick={onMoreOptions}>
          {t('welcome_back_more_options')}
        </Anchor>
      </Text>
    </Stack>
  )
}
