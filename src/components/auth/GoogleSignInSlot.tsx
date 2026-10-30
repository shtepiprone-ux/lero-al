'use client'

import { useTranslations } from 'next-intl'
import { Alert, Button, Image, Stack, useMantineTheme } from '@mantine/core'

export type GoogleSignInSlotStatus = 'ready' | 'pending' | 'unavailable'
/** `signin`: the sign-in sheet; `reauth`: the cabinet's re-confirmation, whose account may have no password to fall back to. */
export type GoogleSignInPurpose = 'signin' | 'reauth'
/** Why the last attempt did not sign anybody in: the browser refused Google's window, or Google's window ended with an error or no answer. A window the person closed is no notice. */
export type GoogleSignInNotice = 'popup_blocked' | 'failed'

interface GoogleSignInSlotProps {
  status: GoogleSignInSlotStatus
  notice?: GoogleSignInNotice | null
  purpose?: GoogleSignInPurpose
  onClick: () => void
}

/**
 * The Google slot of the sign-in sheet (Task 927): one full-width child of the form Stack, so it keeps the form's rhythm. Stateless.
 * The button is our own (Task 927 D25), the theme's `default` Button with Google's own "G" from `public/brand`: it looks like the sheet's other secondary buttons, as Medium's Google button
 * looks like Medium's others. It replaced the button Google Identity Services drew, because that one was drawn in two passes and was replaced and resized in view as the sheet opened.
 * Ours renders with the page, so it never changes in view. `pending` is the button's own loading state while Google's window is open; `unavailable` shows the sheet's red error alert.
 */
export function GoogleSignInSlot({ status, notice = null, purpose = 'signin', onClick }: GoogleSignInSlotProps) {
  const t = useTranslations('auth')
  const theme = useMantineTheme()
  if (status === 'unavailable') return <Alert color="red">{purpose === 'reauth' ? t('google_reauth_unavailable') : t('google_unavailable')}</Alert>
  return (
    <Stack gap="md">
      {notice && <Alert color="red">{notice === 'popup_blocked' ? t('google_popup_blocked') : t('google_failed')}</Alert>}
      <Button
        variant="default"
        fullWidth
        data-google-sign-in
        loading={status === 'pending'}
        onClick={onClick}
        leftSection={<Image src="/brand/google-g.svg" alt="" w={theme.other.iconSize.comfortable} h={theme.other.iconSize.comfortable} />}
      >
        {t('google_sign_in')}
      </Button>
    </Stack>
  )
}
