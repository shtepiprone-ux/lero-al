/**
 * Task 948 AC4: the pending-state alert icon of the cabinet e-mail change View takes its size from `theme.other.iconSize.roomy`, not from a raw number.
 * Two renders: the project theme (roomy = 20, the size the icon always had) and the same theme with `roomy` changed to a value no literal in the View can equal;
 * the icon follows the theme, so the size is read from the token.
 */
import { cleanup, render, screen } from '@testing-library/react'
import { MantineProvider, mergeThemeOverrides } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../messages/en.json'
import { CabinetEmailChangeSectionView } from '../CabinetEmailChangeSectionView'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const PENDING = 'new@example.com'

function renderPending(appTheme: typeof theme) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={appTheme}>
        <CabinetEmailChangeSectionView
          currentEmail="person@example.com"
          pendingEmail={PENDING}
          newEmail=""
          password=""
          passwordVisible={false}
          method="password"
          sending={false}
          submitDisabled
          error={null}
          googleControl={null}
          onNewEmailChange={vi.fn()}
          onPasswordChange={vi.fn()}
          onPasswordVisibilityChange={vi.fn()}
          onSubmit={vi.fn()}
          onResend={vi.fn()}
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

function alertIcon(): SVGElement {
  const alert = screen.getByText(messages.cabinet.email_change_pending_title).closest('.mantine-Alert-root')
  const svg = alert?.querySelector('.mantine-Alert-icon svg')
  if (!svg) throw new Error('the pending alert renders no icon')
  return svg as SVGElement
}

describe('CabinetEmailChangeSectionView pending alert icon (Task 948 AC4)', () => {
  it('is rendered at theme.other.iconSize.roomy (20)', () => {
    expect(theme.other!.iconSize!.roomy).toBe(20)
    renderPending(theme)
    const svg = alertIcon()
    expect(svg.getAttribute('width')).toBe(String(theme.other!.iconSize!.roomy))
    expect(svg.getAttribute('height')).toBe(String(theme.other!.iconSize!.roomy))
  })

  it('follows the theme token, so no raw number sets the size', () => {
    const changed = mergeThemeOverrides(theme, { other: { iconSize: { roomy: 23 } } }) as typeof theme
    renderPending(changed)
    const svg = alertIcon()
    expect(svg.getAttribute('width')).toBe('23')
    expect(svg.getAttribute('height')).toBe('23')
  })
})
