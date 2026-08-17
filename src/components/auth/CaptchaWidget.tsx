'use client'

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useTranslations } from 'next-intl'
import { Text } from '@mantine/core'

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
    // lh is 19.5px (not text-xs's paired 16px): globals.css's `p { @apply leading-relaxed }`
    // base rule applies to this element's underlying <p> and measures 19.5px in the real
    // AuthSheet render — matched here for zero visual delta, not derived from text-xs.
    <Text size="xs" lh="19.5px" c="var(--muted-foreground)" ta="center" py={4} role="note">
      {label}
    </Text>
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
        style={{ width: '100%' }}
      />
    )
  },
)
CaptchaWidget.displayName = 'CaptchaWidget'
