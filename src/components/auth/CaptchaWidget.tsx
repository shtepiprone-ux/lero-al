'use client'

import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react'
import { Turnstile, type TurnstileInstance, type TurnstileLangCode } from '@marsidev/react-turnstile'
import { useTranslations, useLocale } from 'next-intl'
import { Box, Text, useMantineTheme } from '@mantine/core'
import * as Sentry from '@sentry/nextjs'

// Cloudflare's supported-languages list (fetched 2026-09-24,
// https://developers.cloudflare.com/turnstile/reference/supported-languages/) has en/it/uk but no
// sq. D81-6 (owner, 2026-09-24): sq keeps 'auto' — Turnstile's own default of following the
// visitor's browser language — rather than an unsupported code.
const TURNSTILE_LANGUAGE_BY_LOCALE: Record<string, TurnstileLangCode> = {
  en: 'en',
  it: 'it',
  uk: 'uk',
}

// How long an `interaction-only` request waits for a token; the same as the library's own default for `getResponsePromise` (30 s).
const CONTACT_TOKEN_TIMEOUT_MS = 30_000

interface PendingTokenRequest {
  promise: Promise<string>
  resolve: (token: string) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export interface CaptchaWidgetHandle {
  reset: () => void
  /**
   * A token on demand (Task 923 R113, R117). With `appearance="interaction-only"` a ready token (one that arrived before the call and has not expired) is handed out at
   * once, once; otherwise the call waits for the token of the running execution, and starts one only when none is running. A token is single-use, so the caller `reset()`s
   * after each answer. A timeout (30 s) or an error of Cloudflare rejects. Without a site key it resolves the development token.
   */
  getToken: () => Promise<string>
}

interface CaptchaWidgetProps {
  onSuccess?: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  /**
   * `always` (default) is the visible flexible widget of the sign-up and reset forms. `interaction-only` takes no space until Cloudflare asks the visitor to interact,
   * then shows its compact challenge; its token is obtained with `getToken()`.
   * @default 'always'
   */
  appearance?: 'always' | 'interaction-only'
  /** The Turnstile action the token is bound to (`interaction-only` only); the server compares it. */
  action?: string
  /**
   * `interaction-only` only: request a token in the background as soon as the widget has rendered (and again after every `reset()`), so that `getToken()` finds it ready.
   * @default false
   */
  prefetch?: boolean
}

function CaptchaDevFallback({
  onSuccess,
  label,
}: {
  onSuccess?: (token: string) => void
  label: string
}) {
  const mantineTheme = useMantineTheme()

  useEffect(() => {
    onSuccess?.('dev-noop-token')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    // lh is 19.5px (not text-xs's paired 16px): globals.css's `p { @apply leading-relaxed }`
    // base rule applies to this element's underlying <p> and measures 19.5px in the real
    // AuthSheet render — matched here for zero visual delta, not derived from text-xs.
    <Text size="xs" lh={mantineTheme.other.lineHeight.authNoteParagraph} c="dimmed" ta="center" my="sm" py="tight" role="note">
      {label}
    </Text>
  )
}

export const CaptchaWidget = forwardRef<CaptchaWidgetHandle, CaptchaWidgetProps>(
  ({ onSuccess, onError, onExpire, theme = 'auto', appearance = 'always', action, prefetch = false }, ref) => {
    const t = useTranslations('auth')
    const locale = useLocale()
    const widgetRef = useRef<TurnstileInstance>(null)
    // `interaction-only`: shown only between Cloudflare's before-interactive and after-interactive callbacks (the challenge needs the visitor).
    const [challengeShown, setChallengeShown] = useState(false)
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    const language: TurnstileLangCode = TURNSTILE_LANGUAGE_BY_LOCALE[locale] ?? 'auto'
    const onDemand = appearance === 'interaction-only'
    // `interaction-only` token state (R117): one request waiting for a token, at most one ready token, and whether a Cloudflare execution is running.
    const pendingRef = useRef<PendingTokenRequest | null>(null)
    const readyTokenRef = useRef<string | null>(null)
    const executingRef = useRef(false)

    const execute = () => {
      executingRef.current = true
      widgetRef.current?.execute()
    }
    const settlePending = (settle: (pending: PendingTokenRequest) => void): boolean => {
      const pending = pendingRef.current
      if (!pending) return false
      pendingRef.current = null
      clearTimeout(pending.timer)
      settle(pending)
      return true
    }
    const requestToken = (): Promise<string> => {
      if (pendingRef.current) return pendingRef.current.promise
      let resolve!: (token: string) => void
      let reject!: (error: Error) => void
      const promise = new Promise<string>((res, rej) => { resolve = res; reject = rej })
      const timer = setTimeout(() => {
        pendingRef.current = null
        // the execution may never answer; the next request starts a new one
        executingRef.current = false
        reject(new Error('Timeout'))
      }, CONTACT_TOKEN_TIMEOUT_MS)
      pendingRef.current = { promise, resolve, reject, timer }
      if (!executingRef.current) execute()
      return promise
    }

    useEffect(() => () => {
      const pending = pendingRef.current
      if (pending) clearTimeout(pending.timer)
    }, [])

    useImperativeHandle(ref, () => ({
      reset: () => {
        widgetRef.current?.reset()
        setChallengeShown(false)
        if (!onDemand) return
        readyTokenRef.current = null
        executingRef.current = false
        if (prefetch) execute()
      },
      getToken: async () => {
        if (!siteKey) return 'dev-noop-token'
        const widget = widgetRef.current
        if (!widget) throw new Error('The human check is not ready.')
        if (!onDemand) return widget.getResponsePromise()
        const ready = readyTokenRef.current
        readyTokenRef.current = null
        if (ready !== null && !widget.isExpired()) return ready
        return requestToken()
      },
    }))

    if (!siteKey) {
      if (onDemand) return null
      return (
        <CaptchaDevFallback
          onSuccess={onSuccess}
          label={t('captcha_not_configured')}
        />
      )
    }

    if (onDemand) {
      return (
        <Box display={challengeShown ? undefined : 'none'}>
          <Turnstile
            ref={widgetRef}
            siteKey={siteKey}
            onWidgetLoad={() => { if (prefetch) execute() }}
            onSuccess={(token) => {
              executingRef.current = false
              // a token nobody is waiting for is kept for the next request
              if (!settlePending((pending) => pending.resolve(token))) readyTokenRef.current = token
              onSuccess?.(token)
            }}
            onError={(code) => {
              setChallengeShown(false)
              executingRef.current = false
              settlePending((pending) => pending.reject(new Error(code)))
              Sentry.captureMessage('turnstile_error', { level: 'warning', tags: { turnstile_code: code, turnstile_action: action ?? 'none' } })
              onError?.()
            }}
            onExpire={() => { setChallengeShown(false); readyTokenRef.current = null; onExpire?.() }}
            onBeforeInteractive={() => setChallengeShown(true)}
            onAfterInteractive={() => setChallengeShown(false)}
            options={{ theme, size: 'compact', language, appearance: 'interaction-only', execution: 'execute', action }}
            aria-label={t('captcha_aria_label')}
            style={{ width: '100%', lineHeight: 0 }}
          />
        </Box>
      )
    }

    // Silent check (Task 923 R123, owner D82): the widget is set to Invisible mode in Cloudflare's dashboard, so it shows nothing. The `invisible` size is a 0x0 container, and an absolutely
    // positioned box around it adds no gap to the form's column.
    return (
      <Box pos="absolute">
        <Turnstile
          ref={widgetRef}
          siteKey={siteKey}
          onSuccess={onSuccess}
          onError={onError}
          onExpire={onExpire}
          options={{ theme, size: 'invisible', language }}
          aria-label={t('captcha_aria_label')}
        />
      </Box>
    )
  },
)
CaptchaWidget.displayName = 'CaptchaWidget'
