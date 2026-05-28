'use client'

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useTranslations } from 'next-intl'

export interface CaptchaWidgetHandle {
  reset: () => void
}

interface CaptchaWidgetProps {
  onSuccess: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
}

function CaptchaDevFallback({
  onSuccess,
  label,
}: {
  onSuccess: (token: string) => void
  label: string
}) {
  useEffect(() => {
    onSuccess('dev-noop-token')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <p className="text-xs text-muted-foreground text-center py-1" role="note">
      {label}
    </p>
  )
}

export const CaptchaWidget = forwardRef<CaptchaWidgetHandle, CaptchaWidgetProps>(
  ({ onSuccess, onError, onExpire, theme = 'auto' }, ref) => {
    const t = useTranslations('auth')
    const widgetRef = useRef<TurnstileInstance>(null)
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    useImperativeHandle(ref, () => ({
      reset: () => widgetRef.current?.reset(),
    }))

    if (!siteKey) {
      return (
        <CaptchaDevFallback
          onSuccess={onSuccess}
          label={t('captcha_not_configured')}
        />
      )
    }

    return (
      <Turnstile
        ref={widgetRef}
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{ theme, size: 'flexible' }}
        aria-label={t('captcha_aria_label')}
        className="w-full"
      />
    )
  },
)
CaptchaWidget.displayName = 'CaptchaWidget'
