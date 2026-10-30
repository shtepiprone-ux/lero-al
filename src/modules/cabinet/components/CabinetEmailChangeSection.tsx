'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { initiateEmailChange, resendEmailVerification } from '@/modules/cabinet/actions'
import { CabinetEmailChangeSectionView } from './CabinetEmailChangeSectionView'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

interface Props {
  /** the account's current e-mail address; `null` when the tab does not know it */
  email: string | null
  initialPendingEmail: string | null
  locale: string
  /** how the person proves who they are before the change (Task 923 R80, D54); `null` while the server has not answered */
  reauthMethod: 'password' | 'google' | null
  /** false while another Google button of the page is mounted: GIS keeps only the last `initialize` of the page */
  googleAllowed: boolean
  /** the tab's confirmation handler: it checks the account, signs in and then calls `repeat` once */
  onGoogleCredential: (
    result: { credential: string; nonce: string },
    repeat: () => Promise<void>,
    showError: (text: string) => void,
  ) => Promise<void>
}

/**
 * Container of the cabinet e-mail change section (Task 923 R83, moved out of `ProfileTab` with its behaviour unchanged): the same `EMAIL_RE` check, `initiateEmailChange` with the
 * current password unless the proof is a Google sign-in, `reauth_required` offering the Google control, a stored pending address after a success, and the resend.
 */
export function CabinetEmailChangeSection({ email, initialPendingEmail, locale, reauthMethod, googleAllowed, onGoogleCredential }: Props) {
  const t = useTranslations('cabinet')

  const [newEmail, setNewEmail] = useState('')
  const [pendingEmail, setPendingEmail] = useState<string | null>(initialPendingEmail)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [needsGoogle, setNeedsGoogle] = useState(false)

  // the password is asked for unless the proof is a Google sign-in (an unknown method asks for it, and the server refuses anyone it cannot verify)
  const submitDisabled = !newEmail.trim() || (reauthMethod !== 'google' && password === '') || sending

  async function handleEmailChange() {
    if (!newEmail.trim()) return
    if (!EMAIL_RE.test(newEmail.trim())) { setError(t('error_email_invalid')); return }
    setSending(true)
    setError(null)
    setNeedsGoogle(false)
    const result = await initiateEmailChange({
      newEmail: newEmail.trim(),
      locale,
      ...(reauthMethod === 'google' ? {} : { currentPassword: password }),
    })
    setSending(false)
    if (result.error) {
      setError(result.error)
      // an account with no password (or a Google sign-in older than 10 minutes) proves itself with a new Google sign-in (Task 923 R80)
      if (result.reason === 'reauth_required') setNeedsGoogle(true)
    } else {
      setPendingEmail(result.pendingEmail ?? newEmail.trim())
      setNewEmail('')
      setPassword('')
    }
  }

  async function handleResendVerification() {
    setSending(true)
    const result = await resendEmailVerification({ locale })
    setSending(false)
    if (result.error) setError(result.error)
  }

  async function handleGoogleCredential(result: { credential: string; nonce: string }) {
    if (sending) return
    await onGoogleCredential(result, handleEmailChange, setError)
  }

  return (
    <CabinetEmailChangeSectionView
      currentEmail={email ?? ''}
      pendingEmail={pendingEmail}
      newEmail={newEmail}
      password={password}
      passwordVisible={passwordVisible}
      method={reauthMethod}
      sending={sending}
      submitDisabled={submitDisabled}
      error={error}
      googleControl={needsGoogle && googleAllowed ? (
        <GoogleSignInButton
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          purpose="reauth"
          loginHint={email ?? undefined}
          onCredential={handleGoogleCredential}
        />
      ) : null}
      onNewEmailChange={event => {
        setNewEmail(event.currentTarget.value)
        setError(null)
        if (reauthMethod === 'google') setNeedsGoogle(false)
      }}
      onPasswordChange={event => { setPassword(event.currentTarget.value); setError(null) }}
      onPasswordVisibilityChange={setPasswordVisible}
      onSubmit={event => { event.preventDefault(); if (!submitDisabled) void handleEmailChange() }}
      onResend={handleResendVerification}
    />
  )
}
