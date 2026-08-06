'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput, type PasswordInputState } from '@/components/ui/PasswordInput'
import { PasswordRequirementsHint } from '@/components/ui/PasswordRequirementsHint'
import { allPasswordRulesMet } from '@/lib/passwordRules'
import { changeCabinetPassword } from '@/modules/cabinet/actions'
import { signOut } from '@/lib/auth/browser'
import { toast } from '@/lib/toast'

export function CabinetPasswordSection() {
  const t = useTranslations('cabinet')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [rateLimitCooldown, setRateLimitCooldown] = useState(false)
  const currentInputRef = useRef<HTMLInputElement>(null)
  const newInputRef = useRef<HTMLInputElement>(null)

  const hasNew = newPassword.length > 0
  const allMet = allPasswordRulesMet(newPassword)
  const newInputState: PasswordInputState = hasNew ? (allMet ? 'success' : 'error') : 'idle'
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
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold">{t('password_section_title')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorKey && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t(errorKey as Parameters<typeof t>[0])}</AlertDescription>
          </Alert>
        )}

        {isSamePassword && !errorKey && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t('password_error_same')}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cabinet-current-password" className="text-sm">
            {t('password_current_label')}
          </Label>
          <PasswordInput
            ref={currentInputRef}
            id="cabinet-current-password"
            value={currentPassword}
            onChange={e => { setCurrentPassword(e.target.value); setErrorKey(null) }}
            required
            autoComplete="current-password"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cabinet-new-password" className="text-sm">
            {t('password_new_label')}
          </Label>
          <PasswordInput
            ref={newInputRef}
            id="cabinet-new-password"
            value={newPassword}
            onChange={e => { setNewPassword(e.target.value); setErrorKey(null) }}
            required
            autoComplete="new-password"
            inputState={newInputState}
            aria-describedby="cabinet-password-hint"
          />
          <div id="cabinet-password-hint">
            <PasswordRequirementsHint value={newPassword} />
          </div>
        </div>

        <Button
          type="submit"
          size="xl"
          className="w-full"
          disabled={submitDisabled}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('password_submit')}
        </Button>
      </form>
    </div>
  )
}
