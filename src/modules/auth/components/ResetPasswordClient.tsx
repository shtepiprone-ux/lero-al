'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, updatePassword, signOut, verifyOtp } from '@/lib/auth/browser'
import { allPasswordRulesMet } from '@/lib/passwordRules'
import { logPasswordRecoveryCompletion } from '@/modules/auth/actions/recovery'
import { ResetPasswordView } from './ResetPasswordView'

type PageState = 'loading' | 'form' | 'success' | 'expired'
type VerifyMode = 'token_hash' | 'session'

interface ResetPasswordClientProps {
  locale: string
  tokenHash?: string
  otpType?: string
}

export function ResetPasswordClient({ locale, tokenHash, otpType }: ResetPasswordClientProps) {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [verifyMode, setVerifyMode] = useState<VerifyMode>('session')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)

  const allMet = allPasswordRulesMet(password)

  useEffect(() => {
    void (async () => {
      // Token-hash path (new prefetch-safe flow): link goes directly here with token_hash in URL.
      // Do NOT call verifyOtp on mount — token is consumed only on explicit form submit (N1 gate).
      if (tokenHash && otpType === 'recovery') {
        setVerifyMode('token_hash')
        setPageState('form')
        return
      }
      // Legacy session path: old /auth/confirm pre-verified flow — session already established.
      const { data } = await getSession()
      if (data.session?.user) {
        setUserId(data.session.user.id)
        setUserEmail(data.session.user.email ?? null)
        setVerifyMode('session')
        setPageState('form')
      } else {
        setPageState('expired')
      }
    })()
  }, [tokenHash, otpType])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return  // N5: double-submit guard
    setErrorKey(null)
    setSubmitting(true)

    if (verifyMode === 'token_hash') {
      // Step 1: verify the one-time token on user gesture (prefetch-safe — not on mount)
      const { data: verifyData, error: verifyError } = await verifyOtp({
        token_hash: tokenHash!,
        type: 'recovery',
      })
      if (verifyError) {
        setSubmitting(false)
        setPageState('expired')  // N2: expired / already-used / invalid token
        return
      }

      // Step 2: update password (recovery session now active from verifyOtp)
      const { error: updateError } = await updatePassword(password)
      setSubmitting(false)
      if (updateError) {
        setErrorKey('reset_password_error_generic')  // N4: server error after valid verify
        return
      }

      const verifiedUserId = verifyData.user?.id ?? null
      const verifiedUserEmail = verifyData.user?.email ?? null
      if (verifiedUserId) {
        await logPasswordRecoveryCompletion(verifiedUserId, verifiedUserEmail ?? '')
      }
      setPageState('success')
      await signOut()
      return
    }

    // Legacy session path: session pre-established by /auth/confirm
    const { error } = await updatePassword(password)
    setSubmitting(false)
    if (error) {
      setErrorKey('reset_password_error_generic')
      return
    }
    if (userId) {
      await logPasswordRecoveryCompletion(userId, userEmail ?? '')
    }
    setPageState('success')
    await signOut()
  }

  return (
    <ResetPasswordView
      pageState={pageState}
      password={password}
      errorKey={errorKey}
      submitting={submitting}
      allMet={allMet}
      passwordVisible={passwordVisible}
      onPasswordChange={e => setPassword(e.target.value)}
      onVisibilityChange={setPasswordVisible}
      onSubmit={handleSubmit}
      onRequestNew={() => router.push(`/${locale}`)}
      onGoLogin={() => router.push(`/${locale}/auth/login`)}
    />
  )
}
