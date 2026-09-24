'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { allPasswordRulesMet } from '@/lib/passwordRules'
import { changeCabinetPassword } from '@/modules/cabinet/actions'
import { signOut } from '@/lib/auth/browser'
import { toast } from '@/lib/toast'
import { CabinetPasswordSectionView } from './CabinetPasswordSectionView'

export function CabinetPasswordSection() {
  const t = useTranslations('cabinet')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [rateLimitCooldown, setRateLimitCooldown] = useState(false)
  const currentInputRef = useRef<HTMLInputElement>(null)
  const newInputRef = useRef<HTMLInputElement>(null)
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false)
  const [newPasswordVisible, setNewPasswordVisible] = useState(false)

  const allMet = allPasswordRulesMet(newPassword)
  const isSamePassword = currentPassword.length > 0 && currentPassword === newPassword
  const submitDisabled =
    submitting ||
    rateLimitCooldown ||
    !allMet ||
    currentPassword.length === 0 ||
    isSamePassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitDisabled) return
    setErrorKey(null)
    setSubmitting(true)

    const result = await changeCabinetPassword({ currentPassword, newPassword })
    setSubmitting(false)

    if (result.ok) {
      toast.success(t('password_changed_success'))
      setCurrentPassword('')
      setNewPassword('')
      await signOut('global')
      return
    }

    switch (result.reason) {
      case 'invalid_current':
        setErrorKey('password_error_invalid_current')
        setTimeout(() => currentInputRef.current?.focus(), 50)
        break
      case 'weak_password':
        setErrorKey('password_error_weak')
        setTimeout(() => newInputRef.current?.focus(), 50)
        break
      case 'same_password':
        setErrorKey('password_error_same')
        setTimeout(() => newInputRef.current?.focus(), 50)
        break
      case 'rate_limited':
        setErrorKey('password_error_rate_limited')
        setRateLimitCooldown(true)
        setTimeout(() => setRateLimitCooldown(false), 30_000)
        break
      case 'session_expired':
        setErrorKey('password_error_session_expired')
        setTimeout(() => signOut('local'), 2_000)
        break
      case 'server_error':
      default:
        setErrorKey('password_error_server')
        break
    }
  }

  return (
    <CabinetPasswordSectionView
      currentPassword={currentPassword}
      newPassword={newPassword}
      errorKey={errorKey}
      isSamePassword={isSamePassword}
      submitting={submitting}
      submitDisabled={submitDisabled}
      currentInputRef={currentInputRef}
      newInputRef={newInputRef}
      currentPasswordVisible={currentPasswordVisible}
      newPasswordVisible={newPasswordVisible}
      onCurrentPasswordChange={e => { setCurrentPassword(e.target.value); setErrorKey(null) }}
      onNewPasswordChange={e => { setNewPassword(e.target.value); setErrorKey(null) }}
      onCurrentVisibilityChange={setCurrentPasswordVisible}
      onNewVisibilityChange={setNewPasswordVisible}
      onSubmit={handleSubmit}
    />
  )
}
