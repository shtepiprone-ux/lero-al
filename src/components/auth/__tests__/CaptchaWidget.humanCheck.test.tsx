/**
 * CaptchaWidget — the on-demand human check (Task 923 R113 (a), R86).
 *
 * `@marsidev/react-turnstile` is replaced by a double that records the props of its last render and exposes `execute`, `getResponsePromise`, `isExpired` and `reset`
 * through its ref, so every branch of the widget's own code runs for real and no Cloudflare script or network is involved; `@sentry/nextjs` is a mock:
 *   - `always` (the default) is the silent check of the sign-up and reset forms (R123, owner D82): size `invisible`, no `style`, no `appearance`, no `action`, no `execution`, in an absolutely positioned
 *     wrapper; `getToken` waits for the widget and never calls `execute`;
 *   - `interaction-only` renders a hidden box that shows only between Cloudflare's before- and after-interactive callbacks, with the compact challenge in execute mode.
 *     `getToken` hands out a ready token once, otherwise it waits for the token of the running execution (starting one only when none runs) and rejects after 30 s or at
 *     once on a Cloudflare error, which is sent to Sentry with its code; `prefetch` executes on widget load and after every `reset()`;
 *   - without a site key `always` keeps the development note and `interaction-only` renders nothing and never calls `onSuccess`, `getToken` resolves the development token.
 *
 * Command: npx vitest run src/components/auth/__tests__/CaptchaWidget.humanCheck.test.tsx
 */
import React, { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { theme } from '@/design-system/mantine/theme'
import { CaptchaWidget, type CaptchaWidgetHandle } from '../CaptchaWidget'

const turnstile = vi.hoisted(() => ({
  props: [] as Array<Record<string, unknown>>,
  instance: { execute: vi.fn(), getResponsePromise: vi.fn(), isExpired: vi.fn(), reset: vi.fn() },
}))
const sentry = vi.hoisted(() => ({ captureMessage: vi.fn() }))

vi.mock('@sentry/nextjs', () => ({ captureMessage: sentry.captureMessage }))

vi.mock('@marsidev/react-turnstile', async () => {
  const react = await import('react')
  const Double = react.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    turnstile.props.push(props)
    react.useImperativeHandle(ref, () => turnstile.instance)
    return <div data-testid="turnstile-double" />
  })
  Double.displayName = 'Turnstile'
  return { Turnstile: Double }
})

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8')) as Record<string, unknown>
const lastProps = () => turnstile.props[turnstile.props.length - 1]
const lastOptions = () => lastProps().options

function mount(props: React.ComponentProps<typeof CaptchaWidget>, handle?: React.RefObject<CaptchaWidgetHandle | null>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <CaptchaWidget ref={handle} {...props} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}
// the box around the widget, found from the double: Mantine puts its own <style> element in front of the component, so it is not the container's first child
const box = () => screen.getByTestId('turnstile-double').parentElement as HTMLElement

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'test-site-key')
  turnstile.props.length = 0
  turnstile.instance.execute.mockReset()
  turnstile.instance.getResponsePromise.mockReset()
  turnstile.instance.isExpired.mockReset().mockReturnValue(false)
  turnstile.instance.reset.mockReset()
  sentry.captureMessage.mockReset()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('appearance="always" (the default) is unchanged', () => {
  it('passes the invisible size and no appearance, action, execution or style, inside an absolutely positioned wrapper', () => {
    const { container } = mount({ onSuccess: vi.fn() })
    expect(lastOptions()).toEqual({ theme: 'auto', size: 'invisible', language: 'en' })
    expect(Object.keys(lastOptions() as object)).toEqual(['theme', 'size', 'language'])
    expect(lastProps().style).toBeUndefined()
    // the wrapper takes no room in the form's column (Task 923 R123, owner D82)
    expect(box()).not.toBe(container)
    expect(box()).toHaveStyle({ position: 'absolute' })
  })

  it('ignores `action`: today\'s render has none', () => {
    mount({ onSuccess: vi.fn(), action: 'contact_reveal' })
    expect(lastOptions()).toEqual({ theme: 'auto', size: 'invisible', language: 'en' })
  })

  it('getToken returns the widget\'s response promise and never calls execute', async () => {
    turnstile.instance.getResponsePromise.mockResolvedValue('tok-always')
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ onSuccess: vi.fn() }, handle)
    await expect(handle.current!.getToken()).resolves.toBe('tok-always')
    expect(turnstile.instance.execute).not.toHaveBeenCalled()
    expect(turnstile.instance.getResponsePromise).toHaveBeenCalledTimes(1)
  })

  it('reset resets the widget', () => {
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ onSuccess: vi.fn() }, handle)
    act(() => handle.current!.reset())
    expect(turnstile.instance.reset).toHaveBeenCalledTimes(1)
  })

  it('without a site key it shows the development note, calls onSuccess once with the development token and resolves it from getToken', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    const onSuccess = vi.fn()
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ onSuccess }, handle)
    expect(turnstile.props).toEqual([])
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('dev-noop-token')
    expect(screen.getByRole('note')).toBeInTheDocument()
    await expect(handle.current!.getToken()).resolves.toBe('dev-noop-token')
  })

  it('works without an onSuccess prop', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    expect(() => mount({})).not.toThrow()
  })
})

