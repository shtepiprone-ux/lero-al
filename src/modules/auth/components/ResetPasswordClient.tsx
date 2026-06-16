'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { getSession, updatePassword, signOut, verifyOtp } from '@/lib/auth/browser'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput, type PasswordInputState } from '@/components/ui/PasswordInput'
import { PasswordRequirementsHint, allPasswordRulesMet } from '@/components/ui/PasswordRequirementsHint'
import { logPasswordRecoveryCompletion } from '@/modules/auth/actions/recovery'

type PageState = 'loading' | 'form' | 'success' | 'expired'
type VerifyMode = 'token_hash' | 'session'

interface ResetPasswordClientProps {
  locale: string
  tokenHash?: string
  otpType?: string
}

export function ResetPasswordClient({ locale, tokenHash, otpType }: ResetPasswordClientProps) {
  const t = useTranslations('auth')
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [verifyMode, setVerifyMode] = useState<VerifyMode>('session')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const hasInput = password.length > 0
  const allMet = allPasswordRulesMet(password)
  const passwordInputState: PasswordInputState = hasInput ? (allMet ? 'success' : 'error') : 'idle'

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

  if (pageState === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (pageState === 'expired') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-card border rounded-2xl shadow-sm p-8 flex flex-col items-center gap-5 text-center">
          <XCircle className="h-14 w-14 text-destructive shrink-0" />
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold">{t('reset_password_expired_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('reset_password_expired_body')}</p>
          </div>
          <Button
            size="xl"
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/${locale}`)}
          >
            {t('reset_password_request_new')}
          </Button>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-card border rounded-2xl shadow-sm p-8 flex flex-col items-center gap-5 text-center">
          <CheckCircle2 className="h-14 w-14 text-status-success shrink-0" />
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold">{t('reset_password_success_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('reset_password_success_body')}</p>
          </div>
          <Button
            size="xl"
            className="w-full"
            onClick={() => router.push(`/${locale}/auth/login`)}
          >
            {t('reset_password_go_login')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8 md:py-12">
      <div className="max-w-sm w-full bg-card border rounded-2xl shadow-sm p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">{t('reset_password_title')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorKey && (
            <Alert variant="destructive">
              <AlertDescription>{t(errorKey as Parameters<typeof t>[0])}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">{t('reset_password_new_label')}</Label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              autoFocus
              inputState={passwordInputState}
            />
            <PasswordRequirementsHint value={password} />
          </div>

          <Button type="submit" size="xl" className="w-full mt-2" disabled={submitting || !allMet}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('reset_password_submit')}
          </Button>
        </form>
      </div>
    </div>
  )
}
