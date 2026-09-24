'use client'

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Turnstile, type TurnstileInstance, type TurnstileLangCode } from '@marsidev/react-turnstile'
import { useTranslations, useLocale } from 'next-intl'
import { Text, useMantineTheme } from '@mantine/core'

// Cloudflare's supported-languages list (fetched 2026-09-24,
// https://developers.cloudflare.com/turnstile/reference/supported-languages/) has en/it/uk but no
// sq. D81-6 (owner, 2026-09-24): sq keeps 'auto' — Turnstile's own default of following the
// visitor's browser language — rather than an unsupported code.
const TURNSTILE_LANGUAGE_BY_LOCALE: Record<string, TurnstileLangCode> = {
  en: 'en',
  it: 'it',
  uk: 'uk',
}

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
  const mantineTheme = useMantineTheme()

  useEffect(() => {
    onSuccess('dev-noop-token')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    // lh is 19.5px (not text-xs's paired 16px): globals.css's `p { @apply leading-relaxed }`
    // base rule applies to this element's underlying <p> and measures 19.5px in the real
    // AuthSheet render — matched here for zero visual delta, not derived from text-xs.
    <Text size="xs" lh={mantineTheme.other.lineHeight.authNoteParagraph} c="var(--muted-foreground)" ta="center" py="tight" role="note">
      {label}
    </Text>
  )
}

export const CaptchaWidget = forwardRef<CaptchaWidgetHandle, CaptchaWidgetProps>(
  ({ onSuccess, onError, onExpire, theme = 'auto' }, ref) => {
    const t = useTranslations('auth')
    const locale = useLocale()
    const widgetRef = useRef<TurnstileInstance>(null)
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    const language: TurnstileLangCode = TURNSTILE_LANGUAGE_BY_LOCALE[locale] ?? 'auto'

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
        options={{ theme, size: 'flexible', language }}
        aria-label={t('captcha_aria_label')}
        style={{ width: '100%' }}
      />
    )
  },
)
CaptchaWidget.displayName = 'CaptchaWidget'