describe('appearance="interaction-only"', () => {
  it('renders the compact challenge in execute mode, bound to its action, inside a box that is hidden', () => {
    mount({ appearance: 'interaction-only', action: 'contact_reveal' })
    expect(lastOptions()).toEqual({ theme: 'auto', size: 'compact', language: 'en', appearance: 'interaction-only', execution: 'execute', action: 'contact_reveal' })
    expect(box()).toHaveStyle({ display: 'none' })
    expect(box().contains(screen.getByTestId('turnstile-double'))).toBe(true)
    expect(lastProps().style).toEqual({ width: '100%', lineHeight: 0 })
    expect(lastProps()['aria-label']).toBe((messages.auth as Record<string, string>).captcha_aria_label)
  })

  it('shows the box between the before- and after-interactive callbacks only', () => {
    mount({ appearance: 'interaction-only', action: 'contact_inquiry' })
    expect(box()).toHaveStyle({ display: 'none' })
    act(() => (lastProps().onBeforeInteractive as () => void)())
    expect(box()).not.toHaveStyle({ display: 'none' })
    act(() => (lastProps().onAfterInteractive as () => void)())
    expect(box()).toHaveStyle({ display: 'none' })
  })

  it('hides the box on an error or an expiry and still tells the consumer', () => {
    const onError = vi.fn()
    const onExpire = vi.fn()
    mount({ appearance: 'interaction-only', action: 'contact_reveal', onError, onExpire })
    act(() => (lastProps().onBeforeInteractive as () => void)())
    act(() => (lastProps().onError as () => void)())
    expect(box()).toHaveStyle({ display: 'none' })
    expect(onError).toHaveBeenCalledTimes(1)
    act(() => (lastProps().onBeforeInteractive as () => void)())
    act(() => (lastProps().onExpire as () => void)())
    expect(box()).toHaveStyle({ display: 'none' })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('without prefetch nothing executes on widget load; getToken starts one execution and resolves the token Cloudflare answers', async () => {
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ appearance: 'interaction-only', action: 'contact_reveal' }, handle)
    act(() => (lastProps().onWidgetLoad as (id: string) => void)('widget-1'))
    expect(turnstile.instance.execute).not.toHaveBeenCalled()
    const token = handle.current!.getToken()
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(1)
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-1'))
    await expect(token).resolves.toBe('tok-1')
    // the library's own response promise is no longer used
    expect(turnstile.instance.getResponsePromise).not.toHaveBeenCalled()
  })

  it('with prefetch the widget executes as soon as it has rendered', () => {
    mount({ appearance: 'interaction-only', action: 'contact_reveal', prefetch: true })
    expect(turnstile.instance.execute).not.toHaveBeenCalled()
    act(() => (lastProps().onWidgetLoad as (id: string) => void)('widget-1'))
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(1)
  })

  it('a token that arrived before the call is returned without another execute, and once', async () => {
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ appearance: 'interaction-only', action: 'contact_reveal', prefetch: true }, handle)
    act(() => (lastProps().onWidgetLoad as (id: string) => void)('widget-1'))
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-ready'))
    await expect(handle.current!.getToken()).resolves.toBe('tok-ready')
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(1)
  })

  it('a second getToken does not reuse a token that was handed out: it starts a new execution', async () => {
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ appearance: 'interaction-only', action: 'contact_reveal', prefetch: true }, handle)
    act(() => (lastProps().onWidgetLoad as (id: string) => void)('widget-1'))
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-ready'))
    await expect(handle.current!.getToken()).resolves.toBe('tok-ready')
    const second = handle.current!.getToken()
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(2)
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-fresh'))
    await expect(second).resolves.toBe('tok-fresh')
  })

  it('a ready token the widget reports as expired is not handed out, and onExpire clears the ready token', async () => {
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ appearance: 'interaction-only', action: 'contact_reveal', prefetch: true }, handle)
    act(() => (lastProps().onWidgetLoad as (id: string) => void)('widget-1'))
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-old'))
    turnstile.instance.isExpired.mockReturnValue(true)
    const afterExpiredFlag = handle.current!.getToken()
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(2)
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-new'))
    await expect(afterExpiredFlag).resolves.toBe('tok-new')

    // onExpire: a token that is ready when Cloudflare reports its expiry is dropped even though isExpired is false again
    turnstile.instance.isExpired.mockReturnValue(false)
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-kept'))
    act(() => (lastProps().onExpire as () => void)())
    const afterOnExpire = handle.current!.getToken()
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(3)
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-after'))
    await expect(afterOnExpire).resolves.toBe('tok-after')
  })

  it('getToken while a background execution is running waits for it and does not execute again', async () => {
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ appearance: 'interaction-only', action: 'contact_reveal', prefetch: true }, handle)
    act(() => (lastProps().onWidgetLoad as (id: string) => void)('widget-1'))
    const token = handle.current!.getToken()
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(1)
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-bg'))
    await expect(token).resolves.toBe('tok-bg')
  })

  it('a request that receives no token rejects after 30 seconds, and the next request starts a new execution', async () => {
    vi.useFakeTimers()
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ appearance: 'interaction-only', action: 'contact_reveal' }, handle)
    const first = handle.current!.getToken()
    const rejection = expect(first).rejects.toThrow('Timeout')
    await vi.advanceTimersByTimeAsync(29_999)
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    await rejection
    void handle.current!.getToken().catch(() => undefined)
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(2)
  })

  it('an error of Cloudflare rejects the pending request at once with its code, sends the code to Sentry and tells the consumer', async () => {
    vi.useFakeTimers()
    const onError = vi.fn()
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ appearance: 'interaction-only', action: 'contact_reveal', onError }, handle)
    const token = handle.current!.getToken()
    const rejection = expect(token).rejects.toThrow('300030')
    // no timer has advanced
    act(() => (lastProps().onError as (code: string) => void)('300030'))
    await rejection
    expect(sentry.captureMessage).toHaveBeenCalledTimes(1)
    expect(sentry.captureMessage).toHaveBeenCalledWith('turnstile_error', { level: 'warning', tags: { turnstile_code: '300030', turnstile_action: 'contact_reveal' } })
    expect(onError).toHaveBeenCalledTimes(1)
    // after an error nothing is running: the next request executes again
    void handle.current!.getToken().catch(() => undefined)
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(2)
  })

  it('an error without an action is tagged `none`', () => {
    mount({ appearance: 'interaction-only' })
    act(() => (lastProps().onError as (code: string) => void)('110200'))
    expect(sentry.captureMessage).toHaveBeenCalledWith('turnstile_error', { level: 'warning', tags: { turnstile_code: '110200', turnstile_action: 'none' } })
  })

  it('reset resets the widget and hides the box; without prefetch it does not execute', () => {
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ appearance: 'interaction-only', action: 'contact_reveal' }, handle)
    act(() => (lastProps().onBeforeInteractive as () => void)())
    expect(box()).not.toHaveStyle({ display: 'none' })
    act(() => handle.current!.reset())
    expect(turnstile.instance.reset).toHaveBeenCalledTimes(1)
    expect(box()).toHaveStyle({ display: 'none' })
    expect(turnstile.instance.execute).not.toHaveBeenCalled()
  })

  it('with prefetch, reset resets the widget and executes again, in that order, and drops the ready token', async () => {
    const order: string[] = []
    turnstile.instance.reset.mockImplementation(() => { order.push('reset') })
    turnstile.instance.execute.mockImplementation(() => { order.push('execute') })
    const handle = createRef<CaptchaWidgetHandle>()
    mount({ appearance: 'interaction-only', action: 'contact_reveal', prefetch: true }, handle)
    act(() => (lastProps().onWidgetLoad as (id: string) => void)('widget-1'))
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-ready'))
    act(() => handle.current!.reset())
    expect(order).toEqual(['execute', 'reset', 'execute'])
    // the token before the reset is gone: the call waits for the new execution
    const token = handle.current!.getToken()
    expect(turnstile.instance.execute).toHaveBeenCalledTimes(2)
    act(() => (lastProps().onSuccess as (token: string) => void)('tok-after-reset'))
    await expect(token).resolves.toBe('tok-after-reset')
  })

  it('passes onSuccess through to the widget', () => {
    const onSuccess = vi.fn()
    mount({ appearance: 'interaction-only', action: 'contact_reveal', onSuccess })
    ;(lastProps().onSuccess as (token: string) => void)('tok-x')
    expect(onSuccess).toHaveBeenCalledWith('tok-x')
  })

  it('without a site key it renders nothing, never calls onSuccess, resolves the development token every time and reset does nothing', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    const onSuccess = vi.fn()
    const handle = createRef<CaptchaWidgetHandle>()
    const { container } = mount({ appearance: 'interaction-only', action: 'contact_reveal', onSuccess }, handle)
    expect(container.querySelectorAll(':scope > :not(style)')).toHaveLength(0)
    expect(screen.queryByTestId('turnstile-double')).toBeNull()
    expect(turnstile.props).toEqual([])
    expect(onSuccess).not.toHaveBeenCalled()
    await expect(handle.current!.getToken()).resolves.toBe('dev-noop-token')
    await expect(handle.current!.getToken()).resolves.toBe('dev-noop-token')
    expect(() => act(() => handle.current!.reset())).not.toThrow()
    expect(turnstile.instance.reset).not.toHaveBeenCalled()
    expect(turnstile.instance.execute).not.toHaveBeenCalled()
  })
})
